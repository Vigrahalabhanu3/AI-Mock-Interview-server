// ============================================
// user.utils.js - User Name & Email Helpers
// ============================================

/**
 * Derives a clean, capitalized, and human-friendly display name from an email address.
 * Examples:
 *   "john.doe@example.com"      -> "John Doe"
 *   "alex_smith_99@company.com" -> "Alex Smith"
 *   "priya@domain.com"          -> "Priya"
 *   "rohit-kumar@domain.com"    -> "Rohit Kumar"
 */
export const deriveNameFromEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return 'Candidate';
  const prefix = email.split('@')[0];
  const cleaned = prefix.replace(/[0-9]+/g, '').replace(/[_.-]+/g, ' ').trim();
  if (!cleaned) {
    return prefix;
  }
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Resolves the accurate candidate display name.
 * Prevents hardcoded legacy "bhanu" or "Test User" names from leaking
 * to accounts registered or logged in with different emails.
 */
export const resolveCandidateName = (candidate) => {
  if (!candidate) return 'Candidate';
  const email = (candidate.email || '').trim().toLowerCase();
  const name = (candidate.name || '').trim();

  // If name is present and valid
  if (name && name.toLowerCase() !== 'candidate' && name.toLowerCase() !== 'user' && name.toLowerCase() !== 'test user') {
    // If the name in database was set to "bhanu" but the candidate's email is NOT bhanu
    if (name.toLowerCase() === 'bhanu' && !email.includes('bhanu') && !email.includes('banu')) {
      return deriveNameFromEmail(email);
    }
    return name;
  }

  // Fallback to deriving name cleanly from candidate's email
  return deriveNameFromEmail(email);
};
