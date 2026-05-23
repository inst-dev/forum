import { prisma } from '@nullforum/database';
import { cache } from './redis';

const CACHE_KEY = 'badwords:all';
const CACHE_TTL = 3600;

interface BadWordEntry {
  word: string;
  replacement: string | null;
  isRegex: boolean;
  severity: number;
}

export async function getBadWords(): Promise<BadWordEntry[]> {
  // Check if bad word filter is enabled
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'badword_filter_enabled' } });
  if (setting && setting.value === 'false') return [];

  const cached = await cache.get<BadWordEntry[]>(CACHE_KEY);
  if (cached) return cached;

  const words = await prisma.badWord.findMany({
    where: { isActive: true },
    select: { word: true, replacement: true, isRegex: true, severity: true },
  });

  await cache.set(CACHE_KEY, words, CACHE_TTL);
  return words;
}

export async function filterContent(text: string): Promise<{ filtered: string; flagged: boolean; score: number }> {
  const badWords = await getBadWords();
  let filtered = text;
  let flagged = false;
  let score = 0;

  for (const entry of badWords) {
    let regex: RegExp;
    
    if (entry.isRegex) {
      try {
        regex = new RegExp(entry.word, 'gi');
      } catch {
        continue;
      }
    } else {
      // Handle character substitutions (l33t speak)
      const escaped = entry.word
        .split('')
        .map(c => {
          const subs: Record<string, string> = {
            'a': '[a@4]', 'e': '[e3]', 'i': '[i1!]', 'o': '[o0]',
            's': '[s$5]', 't': '[t7]', 'l': '[l1]', 'b': '[b8]',
          };
          return subs[c.toLowerCase()] || c;
        })
        .join('+');
      
      regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    }

    if (regex.test(filtered)) {
      flagged = true;
      score += entry.severity;
      
      const replacement = entry.replacement || maskWord(entry.word);
      filtered = filtered.replace(regex, replacement);
    }
  }

  // Detect repeated characters (like "shiiiit")
  if (detectBypass(text)) {
    score += 2;
  }

  return { filtered, flagged, score };
}

function maskWord(word: string): string {
  if (word.length <= 2) return '*'.repeat(word.length);
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

function detectBypass(text: string): boolean {
  // Detect repeated characters (like "fuuuck")
  if (/(.)\1{3,}/gi.test(text)) return true;
  
  // Detect spaces between letters (like "f u c k")
  if (/\b\w(\s\w){3,}\b/g.test(text)) return true;
  
  // Detect zero-width characters
  if (/[\u200B\u200C\u200D\uFEFF]/g.test(text)) return true;
  
  return false;
}

export async function calculateSpamScore(content: string, userId: string): Promise<number> {
  let score = 0;

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 10) score += 3;

  // Check for excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 5) score += 4;

  // Check for repeated content
  if (detectBypass(content)) score += 2;

  // Check recent post frequency
  const recentPosts = await cache.get<number>(`spam:posts:${userId}`);
  if (recentPosts && recentPosts > 10) score += 5;

  return score;
}
