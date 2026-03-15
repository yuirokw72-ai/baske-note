import { useState } from 'react'
import { getProfile, saveProfile } from '../lib/profile'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onBack: () => void
}

export function SettingsPage({ onBack }: Props) {
  const { lang, setLang } = useLanguage()
  const { user, signOut } = useAuth()
  const [motto, setMotto] = useState(() => getProfile().motto)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    saveProfile({ motto })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-xl" style={{ color: '#7A6E5F' }}>←</button>
        <h1 className="text-xl font-bold font-klee" style={{ color: '#1E3A5F' }}>
          {lang === 'ja' ? '設定' : 'Settings'}
        </h1>
      </div>

      <div className="space-y-4">
        {/* 座右の銘 */}
        <div className="nb-card-plain">
          <p className="text-xs font-bold mb-1" style={{ color: '#E07B2A' }}>
            {lang === 'ja' ? '✒️ 座右の銘・好きな言葉' : '✒️ My Motto'}
          </p>
          <p className="text-xs mb-3" style={{ color: '#A89F92' }}>
            {lang === 'ja' ? 'ホーム画面のヘッダーに表示されます' : 'Displayed in the home screen header'}
          </p>
          <textarea
            value={motto}
            onChange={e => setMotto(e.target.value)}
            className="nb-textarea"
            rows={3}
            placeholder={lang === 'ja' ? '例）一球入魂、Never give up…' : 'e.g. Hard work beats talent…'}
          />
        </div>

        <button
          onClick={handleSave}
          className="btn-primary"
          style={saved ? { background: 'linear-gradient(135deg, #2E7D52, #1F5C3A)' } : undefined}
        >
          {saved
            ? (lang === 'ja' ? '✓ 保存しました' : '✓ Saved!')
            : (lang === 'ja' ? '保存する' : 'Save')}
        </button>

        {/* 言語設定 */}
        <div className="nb-card-plain">
          <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
            {lang === 'ja' ? '🌐 言語 / Language' : '🌐 Language'}
          </p>
          <div className="flex gap-2">
            {(['ja', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: lang === l ? '#1E3A5F' : 'rgba(195,175,148,0.2)',
                  color: lang === l ? 'white' : '#7A6E5F',
                  border: lang === l ? 'none' : '1px solid rgba(195,175,148,0.4)',
                }}
              >
                {l === 'ja' ? '🇯🇵 日本語' : '🇺🇸 English'}
              </button>
            ))}
          </div>
        </div>

        {/* アカウント */}
        {user && (
          <div className="nb-card-plain">
            <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
              {lang === 'ja' ? '👤 アカウント' : '👤 Account'}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: '#7A6E5F' }}>{lang === 'ja' ? 'メール' : 'Email'}</span>
                <span className="text-xs font-semibold truncate ml-4" style={{ color: '#1E1A14', maxWidth: '55%' }}>
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: 'rgba(220,53,69,0.08)',
                color: '#DC3545',
                border: '1px solid rgba(220,53,69,0.25)',
              }}
            >
              {lang === 'ja' ? 'ログアウト' : 'Sign Out'}
            </button>
          </div>
        )}

        {/* アプリ情報 */}
        <div className="nb-card-plain">
          <p className="text-xs font-bold mb-3" style={{ color: '#1E3A5F' }}>
            {lang === 'ja' ? 'ℹ️ アプリ情報' : 'ℹ️ App Info'}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#7A6E5F' }}>{lang === 'ja' ? 'バージョン' : 'Version'}</span>
              <span className="text-xs font-semibold" style={{ color: '#1E1A14' }}>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#7A6E5F' }}>{lang === 'ja' ? 'データ保存' : 'Storage'}</span>
              <span className="text-xs font-semibold" style={{ color: '#1E1A14' }}>
                {lang === 'ja' ? 'クラウド（Supabase）' : 'Cloud (Supabase)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
