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
"improve coverage" is the usual reflex.

**And as of 2026-08-05 the app ships the larger dictionary, so the app now returns `rusa`.** This
is the clearest cost of that change, and it was made with the cost known: growing the dictionary
fixed far more words than it broke, but it did break this one, and `perusakan` is the proof that
coverage and correctness are not the same axis. The curated list keeps the better answer, and the
tests keep both — `divergences.test.ts` pins `rusak` against the curated dictionary and `rusa`
against the shipped one.

### `berapa` — kupas `apa`, Sastrawi `berapa`

`berapa` is a root and is in Sastrawi's dictionary, so it stops at the first lookup. It was missing
from ours, so `berV` stripped `ber-` and found `apa`, which happens to be there. A dictionary gap
wearing the costume of a rule success. Already in the failure gallery as `kelebihan-kupas`.

**Resolved in the shipped dictionary as of 2026-08-05:** `berapa` is in Sastrawi's root list, so the
app now agrees with Sastrawi here. It remains reproducible against the curated list, and the test
pins both.

## `beda-kamus`, on re-examination — `mengupas` was misclassified

### `mengupas` — kupas `upas`, Sastrawi `kupas`

**This entry was wrong, and the dictionary work of 2026-08-05 corrected it.** It was filed under
`ambigu` on the claim that *"Sastrawi has both `upas` and `kupas` as roots, and so do we"*, making
this a coin-flip between two readings of `aturan 17`.

Sastrawi ships two word lists, and the distinction matters:

| | `upas` | `kupas` |
|---|---|---|
| `kata-dasar.txt` — the list the stemmer actually uses | **absent** | present |
| `kata-dasar.original.txt` — the uncurated list, not loaded at runtime | present | present |

`upas` was deliberately removed from the active list. Sastrawi therefore **cannot** return `upas`
for any input: the branch does not die on a rule, it dies on a lookup. Whoever wrote the original
entry checked `kata-dasar.original.txt`.

So this is `beda-kamus`, not `ambigu`, and it is proven the same way the others are: run our rules
against Sastrawi's active list and we return `kupas` too. Our rules never disagreed.

The ambiguity itself is still real — `mengupas` genuinely admits both readings, and against the
curated 293-word list (which does contain `upas`) we still report both and pick the first. What is
no longer true is that Sastrawi is choosing between them. It only ever had one.

**The lesson is about method, not about this word.** A divergence was classified as a rule-level
disagreement on the strength of a dictionary lookup performed against the wrong file. It survived
review because the conclusion was plausible and flattering — "both defensible" is a comfortable
place to stop. The oracle is only as good as the care taken over what it is actually comparing.

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

## Revision, 2026-08-05 — after adopting Sastrawi's root list

The app's shipped dictionary changed from the 293-word curated list to Sastrawi's ~30,000-word
`kata-dasar.txt`. That is a change to one input, not to a single rule, and it moved four of the 316
recorded words. The count above is unchanged because it describes the run against the curated list,
which the test suite still pins.

| Word | Curated | Shipped | Sastrawi | What it means |
|---|---|---|---|---|
| `menendang` | *fails* | `tendang` | — | Pure dictionary gap. The rules were always right. |
| `mengupas` | `upas` | `kupas` | `kupas` | Reclassified `ambigu` → `beda-kamus`; see above. |
| `berapa` | `apa` | `berapa` | `berapa` | Divergence resolved; it was a gap. |
| `perusakan` | `rusak` | `rusa` | `rusa` | Agreement bought at the price of a worse answer. |

**Three of the six divergences were dictionary artefacts, and only three were ever about the rules.**
The three that survive — `terpercaya`, `bertemu`, `menyanyi` — do not move when the dictionary
changes, which is now positive evidence that they are rule-level and that the paper is what settles
them. That sharpens the priority list in `GAPS.md` rather than changing it.

The uncomfortable half: agreeing with Sastrawi on `perusakan` and `mengupas` is not evidence that we
became more correct. On `perusakan` we adopted its over-stemming. Invariant 11 says Sastrawi is an
oracle and not an authority, and the temptation this run exposes is subtler than editing a rule — it
is picking the *input* that produces agreement and calling the agreement a result.
