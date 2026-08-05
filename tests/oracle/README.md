# Differential oracle

Sastrawi is an **oracle, not an authority** (CLAUDE.md invariant 11). A disagreement between Kupas
and Sastrawi is a question, not a defect report, and never a reason to change a rule until the
question has been answered.

## Recording fixtures

```bash
pnpm fixtures:record        # DEV ONLY — needs PySastrawi installed
```

Writes `fixtures.json` here: `(word → Sastrawi's stem)` pairs. The script never runs in CI, never
ships in the browser bundle, and nothing under `lib/` may import Sastrawi or anything derived from
it at runtime.

`fixtures.json` is not committed by default. `pnpm test:oracle` skips cleanly when it is absent, so
the suite stays green on a machine without PySastrawi.

## Classifying a disagreement

For each divergence, write an entry in `divergences.md` with:

1. The word, our answer, Sastrawi's answer.
2. Which rule or step caused the split — the trace makes this findable.
3. A classification:
   - **`bug-kami`** — we are wrong. Fix the rule, and add a fixture first.
   - **`pilihan-sastrawi`** — Sastrawi makes an implementation choice that departs from the paper.
     Record what the choice is and where the paper says otherwise.
   - **`ambigu`** — both are defensible; the word has more than one valid root.
   - **`belum-jelas`** — not yet understood. This is an honest state and it is allowed to persist.
4. The reasoning. This record is itself a contribution — PRD §7.

Never auto-align to Sastrawi to make a test pass, and never assume Sastrawi is right by default.

## A possible second oracle

[Snowball ships an Indonesian stemmer](https://snowballstem.org/algorithms/indonesian/stemmer.html)
that also derives from this algorithm. Two independent implementations disagreeing with each other
tells you more than one implementation disagreeing with us: where Sastrawi and Snowball agree and we
differ, we are the likely bug; where all three differ, the paper is probably ambiguous and that is
worth writing down. It is a second oracle, not a second authority — the same rules apply to it.

