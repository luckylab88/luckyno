# Home Glance v1.2.3 Verified Date Fix

Designed for Amazon Fire HD with Silk Browser.

## Data sources
- Weather, UV, sunrise and sunset: Open-Meteo using Rugby Clock Tower as a public reference point.
- Lunar date and 24 solar terms: Hong Kong Observatory annual Gregorian–Lunar conversion table.
- Official UK severe-weather warnings: Met Office NSWWS public beta on Esri UK.
- Daily quotes: local JSON.

## Reliability
- HKO annual data is cached in the browser.
- If HKO cannot be reached, the browser Chinese calendar is used for the lunar date.
- If Met Office warning data cannot be reached, Home Glance falls back to local weather notices or a daily quote.
- Returning from YouTube, waking the tablet, reconnecting Wi-Fi, or reopening the tab triggers an immediate refresh.

## Debug mode
Add `?debug=1` to the page URL to show the active data-source status.

No API keys or private account data are stored in the page.

## Octopus Tracker
- Tariff: Octopus Tracker September 2025 (`SILVER-25-09-02`)
- Distribution region is resolved automatically from postcode `CV22 5QE`.
- Shows today's price and tomorrow's price when Octopus publishes it.
- Prices below 20p are green and bold.
- `Save` appears when tomorrow is below 20p or at least 2p cheaper than today.
- The tariff API is public; no Octopus account key is stored.

## v1.2.1 price correction
Tracker now uses the same verified logic as the iPhone Scriptable shortcut:
1. Resolve the distribution region from postcode.
2. Build the exact regional Tracker tariff code.
3. Use Octopus's newest-first results: item 1 is today and item 0 is tomorrow.

## v1.2.2 corrections
- Tracker prices are matched by each rate's `valid_from` date in Europe/London.
- Before tomorrow's price is published, today no longer shifts to yesterday.
- After tomorrow is published, today and tomorrow remain correctly labelled.
- HKO calendar cache is refreshed so official solar terms such as 大暑 can appear.

## v1.2.3 verified correction
- Bundles official HKO solar-term dates for 2026 and 2027.
- Solar terms now work when opened directly with `file://`, even when the browser blocks the HKO cross-origin fetch.
- Verified test: `2026-07-23` returns `大暑`.
- Tracker continues to match rates by `valid_from` in `Europe/London`, not result position.
