import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { parseRulePack } from '@/lib/rules/loader'
import { loadBaseDictionary } from '@/lib/dictionary/base'
import { jelaskanKegagalan } from '@/lib/app/kegagalan'
import na96 from '@/data/rules/na96.json'

/**
 * `menendang` is the permanent fixture for dictionary-caused failure, the way
 * `beruang` is the permanent fixture for ambiguity.
 *
 * It matters because the algorithm gets it *right* and the answer is thrown
 * away: `me-` comes off and the peluruhan restores the `t` that assimilated
 * into `n-`, producing `tendang`, which is simply not in the dictionary. Any
 * change that makes this look like a rule failure has broken the thing this
 * project exists to show (PRD §2).
 */
const pack = parseRulePack(na96)

describe('jelaskanKegagalan', () => {
  it('names the forms the algorithm reached and the dictionary rejected', () => {
    const dictionary = loadBaseDictionary()
    const trace = interpret({ word: 'menendang', pack, dictionary })

    expect(trace.found).toBe(false)

    const kegagalan = jelaskanKegagalan(trace)
    expect(kegagalan).not.toBeNull()
    // The correct root is among the forms it tried and discarded.
    expect(kegagalan?.dicoba).toContain('tendang')
    expect(kegagalan?.terakhir).toBe('tendang')
  })

  it('is the dictionary, not the rules: adding the root fixes the answer', () => {
    // The same rule pack, one word added. If this ever fails, the failure is
    // in the rules after all and the copy in KegagalanNote is a lie.
    const dictionary = loadBaseDictionary().with('tendang', 'test')
    const trace = interpret({ word: 'menendang', pack, dictionary })

    expect(trace.found).toBe(true)
    expect(trace.result).toBe('tendang')
    expect(jelaskanKegagalan(trace)).toBeNull()
  })

  it('never offers the input word itself as something to add', () => {
    const dictionary = loadBaseDictionary()
    const trace = interpret({ word: 'menendang', pack, dictionary })

    expect(jelaskanKegagalan(trace)?.dicoba).not.toContain('menendang')
  })

  it('explains nothing when the word stemmed successfully', () => {
    const dictionary = loadBaseDictionary()
    const trace = interpret({ word: 'menulis', pack, dictionary })

    expect(trace.result).toBe('tulis')
    expect(jelaskanKegagalan(trace)).toBeNull()
  })
})
