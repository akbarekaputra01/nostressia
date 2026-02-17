# Nostressia Observability (Prometheus + Grafana)

This guide sets up local monitoring for the Nostressia backend using Docker Compose.

## What is included

- **FastAPI metrics endpoint** at `GET /metrics`
- **Prometheus** (scrapes backend metrics)
- **Grafana** (pre-provisioned Prometheus datasource + dashboard)
- **Optional alert rules** loaded by Prometheus (`rules.yml`)

## Prerequisites

- Docker Desktop (Windows)
- Backend dependencies installed (`nostressia-backend/requirements.txt`)
- Ports available:
  - `8000` backend
  - `9090` Prometheus
  - `3000` Grafana

## 1) Start backend (Windows host mode)

From repo root:

```bash
cd nostressia-backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verify metrics endpoint:

- http://localhost:8000/metrics

If metrics are missing, ensure env var is set (defaults enabled):

```bash
set ENABLE_METRICS=true
```

## 2) Start observability stack

From repo root:

```bash
cd observability
docker compose up -d
```

## Access URLs

- Backend metrics: http://localhost:8000/metrics
- Prometheus UI: http://localhost:9090
- Grafana UI: http://localhost:3000
  - Username: `admin`
  - Password: `admin`

> Change Grafana credentials in `observability/docker-compose.yml` (`GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD`).

## Backend target modes for Prometheus

Configured in `observability/prometheus/prometheus.yml`:

- **Mode 1 (default):** backend runs on Windows host, scraped via:
  - `host.docker.internal:8000`
- **Mode 2:** backend runs as Docker container/service:
  - Uncomment target `nostressia-backend:8000`
  - Comment out `host.docker.internal:8000`
  - Ensure backend service joins same Docker Compose network.

After changes:

```bash
docker compose restart prometheus
```

## Dashboard details

Preloaded dashboard file:

- `observability/grafana/dashboards/nostressia-backend.json`

Panels included:

1. Request rate (RPS) by route/handler + method
2. Error rate (5xx %)
3. Latency p50/p95
4. Uptime (`up`)
5. Python process metrics (if exposed)

Metric names used (from `prometheus-fastapi-instrumentator`):

- `http_requests_total`
- `http_request_duration_seconds_bucket`
- `up`
- `process_resident_memory_bytes` (optional)
- `process_open_fds` (optional)

## Prometheus alerts

Rules loaded from `observability/prometheus/rules.yml`:

- `BackendDown`: `up{job="nostressia-backend"} == 0` for 1m
- `HighErrorRate`: backend 5xx ratio > 2% for 5m
- `HighLatencyP95`: p95 > 500ms for 10m

## Troubleshooting (Windows + Docker Desktop)

### 1) `host.docker.internal` does not resolve

- Update Docker Desktop.
- Temporary fallback: replace target with your host IP in `prometheus.yml`.
- Restart Prometheus:

```bash
docker compose restart prometheus
```

### 2) Metrics endpoint returns 404

- Confirm backend code includes Instrumentator wiring in `create_app()`.
- Confirm backend restarted after dependency installation.
- Confirm `ENABLE_METRICS` is not set to `false`.

### 3) Prometheus target is DOWN

- Open Prometheus Targets page: http://localhost:9090/targets
- Ensure backend listens on `0.0.0.0:8000`.
- Check local firewall rules allow inbound 8000.

### 4) Grafana dashboard appears empty

- Ensure Prometheus target is UP first.
- Verify dashboard queries match emitted metric names.
- Open Grafana Explore and test:
  - `up{job="nostressia-backend"}`
  - `rate(http_requests_total{job="nostressia-backend"}[1m])`

### 5) Port conflicts (3000/9090)

- Change port mappings in `observability/docker-compose.yml` and restart stack.

## Optional backend Docker mode

If you add backend into Compose later:

1. Run backend service as `nostressia-backend` on port `8000`.
2. Switch Prometheus target to `nostressia-backend:8000`.
3. Restart Prometheus.

## Next steps

- Add logs with **Loki + Promtail** and link as Grafana datasource.
- Add tracing with **OpenTelemetry** + Tempo/Jaeger.
- Add SLO dashboards and Alertmanager notification channels.
