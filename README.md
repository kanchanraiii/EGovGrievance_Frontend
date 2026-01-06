# E-Grievance Frontend

Citizen grievance portal with staff consoles (admin, supervisor, department officer, case worker) and analytics. Angular 21, Chart.js.

## Features
- Citizen: lodge grievances, view history, rate resolved items, upload/view attachments.
- Staff: admin/DO/SO/CW dashboards, department management, grievance views.
- Analytics: status, department load, and 7-day trend (Chart.js).
- File storage: upload, list, download attachments via storage gateway.

## Quick start
```bash
npm install
ng serve --proxy-config proxy.conf.json
# app at http://localhost:4200
```

## API endpoints (via proxy)
- Core: `/api/grievance-service/...`
- Departments JSON: `/departments-api/...`
- Storage: `/storage-api/storage/...` (upload/list/download attachments)
Update `proxy.conf.json` and `netlify.toml` if hosts change.

## Auth roles
- Citizen: login/sign up via `/auth`.
- Staff: admin `/admin/login`, supervisor `/supervisor/login`, department officer `/do/login`, case worker `/cw/login`.
- Sidebar adapts to role; analytics at `/analytics` for staff.

## Grievance + attachments
1) Create (JSON): `POST /api/grievance-service/api/grievances/create` body `{departmentId, categoryCode, subCategoryCode, description}`.
2) Upload files: `POST /storage-api/storage/upload` form-data: `file`, `grievanceId`, `uploadedBy` (bearer token required). Supported: pdf/doc/docx/png/jpg up to 20 MB each.
3) List: `GET /storage-api/storage/grievance/{grievanceId}`. Download: `GET /storage-api/storage/{fileId}`.

## Build
```bash
ng build
```
Artifacts output to `dist/e-grievance`.

## Screenshots
Add your screenshots here:
- Citizen dashboard: ![Citizen](path/to/citizen.png)
- Staff dashboards: ![Staff](path/to/staff.png)
- Analytics: ![Analytics](path/to/analytics.png)

## Deploy notes (Netlify)
`netlify.toml` rewrites `/api`, `/departments-api`, `/storage-api` to your gateway. Ensure gateway is publicly reachable and CORS allows your Netlify domain.
