# Classified divergences from Sastrawi

Recorded 2026-08-05 against PySastrawi 1.2.1, over 315 words: the paper fixtures, the failure
gallery, and the whole dictionary. **Nine divergences appeared. Three were our bug and are fixed;
six remain and are classified below.** See `README.md` for the classification vocabulary.

Every classification here is pinned by an assertion in `divergences.test.ts`. Where the cause is the
dictionary, the test *proves* it by swapping the dictionary and reproducing Sastrawi's answer
exactly. Where the cause is a rule, the test pins the current behaviour so that changing it forces
someone to come back and rewrite the entry.

## Fixed: three were our bug, and the oracle found them

Not in the rules — in the dictionary and in a missing rule. This is what an oracle is for.

| Word | Was | Cause | Fix |
|---|---|---|---|
| `hargai` | `hargai` | `hargai` was listed as a root. It is `harga` + `-i`. | Entry removed. |
| `sertai` | `sertai` | Same: `sertai` listed as a root, `serta` absent. | Entry removed, `serta` added. |
| `perdaya` | `perdaya` | `perdaya` listed as a root to paper over a missing rule — `per-` before a consonant, `aturan 22`, was one of the rules left out in `GAPS.md`. | `aturan 22` added as `na96.awalan.pe.percap`; `perdaya` removed, `daya` added. |

`aturan 22` was worth having for its own sake: `pertemuan` → `temu` now works too, and `teperdaya`
reaches `daya` through two prefix iterations instead of stopping at a dictionary entry that should
never have been there.

## `beda-kamus` — same rules, different dictionary

The rules agree. The dictionaries do not, and the dictionary decides. Both are proven in the test
by adding the missing word and reproducing Sastrawi's answer.

### `perusakan` — kupas `rusak`, Sastrawi `rusa`

Sastrawi's dictionary has `rusa` (deer). It therefore accepts `perusa` + `-kan` → `per-` + `usa` →
`rusa` and stops. Ours does not have `rusa`, so that branch dies, `-kan` is abandoned, and `-an`
leads to `rusak`.

**Ours is the better answer, and we did not earn it.** Add `rusa` to our dictionary and we return
`rusa` too. The larger dictionary is the *worse* one here — a fact worth sitting with, since
"improve coverage" is the usual reflex. `rusa` is deliberately not added: anyone can add it in the
dictionary panel and watch `perusakan` break, which is exactly what that panel is for.

### `berapa` — kupas `apa`, Sastrawi `berapa`

`berapa` is a root and is in Sastrawi's dictionary, so it stops at the first lookup. It is missing
from ours, so `berV` strips `ber-` and finds `apa`, which happens to be there. A dictionary gap
wearing the costume of a rule success. Already in the failure gallery as `kelebihan-kupas`.

## `ambigu` — both defensible

### `mengupas` — kupas `upas`, Sastrawi `kupas`

Not a dictionary difference: Sastrawi has **both** `upas` and `kupas` as roots, and so do we. Both
implementations face the same two readings of `aturan 17` and pick different ones. Sastrawi prefers
the reading that restores the `k`; we take the templates in the order the rule lists them.

Neither is wrong. This is the case the whole project exists for, and our answer differs from
Sastrawi's only in which coin-flip it reports — except that we also report that a coin was flipped.

## `belum-jelas` — not yet understood, and not to be guessed at

Three disagreements where Sastrawi gets the answer a speaker would call correct and we do not. In
each, a plausible cause is visible and **the paper is what would settle it.** None has been changed:
altering a rule so that its output matches Sastrawi is the one thing invariant 11 forbids outright.

### `terpercaya` — kupas `terpercaya`, Sastrawi `percaya`

**Hypothesis: our reading of the side condition is wrong.** We transcribed `aturan 8`'s
"`terCP…` where `C ≠ r` and `P ≠ er`" as *P must not begin with `er`*, which excludes exactly
`ter-` + `percaya`; `aturan 7` then needs a vowel after `er` and also declines. So no `ter-` rule
fires. Sastrawi reaches `percaya`, which suggests `P ≠ er` means something narrower — perhaps `P` is
exactly the two characters following `C`, or the condition applies to a different position.

This is the single highest-value thing to check in the papers, because it is a *reading* error
rather than a missing rule, and reading errors of this shape will be sitting in the other `C`/`P`
conditions too.

### `bertemu` — kupas `bertemu`, Sastrawi `temu`

Our inflectional removal is greedy: `-mu` goes first as a possessive, leaving `berte`, and nothing
ever returns to try the word without that removal. Sastrawi backtracks and gets `ber-` + `temu`.

**Hypothesis: the algorithm backtracks over inflectional removal too, and we do not.** The fix is
obvious and that is precisely the danger — implementing it means writing a backtracking rule from
intuition and presenting it as the paper's. Already in the gallery as `salah-analisis`.

### `menyanyi` — kupas `menyanyi`, Sastrawi `nyanyi`

`aturan 18` as we have it gives `meny-` exactly one reading, the assimilated `s`: `menyanyi` →
`sanyi`, which is not a word. The correct analysis is `me-` + `nyanyi`, and `nyanyi` *is* in our
dictionary — the rule set simply cannot express that reading.

**Hypothesis: `aturan 18` admits two readings, `sV…` and `nyV…`,** the same way `aturan 17` admits
two. If so this is our transcription dropping a reading, and it is a one-line fix in the rule data
once the paper confirms it. Already in the gallery as `kekurangan-kupas`.

## What this run says overall

309 of 315 words agree, and the six that do not divide cleanly: two are the dictionary rather than
the algorithm, one is real ambiguity, and three point at specific transcription questions. That is
a better result than agreement would have been — a differential oracle that finds nothing has
usually just confirmed that both sides copied the same secondary source.
