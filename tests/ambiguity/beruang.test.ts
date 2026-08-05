import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { enumerate } from '@/lib/engine/enumerate'
import { dictionary, pack } from '../helpers'

/**
 * *beruang* is a permanent fixture — CLAUDE.md testing rules.
 *
 * It is the standard case for the thing this project exists to show: the
 * problem genuinely has more than one answer, the algorithm returns one, and
 * a tool that only reports that one is hiding the interesting part.
 */
describe('beruang', () => {
  const p = pack()
  const d = dictionary()

  it('is reported as multi-candidate, not silently resolved', () => {
    const trace = interpret({ word: 'beruang', pack: p, dictionary: d })
    expect(trace.ambiguity).not.toBeNull()
    expect(trace.ambiguity?.alternatives.length).toBeGreaterThan(1)
  })

  it('offers beruang, uang and ruang as dictionary-valid readings', () => {
    const tree = enumerate({ word: 'beruang', pack: p, dictionary: d })
    const roots = tree.candidates.map((c) => c.kata).sort()
    expect(roots).toEqual(['beruang', 'ruang', 'uang'])
  })

  it('states why the algorithm chose the one it chose', () => {
    const trace = interpret({ word: 'beruang', pack: p, dictionary: d })
    expect(trace.result).toBe('beruang')
    expect(trace.ambiguity?.reasonCode).toBe('kata-ada-di-kamus')
    expect(trace.ambiguity?.reason).toContain('kamus')
  })

  it('changes its answer when the dictionary changes, and says so', () => {
    // Remove the root reading and ber- + uang becomes the only analysis. This
    // is the dictionary dependency, made visible.
    const without = d.without('beruang')
    const trace = interpret({ word: 'beruang', pack: p, dictionary: without })
    expect(trace.result).toBe('uang')
    expect(trace.ambiguity?.alternatives.map((a) => a.kata).sort()).toEqual(['ruang', 'uang'])
  })
})

describe('other ambiguous words', () => {
  const p = pack()
  const d = dictionary()

  it('mengupas admits both upas and kupas', () => {
    const tree = enumerate({ word: 'mengupas', pack: p, dictionary: d })
    expect(tree.candidates.map((c) => c.kata).sort()).toEqual(['kupas', 'upas'])
  })

  it('names the reading that won, and how many there were', () => {
    const trace = interpret({ word: 'mengupas', pack: p, dictionary: d })
    expect(trace.ambiguity?.reasonCode).toBe('bacaan-pertama')
    expect(trace.ambiguity?.reason).toContain('2 bacaan')
  })
})
