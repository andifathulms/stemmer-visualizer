import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'
import { DictionaryPanel } from '@/components/dictionary/DictionaryPanel'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function KamusPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <DictionaryPanel copy={getCopy(params.locale)} locale={params.locale} />
}
