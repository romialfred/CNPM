# Public member showcase rules

Sources obligatoires :

- `docs/12-member-showcase/README.md` ;
- `docs/12-member-showcase/requirements.md` ;
- `docs/12-member-showcase/data-model.md` ;
- `docs/12-member-showcase/permissions.md` ;
- `docs/12-member-showcase/promotion-checklist.md` ;
- le pattern et les fiches d’écran sous `docs/ui-handoff/`.

Règles :

- The member may edit content, not the CNPM verification status.
- Use the constrained template; no arbitrary page-builder CSS/HTML.
- Require rights metadata and alt text for media.
- Empty sections are not rendered.
- Support draft, review, approved, scheduled, published, rejected, unpublished and suspended states.
- Public pages are server-rendered or pre-rendered, responsive and SEO-ready.
- The badge explains what was verified and when.
- Do not expose personal contacts without consent.
- Do not implement the R4 API or migrations from the addendum until the promotion checklist and blocking decisions are closed.
