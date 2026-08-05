import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { collectCandidates, enumerate } from '@/lib/engine/enumerate'
import { dictionary, pack } from '../helpers'
import fixtures from './fixtures.json'

/**
 * Worked examples. "Fixture before rule" — CLAUDE.md working style.
 *
 * Every case carries its claimed source and whether that claim has been
 * checked. They are all `unverified` today: written from the widely-reproduced
 * form of the algorithm rather than transcribed from the papers. The test
 * below asserts that fact rather than letting it drift silently, so that
 * flipping a case to `verified` is a deliberate act.
 */
describe('worked examples', () => {
  const p = pack()
  const d = dictionary()

  for (const kase of fixtures.cases) {
    it(`${kase.kata} → ${kase.kataDasar} (${kase.citation.source} ${kase.citation.locus})`, () => {
      const trace = interpret({ word: kase.kata, pack: p, dictionary: d })
      expect(trace.result).toBe(kase.kataDasar)
      expect(trace.found).toBe(true)
    })
  }

  it('every case declares a citation and a verification status', () => {
    for (const kase of fixtures.cases) {
      expect(kase.citation.source, kase.kata).toBeTruthy()
      expect(kase.citation.locus, kase.kata).toBeTruthy()
      expect(['verified', 'unverified'], kase.kata).toContain(kase.verification)
    }
  })

  it('records that no case has been checked against a paper yet', () => {
    // When you verify a case against the source, flip it and update this
    // count. It exists so that "all unverified" cannot quietly become the
    // permanent state without anyone noticing.
    const unverified = fixtures.cases.filter((k) => k.verification === 'unverified')
    expect(unverified).toHaveLength(fixtures.cases.length)
  })

  it('the returned root appears in the candidate set for every case', () => {
    for (const kase of fixtures.cases) {
      const tree = enumerate({ word: kase.kata, pack: p, dictionary: d })
      const roots = collectCandidates(tree.root).map((c) => c.kata)
      expect(roots, kase.kata).toContain(kase.kataDasar)
    }
  })
})
