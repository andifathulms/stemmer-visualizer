import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { jelaskanKegagalan } from '@/lib/app/kegagalan'
import { dictionary, pack, shipped } from '../helpers'

/**
 * Dictionary-caused failure, pinned the way `beruang` pins ambiguity.
 *
 * The thing being protected is a distinction the UI now makes in prose: when a
 * word comes back unstemmed, the rules usually worked and the *dictionary* came
 * up short. If that ever stops being true, KegagalanNote's copy becomes a lie
 * and these tests are how we find out.
 *
 * Two dictionaries, because the claim is about both:
 *
 *   - against the curated 293-word list, `menendang` is the canonical
 *     demonstration — the algorithm restores the `t` that assimilated into
 *     `n-`, reaches `tendang`, and throws it away;
 *   - against the ~30,000-word list the app actually ships, `menendang` now
 *     resolves, and `mendownload` takes over as the case that still fails.
 *     A loanword is the honest example there: no 2016 root list contains it,
 *     and the algorithm still gets to `download` correctly.
 */
const p = pack()

describe('jelaskanKegagalan', () => {
  describe('against the curated dictionary', () => {
    const d = dictionary()

    it('names the forms the algorithm reached and the dictionary rejected', () => {
      const trace = interpret({ word: 'menendang', pack: p, dictionary: d })

      expect(trace.found).toBe(false)

      const kegagalan = jelaskanKegagalan(trace)
      expect(kegagalan).not.toBeNull()
      // The correct root is among the forms it tried and discarded.
      expect(kegagalan?.dicoba).toContain('tendang')
      expect(kegagalan?.terakhir).toBe('tendang')
    })

    it('is the dictionary, not the rules: adding the root fixes the answer', () => {
      // The same rule pack, one word added. If this ever fails, the failure is
      // in the rules after all and KegagalanNote's copy is wrong.
      const trace = interpret({ word: 'menendang', pack: p, dictionary: d.with('tendang', 'uji') })

      expect(trace.found).toBe(true)
      expect(trace.result).toBe('tendang')
      expect(jelaskanKegagalan(trace)).toBeNull()
    })

    it('never offers the input word itself as something to add', () => {
      const trace = interpret({ word: 'menendang', pack: p, dictionary: d })

      expect(jelaskanKegagalan(trace)?.dicoba).not.toContain('menendang')
    })

    it('explains nothing when the word stemmed successfully', () => {
      const trace = interpret({ word: 'menulis', pack: p, dictionary: d })

      expect(trace.result).toBe('tulis')
      expect(jelaskanKegagalan(trace)).toBeNull()
    })
  })

  describe('against the shipped dictionary', () => {
    const d = shipped()

    it('resolves menendang, which the curated list could not', () => {
      // The reason the shipped dictionary was grown in the first place.
      const trace = interpret({ word: 'menendang', pack: p, dictionary: d })

      expect(trace.result).toBe('tendang')
      expect(jelaskanKegagalan(trace)).toBeNull()
    })

    it('still explains a genuine miss, because 30,000 roots is not every root', () => {
      const trace = interpret({ word: 'mendownload', pack: p, dictionary: d })

      expect(trace.found).toBe(false)
      // The rules did their job: men- came off and `download` was reached.
      expect(jelaskanKegagalan(trace)?.terakhir).toBe('download')
    })
  })
})
