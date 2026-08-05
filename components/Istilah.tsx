'use client'

import { useId, useState } from 'react'
import type { Copy } from '@/lib/i18n'

/**
 * A grammatical term, glossed on first use — PRD §8.
 *
 * The vocabulary stays Indonesian in both locales (invariant 15): a reader who
 * meets *awalan* here will meet it again in every Indonesian grammar they open,
 * and translating it to "prefix" would spend that. So the term is never
 * replaced — it is explained in place.
 *
 * A `title` attribute alone would strand keyboard and touch users, so this is a
 * real button: hover, focus and tap all open the same gloss.
 */
export function Istilah({
  term,
  copy,
  children,
}: {
  term: keyof Copy['glosarium']
  copy: Copy
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="istilah font-prose"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children ?? term}
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="kartu absolute left-0 top-full z-20 mt-1.5 block w-64 p-3 font-ui text-xs leading-relaxed text-pen shadow-sm"
        >
          {copy.glosarium[term]}
        </span>
      )}
    </span>
  )
}
