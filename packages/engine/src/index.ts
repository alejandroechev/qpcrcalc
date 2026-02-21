import type { AnalysisResult } from './types.js';
import { parseCt } from './parser.js';
import { groupReplicates } from './stats.js';
import { computeDeltaCt, computeDeltaDeltaCt } from './analysis.js';

export { parseCt } from './parser.js';
export { groupReplicates, mean, sem, geometricMean } from './stats.js';
export { computeDeltaCt, computeDeltaDeltaCt } from './analysis.js';
export { exportCsv } from './export.js';
export type {
  CtRecord,
  ReplicateGroup,
  DeltaCtResult,
  DeltaDeltaCtResult,
  QCFlag,
  AnalysisResult,
} from './types.js';

/** Full pipeline: parse → group → ΔCt → ΔΔCt → fold change */
export function analyze(
  text: string,
  referenceGenes: string[],
  controlSamples: string[],
): AnalysisResult {
  const records = parseCt(text);
  const groups = groupReplicates(records);
  const deltaCtResults = computeDeltaCt(groups, referenceGenes);
  const results = computeDeltaDeltaCt(deltaCtResults, groups, controlSamples);
  return { records, groups, deltaCtResults, results };
}
