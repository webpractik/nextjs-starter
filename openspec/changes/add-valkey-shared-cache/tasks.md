## 1. Prerequisite Gate

- [x] 1.1 Verify `add-docker-compose-modes` has all tasks completed, its expected Docker/Compose/env
      artifacts exist, and its dev/prod two-replica checks pass; stop this apply if any prerequisite is
      missing.

> User-authorized exception: prerequisite tasks 5.4–5.5 remained unchecked, but the user explicitly
> instructed this apply to continue; the actual topology and both modes were verified directly during
> this change.

- [x] 1.2 Re-read the resulting Compose files, `Dockerfile`, `next.config.ts`, env schemas and
      standalone tooling, preserving intervening user changes instead of applying assumptions from the
      proposal.
- [x] 1.3 Audit actual cache directives and installed Next.js handler types to confirm
      `cacheHandlers.default` scope and record that legacy, remote/named and private handlers remain out
      of scope.

## 2. Dependency, Environment and Valkey Service

- [x] 2.1 Install exact `iovalkey@0.4.0` with npm and update `package-lock.json`, verifying Node.js
      24 and Alpine compatibility without adding another package manager.
- [x] 2.2 Add validated server-only Valkey URL, deployment namespace, maximum TTL, maximum entry
      bytes and disabled-by-default probe settings to env schemas, examples and the Vitest env allowlist.
- [x] 2.3 Thread the new required values through the prerequisite Docker build/runtime contract and
      Compose env template without exposing credentials as `NEXT_PUBLIC_*`, image args or logs.
- [x] 2.4 Add a digest-pinned internal Valkey service with `PING` healthcheck, no published port or
      data volume, disabled RDB/AOF, configurable maxmemory/headroom and `volatile-ttl` eviction.
- [x] 2.5 Make both Next.js replicas wait for initial healthy Valkey and validate normalized dev/prod
      Compose models, including a negative health/startup case.

## 3. Cache Handler Core

- [x] 3.1 Define the server-only handler types, namespace/key hashing and versioned entry/tag storage
      model without importing Next.js internal runtime implementation code.
- [x] 3.2 Implement and unit-test the length-prefixed metadata/raw-stream codec, including multi-chunk
      round trips, version/metadata validation, truncation, stream errors and maximum-size rejection.
- [x] 3.3 Implement a singleton lazy iovalkey client with bounded connect/retry/offline-queue behavior
      and sanitized, rate-limited error reporting.
- [x] 3.4 Implement `set` with pending-entry awaiting, process-local pending tracking, complete stream
      buffering, atomic TTL write and fail-safe handling of oversize/partial/backend errors.
- [x] 3.5 Implement `get` with pending-set waiting, envelope validation, semantic expiration,
      explicit/soft tag checks, stale result signaling, stream reconstruction and corrupt-key cleanup.
- [x] 3.6 Implement `getExpiration`/`refreshTags` direct-read semantics and atomic `updateTags` for
      immediate and profiled stale/expire timestamps with marker TTL longer than every stored entry.

## 4. Next.js and Observability Integration

- [x] 4.1 Configure an ESM-safe `cacheHandlers.default` path in `next.config.ts` without setting the
      singular or private handler contracts.
- [x] 4.2 Add a production-build phase no-op/miss path so `next build` never requires a reachable
      Valkey while keeping the runtime handler configured.
- [x] 4.3 Add bounded-label cache operation/error/invalidation counters and latency metrics to the
      existing registry, avoiding cache key, tag, payload, URL or credential labels.
- [x] 4.4 Verify the handler, codec and iovalkey are traced into standalone output and load correctly
      from the final non-root production image without source mounts.

## 5. Tests Across Independent Instances

- [x] 5.1 Add focused unit tests for pending-set ordering, TTL capping, fresh/stale/expired decisions,
      corrupt values and the exact read/write/invalidation failure policy.
- [x] 5.2 Add Valkey integration tests with unique namespaces and two independent handler instances
      covering shared entries, explicit tags, soft tags, profiled invalidation, restart and outage.
- [x] 5.3 Add a route-local cache probe with three gates, constant-time token validation, bounded input,
      isolated tags and 404 behavior when disabled; perform security review before enabling test use.
- [x] 5.4 Add a test-only Compose overlay and npm automation that addresses replica indexes directly,
      uses random namespace/key/token values and guarantees cleanup on success or failure.
- [x] 5.5 Prove replica 1 generation is read unchanged by replica 2, invalidation on replica 1 forces
      replica 2 regeneration, and a recreated Next.js replica retains access to the shared value.
- [x] 5.6 Prove Valkey recreation creates a shared cold cache, read/write outage degrades to fresh
      rendering within timeout, and invalidation outage returns an explicit error.

## 6. Documentation

- [x] 6.1 Update `docs/cache-and-streaming.md` with plural-versus-singular scope, Valkey entry/tag
      semantics, bounded TTL/size, failure policy and remaining stampede/consistency limitations.
- [x] 6.2 Update environment/deployment docs with exact startup/test/stop commands, namespace
      rotation, memory/eviction/no-persistence policy, network isolation and external credential rules.
- [x] 6.3 Document cache metrics, per-replica registry limitations, cold restart behavior, rollback and
      the fact that the diagnostic probe is never a production API.

## 7. Final Verification

- [x] 7.1 Format only changed files and run focused unit/integration tests with a unique disposable
      namespace, confirming test cleanup does not flush unrelated Valkey data.
- [x] 7.2 Run `docker compose ... config --quiet` for dev, prod and test overlays, including missing-env,
      unpublished-port, healthcheck, memory and persistence assertions.
- [x] 7.3 Run the full two-replica matrix in development and final standalone production modes,
      inspect both replicas' metrics and confirm no credentials/cache payload appear in artifacts/logs.
- [x] 7.4 Run relevant `npm run fmt:check`, `npm run lint`, `npm run tsc`, `npm run build`, unit tests
      and standalone/browser E2E checks with fresh output.
- [x] 7.5 Review the final diff for prerequisite compatibility, server/client boundaries, generated
      files, secrets and unrelated working-tree changes; document any unverified external Valkey/HA
      risks separately.
