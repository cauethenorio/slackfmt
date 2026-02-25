# Workflow Restructuring

Split GitHub Actions workflows into reusable jobs with two entry points.

## Files

```
.github/workflows/
├── checks.yml           # on: pull_request
├── release.yml          # on: push to main
├── _lint.yml            # biome lint
├── _lint-rust.yml       # cargo fmt + clippy
├── _test.yml            # build core/cli + pnpm test
├── _build-native.yml    # build native bindings (5 targets)
└── _test-native.yml     # test native bindings (macOS/Windows/Linux matrices)
```

## Job graph

```
detect-changes (inline in both checks.yml and release.yml)
├── _lint.yml (always)
├── _test.yml (always)
├── _lint-rust.yml (if clipboard changed)
├── _build-native.yml (if clipboard changed)
│   └── _test-native.yml (depends on build-native)
└── release (release.yml only, depends on all above)
```

## Rules

- Reusable workflows prefixed with `_` to distinguish from entry points
- `detect-changes` stays inline — it's small and produces outputs consumed by conditional jobs
- Both `checks.yml` and `release.yml` call the same reusable jobs independently
- Release job only exists in `release.yml`, gated on all checks passing
