import sastrawiJson from '@/data/dictionary/sastrawi.json'
import { parseDictionary, type Dictionary } from './index'

/**
 * The full root list, loaded synchronously.
 *
 * SERVER AND TESTS ONLY. Importing this from a client component pulls ~30,000
 * words into the page bundle and undoes the code split that
 * `lib/dictionary/base.ts` exists to create — the browser gets the same list
 * from `loadFullDictionary()` as a separate chunk.
 *
 * It is worth having because build-time rendering and the test suite both want
 * the dictionary without an await, and neither pays a bundle cost for it.
 */
export function loadFullDictionarySync(): Dictionary {
  return parseDictionary(sastrawiJson)
}
