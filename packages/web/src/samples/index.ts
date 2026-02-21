export interface SampleDataset {
  name: string;
  description: string;
  csv: string;
  refGenes: string[];
  controlGroup: string;
}

export const sampleDatasets: SampleDataset[] = [
  {
    name: 'Cancer Biomarkers',
    description: 'BRCA1, TP53, MYC vs GAPDH — 3 treated samples, ~8× BRCA1 upregulation',
    refGenes: ['GAPDH'],
    controlGroup: 'Control',
    csv: `Sample,Gene,Ct
Control,GAPDH,20.1
Control,GAPDH,20.3
Control,GAPDH,20.2
Control,BRCA1,25.5
Control,BRCA1,25.7
Control,BRCA1,25.4
Control,TP53,28.1
Control,TP53,28.3
Control,TP53,28.0
Control,MYC,23.8
Control,MYC,24.0
Control,MYC,23.9
Tumor-A,GAPDH,20.2
Tumor-A,GAPDH,20.0
Tumor-A,GAPDH,20.1
Tumor-A,BRCA1,22.4
Tumor-A,BRCA1,22.6
Tumor-A,BRCA1,22.5
Tumor-A,TP53,27.0
Tumor-A,TP53,27.2
Tumor-A,TP53,27.1
Tumor-A,MYC,22.1
Tumor-A,MYC,22.3
Tumor-A,MYC,22.2
Tumor-B,GAPDH,20.3
Tumor-B,GAPDH,20.1
Tumor-B,GAPDH,20.2
Tumor-B,BRCA1,22.2
Tumor-B,BRCA1,22.0
Tumor-B,BRCA1,22.1
Tumor-B,TP53,26.8
Tumor-B,TP53,27.0
Tumor-B,TP53,26.9
Tumor-B,MYC,21.8
Tumor-B,MYC,22.0
Tumor-B,MYC,21.9
Tumor-C,GAPDH,20.0
Tumor-C,GAPDH,20.2
Tumor-C,GAPDH,20.1
Tumor-C,BRCA1,22.6
Tumor-C,BRCA1,22.8
Tumor-C,BRCA1,22.7
Tumor-C,TP53,27.5
Tumor-C,TP53,27.3
Tumor-C,TP53,27.4
Tumor-C,MYC,22.5
Tumor-C,MYC,22.7
Tumor-C,MYC,22.6`,
  },
  {
    name: 'Inflammation Panel',
    description: 'IL-6, TNF-α, IL-1β vs β-actin — LPS stimulation, strong induction',
    refGenes: ['B-actin'],
    controlGroup: 'Unstimulated',
    csv: `Sample,Gene,Ct
Unstimulated,B-actin,18.2
Unstimulated,B-actin,18.4
Unstimulated,B-actin,18.3
Unstimulated,IL6,30.5
Unstimulated,IL6,30.7
Unstimulated,IL6,30.6
Unstimulated,TNFa,28.9
Unstimulated,TNFa,29.1
Unstimulated,TNFa,29.0
Unstimulated,IL1B,31.2
Unstimulated,IL1B,31.4
Unstimulated,IL1B,31.3
LPS-1h,B-actin,18.3
LPS-1h,B-actin,18.1
LPS-1h,B-actin,18.2
LPS-1h,IL6,24.1
LPS-1h,IL6,24.3
LPS-1h,IL6,24.2
LPS-1h,TNFa,22.5
LPS-1h,TNFa,22.7
LPS-1h,TNFa,22.6
LPS-1h,IL1B,25.8
LPS-1h,IL1B,26.0
LPS-1h,IL1B,25.9
LPS-4h,B-actin,18.1
LPS-4h,B-actin,18.3
LPS-4h,B-actin,18.2
LPS-4h,IL6,21.0
LPS-4h,IL6,21.2
LPS-4h,IL6,21.1
LPS-4h,TNFa,23.8
LPS-4h,TNFa,24.0
LPS-4h,TNFa,23.9
LPS-4h,IL1B,23.5
LPS-4h,IL1B,23.7
LPS-4h,IL1B,23.6
LPS-24h,B-actin,18.4
LPS-24h,B-actin,18.2
LPS-24h,B-actin,18.3
LPS-24h,IL6,22.8
LPS-24h,IL6,23.0
LPS-24h,IL6,22.9
LPS-24h,TNFa,25.1
LPS-24h,TNFa,25.3
LPS-24h,TNFa,25.2
LPS-24h,IL1B,24.9
LPS-24h,IL1B,25.1
LPS-24h,IL1B,25.0`,
  },
  {
    name: 'Drug Time Course',
    description: 'CYP3A4 vs 18S — rifampicin induction at 0h, 6h, 12h, 24h',
    refGenes: ['18S'],
    controlGroup: '0h',
    csv: `Sample,Gene,Ct
0h,18S,15.2
0h,18S,15.4
0h,18S,15.3
0h,CYP3A4,27.8
0h,CYP3A4,28.0
0h,CYP3A4,27.9
6h,18S,15.3
6h,18S,15.1
6h,18S,15.2
6h,CYP3A4,26.1
6h,CYP3A4,26.3
6h,CYP3A4,26.2
12h,18S,15.1
12h,18S,15.3
12h,18S,15.2
12h,CYP3A4,24.5
12h,CYP3A4,24.7
12h,CYP3A4,24.6
24h,18S,15.4
24h,18S,15.2
24h,18S,15.3
24h,CYP3A4,22.8
24h,CYP3A4,23.0
24h,CYP3A4,22.9`,
  },
  {
    name: 'Low Expression (QC Flags)',
    description: 'Borderline Ct ~35, high CV% — triggers QC warnings',
    refGenes: ['GAPDH'],
    controlGroup: 'Control',
    csv: `Sample,Gene,Ct
Control,GAPDH,20.5
Control,GAPDH,20.3
Control,GAPDH,20.4
Control,RareGene,34.2
Control,RareGene,35.8
Control,RareGene,33.5
Treated,GAPDH,20.4
Treated,GAPDH,20.6
Treated,GAPDH,20.5
Treated,RareGene,33.1
Treated,RareGene,36.2
Treated,RareGene,34.8`,
  },
  {
    name: 'Multi-Reference Validation',
    description: 'Two reference genes (GAPDH + β-actin) — consistency check',
    refGenes: ['GAPDH', 'B-actin'],
    controlGroup: 'Control',
    csv: `Sample,Gene,Ct
Control,GAPDH,20.1
Control,GAPDH,20.3
Control,GAPDH,20.2
Control,B-actin,18.5
Control,B-actin,18.7
Control,B-actin,18.6
Control,VEGF,26.3
Control,VEGF,26.5
Control,VEGF,26.4
Control,HIF1A,24.8
Control,HIF1A,25.0
Control,HIF1A,24.9
Hypoxia-4h,GAPDH,20.2
Hypoxia-4h,GAPDH,20.0
Hypoxia-4h,GAPDH,20.1
Hypoxia-4h,B-actin,18.6
Hypoxia-4h,B-actin,18.4
Hypoxia-4h,B-actin,18.5
Hypoxia-4h,VEGF,22.8
Hypoxia-4h,VEGF,23.0
Hypoxia-4h,VEGF,22.9
Hypoxia-4h,HIF1A,22.1
Hypoxia-4h,HIF1A,22.3
Hypoxia-4h,HIF1A,22.2
Hypoxia-24h,GAPDH,20.0
Hypoxia-24h,GAPDH,20.2
Hypoxia-24h,GAPDH,20.1
Hypoxia-24h,B-actin,18.4
Hypoxia-24h,B-actin,18.6
Hypoxia-24h,B-actin,18.5
Hypoxia-24h,VEGF,21.5
Hypoxia-24h,VEGF,21.7
Hypoxia-24h,VEGF,21.6
Hypoxia-24h,HIF1A,21.3
Hypoxia-24h,HIF1A,21.5
Hypoxia-24h,HIF1A,21.4`,
  },
];
