import { useState } from 'react'

const STORAGE_KEY = 'tn-feature-tour-v1'

export const hasSeenFeatureTour = () => !!localStorage.getItem(STORAGE_KEY)

interface Props {
  lang: string
  onDone: () => void
}

interface Card {
  emoji: string
  title: { ja: string; en: string }
  desc:  { ja: string; en: string }
  accent: string
}

const CARDS: Card[] = [
  {
    emoji: '📓',
    title: { ja: '練習記録', en: 'Practice Log' },
    desc: {
      ja: '今日の練習目標・メニュー・気づきを記録。\n次への課題が自然と見えてきます。',
      en: 'Log your goals, drills & insights.\nYour next challenge becomes crystal clear.',
    },
    accent: '#E07B2A',
  },
  {
    emoji: '🏀',
    title: { ja: '試合記録', en: 'Game Record' },
    desc: {
      ja: 'スタッツ・反省・メンタルを記録して\n次の試合に活かしましょう。',
      en: 'Record stats, reflections & mental notes.\nLearn and grow from every game.',
    },
    accent: '#1E3A5F',
  },
  {
    emoji: '🎯',
    title: { ja: '目標管理', en: 'Goal Tracking' },
    desc: {
      ja: '短期・長期の目標を設定して\n進捗をグラフで可視化できます。',
      en: 'Set short & long-term goals\nand track your progress visually.',
    },
    accent: '#2E7D32',
  },
  {
    emoji: '🤝',
    title: { ja: 'チーム・コーチ連携', en: 'Team & Coach' },
    desc: {
      ja: 'チームを作って仲間と記録を共有。\nコーチからのフィードバックも受け取れます。',
      en: 'Create a team and share records.\nReceive direct feedback from your coach.',
    },
    accent: '#6A1B9A',
  },
]

export function OnboardingCards({ lang, onDone }: Props) {
  const [index, setIndex] = useState(0)

  const handleDone = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
  }

  const card   = CARDS[index]
  const isLast = index === CARDS.length - 1
  const l      = lang as 'ja' | 'en'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: '#0F2340',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
    }}>

      {/* スキップ */}
      <button
        onClick={handleDone}
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'transparent', border: 'none',
          color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', cursor: 'pointer',
        }}
      >
        {lang === 'ja' ? 'スキップ' : 'Skip'}
      </button>

      {/* カード */}
      <div
        key={index}
        style={{
          backgroundColor: 'white', borderRadius: 24,
          padding: '40px 28px 36px',
          width: '100%', maxWidth: 360,
          textAlign: 'center',
          animation: 'cardSlideIn 0.35s ease',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* アイコン */}
        <div style={{
          width: 84, height: 84, borderRadius: '50%',
          backgroundColor: `${card.accent}18`,
          border: `2px solid ${card.accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '2.6rem',
        }}>
          {card.emoji}
        </div>

        {/* タイトル */}
        <h2 style={{
          fontSize: '1.4rem', fontWeight: 800, color: '#1E1A14',
          marginBottom: 12, fontFamily: "'Klee One', cursive",
        }}>
          {card.title[l] ?? card.title.ja}
        </h2>

        {/* 説明 */}
        <p style={{
          fontSize: '0.88rem', color: '#7A6E5F',
          lineHeight: 1.85, whiteSpace: 'pre-line', margin: 0,
        }}>
          {card.desc[l] ?? card.desc.ja}
        </p>
      </div>

      {/* ドット */}
      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
        {CARDS.map((_, i) => (
          <div
            key={i}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? 22 : 8, height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? '#E07B2A' : 'rgba(255,255,255,0.28)',
              transition: 'all 0.25s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* ボタン */}
      <button
        onClick={() => isLast ? handleDone() : setIndex(i => i + 1)}
        style={{
          marginTop: 24,
          backgroundColor: '#E07B2A',
          color: 'white',
          border: 'none',
          borderRadius: 16,
          padding: '14px 44px',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(224,123,42,0.45)',
          minWidth: 180,
        }}
      >
        {isLast
          ? (lang === 'ja' ? 'はじめる 🏀' : 'Get Started 🏀')
          : (lang === 'ja' ? '次へ →' : 'Next →')}
      </button>

      {/* カウンター */}
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: 12 }}>
        {index + 1} / {CARDS.length}
      </p>
    </div>
  )
}
