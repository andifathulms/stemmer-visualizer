import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { enumerate } from '@/lib/engine/enumerate'
import { EMPTY_DICTIONARY } from '@/lib/dictionary'
import { dictionary, pack } from '../helpers'
import fixtures from '../papers/fixtures.json'

const p = pack()
const d = dictionary()
const WORDS = fixtures.cases.map((k) => k.kata)

describe('idempotence', () => {
  it('stemming a root returns it unchanged, across the whole dictionary', () => {
    // A cheap total property that catches over-stemming — PRD §7.
    for (const kata of d.words()) {
      const trace = interpret({ word: kata, pack: p, dictionary: d })
      expect(trace.result, kata).toBe(kata)
      expect(trace.found, kata).toBe(true)
    }
  })

  it('stemming the result again returns the same result', () => {
    for (const kata of WORDS) {
      const once = interpret({ word: kata, pack: p, dictionary: d }).result
      const twice = interpret({ word: once, pack: p, dictionary: d }).result
      expect(twice, kata).toBe(once)
    }
  })
})

describe('enumeration soundness', () => {
  it('the root interpret returns always appears in the candidate set', () => {
    // Soundness, not equality — invariant 6. enumerate deliberately finds
    // more, and asserting set equality here would be asserting the product
    // away.
    for (const kata of [...WORDS, ...d.words().slice(0, 60)]) {
      const trace = interpret({ word: kata, pack: p, dictionary: d })
      if (!trace.found) continue
      const tree = enumerate({ word: kata, pack: p, dictionary: d })
      expect(
        tree.candidates.map((c) => c.kata),
        kata,
      ).toContain(trace.result)
    }
  })

  it('enumeration finds at least as many candidates as interpret returns', () => {
    for (const kata of WORDS) {
      const tree = enumerate({ word: kata, pack: p, dictionary: d })
      expect(tree.candidates.length, kata).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('dictionary independence', () => {
  it('adding an unrelated word never changes an unrelated result', () => {
    const augmented = d.with('zwqxfoo', 'uji')
    for (const kata of WORDS) {
      const before = interpret({ word: kata, pack: p, dictionary: d })
      const after = interpret({ word: kata, pack: p, dictionary: augmented })
      expect(after.result, kata).toBe(before.result)
      expect(after.steps.length, kata).toBe(before.steps.length)
    }
  })

  it('removing the returned root changes the outcome', () => {
    for (const kata of WORDS) {
      const before = interpret({ word: kata, pack: p, dictionary: d })
      const without = d.without(before.result)
      const after = interpret({ word: kata, pack: p, dictionary: without })
      expect(after.result, kata).not.toBe(before.result)
    }
  })

  it('with no dictionary at all, every word is returned unchanged', () => {
    // What the dictionary buys, stated as a test — PRD §5.5.
    for (const kata of WORDS) {
      const trace = interpret({ word: kata, pack: p, dictionary: EMPTY_DICTIONARY })
      expect(trace.found, kata).toBe(false)
      expect(trace.result, kata).toBe(kata)
    }
  })
})

describe('determinism', () => {
  it('produces a byte-identical trace for identical inputs', () => {
    for (const kata of WORDS) {
      const a = JSON.stringify(interpret({ word: kata, pack: p, dictionary: d }))
      const b = JSON.stringify(interpret({ word: kata, pack: pack(), dictionary: dictionary() }))
      expect(b, kata).toBe(a)
    }
  })

  it('normalises case and Unicode form before doing anything', () => {
    const upper = interpret({ word: 'MENYAPU', pack: p, dictionary: d })
    const lower = interpret({ word: 'menyapu', pack: p, dictionary: d })
    expect(upper.result).toBe(lower.result)
    expect(upper.kata).toBe(lower.kata)
  })
})

describe('trace integrity', () => {
  it('keeps abandoned steps rather than deleting them', () => {
    // perusakan tries -kan first and undoes it — invariant 9.
    const trace = interpret({ word: 'perusakan', pack: p, dictionary: d })
    const abandoned = trace.steps.filter((s) => s.type === 'buang' && s.abandoned)
    expect(abandoned.length).toBeGreaterThan(0)
    expect(trace.result).toBe('rusak')
  })

  it('gives step indices that match their position', () => {
    for (const kata of WORDS) {
      const trace = interpret({ word: kata, pack: p, dictionary: d })
      trace.steps.forEach((step, index) => expect(step.index, kata).toBe(index))
    }
  })

  it('never reports a chosen root without a reason', () => {
    // Invariant 7, asserted rather than trusted to the type system alone.
    for (const kata of WORDS) {
      const { ambiguity } = interpret({ word: kata, pack: p, dictionary: d })
      if (!ambiguity) continue
      expect(ambiguity.reason.length, kata).toBeGreaterThan(0)
      expect(ambiguity.alternatives.length, kata).toBeGreaterThan(1)
      expect(ambiguity.alternatives.map((a) => a.kata), kata).toContain(ambiguity.chosen)
    }
  })
})
