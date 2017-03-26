package main

import (
	"fmt"
	"github.com/gempir/go-twitch-irc"
	"github.com/labstack/echo"
	"github.com/notnil/chess"
	"github.com/pkg/errors"
	"github.com/rs/xid"
	"net/http"
	"regexp"
	"strings"
)

var (
	Games []*Game
	MoveRegex = regexp.MustCompile(`(?i)^([a-h])([1-8])-([a-h])([1-8])`)
)

type Game struct {
	Id           string `json:"id"`
	Channel      string `json:"channel"`
	GameFen		 string `json:"game_fen"`
	messages     chan string
	twitchClient *twitch.Client
	chessGame    *chess.Game
	moves 		 []string
}

type MoveResponse struct {

}

type MoveRequest struct {
	From string `json:"from"`
	To string `json:"to"`
}


type ErrorJson struct {
	Error string `json:"error_message"`
}

func startGame(c echo.Context) error {
	game := new(Game)
	c.Bind(game)
	game.Id = xid.New().String()
	game.twitchClient = twitch.NewClient("justinfan123123", "oauth:123123")
	game.chessGame = chess.NewGame()
	game.GameFen = game.chessGame.FEN()

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

func handleStatusRequest(c echo.Context) error {
	game, err := getGame(c.Param("gameid"))
	if err != nil {
		fmt.Println(err.Error())
		return c.JSON(http.StatusNotFound, ErrorJson{
			Error: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, game)
}

func handleMove(c echo.Context) error {
	moveRequest := new(MoveRequest)
	c.Bind(moveRequest)

	game, err := getGame(c.Param("gameid"))
	if err != nil {
		fmt.Println(err.Error())
		return c.JSON(http.StatusNotFound, ErrorJson{
			Error: err.Error(),
		})
	}

	moves := game.chessGame.ValidMoves()

	for _, move := range moves {
		if move.String() == moveRequest.From + moveRequest.To {
			game.chessGame.Move(move)
			game.GameFen = game.chessGame.FEN()
			game.moves = game.moves[:0]
			return c.JSON(http.StatusOK, MoveResponse{})
		}
	}

	return c.JSON(http.StatusBadRequest, ErrorJson{
		Error: "Not a valid move",
	})
}

func handleMoveRequest(c echo.Context) error {
	game, err := getGame(c.Param("gameid"))
	if err != nil {
		fmt.Println(err.Error())
		return c.JSON(http.StatusNotFound, ErrorJson{
			Error: err.Error(),
		})
	}

	from, to := game.getChatMove()
	return c.JSON(http.StatusOK, MoveRequest{From: from, To: to})
}
func (g *Game) getChatMove() (string, string) {

	movesMap := make(map[string]int)

	for _, move := range g.moves {
		if val, ok := movesMap[move]; ok {
			movesMap[move] = val + 1
		} else {
			movesMap[move] = 1
		}
	}

	mostVotedMove := ""
	mostVotes := 0
	for move, count := range movesMap {
		if count > mostVotes {
			mostVotedMove = move
			mostVotes = count
			continue
		}
	}

	resultMove := strings.Split(mostVotedMove, "-")

	return resultMove[0], resultMove[1]
}

func (g *Game) newChatMessage(message twitch.Message) {
	if regResult := MoveRegex.FindAllString(message.Text, 1); len(regResult) > 0 {
		g.moves = append(g.moves, regResult[0])
		return
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
