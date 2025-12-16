const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// *** KONFIGURATION ***
const API_KEY = 'IHR_TMDB_API_KEY';
const OMDB_KEY = 'IHR_OMDB_API_KEY';
const LANG = 'de-DE';
const PORT = 3000;
const UPLOAD_DIR = 'uploads';
// Concurrency auf 8 für den Turbo-Modus
const CONCURRENCY = 8;

const DB_MOVIES = 'datenbank.js';
const DB_SERIES = 'serien_datenbank.js';
const CUSTOM_COLL_FILE = 'custom_collections.json';
const AUTO_COLL_SETTINGS = 'collection_settings.json';
const MEDIA_OVERRIDES_FILE = 'media_overrides.json';
const EPISODE_STATUS_FILE = 'episode_status.json';
const USERS_FILE = 'users.json';

const sessions = {}; const SESSION_TIMEOUT = 3600 * 1000 * 24;
if (!fs.existsSync(UPLOAD_DIR)){ fs.mkdirSync(UPLOAD_DIR); }

function loadUsers() { if (!fs.existsSync(USERS_FILE)) return []; try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch (e) { return []; } }
function getCookie(req, name) { const rc = req.headers.cookie; const list = {}; if (rc) rc.split(';').forEach(cookie => { const parts = cookie.split('='); list[parts.shift().trim()] = decodeURI(parts.join('=')); }); return list[name]; }
function isAuthenticated(req) { const sid = getCookie(req, 'session_id'); if (!sid || !sessions[sid]) return false; if (Date.now() - sessions[sid] > SESSION_TIMEOUT) { delete sessions[sid]; return false; } return true; }

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const reqUrl = url.parse(req.url, true);

    if (reqUrl.pathname === '/' || reqUrl.pathname === '/index.html') return serveFile(res, 'index.html', 'text/html');
    if (reqUrl.pathname === '/datenbank.js') return serveFile(res, DB_MOVIES, 'application/javascript');
    if (reqUrl.pathname === '/serien_datenbank.js') return serveFile(res, DB_SERIES, 'application/javascript');
    if (reqUrl.pathname.startsWith('/uploads/')) return serveImage(req, res);
    if (reqUrl.pathname === '/api/episode-status') return handleJsonFile(req, res, EPISODE_STATUS_FILE);

    if (reqUrl.pathname === '/api/get-db') handleGetDB(reqUrl, res);
    else if (reqUrl.pathname === '/api/login' && req.method === 'POST') handleLogin(req, res);
    else if (reqUrl.pathname === '/api/check-auth') { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({ loggedIn: isAuthenticated(req) })); }
    else if (reqUrl.pathname === '/api/logout') { const sid = getCookie(req, 'session_id'); if(sid) delete sessions[sid]; res.writeHead(200, { 'Set-Cookie': `session_id=; HttpOnly; Path=/; Max-Age=0` }); res.end('Logged out'); }
    else if (!isAuthenticated(req)) { if (reqUrl.pathname === '/admin') { res.writeHead(302, { 'Location': '/index.html?login=true' }); res.end(); return; } res.writeHead(401); res.end('Unauthorized'); }
    else if (reqUrl.pathname === '/admin') return serveFile(res, 'admin.html', 'text/html');
    else if (reqUrl.pathname === '/api/manual-search') handleSearch(reqUrl, res);
    else if (reqUrl.pathname === '/api/custom-collections') handleJsonFile(req, res, CUSTOM_COLL_FILE);
    else if (reqUrl.pathname === '/api/auto-coll-settings') handleJsonFile(req, res, AUTO_COLL_SETTINGS);
    else if (reqUrl.pathname === '/api/media-overrides') handleJsonFile(req, res, MEDIA_OVERRIDES_FILE);
    else if (reqUrl.pathname === '/api/upload' && req.method === 'POST') handleUpload(req, res);
    else if (reqUrl.pathname === '/api/generate/movies' && req.method === 'POST') processGenerator(req, res, 'movie');
    else if (reqUrl.pathname === '/api/generate/series' && req.method === 'POST') processGenerator(req, res, 'series');
    else { res.writeHead(404); res.end('Not found'); }
});

function handleLogin(req, res) {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
        try { const creds = JSON.parse(body); const user = loadUsers().find(u => u.username === creds.username && u.password === creds.password);
            if (user) { const sessionId = crypto.randomBytes(16).toString('hex'); sessions[sessionId] = Date.now(); res.writeHead(200, { 'Set-Cookie': `session_id=${sessionId}; HttpOnly; Path=/; Max-Age=86400`, 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: true })); }
            else { res.writeHead(401, {'Content-Type': 'application/json'}); res.end(JSON.stringify({ success: false })); }
        } catch(e) { res.writeHead(500); res.end(); }
    });
}

function serveFile(res,f,t){fs.readFile(path.join(__dirname,f),(e,c)=>{if(e){res.writeHead(500);res.end();}else{res.writeHead(200,{'Content-Type':t});res.end(c);}});}
function serveImage(req,res){const p=path.join(__dirname,url.parse(req.url).pathname);if(fs.existsSync(p)){const e=path.extname(p).toLowerCase();const m=e==='.png'?'image/png':(e==='.jpg'||e==='.jpeg')?'image/jpeg':'application/octet-stream';res.writeHead(200,{'Content-Type':m});fs.createReadStream(p).pipe(res);}else{res.writeHead(404);res.end();}}
function handleJsonFile(req,res,f){if(req.method==='GET'){if(fs.existsSync(f))fs.createReadStream(f).pipe(res);else res.end('{}');}else if(req.method==='POST'){let b='';req.on('data',c=>b+=c);req.on('end',()=>fs.writeFile(f,b,e=>res.end(e?'Error':'Saved')));}}
function handleUpload(req,res){let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{const d=JSON.parse(b);const buf=Buffer.from(d.image.replace(/^data:image\/\w+;base64,/,""),'base64');const n='img_'+Date.now()+'.jpg';fs.writeFileSync(path.join(UPLOAD_DIR,n),buf);res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({url:`/uploads/${n}`}));}catch(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));}});}
async function fetchJson(u){try{const r=await fetch(u);if(!r.ok)return null;return await r.json();}catch{return null;}}

function extractJSON(content) {
    if (!content) return [];
    try {
        const start = content.indexOf('[');
        const end = content.lastIndexOf(']');
        if (start > -1 && end > start) {
            const jsonString = content.substring(start, end + 1);
            return JSON.parse(jsonString);
        }
    } catch(e) { console.error("Parse Error:", e); }
    return [];
}

function handleGetDB(reqUrl, res) {
    const type = reqUrl.query.type;
    const file = type === 'movie' ? DB_MOVIES : DB_SERIES;
    if(!fs.existsSync(file)) { res.end('[]'); return; }
    const content = fs.readFileSync(file, 'utf8');
    const data = extractJSON(content);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(data));
}

function loadJson(file) { if (!fs.existsSync(file)) return {}; try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; } }
function loadAutoCollSettings() { const data = loadJson(AUTO_COLL_SETTINGS); return { hidden: data.hidden || [], renamed: data.renamed || {}, posters: data.posters || {} }; }
function loadExistingDB(file) { if (!fs.existsSync(file)) return []; return extractJSON(fs.readFileSync(file, 'utf8')); }

function toBase64(str) { return Buffer.from(str).toString('base64'); }
function sanitizeData(data) { return data.map(item => { const cleanItem = { ...item }; for (const key in cleanItem) { if (typeof cleanItem[key] === 'string') cleanItem[key] = cleanItem[key].replace(/\r?\n|\r/g, ' '); } return cleanItem; }); }
async function fetchTomatometer(imdbId) { if (!OMDB_KEY || !imdbId) return null; const data = await fetchJson(`http://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbId}`); if (data && data.Ratings) { const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes'); return rt ? rt.Value : null; } return null; }
async function searchMovie(q) { const r = await fetchJson(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=${LANG}&query=${encodeURIComponent(q)}`); return r ? r.results.map(m => ({ id: m.id, title: m.title, year: m.release_date?.split('-')[0], poster: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : null })) : []; }
async function searchSeries(q) { const r = await fetchJson(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&language=${LANG}&query=${encodeURIComponent(q)}`); return r ? r.results.map(s => ({ id: s.id, title: s.name, year: s.first_air_date?.split('-')[0], poster: s.poster_path ? `https://image.tmdb.org/t/p/w200${s.poster_path}` : null })) : []; }
async function handleSearch(reqUrl, res) { const q=reqUrl.query.q; const type=reqUrl.query.type; if(!q){res.end('[]');return;} let r=type==='movie'?await searchMovie(q):await searchSeries(q); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(r)); }
async function fetchMovieShort(id) { const m = await fetchJson(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=${LANG}`); return m ? { id: m.id, title: m.title } : null; }
async function fetchSeriesShort(id) { const s = await fetchJson(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=${LANG}`); return s ? { id: s.id, title: s.name } : null; }

async function fetchMovieFull(id, autoSettings, overrides) {
    const m = await fetchJson(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=${LANG}&append_to_response=credits,external_ids,videos,release_dates`); if(!m) return null;
    let trailerKey = m.videos?.results.find(x => x.site==='YouTube' && x.type==='Trailer')?.key;
    let collection = null; let originalCollection = null;
    if (m.belongs_to_collection) {
        const cId = m.belongs_to_collection.id;
        originalCollection = { id: cId, name: m.belongs_to_collection.name, poster: m.belongs_to_collection.poster_path ? `https://image.tmdb.org/t/p/w500${m.belongs_to_collection.poster_path}` : null };
        if (!autoSettings.hidden.map(String).includes(String(cId))) {
            collection = { ...originalCollection };
            if(autoSettings.renamed[cId]) collection.name = autoSettings.renamed[cId];
            if(autoSettings.posters[cId]) collection.poster = autoSettings.posters[cId];
        }
    }
    let poster = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : '';
    if (overrides[id]) { if (overrides[id].poster) poster = overrides[id].poster; if (overrides[id].trailer) trailerKey = overrides[id].trailer; }
    let fsk = ''; if (m.release_dates && m.release_dates.results) { const deRel = m.release_dates.results.find(x => x.iso_3166_1 === 'DE'); if (deRel && deRel.release_dates.length > 0) fsk = deRel.release_dates[0].certification; }
    return { id: m.id, title: m.title, year: m.release_date?.split('-')[0], desc: m.overview, rating: m.vote_average, poster: poster, trailerId: trailerKey, director: m.credits?.crew.find(x => x.job === 'Director')?.name || 'Unbekannt', cast: m.credits?.cast.slice(0, 10).map(c => c.name) || [], studio: m.production_companies.map(c => c.name).slice(0, 1).join(', '), imdbId: m.external_ids?.imdb_id || '', rtScore: m.external_ids?.imdb_id ? await fetchTomatometer(m.external_ids.imdb_id) : null, collection: collection, originalCollection: originalCollection, runtime: m.runtime, genres: m.genres ? m.genres.map(g => g.name).join(', ') : '', fsk: fsk };
}

async function fetchSeriesFull(id, overrides) {
    const s = await fetchJson(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=${LANG}&append_to_response=credits,external_ids,videos,content_ratings`); if(!s) return null;
    let trailerKey = s.videos?.results.find(x => x.site==='YouTube' && x.type==='Trailer')?.key;
    let poster = s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '';
    if (overrides[id]) { if (overrides[id].poster) poster = overrides[id].poster; if (overrides[id].trailer) trailerKey = overrides[id].trailer; }
    let seasons = []; if(s.seasons) { for(let sea of s.seasons) { if(sea.season_number===0 && sea.episode_count===0) continue; let sd = await fetchJson(`https://api.themoviedb.org/3/tv/${id}/season/${sea.season_number}?api_key=${API_KEY}&language=${LANG}`); if(sd) seasons.push({ number: sd.season_number, title: sd.name, poster: sd.poster_path, episodes: sd.episodes.map(e => ({ no: e.episode_number, title: e.name, date: e.air_date, id: e.id })) }); await new Promise(r=>setTimeout(r, 50)); } }
    let fsk = ''; if(s.content_ratings && s.content_ratings.results) { const deRate = s.content_ratings.results.find(x => x.iso_3166_1 === 'DE'); if(deRate) fsk = deRate.rating; }
    return { id: s.id, title: s.name, year: s.first_air_date?.split('-')[0], desc: s.overview, rating: s.vote_average, poster: poster, trailerId: trailerKey, seasons: seasons, director: s.created_by?.map(c => c.name).join(', ') || 'Unbekannt', cast: s.credits?.cast.slice(0, 10).map(c => c.name) || [], studio: s.production_companies.map(c => c.name).slice(0, 1).join(', '), imdbId: s.external_ids?.imdb_id || '', rtScore: s.external_ids?.imdb_id ? await fetchTomatometer(s.external_ids.imdb_id) : null, runtime: (s.episode_run_time && s.episode_run_time.length > 0) ? s.episode_run_time[0] + ' min' : '', genres: s.genres ? s.genres.map(g => g.name).join(', ') : '', fsk: fsk };
}

async function processGenerator(req, res, type) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write(" ".repeat(1024) + "\n");
    const log = (msg) => res.write(`LOG:${msg}\n`);
    try {
        let body = ''; req.setEncoding('utf8'); req.on('data', c => body += c); await new Promise(resolve => req.on('end', resolve));
        const lines = body.split('\n');
        const dbFile = type === 'movie' ? DB_MOVIES : DB_SERIES;
        const varName = type === 'movie' ? 'meineFilme' : 'meineSerien';

        const cacheDB = loadExistingDB(dbFile);
        let newDB = [];
        const customColls = loadJson(CUSTOM_COLL_FILE);
        const autoSettings = loadAutoCollSettings();
        const overrides = loadJson(MEDIA_OVERRIDES_FILE);

        let fetchCount = 0;

        async function processLine(line) {
            line = line.trim(); if(!line) return;
            const parts = line.split(';'); const name = parts[0].trim(); let id = null;

            if (parts.length > 1) {
                const lastPart = parts[parts.length-1].trim();
                if (/^\d+$/.test(lastPart)) { id = lastPart; }
            }
            if(id === '0') id = '0';

            const uid = crypto.createHash('md5').update(name + (id||'')).digest('hex');

            let cachedEntry = cacheDB.find(x => x.uid === uid);
            let finalEntry = null;

            if (cachedEntry) {
                finalEntry = { ...cachedEntry };
                if(overrides[id]) { if(overrides[id].poster) finalEntry.poster = overrides[id].poster; if(overrides[id].trailer) finalEntry.trailerId = overrides[id].trailer; }
                if(!finalEntry.originalCollection && finalEntry.collection) finalEntry.originalCollection = { ...finalEntry.collection };
                if(type === 'movie' && finalEntry.originalCollection) {
                    const cId = finalEntry.originalCollection.id;
                    if (autoSettings.hidden.map(String).includes(String(cId))) { finalEntry.collection = null; }
                    else { finalEntry.collection = { ...finalEntry.originalCollection }; if(autoSettings.renamed[cId]) finalEntry.collection.name = autoSettings.renamed[cId]; if(autoSettings.posters[cId]) finalEntry.collection.poster = autoSettings.posters[cId]; }
                }
                finalEntry.searchQuery = name;
                finalEntry.title = name;
            }
            else {
                let fullData = null;
                if (id && id !== '0') {
                    fetchCount++;
                    log(`⏳ Lade ID ${id}: ${name}...`);
                    const check = type === 'movie' ? await fetchMovieShort(id) : await fetchSeriesShort(id);
                    if (check) {
                        fullData = type === 'movie' ? await fetchMovieFull(id, autoSettings, overrides) : await fetchSeriesFull(id, overrides);
                        if(fullData) log(`✅ OK: ${name}`);
                        else log(`❌ FEHLER: Daten für ID ${id} unvollständig.`);
                    } else { log(`❌ FEHLER: ID ${id} nicht bei TMDB gefunden (404/Invalid).`); }
                }
                else if (id !== '0') {
                    fetchCount++;
                    log(`🔍 Suche: "${name}"...`);
                    let q = name.replace(/\s*[([].*?[)\]]\s*$/, '').trim();
                    let results = type === 'movie' ? await searchMovie(q) : await searchSeries(q);
                    if (results && results.length > 0) { const hit = results[0]; log(`🎯 Treffer: "${hit.title}"`); fullData = type === 'movie' ? await fetchMovieFull(hit.id, autoSettings, overrides) : await fetchSeriesFull(hit.id, overrides); }
                    else { log(`⚠️ Nichts gefunden für: "${name}"`); }
                }

                if(fullData) {
                    fullData.searchQuery = name; finalEntry = fullData; finalEntry.uid = uid; finalEntry.title = name;
                } else {
                    if(id && id !== '0') log(`⚠️ Erstelle 'Fehlerhaft'-Eintrag für: "${name}"`);
                    else if(id === '0') log(`ℹ️ Erstelle 'Manuell'-Eintrag für: "${name}"`);
                    finalEntry = {
                        id: (id && id!=='0') ? id : ('off_' + Date.now()),
                        title: name, searchQuery: name, uid: uid, poster: '/uploads/placeholder.jpg',
                        year: '-', desc: 'Daten konnten nicht geladen werden.', genres: 'Manuell', rating: '0', runtime: '', fsk: '',
                        isOffline: true
                    };
                }
            }

            if (finalEntry) {
                // *** FILTER: Nur speichern, wenn es KEIN manuell entfernter Eintrag ist ***
                if (finalEntry.id === '0' || finalEntry.isOffline) {
                    // Wird NICHT in die DB gespeichert -> Taucht nicht auf index.html auf
                    // Taucht aber im Admin auf, weil CSV ja existiert, aber DB Eintrag fehlt.
                } else {
                    if (type==='movie') {
                        const myColls = (Array.isArray(customColls)?customColls:[]).filter(c => c.movieIds.includes(finalEntry.uid) || c.movieIds.includes(String(finalEntry.id)));
                        if (myColls.length > 0) finalEntry.customCollections = myColls.map(c => ({ id: c.id, title: c.name, poster: c.poster })); else delete finalEntry.customCollections;
                    }
                    const exists = newDB.find(x => x.uid === finalEntry.uid);
                    if(!exists) newDB.push(finalEntry);
                }
            }
        }

        for (let i = 0; i < lines.length; i += CONCURRENCY) {
            fetchCount = 0; const chunk = lines.slice(i, i + CONCURRENCY); await Promise.all(chunk.map(line => processLine(line)));
            if(fetchCount > 0) { await new Promise(r => setTimeout(r, 200)); }
        }

        const cleanDB = sanitizeData(newDB); const jsonString = JSON.stringify(cleanDB, null, 2); const jsContent = `\uFEFFconst ${varName} = ${jsonString};`; fs.writeFileSync(dbFile, jsContent, 'utf8'); res.write(`BASE64_JSON:${toBase64('[]')}\n`); res.end();
    } catch (e) { console.error(e); res.write(`LOG: Error ${e.message}\n`); res.end(); }
}
console.log(`🚀 SERVER läuft! http://localhost:${PORT}`);
server.listen(PORT);
