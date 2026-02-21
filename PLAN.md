# qPCRCalc — qPCR Delta-Delta-Ct Analysis

## Mission
Replace instrument-locked vendor software with a vendor-agnostic web tool for ΔΔCt fold-change analysis.

## Architecture
- `packages/engine/` — ΔCt, ΔΔCt, fold change, replicate statistics, QC flags
- `packages/web/` — React + Vite, plate grid, fold-change bar chart
- `packages/cli/` — Node runner for batch analysis

## MVP Features (Free Tier)
1. Paste raw Ct values (up to one plate / one experiment)
2. Select reference gene(s) and control group
3. Compute ΔCt, ΔΔCt, and fold change (2^-ΔΔCt) per sample
4. Bar chart of fold changes with error bars (SEM across replicates)
5. Flag samples with high replicate CV%
6. Export fold change table as CSV

## Engine Tasks

### E1: Ct Data Parser
- Parse Ct values from paste/CSV: Sample | Gene | Ct
- Support replicate detection (same Sample+Gene = replicates)
- Handle "Undetermined" / NaN values
- **Validation**: Known Ct datasets

### E2: ΔCt Calculation
- `ΔCt = Ct_target - Ct_reference`
- Average reference gene Ct across replicates first
- If multiple reference genes: geometric mean of reference Cts
- **Validation**: Manual calculation verification

### E3: ΔΔCt Calculation
- `ΔΔCt = ΔCt_sample - ΔCt_control`
- Control group = mean ΔCt of control samples
- **Validation**: Published ΔΔCt examples (Livak & Schmittgen 2001)

### E4: Fold Change
- `Fold change = 2^(-ΔΔCt)`
- Error propagation: SEM of ΔCt replicates → fold change error bars
- Upper/lower bounds: `2^(-(ΔΔCt ± SEM))`
- **Validation**: Livak & Schmittgen method verification

### E5: Quality Control
- Replicate CV% for each Sample+Gene group
- Flag CV% > 2% (suspicious) or > 5% (unreliable)
- Flag Ct > 35 (low expression / noise)
- Report number of valid replicates per group

### E6: Export
- Table: Sample, Gene, Mean Ct, ΔCt, ΔΔCt, Fold Change, SEM, Flag
- Bar chart data for plotting
- CSV export

## Web UI Tasks

### W1: Data Entry
- Paste-friendly grid or CSV upload
- Column assignment: Sample, Gene, Ct
- Reference gene selector (dropdown or checkbox for multiple)
- Control group selector

### W2: Fold Change Bar Chart
- Recharts grouped bar chart: genes on x-axis, fold change on y-axis
- Error bars (SEM)
- Significance line at fold change = 1 (no change)
- Color by group

### W3: Results Table
- Expandable: Sample → Gene → Replicates
- ΔCt, ΔΔCt, Fold Change, SEM, CV%, QC flags
- Sortable, filterable

### W4: Export
- Download CSV
- Download bar chart as PNG/SVG
- Print-friendly results

### W5: Toolbar & Theme
- Import, Analyze, Export buttons
- Reference gene / control group selectors in toolbar
- Light/dark theme

## Key Equations
- ΔCt: `Ct_target - Ct_reference`
- ΔΔCt: `ΔCt_sample - mean(ΔCt_control)`
- Fold change: `2^(-ΔΔCt)`
- Error: `SEM = SD / √n`, bounds = `2^(-(ΔΔCt ± SEM))`

## Validation Strategy
- Livak & Schmittgen (2001) method paper worked examples
- Compare to Bio-Rad CFX Manager output
- Published qPCR datasets from GEO/ArrayExpress
