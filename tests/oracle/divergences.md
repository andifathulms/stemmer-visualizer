# Classified divergences from Sastrawi

Nothing recorded yet — no fixtures have been run. See `README.md` for the classification format.

Two divergences are already expected from the rule pack as written, and will be filled in with a
classification once the oracle is actually run:

| Word | Kupas | Expected classification | Note |
|---|---|---|---|
| `terpercaya` | `terpercaya` | probably `bug-kami` or `belum-jelas` | No ter- rule fires: `aturan 8` excludes `P = er`, `aturan 7` needs a vowel after `er`. See `data/rules/GAPS.md`. |
| `bertemu` | `bertemu` | probably `pilihan-sastrawi` | Greedy inflectional removal takes `-mu` first and never recovers. Whether the paper intends a backtrack here is exactly the question to answer from the source. |
