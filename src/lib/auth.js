/** Re-exports for legacy imports — source of truth is `src/utils/auth.js` */
export {
  ensureSessionOrMigrate,
  hasSessionAccess,
  registerUser,
  loginUser,
  getCurrentUser,
  getUserName,
  logoutUser,
  loginAsGuest,
  isAuthenticated,
} from '../utils/auth.js'
