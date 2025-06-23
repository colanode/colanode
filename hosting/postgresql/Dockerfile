# ── Stage 1: pgvector ────────────────────────────────
FROM pgvector/pgvector:pg17 AS builder

# ── Stage 2: Bitnami PostgreSQL ──────────────────────────────
FROM bitnami/postgresql:17

# Copy pgvector extension to the PostgreSQL container
COPY --from=builder /usr/lib/postgresql/17/lib/vector.so \
                    /opt/bitnami/postgresql/lib/
COPY --from=builder /usr/share/postgresql/17/extension/*vector* \
                    /opt/bitnami/postgresql/share/extension/
