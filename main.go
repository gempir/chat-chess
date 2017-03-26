package main

import (
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	e := echo.New()
	e.Use(middleware.Recover())

	e.Static("/", "public")
	e.File("/", "views/index.html")
	e.PUT("/game", startGame)
	e.PUT("/move/:gameid", handleMove)
	e.GET("/move/:gameid", handleMoveRequest)
	e.GET("/game/:gameid", handleStatusRequest)

	e.Logger.Fatal(e.Start(":1323"))
}