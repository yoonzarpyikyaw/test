export interface DisplayMovie {
  id: string;
  title: string;
  year: string;
  genre: string;
  poster: string;
  backdrop?: string;
  tgLink: string;
  type: 'movie' | 'series';
  quality?: string;
  rating?: string;
  duration?: string;
  episode?: string;
  synopsis?: string;
}

export function parseGoogleSheetCsvToDisplayMovies(csvText: string): DisplayMovie[] {
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
          i++;
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
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }

  if (rows.length <= 1) return [];

  const headerRow = rows[0].map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
  const colIndex = {
    id: headerRow.findIndex((h) => h === 'id' || h === 'movieid'),
    title: headerRow.findIndex((h) => h === 'title' || h === 'name'),
    year: headerRow.findIndex((h) => h === 'year'),
    genre: headerRow.findIndex((h) => h === 'genre' || h === 'genres'),
    poster: headerRow.findIndex((h) => h === 'poster' || h === 'posterurl' || h === 'image'),
    backdrop: headerRow.findIndex((h) => h === 'backdrop' || h === 'backdropurl' || h === 'banner'),
    tgLink: headerRow.findIndex((h) => h === 'tglink' || h === 'telegram' || h === 'link'),
    type: headerRow.findIndex((h) => h === 'type'),
    episode: headerRow.findIndex((h) => h === 'episode' || h === 'ep' || h === 'eps'),
    quality: headerRow.findIndex((h) => h === 'quality'),
    rating: headerRow.findIndex((h) => h === 'rating' || h === 'imdb'),
    synopsis: headerRow.findIndex((h) => h === 'synopsis' || h === 'overview' || h === 'desc'),
  };

  const results: DisplayMovie[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const getVal = (idx: number): string => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

    const title = getVal(colIndex.title);
    if (!title) continue;

    const rawId = getVal(colIndex.id);
    const year = getVal(colIndex.year) || '2026';
    const genre = getVal(colIndex.genre) || 'Action';
    const poster = getVal(colIndex.poster) || 'https://image.tmdb.org/t/p/w500/v3QOQU2HG0v61BMRDnc3Y16tC6K.jpg';
    const backdrop = getVal(colIndex.backdrop) || undefined;
    const tgLink = getVal(colIndex.tgLink) || 'https://t.me/addlist/58gZNGQ86uJiOWE9';
    const rawType = getVal(colIndex.type).toLowerCase();
    const episode = getVal(colIndex.episode) || undefined;
    const quality = getVal(colIndex.quality) || 'HD';
    const rating = getVal(colIndex.rating) || undefined;
    const synopsis = getVal(colIndex.synopsis) || undefined;

    const isSeries = rawType.includes('series') || Boolean(episode);

    results.push({
      id: rawId || `m-${r}`,
      title,
      year,
      genre,
      poster,
      backdrop,
      tgLink,
      type: isSeries ? 'series' : 'movie',
      episode,
      quality,
      rating,
      synopsis,
    });
  }

  return results;
}

export const NEXT_HERO_MOVIE: DisplayMovie = {
  id: 'moana-2016',
  title: 'Moana',
  year: '2016',
  genre: 'Animation, Adventure, Family',
  poster: 'https://image.tmdb.org/t/p/w500/v3QOQU2HG0v61BMRDnc3Y16tC6K.jpg',
  backdrop: 'https://image.tmdb.org/t/p/original/6t8g20vXfJpI35bS8N2iB41l4yY.jpg',
  tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9',
  type: 'movie',
  quality: 'HD',
  duration: '1h 47m',
  synopsis: 'Moana, a spirited teenager, sets sail on a daring journey to save her people and discover her true identity.',
};

export const NEXT_SUGGESTIONS: DisplayMovie[] = [
  { id: 'aliens-covenant', title: 'Aliens Covenant', year: '2017', genre: 'Sci-Fi, Horror', poster: 'https://image.tmdb.org/t/p/w500/zecMELPbU5YMQpC81Z8aqXwEz2n.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'rough-night', title: 'Rough Night', year: '2017', genre: 'Comedy', poster: 'https://image.tmdb.org/t/p/w500/snQz40w7tU6iY7ZzY1Y3c6f9C0G.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'HD' },
  { id: 'the-fate-of-the-furious', title: 'The Fate of the Furious', year: '2017', genre: 'Action, Crime', poster: 'https://image.tmdb.org/t/p/w500/dImWM7Agxk9yc9Pr8KVezwtv04Q.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'baywatch', title: 'Baywatch', year: '2017', genre: 'Action, Comedy', poster: 'https://image.tmdb.org/t/p/w500/6HE4Vo0L0qL0E9A8k27s45oB9aD.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'HD' },
  { id: 'fight', title: 'Fight', year: '2017', genre: 'Action, Drama', poster: 'https://image.tmdb.org/t/p/w500/8kOWDBK2XlPUzbmvGOCeoQszmuH.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'king-arthur', title: 'King Arthur: Legend...', year: '2017', genre: 'Action, Fantasy', poster: 'https://image.tmdb.org/t/p/w500/9k2hHwBw7z284gA8W3Y6D2C9v0F.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'war-machine', title: 'War Machine', year: '2017', genre: 'Comedy, War', poster: 'https://image.tmdb.org/t/p/w500/bocU1Yy3p34Z2z2X5YQ3F8W9v8D.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'song-to-song', title: 'Song to Song', year: '2017', genre: 'Drama, Music', poster: 'https://image.tmdb.org/t/p/w500/gWv0c4g7A9i8w6F8q6H9X2K5f0L.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'game-of-thrones', title: 'Game of Thrones', year: '2019', genre: 'Action, Fantasy', poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
  { id: 'wynonna-earp', title: 'Wynonna Earp', year: '2021', genre: 'Action, Fantasy', poster: 'https://image.tmdb.org/t/p/w500/7aT9Qc5uJ3K8m5o9eY2Y6g4r7G2.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
  { id: 'dark-matter', title: 'Dark Matter', year: '2017', genre: 'Sci-Fi, Drama', poster: 'https://image.tmdb.org/t/p/w500/4c3g6Y9F8k2B8w6F0L4p2H1u5J7.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
  { id: 'house-of-cards', title: 'House of Cards', year: '2018', genre: 'Drama', poster: 'https://image.tmdb.org/t/p/w500/hKWxWjFJWaqM8kSZgLn95955k3m.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
  { id: 'lucifer', title: 'Lucifer', year: '2021', genre: 'Crime, Fantasy', poster: 'https://image.tmdb.org/t/p/w500/ekZobS2isE6mA53RAiGDG93hBxL.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
  { id: 'orange-is-the-new-black', title: 'Orange is the New Black', year: '2019', genre: 'Comedy, Crime', poster: 'https://image.tmdb.org/t/p/w500/ekaa7B6B08wX8B3G1A4w7Y0U5D6.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
  { id: 'prison-break', title: 'Prison Break', year: '2017', genre: 'Action, Crime', poster: 'https://image.tmdb.org/t/p/w500/5E1TGiqh5hJc0eJ5G3xX9P7p4e0.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
  { id: 'the-walking-dead', title: 'The Walking Dead', year: '2022', genre: 'Action, Horror', poster: 'https://image.tmdb.org/t/p/w500/xf9wuDcqlUPWABZNeDKPbZUj0Yw.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD' },
];

export const NEXT_LATEST_MOVIES: DisplayMovie[] = [
  { id: 'transformers-last-knight', title: 'Transformers: The Last...', year: '2017', genre: 'Action, Sci-Fi', poster: 'https://image.tmdb.org/t/p/w500/s5HQf27up48aGLw3LJ04wB5w9v9.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'CAM' },
  { id: 'despicable-me-3', title: 'Despicable Me 3', year: '2017', genre: 'Animation, Comedy', poster: 'https://image.tmdb.org/t/p/w500/6t3YWl7hrVeTGur0r0AhGgVsUhv.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'CAM' },
  { id: 'captain-underpants', title: 'Captain Underpants', year: '2017', genre: 'Animation, Comedy', poster: 'https://image.tmdb.org/t/p/w500/5k7mZlT1aY2X3a4k9A5w6Y8q1V2.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'CAM' },
  { id: 'cars-3', title: 'Cars 3', year: '2017', genre: 'Animation, Adventure', poster: 'https://image.tmdb.org/t/p/w500/f8MmO1vgGTzg72DbgMv7q0iH5qZ.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'TS' },
  { id: 'all-eyez-on-me', title: 'All Eyez on Me', year: '2017', genre: 'Biography, Drama', poster: 'https://image.tmdb.org/t/p/w500/m9f0F6j6j6k8w9x2e1a3b4c5d6e.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'TS' },
  { id: 'everything-everything', title: 'Everything, Everything', year: '2017', genre: 'Drama, Romance', poster: 'https://image.tmdb.org/t/p/w500/1XGskWq9rG0G0p4x3X2b5v8K9p0.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'CAM' },
  { id: 'rough-night-ts', title: 'Rough Night', year: '2017', genre: 'Comedy', poster: 'https://image.tmdb.org/t/p/w500/snQz40w7tU6iY7ZzY1Y3c6f9C0G.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'TS' },
  { id: 'search-destroy', title: 'Search/Destroy: A SF', year: '2017', genre: 'Sci-Fi, Action', poster: 'https://image.tmdb.org/t/p/w500/9k2hHwBw7z284gA8W3Y6D2C9v0F.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'genesis', title: 'Genesis', year: '2017', genre: 'Sci-Fi', poster: 'https://image.tmdb.org/t/p/w500/zecMELPbU5YMQpC81Z8aqXwEz2n.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'stefan-zweig', title: 'Stefan Zweig: Farewell...', year: '2016', genre: 'Biography, Drama', poster: 'https://image.tmdb.org/t/p/w500/gWv0c4g7A9i8w6F8q6H9X2K5f0L.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'anakara-of-anam', title: 'Anakara of Anam', year: '2017', genre: 'Horror', poster: 'https://image.tmdb.org/t/p/w500/bocU1Yy3p34Z2z2X5YQ3F8W9v8D.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'kong-skull-island', title: 'Kong: Skull Island', year: '2017', genre: 'Action, Adventure', poster: 'https://image.tmdb.org/t/p/w500/r2517Vz9EhBdpVOEZHiY46BmQ7n.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'TS' },
  { id: 'you-get-me', title: 'You Get Me', year: '2017', genre: 'Thriller', poster: 'https://image.tmdb.org/t/p/w500/6HE4Vo0L0qL0E9A8k27s45oB9aD.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'saddies-last-day', title: "Saddie's Last Day...", year: '2017', genre: 'Comedy', poster: 'https://image.tmdb.org/t/p/w500/dImWM7Agxk9yc9Pr8KVezwtv04Q.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'hindi-medium', title: 'Hindi Medium', year: '2017', genre: 'Comedy, Drama', poster: 'https://image.tmdb.org/t/p/w500/8kOWDBK2XlPUzbmvGOCeoQszmuH.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
  { id: 'fight-movie', title: 'Fight', year: '2017', genre: 'Action', poster: 'https://image.tmdb.org/t/p/w500/8kOWDBK2XlPUzbmvGOCeoQszmuH.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'movie', quality: 'DVD' },
];

export const NEXT_LATEST_SERIES: DisplayMovie[] = [
  { id: 'playing-house', title: 'Playing House', year: '2017', genre: 'Comedy', poster: 'https://image.tmdb.org/t/p/w500/7aT9Qc5uJ3K8m5o9eY2Y6g4r7G2.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 2' },
  { id: '48-hours-mystery', title: '48 Hours Mystery', year: '2023', genre: 'Documentary', poster: 'https://image.tmdb.org/t/p/w500/hKWxWjFJWaqM8kSZgLn95955k3m.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 3' },
  { id: 'real-time-with-bill', title: 'Real Time with Bill', year: '2023', genre: 'Comedy, Talk-Show', poster: 'https://image.tmdb.org/t/p/w500/ekZobS2isE6mA53RAiGDG93hBxL.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 14' },
  { id: 'wynonna-earp-s2', title: 'Wynonna Earp', year: '2018', genre: 'Action, Fantasy', poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 58' },
  { id: 'the-originals', title: 'The Originals', year: '2018', genre: 'Fantasy, Horror', poster: 'https://image.tmdb.org/t/p/w500/5E1TGiqh5hJc0eJ5G3xX9P7p4e0.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 68' },
  { id: 'love-island', title: 'Love Island', year: '2023', genre: 'Reality-TV', poster: 'https://image.tmdb.org/t/p/w500/ekaa7B6B08wX8B3G1A4w7Y0U5D6.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 94' },
  { id: 'rupauls-drag-race', title: "RuPaul's Drag Race", year: '2023', genre: 'Reality-TV', poster: 'https://image.tmdb.org/t/p/w500/xf9wuDcqlUPWABZNeDKPbZUj0Yw.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 14' },
  { id: 'vice', title: 'VICE', year: '2019', genre: 'Documentary', poster: 'https://image.tmdb.org/t/p/w500/s5HQf27up48aGLw3LJ04wB5w9v9.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 73' },
  { id: 'dark-matter-s3', title: 'Dark Matter', year: '2017', genre: 'Sci-Fi', poster: 'https://image.tmdb.org/t/p/w500/4c3g6Y9F8k2B8w6F0L4p2H1u5J7.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 30' },
  { id: 'the-mist', title: 'The Mist', year: '2017', genre: 'Drama, Horror', poster: 'https://image.tmdb.org/t/p/w500/snQz40w7tU6iY7ZzY1Y3c6f9C0G.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 3' },
  { id: 'glow', title: 'GLOW', year: '2019', genre: 'Comedy', poster: 'https://image.tmdb.org/t/p/w500/dImWM7Agxk9yc9Pr8KVezwtv04Q.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 10' },
  { id: 'one', title: 'O N E', year: '2020', genre: 'Crime, Mystery', poster: 'https://image.tmdb.org/t/p/w500/6t3YWl7hrVeTGur0r0AhGgVsUhv.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 38' },
  { id: 'growing-up-hip-hop', title: 'Growing Up Hip Hop', year: '2021', genre: 'Reality-TV', poster: 'https://image.tmdb.org/t/p/w500/bocU1Yy3p34Z2z2X5YQ3F8W9v8D.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 33' },
  { id: 'married-at-first-sight-10', title: 'Married at First Sig...', year: '2022', genre: 'Reality-TV', poster: 'https://image.tmdb.org/t/p/w500/8kOWDBK2XlPUzbmvGOCeoQszmuH.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 10' },
  { id: 'married-at-first-sight-9', title: 'Married at First Sig...', year: '2021', genre: 'Reality-TV', poster: 'https://image.tmdb.org/t/p/w500/gWv0c4g7A9i8w6F8q6H9X2K5f0L.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 9' },
  { id: 'mysteries-at-the-museum', title: 'Mysteries at the Musu...', year: '2020', genre: 'Adventure', poster: 'https://image.tmdb.org/t/p/w500/r2517Vz9EhBdpVOEZHiY46BmQ7n.jpg', tgLink: 'https://t.me/addlist/58gZNGQ86uJiOWE9', type: 'series', quality: 'HD', episode: 'EPS 6' },
];
