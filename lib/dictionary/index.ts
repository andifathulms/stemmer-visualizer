import { z } from 'zod'
import { normalize } from '@/lib/engine/text'

/**
 * The dictionary.
 *
 * CLAUDE.md invariant 3: this is an explicit parameter to the engine, never a
 * module import, never a singleton, never captured in a closure at load time.
 * The dictionary panel needs to swap it at runtime and the tests need to swap
 * it freely, and both of those stop working the moment something imports a
 * default instance. Nothing in this module reads a file or holds global state.
 */

export const dictionarySourceSchema = z.object({
  name: z.string().min(1),
  licence: z.string().min(1),
  url: z.string().url().optional(),
  note: z.string().optional(),
})

export const dictionaryEntrySchema = z.object({
  kata: z.string().min(1),
  /** Provenance. No entry without a source — CLAUDE.md conventions. */
  sumber: z.string().min(1),
})

/**
 * An entry is either a bare word or a word with its own source.
 *
 * The bare form exists because a 30,000-word list from a single source would
 * otherwise repeat that source 30,000 times — about a megabyte of JSON to say
 * one thing. `sumberDefault` names it once and every bare entry inherits it,
 * so every entry still has a known source and CLAUDE.md's provenance rule
 * holds. A file with bare entries and no `sumberDefault` is rejected below,
 * which is what keeps that true.
 */
export const dictionaryEntryInputSchema = z.union([z.string().min(1), dictionaryEntrySchema])

export const dictionaryFileSchema = z.object({
  id: z.string().min(1),
  nama: z.string().min(1),
  name: z.string().min(1),
  /** Coverage stated honestly rather than implied to be complete — PRD §5.3. */
  cakupan: z.string().min(1),
  coverage: z.string().min(1),
  sources: z.record(dictionarySourceSchema),
  /** Source for entries given as bare words. */
  sumberDefault: z.string().min(1).optional(),
  // May be empty: the dictionary-free comparison in PRD §5.5 runs the engine
  // against nothing at all, and that is a legitimate dictionary.
  entries: z.array(dictionaryEntryInputSchema),
})
  .superRefine((file, ctx) => {
    if (file.sumberDefault !== undefined) return
    if (!file.entries.some((entry) => typeof entry === 'string')) return
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sumberDefault'],
      message:
        'bare word entries need `sumberDefault`: no dictionary entry may ship without a source',
    })
  })

export type DictionaryEntry = z.infer<typeof dictionaryEntrySchema>
export type DictionaryFile = z.infer<typeof dictionaryFileSchema>

export interface Dictionary {
  readonly id: string
  readonly nama: string
  readonly name: string
  readonly cakupan: string
  readonly coverage: string
  readonly sources: Readonly<Record<string, z.infer<typeof dictionarySourceSchema>>>
  readonly size: number
  /** Is this a root? The single question the algorithm asks, over and over. */
  has(word: string): boolean
  /** Where the entry came from, for the per-word provenance view. */
  sumber(word: string): string | undefined
  /** All roots, sorted. */
  words(): string[]
  /** A new dictionary with `word` added. Never mutates — see invariant 4. */
  with(word: string, sumber?: string): Dictionary
  /** A new dictionary with `word` removed. */
  without(word: string): Dictionary
}

function build(meta: Omit<DictionaryFile, 'entries'>, map: ReadonlyMap<string, string>): Dictionary {
  return {
    id: meta.id,
    nama: meta.nama,
    name: meta.name,
    cakupan: meta.cakupan,
    coverage: meta.coverage,
    sources: meta.sources,
    size: map.size,
    has: (word) => map.has(normalize(word)),
    sumber: (word) => map.get(normalize(word)),
    words: () => [...map.keys()].sort((a, b) => a.localeCompare(b, 'id')),
    with(word, sumber = 'pengguna') {
      const next = new Map(map)
      next.set(normalize(word), sumber)
      return build(meta, next)
    },
    without(word) {
      const next = new Map(map)
      next.delete(normalize(word))
      return build(meta, next)
    },
  }
}

/** Build a dictionary from a parsed dictionary file. */
export function createDictionary(file: DictionaryFile): Dictionary {
  const { entries, ...meta } = file
  return build(
    meta,
    new Map(
      entries.map((entry) =>
        typeof entry === 'string'
          ? // Guaranteed by the schema refinement above: bare entries only
            // exist in a file that declares `sumberDefault`.
            ([normalize(entry), meta.sumberDefault ?? 'tidak diketahui'] as const)
          : ([normalize(entry.kata), entry.sumber] as const),
      ),
    ),
  )
}

/** Build a dictionary from raw JSON, validating it first. */
export function parseDictionary(raw: unknown): Dictionary {
  return createDictionary(dictionaryFileSchema.parse(raw))
}

/**
 * A dictionary from a bare word list. For tests and for the dictionary-free
 * comparison in §5.5, where the point is to show what the dictionary buys.
 */
export function dictionaryOf(words: readonly string[], id = 'ad-hoc'): Dictionary {
  return createDictionary({
    id,
    nama: id,
    name: id,
    cakupan: 'Daftar kata sementara.',
    coverage: 'Ad-hoc word list.',
    sources: { 'ad-hoc': { name: id, licence: 'n/a' } },
    entries: words.map((kata) => ({ kata, sumber: 'ad-hoc' })),
  })
}

/** The empty dictionary: every lookup misses. */
export const EMPTY_DICTIONARY: Dictionary = dictionaryOf([], 'kosong')
