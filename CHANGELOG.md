# Changelog

## v1.2.3 Verified Date Fix
- Added bundled official HKO solar-term dates for 2026–2027.
- Fixed missing 大暑 when running locally from `file://`.
- Preserved date-based Tracker Today/Tomorrow matching.


## v1.2.2 Date Fix
- Fixed morning Tracker offset.
- Matched Tracker rates by UK calendar date instead of array position.
- Kept tomorrow blank until Octopus publishes it.
- Refreshed the HKO cache version for solar-term corrections.


## v1.2.1 Tracker Fix
- Replaced the estimated region with automatic postcode-to-region lookup.
- Uses postcode `CV22 5QE`.
- Matches the verified iPhone Scriptable shortcut logic exactly.
- Uses Octopus newest-first tariff results: `results[1]` for today and `results[0]` for tomorrow.
- Added resolved Tracker region to debug mode.


## v1.2 Tracker
- Added Octopus Tracker electricity price to the footer.
- Shows today and tomorrow when available.
- Added green/bold display below 20p and a `Save` indicator.
- Added automatic refresh and Smart Resume refresh for Tracker data.


## v1.1 Stable
- Added Smart Resume refresh after wake or returning from another app/tab.
- Added `?debug=1` diagnostics for HKO, Met Office and Open-Meteo sources.
- Improved HKO annual-table parsing and added leap-month handling.
- Improved Met Office layer discovery instead of assuming fixed layer IDs.
- Kept the existing Fire HD layout unchanged.
