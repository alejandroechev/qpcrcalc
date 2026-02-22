# qPCRCalc — Business Plan

## Product Vision
Free, browser-based qPCR analysis tool replacing expensive desktop software for relative gene expression quantification. Target: independent labs, academic researchers, and biotech startups who don't want to be locked into instrument vendor ecosystems.

## Market Context

### Competitors
| Product | Price | Notes |
|---------|-------|-------|
| Bio-Rad CFX Manager | Free (bundled) | Requires Bio-Rad instrument; vendor lock-in |
| Thermo Fisher Connect | Free (bundled) | Requires Thermo instrument; cloud-dependent |
| qbase+ (Biogazelle) | ~$500/yr | Multi-reference, MIQE-aware; expensive |
| GenEx (MultiD) | ~$800/yr | Advanced stats; steep learning curve |
| REST (Pfaffl) | Free | Desktop-only, outdated UI, no longer maintained |

### Key Insight
Major vendors bundle free software with their machines, making direct competition on basic ΔΔCt difficult. **Monetization strategy must target gaps**: instrument-agnostic analysis, advanced methods (Pfaffl, standard curve), and compliance reporting that vendor tools handle poorly across mixed-instrument labs.

## Survey Results
| Metric | Score |
|--------|-------|
| Professional Use | 65% |
| Scales to Real Work | 45% |
| Useful Right Now | 75% |
| Incremental Premium | 55% |
| Major Premium | 70% |

### Interpretation
- **Useful (75%)** — core ΔΔCt analysis solves a real need
- **Scales (45%)** — lowest score; single-method tool hits ceiling fast on complex experiments
- **Major Premium (70%)** — researchers will pay for advanced methods and compliance features
- **Inc Premium (55%)** — modest; free vendor tools set a low price anchor

## Current State (Phase 1 — Free)
- 69 tests (37 unit + 32 E2E)
- Livak ΔΔCt method with multi-reference gene support
- Fold change bar chart with asymmetric error bars
- QC flagging: CV% > 2% (suspicious), > 5% (unreliable), Ct > 35
- CSV data import
- Instant browser-based analysis, no install

### Strengths
- Instant analysis — paste or upload, results in seconds
- Publication-ready fold change chart
- QC flags catch bad replicates automatically
- Multi-reference gene normalization
- No vendor lock-in, works with any instrument's exported data

### Weaknesses
- ΔΔCt only — no efficiency correction (Pfaffl method)
- Hard-coded QC thresholds (not configurable)
- CSV-only import — no native plate file formats
- No heatmap or plate visualization
- No PDF/printable report export

## Phase 2 — Pro Tier ($79–149/yr)

Target: researchers who need efficiency correction and publication-quality output.

| Feature | Size | Rationale |
|---------|------|-----------|
| Pfaffl efficiency correction | M | Accounts for non-ideal amplification; required for rigorous work |
| Plate file import (Bio-Rad .pcrd, ABI .eds) | M | Eliminates manual CSV export step; reduces friction |
| Custom QC thresholds | S | Labs have different standards; let users set CV% and Ct limits |
| Heatmap visualization | M | 96-well plate heatmap of Ct values; instant QC overview |
| PDF report export | M | Print-ready report with methods, results, and QC summary |

### Revenue Model
- $79/yr individual researcher
- $149/yr lab license (up to 5 seats)
- Free tier remains fully functional for basic ΔΔCt

### Phase 2 Revenue Target
- 200 individual + 50 lab licenses = $23,250/yr

## Phase 3 — Enterprise Tier ($199–349/yr)

Target: core facilities, CROs, and labs running high-throughput qPCR with compliance requirements.

| Feature | Size | Rationale |
|---------|------|-----------|
| Standard curve method | L | Absolute quantification; required for viral load, copy number |
| Melt curve analysis | L | Post-amplification QC; detect primer dimers and non-specific products |
| Multiplex assay support | L | Multi-target detection in single reaction; growing market segment |
| MIQE compliance reporting | L | Minimum Information for qPCR Experiments; journal requirement |
| Batch experiment comparison | L | Compare fold changes across experiments; meta-analysis capability |

### Revenue Model
- $199/yr individual researcher
- $349/yr lab license (up to 10 seats)

### Phase 3 Revenue Target
- 100 individual + 30 lab licenses = $30,370/yr

## Go-To-Market Strategy

### Target Segments (in priority order)
1. **Independent / startup labs** — No instrument vendor ecosystem; need affordable, instrument-agnostic tools
2. **Academic labs with mixed instruments** — Have Bio-Rad AND Thermo machines; vendor tools don't cross-analyze
3. **Core facilities** — Process samples from many labs; need standardized analysis and MIQE compliance
4. **CROs (Contract Research Orgs)** — High volume; need batch processing and audit-ready reports

### Acquisition Channels
- SEO: "free qPCR analysis tool", "online delta-delta Ct calculator", "Pfaffl method calculator"
- Protocol sharing sites: protocols.io method write-ups linking to tool
- Preprint supplementary methods: encourage citation in bioRxiv/medRxiv papers
- Reddit r/labrats, r/molecularbiology community engagement
- ResearchGate and Google Scholar profile

### Competitive Positioning
> "The qPCR analysis tool that works with every instrument. No install, no vendor lock-in, no subscription for basic analysis."

### Monetization Risk
Bio-Rad and Thermo bundling free software creates a strong price anchor at $0. Mitigation:
- Keep basic ΔΔCt free forever — build trust and user base
- Monetize advanced methods (Pfaffl, standard curve) that vendor tools either lack or implement poorly
- Monetize cross-instrument workflows that no single vendor supports
- MIQE compliance is underserved — journals increasingly require it

## Technical Roadmap

### Phase 2 Dependencies
```
Pfaffl method ─── requires efficiency input UI + engine calculations
Plate import ──── requires file format parsers (binary .pcrd, .eds)
Custom thresholds ─ engine config refactor (currently hard-coded)
Heatmap ────────── new visualization component (96-well SVG grid)
PDF report ─────── jsPDF or print-to-PDF with @media print styles
```

### Phase 3 Dependencies
```
Standard curve ─── new calibration engine + regression fitting
Melt curve ─────── derivative peak detection + temperature profile parsing
Multiplex ──────── multi-target data model + per-target analysis
MIQE reporting ─── checklist engine + structured metadata collection
Batch comparison ── experiment-level data model + normalization across runs
```

## Success Metrics

| Metric | Phase 2 Target | Phase 3 Target |
|--------|---------------|---------------|
| Monthly active users | 500 | 2,000 |
| Paid subscribers | 250 | 380 |
| Annual recurring revenue | $23K | $53K |
| NPS score | > 40 | > 50 |
| Churn rate | < 10%/yr | < 8%/yr |
| Test coverage | > 90% | > 90% |
