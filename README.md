# Banking Financial Crime Nesting Flow Simulator

An educational tool for financial crime investigators to visualize and understand money laundering patterns through interactive simulation of transaction flows between entities.

## Overview

This application allows users to create visual simulations of money laundering schemes, demonstrating the three key stages of Anti-Money Laundering (AML):

- **Placement**: Introducing illicit funds into the financial system
- **Layering**: Complex transactions to obscure the origin of funds
- **Integration**: Making laundered money appear legitimate

## Features

### Core Simulation Engine
- **Visual Flow Canvas**: Interactive node-based diagram showing money movement
- **Drag & Drop**: Create entity nodes by dragging from palette
- **Animated Transactions**: Watch funds flow between entities in real-time
- **Zoom & Pan**: Navigate large simulations easily

### Entity Types
- 👤 Originator (source of illicit funds)
- 🏢 Shell Company (no real operations)
- 🏦 Correspondent Bank (international transfers)
- 👥 Nominee Account (hidden beneficial ownership)
- ₿ Crypto Exchange (cryptocurrency conversion)
- 🏪 Cash-Intensive Business (integration vehicle)
- 🎯 Final Beneficiary (ultimate recipient)
- Plus 8 additional specialized entity types

### Risk Analysis
- **Automated Risk Scoring**: Multi-factor assessment of each entity
- **Jurisdiction Risk**: FATF ratings, corruption indices, secrecy scores
- **Pattern Detection**: Automatically identify suspicious patterns:
  - Smurfing/Structuring
  - Round-Tripping
  - Rapid Movement
  - Complex Layering
  - Trade-Based Laundering
  - Cryptocurrency Mixing
  - Nested Shell Companies
  - Cuckoo Smurfing

### Data & Export
- **LocalStorage Persistence**: Auto-save simulations locally
- **JSON Export/Import**: Share simulations as files
- **PDF Export**: Generate visual reports with analysis
- **Sample Scenarios**: Pre-built examples for learning

### Educational Content
- **Entity Tooltips**: Detailed explanations of each entity type
- **Pattern Descriptions**: Learn about real-world money laundering techniques
- **Risk Factor Breakdown**: Understand why entities are high-risk
- **Sample Scenarios**: 6 pre-built examples at varying difficulty levels

## Technology Stack

- **Pure HTML/CSS/JavaScript** (no frameworks)
- **jsPlumb Community Edition**: Node-based flow diagram
- **Chart.js**: Risk visualization charts
- **html2canvas + jsPDF**: PDF report generation
- **LZ-string**: localStorage compression

## Project Structure

```
/home/xhiro/Nesting/
├── index.html                  # Main application entry
├── css/
│   ├── main.css               # Base styles & layout
│   ├── canvas.css             # Flow canvas styling
│   ├── components.css         # UI components
│   └── animations.css         # Transaction animations
├── js/
│   ├── models/
│   │   ├── Entity.js          # Entity data model
│   │   ├── Transaction.js     # Transaction data model
│   │   ├── Jurisdiction.js    # Jurisdiction/country model
│   │   └── Simulation.js      # Main simulation container
│   ├── data/
│   │   ├── jurisdictions.js   # 30+ countries with FATF data
│   │   ├── entityTypes.js     # 15 entity type definitions
│   │   ├── patterns.js        # 8 ML pattern definitions
│   │   └── samples.js         # 6 pre-built scenarios
│   ├── utils/
│   │   ├── eventBus.js        # Event system
│   │   ├── helpers.js         # Utility functions
│   │   ├── validators.js      # Data validation
│   │   └── storage.js         # localStorage manager
│   ├── core/                  # (To be implemented)
│   ├── algorithms/            # (To be implemented)
│   └── components/            # (To be implemented)
├── lib/
│   ├── jsplumb.min.js        # Downloaded (211KB)
│   ├── chart.min.js          # Downloaded (195KB)
│   ├── html2canvas.min.js    # Downloaded (195KB)
│   ├── jspdf.min.js          # Downloaded (356KB)
│   └── lz-string.min.js      # Downloaded (4.8KB)
└── README.md                  # This file
```

## Current Implementation Status

### ✅ Completed (Phase 1)
- [x] Project structure and directory layout
- [x] Complete HTML layout with responsive UI
- [x] All CSS styling (4 files, ~700 lines)
- [x] External libraries downloaded (5 libraries)
- [x] Data models (Entity, Transaction, Jurisdiction, Simulation)
- [x] Reference data (jurisdictions, entity types, patterns, samples)
- [x] Utility infrastructure (event bus, helpers, validators, storage)

### 🚧 In Progress (Phase 2)
- [ ] Canvas manager with zoom/pan
- [ ] Node manager for entity rendering
- [ ] Connection manager for transactions
- [ ] Animation engine for flow visualization

### 📋 Planned (Phase 3-6)
- [ ] Risk scoring algorithm
- [ ] Pattern detection algorithms
- [ ] UI components (toolbar, palette, properties panel)
- [ ] Timeline playback controls
- [ ] Export functionality
- [ ] Documentation and tutorials

## Data Models

### Entity
```javascript
{
  id: 'uuid',
  type: 'shell_company',
  name: 'Acme Holdings Ltd',
  jurisdiction: 'KY',  // ISO country code
  amlStage: 'layering',
  position: { x: 100, y: 200 },
  metadata: { /* additional info */ },
  riskScore: 85.7,
  riskLevel: 'high',
  riskFactors: [...]
}
```

### Transaction
```javascript
{
  id: 'uuid',
  sourceId: 'entity-1',
  targetId: 'entity-2',
  amount: 500000,
  currency: 'USD',
  timestamp: 1234567890,
  method: 'wire_transfer',
  flags: ['round_amount', 'cross_border']
}
```

### Simulation
```javascript
{
  id: 'uuid',
  name: 'Shell Company Network',
  entities: Map<id, Entity>,
  transactions: Map<id, Transaction>,
  metadata: {
    totalAmount: 5000000,
    detectedPatterns: [...],
    overallRiskScore: 78.5
  }
}
```

## Reference Data

### Jurisdictions
- 30+ countries with FATF ratings
- Includes: US, UK, Switzerland, Cayman Islands, Panama, etc.
- FATF blacklist: Iran, North Korea
- FATF greylist: UAE, Turkey, Pakistan, etc.
- Data includes: CPI scores, secrecy scores, sanctions status

### Entity Types
15 entity types across all AML stages:
- **Placement**: Originator, Money Service Business, Cash Business
- **Layering**: Shell Company, Nominee Account, Crypto Exchange, Trade Company, Offshore Trust
- **Integration**: Final Beneficiary, Real Estate, Casino, Investment Fund

### Patterns
8 money laundering patterns with educational content:
- Smurfing/Structuring
- Round-Tripping
- Rapid Movement
- Complex Layering
- Trade-Based Laundering
- Cuckoo Smurfing
- Real Estate Integration
- Cryptocurrency Mixing

### Sample Scenarios
6 pre-built examples:
1. Basic Smurfing (Beginner)
2. Shell Company Layering (Intermediate)
3. Cryptocurrency Conversion (Intermediate)
4. Round-Tripping (Advanced)
5. Trade-Based Laundering (Advanced)
6. Cuckoo Smurfing (Advanced)

## Getting Started

### Installation
No installation required! Simply open `index.html` in a modern web browser.

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- ~1MB of available localStorage (for saving simulations)

### Quick Start
1. Open `index.html` in your browser
2. Drag entity types from the left palette onto the canvas
3. Click source entity, then target entity to create a transaction
4. Click "Analyze" to run risk scoring and pattern detection
5. Use timeline controls to animate transaction flows
6. Export your simulation as JSON or PDF

## Development Roadmap

### Phase 2: Core Canvas (Current)
- Implement Canvas.js with jsPlumb integration
- Create NodeManager for entity rendering
- Build ConnectionManager for transaction lines
- Add drag-and-drop functionality

### Phase 3: Algorithms
- Implement risk scoring engine (30% jurisdiction, 25% entity type, 35% transaction patterns, 10% network analysis)
- Build pattern detection algorithms
- Create graph analysis utilities

### Phase 4: Visualization
- Add AML stage color coding
- Implement transaction animations
- Build timeline player component
- Create risk visualization charts

### Phase 5: Export & Samples
- Integrate localStorage persistence
- Add JSON export/import
- Build PDF export with diagrams
- Load sample scenarios

### Phase 6: Polish
- Add responsive design
- Create tutorial/onboarding
- Comprehensive testing
- Performance optimizations

## Educational Use Cases

1. **AML Training**: Teach investigators common money laundering techniques
2. **Compliance Teams**: Visualize red flags and risk indicators
3. **Academic**: Study money laundering methodologies
4. **Research**: Analyze transaction network patterns
5. **Presentations**: Create compelling visualizations for stakeholders

## Risk Scoring Methodology

Multi-factor risk assessment with weighted contributions:

- **Jurisdiction Risk (30%)**: FATF rating, secrecy score, CPI
- **Entity Type Risk (25%)**: Base risk by type (shell company = 90)
- **Transaction Volume Risk (20%)**: Total flow, velocity, round amounts
- **Network Analysis Risk (15%)**: Centrality, connections to high-risk entities
- **Pattern Involvement (10%)**: Participation in detected patterns

## Pattern Detection Algorithms

- **Smurfing**: Multiple transactions just below $10K threshold
- **Round-Tripping**: Circular flow returning to originator
- **Rapid Movement**: Quick succession through 3+ entities
- **Layering Complexity**: 5+ entities, multiple jurisdictions
- **Trade-Based**: Invoice manipulation, over/under-invoicing
- **Cuckoo Smurfing**: Illicit funds into legitimate accounts
- **Crypto Mixing**: Multiple exchanges, privacy coins
- **Nested Shells**: Shell companies connected to other shells

## License

Educational use only. Not for production financial crime detection.

## Contributing

This is an educational project. Contributions welcome for:
- Additional entity types
- More pattern definitions
- Sample scenarios
- Educational content
- Bug fixes

## Disclaimer

This tool is for educational purposes only. It should not be used as the sole basis for financial crime investigations. Real-world AML compliance requires sophisticated systems, human expertise, and regulatory compliance.

## Contact

For questions or feedback about this educational tool, please see the documentation.

---

**Built with ❤️ for AML education and training**
