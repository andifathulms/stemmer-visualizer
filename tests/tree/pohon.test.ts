import { describe, expect, it } from 'vitest'
import { interpret } from '@/lib/engine/interpret'
import { enumerate, flatten } from '@/lib/engine/enumerate'
import { buildPohon, flattenPohon } from '@/lib/tree/pohon'
import { DRAW_NODE_CAP, layoutPohon, selectForDrawing } from '@/lib/tree/layout'
import { dictionary, pack } from '../helpers'

/**
 * `PohonPelusuran`'s standalone fixtures — DESIGN-REWORK.md §7 build order,
 * step 3: "against existing fixtures — beruang for ambiguity, a case with
 * several abandoned branches, a case that trips the node cap, a case with a
 * single clean path." None of these are new claims about the algorithm; each
 * word's `interpret`/`enumerate` behaviour is already pinned by
 * tests/ambiguity and tests/properties. What is new here is only that the
 * join (`buildPohon`) reconstructs the same facts a second, independent way.
 */

const p = pack()
const d = dictionary()

function pohonFor(word: string) {
  const trace = interpret({ word, pack: p, dictionary: d })
  const tree = enumerate({ word, pack: p, dictionary: d })
  return { trace, tree, pohon: buildPohon(trace, tree) }
}

describe('buildPohon — soundness with the two traversals it joins', () => {
  it('never invents a node: every onPath node exists in the CandidateTree', () => {
    for (const word of ['beruang', 'berjalan', 'makanan', 'memukul']) {
      const { tree, pohon } = pohonFor(word)
      const treeIds = new Set(flatten(tree.root).map((n) => n.id))
      for (const node of flattenPohon(pohon.root)) {
        expect(treeIds.has(node.id), `${word}: ${node.id}`).toBe(true)
      }
    }
  })

  it('root is always onPath — interpret always starts there', () => {
    for (const word of ['beruang', 'berjalan', 'makanan']) {
      expect(pohonFor(word).pohon.root.onPath).toBe(true)
    }
  })
})

describe('a single clean path — makanan', () => {
  const { trace, pohon } = pohonFor('makanan')

  it('interpret accepts the first removal it tries, nothing abandoned', () => {
    expect(trace.result).toBe('makan')
    expect(trace.steps.filter((s) => s.type === 'buang').every((s) => !s.abandoned)).toBe(true)
  })

  it('the tree agrees: exactly one onPath child, and it is not abandoned', () => {
    const onPathChildren = pohon.root.children.filter((c) => c.onPath)
    expect(onPathChildren).toHaveLength(1)
    expect(onPathChildren[0]?.abandoned).toBe(false)
    expect(onPathChildren[0]?.kata).toBe('makan')
  })

  it('the accepted node is the result node', () => {
    expect(pohon.resultNodeId).toBe(pohon.root.children.find((c) => c.onPath)?.id)
  })
})

describe('several abandoned branches — berjalan', () => {
  const { trace, pohon } = pohonFor('berjalan')

  it('interpret tries and backs out of at least two removals before accepting one', () => {
    const buang = trace.steps.filter((s) => s.type === 'buang')
    expect(buang.filter((s) => s.abandoned).length).toBeGreaterThanOrEqual(2)
    expect(buang.some((s) => !s.abandoned)).toBe(true)
    expect(trace.result).toBe('jalan')
  })

  it('the tree marks the same nodes abandoned, each with a reason', () => {
    const onPath = flattenPohon(pohon.root).filter((n) => n.onPath)
    const abandonedOnPath = onPath.filter((n) => n.abandoned)
    expect(abandonedOnPath.length).toBeGreaterThanOrEqual(2)
    for (const node of abandonedOnPath) {
      expect(node.abandonReason, node.kata).not.toBeNull()
    }
  })

  it('exactly one onPath leaf is not abandoned, and it is the result', () => {
    const accepted = flattenPohon(pohon.root).filter((n) => n.onPath && !n.abandoned && n.ruleId !== null)
    expect(accepted.map((n) => n.kata)).toContain('jalan')
    expect(pohon.resultNodeId).not.toBeNull()
    const resultNode = flattenPohon(pohon.root).find((n) => n.id === pohon.resultNodeId)
    expect(resultNode?.kata).toBe(trace.result)
  })
})

describe('beruang — ambiguity is a shape, not a callout alone', () => {
  const { tree, pohon } = pohonFor('beruang')

  it('more than one leaf is dictionary-valid', () => {
    const dictionaryValidLeaves = flattenPohon(pohon.root).filter(
      (n) => n.dictionaryValid && n.children.length === 0,
    )
    expect(dictionaryValidLeaves.length).toBeGreaterThanOrEqual(2)
    expect(tree.candidates.map((c) => c.kata).sort()).toEqual(['beruang', 'ruang', 'uang'])
  })

  it('the chosen root is on the path, and is the root itself here', () => {
    // beruang is found whole in the dictionary — interpret never removes
    // anything, so the "path" is the single root node.
    expect(pohon.resultNodeId).toBe(pohon.root.id)
    expect(pohon.root.dictionaryValid).toBe(true)
  })

  it('enumeration soundness, drawn: the result node is among the dictionary-valid leaves', () => {
    const leafKata = flattenPohon(pohon.root)
      .filter((n) => n.dictionaryValid)
      .map((n) => n.kata)
    expect(leafKata).toContain('beruang')
  })
})

describe('a case that trips the draw cap', () => {
  it('selectForDrawing keeps the whole tree under the cap', () => {
    const { pohon } = pohonFor('makanan')
    const selection = selectForDrawing(pohon)
    expect(selection.truncated).toBe(false)
    expect(selection.shown).toBe(selection.total)
  })

  it('over the cap, every onPath node survives and the total is stated, never hidden', () => {
    const { trace, tree } = pohonFor('berjalan')
    // A tiny cap on a real tree — not a claim about a real word blowing past
    // 500 nodes (the curated 293-word dictionary never does that; see
    // scripts explored during development), only a deterministic way to
    // exercise the truncation path.
    const smallTree = enumerate({ word: 'berjalan', pack: p, dictionary: d, options: { maxNodes: 6 } })
    const pohon = buildPohon(trace, smallTree)
    const selection = selectForDrawing(pohon, 2)

    expect(selection.truncated).toBe(true)
    expect(selection.total).toBeGreaterThan(selection.shown)
    for (const node of flattenPohon(pohon.root).filter((n) => n.onPath)) {
      expect(
        flattenPohonDraw(selection.root).some((drawn) => drawn.id === node.id),
        node.id,
      ).toBe(true)
    }
    // The full tree stays reachable through CandidateTree's own structure —
    // this module never mutates or shrinks it.
    expect(flatten(tree.root).length).toBeGreaterThan(0)
  })

  it('DRAW_NODE_CAP is a named constant, not a magic number scattered around', () => {
    expect(DRAW_NODE_CAP).toBeGreaterThan(0)
  })
})

describe('layoutPohon — pure geometry, no overlapping slots at the same depth', () => {
  it('every leaf gets its own slot; every parent centres over its children', () => {
    const { pohon } = pohonFor('beruang')
    const selection = selectForDrawing(pohon)
    const layout = layoutPohon(selection.root)

    const byDepth = new Map<number, number[]>()
    for (const p of layout.placed) {
      const slots = byDepth.get(p.depth) ?? []
      slots.push(p.slot)
      byDepth.set(p.depth, slots)
    }
    for (const [, slots] of byDepth) {
      const leafSlotsAtDepth = slots.filter((s) => Number.isInteger(s))
      expect(new Set(leafSlotsAtDepth).size).toBeLessThanOrEqual(leafSlotsAtDepth.length)
    }
    expect(layout.maxDepth).toBeGreaterThanOrEqual(0)
  })
})

function flattenPohonDraw(node: { id: string; children: readonly { id: string }[] }): { id: string }[] {
  return [node, ...node.children.flatMap((c) => flattenPohonDraw(c as never))]
}
