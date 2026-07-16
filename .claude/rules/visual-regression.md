# Visual regression rules

- Use fixed fixtures, locale, timezone and date.
- Disable animations before capture.
- Required viewport set comes from `data/viewports.json`.
- Concept PNG guides the first implementation; reviewed app screenshots become baselines.
- Fix structural mismatches before pixel details.
- Masks only for truly dynamic small regions.
- Never broaden thresholds to hide a defect.
- Baseline changes require a written reason and UX approval.
