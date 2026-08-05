/**
 * DEVELOPMENT ONLY. Records (word → Sastrawi stem) pairs as oracle fixtures.
 *
 * Sastrawi is a development-time oracle and never a runtime dependency: it is
 * not in `dependencies`, nothing under `lib/` imports it, and this script does
 * not run in CI or ship in the browser bundle (CLAUDE.md, stack).
 *
 * Requires PySastrawi on the local machine:
 *   pip install PySastrawi
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

if (process.env.CI) {
  console.error('✗ fixtures:record does not run in CI')
  process.exit(1)
}

const OUT = join(process.cwd(), 'tests', 'oracle', 'fixtures.json')

/**
 * Word list to compare on: the paper fixtures, the gallery, and the whole
 * dictionary.
 *
 * The gallery belongs here and was missing at first. Those are the words
 * already known to be hard, so they are exactly the ones an oracle has
 * something to say about — leaving them out meant comparing hardest on the
 * words least likely to disagree.
 */
function words(): string[] {
  const read = (...path: string[]): unknown =>
    JSON.parse(readFileSync(join(process.cwd(), ...path), 'utf8'))

  const dict = read('data', 'dictionary', 'base.json') as { entries: { kata: string }[] }
  const papers = read('tests', 'papers', 'fixtures.json') as { cases: { kata: string }[] }
  const gallery = read('data', 'galeri.json') as { entries: { kata: string }[] }

  return [
    ...new Set([
      ...papers.cases.map((c) => c.kata),
      ...gallery.entries.map((e) => e.kata),
      ...dict.entries.map((e) => e.kata),
    ]),
  ]
}

const PY = `
import json, sys
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

stemmer = StemmerFactory().create_stemmer()
words = json.load(sys.stdin)
json.dump([{"kata": w, "sastrawi": stemmer.stem(w)} for w in words], sys.stdout)
`

function main(): void {
  const list = words()
  let raw: string
  try {
    raw = execFileSync('python3', ['-c', PY], { input: JSON.stringify(list), encoding: 'utf8' })
  } catch (error) {
    console.error('✗ could not run PySastrawi. Install it with: pip install PySastrawi')
    console.error(String(error))
    process.exit(1)
  }

  const pairs: unknown = JSON.parse(raw)
  writeFileSync(
    OUT,
    `${JSON.stringify({ recordedWith: 'PySastrawi (local)', pairs }, null, 2)}\n`,
    'utf8',
  )
  console.log(`✓ ${OUT} — ${list.length} pairs`)
  console.log('  Divergences are classified in tests/oracle/divergences.md, never auto-resolved.')
}

main()
