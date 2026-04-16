# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    librdkafka-dev \
    libhiredis-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy build files — order matters for layer caching
# Headers rarely change, source changes often
COPY CMakeLists.txt ./
COPY include/ ./include/
COPY src/ ./src/

RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --parallel $(nproc)

# ── Stage 2: Minimal runtime image ────────────────────────────────────────────
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Only install runtime libraries (not -dev headers/static libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    librdkafka1 \
    libhiredis0.14 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the compiled binary from builder stage
COPY --from=builder /app/build/analytics_engine ./analytics_engine

# Run as non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

CMD ["./analytics_engine"]
