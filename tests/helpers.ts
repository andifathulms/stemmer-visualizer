import { loadCuratedDictionary } from '@/lib/dictionary/base'
import { loadFullDictionarySync } from '@/lib/dictionary/full'
import { parseRulePack } from '@/lib/rules/loader'
import type { RulePack } from '@/lib/rules/schema'
import type { Dictionary } from '@/lib/dictionary'
import na96 from '@/data/rules/na96.json'

/**
 * Test fixtures build their own rule pack and dictionary and pass them in.
 * Nothing here is a shared mutable singleton — the dictionary is an explicit
 * parameter in the tests for the same reason it is one in the engine
 * (invariant 3), and half these tests work by swapping it.
 *
 * `dictionary()` used to return whatever the app happened to ship, which read
 * as harmless and was not. Every paper fixture, every recorded divergence and
 * every ambiguity case was authored against the 293-word curated list, and
 * several of them *demonstrate* the dictionary dependency by adding a word and
 * watching the answer move — "adding rusa reproduces Sastrawi exactly" proves
 * nothing if rusa is already there. Swapping the shipped dictionary silently
 * changed what twelve assertions meant.
 *
 * So the test dictionary is now pinned to the list the fixtures were recorded
 * against, and it stays pinned no matter what the app ships. What the app
 * ships is worth testing too — `shipped()` is for that, and those tests say so
 * in their names.
 */
export function pack(): RulePack {
  return parseRulePack(na96)
}

/**
 * The 293-word hand-curated list: the dictionary every recorded fixture in
 * this suite was authored against. Pinned deliberately — do not repoint this
 * at the shipped dictionary to make something pass.
 */
export function dictionary(): Dictionary {
  return loadCuratedDictionary()
}

/** What the application actually ships to a visitor today. */
export function shipped(): Dictionary {
  return loadFullDictionarySync()
}
