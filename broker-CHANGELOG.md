# Changelog — broker

## 2026-08-19

### Domain migration + removed hardcoded cert paths
Switching to a new domain surfaced that the cert domain was hardcoded directly into `mqttBroker.js`'s `path.resolve()` calls (`greenlock.d/live/<old-domain>/...`). Fixed properly instead of just swapping the string:

- `config.js` added `CERT_DOMAIN`, `GREENLOCK_CONFIG_DIR`, and `PORT` to `requiredEnvVariables` and `CONFIG`, following the existing validate-at-startup pattern (fail fast with a clear error instead of a silent `undefined` reaching `fs.readFileSync` later).
- `mqttBroker.js` fully switched to reading from `CONFIG` instead of `process.env` directly (domain, MQTT creds, host/port all now come from one source). Cert paths now interpolate `CONFIG.CERT_DOMAIN` via template literals instead of a literal string.
- `greenlock.js` `configDir` was resolved incorrectly twice during this fix before landing right. Final form: `resolve(__dirname, '..', CONFIG.GREENLOCK_CONFIG_DIR)`, anchored the same way `packageRoot`.
- Added `ACME_STAGING` env toggle (`greenlock-express`'s built-in `staging` option) so DNS/networking changes can be tested against Let's Encrypt's staging directory without burning production rate limits.
- Removed the stale `src/.greenlockrc` (pointed at a `.greenlock.d` path under an old, no-longer-existent project location).

### Bug fixes
- `logger.js` Winston's custom `logLevels` had `error` numbered highest (`5`) and `debug` lowest (`0`), backwards from Winston's "lower number = more severe" convention. This silently made the Console transport's `level: 'error'` filter show *everything* instead of errors only. Renumbered to `error:0 … debug:5`.
- `server.js` `dns.setServers(['1.1.1.1', '8.8.8.8'])` added at startup. Node's built-in `dns.resolveMx` was failing with `ECONNREFUSED` on this Windows machine (confirmed by direct test) even though the OS resolver (`nslookup`) worked fine this was breaking Greenlock's built-in maintainer-email MX validation (`invalid maintainer contact info` error) and had caused the same class of unexplained DNS failure with MongoDB previously.

# Infrastructure findings (not yet resolved)
- The original plan was to keep running the broker on a home connection, but that connection turned out to be behind carrier-grade NAT (confirmed by the router's own WAN IP being a private address rather than the public IP the domain resolves to). This makes inbound port forwarding, and therefore ACME's HTTP-01 challenge, impossible from that connection regardless of router/firewall config.
- Decision made to move the broker onto existing cloud infrastructure instead, which already runs a reverse proxy for another service on ports 80/443 meaning the broker's own Greenlock instance can't also bind those ports on the same box without conflict. Still deciding between: a separate host, changing the ACME challenge type to DNS-01, or having the broker's TLS server read the reverse proxy's already-issued certificate from disk instead of running its own ACME client. Not implemented yet.

## 2026-08-10

### Local dev support
The service was originally written assuming production conditions only — it needed a real domain and a live Greenlock cert just to start. Added a `NODE_ENV` branch so it can run entirely offline:

- `server.js` — Greenlock is now dynamically imported only when `NODE_ENV=production`. In dev it just does `app.listen()` on plain HTTP.
- `mqttBroker.js` — same idea for the MQTT side. Dev uses `net.createServer` (plain TCP, port 1883), prod uses `tls.createServer` with the Greenlock-issued cert. The cert file reads used to run unconditionally at module load and would crash the process immediately on a machine with no cert on disk — moved that block inside the prod-only branch.
- Added `.env.development` alongside the existing `.env` (renamed conceptually to `.env.production`), following the pattern already used for `NODE_ENV`-based config loading.

### Bug fixes
- CORS origin was missing the protocol slashes (`https:<domain>` instead of `https://<domain>`) — fixed in `app.js`.

### Dependency security
Added a project-local `.npmrc`:
```
ignore-scripts=true
fund=false
audit=true
save-exact=true
min-release-age=2
```
(`min-release-age` is in *days*, not minutes — first attempt used `2880`, which npm read as "2880 days," rejecting basically the entire dependency tree. Corrected to `2`.)

Ran `npm audit fix`: cleared 18 of 19 flagged advisories (ajv, body-parser, brace-expansion, braces, cookie, cross-spawn, flatted, js-yaml, micromatch, minimatch, path-to-regexp, picomatch, qs, send/serve-static — mostly transitive deps of express and the dev tooling chain).

One item left open on purpose: `aedes`'s dependency chain (via `hyperid`/`uuid`) only clears with `npm audit fix --force`, which bumps `aedes` to a new major version (1.1.1) with documented breaking changes upstream. Confirmed Node version (24.18.1) meets the new `>=20` requirement, but the bump itself hasn't been applied yet — holding off until it can be tested in isolation against a known-working baseline.

### Verified working locally
- Auth: connecting with a wrong password is correctly rejected.
- Pub/sub round trip confirmed via MQTT.fx — subscribe, publish, message received back, matches broker's own connect/publish logs.
