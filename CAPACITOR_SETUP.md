# Capacitor / TWA Setup – SmartHockey Goalie

## Canonical Goalie PWA values

| Setting | Value |
|---|---|
| Host | `smarthockeyproducts.com` |
| Start path | `/SmartHockey-Tracking-Goalie/` |
| Manifest URL | `https://smarthockeyproducts.com/SmartHockey-Tracking-Goalie/manifest.json` |
| Android App ID | `io.github.asaufzuege_sketch.goalie` |

## Double-scheme pitfall (broken start URL)

Bubblewrap expects a **bare host** (`smarthockeyproducts.com`) and a path (`/SmartHockey-Tracking-Goalie/`).
If the host is entered with `https://`, Bubblewrap can produce malformed double-prefixed start URLs.

Use the workflow env values as the single source of truth and keep:
- host without scheme/path
- path with leading and trailing slash
- manifest URL exactly `https://<host><path>manifest.json`

## Build and installation notes

- The build output `app-release-bundle.aab` is for Google Play upload and **cannot be installed directly** on Android devices.
- Test via Play Console **Internal testing**, or generate installable APKs with bundletool:

```bash
bundletool build-apks --bundle=app-release-bundle.aab --output=app.apks --mode=universal
unzip app.apks universal.apk
```

## Digital Asset Links requirement

To keep the TWA in full-screen mode (no browser URL bar), the website must serve:

`https://smarthockeyproducts.com/.well-known/assetlinks.json`

That file must contain:
- package name `io.github.asaufzuege_sketch.goalie`
- SHA-256 certificate fingerprints of the signing key used for release (Play App Signing key/final signing key path)
