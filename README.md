# broker

MQTT broker and connection gateway for a self-hosted IoT telemetry platform. This service is the entry point for physical sensor devices (M-Bus meters relayed through Teltonika gateways): it authenticates incoming MQTT connections, brokers pub/sub traffic between devices and downstream consumers, and exposes a minimal, guarded HTTP status endpoint.

It is one of four cooperating services in the wider system — `broker` and a companion `listener` service handle the device/data pipeline; a Nuxt/Vue dashboard consumes the resulting data separately.

```
IoT devices ──MQTT/TLS──▶  broker  ──MQTT──▶  listener  ──▶  MongoDB + InfluxDB
                              │
                          guarded HTTP
                          status endpoint
```

## Tech stack

| Concern | Library |
|---|---|
| MQTT broker engine | [Aedes](https://github.com/moscajs/aedes) |
| HTTP API | Express |
| TLS / certificates (production) | greenlock-express (automatic Let's Encrypt) |
| HTTP hardening | helmet, express-rate-limit, express-basic-auth, cors |
| Logging | Winston |

## Architecture notes

**Environment-aware transport.** The same codebase runs certificate-free in local development and with automatic Let's Encrypt provisioning in production, controlled by a single `NODE_ENV` branch rather than two separate code paths to maintain:

- **Development** — plain TCP MQTT (`net.createServer`) on port `1883`, plain HTTP (`app.listen`). No certificates required.
- **Production** — TLS-wrapped MQTT (`tls.createServer`) on port `8883` using certificates issued by Greenlock, and HTTPS served via `greenlock-express`.

Greenlock's own module is dynamically imported only when `NODE_ENV=production`, so a local dev run never touches certificate-reading logic at all — there's nothing to fail or hang on a machine with no domain pointed at it.

**Authentication.** MQTT clients authenticate with a username/password pair checked in `broker.authenticate`. The HTTP status endpoint sits behind HTTP Basic Auth plus a rate limiter (100 requests / 15 min).

## Getting started (local development)

**Prerequisites:** Node.js ≥ 20, npm ≥ 11 (needed for the `min-release-age` install policy below).

1. Install dependencies:
   ```bash
   npm install --ignore-scripts
   npm audit fix
   ```
2. Create `.env.development` in the project root (see [Environment variables](#environment-variables) below).
3. Run:
   ```bash
   npm run dev
   ```
   You should see log lines confirming the HTTP server and MQTT broker are both listening locally.

## Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` — selects `.env.development` / `.env.production` and the transport mode described above |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | Credentials required to connect as an MQTT client |
| `MQTT_HOST` / `MQTT_PORT` | Bind address/port for the MQTT broker (`1883` plain in dev, `8883` TLS in prod) |
| `PORT` | HTTP API port |
| `TLS_AUTH_USER` / `TLS_AUTH_PASSWORD` | Basic Auth credentials for the HTTP status endpoint |
| `GREENLOCK_CONFIG_DIR` | Where Greenlock stores issued certificates (production only) |
| `CERT_EMAIL_ADDRESS` | Maintainer email for Let's Encrypt registration (production only) |
| `LOG_LEVEL` | Winston log level |

## HTTP API

```
GET /   → 200, requires Basic Auth
          { "message": "Broker says hello" }
```

Intentionally minimal — this service's real job is the MQTT layer, not the HTTP one.

## Dependency security policy

Every install runs through a project-scoped `.npmrc`:

```dotenv
ignore-scripts=true
fund=false
audit=true
save-exact=true
min-release-age=2
```

- **`ignore-scripts`** — blocks the delivery mechanism used by several real npm supply-chain incidents in 2025–2026, where a compromised maintainer account published a version whose install script silently executed malicious code the moment `npm install` resolved it.
- **`min-release-age=2`** — refuses to resolve any package version published less than 48 hours ago. Compromised versions are typically caught and pulled from the registry within hours; this cooldown window means a routine install essentially never touches one.
- **`save-exact`** — no caret/tilde auto-upgrade ranges; what's tested is what runs, until deliberately bumped.

`npm audit` / `npm audit fix` are run as a standard part of dependency updates.

## Project structure

```
src/
├── server.js              # entry point — NODE_ENV branch, starts HTTP + MQTT
├── app.js                 # Express app: helmet, cors, basic auth, rate limiting
├── greenlock.js            # Let's Encrypt cert provisioning (production only)
├── broker/
│   └── mqttBroker.js       # Aedes broker setup, auth, dev/prod transport branch
└── utils/
    ├── config.js           # env loading + required-var validation
    └── logger.js            # Winston logger
```

## Author

jarmo · ISC License
