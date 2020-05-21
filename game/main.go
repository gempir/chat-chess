package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
	log "github.com/sirupsen/logrus"
)

var clients = make(map[*websocket.Conn]bool) // connected clients
var upgrader = websocket.Upgrader{}

func main() {
	log.SetLevel(log.DebugLevel)
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true
	}

	http.HandleFunc("/api/ws", handleConnections)

	log.Info("[api] listening on port :8060")
	err := http.ListenAndServe(":8060", nil)
	if err != nil {
		log.Fatal("[api] listenAndServe: ", err)
	}
}

type gameMessage struct {
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	clients[ws] = true
	// Make sure we close the connection when the function returns
	defer ws.Close()
	var game *Game

	for {
		var msg gameMessage
		// Read in a new message as JSON and map it to a Message object
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Infof("[api] error: %v", err)
			delete(clients, ws)
			break
		}
		if msg.Type == "start" {
			game = startGame(fmt.Sprintf("%v", msg.Value), ws)
		}
		if game.websocketConnection != nil {
			go game.handleWebsocketMessage(msg)
		}
	}
}
