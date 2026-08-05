import type { Copy } from '@/lib/i18n'

/**
 * What the colours mean.
 *
 * The palette carries real meaning in this app — pencil grey is "abandoned",
 * highlighter yellow is "the dictionary matched", red is "the answer, or the
 * fact that there isn't one" (invariant 14). A first-time visitor has no way to
 * know that, and the trace is close to unreadable until they do. So the key is
 * stated once, on the page where it first matters, rather than left implicit.
 *
 * Each swatch is paired with words, never colour alone: the trace has to stay
 * legible to a reader who cannot distinguish the pencil grey from the pen.
 */
export function Legenda({ copy }: { copy: Copy }) {
  const items = [
    { swatch: 'bg-pen', label: copy.legend.pen },
    { swatch: 'bg-pencilMark', label: copy.legend.pencil },
    { swatch: 'bg-highlight', label: copy.legend.highlight },
    { swatch: 'bg-teacher', label: copy.legend.teacher },
  ]

  return (
    <div className="kartu bg-paperEdge/60 px-4 py-3">
      <h2 className="label">{copy.legend.title}</h2>
      <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 font-ui text-xs text-pencil">
            <span
              aria-hidden
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-sm ${item.swatch}`}
            />
            <span className="leading-relaxed">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
