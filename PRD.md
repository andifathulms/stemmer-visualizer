# PRD — Kupas

**The Nazief & Adriani stemmer, opened up: every rule that fired, every dictionary lookup, every backtrack — and every root the word could plausibly have.**

> *kupas* / *mengupas* (Indonesian) — to peel, to strip away layers. What affix removal literally does.
> Rename freely; the slug is used throughout as `kupas`.

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, educational |
| **Deployment** | GitHub Pages (static export, no server) |
| **Language** | Indonesian-first UI; English secondary |
| **Normative source** | Nazief & Adriani (1996), *Confix-Stripping: Approach to Stemming Algorithm for Bahasa Indonesia*, Fakultas Ilmu Komputer UI. Plus Asian, Williams & Tahaghoghi (2005) for the documented extensions. |

---

## 1. Problem

Nazief & Adriani is the standard stemmer for Indonesian. It sits inside Sastrawi, and Sastrawi sits inside a large share of Indonesian NLP and search work. Almost everyone using it treats it as a function: word in, root out.

Three things that opacity costs:

**When it's wrong, you can't tell why.** Over-stemming and under-stemming both produce a plausible-looking string. Without seeing which rule fired and which dictionary lookup succeeded, a wrong result is indistinguishable from a right one.

**The dictionary dependency is invisible.** The algorithm checks a root dictionary at nearly every step, and its output is a function of that dictionary as much as of its rules. Swap the dictionary and the answer changes. Users don't experience this as a variable, because the dictionary is bundled and unseen.

**The ambiguity is hidden entirely.** This is the important one. The algorithm returns one root. But the problem it solves genuinely has more than one answer for a meaningful fraction of words — reported at 5.3% of unique words in one study, with heuristic selection getting roughly four in five of those right. *Beruang* is the standard case: `ber-` + `uang`, or the root *beruang*. The stemmer picks one and says nothing. Downstream, in a search index or a classifier, that silent choice is a silent error.

## 2. Product thesis

**Make the trace the product, and enumerate rather than decide.**

Two modes over one engine:

- **Trace mode** — run Nazief & Adriani exactly as specified, and show every step: the rule that fired with its number, the dictionary lookup and its result, the forbidden-combination check, each backtrack, and each recoding.
- **Candidate mode** — explore the space the algorithm prunes. Enumerate every segmentation the morphology permits, mark which are dictionary-valid, and show which one the algorithm returns and why it chose that one.

**And make the dictionary a visible, editable input.** Add a word, remove a word, watch the answer change. Nothing teaches the dictionary dependency faster than breaking it on purpose.

This is the same shape as the sibling projects: compute a trace, render the trace, surface what the algorithm decided rather than what it merely output.

## 3. The algorithm

Nazief & Adriani groups Indonesian affixes into prefixes (*awalan*), infixes (*sisipan*), suffixes (*akhiran*), and confixes (*konfiks*) — combined prefix-suffix pairs — and works against a root dictionary, checking after every removal.

The broad shape:

1. **Dictionary lookup.** Found → it's a root, stop.
2. **Remove inflectional suffixes** — particles (`-lah`, `-kah`, `-tah`, `-pun`) then possessives (`-ku`, `-mu`, `-nya`). Check after each.
3. **Remove derivational suffixes** (`-i`, `-an`, `-kan`). Check.
4. **Remove derivational prefixes**, up to three iterations. Before starting, consult the table of **forbidden prefix-suffix combinations** — certain confixes cannot legally co-occur, and finding one means stopping rather than proceeding. `di-`, `ke-`, and `se-` are simple removals; `te-`, `me-`, `be-`, and `pe-` need allomorph analysis to determine the prefix type.
5. **Recoding** — restoring the letter that assimilation destroyed. *menyapu* → `me-` + *nyapu* → *sapu*; *memukul* → *pukul*. This is where the interesting work is, and where implementations most often diverge.
6. **Give up gracefully.** If nothing works, the original word is returned unchanged.

Two stopping conditions are worth featuring in the UI because they're non-obvious: **the algorithm halts if a second prefix matches the first one removed**, and it halts after three prefix removals.

The 2005 extensions are documented and shipped as a toggleable variant: a fuller dictionary, rules for reduplicated compounds, the `-pun` particle, revised `me-` handling, and a changed step order.

## 4. Non-goals

- **Not a general NLP toolkit.** No POS tagging, no lemmatization proper, no named entity recognition, no tokenizer beyond what stemming needs.
- **Not a Sastrawi replacement.** Sastrawi is the production library; link to it. This is an instrument for understanding it.
- **No ML.** Rule-based only, fully inspectable. A neural lemmatizer would be a different and less honest project for this purpose.
- **No languages other than Indonesian in v1.** Javanese, Sundanese, and Balinese adaptations exist and are interesting; they are separate rule packs at best, and out of scope now.
- **No corpus-scale processing.** A document-sized paste is the ceiling. Not a batch pipeline.
- **No accounts, no server.** State shares by URL hash.
- **No claim of Sastrawi parity.** Differences will exist, especially in recoding. Report them honestly rather than papering over them.

## 5. Features

### 5.1 The trace — signature view
The word laid out with morpheme boundaries marked, and beneath it the ordered steps. Each step shows: the operation, the rule number and its source, the string before and after, the dictionary lookup performed and its result, and whether this step was later undone.

Backtracks are shown as struck-through attempts rather than erased, so the search is visible as a search. A step-through control walks it, and the morpheme boundaries in the word above update as you go.

### 5.2 Candidate mode
Every segmentation the morphology admits, as a tree. Each leaf marked dictionary-valid or not. The algorithm's chosen path highlighted, with the reason it was chosen over the alternatives — earlier in the rule order, or the only dictionary hit.

For genuinely ambiguous words this is the whole story: *beruang* yields two valid readings and the app says so instead of silently returning one.

### 5.3 The dictionary panel
Searchable, editable, and visibly the input it is. Add a word and re-run; remove a word and watch a previously-correct stem fail. A per-word view shows every step where the dictionary was consulted and what it answered.

Ships with a base root dictionary, with provenance recorded per source. Coverage is stated honestly rather than implied to be complete.

### 5.4 Rule reference
Every rule, numbered, with its pattern, its source, and a working example. Clicking a rule in the trace opens it here. This makes the app usable as a reference for people implementing stemmers, which is a real audience.

### 5.5 Variant comparison
Original 1996 algorithm versus the 2005 extensions versus a dictionary-free approach, on the same input. Where they disagree, show which rule caused the divergence. The dictionary-free comparison is especially instructive: it shows exactly what the dictionary is buying.

### 5.6 Failure gallery
A curated set of words the algorithm gets wrong, each labelled with the failure mode — over-stemming, under-stemming, or genuine ambiguity — and the step where it went wrong. Being upfront about a standard tool's limits is more useful than another demo of it succeeding.

### 5.7 Document mode
Paste text, get stems, with the words flagged where the stemmer had multiple candidates or fell through without a match. This is the practical view for someone building a search index who wants to know where their pipeline is quietly guessing.

## 6. Architecture

Static Next.js 14 App Router export. No backend, no runtime fetches.

```
word + variant + dictionary
  → rules (data)      → ordered rule set
  → stem (pure)       → StemTrace { steps, lookups, backtracks, result }
  → enumerate (pure)  → CandidateTree
                      → trace view | candidate tree | document mode
```

**Rules are declarative data, not code.** JSON rule packs in `data/rules/`, each rule carrying an id, a pattern, a rewrite, a precedence, a source citation, and any recoding it triggers. The engine is an interpreter over them. This is what makes the trace explainable and the rule set reviewable by a linguist who doesn't code — the same reasoning as Lontara and Rinci.

**The engine is pure.** `(word, variant, ruleSet, dictionary) → StemTrace`. No React, no DOM, no clock, no module-level state.

**Every step records spans.** Which characters were removed, which remain, where the morpheme boundary fell. All highlighting and linking is span-based.

**One rule set, two traversals.** `stem` follows precedence and returns the algorithm's answer; `enumerate` explores all admissible segmentations. Never fork the rule data — if the two need different rules, the rule model is wrong.

**Dictionary is an explicit parameter, never a module import.** It has to be swappable at runtime for the dictionary panel to work, and swappable in tests for the tests to be meaningful.

## 7. Testing

**Sastrawi as a differential oracle.** A development script runs Sastrawi over a large word list and records `(word → stem)` pairs as fixtures. The engine is compared against them. **Disagreements are investigated and then classified, not auto-resolved** — some will be our bug, some will be Sastrawi implementation choices that depart from the paper. Every classified disagreement is recorded with its reasoning, and that record is itself a useful artifact.

**Paper worked examples.** Every example in the source papers becomes a fixture, cited.

**Rule-pack integrity, at build time.** Every rule has an id, a citation, and a precedence. No two rules of equal precedence match the same input ambiguously. The build fails otherwise.

**Determinism.** Same word, variant, rule set, and dictionary produce a byte-identical trace.

**Enumeration soundness.** The algorithm's returned root must always appear in the candidate set. This is the correct relationship between the two traversals — a stricter equality assertion would be wrong, since enumeration deliberately finds more.

**Dictionary independence properties.** Adding an unrelated word never changes an unrelated result. Removing the returned root must change the outcome.

**Idempotence.** Stemming an already-stemmed root returns it unchanged — a cheap total property that catches over-stemming.

**Ambiguity fixtures.** *beruang* and its companions must be reported as multi-candidate, not silently resolved.

## 8. Design direction

The material world is the Indonesian school exercise book — *buku tulis* — with its pale ruled lines, and a teacher's red pen. Morpheme analysis is something people first meet at a school desk, drawing slashes between affix and root, and getting the answer circled in red.

**Palette.** Paper `#F4F6F5`, faintly cool. Rule lines in exercise-book blue `#B3C6D6`, printed and always visible, because the ruling is what makes it a *buku tulis* rather than a card. Pen ink `#1F2733` for the word and the affixes. Pencil grey `#8B8B84` for attempted and abandoned steps — struck through, still readable, exactly as a working-out is. Highlighter yellow `#E8C34A` for dictionary hits. **Teacher's red `#C0392B` reserved for the final root and for genuine ambiguity** — the answer, or the fact that there isn't one answer. Nothing else is red.

**Type.** **Literata** for prose and headings, a screen-native text serif in the register of a school textbook. **Geist Mono** for the word under analysis, morpheme segmentation, and rule ids — monospace so that boundaries align vertically down the trace and the peeling is visible as a column. **Inter** for controls.

**Structure.** The word sits large at the top with pencil slashes at morpheme boundaries. Beneath it, steps as numbered ruled lines — numbering is right here, because the algorithm's steps are a real ordered sequence and the number is what a user cites. Abandoned branches are struck through and indented, not hidden.

**Motion.** One orchestrated moment: an affix detaching from the word and sliding aside, the remaining stem re-centring, and the dictionary lookup flashing its result. On backtrack, the affix slides back and the line strikes through. That's the peeling, and it's the only animation in the app. `prefers-reduced-motion` renders the full trace statically.

**Copy.** Indonesian first, using the grammatical vocabulary a reader will meet elsewhere — *awalan*, *akhiran*, *sisipan*, *konfiks*, *kata dasar*, *imbuhan*, *peluruhan* — glossed on first use. Ambiguity stated plainly: *"Kata ini punya dua kemungkinan kata dasar. Algoritma memilih salah satu."*

## 9. Milestones

| | | |
|---|---|---|
| **M0** | Scaffold | Static export deploying, rule-pack schema and build-time validator. Validator before content. |
| **M1** | Engine | Rule interpreter, suffix and prefix removal, dictionary lookups, backtracking, recoding, trace structure. Paper fixtures green. Console only. |
| **M2** | Trace UI | Word with morpheme boundaries, step list, peeling animation, rule links. **Ship publicly here.** |
| **M3** | Dictionary | Editable dictionary panel, per-word lookup view, provenance. |
| **M4** | Candidates | Enumeration traversal, candidate tree, ambiguity reporting, *beruang* and friends. The differentiator. |
| **M5** | Variants | 2005 extensions, dictionary-free comparison, divergence attribution. |
| **M6** | Reference + gallery | Rule reference pages, failure gallery, document mode. |

M2 is a complete useful tool. M4 is the part nobody else has built.

## 10. Success criteria

- Every worked example in the source papers reproduces exactly.
- Every disagreement with Sastrawi is classified and documented — none left unexplained.
- The algorithm's returned root always appears in the enumerated candidate set.
- Stemming a root returns it unchanged, across the full dictionary.
- Every shipped rule carries a citation, enforced by the build.
- Ambiguous words are reported as ambiguous, never silently resolved.
- Same inputs produce a byte-identical trace on any machine.
- Fully offline after first load. JS ≤ 200 KB gzipped excluding the dictionary.

## 11. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Rule-pack validation gates the deploy. Dictionary loads as a separate chunk. Verify under the production `basePath` with `pnpm preview` before pushing.

## 12. Risks

| Risk | Mitigation |
|---|---|
| **Recoding rules are where implementations diverge.** | Fixtures for every recoding case from the papers, plus differential comparison with Sastrawi and a documented reasoning for each divergence. Do not reconstruct these rules from memory. |
| **Dictionary licensing and provenance.** | Provenance recorded per source; anything without a clear licence stays out, however convenient. Coverage stated honestly. |
| **Implying Sastrawi parity.** | State plainly that this implements the papers, that Sastrawi makes its own choices, and that documented divergences exist. |
| **Candidate enumeration blows up on long words.** | Depth cap, dictionary filtering by default, cap reported rather than silently truncated. |
| **Presenting the algorithm as authoritative.** | The failure gallery ships as a first-class feature, not an appendix. A tool that only demonstrates success teaches false confidence. |
| **Scope creep into an NLP toolkit.** | §4 is binding. Tagging and lemmatization are different projects. |
