import { RootRedirect } from '@/components/RootRedirect'

/**
 * The site root exists only to hand off to the default locale. `redirect()` is
 * unavailable under `output: 'export'`, so the hand-off is a client navigation
 * with a <noscript> meta-refresh behind it.
 */
export default function Page() {
  return <RootRedirect />
}
