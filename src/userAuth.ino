
#define ENABLE_USER_AUTH

#include <FirebaseClient.h>
#include <WiFiClientSecure.h>
#include <WiFi.h>
#include <ExampleFunctions.h> 

#define WIFI_SSID "WIFI_AP"
#define WIFI_PASSWORD "WIFI_PASSWORD"

#define API_KEY "Web_API_KEY"
#define DATABASE_URL "DATABASE_URL"
#define USER_EMAIL "USER_EMAIL"
#define USER_PASSWORD "USER_PASSWORD"

bool verifyUser(const String &apiKey, const String &email, const String &password);

UserAuth user_auth(API_KEY, USER_EMAIL, USER_PASSWORD, 3000 /* expire period in seconds (<3600) */);

FirebaseApp app;

WiFiClientSecure ssl_client;

using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);
AsyncResult dbResult;
RealtimeDatabase Database;

bool taskComplete = false;
int value = 10;

void setup(){
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)    {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // Configure SSL client
  ssl_client.setInsecure();
  #if defined(ESP32)
    ssl_client.setConnectionTimeout(1000);
    ssl_client.setHandshakeTimeout(5);
  #elif defined(ESP8266)
    ssl_client.setTimeout(1000); // Set connection timeout
    ssl_client.setBufferSizes(4096, 1024); // Set buffer sizes
  #endif

  // Initialize Firebase
  initializeApp(aClient, app, getAuth(user_auth), processData, "🔐 authTask");
  app.getApp<RealtimeDatabase>(Database);
  Database.url(DATABASE_URL);
}

void loop(){
  // Maintain authentication and async tasks
  app.loop();

  // Check if authentication is ready
  if (app.ready() && !taskComplete){
    taskComplete = true;
    // Send an int to the database
    Database.set<int>(aClient, "/users/distributors/settings/quantity", value, processData, "RTDB_Send_int");
  }
}

void processData(AsyncResult &aResult){
  if (!aResult.isResult())
    return;

  if (aResult.isEvent())
    Firebase.printf("Event task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.eventLog().message().c_str(), aResult.eventLog().code());

  if (aResult.isDebug())
    Firebase.printf("Debug task: %s, msg: %s\n", aResult.uid().c_str(), aResult.debug().c_str());

  if (aResult.isError())
    Firebase.printf("Error task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.error().message().c_str(), aResult.error().code());

  if (aResult.available())
    Firebase.printf("task: %s, payload: %s\n", aResult.uid().c_str(), aResult.c_str());
}
