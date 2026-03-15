import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { SpinningCursor } from '../components/SpinningCursor'

export function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const { lang, setLang }    = useLanguage()

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
      <SpinningCursor />

      {/* 言語切り替え */}
      <button
        onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
        style={{
          position: 'absolute', top: 16, right: 16,
          padding: '4px 12px', borderRadius: 20,
          fontSize: '0.75rem', fontWeight: 700,
          backgroundColor: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {lang === 'ja' ? 'EN' : 'JA'}
      </button>

      {/* background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)',
        pointerEvents: 'none',
      }} />
      {/* glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 220, height: 220,
        background: 'radial-gradient(circle, rgba(224,123,42,0.18) 0%, transparent 70%)',
        transform: 'translate(30%, -30%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '8px', lineHeight: 1 }}>🏀</div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginBottom: '6px', letterSpacing: '0.08em' }}>
          {lang === 'ja' ? 'ようこそ' : 'WELCOME'}
        </p>
        <h1 style={{
          color: 'white', fontSize: '1.9rem',
          fontFamily: "'Klee One', cursive", fontWeight: 700,
          marginBottom: '8px',
        }}>
          {lang === 'ja' ? 'バスケノート' : 'BaskeNote'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '40px', lineHeight: 1.6 }}>
          {lang === 'ja' ? '練習・試合・成長を記録するノート' : 'Track your practice, games & growth'}
        </p>

        <button
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px 24px',
            borderRadius: '14px',
            backgroundColor: 'white',
            color: '#1E1A14',
            fontSize: '0.95rem',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            border: 'none',
          }}
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {lang === 'ja' ? 'Googleでログイン' : 'Continue with Google'}
        </button>

        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '0.7rem', marginTop: '20px', lineHeight: 1.6 }}>
          {lang === 'ja'
            ? 'ログインすることで、複数デバイスからデータにアクセスできます'
            : 'Sign in to access your data from any device'}
        </p>
      </div>
    </div>
  )
}
