package main

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gempir/go-twitch-irc"
	"github.com/labstack/echo"
	"github.com/notnil/chess"
	"github.com/pkg/errors"
	"github.com/rs/xid"
	"golang.org/x/net/websocket"
)

var (
	Games     []*Game
	MoveRegex = regexp.MustCompile(`(?i)^([a-h])([1-8])-([a-h])([1-8])`)
)

type Game struct {
	Id                  string `json:"id"`
	Channel             string `json:"channel"`
	GameFen             string `json:"game_fen"`
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

func startGame(c echo.Context) error {
	game := new(Game)
	c.Bind(game)
	game.Id = xid.New().String()
	game.twitchClient = twitch.NewClient(botusername, botoauth)
	game.chessGame = chess.NewGame()
	game.GameFen = game.chessGame.FEN()
	game.moves = make(map[string]int)

	fmt.Println("Starting New Game Id: " + game.Id + ", Channel: " + game.Channel)

	go game.twitchClient.OnNewMessage(game.newChatMessage)
	go game.twitchClient.Connect()
	go game.joinChannel()

	Games = append(Games, game)

	return c.JSON(http.StatusOK, game)
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

			fmt.Println("Player making move " + from + "-" + to)
			sayText := fmt.Sprintf("/me Twitch-Chess: Player made move %s-%s. Chat now has 30 Seconds to vote! Format: b7-b5", from, to)
			fmt.Printf("[SAY][%s] %s\r\n", g.Channel, sayText)

			g.twitchClient.Say(g.Channel, sayText)
			g.chessGame.Move(move)
			g.GameFen = g.chessGame.FEN()
			// reset voters
			g.moves = make(map[string]int)
			g.voters = g.voters[:0]
		}
	}
}

func (g *Game) sendChatMove() {

	mostVotedMove := g.getMostVotedValidMove()

	if mostVotedMove == "" {
		moves := g.chessGame.ValidMoves()
		g.chessGame.Move(moves[0])
		g.GameFen = g.chessGame.FEN()
		g.moves = make(map[string]int)
		fmt.Println("Chat making AUTO move " + moves[0].S1().String() + "-" + moves[0].S2().String())
		g.wsSend("move=" + moves[0].S1().String() + "-" + moves[0].S2().String())
		return
	}

	resultMove := strings.Split(mostVotedMove, "-")

	moves := g.chessGame.ValidMoves()

	for _, move := range moves {
		if move.String() == resultMove[0]+resultMove[1] {
			fmt.Println("Chat making move " + resultMove[0] + "-" + resultMove[1])
			g.chessGame.Move(move)
			g.GameFen = g.chessGame.FEN()
			g.moves = make(map[string]int)
			g.wsSend("move=" + mostVotedMove)
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

func (g *Game) newChatMessage(channel string, user twitch.User, message twitch.Message) {
	if channel == user.Username && message.Text == "chess" {
		g.wsSend("valid")
	}
	if g.hasVoted(user.Username) {
		return
	}
	if regResult := MoveRegex.FindAllString(message.Text, 1); len(regResult) > 0 {
		g.voters = append(g.voters, user.Username)
		if _, ok := g.moves[regResult[0]]; ok {
			g.moves[regResult[0]] += 1
		} else {
			g.moves[regResult[0]] = 1
		}

	}
}

func getGame(gameId string) (*Game, error) {
	for _, game := range Games {
		if game.Id == gameId {
			return game, nil
		}
	}
	return new(Game), errors.New("Invalid game id")
}

func handleWebsocketConnection(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()
		var game *Game
		for {
			// Read
			msg := ""
			err := websocket.Message.Receive(ws, &msg)
			if err != nil {
				fmt.Println("WS conn closed" + err.Error())
				return
			}
			if strings.HasPrefix(msg, "gameId=") {
				splitStr := strings.Split(msg, "=")
				game, err = getGame(splitStr[1])
				if err != nil {
					fmt.Println(err.Error())
					continue
				}
				fmt.Printf("WS Connection registered on game %s", game.Id)
				game.websocketConnection = ws
			}
			if game.websocketConnection != nil {
				go game.handleWebsocketMessage(msg)
			}

		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}

func (g *Game) handleWebsocketMessage(msg string) {
	if strings.HasPrefix(msg, "move=") {
		moveStr := strings.Replace(msg, "move=", "", 1)
		positions := strings.Split(moveStr, "-")
		g.makeMove(positions[0], positions[1])
		time.AfterFunc(30*time.Second, g.sendChatMove)
	}
}

func (g *Game) wsSend(msg string) {
	if g.websocketConnection == nil {
		return
	}
	fmt.Println("WS SEND " + msg)
	websocket.Message.Send(g.websocketConnection, msg)
}
