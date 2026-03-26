import type { Lang } from '../i18n'

export interface CountryConfig {
  code: string
  flag: string
  nameJa: string
  nameEn: string
  locale: string       // Intl locale string (e.g., 'ja-JP', 'en-AU')
  lang: Lang           // UI language
  weekStartsOn: 0 | 1 // 0=Sunday, 1=Monday
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'jp', flag: '🇯🇵', nameJa: '日本',             nameEn: 'Japan',           locale: 'ja-JP', lang: 'ja', weekStartsOn: 0 },
  { code: 'au', flag: '🇦🇺', nameJa: 'オーストラリア',   nameEn: 'Australia',       locale: 'en-AU', lang: 'en', weekStartsOn: 1 },
  { code: 'us', flag: '🇺🇸', nameJa: 'アメリカ',         nameEn: 'United States',   locale: 'en-US', lang: 'en', weekStartsOn: 0 },
  { code: 'gb', flag: '🇬🇧', nameJa: 'イギリス',         nameEn: 'United Kingdom',  locale: 'en-GB', lang: 'en', weekStartsOn: 1 },
  { code: 'ca', flag: '🇨🇦', nameJa: 'カナダ',           nameEn: 'Canada',          locale: 'en-CA', lang: 'en', weekStartsOn: 0 },
  { code: 'nz', flag: '🇳🇿', nameJa: 'ニュージーランド', nameEn: 'New Zealand',     locale: 'en-NZ', lang: 'en', weekStartsOn: 1 },
]

export function getCountry(code: string): CountryConfig {
  return COUNTRIES.find(c => c.code === code) ?? COUNTRIES[0]
}

// 後方互換: 旧 lang 設定 → country code に変換
export function langToCountryCode(lang: string): string {
  if (lang === 'ja') return 'jp'
  return 'us'
}
