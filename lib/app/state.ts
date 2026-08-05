/**
 * Application state, encoded in the URL hash.
 *
 * No accounts, no server: state shares by URL hash — PRD §4. Dictionary edits
 * ride along in the hash too, so "here is the word, and here is the dictionary
 * that makes it behave like that" is a single link. That is the fastest way to
 * show someone that the dictionary is an input.
 */

export interface KupasState {
  readonly kata: string
  /** Rule pack id. */
  readonly varian: string
  /** Words added to the shipped dictionary. */
  readonly tambah: readonly string[]
  /** Words removed from it. */
  readonly hapus: readonly string[]
}

export const DEFAULT_STATE: KupasState = {
  kata: 'menyapu',
  varian: 'na96',
  tambah: [],
  hapus: [],
}

function list(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((word) => word.trim())
    .filter(Boolean)
}

export function decodeState(hash: string): KupasState {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  return {
    kata: params.get('kata')?.trim() || DEFAULT_STATE.kata,
    varian: params.get('varian')?.trim() || DEFAULT_STATE.varian,
    tambah: list(params.get('tambah')),
    hapus: list(params.get('hapus')),
  }
}

export function encodeState(state: KupasState): string {
  const params = new URLSearchParams()
  params.set('kata', state.kata)
  if (state.varian !== DEFAULT_STATE.varian) params.set('varian', state.varian)
  if (state.tambah.length > 0) params.set('tambah', state.tambah.join(','))
  if (state.hapus.length > 0) params.set('hapus', state.hapus.join(','))
  return `#${params.toString()}`
}
