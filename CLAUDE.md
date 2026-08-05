# CLAUDE.md — Kupas

Nazief & Adriani stemmer visualizer for Indonesian. Rule-by-rule trace, editable root dictionary, and candidate enumeration for ambiguous words. Static site, GitHub Pages, no backend.

Read `PRD.md` before starting any task. It fixes scope; this file describes how to work in the repo.

**Three things shape everything:**

1. **Stemming Indonesian is not deterministic.** A meaningful fraction of words admit more than one valid root — *beruang* is `ber-` + `uang` or the root *beruang*, and no rule refinement settles it. The algorithm returns one answer; this app must also show the others. Code that treats "one root per word" as a truth rather than a convention is wrong.
2. **The dictionary is an input, not a constant.** Output depends on it as much as on the rules. It is always an explicit parameter, never a module-level import.
3. **Do not reconstruct the rules from memory.** Recoding and prefix-type determination are where implementations diverge and where recall fails. Read the papers, cite the rule, fixture the example.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Zod for rule-pack and dictionary schema validation
- Vitest
- pnpm
- No stemming library. Sastrawi appears only in a development script that records oracle fixtures — never as a runtime dependency, never imported by `lib/`.

## Commands

```bash
pnpm dev
pnpm build                  # static export to ./out; runs rules:validate first
pnpm preview                # serve ./out under the production basePath
pnpm test                   # vitest watch
pnpm test:run               # vitest once — before every commit
pnpm test:papers            # worked examples from the source papers
pnpm test:oracle            # differential comparison against recorded Sastrawi fixtures
pnpm test:properties        # idempotence, enumeration soundness, dictionary independence
pnpm rules:validate         # schema, citations, precedence conflicts
pnpm fixtures:record        # DEV ONLY — runs Sastrawi to regenerate oracle fixtures
pnpm typecheck
pnpm lint
```

`pnpm fixtures:record` is a development-only script. It never runs in CI and never ships in the browser bundle.

## Layout

```
app/
  [locale]/                 # id (default), en
    kupas/                  # trace view
    kandidat/               # candidate tree
    kamus/                  # dictionary panel
    aturan/                 # rule reference
    galeri/                 # failure gallery
    dokumen/                # document mode
components/
  word/                     # word with morpheme boundaries
  trace/                    # step list, struck-through backtracks
  tree/                     # candidate enumeration
  dictionary/
lib/
  engine/                   # THE CORE. Pure. No React, no DOM, no clock.
    interpret.ts            # rule interpreter — precedence traversal (the algorithm)
    enumerate.ts            # rule interpreter — exhaustive traversal (candidates)
    recode.ts               # allomorph restoration
    prefixType.ts           # te-/me-/be-/pe- type determination
    forbidden.ts            # prefix-suffix combination table
    trace.ts                # StemTrace, spans, step types
  rules/                    # schema, loader, validator
  dictionary/               # loader, lookup interface
data/
  rules/                    # rule packs: 1996 base, 2005 extensions
  dictionary/               # root words + per-source provenance
tests/
  papers/                   # cited worked examples
  oracle/                   # recorded Sastrawi pairs + divergence classifications
  properties/
  ambiguity/                # multi-candidate fixtures
```

## Invariants

1. **No stemming rule is written in application code.** Rules live in `data/rules/` with an id, pattern, rewrite, precedence, citation, and any recoding they trigger. The engine is an interpreter. This exists so a linguist who does not code can audit the rule set.

2. **Every rule carries a citation.** Validator-enforced; the build fails without one. If you cannot cite it, you do not know it well enough to add it — say so instead.

3. **The dictionary is an explicit parameter.** `(word, variant, ruleSet, dictionary) → StemTrace`. Never a module import, never a singleton, never captured in a closure at load time. The dictionary panel and the tests both depend on swapping it freely.

4. **The engine is pure and deterministic.** No clock, no randomness, no DOM, no React, no module-level mutable state. Byte-identical trace for identical inputs.

5. **One rule set, two traversals.** `interpret.ts` follows precedence and returns the algorithm's answer; `enumerate.ts` explores all admissible segmentations. Never fork the rule data — if the two need different rules, the rule model is wrong.

6. **Enumeration soundness, not equality.** The root returned by `interpret` must always appear in `enumerate`'s candidate set. Never assert the two produce the same set — enumeration deliberately finds more, and that is the point.

7. **Ambiguity is reported, never silently resolved.** When multiple dictionary-valid candidates exist, the trace records the fact, the alternatives, and the reason the algorithm chose one. A `chosen` without a `reason` is a bug.

8. **Every trace step records spans** — which characters were removed, which remain, where the boundary fell. All highlighting and linking is span-based.

9. **Backtracks are recorded, never erased.** An abandoned attempt stays in the trace, marked as abandoned. The search being visible as a search is the product.

10. **Never index strings by code unit for morpheme logic.** Normalize to NFC and iterate grapheme clusters. Indonesian is mostly ASCII so this rarely bites — which is exactly why it will be forgotten until a loanword or a diacritic breaks it.

11. **Sastrawi is an oracle, not an authority.** Differential disagreements are investigated and *classified* — our bug, or a documented Sastrawi implementation choice. Never auto-align to Sastrawi to make a test pass, and never assume Sastrawi is right by default. Every classification is written down.

12. **Never claim Sastrawi parity in the UI.** State that this implements the papers, that Sastrawi makes its own choices, and that documented divergences exist.

13. **Nothing is computed in a component.** Components render a `StemTrace` or a `CandidateTree`.

14. **Red is reserved for the final root and for genuine ambiguity.** Abandoned steps are pencil grey and struck through; dictionary hits are highlighter yellow. Red means "the answer, or the fact that there isn't one". See PRD §8.

15. **Grammatical vocabulary stays Indonesian** in code identifiers, comments, and UI: `awalan`, `akhiran`, `sisipan`, `konfiks`, `kataDasar`, `peluruhan`. Do not substitute English approximations.

## Working style

- **Read the paper before implementing a rule.** Especially the prefix-type determination tables and the recoding rules. Cite the table or rule number in the comment.
- **Fixture before rule.** Transcribe the paper's worked example, cite it, implement until it passes.
- **When you don't know a rule, say so.** Do not fill a gap in the rule set from general knowledge of Indonesian morphology and present it as sourced. Mark it unverified or leave it out and flag it.
- **When a differential test disagrees, investigate before choosing a side.** Write the classification down in `tests/oracle/` regardless of the outcome. That record is a genuine contribution.
- **Build the failure gallery early, not last.** A tool that only demonstrates the algorithm succeeding teaches false confidence in it.
- **Small increments.** Suffix removal fully verified beats suffix plus prefix both half-done.
- **Don't touch `next.config.js`, the Actions workflow, the validator, or `fixtures:record` without saying so explicitly.**
- **Don't add a stemming, morphology, or NLP dependency.**
- **Never weaken a test or the validator to make something pass.**

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for trace steps and rule types, keyed on `type`. Exhaustive `switch` with a `never` default.
- No `any`. No non-null `!` in engine code.
- Rule ids stable, namespaced, readable: `na96.suffix.derivational.an`, `na96.prefix.me.recode.ny`, `na05.particle.pun`. They appear in the trace, in the rule reference, and in shared URLs.
- Comments cite the paper table or rule number they implement. This is the highest-value comment style in the repo.
- Dictionary entries carry a provenance field. No entry without a source; anything with unclear licensing stays out.
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `paper`, `ruleLine`, `pen`, `pencil`, `highlight`, `teacher`. Never raw hex in components.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:papers` and `pnpm test:properties` before any engine commit.
- New rule → a cited fixture from the paper, plus a precedence-conflict check.
- New recoding case → its own fixture. Recoding is where implementations diverge; treat every case as load-bearing.
- Idempotence is asserted across the whole dictionary: stemming a root returns it unchanged.
- Enumeration soundness is asserted on every fixture: the returned root is in the candidate set.
- Dictionary independence: adding an unrelated word never changes an unrelated result; removing the returned root must change the outcome.
- Ambiguous words must be reported as multi-candidate. `beruang` is a permanent fixture.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions; rule validation gates it. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. The dictionary loads as a separate chunk. Verify with `pnpm preview` before pushing.

## Framing

Sastrawi is linked prominently as the production library — accurate and generous. The site states plainly that this is a personal educational project implementing the published papers, not an authority, and that it can be wrong. Documented divergences from Sastrawi are published rather than hidden.

## Current state

M0–M4 and M6 are in. M5 is partial.

| | | |
|---|---|---|
| M0 | Scaffold | Done. Static export, `basePath` from the repo name, Actions deploy gated on `rules:validate`. |
| M1 | Engine | Done. Interpreter, both traversals, recoding, backtracking, trace. 39 tests green. |
| M2 | Trace UI | Done. Word with boundaries, step list, step-through, rule links. |
| M3 | Dictionary | Done. Editable panel, per-word provenance, edits carried in the URL hash. |
| M4 | Candidates | Done. Enumeration, candidate tree, ambiguity reported with a reason. |
| M5 | Variants | **Partial.** The dictionary-free comparison ships. The 2005 pack does not exist. |
| M6 | Reference + gallery | Done. Rule reference, six-entry failure gallery, document mode. |

**The one thing to know before touching anything:** every rule in `data/rules/na96.json` is
`verification: "unverified"`. The pack was written from the widely-reproduced form of the rule
table, not from the papers. Citations point at where each rule *should* be checked. Read
`data/rules/GAPS.md` before adding, changing or citing a rule.

Next, in order:

1. **Verify the pack against the papers**, peluruhan rules first — `GAPS.md` has the priority list.
   Flip each rule to `verified` as it is checked; the fixture-count assertion in
   `tests/papers/worked-examples.test.ts` will fail and want updating, which is the point.
2. **Run the oracle.** `pnpm fixtures:record`, then classify every divergence in
   `tests/oracle/divergences.md`. Two are already predicted there.
3. **The 2005 pack** — only from the paper. It needs reduplicated compounds, `-pun`, revised `me-`
   handling and the changed step order, and it unlocks the rest of M5.
4. **The peeling animation.** The trace updates as you step, but the one orchestrated moment PRD §8
   asks for — affix detaching and sliding aside, stem re-centring, lookup flashing — is not built.
