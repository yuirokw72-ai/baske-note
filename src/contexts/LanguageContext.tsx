import { createContext, useContext, useState } from 'react'
import type { Lang } from '../i18n'
import { translations } from '../i18n'
import { getCountry, langToCountryCode, type CountryConfig } from '../lib/locale'

interface LanguageContextType {
  lang: Lang
  locale: string
  weekStartsOn: 0 | 1
  country: CountryConfig
  setCountry: (code: string) => void
  setLang: (l: Lang) => void   // 後方互換 (GuestPreview / Login で使用)
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ja',
  locale: 'ja-JP',
  weekStartsOn: 0,
  country: { code: 'jp', flag: '🇯🇵', nameJa: '日本', nameEn: 'Japan', locale: 'ja-JP', lang: 'ja', weekStartsOn: 0 },
  setCountry: () => {},
  setLang: () => {},
  t: (k) => k,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCodeState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('countryCode')
      if (stored) return stored
      // 後方互換: 旧 'lang' キーから変換
      const oldLang = localStorage.getItem('lang') as Lang | null
      if (oldLang) return langToCountryCode(oldLang)
      return 'jp'
    } catch {
      return 'jp'
    }
  })

  const country      = getCountry(countryCode)
  const lang         = country.lang
  const locale       = country.locale
  const weekStartsOn = country.weekStartsOn

  const setCountry = (code: string) => {
    const c = getCountry(code)
    try {
      localStorage.setItem('countryCode', code)
      localStorage.setItem('lang', c.lang) // 後方互換キー維持
    } catch { /* noop */ }
    setCountryCodeState(code)
  }

  // GuestPreview / Login の言語トグル用後方互換
  const setLang = (l: Lang) => {
    setCountry(langToCountryCode(l))
  }

  const t = (key: string): string => translations[lang][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, locale, weekStartsOn, country, setCountry, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
