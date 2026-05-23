# Enterprise Forum Platform Master Prompt (Elakiri.com-style Community Platform)

Build a production-grade, ultra-secure, modern community forum platform inspired by classic community websites like Elakiri, but fully redesigned using modern architecture, scalable backend systems, and high-performance frontend rendering.

This is NOT a CodeCanyon-style beginner project.
This is a long-term production SaaS/community platform.

app name: NullForum (use it with .env file coz maybe it changing later. for now use it.)

---

# PRIMARY GOALS

- Security FIRST
- High performance
- SEO friendly
- Fully responsive
- Accessible
- Scalable architecture
- Modern stack
- Server Components where possible
- Real-time features
- Strong admin moderation tools
- Sinhala + multilingual support
- Light mode + Dark mode
- Community-first UX
- Clean/simple UI
- NOT overdesigned
- Forum-first experience

---

# REQUIRED TECH STACK

## Frontend

- Next.js latest App Router
- React latest
- React Server Components wherever possible
- TypeScript strict mode
- Pure CSS ONLY
- NO Tailwind
- NO Bootstrap
- NO Material UI
- NO Chakra UI
- NO inline CSS
- NO CSS modules with readable class names

### CSS Rules

Use obfuscated/random utility-like class names.
Example:

```css
.fkkdi5f {
  color: #fff;
}

.ggoddut {
  background: #000;
}
```

NEVER use:

```css
.navbar {
  background: red;
}
```

Each style block/class must be isolated.
CSS must be optimized and production-ready.

Use:

- CSS variables
- Theme variables
- CSS minification
- Dynamic theme loading
- Critical CSS optimization

---

## Backend

- Next.js API routes where suitable
- Separate backend service using Fastify
- Node.js latest LTS
- TypeScript
- Prisma ORM
- MySQL database
- Redis for cache/session/rate limiting/realtime
- Socket.IO or WebSocket secure realtime layer
- Nodemailer for email system

DO NOT USE:

- Docker
- MongoDB
- Firebase

---

# AUTHENTICATION & SECURITY

Use Auth0 if free tier is sufficient.
Otherwise implement secure JWT + session architecture.

## Authentication Features

- Email/password login
- Google login
- GitHub login
- Secure sessions
- Refresh token rotation
- Device/session management
- Session revocation
- Login history
- Optional 2FA/TOTP
- Password reset
- Email verification
- Rate-limited auth
- CAPTCHA support
- Secure logout everywhere

## Security Requirements

Implement ALL:

- CSRF protection
- XSS protection
- SQL injection prevention
- Prisma safe queries
- Strict input validation
- Zod validation
- Helmet headers
- CSP headers
- Secure cookies
- HttpOnly cookies
- SameSite cookies
- Origin validation
- Request size limiting
- IP rate limiting
- User rate limiting
- API abuse detection
- Spam detection
- Bot detection
- Audit logs
- Admin action logs
- File upload scanning
- MIME validation
- WebP conversion pipeline
- Sensitive API filtering
- Private profile protection
- Hidden email addresses
- Hidden user metadata
- Secure websocket auth
- Anti scraping protection
- Account lock after abuse
- IP reputation blocking
- Report system
- Moderation queue
- Shadow bans
- Muting system
- Profanity filter
- Sanitized rich text rendering
- HTML sanitization
- Markdown sanitization
- Secure image upload
- Signed upload URLs
- Image EXIF stripping
- Image compression

Never expose:

- private emails
- IPs
- tokens
- auth data
- admin metadata
- hidden profile fields
- internal database IDs where unnecessary

---

# DATABASE

Use MySQL + Prisma.

Create optimized relational schema.

Add:

- indexes
- composite indexes
- cascading rules
- soft delete support
- audit tables
- analytics tables
- moderation tables
- activity logs
- notification tables
- user privacy settings
- report tables
- message tables
- thread history
- username change request system

Use:

- Prisma migrations
- Prisma transactions
- Prisma relations
- Query optimization

---

# USER SYSTEM

## User Features

- Register
- Login
- Logout
- Email verify
- Forgot password
- Change password
- Manage sessions
- Profile pages
- Avatar upload
- Banner upload
- Bio
- Signature
- Status message
- Social links
- Activity tracking
- User badges
- User roles
- User reactions
- Reaction score
- Points system
- Trophy system
- User levels
- Member status system
- Following system
- Followers system
- Ignore/block system
- Bookmark system
- Watch threads
- Notification preferences
- Email preferences
- Privacy settings
- Hidden profile support
- User reports
- User mentions
- Online status
- Last seen
- Typing indicators
- Presence system

## Username Rules

- Username auto-generated from first name + last name
- During registration user may change username ONCE
- After account creation username can NEVER be changed by user
- Admin username change request system required
- Add request page + moderation flow
- Mention clearly in UI that usernames cannot be changed later without admin approval

---

# PRIVACY SYSTEM

## Public Profile Toggle

Users can disable public visibility.

If disabled:

- profile returns 404
- API returns 404
- search results hide user
- hover cards disabled
- public thread references anonymized if needed

Privacy settings:

- hide profile
- hide online status
- hide last seen
- hide reactions
- hide followers
- hide birthdate
- hide messages
- hide email

---

# FORUM SYSTEM

## Forum Features

Implement ALL forum features.

### Structure

- Categories
- Forums
- Subforums
- Child forums
- Thread prefixes
- Tags/labels
- Thread types
- Sticky threads
- Locked threads
- Pinned threads
- Announcements
- Polls
- Question threads
- Solved thread status
- Drafts
- Scheduled posts
- Thread history
- Thread revisions
- Merge threads
- Move threads
- Split threads
- Archive threads

---

# THREAD SYSTEM

## URL Structure

Thread URL format:

```txt
/:slug/:threadId
```

Slug auto-generated from thread title.

Example:

```txt
/how-to-learn-nextjs/1281
```

## Thread Features

- Rich editor
- Markdown support
- Emoji support
- GIF support
- Attachments
- Image uploads
- Video embeds
- Link embeds
- Polls
- Reactions
- Share system
- Bookmark system
- Watch thread
- View counter
- Nested comments
- Nested replies
- Reply quotes
- Multi quote
- Draft autosave
- Thread previews
- Mention notifications
- Thread edit history
- Moderation logs
- Reports
- SEO metadata
- OpenGraph support
- Twitter cards
- Canonical URLs

---

# COMMENT SYSTEM

## Features

- Nested replies
- Rich text support
- Mention support
- Quote support
- Reactions
- Report comment
- Edit comment
- Delete comment
- Soft delete
- Restore comment
- Moderation notes
- Spam detection
- Link filtering
- Bad word filtering
- Image attachments
- GIF support
- Rate limiting

---

# BAD WORD FILTER

Create advanced profanity filter.

Example:

```txt
shit -> s**t
```

Requirements:

- multilingual support
- Sinhala support
- custom admin-defined words
- regex filtering
- bypass detection
- repeated character detection
- AI spam scoring optional
- moderation queue

---

# REALTIME SYSTEM

Secure realtime architecture required.

## Features

- Realtime messaging
- Realtime notifications
- Typing indicators
- Online users
- Live thread updates
- Live reactions
- Live alerts
- Live moderation actions

## Security

- Authenticated sockets only
- Token verification
- Room validation
- Rate limits
- Anti spam
- Anti flood

---

# DIRECT MESSAGE SYSTEM

## Features

- User-to-user messaging
- Realtime chat
- Attachments
- Read receipts
- Typing indicators
- Message delete
- Message reports
- Blocked user handling
- Spam prevention
- Conversation search
- Message encryption best practices

---

# REACTION SYSTEM

Implement modern reaction system.

## Features

- Like
- Love
- Funny
- Helpful
- Sad
- Angry
- Custom admin reactions
- Reaction score
- Daily limits
- Abuse prevention

---

# MEMBER STATUS SYSTEM

Create automatic member rank/status system.

Examples:

- New Member
- Junior Member
- Member
- Active Member
- Well-known Member
- Veteran
- Moderator
- Super Moderator
- Admin
- Verified User
- Sponsor
- Developer
- VIP

Support:

- custom badges
- SVG badges
- animated badges
- verification system
- manual admin assignments
- automatic rank progression

Highlighted users must have:

- special borders
- username colors
- badge highlights
- hover effects

---

# USER HOVER CARD

When hovering usernames show popover card.

Include:

- avatar
- banner preview
- username
- badge
- reaction score
- points
- member since
- last seen
- follow button
- message button
- online status

Respect privacy settings.

If profile hidden -> do not show.

---

# IMAGE SYSTEM

## Requirements

- Upload images in app
- Auto convert all images to WebP
- Strip metadata
- Compression pipeline
- Responsive image sizes
- Lazy loading
- Use Next.js Image component everywhere
- CDN-ready architecture
- Avatar optimization
- Banner optimization
- Attachment validation

---

# SEARCH SYSTEM

Implement advanced search.

## Features

- Search threads
- Search comments
- Search users
- Search forums
- Search tags
- Search attachments
- Full text search
- Relevance ranking
- Filters
- Sorting
- Date ranges
- User filters
- Prefix filters

---

# NOTIFICATION SYSTEM

## Features

- Realtime notifications
- Email notifications
- Mention alerts
- Quote alerts
- DM alerts
- Follow alerts
- Thread reply alerts
- Admin alerts
- Moderation alerts
- Push notifications

User can customize all notification preferences.

---

# EMAIL SYSTEM

Use Nodemailer.

## Send Emails For

- verification
- login alerts
- password reset
- thread replies
- mentions
- messages
- moderation actions
- warnings
- birthday wishes
- announcements
- newsletter
- admin alerts
- security alerts

Use:

- HTML templates
- queue system
- retry handling
- unsubscribe management

---

# ADMIN PANEL

Build enterprise-grade admin panel.

## Admin Features

### User Management

- ban users
- mute users
- warn users
- suspend users
- verify users
- assign badges
- edit permissions
- reset passwords
- approve username changes
- profile moderation

### Forum Management

- create forums
- edit forums
- reorder forums
- manage categories
- manage tags
- manage prefixes
- manage themes
- manage layouts

### Content Moderation

- reports queue
- spam queue
- flagged content
- shadow bans
- automated moderation
- deleted content recovery

### Activity Tracking

Track EVERYTHING:

- admin actions
- moderator actions
- login attempts
- security events
- API abuse
- thread edits
- profile changes
- permission changes
- reports

### Site Customization

Admin can:

- upload logo
- upload favicon
- manage themes
- customize notification bars
- set background color
- set text color
- set links
- schedule banners
- add announcements
- manage SEO settings

---

# NOTIFICATION BAR SYSTEM

Admins can create top notification bars.

## Features

- background color
- text color
- button color
- close option
- scheduling
- link support
- markdown support
- audience targeting
- mobile support

---

# SEO OPTIMIZATION

Must be extremely SEO friendly.

## Requirements

- SSR
- Server Components
- metadata API
- sitemap.xml
- robots.txt
- structured data
- OpenGraph
- Twitter metadata
- canonical URLs
- pagination SEO
- lazy loading
- optimized bundle splitting
- image optimization
- prefetching
- caching
- edge-ready optimizations

---

# PERFORMANCE

## Requirements

- Redis caching
- optimized DB queries
- image optimization
- route caching
- server component streaming
- partial hydration
- pagination
- virtualized lists
- websocket optimization
- bundle optimization
- compression
- CDN-ready
- low TTFB
- Lighthouse optimized

---

# THEMING

## Requirements

- Light mode
- Dark mode
- Save theme to database
- Sync across devices
- CSS variable themes
- Theme switching animation
- Admin customizable themes

---

# LANGUAGE SUPPORT

## Requirements

- Sinhala support
- Tamil support
- English support
- UTF-8 safe
- RTL-ready architecture
- i18n support
- localized timestamps
- language switcher

---

# RESPONSIVE DESIGN

Must support:

- Desktop
- Laptop
- Tablet
- Mobile
- Small mobile
- Large screens

Requirements:

- touch friendly
- responsive navigation
- responsive editor
- responsive tables
- responsive popovers
- optimized mobile menus

---

# CUSTOM ERROR PAGES

Create ALL custom pages.

## Required

- 404
- 401
- 403
- 429
- 500
- maintenance page
- banned page
- deleted content page
- hidden profile page
- offline page

Also handle:

- Next.js app errors
- route errors
- API errors
- websocket errors
- upload errors

---

# API ARCHITECTURE

## Requirements

- REST API
- optionally tRPC
- strict validation
- pagination
- cursor pagination
- secure serialization
- no sensitive leaks
- standardized errors
- audit logging
- versioning support

---

# FILE STRUCTURE

Use scalable architecture.

Example:

```txt
/apps
/packages
/services
/modules
/components
/features
/lib
/hooks
/types
/styles
```

Use:

- clean architecture
- modular services
- repository pattern
- service layer
- validation layer
- DTOs

---

# REQUIRED PAGES

Create ALL pages.

## Public Pages

- home
- categories
- forums
- subforums
- threads
- tags
- search
- login
- register
- forgot password
- rules
- privacy
- terms
- contact
- announcements
- members list
- leaderboard

## User Pages

- profile
- settings
- privacy settings
- notification settings
- appearance settings
- bookmarks
- watched threads
- reactions
- followers
- following
- messages
- drafts
- reports
- account security
- sessions
- attachments

## Admin Pages

- dashboard
- analytics
- users
- reports
- moderation
- security logs
- themes
- settings
- notifications
- emails
- forums
- badges
- roles
- permissions
- spam filter
- API monitoring

---

# ANALYTICS

## Track

- views
- unique visitors
- thread engagement
- reactions
- active users
- top threads
- search analytics
- spam analytics
- moderation analytics

---

# ACCESSIBILITY

Implement:

- keyboard navigation
- aria labels
- semantic HTML
- accessible contrast
- focus states
- screen reader support

---

# DEPLOYMENT

Deployable without Docker.

Support:

- VPS
- Nginx reverse proxy
- PM2
- Node clustering
- SSL
- CDN
- Redis
- MySQL

---

# FINAL REQUIREMENTS

- Production-ready code only
- No placeholder code
- No mock security
- No fake validation
- No unfinished pages
- No missing endpoints
- No missing moderation flows
- No insecure APIs
- No public sensitive data
- No performance shortcuts

Everything must be:

- secure
- scalable
- maintainable
- modular
- typed
- optimized
- responsive
- SEO-friendly
- accessible

This platform should feel like a modern enterprise-grade community/forum system built for millions of users.

