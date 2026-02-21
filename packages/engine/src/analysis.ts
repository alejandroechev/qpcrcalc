import type { ReplicateGroup, DeltaCtResult, DeltaDeltaCtResult, QCFlag } from './types.js';
import { mean, sem, geometricMean } from './stats.js';

/**
 * Compute ΔCt for each sample+gene pair.
 * ΔCt = meanCt(target) - meanCt(reference)
 * If multiple reference genes, use geometric mean of their mean Cts.
 */
export function computeDeltaCt(
  groups: ReplicateGroup[],
  referenceGenes: string[],
): DeltaCtResult[] {
  const results: DeltaCtResult[] = [];
  const samples = [...new Set(groups.map(g => g.sample))];
  const targetGenes = [...new Set(groups.map(g => g.gene))].filter(
    g => !referenceGenes.includes(g),
  );

  for (const sample of samples) {
    // Get reference Ct for this sample
    const refGroups = groups.filter(
      g => g.sample === sample && referenceGenes.includes(g.gene),
    );
    if (!refGroups.length) continue;

    const refMeanCt =
      refGroups.length === 1
        ? refGroups[0].meanCt
        : geometricMean(refGroups.map(g => g.meanCt));

    for (const gene of targetGenes) {
      const grp = groups.find(g => g.sample === sample && g.gene === gene);
      if (!grp || isNaN(grp.meanCt)) continue;

      const deltaCt = grp.meanCt - refMeanCt;
      // Propagated SD: sqrt(sd_target^2/n_target + sd_ref^2/n_ref)
      // simplified: use target group SD as the dominant source
      const refSd = refGroups.length === 1 ? refGroups[0].sd : 0;
      const combinedSd = Math.sqrt(
        (grp.n > 0 ? grp.sd ** 2 : 0) + (refGroups[0].n > 0 ? refSd ** 2 : 0),
      );

      results.push({
        sample,
        gene,
        meanCt: grp.meanCt,
        refMeanCt,
        deltaCt,
        sd: combinedSd,
      });
    }
  }
  return results;
}

/**
 * Compute ΔΔCt and fold change.
 * ΔΔCt = ΔCt_sample - mean(ΔCt_control)
 * Fold change = 2^(-ΔΔCt)
 */
export function computeDeltaDeltaCt(
  deltaCts: DeltaCtResult[],
  groups: ReplicateGroup[],
  controlSamples: string[],
): DeltaDeltaCtResult[] {
  const genes = [...new Set(deltaCts.map(d => d.gene))];
  const results: DeltaDeltaCtResult[] = [];

  for (const gene of genes) {
    const controlDcts = deltaCts.filter(
      d => d.gene === gene && controlSamples.includes(d.sample),
    );
    const controlMean = mean(controlDcts.map(d => d.deltaCt));

    const geneResults = deltaCts.filter(d => d.gene === gene);
    for (const r of geneResults) {
      const deltaDeltaCt = r.deltaCt - controlMean;
      const grp = groups.find(g => g.sample === r.sample && g.gene === gene);
      const n = grp?.n ?? 1;
      const semVal = sem(r.sd, n);

      const foldChange = Math.pow(2, -deltaDeltaCt);
      const foldChangeLo = Math.pow(2, -(deltaDeltaCt + semVal));
      const foldChangeHi = Math.pow(2, -(deltaDeltaCt - semVal));

      const flags = computeFlags(grp, r.meanCt);

      results.push({
        sample: r.sample,
        gene,
        deltaCt: r.deltaCt,
        deltaDeltaCt,
        foldChange,
        foldChangeLo,
        foldChangeHi,
        sem: semVal,
        flags,
      });
    }
  }
  return results;
}

function computeFlags(grp: ReplicateGroup | undefined, meanCt: number): QCFlag[] {
  const flags: QCFlag[] = [];
  if (!grp || grp.n === 0) {
    flags.push('UNDETERMINED');
    return flags;
  }
  if (grp.cv > 5) flags.push('UNRELIABLE');
  else if (grp.cv > 2) flags.push('HIGH_CV');
  if (meanCt > 35) flags.push('LOW_SIGNAL');
  return flags;
}
