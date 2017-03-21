package main

import (
	"github.com/labstack/echo"
	"github.com/rs/xid"
	"net/http"
)

type Game struct {
	Id       string `json:"id"`
	Channel  string `json:"channel"`
	messages chan string
}

func startGame(c echo.Context) error {
	game := new(Game)
	game.Id = xid.New().String()
	game.Channel = c.Param("channel")

	go joinChannel(game)

	return c.JSON(http.StatusOK, game)
}

func startWebSocketServer() {

}


func joinChannel(game *Game) {
	// join and stuff
}
