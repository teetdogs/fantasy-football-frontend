# Fantasy Football Frontend

A React + TypeScript + Plotly frontend for ESPN fantasy football draft strategy analysis.

## Features

- **Interactive Player Rankings** - Sortable table with ADP, projections, and custom scores
- **Tier Visualizer** - Heatmap view of players by position tier
- **Draft Board** - Mock draft board showing roster construction
- **Algorithm Tuning** - Real-time adjustment of ranking weights
- **Position Filtering** - View rankings by specific position (QB, RB, WR, TE, K, DEF)

## Quick Start

### Setup

```bash
npm install
```

### Run

```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

**Important**: The backend server must be running on `http://localhost:3001`

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
