# Product Requirements Document
## AML Nesting Flow Simulator
**Version:** 1.0
**Date:** 2026-02-25
**Status:** Current

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Target Users](#3-target-users)
4. [Functional Requirements](#4-functional-requirements)
   - 4.1 Canvas & Diagram Builder
   - 4.2 Entity Management
   - 4.3 Transaction Management
   - 4.4 Nesting Analysis Engine
   - 4.5 Risk Scoring Engine
   - 4.6 Pattern Detection Engine
   - 4.7 Property Panel
   - 4.8 Nesting Summary Panel
   - 4.9 Timeline Player
   - 4.10 Export & Persistence
   - 4.11 Educational Content
5. [Data Models](#5-data-models)
   - 5.1 Entity
   - 5.2 Transaction
   - 5.3 Simulation
6. [Reference Data](#6-reference-data)
   - 6.1 Entity Types
   - 6.2 Relationship Types
   - 6.3 Payment Methods
   - 6.4 NPM Business Models
7. [Algorithms](#7-algorithms)
   - 7.1 Nesting Analysis
   - 7.2 Risk Scoring
   - 7.3 Pattern Detection
8. [Events System](#8-events-system)
9. [Configuration](#9-configuration)
10. [Non-Functional Requirements](#10-non-functional-requirements)

---

## 1. Overview

The **AML Nesting Flow Simulator** is an interactive, browser-based tool for building, visualising, and analysing Anti-Money Laundering (AML) transaction flow scenarios. Users construct diagrams by placing financial entities on a canvas and drawing transaction connections between them. The app then runs a suite of algorithms — nesting analysis, risk scoring, and pattern detection — to surface regulatory risks, classify nesting structures, and highlight suspicious patterns.

The application runs entirely in the browser with no backend and no build step (pure ES modules). State persists to `localStorage` with optional lz-string compression.

---

## 2. Goals & Non-Goals

### Goals
- Provide an interactive canvas for building AML scenario diagrams
- Analyse correspondent-banking nesting chains to identify CDD gaps, impermissible relationships, and double nesting
- Compute multi-factor risk scores per entity
- Detect 13 AML typology patterns automatically
- Animate transaction timelines for step-by-step flow analysis
- Export diagrams and analysis results as PDF and JSON
- Educate users on AML patterns and nesting regulation

### Non-Goals
- Live connection to real transaction data or core banking systems
- Backend storage, user accounts, or multi-user collaboration
- Legal advice or formal regulatory reporting
- Support for non-browser environments

---

## 3. Target Users

| User | Primary Use Case |
|------|-----------------|
| Compliance Officers | Build scenario diagrams to test AML controls and identify nesting risks |
| AML Analysts | Explore typology patterns and learn detection indicators |
| Regulatory Trainers | Create worked examples for classroom or e-learning |
| Financial Intelligence Units | Reconstruct and analyse known money laundering schemes |
| Banking / Fintech Staff | Understand nesting permissibility rules for correspondent relationships |

---

## 4. Functional Requirements

### 4.1 Canvas & Diagram Builder

| ID | Requirement |
|----|-------------|
| C-01 | Canvas shall be a 5,000 × 5,000 virtual surface with a 20 px grid |
| C-02 | Users shall pan the canvas by dragging empty space |
| C-03 | Users shall zoom with dedicated buttons or mouse scroll; zoom range 0.2× – 3.0×, step 0.15 |
| C-04 | Toolbar shall provide: New, Save, Load, Export JSON, Export PDF, Analyse, Learn, Help |
| C-05 | Canvas header shall display an editable simulation name and live entity / transaction counts |
| C-06 | Canvas shall display colour-coded banner overlays when critical alerts fire (impermissible pair, double nesting) |
| C-07 | "Fit to View" button shall pan and zoom to show all nodes |
| C-08 | jsPlumb shall render all connection lines with smart anchor auto-routing |
| C-09 | Connection lines shall be coloured by relationship type (see §6.2) |

### 4.2 Entity Management

| ID | Requirement |
|----|-------------|
| E-01 | Left sidebar (Entity Palette) shall list all 20 entity types, each with icon, name, and description |
| E-02 | Users shall place entities by drag-and-drop from palette to canvas, or by double-clicking a palette item (places at canvas centre) |
| E-03 | Each node shall display: icon, name, type, jurisdiction, AML stage badge, and risk score (post-analysis) |
| E-04 | Clicking a node shall select it and populate the Property Panel |
| E-05 | Users shall delete selected entities via the Property Panel or keyboard |
| E-06 | Removing an entity shall automatically remove all associated transactions |

### 4.3 Transaction Management

| ID | Requirement |
|----|-------------|
| T-01 | Users shall draw transactions by clicking a source node, then a target node |
| T-02 | Transactions shall carry: amount, currency, timestamp, payment method, description, cross-border flag, on-behalf flag, and relationship type |
| T-03 | Selecting a transaction connection line shall populate the Property Panel with transaction fields |
| T-04 | Within 500 ms of a transaction being added, the system shall check for impermissible pairs (see §7.1.2) and emit `nesting:impermissible:detected` if found |
| T-05 | Transactions involved in detected patterns or impermissible rules shall be visually highlighted on the canvas |

### 4.4 Nesting Analysis Engine

| ID | Requirement |
|----|-------------|
| N-01 | Any entity may be designated a BANK anchor by setting `isBank = true` in the Property Panel |
| N-02 | The engine shall compute BFS hop distances for all entities outward from all BANK anchors simultaneously |
| N-03 | Entities unreachable from any BANK anchor shall receive hop distance `∞` |
| N-04 | The engine shall detect impermissible pairs on every transaction graph: NPM FINTECH ↔ Money Service Business and Bank ↔ Money Service Business |
| N-05 | The engine shall identify double-nesting chains (connected subgraphs of entities with hop ≥ 3) |
| N-06 | The engine shall detect primary nesting paths of form BANK (hop 0) → NPM (hop 1) → Nested FI (hop 2) → End Customer (hop 3) |
| N-07 | The engine shall detect affiliate flows (connected components containing affiliate-type entities) |
| N-08 | The engine shall detect multi-NPM clusters (2+ NPM entities sharing a downstream entity within 2 directed hops) |
| N-09 | The engine shall assign a permissibility status to every entity: `permissible`, `impermissible`, or `review_required` |
| N-10 | Entities in double-nesting chains where `sameGroupAmlCtf = true` shall receive `permissible` status (F-10 exception) |
| N-11 | The nesting type of the simulation shall be classified in priority order: `impermissible` > `double` > `affiliate` > `primary` > `null` |
| N-12 | The full nesting result shall be stored in `simulation.metadata.nestingAnalysis` |

### 4.5 Risk Scoring Engine

| ID | Requirement |
|----|-------------|
| R-01 | The engine shall produce a risk score (0–100) for every entity using six weighted factors (see §7.2) |
| R-02 | Risk levels shall be banded: Low (0–30), Medium (30–55), High (55–75), Critical (75–100) |
| R-03 | The simulation overall risk score shall be the mean of all entity scores, rounded to the nearest integer |
| R-04 | Each entity risk profile shall include a per-factor breakdown with category name, contribution score, and description string |
| R-05 | The top 5 riskiest entities shall be displayed in the Property Panel's risk analysis section |

### 4.6 Pattern Detection Engine

| ID | Requirement |
|----|-------------|
| P-01 | The engine shall detect all 13 patterns listed in §7.3 |
| P-02 | Each detected pattern shall include: type, severity, affected entity IDs, affected transaction IDs, and a plain-language description |
| P-03 | Patterns shall be deduplicated (same type + same entity set counts once) |
| P-04 | Pattern cards in the Property Panel shall provide: icon, name, severity badge, description, Highlight button, and Learn More button |
| P-05 | Highlight button shall visually illuminate all involved nodes and lines for 4 seconds |
| P-06 | Learn More button shall open an educational modal covering: indicators, real-world examples, red flags, prevention, and legal consequences |

### 4.7 Property Panel

| ID | Requirement |
|----|-------------|
| PP-01 | Panel shall be context-sensitive: show entity fields when an entity is selected, transaction fields when a transaction is selected |
| PP-02 | **Entity fields:** Name, Type, Jurisdiction, Notes; post-analysis: risk meter (0–100), risk level label, factor breakdown |
| PP-03 | **Nesting configuration fields:** "Is BANK Anchor" checkbox, "Same Group AML/CTF (F-10)" checkbox, NPM Business Model dropdown (npm_fintech only), Hop Distance (read-only), Permissibility Status (read-only) |
| PP-04 | **Transaction fields:** From/To (read-only), Amount, Currency, Timestamp, Payment Method, Description, Cross-Border flag, On-Behalf flag + entity selector, Relationship Type |
| PP-05 | Panel shall always show the overall risk score and top-5 riskiest entity list, regardless of selection |
| PP-06 | Panel shall always show the detected pattern list below the risk section |

### 4.8 Nesting Summary Panel

| ID | Requirement |
|----|-------------|
| NS-01 | Panel shall display the simulation's nesting type badge |
| NS-02 | Panel shall show a hop distribution table: hop 0, 1, 2, 3+, with entity counts and risk labels per hop |
| NS-03 | Panel shall show counts for: impermissible pairs, CDD gap entities (hop ≥ 2 and finite), double-nesting chains, and multi-NPM clusters |
| NS-04 | When affiliate entities are present and unconfirmed, panel shall show an affiliate due-diligence confirmation section listing each pending affiliate |
| NS-05 | Canvas shall display a dismissible banner for impermissible pair alerts (auto-dismiss after 8 seconds) |

### 4.9 Timeline Player

| ID | Requirement |
|----|-------------|
| TL-01 | Player shall animate transactions in chronological order (sorted by timestamp, then sequence) |
| TL-02 | Controls: Play, Pause, Stop, Step Backward, Step Forward |
| TL-03 | Speed selector shall support 0.5×, 1×, 2×, 4× |
| TL-04 | A range slider (scrubber) shall allow seeking to any transaction |
| TL-05 | A counter shall show current / total transactions (e.g., "5 / 15 transactions") |
| TL-06 | Each animating transaction shall show a coloured particle travelling along the connection line from source to target |
| TL-07 | Default animation duration shall be 1,800 ms per transaction at 1× speed |

### 4.10 Export & Persistence

| ID | Requirement |
|----|-------------|
| X-01 | **JSON export** shall save a full simulation snapshot (entities, transactions, metadata, canvas state) to a downloadable `.json` file |
| X-02 | **JSON import** shall restore a simulation from an uploaded file or pasted JSON |
| X-03 | **PDF export** shall produce an A4 landscape document with: cover page (stats summary), canvas screenshot, entity details table, and nesting analysis section |
| X-04 | **Auto-save** shall write to `localStorage` 2 seconds after any change, debounced |
| X-05 | `localStorage` shall hold a maximum of 50 saved simulations, with lz-string compression enabled |
| X-06 | Load modal shall list all saved simulations and accept file upload |

### 4.11 Educational Content

| ID | Requirement |
|----|-------------|
| ED-01 | Help modal shall include: Getting Started (5 steps), Entity Types reference, Pattern Detection overview |
| ED-02 | Learn modal shall cover: canvas controls, entity management, transaction lines, property panel, risk analysis, pattern detection (8 pattern descriptions), simulation management, timeline player |
| ED-03 | Each pattern shall have an individual Learn More modal with indicators, real-world examples, red flags, prevention strategies, and legal consequences |

---

## 5. Data Models

### 5.1 Entity

```
Entity {
  // Identity
  id                  string          unique identifier
  type                string          entity type ID (see §6.1)
  name                string          user-editable display name

  // Properties
  jurisdiction        string          ISO country code
  amlStage            string|null     'placement' | 'layering' | 'integration' | null
  position            { x, y }        canvas coordinates
  metadata            object          registrationDate, owner, businessType, custom fields

  // Risk Analysis (populated after Analyse)
  riskScore           number 0–100
  riskLevel           string          'low' | 'medium' | 'high' | 'critical'
  riskFactors         array           [{ category, contribution, description }]

  // Connections
  connections.incoming  string[]      transaction IDs
  connections.outgoing  string[]      transaction IDs

  // Nesting Analysis (populated after Analyse)
  isBank              boolean         BANK anchor designation
  hopDistance         number|null     BFS distance from nearest BANK anchor; null = unreachable
  cddGap              boolean         true if hopDistance >= 2 and finite
  sameGroupAmlCtf     boolean         F-10 exception flag
  npmBusinessModel    string|null     npm_fintech only (see §6.4)
  permissibilityStatus string|null    'permissible' | 'impermissible' | 'review_required'
  nestingRole         string|null     reserved

  // UI State
  selected            boolean
  highlighted         boolean
}
```

### 5.2 Transaction

```
Transaction {
  // Identity
  id                  string
  sourceId            string          entity ID
  targetId            string          entity ID
  sequence            number          order in timeline

  // Properties
  amount              number
  currency            string          ISO 4217 (default 'USD')
  timestamp           number          ms since epoch
  method              string          payment method (see §6.3)
  description         string

  // Flags
  crossBorder         boolean
  onBehalf            boolean
  onBehalfOf          string|null     entity ID
  flags               string[]        e.g. ['impermissible', 'suspicious']

  // Nesting
  relationshipType    string|null     see §6.2

  // Risk Analysis (populated after Analyse)
  suspicious          boolean
  suspicionReasons    string[]
  riskScore           number 0–100
  animationDuration   number          ms (default 2000)

  // UI State
  highlighted         boolean
}
```

### 5.3 Simulation

```
Simulation {
  id                  string
  name                string
  description         string
  entities            Map<entityId, Entity>
  transactions        Map<txId, Transaction>
  metadata {
    totalAmount           number
    timelineStart         number|null    ms since epoch
    timelineEnd           number|null    ms since epoch
    detectedPatterns      Pattern[]
    overallRiskScore      number 0–100
    tags                  string[]
    nestingAnalysis       NestingResult|null
  }
  canvasState {
    zoom                  number
    panX                  number
    panY                  number
  }
  createdAt           number
  updatedAt           number
  version             1
}
```

---

## 6. Reference Data

### 6.1 Entity Types

| ID | Display Name | Icon | Base Risk | AML Stage |
|----|-------------|------|-----------|-----------|
| originator | Originator | 👤 | 30 | placement |
| shell_company | Shell Company | 🏢 | 90 | layering |
| correspondent_bank | Correspondent Bank | 🏦 | 20 | — |
| nominee_account | Nominee Account | 👥 | 85 | layering |
| crypto_exchange | Crypto Exchange | ₿ | 60 | layering |
| cash_intensive_business | Cash Business | 🏪 | 70 | integration |
| final_beneficiary | Final Beneficiary | 🎯 | 30 | integration |
| trade_company | Trade Company | 📦 | 75 | layering |
| real_estate | Real Estate | 🏠 | 65 | integration |
| offshore_trust | Offshore Trust | 🏝️ | 88 | layering |
| money_service_business | Money Service Business | 💱 | 55 | placement |
| professional_service | Professional Service Provider | 💼 | 45 | layering |
| casino | Casino | 🎰 | 72 | integration |
| precious_metals | Precious Metals Dealer | 💎 | 68 | layering |
| investment_fund | Investment Fund | 📈 | 58 | integration |
| merchant | Merchant | 🛒 | 35 | integration |
| npm_fintech | NPM FINTECH | 💻 | 50 | layering |
| bank | Bank (Anchor) | 🏛️ | 15 | — |
| affiliate | Affiliate Entity | 🔗 | 40 | — |
| end_customer | End Customer | 🧑‍💼 | 20 | — |

### 6.2 Relationship Types

| Value | Description | Connection Colour |
|-------|-------------|-------------------|
| respondent | Correspondent banking relationship | `#1976D2` (blue) |
| nested_entity | Nested FI within nesting chain | `#7B1FA2` (purple) |
| underlying_customer | End customer at distal hop | `#388E3C` (green) |
| affiliate | Affiliate entity relationship | `#F57C00` (orange) |
| (default) | No relationship type set | `#607D8B` (grey) |

### 6.3 Payment Methods

| Value | Display |
|-------|---------|
| wire_transfer | Wire Transfer |
| cash | Cash |
| crypto | Crypto |
| check | Check |
| trade | Trade Invoice |

### 6.4 NPM Business Models (npm_fintech only)

| Value | Display |
|-------|---------|
| payment_institution | Payment Institution |
| e_money | E-Money |
| remittance | Remittance |
| digital_wallet | Digital Wallet |
| open_banking | Open Banking |

---

## 7. Algorithms

### 7.1 Nesting Analysis

#### 7.1.1 BFS Hop Distance

Computes shortest distance from each entity to the nearest BANK anchor.

```
Input:  entities[], transactions[]
Output: hopMap: Map<entityId, number|∞>

1. seed = all entities where isBank = true → hop 0
2. Build undirected adjacency list from transactions
3. Multi-source BFS from all seeds simultaneously
4. Entities not reached → hop ∞
```

**Hop interpretation:**

| Hop | Meaning |
|-----|---------|
| 0 | BANK anchor |
| 1 | Direct respondent / NPM partner |
| 2 | Nested FI — CDD gap risk |
| 3+ | Double nesting |
| ∞ | Unreachable from any BANK anchor |

#### 7.1.2 Impermissible Pair Detection

For every transaction, check both-direction endpoint type pairs against:

| Pair | Rule |
|------|------|
| npm_fintech ↔ money_service_business | Always impermissible |
| bank ↔ money_service_business | Always impermissible |

Output: `[{ txId, sourceId, targetId, reason }]`

**Real-time check:** Fires 500 ms after every `TRANSACTION_ADDED` event.

#### 7.1.3 Double Nesting Chain Detection

1. Identify all entities with `hopDistance >= 3` (threshold configurable)
2. BFS across undirected graph restricted to those entities
3. Return each connected component as a chain

Output: `entityId[][]`

#### 7.1.4 Primary Nesting Path Detection

Valid path: BANK (hop 0) → NPM FINTECH (hop 1) → Nested FI (hop 2) → End Customer (hop 3), with hop distances matching exactly.

Output: `[{ entities: [id×4], transactions: [txId×3] }]`

#### 7.1.5 Affiliate Flow Detection

1. Find all entities with `type = 'affiliate'`
2. For each, BFS undirected graph to find full connected component
3. Return components as affiliate chains

Output: `{ hasAffiliate: boolean, affiliateChains: entityId[][] }`

#### 7.1.6 Multi-NPM Cluster Detection

1. For each `npm_fintech` entity, collect all entities reachable in ≤2 directed hops
2. For each pair of NPMs, check if their downstream sets intersect
3. Merge overlapping pairs into clusters

Output: `entityId[][]` (each array = one cluster of NPMs sharing a downstream entity)

#### 7.1.7 Permissibility Assignment

| Condition | Status |
|-----------|--------|
| Entity is endpoint of an impermissible pair | `impermissible` |
| Entity in double-nesting chain AND `sameGroupAmlCtf = false` | `impermissible` |
| Entity in double-nesting chain AND `sameGroupAmlCtf = true` | `permissible` (F-10 exception) |
| Entity type = `affiliate` | `review_required` |
| Otherwise | `permissible` |

#### 7.1.8 Nesting Type Classification (priority order)

1. **impermissible** — if any impermissible pairs exist
2. **double** — if any double-nesting chains exist
3. **affiliate** — if any affiliate entities exist
4. **primary** — if any primary nesting paths exist
5. **null** — no nesting detected

---

### 7.2 Risk Scoring

#### Factor Weights (sum = 1.0)

| Factor | Weight |
|--------|--------|
| Jurisdiction | 0.25 |
| Entity Type | 0.20 |
| Transaction Volume | 0.18 |
| Hop Distance | 0.15 |
| Network Centrality | 0.12 |
| Pattern Involvement | 0.10 |

#### Factor Computation

**Jurisdiction (0.25)**
Raw score from FATF rating: Compliant=30, Enhanced=50, Greylist=70, Blacklisted=90, Unknown=50.

**Entity Type (0.20)**
Raw score = entity `baseRisk` (see §6.1).

**Transaction Volume (0.18)**

| Condition | Points |
|-----------|--------|
| Total flow > $10M | +30 |
| Total flow > $1M | +20 |
| Total flow > $100K | +10 |
| 3+ structuring transactions* | +35 |
| 1+ structuring transactions* | +15 |
| >60% round amounts | +15 |
| >20 transactions | +20 |
| >10 transactions | +10 |

*Structuring: amount in range [$9,500, $10,000) — i.e. threshold × (1 − 5% tolerance)

**Hop Distance (0.15)**

| Hop | Raw Score |
|-----|-----------|
| 0 (BANK anchor) | 0 |
| 1 | 20 |
| 2 | 55 |
| 3+ | 90 |
| null / ∞ | 0 |

**Network Centrality (0.12)**

| Condition | Points |
|-----------|--------|
| >10 connections | +30 |
| >5 connections | +15 |
| Is intermediary (has both in and out) | +20 |
| Betweenness > 0.3 | +30 |
| Betweenness > 0.1 | +15 |

**Pattern Involvement (0.10)**
Raw score = max severity score among all patterns containing this entity: critical=100, high=75, medium=50, low=25. Zero if not involved.

#### Overall Score

```
overallScore = clamp( Σ(factor.raw × factor.weight), 0, 100 ), rounded to integer
```

#### Risk Level Bands

| Score | Level |
|-------|-------|
| 0–29 | Low |
| 30–54 | Medium |
| 55–74 | High |
| 75–100 | Critical |

---

### 7.3 Pattern Detection

All 13 patterns, their detection logic, thresholds, and severity:

#### P-01 Smurfing

| Parameter | Value |
|-----------|-------|
| Threshold | $10,000 |
| Tolerance | 5% → flags [$9,500, $10,000) |
| Time window | 72 hours |
| Minimum count | 3 transactions in window |
| Severity | Critical if ≥6, else High |

Algorithm: Per entity, group outgoing transactions by rolling 72 h window; flag if ≥3 are in range.

#### P-02 Round-Tripping

| Parameter | Value |
|-----------|-------|
| Max cycle length | 8 hops |
| Min entities in cycle | 3 |
| Max loss | 30% |
| Severity | Critical if loss <10%, else High |

Algorithm: DFS to find all cycles; compute loss = |first_amount − last_amount| / first_amount; flag if loss ≤ 30%.

#### P-03 Rapid Movement Chain

| Parameter | Value |
|-----------|-------|
| Max time gap between consecutive txns | 1 hour |
| Min chain length | 3 entities |
| Severity | High if ≥5 txns, else Medium |

#### P-04 Complex Layering Network

| Parameter | Value |
|-----------|-------|
| Min entities | 5 |
| Complexity score threshold | ≥50 to flag |
| Severity | Critical if score ≥80, else High |

Scoring: 5+ connected entities (+30), 3+ jurisdictions (+25), 2+ jurisdictions (+10), shell ratio ≥50% (+25), shell ratio ≥30% (+10), 8+ txns (+20), 5+ txns (+10).

#### P-05 Trade-Based Money Laundering

Flags trade_company entities with suspicious pricing indicators on trade-method transactions.

Severity: High.

#### P-06 Cuckoo Smurfing

| Parameter | Value |
|-----------|-------|
| Min distinct sources | 3 |
| Min sub-threshold txns | 3 |
| Time window | 72 hours |
| Severity | High |

Algorithm: Per entity, check incoming transactions from 3+ distinct sources all below $10K within 72 h.

#### P-07 Cryptocurrency Mixing

| Parameter | Value |
|-----------|-------|
| Min inputs | 2 |
| Min outputs | 2 |
| Balance tolerance | <15% imbalance |
| Severity | Medium |

Algorithm: Per crypto_exchange entity, check if |total_in − total_out| / total_in < 0.15.

#### P-08 Nesting Risk

| Parameter | Value |
|-----------|-------|
| Nesting types | correspondent_bank, npm_fintech, shell_company, nominee_account, offshore_trust |
| Min chain entities | 2 |
| Severity | Critical if ≥3 entities, else High |

Algorithm: Find connected components of nesting-type entities; flag if component has ≥2 members.

#### P-09 Primary Nesting

Triggered by nesting analysis result `nestingType = 'primary'`.
Severity: Medium.
Description: "M primary nesting path(s) detected: BANK → NPM → Nested FI → End Customer"

#### P-10 Double Nesting

Triggered by nesting analysis result: `doubleNestingChains.length > 0`.
Severity: Critical.
Description: "M double nesting chain(s) with N entities at hop ≥ 3"

#### P-11 Impermissible Nesting

Triggered by nesting analysis result: `impermissiblePairs.length > 0`.
Severity: Critical.
Description: "M impermissible connection(s) detected (NPM/Bank ↔ Money Service Business)"

#### P-12 Affiliate Nesting

Triggered by nesting analysis result: `affiliateFlow.hasAffiliate = true`.
Severity: High.
Description: "Affiliate entity involvement detected in M chain(s)"

#### P-13 Multi-NPM Same Customer

Triggered by nesting analysis result: `multiNpmClusters.length > 0`.
Severity: High.
Description: "M multi-NPM cluster(s): N NPMs sharing downstream customers"

**Deduplication:** Patterns are deduplicated by `type + sorted entity set`. First occurrence is kept.

---

## 8. Events System

All inter-component communication uses a singleton EventBus (pub/sub). No component imports another directly; they communicate only through events.

### Event Catalogue

| Constant | Topic String | Payload |
|----------|-------------|---------|
| ENTITY_ADDED | `entity:added` | Entity |
| ENTITY_REMOVED | `entity:removed` | `{ entityId }` |
| ENTITY_UPDATED | `entity:updated` | Entity |
| ENTITY_SELECTED | `entity:selected` | Entity \| null |
| ENTITY_MOVED | `entity:moved` | Entity |
| TRANSACTION_ADDED | `transaction:added` | Transaction |
| TRANSACTION_REMOVED | `transaction:removed` | `{ txId }` |
| TRANSACTION_UPDATED | `transaction:updated` | Transaction |
| TRANSACTION_SELECTED | `transaction:selected` | Transaction \| null |
| SIMULATION_LOADED | `simulation:loaded` | Simulation |
| SIMULATION_CLEARED | `simulation:cleared` | null |
| SIMULATION_SAVED | `simulation:saved` | Simulation |
| ANALYSIS_STARTED | `analysis:started` | null |
| ANALYSIS_COMPLETED | `analysis:completed` | `{ patterns, riskProfiles, overallScore }` |
| PATTERN_DETECTED | `pattern:detected` | Pattern |
| RISK_CALCULATED | `risk:calculated` | RiskProfile |
| NESTING_ANALYSIS_COMPLETED | `nesting:analysis:completed` | NestingResult |
| IMPERMISSIBLE_DETECTED | `nesting:impermissible:detected` | `{ tx, pair }` |
| DOUBLE_NESTING_DETECTED | `nesting:double:detected` | `{ chains }` |
| BANK_ANCHOR_CHANGED | `nesting:bank:changed` | `{ entityId, isBank }` |
| NPM_MODEL_CHANGED | `nesting:npm:model:changed` | null |
| CANVAS_ZOOM | `canvas:zoom` | `{ level }` |
| CANVAS_PAN | `canvas:pan` | `{ x, y }` |
| MODAL_OPEN | `modal:open` | `{ modalId }` |
| MODAL_CLOSE | `modal:close` | `{ modalId }` |
| TIMELINE_PLAY | `timeline:play` | null |
| TIMELINE_PAUSE | `timeline:pause` | null |
| TIMELINE_STEP | `timeline:step` | `{ txIndex }` |

### Analysis Pipeline (event order)

```
User clicks Analyse
  → ANALYSIS_STARTED
  → runNestingAnalysis()
      → NESTING_ANALYSIS_COMPLETED
      → DOUBLE_NESTING_DETECTED  (if chains found)
  → detectAll() (pattern detection)
  → scoreAll()  (risk scoring)
  → ANALYSIS_COMPLETED
```

---

## 9. Configuration

All values are in `js/config.js` and can be changed without modifying algorithm code.

| Key | Default | Description |
|-----|---------|-------------|
| `app.autoSaveInterval` | 2000 ms | Debounce delay for auto-save |
| `canvas.minZoom` | 0.2 | Minimum zoom level |
| `canvas.maxZoom` | 3.0 | Maximum zoom level |
| `canvas.zoomStep` | 0.15 | Zoom increment per button press |
| `canvas.gridSize` | 20 px | Grid snap resolution |
| `canvas.nodeWidth` | 200 px | Default node width |
| `nesting.impermissibleCheckDebounceMs` | 500 ms | Delay before checking impermissible pairs after TRANSACTION_ADDED |
| `nesting.doubleNestingHopThreshold` | 3 | Minimum hop distance to classify as double nesting |
| `risk.structuringThreshold` | 10000 | Amount above which transactions are not structuring candidates |
| `risk.structuringTolerance` | 0.05 | 5% — transactions in [threshold×0.95, threshold) are flagged |
| `risk.thresholds.low` | [0, 30] | Low risk score band |
| `risk.thresholds.medium` | [30, 55] | Medium risk score band |
| `risk.thresholds.high` | [55, 75] | High risk score band |
| `risk.thresholds.critical` | [75, 100] | Critical risk score band |
| `risk.weights.*` | see §7.2 | Per-factor weights (must sum to 1.0) |
| `timeline.defaultAnimationDuration` | 1800 ms | Duration of one transaction animation at 1× |
| `timeline.speeds` | [0.5, 1, 2, 4] | Available playback speeds |
| `storage.maxSimulations` | 50 | Max simulations in localStorage |
| `storage.compressionEnabled` | true | lz-string compression on/off |
| `export.pdfFormat` | 'a4' | PDF page size |
| `export.pdfOrientation` | 'landscape' | PDF orientation |

---

## 10. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF-01 | The application shall run entirely in the browser with no backend; no server-side code is required |
| NF-02 | The application shall use no build step; all modules shall be loaded as native ES modules via `<script type="module">` |
| NF-03 | The application shall function correctly in the latest versions of Chrome, Firefox, Edge, and Safari |
| NF-04 | Analysis (nesting + risk + patterns) on a simulation with 50 entities and 100 transactions shall complete within 2 seconds on a modern desktop browser |
| NF-05 | All sensitive scenario data remains in the user's browser; no data is transmitted to any external server |
| NF-06 | The canvas shall remain responsive (no janky pan/zoom) for simulations up to 100 entities and 200 connections |
| NF-07 | Exported PDFs shall be legible at 100% zoom on A4 paper |
| NF-08 | The application shall degrade gracefully when localStorage is unavailable (e.g., private browsing mode) — auto-save shall silently disable; manual export shall still work |
