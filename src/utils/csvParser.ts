import type { Movie } from '../types';

export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVSH71Wsy2hyuWwPjsOvDsxZTtdU5x9qGKcDmICqaK4TyjgxJIA6c9bf9-WGhlkifD9xm3E9lYEz9q/pub?output=csv';

/**
 * Normalizes Google Sheets URLs into CSV export / publish endpoints.
 * Handles:
 * - https://docs.google.com/spreadsheets/d/{id}/edit#gid=0 -> /export?format=csv&gid=0
 * - https://docs.google.com/spreadsheets/d/e/{id}/pubhtml -> /pub?output=csv
 * - https://docs.google.com/spreadsheets/d/e/{id}/pub -> /pub?output=csv
 * - Trims whitespace and removes enclosing quotes
 */
export function normalizeGoogleSheetUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SHEET_URL;
  const trimmed = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return DEFAULT_SHEET_URL;

  // If already ends with output=csv or format=csv, return as is
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv')) {
    return trimmed;
  }

  // Handle standard edit/view link: /spreadsheets/d/{SHEET_ID}/...
  const matchDoc = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matchDoc && !trimmed.includes('/d/e/')) {
    const sheetId = matchDoc[1];
    const gidMatch = trimmed.match(/[?&#]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  // Handle published web link: /spreadsheets/d/e/{PUB_ID}/...
  if (trimmed.includes('/d/e/')) {
    if (trimmed.includes('/pubhtml')) {
      return trimmed.replace('/pubhtml', '/pub?output=csv');
    }
    const cleanBase = trimmed.split('?')[0];
    const query = trimmed.includes('?') ? trimmed.slice(trimmed.indexOf('?') + 1) : '';
    const params = new URLSearchParams(query);
    params.set('output', 'csv');
    return `${cleanBase}?${params.toString()}`;
  }

  return trimmed;
}

/**
 * Generate a URL-safe stable slug from title and year
 */
export function slugifyTitle(title: string, year?: string): string {
  const cleanTitle = (title || 'movie')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanYear = (year || '').trim().replace(/[^\d]/g, '');
  return cleanYear ? `${cleanTitle}-${cleanYear}` : cleanTitle;
}

/**
 * Safely validate URLs (disallows javascript: etc.)
 */
export function sanitizeUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

/**
 * Robust CSV parser that handles:
 * - Multi-line cell text (such as Burmese synopsis with line breaks)
 * - Escaped double quotes ("")
 * - Commas inside quoted strings
 * - Header-based column mapping (independent of column order)
 * - Storing real ratings without fake metadata generation
 * - Generating stable unique IDs
 */
export function parseGoogleSheetCSV(csvText: string): Movie[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length <= 1) return [];

  // Parse header row to find column positions dynamically via header names
  const rawHeaders = rows[0];
  const normalizedHeaders = rawHeaders.map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
  );

  const findCol = (keys: string[]): number => {
    return normalizedHeaders.findIndex((h) =>
      keys.some((k) => h === k || h.includes(k))
    );
  };

  const idIdx = findCol(['id', 'movieid', 'slug']);
  const titleIdx = findCol(['title', 'movietitle', 'name']);
  const origTitleIdx = findCol(['originaltitle', 'orgtitle']);
  const yearIdx = findCol(['year', 'releaseyear', 'date']);
  const genreIdx = findCol(['genre', 'genres']);
  const posterIdx = findCol(['poster', 'posterurl', 'image', 'img', 'thumbnail']);
  const backdropIdx = findCol(['backdrop', 'backdropurl', 'banner', 'cover', 'heroimage']);
  const tgLinkIdx = findCol(['tglink', 'telegram', 'telegramurl', 'link', 'url', 'watchlink']);
  const categoryIdx = findCol(['category', 'cat']);
  const typeIdx = findCol(['type', 'contenttype', 'format']);
  const pinIdx = findCol(['pin', 'pinned', 'spotlight', 'featured']);
  const trendingIdx = findCol(['trending', 'trend', 'istrending']);
  const synopsisIdx = findCol(['synopsis', 'desc', 'description', 'detail', 'story', 'storyline']);
  const ratingIdx = findCol(['rating', 'imdb', 'imdbrating', 'score']);
  const qualityIdx = findCol(['quality', 'resolution']);
  const languageIdx = findCol(['language', 'audio', 'sub', 'subtitle', 'subtitles']);
  const durationIdx = findCol(['duration', 'runtime', 'length']);
  const ageRatingIdx = findCol(['agerating', 'age', 'rated', 'certificate']);
  const statusIdx = findCol(['status', 'state']);

  const cleanField = (row: string[], idx: number) => {
    if (idx < 0 || idx >= row.length) return '';
    const val = row[idx];
    if (!val) return '';
    return val.replace(/^"|"$/g, '').trim();
  };

  const movies: Movie[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawTitle = cleanField(row, titleIdx !== -1 ? titleIdx : 0);
    const rawPoster = cleanField(row, posterIdx !== -1 ? posterIdx : 3);

    // Skip empty records
    if (!rawTitle && !rawPoster) continue;

    const rawId = cleanField(row, idIdx);
    const rawYear = cleanField(row, yearIdx !== -1 ? yearIdx : 1) || '2026';
    const originalTitle = cleanField(row, origTitleIdx);
    const genre = cleanField(row, genreIdx !== -1 ? genreIdx : 2) || '';
    const backdrop = sanitizeUrl(cleanField(row, backdropIdx));
    const poster = sanitizeUrl(rawPoster) || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400';
    const tgLink = sanitizeUrl(cleanField(row, tgLinkIdx !== -1 ? tgLinkIdx : 4)) || 'https://t.me/addlist/58gZNGQ86uJiOWE9';
    const category = cleanField(row, categoryIdx !== -1 ? categoryIdx : 5) || 'Discover';
    const rawType = cleanField(row, typeIdx !== -1 ? typeIdx : 6);
    const pin = cleanField(row, pinIdx !== -1 ? pinIdx : 7);
    const trendingVal = cleanField(row, trendingIdx);
    const synopsis = cleanField(row, synopsisIdx !== -1 ? synopsisIdx : 8) || '';
    const rating = cleanField(row, ratingIdx); // Real rating ONLY if in sheet!
    const quality = cleanField(row, qualityIdx);
    const language = cleanField(row, languageIdx);
    const duration = cleanField(row, durationIdx);
    const ageRating = cleanField(row, ageRatingIdx);
    const status = cleanField(row, statusIdx);

    // Check status: ignore inactive records
    if (status && (status.toLowerCase() === 'inactive' || status.toLowerCase() === 'hidden')) {
      continue;
    }

    // Determine type
    const isSeries =
      rawType.toLowerCase().includes('series') ||
      category.toLowerCase().includes('series') ||
      genre.toLowerCase().includes('series');
    const finalType = isSeries ? 'series' : 'movie';

    // Generate stable unique ID
    let stableId = rawId ? slugifyTitle(rawId) : slugifyTitle(rawTitle, rawYear);
    if (!stableId) stableId = `item-${i}`;
    
    // Ensure uniqueness within dataset
    if (seenIds.has(stableId)) {
      let counter = 2;
      while (seenIds.has(`${stableId}-${counter}`)) {
        counter++;
      }
      stableId = `${stableId}-${counter}`;
    }
    seenIds.add(stableId);

    movies.push({
      id: stableId,
      title: rawTitle,
      originalTitle: originalTitle || undefined,
      year: rawYear,
      genre,
      poster,
      backdrop: backdrop || undefined,
      tgLink,
      category,
      type: finalType,
      pin: pin || undefined,
      trending: trendingVal || undefined,
      synopsis,
      rating: rating || undefined, // Real value only!
      quality: quality || undefined,
      language: language || undefined,
      duration: duration || undefined,
      ageRating: ageRating || undefined,
      status: status || 'active',
    });
  }

  // Reverse so newest entries (added at the bottom of the Google Sheet) appear first!
  return movies.reverse();
}
