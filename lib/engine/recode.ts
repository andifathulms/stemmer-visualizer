import type { Application } from '@/lib/rules/apply'
import type { RemovalStep } from './trace'

/**
 * Recoding (peluruhan) — restoring the letter that assimilation destroyed:
 * menyapu → me- + (s)apu, memukul → me- + (p)ukul.
 *
 * PRD §12 names this as the risk: recoding is where implementations most often
 * diverge. The defence is that the restorations are rule data, flagged with
 * `peluruhan: true` and fixtured case by case. This module only reports what a
 * rule application did; it contains no restoration table of its own, and it
 * must not grow one.
 */

export interface Recoding {
  /** The letter put back. */
  readonly restored: string
  /** The word before restoration, i.e. the surface remainder. */
  readonly dari: string
  /** The word after. */
  readonly ke: string
  readonly ruleId: string
}

/** Did this rule application restore a letter? */
export function isRecoding(application: Application): boolean {
  return application.rule.type === 'awalan' && application.rule.peluruhan
}

/** The recoding a removal step performed, if it performed one. */
export function recodingOfStep(step: RemovalStep): Recoding | null {
  if (step.rule.type !== 'awalan' || !step.rule.peluruhan || step.restored === null) return null
  return {
    restored: step.restored,
    dari: step.dari,
    ke: step.ke,
    ruleId: step.ruleId,
  }
}

/**
 * Removal steps in a trace that restored a letter. The trace view highlights
 * these because they are the steps a reader is most likely to disbelieve.
 */
export function recodings(steps: readonly RemovalStep[]): Recoding[] {
  return steps.map(recodingOfStep).filter((r): r is Recoding => r !== null)
}
