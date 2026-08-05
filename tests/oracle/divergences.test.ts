import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { enumerate } from '@/lib/engine/enumerate'
import { dictionary, pack, shipped } from '../helpers'

/**
 * The classifications in `divergences.md`, made executable.
 *
 * A classification written only in prose rots: someone changes a rule, the
 * explanation quietly stops being true, and the record becomes worse than
 * useless because it still reads as authoritative. So each entry is pinned
 * here.
 *
 * Where the cause is claimed to be the dictionary, the test *proves* it by
 * adding the word Sastrawi has and reproducing Sastrawi's answer exactly. That
 * is a real demonstration, not a restatement.
 *
 * Where the cause is a rule, the test pins current behaviour so that fixing it
 * fails here and forces the entry to be rewritten. These assertions are
 * therefore expectations of *known-wrong* output, and they say so — never
 * "correct" them to match Sastrawi. Invariant 11.
 *
 * Sastrawi's answers below were recorded from PySastrawi 1.2.1 on 2026-08-05.
 */
const p = pack()
const d = dictionary()

const stem = (word: string, dict = d) => interpret({ word, pack: p, dictionary: dict }).result

describe('beda-kamus — the dictionary decides, not the rules', () => {
  it('perusakan: adding rusa reproduces Sastrawi exactly', () => {
    expect(stem('perusakan')).toBe('rusak')
    // Sastrawi has rusa (deer) and answers "rusa". Give ours the same word and
    // it answers the same way — so the rules never disagreed at all.
    expect(stem('perusakan', d.with('rusa', 'uji'))).toBe('rusa')
  })

  it('perusakan reports both readings once the dictionary admits both', () => {
    const tree = enumerate({ word: 'perusakan', pack: p, dictionary: d.with('rusa', 'uji') })
    expect(tree.candidates.map((c) => c.kata).sort()).toEqual(['rusa', 'rusak'])
  })

  it('berapa: adding berapa reproduces Sastrawi exactly', () => {
    expect(stem('berapa')).toBe('apa')
    expect(stem('berapa', d.with('berapa', 'uji'))).toBe('berapa')
  })
})

describe('beda-kamus — mengupas, reclassified', () => {
  // This was filed under `ambigu` on the claim that Sastrawi has both `upas`
  // and `kupas` as roots. It does not. Sastrawi ships two lists and only
  // `kata-dasar.original.txt` contains `upas`; the list the stemmer actually
  // loads, `kata-dasar.txt`, has had it removed. Sastrawi cannot return `upas`
  // for any input, so the two implementations were never choosing between
  // readings — one of them only ever had one reading available.
  it('the ambiguity is real against a dictionary that holds both roots', () => {
    expect(d.has('upas')).toBe(true)
    expect(d.has('kupas')).toBe(true)
    expect(stem('mengupas')).toBe('upas')

    const trace = interpret({ word: 'mengupas', pack: p, dictionary: d })
    expect(trace.ambiguity?.alternatives.map((a) => a.kata).sort()).toEqual(['kupas', 'upas'])
    expect(trace.ambiguity?.reason).toBeTruthy()
  })

  it("Sastrawi's own list lacks upas, which is the whole divergence", () => {
    // The proof of the reclassification: same rules, Sastrawi's dictionary,
    // Sastrawi's answer. Nothing about aturan 17 had to change.
    const sastrawi = shipped()
    expect(sastrawi.has('upas')).toBe(false)
    expect(sastrawi.has('kupas')).toBe(true)
    expect(stem('mengupas', sastrawi)).toBe('kupas')
  })
})

describe('what the app ships today', () => {
  // The shipped dictionary is Sastrawi's root list, so these pin the answers a
  // visitor actually gets. They are deliberately separate from the assertions
  // above, which are pinned to the curated list the fixtures were recorded
  // against — see tests/helpers.ts.
  const sastrawi = shipped()

  it('resolves berapa and menendang, which were dictionary gaps', () => {
    expect(stem('berapa', sastrawi)).toBe('berapa')
    expect(stem('menendang', sastrawi)).toBe('tendang')
  })

  it('over-stems perusakan to rusa — coverage is not correctness', () => {
    // Agreement with Sastrawi bought by adopting its worse answer. Recorded so
    // that nobody reads the agreement as a win. Invariant 11.
    expect(stem('perusakan', sastrawi)).toBe('rusa')
    expect(stem('perusakan')).toBe('rusak') // the curated list still gets it right
  })

  it('leaves the three rule-level divergences exactly where they were', () => {
    // None of these move when the dictionary changes, which is positive
    // evidence that they are about the rules and that the paper settles them.
    expect(stem('terpercaya', sastrawi)).toBe('terpercaya')
    expect(stem('bertemu', sastrawi)).toBe('bertemu')
    expect(stem('menyanyi', sastrawi)).toBe('menyanyi')
  })
})

describe('belum-jelas — pinned as wrong, pending the paper', () => {
  // These three expect output we believe is WRONG. They exist so that a fix
  // cannot land without the classification in divergences.md being rewritten.
  // Do not align them to Sastrawi to make them pass.

  it('terpercaya is untouched — our reading of aturan 8 P != er is suspect', () => {
    expect(stem('terpercaya')).toBe('terpercaya') // Sastrawi: percaya
  })

  it('bertemu loses -mu greedily and never backtracks over it', () => {
    expect(stem('bertemu')).toBe('bertemu') // Sastrawi: temu
  })

  it('menyanyi cannot be reached — aturan 18 has only the s reading here', () => {
    expect(d.has('nyanyi')).toBe(true) // the root is present…
    expect(stem('menyanyi')).toBe('menyanyi') // …and still unreachable. Sastrawi: nyanyi
  })
})

describe('fixed — regressions the oracle caught', () => {
  it('derived forms are no longer listed as roots', () => {
    for (const derived of ['hargai', 'sertai', 'perdaya']) {
      expect(d.has(derived), derived).toBe(false)
    }
    for (const root of ['harga', 'serta', 'daya']) {
      expect(d.has(root), root).toBe(true)
    }
  })

  it('aturan 22 strips per- before a consonant', () => {
    expect(stem('perdaya')).toBe('daya')
    expect(stem('pertemuan')).toBe('temu')
    // and it reaches through two prefix iterations
    expect(stem('teperdaya')).toBe('daya')
  })
})
