# Materials Database — Security Lab draft

The Admin Materials screen can search the shared Ministry catalog, choose
Δόλωμα / Χημικό / Ακύρωση, and prefill the existing editable form. The user's
copy remains organization-scoped. IDs/provenance are retained through saves;
stale-list versions are rejected by the coordinated backend.

The iOS SuperAdmin home has **Materials Database** immediately below
**Organizations**, inside the existing protected administrator modal/session
flow. It supports import previews, explicit apply/cancel, manual catalog edits,
archival, PDF upload, source refresh, and evidence-based SDS review.

Admin and customer histories include **Λήψη ΔΔΑ** for all five service types.
Partial bundles identify missing documents; pre-feature services are explicitly
reported as lacking archived SDS. Downloads use the active authorization header
and temporary native files are deleted after sharing or failure.

The exact fallback is **Δεν αναφέρεται στο ΔΔΑ**, only after review. An unread or
missing SDS remains pending. No AI inference of antidotes is used.

No frontend dependencies changed. File selection uses the already-installed
WebView with local HTML, blocked navigation and no tokens/cookies, or the browser
file input for web rendering. Uploads are bounded at 8 MiB.

This branch is **not deployed**. New UI depends on the Lab capability flag.
Backend parser dependencies were approved and installed only in the backend
workspace. Actual XLS/PDF worker checks passed on Node 24; the existing Lab
Node 20 runtime still needs a compatibility plan. Background research remains
disabled until the next phase requested by the user. Runtime/native device and session-expiry
checks remain required before Lab activation. See the matching backend document
for data coverage, controls, pending dependencies and rollout gates.
