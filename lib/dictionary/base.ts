import baseJson from '@/data/dictionary/base.json'
import { parseDictionary, type Dictionary } from './index'

/**
 * The shipped root dictionary.
 *
 * Deliberately a function, not an exported constant. Invariant 3 says the
 * dictionary is an explicit parameter and never a singleton; an exported
 * `baseDictionary` would be imported straight into the engine within a week.
 * Call sites in the app load it once and pass it down.
 */
export function loadBaseDictionary(): Dictionary {
  return parseDictionary(baseJson)
}
