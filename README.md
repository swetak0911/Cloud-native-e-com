# Cloud-Native E-Commerce Microservices Platform

**MERN/PERN + System Design + DevOps/SRE Capstone**

A production-style e-commerce platform built as event-driven microservices.

---

## Architecture (high level)

```
                 ┌─────────────┐
   Client  ───▶  │ API Gateway │  (auth check, routing, rate limit)
                 └──────┬──────┘
        ┌───────────┬───┴────┬───────────┬──────────────┐
        ▼           ▼        ▼           ▼              ▼
   ┌────────┐ ┌─────────┐ ┌──────┐ ┌──────────┐  ┌────────────┐
   │  Auth  │ │ Product │ │ Cart │ │  Order   │  │   Search   │
   └────────┘ └─────────┘ └──────┘ └────┬─────┘  └────────────┘
        │          │                    │
        ▼          ▼                    ▼
   ┌──────────────────── Event Bus (Kafka/NATS/RabbitMQ) ───────────────────┐
        │            │              │                │
        ▼            ▼              ▼                ▼
   ┌─────────┐ ┌───────────┐ ┌──────────┐    ┌──────────────┐
   │  User   │ │ Inventory │ │ Payment  │    │ Notification │
   └─────────┘ └───────────┘ └──────────┘    └──────────────┘
```

## Tech stack

| Layer        | Technology                                   |
|--------------|----------------------------------------------|
| Frontend     | React / Next.js, TypeScript                  |
| Backend      | Node.js, Express, TypeScript                 |
| Databases    | PostgreSQL (orders, inventory) + MongoDB (catalog, cart) |
| Cache        | Redis                                        |
| Messaging    | Kafka / RabbitMQ / NATS                      |
| Search       | Elasticsearch / OpenSearch                   |
| Containers   | Docker                                       |
| Orchestration| Kubernetes                                   |
| CI/CD        | GitHub Actions                               |
| Monitoring   | Prometheus + Grafana                         |
| Logging      | ELK / OpenSearch stack                       |
| Tracing      | OpenTelemetry + Jaeger                        |

## Services

| Service              | Responsibility                                  | DB         |
|----------------------|-------------------------------------------------|------------|
| api-gateway          | Routing, auth checks, rate limiting             | —          |
| auth-service         | Signup, login, JWT/session                      | PostgreSQL |
| user-service         | Profiles, addresses, preferences                | PostgreSQL |
| product-service      | Catalog, categories, pricing, images            | MongoDB    |
| cart-service         | Add/remove items, cart persistence              | Redis/Mongo|
| inventory-service    | Stock counts, reservation, release              | PostgreSQL |
| order-service        | Order creation, status, history                 | PostgreSQL |
| payment-service      | Payment intent, confirm, refund simulation      | PostgreSQL |
| notification-service | Email/SMS/order updates via async events        | —          |
| search-service       | Product search                                  | Elastic    |

## Build order (don't build everything at once)

1. Frontend + API Gateway
2. Auth Service
3. Product Service
4. Cart Service
5. Order Service
6. Inventory Service
7. Payment Service
8. Notification Service
9. Search Service
10. Monitoring + Kubernetes + CI/CD

## Getting started (local dev)

```bash
# 1. boot infrastructure (Postgres, Mongo, Redis, Kafka)
docker compose up -d

# 2. run a single service
cd services/auth-service
npm install
npm run dev
```

## Docs

See [`/docs`](./docs) for the full system design document set.
