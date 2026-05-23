import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[a-zA-Z\s]+$/),
  lastName: z.string().min(2).max(50).regex(/^[a-zA-Z\s]+$/),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
  captchaToken: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(1000).optional(),
  signature: z.string().max(500).optional(),
  statusMessage: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  twitter: z.string().max(50).optional(),
  github: z.string().max(50).optional(),
  discord: z.string().max(50).optional(),
  youtube: z.string().max(100).optional(),
  birthdate: z.string().optional(),
  language: z.enum(['en', 'si', 'ta']).optional(),
});

export const createThreadSchema = z.object({
  forumId: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(50000),
  type: z.enum(['DISCUSSION', 'QUESTION', 'POLL', 'ANNOUNCEMENT']).default('DISCUSSION'),
  prefixId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  poll: z.object({
    question: z.string().min(5).max(200),
    options: z.array(z.string().min(1).max(100)).min(2).max(10),
    allowMultiple: z.boolean().default(false),
    expiresAt: z.string().datetime().optional(),
  }).optional(),
  isDraft: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
});

export const updateThreadSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(10).max(50000).optional(),
  prefixId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().max(30)).max(5).optional(),
});

export const createCommentSchema = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(20000),
  parentId: z.string().uuid().optional(),
  quotedCommentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(20000),
});

export const createMessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const createReactionSchema = z.object({
  targetType: z.enum(['THREAD', 'COMMENT']),
  targetId: z.string().uuid(),
  reactionType: z.enum(['like', 'love', 'funny', 'helpful', 'sad', 'angry']),
});

export const reportSchema = z.object({
  targetType: z.enum(['THREAD', 'COMMENT', 'USER', 'MESSAGE']),
  targetId: z.string().uuid(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'MISINFORMATION', 'OTHER']),
  description: z.string().max(1000).optional(),
});

export const searchSchema = z.object({
  query: z.string().min(2).max(200),
  type: z.enum(['all', 'threads', 'comments', 'users', 'forums']).default('all'),
  forumId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['relevance', 'date', 'replies', 'views']).default('relevance'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const createForumSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  icon: z.string().max(50).optional(),
  sortOrder: z.number().int().default(0),
  isPrivate: z.boolean().default(false),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export const privacySettingsSchema = z.object({
  hideProfile: z.boolean(),
  hideOnlineStatus: z.boolean(),
  hideLastSeen: z.boolean(),
  hideReactions: z.boolean(),
  hideFollowers: z.boolean(),
  hideBirthdate: z.boolean(),
  hideMessages: z.boolean(),
  hideEmail: z.boolean(),
});

export const notificationPrefsSchema = z.object({
  emailMentions: z.boolean(),
  emailReplies: z.boolean(),
  emailMessages: z.boolean(),
  emailFollows: z.boolean(),
  emailDigest: z.enum(['none', 'daily', 'weekly']),
  pushEnabled: z.boolean(),
  pushMentions: z.boolean(),
  pushReplies: z.boolean(),
  pushMessages: z.boolean(),
});

export const adminUserActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['BAN', 'MUTE', 'WARN', 'SUSPEND', 'SHADOW_BAN', 'UNBAN', 'UNMUTE', 'VERIFY']),
  reason: z.string().max(500).optional(),
  duration: z.number().int().optional(),
  note: z.string().max(1000).optional(),
});

export const usernameChangeRequestSchema = z.object({
  requestedUsername: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  reason: z.string().min(10).max(500),
});

export const notificationBarSchema = z.object({
  text: z.string().min(1).max(500),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  buttonText: z.string().max(50).optional(),
  buttonUrl: z.string().url().optional(),
  buttonColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isClosable: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  audience: z.enum(['all', 'guests', 'members', 'admins']).default('all'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type PrivacySettingsInput = z.infer<typeof privacySettingsSchema>;
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;
