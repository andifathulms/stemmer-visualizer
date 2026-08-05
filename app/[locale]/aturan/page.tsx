import { notFound } from 'next/navigation'
import { LOCALES, getCopy, isLocale } from '@/lib/i18n'
import { RuleReference } from '@/components/rules/RuleReference'
import { parseRulePack } from '@/lib/rules/loader'
import na96 from '@/data/rules/na96.json'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function AturanPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return (
    <RuleReference
      pack={parseRulePack(na96)}
      copy={getCopy(params.locale)}
      locale={params.locale}
    />
  )
}
