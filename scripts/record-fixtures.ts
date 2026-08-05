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

/** Word list to compare on: the dictionary plus the paper fixtures' inputs. */
function words(): string[] {
  const dict = JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'dictionary', 'base.json'), 'utf8'),
  ) as { entries: { kata: string }[] }
  const papers = JSON.parse(
    readFileSync(join(process.cwd(), 'tests', 'papers', 'fixtures.json'), 'utf8'),
  ) as { cases: { kata: string }[] }

  return [...new Set([...papers.cases.map((c) => c.kata), ...dict.entries.map((e) => e.kata)])]
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
