#include <WiFi.h>
#include <ArduinoWebsockets.h>

#define DISTRIBUTOR_ID "distrib124"

using namespace websockets;

const char* ssid = "wirus mobile";
const char* password = "1243..987@&";
const char* websocket_server_host = "192.168.215.105"; // Adresse IP du serveur
const uint16_t websocket_server_port = 3000;         // Port du serveur
const char* websocket_path = "/";                  // Chemin du WebSocket


bool shouldReconnect = false;
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000; // 5 secondes

WebsocketsClient client;

void onMessageCallback(WebsocketsMessage message) {
  Serial.print("Message reçu : ");
  Serial.println(message.data());
}


void connectToWebSocketServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi non connecté. Impossible de se connecter au serveur WebSocket.");
    return;
  }

  String websocket_server_url = "ws://" + String(websocket_server_host) + ":" + String(websocket_server_port) + String(websocket_path) + "?distributorId=" + DISTRIBUTOR_ID;

  if (client.connect(websocket_server_url)) {
    Serial.println("Connecté au serveur WebSocket");
    client.send("Bonjour depuis l'ESP32 !");
  } else {
    Serial.println("Échec de la connexion au serveur WebSocket");
    shouldReconnect = true;
    lastReconnectAttempt = millis();
  }
}


void onEventsCallback(WebsocketsEvent event, String data) {
  if (event == WebsocketsEvent::ConnectionOpened) {
    Serial.println("Connexion WebSocket ouverte");
  } else if (event == WebsocketsEvent::ConnectionClosed) {
    Serial.println("Connexion WebSocket fermée");
    shouldReconnect = true;
    lastReconnectAttempt = millis();
  } else if (event == WebsocketsEvent::GotPing) {
    Serial.println("Ping reçu");
  } else if (event == WebsocketsEvent::GotPong) {
    Serial.println("Pong reçu");
  }
}


void websocketInitialSetup() {
  // Configuration des callbacks
  client.onMessage(onMessageCallback);
  client.onEvent(onEventsCallback);

  connectToWebSocketServer();
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  Serial.print("Connexion au WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnecté au WiFi");

  websocketInitialSetup();
}
void loop() {
  client.poll();

  if (shouldReconnect && (millis() - lastReconnectAttempt >= reconnectInterval)) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Tentative de reconnexion au serveur WebSocket...");
      connectToWebSocketServer();
      shouldReconnect = false;
    } else {
      Serial.println("Wi-Fi non connecté. Nouvelle tentative dans 5 secondes.");
      lastReconnectAttempt = millis();
    }
  }
}
