'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loadBaseDictionary } from '@/lib/dictionary/base'
import type { Dictionary } from '@/lib/dictionary'
import { parseRulePack } from '@/lib/rules/loader'
import type { RulePack } from '@/lib/rules/schema'
import { interpret } from '@/lib/engine/interpret'
import { enumerate, type CandidateTree } from '@/lib/engine/enumerate'
import type { StemTrace } from '@/lib/engine/trace'
import { DEFAULT_STATE, decodeState, encodeState, type KupasState } from '@/lib/app/state'
import na96 from '@/data/rules/na96.json'

/**
 * One engine, one dictionary, shared by every view.
 *
 * The dictionary is held here and passed *into* the engine on every call — it
 * is never imported by `lib/engine` (invariant 3). That is what lets the
 * dictionary panel add a word and have the trace, the candidate tree and the
 * document view all change together.
 *
 * Components render what this computes; they compute nothing themselves
 * (invariant 13).
 */

const PACKS: Record<string, RulePack> = { na96: parseRulePack(na96) }

interface KupasContextValue {
  readonly state: KupasState
  readonly pack: RulePack
  readonly packs: readonly RulePack[]
  readonly dictionary: Dictionary
  readonly baseDictionary: Dictionary
  readonly trace: StemTrace
  readonly tree: CandidateTree
  setKata(kata: string): void
  setVarian(varian: string): void
  addWord(kata: string): void
  removeWord(kata: string): void
  resetDictionary(): void
  /** A shareable link to the current state. */
  permalink(): string
}

const KupasContext = createContext<KupasContextValue | null>(null)

export function KupasProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KupasState>(DEFAULT_STATE)

  // Read the hash after mount: the export is static, so the server render can
  // never know it.
  useEffect(() => {
    const read = () => setState(decodeState(window.location.hash))
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  const update = useCallback((next: KupasState) => {
    setState(next)
    window.history.replaceState(null, '', encodeState(next))
  }, [])

  const baseDictionary = useMemo(() => loadBaseDictionary(), [])

  const dictionary = useMemo(() => {
    let d = baseDictionary
    for (const kata of state.hapus) d = d.without(kata)
    for (const kata of state.tambah) d = d.with(kata, 'pengguna')
    return d
  }, [baseDictionary, state.hapus, state.tambah])

  const pack = PACKS[state.varian] ?? PACKS.na96!
  const trace = useMemo(
    () => interpret({ word: state.kata, pack, dictionary }),
    [state.kata, pack, dictionary],
  )
  const tree = useMemo(
    () => enumerate({ word: state.kata, pack, dictionary }),
    [state.kata, pack, dictionary],
  )

  const value: KupasContextValue = {
    state,
    pack,
    packs: Object.values(PACKS),
    dictionary,
    baseDictionary,
    trace,
    tree,
    setKata: (kata) => update({ ...state, kata }),
    setVarian: (varian) => update({ ...state, varian }),
    addWord: (kata) =>
      update({
        ...state,
        tambah: [...new Set([...state.tambah, kata.trim().toLowerCase()])],
        hapus: state.hapus.filter((w) => w !== kata.trim().toLowerCase()),
      }),
    removeWord: (kata) =>
      update({
        ...state,
        hapus: [...new Set([...state.hapus, kata.trim().toLowerCase()])],
        tambah: state.tambah.filter((w) => w !== kata.trim().toLowerCase()),
      }),
    resetDictionary: () => update({ ...state, tambah: [], hapus: [] }),
    permalink: () =>
      typeof window === 'undefined'
        ? encodeState(state)
        : `${window.location.origin}${window.location.pathname}${encodeState(state)}`,
  }

  return <KupasContext.Provider value={value}>{children}</KupasContext.Provider>
}

export function useKupas(): KupasContextValue {
  const value = useContext(KupasContext)
  if (!value) throw new Error('useKupas must be used inside <KupasProvider>')
  return value
}
