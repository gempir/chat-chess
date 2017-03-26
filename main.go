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
	e.POST("/new/:channel", startGame)
	e.POST("/move/:gameid", handleMove)

	e.Logger.Fatal(e.Start(":1323"))
}