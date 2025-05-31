#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <FirebaseClient.h>
#include <WiFiClientSecure.h>
#include <WiFi.h>
#include "ExampleFunctions.h"
#include <configure.h>

#define LED_PIN 2  // GPIO pin for LED

// Define Firebase Data object
FirebaseData firebaseData;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  
  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // Connect to Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  // Set up streaming for LED status changes
  if (!Firebase.beginStream(firebaseData, "/TriggerNow")) {
    Serial.println("Could not begin stream");
    Serial.println("REASON: " + firebaseData.errorReason());
  }
}

void loop() {
  if (Firebase.available(firebaseData)) {
    if (firebaseData.dataType() == "boolean") {
      bool ledState = firebaseData.boolData();
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      Serial.println("LED state changed to: " + String(ledState ? "ON" : "OFF"));
    }
  }
  delay(100);
}
