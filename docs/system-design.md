# System Design Document: Cloud-Native E-Commerce Microservices Platform

> This is the centerpiece interview artifact. Fill each section as you build.

## 1. Problem statement & scope
- Build an e-commerce platform supporting browse → cart → checkout → pay → fulfill.
- Functional: catalog, search, cart, orders, payments, inventory, notifications.
- Non-functional: high availability, low p99 latency, strong order/payment correctness.

## 2. Capacity / scale assumptions
- DAU: ___, peak RPS: ___, read:write ratio: ___
- Catalog size: ___ products, average order size: ___ items
- Storage growth: ___ GB/month

## 3. High-level architecture
- API Gateway → stateless services → event bus → async consumers.
- See `service-boundaries.md` and `async-events.md`.

## 4. Key design decisions & tradeoffs
| Decision | Options considered | Chosen | Why |
|----------|--------------------|--------|-----|
| Inventory consistency | optimistic vs reservation lock | reservation + TTL | avoids oversell |
| Order/payment coupling | sync vs saga | saga (orchestrated) | resilience |
| Catalog store | SQL vs document | MongoDB | flexible schema |
| Order store | SQL vs document | PostgreSQL | ACID, reporting |

## 5. Detailed components
Link out: APIs (`api-contracts.md`), schema (`database-schema.md`),
caching (`caching-strategy.md`), sharding (`sharding-strategy.md`).

## 6. Reliability
- SLOs/SLIs in `slo-sli.md`, failure modes in `failure-analysis.md`.

## 7. Future improvements
- Read replicas, CDC, recommendation engine, multi-region.
