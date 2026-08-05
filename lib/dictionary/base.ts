import curatedJson from '@/data/dictionary/base.json'
import { parseDictionary, type Dictionary } from './index'

/**
 * The shipped root dictionary, in two pieces.
 *
 * Deliberately functions, not exported constants. Invariant 3 says the
 * dictionary is an explicit parameter and never a singleton; an exported
 * `baseDictionary` would be imported straight into the engine within a week.
 *
 * The split exists because the full list is ~30,000 words and this module is
 * reachable from client code. Importing it statically here put the whole list
 * into the page bundle and took First Load JS from 122 kB to 210 kB —
 * CLAUDE.md's deployment note asks for the dictionary as a separate chunk, and
 * that is what `loadFullDictionary` is: a dynamic import webpack can split.
 *
 * Anything running on the server or in tests wants `lib/dictionary/full.ts`
 * instead, which loads the same file synchronously. That module must never be
 * imported from a client component, or the split is undone.
 */

/**
 * The 293-word hand-curated list.
 *
 * Kept, and still loaded statically, because it is small enough to be free and
 * because it lets the trace render immediately rather than behind a spinner.
 * It is also the dictionary every recorded fixture and oracle divergence was
 * authored against — see tests/oracle/divergences.md.
 */
export function loadCuratedDictionary(): Dictionary {
  return parseDictionary(curatedJson)
}

/**
 * The ~30,000-word Sastrawi root list, as its own chunk.
 *
 * The default the app runs on. The small list was chosen to make the
 * dictionary dependency impossible to miss, and it did that — but it also
 * meant most real input dead-ended, and nobody learns "the dictionary is an
 * input" from a tool that fails on `menendang`. The lesson survives: 30,000
 * roots is still not every root, the panel still lets you delete words to
 * break the answer on purpose, and a miss is now explained rather than
 * reported as a shrug.
 */
export async function loadFullDictionary(): Promise<Dictionary> {
  const json = await import('@/data/dictionary/sastrawi.json')
  return parseDictionary(json.default)
}
