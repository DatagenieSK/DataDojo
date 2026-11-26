# DataDojo Architecture & Design Decisions

This document records technical and design decisions made for DataDojo.

## 1. Pinned Pyodide Version
- **Decision:** Pin Pyodide to version `0.29.5` loaded from jsDelivr (`https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.js`).
- **Rationale:** Meets the requirement for the newest stable release at least 14 days old (v0.29.5 was published on 2026-09-16, well over 14 days ago). Loaded strictly inside a dedicated Web Worker to prevent UI lockup during long computations or infinite loops.

## 2. Code Editor: Enhanced Lightweight Accessible Editor
- **Decision:** Implement a custom accessible editor using an enhanced monospace textarea with an overlaid line-number gutter, auto-indent, Tab key handling (inserts 2 spaces), and keyboard shortcuts (Ctrl/Cmd + Enter to run).
- **Rationale:** Avoids heavyweight client-side bundle dependencies (CodeMirror/Monaco), ensures immediate sub-360px mobile usability, renders fast even on low-end phones, and guarantees standard assistive technology support.

## 3. Solution Protection
- **Decision:** In `dojo-exercise` blocks, the `%% solution` section is parsed during build / site rendering and saved as an external JSON asset (`docs/assets/solutions/<id>.json`) rather than inlined in the page DOM.
- **Rationale:** Prevents learners from accidentally spoiling answers by viewing page source or inspecting elements, while allowing lazy loading when the hint ladder reaches "Show solution".

## 4. Single Shared Test Assertion Runner
- **Decision:** Maintain `docs/assets/py/dojo_helpers.py` as the single source of truth for exercise testing assertions (`check`, `stdout_contains`, `stdout_equals`, `var`, `has_var`, `calls`). MkDocs publishes this file as a static asset.
- **Rationale:** The CPython CI validator loads this exact file directly, and the browser Web Worker fetches and imports this same published file into the Pyodide filesystem. This eliminates any test parity drift between local learning and CI gating.

## 5. Storage & Privacy
- **Decision:** Store progress under key `datadojo:v1`. All storage interactions are isolated behind a safe wrapper that falls back to in-memory state with a user notice when localStorage is blocked (e.g. private browsing).
- **Rationale:** Zero tracking, zero cookies, full privacy compliance, and clean migration support.
