# Known gaps in the rule packs

CLAUDE.md: *"When you don't know a rule, say so. Do not fill a gap in the rule set from general
knowledge of Indonesian morphology and present it as sourced. Mark it unverified or leave it out and
flag it."* This file is that flag. Everything listed here is **absent from the shipped packs**, not
silently approximated.

## Everything in `na96.json` is `verification: "unverified"`

The pack was written from the widely-reproduced form of the rule table, not from the papers
themselves. Each rule cites the rule number it *should* correspond to, so it can be checked one at a
time. Until a rule is checked, treat its citation as an address, not as evidence.

Priority for checking, highest first — recoding is where implementations diverge, so it is where an
unverified rule costs the most:

1. **The `C`/`P` side conditions on the ber-/ter-/pe- rules.** Promoted to first by the oracle run:
   `terpercaya` suggests our reading of "P ≠ er" as *P must not begin with `er`* is simply wrong,
   and a misread condition of that shape is probably repeated across the other rules that carry one.
   See `tests/oracle/divergences.md`.
2. `na96.awalan.me.recode.*` and `na96.awalan.pe.recode.*` — the peluruhan rules. `aturan 18` is
   the specific question: the oracle suggests it may admit a `nyV` reading we dropped.
3. The forbidden prefix-suffix table.

## Source availability — checked 2026-08-05

Verification is blocked on getting the papers, and getting them is harder than it looks. What was
tried, so nobody repeats it:

| Source | State |
|---|---|
| Nazief & Adriani (1996), UI tech report | No open copy found. It is a faculty technical report, not a conference paper, and may only exist in print or on a UI server that no longer serves it. |
| Asian, Williams & Tahaghoghi (2005), ACSC — CRPIT vol. 38, pp. 307–314 | The canonical CRPIT link that DBLP records, `crpit.scem.westernsydney.edu.au/abstracts/CRPITV38Asian.html`, **no longer resolves at all** (DNS failure). CRPIT is nominally open access, so a working mirror probably exists somewhere. |
| Adriani, Asian, Nazief, Tahaghoghi & Williams (2007), *Stemming Indonesian: A confix-stripping approach*, ACM TALIP 6(4), [10.1145/1316457.1316459](https://doi.org/10.1145/1316457.1316459) | Paywalled (ACM DL). **This is the extended journal version of the 2005 paper and is the best target** — it is the most complete published statement of the rule table, and the one to cite once checked. |

Practical routes: ACM DL through an institution, an author's personal or institutional page, or an
inter-library request. Do **not** verify against a secondary paper that reproduces the table — those
reproductions are themselves the widely-copied form this pack was written from, so checking one
against the other proves nothing.

## Rules deliberately left out

| Rule | Why it is not here |
|---|---|
| `berCAerV` variants beyond `aturan 3` | Could not construct a real Indonesian example that exercises the pattern; shipping a rule with an invented example would make the fixture worthless. |
| ~~`perCAP` (`aturan 22`)~~ | **Added 2026-08-05.** Its absence was found by the Sastrawi oracle — `perdaya` was being propped up by a bogus dictionary entry. `perdaya` → `daya`, `pertemuan` → `temu`. |
| `mem{rV}` (`aturan 13`, second half) | The `me-mrV` / `me-prV` readings could not be exemplified. |
| `peCerV → per-erV` (`aturan 32`) | The published form of this rule is unclear to us and we will not guess at it. |
| Infixes (*sisipan*) `-el-`, `-em-`, `-er-` | Not handled by the 1996 algorithm as commonly implemented. If added, they belong in their own pack, not smuggled into this one. |
| Reduplicated compounds (*kata ulang*) | A 2005 extension; belongs in `na05.json` when that pack is written. |
| The `-pun` particle | Also a 2005 extension — see PRD §3. |

## Known consequences

- **`terpercaya` under-stems.** `aturan 8` excludes `P = er`, and `aturan 7` requires a vowel after
  `er`, so no ter- rule fires and the word is returned unchanged. This is a genuine consequence of
  the rules as transcribed, and it ships as a failure-gallery entry rather than being patched away.
  The oracle run since suggests the transcription itself is the fault — see the priority list above.
- **`menyanyi` under-stems**, because `aturan 18` as transcribed gives `meny-` only the assimilated
  `s` reading. Sastrawi reaches `nyanyi`; ours cannot, though the root is in the dictionary.
