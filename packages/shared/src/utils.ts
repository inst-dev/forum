export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

export function generateUsername(firstName: string, lastName: string): string {
  const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${base}${suffix}`.substring(0, 30);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function formatDate(date: string | Date, locale = 'en'): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getMemberStatus(points: number): string {
  if (points >= 5000) return 'Veteran';
  if (points >= 1000) return 'Well-known Member';
  if (points >= 500) return 'Active Member';
  if (points >= 200) return 'Member';
  if (points >= 50) return 'Junior Member';
  return 'New Member';
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.substring(0, 2) + '***';
  return `${masked}@${domain}`;
}

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function calculatePages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function filterBadWords(text: string, badWords: string[]): string {
  let filtered = text;
  for (const word of badWords) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    filtered = filtered.replace(regex, (match) => {
      if (match.length <= 2) return match;
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  }
  return filtered;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectRepeatedChars(text: string): boolean {
  return /(.)\1{4,}/g.test(text);
}

export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
