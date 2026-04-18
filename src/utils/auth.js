/**
 * Frontend-only auth. Session keys (per product spec):
 * - `users` — JSON array of registered accounts (multi-user)
 * - `user` — last registered profile `{ email, password, name }`
 * - `guest` — `"true"` when continuing as guest
 * - `isAuthenticated` — `"true"` when logged in or guest
 * - `userName` — display name or email (guest → `"Guest"`)
 * - `currentUser` — legacy hydrated user object (kept for compatibility)
 */

export function ensureSessionOrMigrate() {
  if (localStorage.getItem('isAuthenticated') === 'true' || localStorage.getItem('guest') === 'true') {
    return
  }
  const raw = localStorage.getItem('currentUser')
  if (!raw) return
  try {
    const u = JSON.parse(raw)
    if (!u || typeof u !== 'object') return
    localStorage.setItem('isAuthenticated', 'true')
    if (!localStorage.getItem('userName')) {
      localStorage.setItem('userName', u.name || u.email || '')
    }
    if (u.email === 'guest@demo.com' || u.name === 'Guest User' || u.name === 'Guest') {
      localStorage.setItem('guest', 'true')
      localStorage.setItem('userName', 'Guest')
    }
  } catch {
    localStorage.removeItem('currentUser')
  }
}

export function hasSessionAccess() {
  ensureSessionOrMigrate()
  if (localStorage.getItem('guest') === 'true') return true
  if (localStorage.getItem('isAuthenticated') === 'true') return true
  return false
}

export function registerUser(name, email, password) {
  const em = email.trim()
  try {
    const raw = localStorage.getItem('user')
    if (raw) {
      const existingUser = JSON.parse(raw)
      if (existingUser && typeof existingUser === 'object' && existingUser.email === em) {
        return { success: false, error: 'User already exists. Please login.' }
      }
    }
  } catch {
    /* ignore invalid stored user */
  }
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const exists = users.find((u) => u.email === em)
  if (exists) return { success: false, error: 'User already exists. Please login.' }
  const entry = { name: name.trim(), email: em, password }
  users.push(entry)
  localStorage.setItem('users', JSON.stringify(users))
  const user = { name: entry.name, email: entry.email, password }
  localStorage.setItem('user', JSON.stringify(user))
  return { success: true }
}

export function loginUser(email, password) {
  const em = email.trim()
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  let user = users.find((u) => u.email === em && u.password === password)
  if (!user) {
    try {
      const single = JSON.parse(localStorage.getItem('user') || 'null')
      if (single && single.email === em && single.password === password) {
        user = { name: single.name, email: single.email, password: single.password }
      }
    } catch {
      /* ignore */
    }
  }
  if (!user) return { success: false }
  localStorage.setItem('currentUser', JSON.stringify(user))
  localStorage.setItem('isAuthenticated', 'true')
  localStorage.setItem('userName', user.name || user.email || '')
  localStorage.removeItem('guest')
  return { success: true, user }
}

export function getCurrentUser() {
  ensureSessionOrMigrate()
  if (localStorage.getItem('guest') === 'true') {
    return { name: 'Guest', email: 'guest@demo.com' }
  }
  try {
    const raw = localStorage.getItem('currentUser')
    if (raw) return JSON.parse(raw)
  } catch {
    localStorage.removeItem('currentUser')
  }
  if (localStorage.getItem('isAuthenticated') === 'true') {
    const un = localStorage.getItem('userName')
    if (un) {
      let email = ''
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        email = u.email || ''
      } catch {
        /* ignore */
      }
      return { name: un, email, password: '' }
    }
  }
  return null
}

export function getUserName() {
  ensureSessionOrMigrate()
  if (localStorage.getItem('guest') === 'true') return 'Guest'
  const stored = localStorage.getItem('userName')
  if (stored) return stored
  const u = getCurrentUser()
  return u?.name || u?.email || ''
}

export function logoutUser() {
  localStorage.removeItem('currentUser')
  localStorage.removeItem('isAuthenticated')
  localStorage.removeItem('userName')
  localStorage.removeItem('guest')
  localStorage.removeItem('user')
}

export function loginAsGuest() {
  localStorage.setItem('guest', 'true')
  localStorage.setItem('isAuthenticated', 'true')
  localStorage.setItem('userName', 'Guest')
  localStorage.removeItem('currentUser')
}

/** True when the user may access protected routes (registered user or guest). */
export function isAuthenticated() {
  return hasSessionAccess()
}
