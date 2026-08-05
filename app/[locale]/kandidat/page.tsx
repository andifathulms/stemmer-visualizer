import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'
import { CandidateTreeView } from '@/components/tree/CandidateTree'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function KandidatPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <CandidateTreeView copy={getCopy(params.locale)} locale={params.locale} />
}
