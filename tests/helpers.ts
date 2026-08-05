import { loadBaseDictionary } from '@/lib/dictionary/base'
import { parseRulePack } from '@/lib/rules/loader'
import type { RulePack } from '@/lib/rules/schema'
import type { Dictionary } from '@/lib/dictionary'
import na96 from '@/data/rules/na96.json'

/**
 * Test fixtures build their own rule pack and dictionary and pass them in.
 * Nothing here is a shared mutable singleton — the dictionary is an explicit
 * parameter in the tests for the same reason it is one in the engine
 * (invariant 3), and half these tests work by swapping it.
 */
export function pack(): RulePack {
  return parseRulePack(na96)
}

export function dictionary(): Dictionary {
  return loadBaseDictionary()
}
