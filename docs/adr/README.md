# StockPulse Architecture Decision Records (ADRs)

This directory documents the foundational architectural and design decisions made in the engineering of the **StockPulse Multi-Tenant Inventory & Order Engine**, following the lightweight ADR specification pioneered by Michael Nygard.

---

## 🏛️ Architectural Decision Log

| ID | Title | Status | Date | Core Invariant / Focus |
|:---|:---|:---|:---|:---|
| [ADR-001](./ADR-001-pessimistic-concurrency-control.md) | **Pessimistic Row-Level Locking for Concurrent Checkouts** | `ACCEPTED` | 2026-03-01 | **Zero Negative-Stock Drift**: Eliminates inventory overselling under high-concurrency flash sales. |
| [ADR-002](./ADR-002-multi-tenant-partitioning-strategy.md) | **Multi-Tenant Data Partitioning & Isolation Strategy** | `ACCEPTED` | 2026-03-02 | **Zero-Trust Boundary**: Shared database with tenant discriminator, composite indexes, and JWT claim scoping. |
| [ADR-003](./ADR-003-deadlock-prevention-lock-ordering.md) | **Deterministic Lock Acquisition Ordering for Deadlock Elimination** | `ACCEPTED` | 2026-03-03 | **Cyclic Wait Elimination**: $O(N \log N)$ sorting (`ORDER BY id ASC`) prevents PostgreSQL `40P01` deadlocks. |

---

## 🎯 Engineering Tenets

1. **Correctness Over Throughput**: In financial and physical inventory systems, data integrity is paramount. Incomplete transactions, negative stock drift, and dirty reads are zero-tolerance failure modes.
2. **Database-Enforced Invariants**: Never rely solely on application-layer memory checks for ACID boundaries. Storage engine check constraints (`CHECK (stock_quantity >= 0)`) and row locks guarantee safety even under process failure.
3. **Formal Deadlock Elimination**: Prevent database lock deadlocks algorithmically through mathematical lock hierarchies rather than relying on retry storms and timeouts.
4. **Defense-in-Depth Tenant Isolation**: Enforce tenant boundaries across three independent layers: cryptographically verified JWT claims, application middleware injection, and compound unique database constraints.
