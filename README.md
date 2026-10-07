# mqtt-broker

A proof of concept MQTT broker for a small IoT telemetry pipeline. It accepts MQTT connections, checks a username and password, and passes messages on to subscribers. This is not production code.

The broker is the first of four services. Two of the others are in their own repositories, and the fourth is a local server that feeds demo data.

```
MQTT client  -->  mqtt-broker  -->  mqtt-listener  -->  MongoDB + InfluxDB  -->  mqtt-sensor-dashboard
```

- [mqtt-listener](https://github.com/jar-toiv/mqtt-listener) subscribes to the broker and stores the readings.
- [mqtt-sensor-dashboard](https://github.com/jar-toiv/mqtt-sensor-dashboard) shows the stored readings in the browser.

The demo data is Apator water meter readings, captured as JSON through a Teltonika gateway. I publish them to the broker with MQTT.fx or using a 4th server that is local. No live device is connected.

## Status

- Development mode works locally. A client with the wrong password is rejected, and a publish and subscribe round trip has been confirmed with MQTT.fx.
- Production mode (TLS) is not deployed at the moment. My current connection is 4G behind double NAT, so inbound ports cannot be opened and the Let's Encrypt HTTP-01 challenge cannot complete.
- There are no automated tests.

## Features

- MQTT broker built on [Aedes](https://github.com/moscajs/aedes).
- MQTT clients sign in with one shared username and password.
- Development mode uses plain TCP. Production mode wraps MQTT in TLS with a Let's Encrypt certificate fetched by greenlock-express.
- One HTTP status endpoint built with Express, behind HTTP Basic Auth.
- Required environment variables are checked at start-up. A missing variable stops the process with an error that names it.
- Logging to files with Winston.

## Project structure

```
src/
├── server.js                # entry point, starts HTTP and MQTT
├── app.js                   # Express app with helmet, cors, basic auth and rate limit
├── greenlock.js             # Let's Encrypt certificate setup, production only
├── broker/
│   └── mqttBroker.js        # Aedes broker, MQTT sign-in, TCP or TLS server
├── config/
│   └── config.js            # loads the env file and checks required variables
├── handler/
│   └── authentication.js    # credentials for MQTT and the HTTP endpoint
└── utils/
    └── logger.js            # Winston loggers
```

## HTTP endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Returns `{ "message": "Broker says hello" }`. Requires Basic Auth. |

## Running locally

The project was developed and tested on Node.js 24.

```bash
# Install dependencies
npm install

# Start the broker in development mode
npm run dev
```

Before the first run, create a file named `.env.development` in the project root. See the next section.

When the broker is running, the console shows a line like this.

```
MQTT broker is up at 127.0.0.1:1883 (plain, dev only)
```

You can then connect with any MQTT client, for example MQTT.fx, using the username and password from the env file.

## Environment variables

Example `.env.development`.

```env
NODE_ENV=development
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
PORT=8080
TLS_AUTH_USER=
TLS_AUTH_PASSWORD=
CERT_EMAIL_ADDRESS=placeholder@example.com
CERT_DOMAIN=localhost
GREENLOCK_CONFIG_DIR=greenlock.d
```

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` or `production`. Selects `.env.development` or `.env.production`, and plain TCP or TLS. |
| `MQTT_HOST`, `MQTT_PORT` | Address and port the MQTT broker listens on. |
| `MQTT_USERNAME`, `MQTT_PASSWORD` | Credentials an MQTT client must use. |
| `PORT` | Port of the HTTP endpoint. |
| `TLS_AUTH_USER`, `TLS_AUTH_PASSWORD` | Basic Auth credentials for the HTTP endpoint. |
| `CERT_EMAIL_ADDRESS`, `CERT_DOMAIN`, `GREENLOCK_CONFIG_DIR` | Let's Encrypt settings. Used only in production mode. |
| `ACME_STAGING` | Optional. Set to `true` to use the Let's Encrypt staging service. |

The three Let's Encrypt variables are required in development mode too, although they are not used there. Any placeholder value works.

## Dependencies

Installs use the project `.npmrc`, which turns off install scripts and refuses package versions published less than two days ago.

## Licence

ISC
