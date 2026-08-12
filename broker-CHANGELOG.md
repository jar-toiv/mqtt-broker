# Changelog — broker

## 2026-08-10

### Local dev support
The service was originally written assuming production conditions only — it needed a real domain and a live Greenlock cert just to start. Added a `NODE_ENV` branch so it can run entirely offline:

- `server.js` — Greenlock is now dynamically imported only when `NODE_ENV=production`. In dev it just does `app.listen()` on plain HTTP.
- `mqttBroker.js` — same idea for the MQTT side. Dev uses `net.createServer` (plain TCP, port 1883), prod uses `tls.createServer` with the Greenlock-issued cert. The cert file reads used to run unconditionally at module load and would crash the process immediately on a machine with no cert on disk — moved that block inside the prod-only branch.
- Added `.env.development` alongside the existing `.env` (renamed conceptually to `.env.production`), following the pattern already used for `NODE_ENV`-based config loading.

### Bug fixes
- CORS origin was missing the protocol slashes (`https:broker.jarmo.site` instead of `https://broker.jarmo.site`) — fixed in `app.js`.

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
