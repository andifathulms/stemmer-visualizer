import type { Forbidden, RulePack } from '@/lib/rules/schema'
import { forbiddenCombination } from '@/lib/rules/loader'

/**
 * The forbidden prefix-suffix combination check.
 *
 * Consulted *before* prefix removal: certain confixes cannot legally
 * co-occur, and finding one means stopping rather than proceeding — PRD §3
 * step 4. Stopping here is a real answer, not a failure, so the trace records
 * the table entry and cites it.
 *
 * The table itself is rule data. This module is the lookup, nothing more.
 */

export interface ForbiddenVerdict {
  readonly entry: Forbidden
  /** The suffix already removed that makes the combination illegal. */
  readonly akhiran: string
}

/**
 * Would removing a prefix of type `jenis` produce a combination the table
 * forbids, given the suffixes already stripped from this word?
 */
export function checkForbidden(
  pack: RulePack,
  jenis: Forbidden['jenis'],
  removedAkhiran: readonly string[],
): ForbiddenVerdict | null {
  return forbiddenCombination(pack, jenis, removedAkhiran) ?? null
}
