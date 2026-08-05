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

export const dictionaryFileSchema = z.object({
  id: z.string().min(1),
  nama: z.string().min(1),
  name: z.string().min(1),
  /** Coverage stated honestly rather than implied to be complete — PRD §5.3. */
  cakupan: z.string().min(1),
  coverage: z.string().min(1),
  sources: z.record(dictionarySourceSchema),
  // May be empty: the dictionary-free comparison in PRD §5.5 runs the engine
  // against nothing at all, and that is a legitimate dictionary.
  entries: z.array(dictionaryEntrySchema),
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
    new Map(entries.map((entry) => [normalize(entry.kata), entry.sumber] as const)),
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
