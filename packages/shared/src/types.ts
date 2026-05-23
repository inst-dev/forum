export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
    total: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface UserPublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  status: string | null;
  memberStatus: string;
  role: string;
  badges: Badge[];
  reactionScore: number;
  points: number;
  threadCount: number;
  commentCount: number;
  joinedAt: string;
  lastSeen: string | null;
  isOnline: boolean;
  socialLinks: SocialLinks;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  youtube?: string;
}

export interface ThreadSummary {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  prefix: string | null;
  author: {
    id: string;
    username: string;
    avatar: string | null;
    memberStatus: string;
  };
  forum: {
    id: string;
    name: string;
    slug: string;
  };
  commentCount: number;
  viewCount: number;
  reactionCount: number;
  lastReply: {
    author: { username: string; avatar: string | null };
    createdAt: string;
  } | null;
  isPinned: boolean;
  isSticky: boolean;
  isLocked: boolean;
  isSolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  actor: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;
  createdAt: string;
}

export interface OnlineUser {
  id: string;
  username: string;
  avatar: string | null;
  status: string;
}

export interface SearchResult {
  type: 'thread' | 'comment' | 'user' | 'forum';
  id: string;
  title: string;
  excerpt: string;
  url: string;
  createdAt: string;
  relevance: number;
}
