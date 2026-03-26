import { createContext, useContext, useState } from 'react'
import type { Lang } from '../i18n'
import { translations } from '../i18n'

interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ja',
  setLang: () => {},
  t: (k) => k,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('lang') as Lang) ?? 'ja'
    } catch {
      return 'ja'
    }
  })

  const setLang = (l: Lang) => {
    try { localStorage.setItem('lang', l) } catch { /* noop */ }
    setLangState(l)
  }

  const t = (key: string): string => translations[lang][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
