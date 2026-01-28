# Nostressia Backend Test Inventory

Checklist of routes, services, utilities, and schemas with test coverage.

## Routes / Endpoints
- [x] `POST /api/auth/register` — `tests/routes/test_signup_routes.py`
- [x] `POST /api/auth/verify-otp` — `tests/routes/test_signup_routes.py`
- [x] `POST /api/auth/login` — `tests/routes/test_auth_routes.py`
- [x] `POST /api/auth/token` — `tests/routes/test_auth_routes.py`
- [x] `GET /api/auth/me` — `tests/routes/test_auth_routes.py`
- [x] `PUT /api/auth/me` — `tests/routes/test_profile_routes.py`
- [x] `POST /api/auth/me/avatar` — `tests/routes/test_auth_routes.py`
- [x] `POST /api/auth/verify-current-password` — `tests/security/test_password_routes.py`
- [x] `PUT /api/auth/change-password` — `tests/security/test_password_routes.py`
- [x] `POST /api/auth/forgot-password` — `tests/routes/test_auth_routes.py`
- [x] `POST /api/auth/reset-password-verify` — `tests/routes/test_auth_routes.py`
- [x] `POST /api/auth/reset-password-confirm` — `tests/routes/test_auth_routes.py`
- [x] `POST /api/auth/admin/login` — `tests/routes/test_auth_routes.py`
- [x] `GET /api/admin/users/` — `tests/routes/test_admin_routes.py`
- [x] `GET /api/admin/users/{user_id}` — `tests/routes/test_admin_routes.py`
- [x] `PUT /api/admin/users/{user_id}` — `tests/routes/test_admin_routes.py`
- [x] `DELETE /api/admin/users/{user_id}` — `tests/routes/test_admin_routes.py`
- [x] `GET /api/admin/diaries/` — `tests/routes/test_admin_routes.py`
- [x] `DELETE /api/admin/diaries/{diary_id}` — `tests/routes/test_admin_routes.py`
- [x] `GET /api/diary/` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `POST /api/diary/` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `PUT /api/diary/{id}` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `GET /api/motivations/` — `tests/routes/test_motivation_routes.py`
- [x] `POST /api/motivations/` — `tests/routes/test_motivation_routes.py`
- [x] `DELETE /api/motivations/{id}` — `tests/routes/test_motivation_routes.py`
- [x] `GET /api/tips/categories` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `POST /api/tips/categories` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `DELETE /api/tips/categories/{id}` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `GET /api/tips/` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `GET /api/tips/by-category/{id}` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `POST /api/tips/` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `PUT /api/tips/{id}` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `DELETE /api/tips/{id}` — `tests/routes/test_motivation_routes.py` (integration smoke)
- [x] `POST /api/stress/current` — `tests/unit/test_service_exports.py` (service smoke)
- [x] `GET /api/stress/global-forecast` — `tests/unit/test_service_exports.py` (service smoke)
- [x] `POST /api/stress-levels/` — `tests/unit/test_stress_service.py`
- [x] `POST /api/stress-levels/restore` — `tests/unit/test_stress_service.py`
- [x] `GET /api/stress-levels/my-logs` — `tests/unit/test_stress_service.py`
- [x] `GET /api/stress-levels/eligibility` — `tests/unit/test_stress_service.py`
- [x] `POST /api/notifications/subscribe` — `tests/routes/test_notification_routes.py`
- [x] `DELETE /api/notifications/unsubscribe` — `tests/routes/test_notification_routes.py`
- [x] `GET /api/notifications/status` — `tests/routes/test_notification_routes.py`
- [x] `POST /api/notifications/test-send` — `tests/routes/test_notification_routes.py`

## Services / Utilities
- [x] `app/services/*` (auth, user auth, forecast, stress, diary, profile, notifications, ML, storage) — `tests/unit/test_service_exports.py`
- [x] `app/utils/hashing.py` — `tests/unit/test_utils.py`
- [x] `app/utils/jwt_handler.py` — `tests/unit/test_utils.py`
- [x] `app/services/stress_service` GPA imputation — `tests/unit/test_stress_service.py`
- [x] `app/services/notification_scheduler` send log + dedupe — `tests/routes/test_notification_routes.py`

## Schemas / Models
- [x] `app/schemas/*` (auth, diary, stress, profile, notifications, tips) — `tests/routes/*`, `tests/unit/test_stress_service.py`
- [x] `app/models/*` (user, admin, diary, stress, notification, bookmark) — `tests/routes/*`, `tests/unit/test_stress_service.py`

## Authorization Matrix
| Endpoint | Required Role |
| --- | --- |
| `POST /api/auth/register` | Public |
| `POST /api/auth/login` | Public |
| `POST /api/auth/admin/login` | Public |
| `GET /api/auth/me` | User |
| `PUT /api/auth/me` | User |
| `POST /api/auth/verify-current-password` | User |
| `PUT /api/auth/change-password` | User |
| `GET /api/admin/users/*` | Admin |
| `GET /api/admin/diaries/*` | Admin |
| `POST /api/stress/current` | Public |
| `POST /api/stress-levels/*` | User |
| `GET /api/stress-levels/*` | User |
| `POST /api/notifications/subscribe` | User |
| `DELETE /api/notifications/unsubscribe` | User |

## Key Error Cases (401/403/422)
- [x] Unauthorized access to `/api/auth/me` — `tests/routes/test_auth_routes.py`
- [x] Unauthorized access to `/api/admin/users/` — `tests/routes/test_admin_routes.py`
- [x] Invalid login credentials — `tests/routes/test_auth_routes.py`
- [x] Duplicate signup email/username — `tests/routes/test_signup_routes.py`
- [x] Invalid current password — `tests/security/test_password_routes.py`
