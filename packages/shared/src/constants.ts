export const APP_NAME = process.env.APP_NAME || 'NullForum';

export const USER_ROLES = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  SUPER_MODERATOR: 'SUPER_MODERATOR',
  ADMIN: 'ADMIN',
} as const;

export const MEMBER_STATUS = {
  NEW_MEMBER: { name: 'New Member', minPoints: 0 },
  JUNIOR_MEMBER: { name: 'Junior Member', minPoints: 50 },
  MEMBER: { name: 'Member', minPoints: 200 },
  ACTIVE_MEMBER: { name: 'Active Member', minPoints: 500 },
  WELL_KNOWN_MEMBER: { name: 'Well-known Member', minPoints: 1000 },
  VETERAN: { name: 'Veteran', minPoints: 5000 },
} as const;

export const SPECIAL_BADGES = {
  VERIFIED: 'Verified User',
  SPONSOR: 'Sponsor',
  DEVELOPER: 'Developer',
  VIP: 'VIP',
} as const;

export const REACTIONS = {
  LIKE: { id: 'like', emoji: '👍', label: 'Like', score: 1 },
  LOVE: { id: 'love', emoji: '❤️', label: 'Love', score: 2 },
  FUNNY: { id: 'funny', emoji: '😂', label: 'Funny', score: 1 },
  HELPFUL: { id: 'helpful', emoji: '💡', label: 'Helpful', score: 3 },
  SAD: { id: 'sad', emoji: '😢', label: 'Sad', score: 0 },
  ANGRY: { id: 'angry', emoji: '😡', label: 'Angry', score: -1 },
} as const;

export const THREAD_TYPES = {
  DISCUSSION: 'DISCUSSION',
  QUESTION: 'QUESTION',
  POLL: 'POLL',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
} as const;

export const THREAD_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  LOCKED: 'LOCKED',
  SOLVED: 'SOLVED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const MODERATION_ACTIONS = {
  WARN: 'WARN',
  MUTE: 'MUTE',
  BAN: 'BAN',
  SUSPEND: 'SUSPEND',
  SHADOW_BAN: 'SHADOW_BAN',
  UNBAN: 'UNBAN',
  UNMUTE: 'UNMUTE',
} as const;

export const NOTIFICATION_TYPES = {
  MENTION: 'MENTION',
  QUOTE: 'QUOTE',
  REPLY: 'REPLY',
  FOLLOW: 'FOLLOW',
  REACTION: 'REACTION',
  MESSAGE: 'MESSAGE',
  THREAD_UPDATE: 'THREAD_UPDATE',
  MODERATION: 'MODERATION',
  SYSTEM: 'SYSTEM',
  BADGE: 'BADGE',
} as const;

export const RATE_LIMITS = {
  AUTH: { max: 5, window: 900000 },
  API: { max: 100, window: 60000 },
  UPLOAD: { max: 10, window: 60000 },
  MESSAGE: { max: 30, window: 60000 },
  REACTION: { max: 50, window: 60000 },
  SEARCH: { max: 20, window: 60000 },
} as const;

export const FILE_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024,
  BANNER_MAX_SIZE: 10 * 1024 * 1024,
  ATTACHMENT_MAX_SIZE: 25 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const LANGUAGES = {
  EN: { code: 'en', name: 'English', dir: 'ltr' },
  SI: { code: 'si', name: 'සිංහල', dir: 'ltr' },
  TA: { code: 'ta', name: 'தமிழ்', dir: 'ltr' },
} as const;
