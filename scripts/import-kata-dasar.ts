/**
 * DEV ONLY — regenerates `data/dictionary/sastrawi.json` from the root list
 * shipped inside a local PySastrawi install.
 *
 * Like `fixtures:record`, this never runs in CI and never ships in the browser
 * bundle. It reads a *data file*, not Sastrawi's code: the list of Indonesian
 * root words, which is MIT-licensed and redistributable with its copyright
 * notice attached. Nothing in `lib/` imports Sastrawi, and the runtime still
 * has no stemming dependency.
 *
 * This does not make Sastrawi an authority on roots any more than the oracle
 * makes it an authority on stemming (invariant 11). It is one sourced word
 * list among the several this project could ship, and the dictionary remains
 * an editable input.
 *
 *   pnpm dictionary:import
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const LICENCE_NOTICE =
  'The MIT License (MIT), Copyright (c) 2016 Hanif Amal Robbani. ' +
  'Redistributed under the terms of that licence; see data/dictionary/LICENCE-sastrawi.txt.'

function sastrawiDataDir(): string {
  // Ask the interpreter where the package actually is rather than guessing a
  // site-packages path that differs per machine and per Python version.
  const out = execFileSync(
    'python3',
    ['-c', 'import Sastrawi, os; print(os.path.dirname(Sastrawi.__file__))'],
    { encoding: 'utf8' },
  ).trim()
  return join(out, 'Stemmer', 'data')
}

function main(): void {
  const dir = sastrawiDataDir()
  const raw = readFileSync(join(dir, 'kata-dasar.txt'), 'utf8')

  const kata = [...new Set(raw.split('\n').map((line) => line.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'id'),
  )

  const file = {
    id: 'sastrawi-kata-dasar',
    nama: 'Kamus kata dasar Sastrawi',
    name: 'Sastrawi root dictionary',
    cakupan: `${kata.length.toLocaleString('id-ID')} kata dasar dari daftar kata dasar Sastrawi (lisensi MIT). Jauh lebih lengkap daripada daftar kurasi manual, tetapi tetap bukan konstanta: kamus di sini adalah masukan yang bisa disunting, dan kata yang tidak ada di dalamnya tetap akan membuat algoritma gagal.`,
    coverage: `${kata.length.toLocaleString('en-GB')} roots from Sastrawi's kata-dasar list (MIT licensed). Far fuller than a hand-curated list, but still not a constant: the dictionary here is an editable input, and a word missing from it will still make the algorithm fail.`,
    sources: {
      sastrawi: {
        name: 'Sastrawi — kata-dasar.txt',
        licence: 'MIT',
        url: 'https://github.com/sastrawi/sastrawi',
        note: LICENCE_NOTICE,
      },
    },
    // Every entry is from the one source, so the file names it once rather
    // than repeating it 29,932 times. The provenance rule is about every entry
    // having a known source, not about the encoding.
    sumberDefault: 'sastrawi',
    entries: kata,
  }

  const target = join(process.cwd(), 'data', 'dictionary', 'sastrawi.json')
  writeFileSync(target, `${JSON.stringify(file)}\n`, 'utf8')

  console.log(`wrote ${kata.length} roots to ${target}`)
}

main()
