/** A single Ct measurement row */
export interface CtRecord {
  sample: string;
  gene: string;
  ct: number | null; // null = Undetermined
}

/** Grouped replicates for one Sample+Gene */
export interface ReplicateGroup {
  sample: string;
  gene: string;
  cts: number[];
  meanCt: number;
  sd: number;
  cv: number; // CV% (0–100)
  n: number;
}

export interface DeltaCtResult {
  sample: string;
  gene: string;
  meanCt: number;
  refMeanCt: number;
  deltaCt: number;
  sd: number;
}

export interface DeltaDeltaCtResult {
  sample: string;
  gene: string;
  deltaCt: number;
  deltaDeltaCt: number;
  foldChange: number;
  foldChangeLo: number;
  foldChangeHi: number;
  sem: number;
  flags: QCFlag[];
}

export type QCFlag =
  | 'HIGH_CV'      // CV% > 2%
  | 'UNRELIABLE'   // CV% > 5%
  | 'LOW_SIGNAL'   // Ct > 35
  | 'UNDETERMINED'; // all replicates undetermined

export interface AnalysisResult {
  records: CtRecord[];
  groups: ReplicateGroup[];
  deltaCtResults: DeltaCtResult[];
  results: DeltaDeltaCtResult[];
}
