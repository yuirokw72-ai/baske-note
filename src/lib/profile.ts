export interface Profile {
  motto: string
  onboardingDone: boolean
  mode?: 'individual' | 'team'
}

const KEY = 'bskt-profile'
const DEFAULT: Profile = { motto: '', onboardingDone: false }

export function getProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveProfile(patch: Partial<Profile>): void {
  localStorage.setItem(KEY, JSON.stringify({ ...getProfile(), ...patch }))
}
