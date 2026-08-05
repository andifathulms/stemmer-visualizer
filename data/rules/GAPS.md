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

1. `na96.awalan.me.recode.*` and `na96.awalan.pe.recode.*` — the peluruhan rules.
2. The `C`/`P` side conditions on the ber-/ter-/pe- rules; these are transcribed as regex lookaheads
   and the reading of "P ≠ er" is an interpretation.
3. The forbidden prefix-suffix table.

## Rules deliberately left out

| Rule | Why it is not here |
|---|---|
| `berCAerV` variants beyond `aturan 3` | Could not construct a real Indonesian example that exercises the pattern; shipping a rule with an invented example would make the fixture worthless. |
| `mem{rV}` (`aturan 13`, second half) | The `me-mrV` / `me-prV` readings could not be exemplified. |
| `peCerV → per-erV` (`aturan 32`) | The published form of this rule is unclear to us and we will not guess at it. |
| Infixes (*sisipan*) `-el-`, `-em-`, `-er-` | Not handled by the 1996 algorithm as commonly implemented. If added, they belong in their own pack, not smuggled into this one. |
| Reduplicated compounds (*kata ulang*) | A 2005 extension; belongs in `na05.json` when that pack is written. |
| The `-pun` particle | Also a 2005 extension — see PRD §3. |

## Known consequences

- **`terpercaya` under-stems.** `aturan 8` excludes `P = er`, and `aturan 7` requires a vowel after
  `er`, so no ter- rule fires and the word is returned unchanged. This is a genuine consequence of
  the rules as transcribed, and it ships as a failure-gallery entry rather than being patched away.
