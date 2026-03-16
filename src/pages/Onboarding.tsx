import { useState } from 'react'
import { saveProfile } from '../lib/profile'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { COUNTRIES } from '../lib/locale'

interface Props {
  onComplete: () => void
}

export function Onboarding({ onComplete }: Props) {
  const { lang, country, setCountry } = useLanguage()
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [motto, setMotto] = useState('')

  const handleStart = async () => {
    saveProfile({ motto: motto.trim(), onboardingDone: true })
    // display_name を Supabase に保存
    if (user && displayName.trim()) {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      })
    }
    onComplete()
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#1E3A5F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)',
        pointerEvents: 'none',
      }} />
      {/* glow */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: 220, height: 220,
        background: 'radial-gradient(circle, rgba(224,123,42,0.18) 0%, transparent 70%)',
        transform: 'translate(30%, -30%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 380, textAlign: 'center' }}>
        {/* logo */}
        <div style={{ fontSize: '3.5rem', marginBottom: '8px', lineHeight: 1 }}>🏀</div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginBottom: '6px', letterSpacing: '0.08em' }}>
          {lang === 'ja' ? 'ようこそ' : 'WELCOME'}
        </p>
        <h1 style={{
          color: 'white',
          fontSize: '1.9rem',
          fontFamily: "'Klee One', cursive",
          fontWeight: 700,
          marginBottom: '8px',
        }}>
          {lang === 'ja' ? 'バスケノート' : 'BasketNote'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '36px', lineHeight: 1.6 }}>
          {lang === 'ja' ? '練習・試合・成長を記録するノート' : 'Track your practice, games & growth'}
        </p>

        {/* Country selector card */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '24px 20px',
          marginBottom: '16px',
          border: '1px solid rgba(255,255,255,0.12)',
          textAlign: 'left',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
            {lang === 'ja' ? '🌏 あなたの国・地域' : '🌏 Your Country / Region'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem', marginBottom: '14px', lineHeight: 1.5 }}>
            {lang === 'ja'
              ? 'カレンダーの形式と言語が自動で設定されます。'
              : 'Sets your calendar format and language automatically.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                style={{
                  padding: '10px 4px',
                  borderRadius: '12px',
                  border: country.code === c.code
                    ? '2px solid rgba(224,123,42,0.9)'
                    : '1px solid rgba(255,255,255,0.12)',
                  background: country.code === c.code
                    ? 'rgba(224,123,42,0.18)'
                    : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{c.flag}</span>
                <span style={{
                  fontSize: '0.65rem',
                  color: country.code === c.code ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                  fontWeight: country.code === c.code ? 700 : 400,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {lang === 'ja' ? c.nameJa : c.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Display Name card */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '24px 20px',
          marginBottom: '16px',
          border: '1px solid rgba(255,255,255,0.12)',
          textAlign: 'left',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
            {lang === 'ja' ? '👤 あなたの名前' : '👤 Your Name'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem', marginBottom: '14px', lineHeight: 1.5 }}>
            {lang === 'ja'
              ? 'コーチに表示される名前です。'
              : 'This name is shown to your coach.'}
          </p>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={lang === 'ja' ? '例）田中 太郎（空欄でもOK）' : 'e.g. John Smith (optional)'}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.95rem',
              padding: '10px 12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Motto card */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding: '24px 20px',
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.12)',
          textAlign: 'left',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 600 }}>
            {lang === 'ja' ? '✒️ 座右の銘・好きな言葉' : '✒️ Your Motto'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.75rem', marginBottom: '14px', lineHeight: 1.5 }}>
            {lang === 'ja'
              ? 'ホーム画面に表示されます。あとで設定から変更できます。'
              : 'Displayed on your home screen. You can change it in Settings later.'}
          </p>
          <textarea
            className="motto-input"
            value={motto}
            onChange={e => setMotto(e.target.value)}
            placeholder={lang === 'ja' ? '例）一球入魂、Never give up…（空欄でもOK）' : 'e.g. Hard work beats talent… (optional)'}
            rows={3}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.95rem',
              fontFamily: "'Klee One', cursive",
              lineHeight: 1.75,
              padding: '10px 12px',
              resize: 'none',
              outline: 'none',
            }}
          />
        </div>

        <button
          onClick={handleStart}
          className="btn-primary"
          style={{ fontSize: '1rem' }}
        >
          {lang === 'ja' ? '始める →' : 'Get Started →'}
        </button>
      </div>
    </div>
  )
}
