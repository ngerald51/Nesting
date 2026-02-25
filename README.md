# AML Nesting Flow Simulator

A browser-based educational tool for building, visualising, and analysing AML (Anti-Money Laundering) transaction flow diagrams. Runs entirely in the browser — no server, no build step.

An educational tool for financial crime investigators to visualize and understand money laundering patterns through interactive simulation of transaction flows between entities.



### The Three AML Stages
| Stage | Color | Purpose |
|-------|-------|---------|
| **Placement** | Red `#F44336` | Introducing illicit funds into the financial system |
| **Layering** | Orange `#FF9800` | Complex transactions to obscure the origin |
| **Integration** | Green `#4CAF50` | Making laundered money appear legitimate |

### Quick Start (5 Steps)
1. Open `index.html` in Chrome / Firefox / Edge / Safari
2. Drag entity types from the left palette onto the canvas
3. Click a source entity, then a target entity to draw a transaction
4. Click **Analyse** to run nesting + risk + pattern detection
5. Use the timeline player to animate transaction flows step by step

### Toolbar Actions
`New` · `Save` · `Load` · `Export JSON` · `Export PDF` · `Analyse` · `Learn` · `Help`

### Canvas Controls
| Action | How |
|--------|-----|
| Pan | Drag empty canvas space |
| Zoom | Mouse scroll or zoom buttons (0.2× – 3.0×, step 0.15) |
| Fit to View | "Fit" button — pans/zooms to show all nodes |
| Select entity | Click node → populates Property Panel |
| Select transaction | Click connection line → populates Property Panel |
| Delete entity | Property Panel or keyboard; removes all linked transactions |

### All 20 Entity Types
| Icon | Entity | Base Risk |
|------|--------|-----------|
| 👤 | Originator | 30 |
| 💱 | Money Service Business | 55 |
| 🏪 | Cash Business | 70 |
| 🏢 | Shell Company | **90** |
| 👥 | Nominee Account | **85** |
| ₿ | Crypto Exchange | 60 |
| 📦 | Trade Company | 75 |
| 🏝️ | Offshore Trust | **88** |
| 💼 | Professional Service | 45 |
| 💎 | Precious Metals Dealer | 68 |
| 💻 | NPM FINTECH | 50 |
| 🎯 | Final Beneficiary | 30 |
| 🏠 | Real Estate | 65 |
| 🎰 | Casino | 72 |
| 📈 | Investment Fund | 58 |
| 🛒 | Merchant | 35 |
| 🏦 | Correspondent Bank | 20 |
| 🏛️ | Bank (Anchor) | **15** |
| 🔗 | Affiliate Entity | 40 |
| 🧑‍💼 | End Customer | 20 |

### Payment Methods
`wire_transfer` · `cash` · `crypto` · `check` · `trade`

### NPM FINTECH Business Models
`payment_institution` · `e_money` · `remittance` · `digital_wallet` · `open_banking`

---

## Nesting Analysis & Risk Scoring

### Nesting Analysis — Core Concept
Nesting = a bank (`hop 0`) providing services to entities through intermediaries. The further an entity is from a BANK anchor, the higher the CDD gap risk.

### BFS Hop Distance
```
seed: all entities where isBank = true  →  hop 0
Build undirected adjacency list from all transactions
Multi-source BFS outward from all seeds simultaneously
Entities unreachable from any BANK → hop ∞
```

| Hop | Meaning | Risk |
|-----|---------|------|
| 0 | BANK anchor | None |
| 1 | Direct respondent / NPM partner | Low |
| 2 | Nested FI — **CDD gap risk** | Medium |
| 3+ | **Double nesting** | Critical |
| ∞ | Unreachable (no BANK in graph) | N/A |

### Nesting Type Classification (priority order)
1. **impermissible** — any impermissible pair exists
2. **double** — any double-nesting chain (hop ≥ 3) exists
3. **affiliate** — any affiliate entity present
4. **primary** — BANK→NPM→Nested FI→End Customer path found
5. **null** — no nesting detected

### Impermissible Pairs (always blocked)
| Pair | Rule |
|------|------|
| NPM FINTECH ↔ Money Service Business | Always impermissible |
| Bank ↔ Money Service Business | Always impermissible |

> Check fires 500 ms after every `TRANSACTION_ADDED` event.
> Alert banner auto-dismisses after 8 seconds.

### Permissibility Assignment
| Condition | Status |
|-----------|--------|
| Endpoint of an impermissible pair | `impermissible` |
| In double-nesting chain, `sameGroupAmlCtf = false` | `impermissible` |
| In double-nesting chain, `sameGroupAmlCtf = true` | `permissible` *(F-10 exception)* |
| Entity type = `affiliate` | `review_required` |
| Otherwise | `permissible` |

### Connection Line Colors
| Color | Relationship |
|-------|-------------|
| `#607D8B` Grey | Default (no type) |
| `#2196F3` Blue | Active / animated |
| `#F44336` Red | Suspect / impermissible |
| `#1976D2` Dark Blue | Respondent |
| `#7B1FA2` Purple | Nested entity |
| `#388E3C` Green | Underlying customer |
| `#F57C00` Orange | Affiliate |

---

### Risk Scoring — Factor Weights (must sum to 1.0)
| Factor | Weight |
|--------|--------|
| Jurisdiction | **0.25** |
| Entity Type | **0.20** |
| Transaction Volume | **0.18** |
| Hop Distance | **0.15** |
| Network Centrality | **0.12** |
| Pattern Involvement | **0.10** |

### Jurisdiction Raw Score (FATF Rating)
`Compliant=30` · `Enhanced=50` · `Greylist=70` · `Blacklisted=90` · `Unknown=50`

### Hop Distance Raw Score
`Hop 0 → 0` · `Hop 1 → 20` · `Hop 2 → 55` · `Hop 3+ → 90` · `∞/null → 0`

### Transaction Volume Points
| Condition | +Points |
|-----------|---------|
| Total flow > $10M | +30 |
| Total flow > $1M | +20 |
| Total flow > $100K | +10 |
| 3+ structuring txns* | +35 |
| 1+ structuring txns* | +15 |
| >60% round amounts | +15 |
| >20 transactions | +20 |
| >10 transactions | +10 |

*Structuring: amount in **[$9,500, $10,000)** — within 5% of $10K threshold

### Network Centrality Points
`>10 connections +30` · `>5 connections +15` · `Intermediary (in+out) +20` · `Betweenness >0.3 +30` · `Betweenness >0.1 +15`

### Risk Level Bands
| Score | Level | Color |
|-------|-------|-------|
| 0–29 | Low | `#4CAF50` Green |
| 30–54 | Medium | `#FFEB3B` Yellow |
| 55–74 | High | `#FF5722` Orange-Red |
| 75–100 | **Critical** | `#B71C1C` Dark Red |

> **Overall score** = mean of all entity scores, rounded to nearest integer.

---

## Patterns, Data Models & Architecture

### 13 Detected Patterns

| # | Pattern | Key Threshold | Severity |
|---|---------|--------------|----------|
| P-01 | **Smurfing** | ≥3 txns in [$9,500, $10,000) within 72 h | Critical (≥6), High |
| P-02 | **Round-Tripping** | Cycle ≤8 hops, ≥3 entities, loss ≤30% | Critical (<10% loss), High |
| P-03 | **Rapid Movement** | ≤1 h gaps, ≥3 entities in chain | High (≥5 txns), Medium |
| P-04 | **Complex Layering** | ≥5 entities, complexity score ≥50 | Critical (≥80), High |
| P-05 | **Trade-Based ML** | Trade company + suspicious pricing | High |
| P-06 | **Cuckoo Smurfing** | ≥3 distinct sources, ≥3 sub-threshold txns in 72 h | High |
| P-07 | **Crypto Mixing** | ≥2 inputs, ≥2 outputs, <15% in/out imbalance | Medium |
| P-08 | **Nesting Risk** | ≥2 nesting-type entities connected | Critical (≥3), High |
| P-09 | **Primary Nesting** | BANK→NPM→Nested FI→End Customer path | Medium |
| P-10 | **Double Nesting** | hop ≥ 3 chains detected (intermediaries only) | **Critical** |
| P-11 | **Impermissible Nesting** | NPM/Bank ↔ MSB pair | **Critical** |
| P-12 | **Affiliate Nesting** | Affiliate entities present | High |
| P-13 | **Multi-NPM Cluster** | 2+ NPMs sharing downstream entity ≤2 hops | High |

> Deduplication: `type + sorted entity set` — first occurrence kept.

---

### Data Models

**Entity (key fields)**
```
id, type, name, jurisdiction (ISO), amlStage
position { x, y }
riskScore (0–100), riskLevel, riskFactors[]
isBank, hopDistance, cddGap, sameGroupAmlCtf
npmBusinessModel, permissibilityStatus
connections { incoming[], outgoing[] }
```

**Transaction (key fields)**
```
id, sourceId, targetId, sequence
amount, currency (ISO 4217), timestamp (ms epoch)
method, description
crossBorder, onBehalf, onBehalfOf (entityId)
relationshipType, flags[], suspicious, suspicionReasons[]
riskScore (0–100)
```

**Simulation (key fields)**
```
id, name, entities (Map), transactions (Map)
metadata {
  totalAmount, detectedPatterns[], overallRiskScore
  nestingAnalysis { nestingType, hopMap, impermissiblePairs,
                    doubleNestingChains, primaryPaths,
                    affiliateFlow, multiNpmClusters }
}
canvasState { zoom, panX, panY }
createdAt, updatedAt, version: 1
```

---

### Analysis Pipeline (event order)
```
User clicks Analyse
  → ANALYSIS_STARTED
  → runNestingAnalysis()
      → NESTING_ANALYSIS_COMPLETED
      → DOUBLE_NESTING_DETECTED (if chains found)
  → detectAll()     ← 13 pattern detection passes
  → scoreAll()      ← risk scoring per entity
  → ANALYSIS_COMPLETED  { patterns, riskProfiles, overallScore }
```

### Key Events (EventBus — no direct imports between components)
| Event | Trigger |
|-------|---------|
| `entity:added/removed/updated/selected/moved` | Canvas node actions |
| `transaction:added/removed/updated/selected` | Connection line actions |
| `analysis:started/completed` | Analyse button |
| `nesting:impermissible:detected` | 500 ms after TRANSACTION_ADDED |
| `nesting:double:detected` | Double-nesting chain found |
| `nesting:bank:changed` | isBank checkbox toggled |
| `timeline:play/pause/step` | Timeline player controls |
| `simulation:loaded/saved/cleared` | Storage operations |

---

### Export & Persistence
| Feature | Detail |
|---------|--------|
| Auto-save | localStorage, debounced 2 s after any change |
| Max saved simulations | 50 |
| Compression | lz-string enabled by default |
| JSON export | Full snapshot: entities + transactions + metadata + canvas state |
| PDF export | A4 landscape: cover stats, canvas screenshot, entity table, nesting section |
| Graceful degradation | If localStorage unavailable, auto-save silently disables; manual export still works |

---

### Timeline Player
| Control | Behaviour |
|---------|-----------|
| Play / Pause / Stop | Chronological transaction order |
| Step Back / Forward | One transaction at a time |
| Scrubber | Seek to any transaction index |
| Speed | 0.5× · 1× · 2× · 4× |
| Animation | Coloured particle travels source → target, **1,800 ms** per txn at 1× |

---

### Performance & Compatibility
- **Target:** 50 entities / 100 transactions → analysis completes in < 2 s
- **Canvas:** Smooth pan/zoom up to 100 entities / 200 connections
- **Browsers:** Chrome, Firefox, Edge, Safari (latest)
- **No build step:** Native ES modules (`<script type="module">`)
- **No backend:** All data stays in the user's browser

---

*AML Nesting Flow Simulator v1.0 — Educational use only. Not for production financial crime detection.*
