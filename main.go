package main

import (
	"github.com/labstack/echo"
	"golang.org/x/net/websocket"
	"fmt"
	"github.com/labstack/echo/middleware"
	"log"
)

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Static("/", "public")
	e.File("/", "views/index.html")
	e.GET("/ws", webSocketHandler)
	e.GET("/new/:channel", startGame)

	e.Logger.Fatal(e.Start(":1323"))
}

func webSocketHandler(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()
		for {
			// Write
			err := websocket.Message.Send(ws, "Hello, Client!")
			if err != nil {
				log.Fatal(err)
			}

			// Read
			msg := ""
			err = websocket.Message.Receive(ws, &msg)
			if err != nil {
				log.Fatal(err)
			}
			fmt.Printf("%s\n", msg)
		}
	}).ServeHTTP(c.Response(), c.Request())
	return nil
}