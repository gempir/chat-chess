package main

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/gempir/go-twitch-irc/v2"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
	"github.com/pkg/errors"
	"github.com/rs/xid"
	log "github.com/sirupsen/logrus"
)

var (
	games     []*Game
	moveRegex = regexp.MustCompile(`(?i)^([a-h])([1-8])-([a-h])([1-8])`)
)

// Game contains entire game with connected channel
type Game struct {
	ID                  string
	Channel             string
	GameFen             string
	messages            chan string
	twitchClient        *twitch.Client
	chessGame           *chess.Game
	websocketConnection *websocket.Conn
	moves               map[string]int
	voters              []string
}

type MoveResponse struct {
}

type MoveRequest struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type ErrorJson struct {
	Error string `json:"error_message"`
}

func startGame(channel string, ws *websocket.Conn) *Game {
	game := new(Game)
	game.websocketConnection = ws
	game.Channel = channel
	game.ID = xid.New().String()
	game.twitchClient = twitch.NewAnonymousClient()
	game.chessGame = chess.NewGame()
	game.GameFen = game.chessGame.FEN()
	game.moves = make(map[string]int)

	game.logInfo("Starting New Game")

	go game.twitchClient.OnPrivateMessage(game.newChatMessage)
	go game.twitchClient.Connect()
	go game.joinChannel()
	go game.startVotedBroadcast()

	game.sendGameUpdate()
	games = append(games, game)

	return game
}

func (g *Game) startVotedBroadcast() {
	ticker := time.NewTicker(1 * time.Second)

	for range ticker.C {
		vts := []vote{}

		for move, count := range g.moves {
			vts = append(vts, vote{move, count})
		}

		result := votes{vts}
		result.sort()

		g.sendVotes(result)
	}
}

func (g *Game) sendGameUpdate() {
	g.wsSend(&gameMessage{"game", g})
}

type vote struct {
	Move  string
	Votes int
}

type votes struct {
	Votes []vote
}

func (v *votes) sort() {
	vts := v.Votes
	sort.SliceStable(vts, func(i, j int) bool {
		return vts[i].Votes > vts[j].Votes
	})

	v.Votes = vts
}

func (g *Game) sendVotes(vts votes) {
	if len(vts.Votes) > 0 {
		g.wsSend(&gameMessage{"votes", vts})
	}
}

func (g *Game) sendClearVotes() {
	g.wsSend(&gameMessage{"votes", votes{[]vote{}}})
}

type action struct {
	ID      string
	Time    int64
	Message string
}

func (g *Game) sendAction(message string) {
	g.wsSend(&gameMessage{"action", action{xid.New().String(), time.Now().Unix(), message}})
}

func (g *Game) joinChannel() {
	g.twitchClient.Join(g.Channel)
}

func (g *Game) hasVoted(username string) bool {
	for _, user := range g.voters {
		if user == username {
			return true
		}
	}
	return false
}

func (g *Game) makeMove(from, to string) {
	moves := g.chessGame.ValidMoves()

	for _, move := range moves {
		if move.String() == from+to {

			g.logInfo("Player made move " + from + "-" + to)
			g.sendAction("[Player] " + from + "-" + to)
			g.chessGame.Move(move)
			g.GameFen = g.chessGame.FEN()
			// reset voters
			g.moves = make(map[string]int)
			g.voters = g.voters[:0]
		}
	}
}

func (g *Game) logInfo(msg string) {
	log.Infof("[%s][%s] %s", g.Channel, g.ID, msg)
}

func (g *Game) logError(msg string) {
	log.Errorf("[%s][%s] %s", g.Channel, g.ID, msg)
}

func (g *Game) sendChatMove() {

	mostVotedMove := g.getMostVotedValidMove()

	if mostVotedMove == "" {
		moves := g.chessGame.ValidMoves()
		g.chessGame.Move(moves[0])
		g.GameFen = g.chessGame.FEN()
		g.moves = make(map[string]int)
		g.logInfo("Chat making AUTO move " + moves[0].S1().String() + "-" + moves[0].S2().String())
		g.sendAction("[Chat:Auto] " + moves[0].S1().String() + "-" + moves[0].S2().String())
		g.sendGameUpdate()
		g.sendClearVotes()
		return
	}

	resultMove := strings.Split(mostVotedMove, "-")

	moves := g.chessGame.ValidMoves()

	for _, move := range moves {
		if move.String() == resultMove[0]+resultMove[1] {
			g.logInfo("Chat making move " + resultMove[0] + "-" + resultMove[1])
			g.chessGame.Move(move)
			g.GameFen = g.chessGame.FEN()
			g.moves = make(map[string]int)
			g.sendGameUpdate()
			g.sendAction("[Chat] " + resultMove[0] + "-" + resultMove[1])
			g.sendClearVotes()
			return
		}
	}
}

// empty string is when there is no valid move
func (g *Game) getMostVotedValidMove() string {

	mostVoted := ""
	mostVotes := 0
	for move, count := range g.moves {
		if count > mostVotes {
			mostVoted = move
			mostVotes = count
			delete(g.moves, move)
		}
	}

	if mostVoted == "" {
		return mostVoted
	}

	moveSplit := strings.Split(mostVoted, "-")

	if g.isValidMove(moveSplit[0], moveSplit[1]) {
		return mostVoted
	}

	return g.getMostVotedValidMove()
}

func (g *Game) isValidMove(from, to string) bool {
	for _, move := range g.chessGame.ValidMoves() {
		if move.String() == from+to {
			return true
		}
	}
	return false
}

func (g *Game) newChatMessage(message twitch.PrivateMessage) {
	if g.hasVoted(message.User.Name) {
		return
	}
	if regResult := moveRegex.FindAllString(message.Message, 1); len(regResult) > 0 {
		g.voters = append(g.voters, message.User.Name)
		if _, ok := g.moves[regResult[0]]; ok {
			g.moves[regResult[0]]++
		} else {
			g.moves[regResult[0]] = 1
		}

	}
}

func getGame(gameID string) (*Game, error) {
	for _, game := range games {
		if game.ID == gameID {
			return game, nil
		}
	}
	return new(Game), errors.New("Invalid game id")
}

func (g *Game) handleWebsocketMessage(msg gameMessage) {
	if msg.Type == "move" {
		positions := strings.Split(fmt.Sprintf("%v", msg.Value), "-")
		g.makeMove(positions[0], positions[1])
		time.AfterFunc(30*time.Second, g.sendChatMove)
	}
}

func (g *Game) wsSend(msg interface{}) {
	if g.websocketConnection == nil {
		return
	}

	// g.logInfo(fmt.Sprintf("WS SEND %v", msg))
	g.websocketConnection.WriteJSON(msg)
}
