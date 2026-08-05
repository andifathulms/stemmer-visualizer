import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'
import { TraceView } from '@/components/trace/TraceView'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function KupasPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <TraceView copy={getCopy(params.locale)} locale={params.locale} />
}
