# Kupas

**The Nazief & Adriani stemmer, opened up:** every rule that fired, every dictionary lookup, every
backtrack — and every root the word could plausibly have.

> *kupas* / *mengupas* — to peel, to strip away layers. What affix removal literally does.

A static, offline-capable visualiser for Indonesian stemming. Two traversals over one declarative
rule set: **trace mode** runs the algorithm as specified and shows every step, **candidate mode**
enumerates every segmentation the morphology admits and reports ambiguity instead of hiding it.

## This is not Sastrawi

[Sastrawi](https://github.com/sastrawi/sastrawi) is the production library for Indonesian stemming
and it is what you should use in a pipeline. Kupas is a personal, educational implementation of the
published papers. It makes its own choices, it can be wrong, and where it diverges from Sastrawi
those divergences are investigated, classified, and published rather than papered over. **No parity
with Sastrawi is claimed.**

## Rule verification status

Every rule in `data/rules/` carries a `verification` field:

| Value | Meaning |
|---|---|
| `verified` | Checked line-by-line against the cited table/rule in the source paper. |
| `unverified` | Reconstructed from the widely-published form of the algorithm; the citation points at where it *should* be checked, but nobody has checked it yet. |

The rule pack currently ships **unverified** rules. They are marked as such in the data, surfaced in
the rule reference UI, and the validator refuses any rule missing the field. Do not treat an
`unverified` rule as sourced. Flipping a rule to `verified` requires reading the cited table.

## Sources

- Nazief, B. & Adriani, M. (1996). *Confix-Stripping: Approach to Stemming Algorithm for Bahasa
  Indonesia.* Fakultas Ilmu Komputer, Universitas Indonesia.
- Asian, J., Williams, H. E. & Tahaghoghi, S. M. M. (2005). *Stemming Indonesian.* Proceedings of
  the 28th Australasian Computer Science Conference.

## Development

```bash
pnpm install
pnpm dev                    # http://localhost:3000
pnpm build                  # static export to ./out; runs rules:validate first
pnpm preview                # serve ./out under the production basePath
pnpm test:run               # vitest once — before every commit
pnpm rules:validate         # schema, citations, precedence conflicts
```

See `CLAUDE.md` for repository conventions and `PRD.md` for scope.

## Licence

MIT. Dictionary entries carry per-entry provenance; see `data/dictionary/`.
