import Link from 'next/link'
import { Kata } from '@/components/word/Kata'
import type { Segmentation } from '@/lib/app/segmentation'
import type { Copy, Locale } from '@/lib/i18n'

/**
 * The landing-page worked example: one word, already peeled.
 *
 * A visitor who does not know the word "stemming" will not learn it from a
 * paragraph. They learn it from seeing *mempelajari* with grey affixes hanging
 * off a red root, which is a picture of the whole product in one line.
 *
 * The segmentation is real — the page runs the engine at build time and hands
 * the result down (invariant 13: this component computes nothing). So the
 * example cannot drift away from what the tool actually does, which is exactly
 * the failure mode a hand-drawn hero illustration would have.
 */
export function Peragaan({
  segmentation,
  hasil,
  langkah,
  copy,
  locale,
}: {
  segmentation: Segmentation
  /** The root the engine returned. */
  hasil: string
  /** How many steps it took to get there. */
  langkah: number
  copy: Copy
  locale: Locale
}) {
  return (
    <section aria-labelledby="peragaan" className="kartu overflow-hidden">
      <div className="border-b border-ruleLine bg-paperEdge/60 px-5 py-3">
        <h2 id="peragaan" className="font-prose text-base font-semibold">
          {copy.demo.title}
        </h2>
        <p className="mt-0.5 font-ui text-xs text-pencil">{copy.demo.lead}</p>
      </div>

      <div className="bg-ruled bg-[length:100%_32px] px-5 py-6">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <div>
            <p className="label mb-2">{copy.demo.inputLabel}</p>
            <Kata segmentation={segmentation} />
          </div>

          <span aria-hidden className="pb-2 font-word text-2xl text-pencilMark">
            →
          </span>

          <div>
            <p className="label mb-2">{copy.demo.outputLabel}</p>
            {/* Teacher's red: the answer — invariant 14. */}
            <p className="font-word text-4xl tracking-tight text-teacher sm:text-5xl">{hasil}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-ruleLine px-5 py-4">
        <p className="max-w-baca font-ui text-xs leading-relaxed text-pencil">
          {copy.demo.caption}
        </p>
        <p className="mt-3">
          <Link
            href={`/${locale}/kupas/`}
            className="font-ui text-sm text-pen underline decoration-ruleLine underline-offset-4 hover:decoration-pen"
          >
            {copy.demo.cta} ({langkah} {copy.stepsLabel.toLowerCase()}) →
          </Link>
        </p>
      </div>
    </section>
  )
}
