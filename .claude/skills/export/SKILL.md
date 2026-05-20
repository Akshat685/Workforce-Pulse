# Executive Summary Export

Client-side PDF export of the live dashboard state. No server round-trip.

## Files
- `src/components/dashboard/ExportButton.tsx` — handler, uses `html2canvas` to rasterize and `jsPDF` to wrap as PDF.
- Target DOM: the element with id `executive-summary-export` (set on `ExecutiveSummary.tsx`).

## What gets captured
- Headline numbers (recoverable hours, recoverable INR, repetitive %).
- Top 5 automation opportunities.
- Date range observed.
- Active filters (department / task / app / employee).
- Methodology blurb.

## Behavior
- Respects current filters — captures **what the user sees**, not an unfiltered snapshot.
- Runs in the browser; no API hit, no auth needed.
- Layout-friendly: the export section is laid out to fit a single page; heavier charts intentionally live outside `executive-summary-export`.

## Adding to the export
Anything you want in the PDF must render inside `#executive-summary-export`. Anything outside is invisible to `html2canvas`. Keep that section deterministic — no animations / lazy mounts mid-capture.
