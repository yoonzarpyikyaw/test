/**
 * ====================================================================
 * COMPLETE GOOGLE APPS SCRIPT: TMDB AUTO-FETCH & SUPABASE SYNC
 * ====================================================================
 * Free-First Architecture ($0/month):
 * - Auto-enriches movies using official TMDB v3 REST API
 * - Syncs validated rows to Supabase PostgreSQL using REST API (Upsert)
 * - Safe: Credentials stored in Script Properties, NEVER exposed to client
 */

// 1. CONFIGURATION (ဤနေရာတွင် တိုက်ရိုက်ထည့်နိုင်သလို Script Properties မှလည်း ထည့်နိုင်ပါသည်)
function getConfigs() {
  const props = PropertiesService.getScriptProperties();

  // 👇 မိမိ၏ Key များကို အောက်ပါ မျက်တောင်အဖွင့်အပိတ် '...' ကြားထဲတွင် တိုက်ရိုက် အစားထိုးထည့်သွင်းနိုင်ပါသည် 👇
  const DIRECT_TMDB_KEY = '';          // ဥပမာ: 'a1b2c3d4e5...'
  const DIRECT_SUPABASE_URL = '';       // ဥပမာ: 'https://xyzcompany.supabase.co'
  const DIRECT_SUPABASE_KEY = '';       // ဥပမာ: 'eyJhbGciOiJIUzI1Ni...' (service_role secret key)

  const tmdbKey = DIRECT_TMDB_KEY || props.getProperty('TMDB_API_KEY');
  const supabaseUrl = DIRECT_SUPABASE_URL || props.getProperty('SUPABASE_URL');
  const supabaseKey = DIRECT_SUPABASE_KEY || props.getProperty('SUPABASE_SERVICE_KEY');

  if (!tmdbKey) {
    throw new Error('TMDB_API_KEY မထည့်ရသေးပါ။ Line 17 တွင် တိုက်ရိုက်ထည့်ပါ သို့မဟုတ် Script Properties တွင် သတ်မှတ်ပါ။');
  }
  return {
    TMDB_API_KEY: tmdbKey,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_KEY: supabaseKey
  };
}

// 2. SPREADSHEET CUSTOM MENU
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎬 Movie Tools')
    .addItem('🔍 Fetch TMDB for New Movies', 'enrichNewMovies')
    .addItem('🎯 Fetch TMDB for Selected Row', 'enrichSelectedRow')
    .addSeparator()
    .addItem('⚡ Sync to Supabase PostgreSQL', 'syncToSupabase')
    .addItem('📊 Check Sync Status', 'checkStatusSummary')
    .addToUi();
}

// 3. SLUG GENERATOR
function generateSlug(title, year) {
  if (!title) return '';
  const clean = title.toString().toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return year ? `${clean}-${year}` : clean;
}

// 4. TMDB SEARCH & DETAIL ENRICHMENT (SMART MOVIE & TV SERIES AUTO-DETECTION)
function cleanSearchTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle.toString()
    .replace(/\s*\(\s*\d{4}\s*\)\s*/g, ' ')       // Remove (2018)
    .replace(/\b(season\s*\d+|s\d+|ep\s*\d+.*)\b/gi, ' ') // Remove Season 1, S1, etc.
    .replace(/\b(complete|bluray|web-dl|hdrip|dvdrip|cam)\b/gi, ' ')
    .replace(/[\u1000-\u109F\uAA60-\uAA7F]+/g, ' ') // Remove Burmese notes if pasted in title
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitleForCompare(str) {
  if (!str) return '';
  return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fetchTMDBMetadata(title, year, type, manualTmdbId) {
  const config = getConfigs();
  const rawType = (type || '').toString().toLowerCase();
  const targetYear = year ? parseInt(year, 10) : null;
  const cleanedTitle = cleanSearchTitle(title) || title;
  const normCleanTitle = normalizeTitleForCompare(cleanedTitle);

  // If manual TMDB ID is provided, fetch directly
  if (manualTmdbId && manualTmdbId.toString().trim() !== '') {
    const directId = manualTmdbId.toString().trim();
    const isDirectTv = rawType.includes('series') || rawType.includes('tv');
    const directEndpoints = isDirectTv ? ['tv', 'movie'] : ['movie', 'tv'];

    for (const ep of directEndpoints) {
      const url = `https://api.themoviedb.org/3/${ep}/${directId}?api_key=${config.TMDB_API_KEY}&language=en-US&append_to_response=${ep === 'tv' ? 'content_ratings' : 'release_dates'}`;
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const json = JSON.parse(res.getContentText());
        return formatTMDBResponse(json, ep === 'tv');
      }
    }
  }

  // Determine search order:
  // If explicitly 'series' or 'tv', prioritize TV first. Otherwise try Movie first, but auto-fallback to TV!
  const endpointsToTry = [];
  if (rawType.includes('series') || rawType.includes('tv')) {
    endpointsToTry.push({ ep: 'search/tv', isSeries: true });
    endpointsToTry.push({ ep: 'search/movie', isSeries: false });
  } else {
    // Try movie first, and if not found or mismatch, try TV series!
    endpointsToTry.push({ ep: 'search/movie', isSeries: false });
    endpointsToTry.push({ ep: 'search/tv', isSeries: true });
  }

  let lastError = 'TMDB_NOT_FOUND';

  for (const { ep, isSeries } of endpointsToTry) {
    let searchUrl = `https://api.themoviedb.org/3/${ep}?api_key=${config.TMDB_API_KEY}&query=${encodeURIComponent(cleanedTitle)}&language=en-US&page=1`;
    if (targetYear) {
      searchUrl += isSeries ? `&first_air_date_year=${targetYear}` : `&primary_release_year=${targetYear}`;
    }

    let searchRes = UrlFetchApp.fetch(searchUrl, { muteHttpExceptions: true });
    let results = [];

    if (searchRes.getResponseCode() === 200) {
      results = JSON.parse(searchRes.getContentText()).results || [];
    }

    // Fallback search without year restriction if 0 results
    if (results.length === 0) {
      const broadUrl = `https://api.themoviedb.org/3/${ep}?api_key=${config.TMDB_API_KEY}&query=${encodeURIComponent(cleanedTitle)}&language=en-US&page=1`;
      const broadRes = UrlFetchApp.fetch(broadUrl, { muteHttpExceptions: true });
      if (broadRes.getResponseCode() === 200) {
        results = JSON.parse(broadRes.getContentText()).results || [];
      }
    }

    if (results.length === 0) {
      continue;
    }

    // Match candidate selection:
    let bestMatch = null;

    // Strategy 1: Exact title match (highest priority regardless of 1-2 year difference)
    for (const item of results) {
      const itemTitle = item.title || item.name || '';
      const origTitle = item.original_title || item.original_name || '';
      const relDate = item.release_date || item.first_air_date || '';
      const itemYear = relDate ? parseInt(relDate.substring(0, 4), 10) : null;

      const normItemTitle = normalizeTitleForCompare(itemTitle);
      const normOrigTitle = normalizeTitleForCompare(origTitle);

      const isTitleExact = (normItemTitle === normCleanTitle) || (normOrigTitle === normCleanTitle);

      if (isTitleExact) {
        if (!targetYear || (itemYear && Math.abs(itemYear - targetYear) <= 2) || !itemYear) {
          bestMatch = item;
          break;
        }
      }
    }

    // Strategy 2: Exact year match
    if (!bestMatch && targetYear) {
      for (const item of results) {
        const relDate = item.release_date || item.first_air_date || '';
        const itemYear = relDate ? parseInt(relDate.substring(0, 4), 10) : null;
        if (itemYear === targetYear) {
          bestMatch = item;
          break;
        }
      }
    }

    // Strategy 3: Close year (+- 1 to 2 years) or first popular result
    if (!bestMatch && results.length > 0) {
      const first = results[0];
      const relDate = first.release_date || first.first_air_date || '';
      const firstYear = relDate ? parseInt(relDate.substring(0, 4), 10) : null;

      if (!targetYear) {
        bestMatch = first;
      } else if (firstYear && Math.abs(firstYear - targetYear) <= 2) {
        bestMatch = first;
      }
    }

    if (!bestMatch) {
      lastError = 'NEEDS_REVIEW: Year mismatch';
      continue;
    }

    // Fetch Full Details + Ratings
    const detailEndpoint = isSeries ? `tv/${bestMatch.id}` : `movie/${bestMatch.id}`;
    const detailUrl = `https://api.themoviedb.org/3/${detailEndpoint}?api_key=${config.TMDB_API_KEY}&language=en-US&append_to_response=${isSeries ? 'content_ratings' : 'release_dates'}`;

    const detailRes = UrlFetchApp.fetch(detailUrl, { muteHttpExceptions: true });
    if (detailRes.getResponseCode() !== 200) {
      return { success: false, error: 'TMDB_DETAIL_ERROR: HTTP ' + detailRes.getResponseCode() };
    }

    const detailJson = JSON.parse(detailRes.getContentText());
    const formatted = formatTMDBResponse(detailJson, isSeries);
    formatted.detectedType = isSeries ? 'series' : 'movie';
    return formatted;
  }

  return { success: false, error: lastError };
}

function formatTMDBResponse(detailJson, isSeries) {
  const posterPath = detailJson.poster_path;
  const backdropPath = detailJson.backdrop_path;
  const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '';
  const backdropUrl = backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : (posterUrl || '');

  const genresList = (detailJson.genres || []).map(g => g.name);

  let runtime = 0;
  if (!isSeries) {
    runtime = detailJson.runtime || 0;
  } else if (detailJson.episode_run_time && detailJson.episode_run_time.length > 0) {
    runtime = detailJson.episode_run_time[0];
  }

  let ageRating = isSeries ? 'TV-14' : 'PG-13';
  if (!isSeries && detailJson.release_dates && detailJson.release_dates.results) {
    const usRel = detailJson.release_dates.results.find(r => r.iso_3166_1 === 'US') || detailJson.release_dates.results[0];
    if (usRel && usRel.release_dates) {
      const rated = usRel.release_dates.find(d => d.certification && d.certification.trim() !== '');
      if (rated) ageRating = rated.certification;
    }
  } else if (isSeries && detailJson.content_ratings && detailJson.content_ratings.results) {
    const usCert = detailJson.content_ratings.results.find(r => r.iso_3166_1 === 'US') || detailJson.content_ratings.results[0];
    if (usCert && usCert.rating) {
      ageRating = usCert.rating;
    }
  }

  const origLang = detailJson.original_language ? detailJson.original_language.toUpperCase() : 'EN';

  return {
    success: true,
    tmdb_id: detailJson.id,
    original_title: detailJson.original_title || detailJson.original_name || detailJson.title || detailJson.name,
    overview: detailJson.overview || '',
    poster_url: posterUrl,
    backdrop_url: backdropUrl,
    rating: detailJson.vote_average ? Number(detailJson.vote_average.toFixed(1)) : 0.0,
    genres: genresList.join(', '),
    duration: runtime,
    release_date: detailJson.release_date || detailJson.first_air_date || '',
    original_language: origLang,
    age_rating: ageRating,
    detectedType: isSeries ? 'series' : 'movie'
  };
}

// 5. ENRICH NEW MOVIES IN SHEET
function enrichNewMovies() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('movies') || SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  let enrichedCount = 0;
  let errorCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 1;
    const title = row[1]; // Col B
    const year = row[2];  // Col C
    const type = (row[4] || '').toString().toLowerCase(); // Col E
    const existingTmdbId = row[12]; // Col M (tmdb_id)
    const existingTitleFilled = row[13]; // Col N (original_title)

    // Process if title exists AND (TMDB data not filled yet OR had previous error)
    if (title && (!existingTitleFilled || existingTitleFilled === '' || row[26] === 'ERROR')) {
      if (!row[0] || row[0] === '') {
        sheet.getRange(rowNum, 1).setValue(generateSlug(title, year));
      }

      const res = fetchTMDBMetadata(title, year, type, existingTmdbId);
      const nowStr = new Date().toISOString();

      if (res.success) {
        // Auto-fill Type (Movie or Series) if blank in Sheet
        if ((!row[4] || row[4] === '') && res.detectedType) {
          sheet.getRange(rowNum, 5).setValue(res.detectedType);    // E: type
        }

        sheet.getRange(rowNum, 12).setValue('active');             // L: status (Must be 'active' for Supabase schema)
        sheet.getRange(rowNum, 13).setValue(res.tmdb_id);          // M: tmdb_id
        sheet.getRange(rowNum, 14).setValue(res.original_title);    // N: original_title
        sheet.getRange(rowNum, 15).setValue(res.overview);          // O: overview
        sheet.getRange(rowNum, 16).setValue(res.poster_url);        // P: poster_url
        sheet.getRange(rowNum, 17).setValue(res.backdrop_url);      // Q: backdrop_url
        sheet.getRange(rowNum, 18).setValue(res.rating);            // R: rating
        sheet.getRange(rowNum, 19).setValue(res.genres);            // S: genre
        sheet.getRange(rowNum, 20).setValue(res.duration);          // T: duration
        sheet.getRange(rowNum, 21).setValue(res.release_date);      // U: release_date
        sheet.getRange(rowNum, 22).setValue(res.original_language); // V: original_language
        sheet.getRange(rowNum, 23).setValue(res.age_rating);        // W: age_rating

        // System fields
        const slugVal = generateSlug(title, year);
        sheet.getRange(rowNum, 24).setValue(slugVal);               // X: slug
        if (!row[24]) {
          sheet.getRange(rowNum, 25).setValue(nowStr);              // Y: created_at
        }
        sheet.getRange(rowNum, 26).setValue(nowStr);                // Z: updated_at
        sheet.getRange(rowNum, 27).setValue('PENDING_SYNC');        // AA: sync_status
        sheet.getRange(rowNum, 28).setValue('');                    // AB: sync_error
        enrichedCount++;
      } else {
        sheet.getRange(rowNum, 12).setValue('needs_review');        // L: status
        sheet.getRange(rowNum, 26).setValue(nowStr);                // Z: updated_at
        sheet.getRange(rowNum, 27).setValue('ERROR');               // AA: sync_status
        sheet.getRange(rowNum, 28).setValue(res.error);             // AB: sync_error
        errorCount++;
      }
      Utilities.sleep(250); // Rate limit protection
    }
  }

  SpreadsheetApp.getUi().alert(`🎉 TMDB Data ဖြည့်သွင်းခြင်း ပြီးဆုံးပါပြီ!\n\nအောင်မြင်သည်: ${enrichedCount} ကား\nအမှား/စစ်ဆေးရန်: ${errorCount} ကား`);
}

// 6. ENRICH SELECTED ROW
function enrichSelectedRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rowNum = sheet.getActiveCell().getRow();
  if (rowNum <= 1) {
    SpreadsheetApp.getUi().alert('ကျေးဇူးပြု၍ ခေါင်းစဉ်မဟုတ်သော ရုပ်ရှင်တန်းကို ရွေးချယ်ပါ။');
    return;
  }

  const row = sheet.getRange(rowNum, 1, 1, 28).getValues()[0];
  const title = row[1];
  const year = row[2];
  const type = (row[4] || '').toString().toLowerCase();
  const manualTmdbId = row[12]; // Col M

  if (!title) {
    SpreadsheetApp.getUi().alert('ရုပ်ရှင် Title ထည့်သွင်းထားခြင်း မရှိပါ။');
    return;
  }

  if (!row[0] || row[0] === '') {
    sheet.getRange(rowNum, 1).setValue(generateSlug(title, year));
  }

  const res = fetchTMDBMetadata(title, year, type, manualTmdbId);
  const nowStr = new Date().toISOString();

  if (res.success) {
    // Auto-fill Type (Movie or Series) if blank in Sheet
    if ((!row[4] || row[4] === '') && res.detectedType) {
      sheet.getRange(rowNum, 5).setValue(res.detectedType);        // E: type
    }

    sheet.getRange(rowNum, 12).setValue('active');                 // L: status (Must be 'active' for Supabase schema)
    sheet.getRange(rowNum, 13).setValue(res.tmdb_id);              // M: tmdb_id
    sheet.getRange(rowNum, 14).setValue(res.original_title);        // N: original_title
    sheet.getRange(rowNum, 15).setValue(res.overview);              // O: overview
    sheet.getRange(rowNum, 16).setValue(res.poster_url);            // P: poster_url
    sheet.getRange(rowNum, 17).setValue(res.backdrop_url);          // Q: backdrop_url
    sheet.getRange(rowNum, 18).setValue(res.rating);                // R: rating
    sheet.getRange(rowNum, 19).setValue(res.genres);                // S: genre
    sheet.getRange(rowNum, 20).setValue(res.duration);              // T: duration
    sheet.getRange(rowNum, 21).setValue(res.release_date);          // U: release_date
    sheet.getRange(rowNum, 22).setValue(res.original_language);     // V: original_language
    sheet.getRange(rowNum, 23).setValue(res.age_rating);            // W: age_rating

    // System fields
    const slugVal = generateSlug(title, year);
    sheet.getRange(rowNum, 24).setValue(slugVal);                   // X: slug
    if (!row[24]) {
      sheet.getRange(rowNum, 25).setValue(nowStr);                  // Y: created_at
    }
    sheet.getRange(rowNum, 26).setValue(nowStr);                    // Z: updated_at
    sheet.getRange(rowNum, 27).setValue('PENDING_SYNC');            // AA: sync_status
    sheet.getRange(rowNum, 28).setValue('');                        // AB: sync_error
    SpreadsheetApp.getUi().alert(`✅ "${title}" အတွက် TMDB အချက်အလက်များ ရရှိပါပြီ!`);
  } else {
    sheet.getRange(rowNum, 12).setValue('needs_review');            // L: status
    sheet.getRange(rowNum, 26).setValue(nowStr);                    // Z: updated_at
    sheet.getRange(rowNum, 27).setValue('ERROR');                   // AA: sync_status
    sheet.getRange(rowNum, 28).setValue(res.error);                 // AB: sync_error
    SpreadsheetApp.getUi().alert(`❌ အမှား: ${res.error}`);
  }
}

// 7. SYNC TO SUPABASE POSTGRESQL (UPSERT)
function syncToSupabase() {
  const config = getConfigs();
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_KEY) {
    SpreadsheetApp.getUi().alert('SUPABASE_URL နှင့် SUPABASE_SERVICE_KEY ကို Script Properties (သို့မဟုတ် ကုဒ်ထဲတွင်) အရင်ထည့်ပါ။');
    return;
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = activeSpreadsheet.getSheetByName('movies')
             || activeSpreadsheet.getSheetByName('Sheet2')
             || activeSpreadsheet.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const payload = [];
  const rowsToUpdate = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 1;

    const id = row[0] || row[23] || generateSlug(row[1], row[2]);
    const title = row[1];
    const year = parseInt(row[2], 10);

    const rawTgLink = (row[3] || '').toString().trim();
    const tg_link = rawTgLink.startsWith('http') ? rawTgLink : 'https://t.me/addlist/58gZNGQ86uJiOWE9';

    // Type constraint: must be 'movie' or 'series'
    let type = (row[4] || 'movie').toString().toLowerCase().trim();
    if (type !== 'movie' && type !== 'series') {
      type = (type.includes('series') || type.includes('tv')) ? 'series' : 'movie';
    }

    const category = row[5] || 'Discover';
    const pin = row[6] === true || row[6] === 'TRUE';
    const trending = row[7] === true || row[7] === 'TRUE';
    const quality = row[8] || 'HD';
    const language = row[9] || 'Myanmar Sub';
    const synopsis = row[10] || '';

    // Status constraint: must be 'active', 'draft', 'archived', or 'needs_review'
    const rawStatus = (row[11] || 'active').toString().toLowerCase().trim();
    let status = 'active';
    if (rawStatus === 'draft' || rawStatus === 'archived' || rawStatus === 'needs_review') {
      status = rawStatus;
    } else {
      status = 'active'; // Map 'published', empty, or any other value safely to 'active'
    }

    const tmdb_id = row[12] ? parseInt(row[12], 10) : null;
    const original_title = row[13] || title;
    const overview = row[14] || '';
    const poster_url = row[15];
    const backdrop_url = row[16] || poster_url;

    // Rating constraint: 0.0 to 10.0
    let rating = row[17] ? Number(row[17]) : 0.0;
    if (isNaN(rating) || rating < 0) rating = 0.0;
    if (rating > 10) rating = 10.0;
    rating = Number(rating.toFixed(1));

    const genresArray = row[18] ? row[18].toString().split(',').map(s => s.trim()).filter(Boolean) : [];
    const duration = row[19] ? parseInt(row[19], 10) || null : null;
    
    // Safely format release_date for PostgreSQL DATE column (YYYY-MM-DD)
    let release_date = null;
    if (row[20]) {
      if (row[20] instanceof Date && !isNaN(row[20].getTime())) {
        try {
          release_date = Utilities.formatDate(row[20], 'UTC', 'yyyy-MM-dd');
        } catch (e) {
          release_date = null;
        }
      } else {
        const rawDateStr = row[20].toString().trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDateStr)) {
          release_date = rawDateStr;
        } else {
          const parsed = new Date(rawDateStr);
          if (!isNaN(parsed.getTime())) {
            try {
              release_date = Utilities.formatDate(parsed, 'UTC', 'yyyy-MM-dd');
            } catch (e) {
              release_date = null;
            }
          }
        }
      }
    }

    const original_language = row[21] || 'en';
    const age_rating = row[22] || 'PG-13';

    // Validate essential fields before syncing (Title, Year, Poster URL are required)
    if (title && year && poster_url) {
      payload.push({
        id: id,
        tmdb_id: tmdb_id,
        title: title,
        original_title: original_title,
        overview: overview,
        year: year,
        tg_link: (tg_link || '').toString(),
        type: type,
        category: category,
        pin: pin,
        trending: trending,
        quality: quality,
        language: language,
        synopsis: synopsis,
        status: status,
        poster_url: poster_url,
        backdrop_url: backdrop_url,
        rating: rating,
        genres: genresArray,
        duration: duration,
        release_date: release_date,
        original_language: original_language,
        age_rating: age_rating
      });
      rowsToUpdate.push(rowNum);
    }
  }

  if (payload.length === 0) {
    SpreadsheetApp.getUi().alert('Sync လုပ်ရန် အချက်အလက် ပြည့်စုံသော ကားမရှိသေးပါ။ (Title, Year နှင့် Poster URL ရှိရပါမည်။ TMDB Fetch အရင်လုပ်ပါ)');
    return;
  }

  // Supabase REST endpoint for UPSERT
  const endpoint = `${config.SUPABASE_URL}/rest/v1/movies`;
  const res = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': config.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + config.SUPABASE_SERVICE_KEY,
      'Prefer': 'resolution=merge-duplicates'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  const nowIso = new Date().toISOString();

  if (code >= 200 && code < 300) {
    rowsToUpdate.forEach(r => {
      sheet.getRange(r, 26).setValue(nowIso);   // Z: updated_at
      sheet.getRange(r, 27).setValue('SYNCED'); // AA: sync_status
      sheet.getRange(r, 28).setValue('');       // AB: sync_error
    });
    SpreadsheetApp.getUi().alert(`🚀 Supabase သို့ အောင်မြင်စွာ Sync ပြီးပါပြီ!\n\nစုစုပေါင်း: ${payload.length} ကား အသစ်ထည့်/ပြင်ဆင်ပြီးပါပြီ။`);
  } else {
    const errorText = res.getContentText();
    rowsToUpdate.forEach(r => {
      sheet.getRange(r, 27).setValue('ERROR');  // AA: sync_status
      sheet.getRange(r, 28).setValue(errorText);// AB: sync_error
    });
    SpreadsheetApp.getUi().alert(`❌ Supabase Sync Error (${code}):\n` + errorText);
  }
}

// 8. SUMMARY CHECK
function checkStatusSummary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('movies') || SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  let total = data.length - 1;
  let synced = 0;
  let pending = 0;
  let errors = 0;

  for (let i = 1; i < data.length; i++) {
    const status = data[i][26] || ''; // Col AA
    if (status === 'SYNCED') synced++;
    else if (status.toString().startsWith('ERROR')) errors++;
    else pending++;
  }

  SpreadsheetApp.getUi().alert(`📊 Sync Status အကျဉ်းချုပ်:\n\nစုစုပေါင်း ရုပ်ရှင်: ${total} ကား\nSynced ပြီးစီး: ${synced} ကား\nSync ရန်ကျန်: ${pending} ကား\nစစ်ဆေးရန်လိုအပ်: ${errors} ကား`);
}
