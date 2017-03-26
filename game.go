package main

import (
	"fmt"
	"github.com/gempir/go-twitch-irc"
	"github.com/labstack/echo"
	"github.com/notnil/chess"
	"github.com/pkg/errors"
	"github.com/rs/xid"
	"net/http"
)

var (
	Games []*Game
)

type Game struct {
	Id           string `json:"id"`
	Channel      string `json:"channel"`
	messages     chan string
	twitchClient *twitch.Client
	chessGame    *chess.Game
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
	game.Id = xid.New().String()
	game.Channel = c.Param("channel")
	game.twitchClient = twitch.NewClient("justinfan123123", "oauth:123123")
	game.chessGame = chess.NewGame()

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

	fmt.Println(moveRequest.From + moveRequest.To)

	for _, move := range moves {
		if move.String() == moveRequest.From + moveRequest.To {
			game.chessGame.Move(move)
			return c.JSON(http.StatusOK, MoveResponse{})
		}
	}

	return c.JSON(http.StatusBadRequest, ErrorJson{
		Error: "Not a valid move",
	})
}

func (g *Game) newChatMessage(message twitch.Message) {
	fmt.Println(message.Text)
}

func getGame(gameId string) (*Game, error) {
	for _, game := range Games {
		if game.Id == gameId {
			return game, nil
		}
	}
	return new(Game), errors.New("Invalid game id")
}
