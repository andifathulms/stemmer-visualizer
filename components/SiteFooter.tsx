import type { Copy } from '@/lib/i18n'

export function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="border-t border-ruleLine">
      <div className="mx-auto w-full max-w-5xl px-5 py-6 font-ui text-xs leading-relaxed text-pencil sm:px-8">
        <p className="max-w-2xl">{copy.disclaimer}</p>
        <p className="mt-2">
          <a
            className="underline decoration-ruleLine hover:text-pen"
            href="https://github.com/sastrawi/sastrawi"
            rel="noreferrer noopener"
            target="_blank"
          >
            Sastrawi
          </a>{' '}
          is the production library for Indonesian stemming — use it in a pipeline.
        </p>
      </div>
    </footer>
  )
}
