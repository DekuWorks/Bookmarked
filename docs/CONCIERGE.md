# Concierge

- **Priority Support** tag is derived server-side from `user_has_home_entitlement`. Clients cannot set it (`submit_support_ticket`).
- **Priority Feature Requests:** title, description, category, problem, optional screenshot via `submit_feature_request`.
- Copy: elevated consideration, **not** a build guarantee. **No SLA** — do not promise “1 hour” or any response time (`CONCIERGE_COPY`).
- Routes: `/concierge/` (web) and `concierge` (iOS).
