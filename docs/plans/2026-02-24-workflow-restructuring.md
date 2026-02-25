# Workflow Restructuring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split monolithic CI workflow into reusable workflow files with two entry points (checks + release).

**Architecture:** Extract each job (lint, lint-rust, test, build-native, test-native) into underscore-prefixed reusable workflows (`_lint.yml`, etc.). Two entry-point workflows (`checks.yml`, `release.yml`) call the same reusable jobs. `detect-changes` stays inline in both entry points.

**Tech Stack:** GitHub Actions reusable workflows (`workflow_call`)

---

### Task 1: Create `_lint.yml`

**Files:**
- Create: `.github/workflows/_lint.yml`

**Step 1: Create the reusable workflow**

Extract the lint job from `checks.yml` into a `workflow_call` workflow:

```yaml
name: Lint
on:
  workflow_call:
jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Setup node
        uses: actions/setup-node@v6
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
      - name: Install dependencies
        run: pnpm install
      - name: Biome
        run: pnpm lint:biome
```

**Step 2: Commit**

```bash
git add .github/workflows/_lint.yml
git commit -m "chore(ci): extract lint to reusable workflow"
```

---

### Task 2: Create `_lint-rust.yml`

**Files:**
- Create: `.github/workflows/_lint-rust.yml`

**Step 1: Create the reusable workflow**

Extract the lint-rust job. Note: the `if` conditional stays in the caller, not here.

```yaml
name: Lint Rust
on:
  workflow_call:
jobs:
  lint-rust:
    name: Lint Rust
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt
      - name: Cargo fmt
        run: cargo fmt --manifest-path packages/clipboard/Cargo.toml -- --check
      - name: Clippy
        run: cargo clippy --manifest-path packages/clipboard/Cargo.toml
```

**Step 2: Commit**

```bash
git add .github/workflows/_lint-rust.yml
git commit -m "chore(ci): extract lint-rust to reusable workflow"
```

---

### Task 3: Create `_test.yml`

**Files:**
- Create: `.github/workflows/_test.yml`

**Step 1: Create the reusable workflow**

```yaml
name: Test
on:
  workflow_call:
jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Setup node
        uses: actions/setup-node@v6
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
      - name: Install dependencies
        run: pnpm install
      - name: Build packages
        run: pnpm -r --filter='@slackfmt/core' --filter='@slackfmt/cli' run build
      - name: Test
        run: pnpm test
```

**Step 2: Commit**

```bash
git add .github/workflows/_test.yml
git commit -m "chore(ci): extract test to reusable workflow"
```

---

### Task 4: Rename `build-native.yml` to `_build-native.yml`

**Files:**
- Rename: `.github/workflows/build-native.yml` → `.github/workflows/_build-native.yml`

**Step 1: Rename the file**

```bash
git mv .github/workflows/build-native.yml .github/workflows/_build-native.yml
```

**Step 2: Commit**

```bash
git commit -m "chore(ci): rename build-native to _build-native"
```

---

### Task 5: Create `_test-native.yml`

**Files:**
- Create: `.github/workflows/_test-native.yml`

**Step 1: Create the reusable workflow**

Combine the two test-native jobs (macOS/Windows and Linux) into one workflow. Both jobs need artifacts from `_build-native.yml`, but since they're in a called workflow, they access artifacts from the same workflow run.

```yaml
name: Test Native
on:
  workflow_call:
jobs:
  test-macos-windows:
    name: Test bindings on ${{ matrix.settings.target }} - node@${{ matrix.node }}
    strategy:
      fail-fast: false
      matrix:
        settings:
          - host: windows-latest
            target: x86_64-pc-windows-msvc
            architecture: x64
          - host: macos-latest
            target: aarch64-apple-darwin
            architecture: arm64
          - host: macos-latest
            target: x86_64-apple-darwin
            architecture: x64
        node:
          - "20"
          - "22"
    runs-on: ${{ matrix.settings.host }}
    steps:
      - uses: actions/checkout@v6
      - name: Setup node
        uses: actions/setup-node@v6
        with:
          node-version: ${{ matrix.node }}
          architecture: ${{ matrix.settings.architecture }}
      - uses: pnpm/action-setup@v4
      - name: Install dependencies
        run: pnpm install
      - name: Download artifacts
        uses: actions/download-artifact@v7
        with:
          name: bindings-${{ matrix.settings.target }}
          path: packages/clipboard
      - name: Test bindings
        run: pnpm test

  test-linux:
    name: Test ${{ matrix.target }} - node@${{ matrix.node }}
    strategy:
      fail-fast: false
      matrix:
        target:
          - x86_64-unknown-linux-gnu
          - aarch64-unknown-linux-gnu
        node:
          - "20"
          - "22"
    runs-on: ${{ contains(matrix.target, 'aarch64') && 'ubuntu-24.04-arm' || 'ubuntu-latest' }}
    steps:
      - uses: actions/checkout@v6
      - name: Setup node
        uses: actions/setup-node@v6
        with:
          node-version: ${{ matrix.node }}
      - uses: pnpm/action-setup@v4
      - name: Output docker params
        id: docker
        run: |
          node -e "
            if ('${{ matrix.target }}'.startsWith('aarch64')) {
              console.log('PLATFORM=linux/arm64')
            } else {
              console.log('PLATFORM=linux/amd64')
            }
          " >> $GITHUB_OUTPUT
          node -e "
            if ('${{ matrix.target }}'.endsWith('-musl')) {
              console.log('IMAGE=node:${{ matrix.node }}-alpine')
            } else {
              console.log('IMAGE=node:${{ matrix.node }}-slim')
            }
          " >> $GITHUB_OUTPUT
      - name: Install dependencies
        run: pnpm install
      - name: Download artifacts
        uses: actions/download-artifact@v7
        with:
          name: bindings-${{ matrix.target }}
          path: packages/clipboard
      - name: Test bindings
        uses: tj-actions/docker-run@v2
        with:
          image: ${{ steps.docker.outputs.IMAGE }}
          name: test-bindings-${{ matrix.target }}
          options: "-v ${{ github.workspace }}:${{ github.workspace }} -w ${{ github.workspace }} --platform ${{ steps.docker.outputs.PLATFORM }}"
          args: sh -c "corepack enable && pnpm test"
```

**Step 2: Commit**

```bash
git add .github/workflows/_test-native.yml
git commit -m "chore(ci): extract test-native to reusable workflow"
```

---

### Task 6: Rewrite `checks.yml`

**Files:**
- Modify: `.github/workflows/checks.yml`

**Step 1: Replace checks.yml with entry point that calls reusable workflows**

```yaml
name: Checks

on:
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  detect-changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      clipboard: ${{ steps.filter.outputs.clipboard }}
    steps:
      - uses: actions/checkout@v6
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            clipboard:
              - 'packages/clipboard/**'

  lint:
    uses: ./.github/workflows/_lint.yml

  lint-rust:
    needs: detect-changes
    if: needs.detect-changes.outputs.clipboard == 'true'
    uses: ./.github/workflows/_lint-rust.yml

  test:
    uses: ./.github/workflows/_test.yml

  build-native:
    needs: detect-changes
    if: needs.detect-changes.outputs.clipboard == 'true'
    uses: ./.github/workflows/_build-native.yml

  test-native:
    needs: build-native
    uses: ./.github/workflows/_test-native.yml
```

**Step 2: Commit**

```bash
git add .github/workflows/checks.yml
git commit -m "chore(ci): rewrite checks as entry point calling reusable workflows"
```

---

### Task 7: Rewrite `release.yml`

**Files:**
- Modify: `.github/workflows/release.yml`

**Step 1: Replace release.yml with entry point that calls same reusable workflows + release job**

```yaml
name: Release

on:
  push:
    branches:
      - main
    tags-ignore:
      - "**"
    paths-ignore:
      - "**/*.md"
      - LICENSE
      - "**/*.gitignore"
      - .editorconfig

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  detect-changes:
    name: Detect changes
    runs-on: ubuntu-latest
    outputs:
      clipboard: ${{ steps.filter.outputs.clipboard }}
    steps:
      - uses: actions/checkout@v6
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            clipboard:
              - 'packages/clipboard/**'

  lint:
    uses: ./.github/workflows/_lint.yml

  lint-rust:
    needs: detect-changes
    if: needs.detect-changes.outputs.clipboard == 'true'
    uses: ./.github/workflows/_lint-rust.yml

  test:
    uses: ./.github/workflows/_test.yml

  build-native:
    needs: detect-changes
    if: needs.detect-changes.outputs.clipboard == 'true'
    uses: ./.github/workflows/_build-native.yml

  test-native:
    needs: build-native
    uses: ./.github/workflows/_test-native.yml

  release:
    name: Release
    if: >-
      always() &&
      !contains(needs.*.result, 'failure')
    needs:
      - lint
      - lint-rust
      - test
      - build-native
      - test-native
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - name: Setup node
        uses: actions/setup-node@v6
        with:
          node-version: 22
      - uses: pnpm/action-setup@v4
      - name: Install dependencies
        run: pnpm install
      - name: Create npm dirs
        if: needs.build-native.result == 'success'
        run: pnpm --filter @slackfmt/clipboard exec napi create-npm-dirs
      - name: Download all artifacts
        if: needs.build-native.result == 'success'
        uses: actions/download-artifact@v7
        with:
          path: packages/clipboard/artifacts
      - name: Move artifacts
        if: needs.build-native.result == 'success'
        run: pnpm --filter @slackfmt/clipboard artifacts
      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm publish-packages
          version: pnpm version-packages
          title: "Release packages"
          commit: "Version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

**Step 2: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "chore(ci): rewrite release as entry point with same checks + release job"
```

---

### Task 8: Delete old `deploy-web.yml` path filter reference (if needed) and final cleanup

**Step 1: Verify `deploy-web.yml` is unaffected**

The `deploy-web.yml` workflow is independent and should not need changes.

**Step 2: Verify all files are correct**

```bash
ls .github/workflows/
# Expected: _build-native.yml  _lint-rust.yml  _lint.yml  _test-native.yml  _test.yml  checks.yml  deploy-web.yml  release.yml
```

**Step 3: Final commit with all cleanup**

```bash
git add -A .github/workflows/
git commit -m "chore(ci): complete workflow restructuring"
```
