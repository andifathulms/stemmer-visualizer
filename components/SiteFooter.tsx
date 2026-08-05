import type { Copy } from '@/lib/i18n'
import { MakerSignature } from './MakerSignature'

/**
 * The honesty note, given its own weight — PRD "Framing". Sastrawi is linked
 * prominently and generously, and the claim this project makes about itself is
 * stated in the reader's own language. (It used to be English in both locales.)
 */
export function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-16 border-t border-ruleLine bg-paperEdge/50">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <h2 className="font-prose text-base font-semibold">{copy.honesty.title}</h2>
        <p className="mt-2 max-w-baca font-ui text-xs leading-relaxed text-pencil">
          {copy.honesty.body}
        </p>
        <p className="mt-3 font-ui text-xs">
          <a
            className="text-pen underline decoration-ruleLine underline-offset-4 hover:decoration-pen"
            href="https://github.com/sastrawi/sastrawi"
            rel="noreferrer noopener"
            target="_blank"
          >
            {copy.honesty.link} ↗
          </a>
        </p>
        {/* The one bottom seam, shared. The disclaimer is the project's legal
            and framing note; the maker's mark is a personal credit. They sit at
            opposite ends of the same rule rather than being run together or
            given a divider each. */}
        <div className="mt-6 flex flex-col gap-5 border-t border-ruleLine/60 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <p className="max-w-baca font-ui text-xs leading-relaxed text-pencil">
            {copy.disclaimer}
          </p>
          <MakerSignature />
        </div>
      </div>
    </footer>
  )
}
