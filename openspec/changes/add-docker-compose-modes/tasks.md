## 1. Container Image Foundation

- [x] 1.1 Refactor `Dockerfile` dependency and development stages to use Node.js 24, `npm ci`, only
      existing workspace manifests, and a dev server bound to `0.0.0.0:3000`.
- [x] 1.2 Complete the production builder env inputs, inject `SENTRY_AUTH_TOKEN` with a BuildKit
      secret, and preserve the minimal non-root standalone runner without secret-bearing `ARG`/`ENV`.
- [x] 1.3 Add `.dockerignore` rules for env/secrets, VCS, dependencies, Next output and test/report
      artifacts, then confirm all required source and workspace manifests remain in the build context.
- [x] 1.4 Extend the shared `.env.example` with only Compose-specific settings, document the
      container-reachable backend override, and keep the single local `.env` ignored by Git and Docker.

## 2. Compose Topology and Gateway

- [x] 2.1 Add `compose.yaml` with one `nextjs` service scaled to two replicas, explicit required
      runtime env, internal port `3000`, per-replica healthcheck, `host-gateway` support and no direct
      host port or `container_name`.
- [x] 2.2 Add a pinned Traefik gateway image/config with Docker-provider replica discovery,
      round-robin upstreams, forwarding and WebSocket support, unbuffered streaming, upstream-aware
      access logs, its own healthcheck and the sole configurable host port.
- [x] 2.3 Make gateway startup health-gated on the scaled Next.js service and verify the normalized
      Compose model keeps a single project/network for all services.

## 3. Selectable Development and Production Modes

- [x] 3.1 Add `compose.dev.yaml` selecting the development target/command, mounting the working
      tree and giving every replica isolated `/app/node_modules` and `/app/.next` volumes.
- [x] 3.2 Add `compose.prod.yaml` selecting the standalone target, BuildKit build secret and restart
      policy, with no source bind mounts and one shared image definition for both replicas.
- [x] 3.3 Add documented Makefile targets for dev, detached prod with `--wait`, builds, config, logs
      and down; use one project and `--remove-orphans` without adding root npm scripts.

## 4. Operational Documentation

- [x] 4.1 Update `docs/deployment.md` with topology, exact dev/prod/build/stop commands, env-file
      preparation, replica inspection, diagnostic scale override and rollback/troubleshooting steps.
- [x] 4.2 Update `docs/environment.md` and `.env.example` where needed to distinguish internal
      `PORT`, published `FRONT_PORT`, bind address, build-time public values and container-reachable
      `BACK_INTERNAL_URL`.
- [x] 4.3 Document BuildKit secret handling and the limits of two single-host replicas: independent
      Next.js caches/Prometheus registries, shallow readiness and a single gateway failure domain.

## 5. Verification

- [x] 5.1 Format only changed files and run `docker compose ... config --quiet` for both overlays
      with the shared example env, plus a negative check proving a missing required value fails.
- [x] 5.2 Build development and production targets from a clean context; run `npm ci`/Next build
      successfully and verify a unique test Sentry token is absent from final image metadata, history
      and filesystem.
- [x] 5.3 Start dev mode and verify two healthy Next.js containers, one gateway endpoint, traffic to
      both upstreams, HMR/WebSocket behavior and recovery after recreating one replica.
- [x] 5.4 Start prod mode and verify two healthy containers with the same image ID and no source
      mounts, health/readiness/metrics through the gateway, traffic to both upstreams and replica
      recreation without a gateway restart.
- [x] 5.5 Verify dev-to-prod switching and `down` leave no orphan containers while preserving local
      source/env, then run the relevant `npm run fmt:check`, `npm run lint`, `npm run tsc`,
      `npm run build` and browser smoke checks and record any unrelated existing failures separately.
    - Verification on 2026-08-02: targeted formatting, `npm run lint`, `npm run tsc`,
      `npm run build`, both Compose configs and dev/prod browser smokes passed. The repository-wide
      `npm run fmt:check` remains blocked outside this change only by
      `add-valkey-shared-cache/.openspec.yaml` and `src/observability/metrics.ts`.
