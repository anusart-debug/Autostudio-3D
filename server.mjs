import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, watch, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

function runBuild() {
  try {
    execSync('node build.mjs', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('[build] Failed to build:', err.message);
  }
}

// Initial build
runBuild();

// Auto-rebuild on change in src/
let rebuildTimer = null;
try {
  watch(join(__dirname, 'src'), { recursive: true }, (event, filename) => {
    if (rebuildTimer) clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(() => {
      console.log(`[src change] Detected modification in ${filename || 'src'}. Rebuilding...`);
      runBuild();
    }, 150);
  });
} catch (e) {
  console.warn('[watch] Could not watch src directory:', e.message);
}

const app = express();

// Middleware for parsing text body in /api/overpass
app.use('/api/overpass', express.text({ type: '*/*', limit: '10mb' }));

// Overpass API proxy endpoint to bypass CORS and rate limits
app.post('/api/overpass', (req, res) => {
  const query = typeof req.body === 'string' ? req.body : '';
  if (!query) return res.status(400).send('Query required');

  const postData = query;
  const proxyReq = https.request('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    family: 4,
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': 'Autostudio3D/41.1 (anusart@planbmedia.co.th)',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 30000
  }, (proxyRes) => {
    res.status(proxyRes.statusCode || 200);
    for (const [k, v] of Object.entries(proxyRes.headers)) {
      if (v) res.setHeader(k, v);
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) res.status(504).send('Overpass gateway timeout');
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy overpass error]:', err.message);
    if (!res.headersSent) res.status(502).send('Proxy error: ' + err.message);
  });

  proxyReq.write(postData);
  proxyReq.end();
});

const PLANB_FOLDER_ID = '1GbtqM4DQQ1I0ApTOf9XCBszWgHg7F1kH';

// Endpoint to list files in Plan B Google Drive folder
app.get('/api/drive/catalog', (req, res) => {
  const catalogPath = join(__dirname, 'src', 'planb-drive-catalog.json');
  if (existsSync(catalogPath)) {
    return res.sendFile(catalogPath);
  }
  res.status(404).json({ error: 'Catalog not found' });
});

app.get('/api/drive/planb-files', (req, res) => {
  const catalogPath = join(__dirname, 'src', 'planb-drive-catalog.json');
  if (existsSync(catalogPath)) {
    return res.sendFile(catalogPath);
  }
  res.status(404).json({ error: 'Catalog not found' });
});

// Endpoint to download file binary content from Google Drive
app.get('/api/drive/file/:id', (req, res) => {
  const fileId = req.params.id;
  const authHeader = req.headers['authorization'];

  const cacheDir = join(__dirname, '.cache', 'drive');
  const cacheFile = join(cacheDir, `${fileId}.bin`);
  const metaFile = join(cacheDir, `${fileId}.meta`);

  if (existsSync(cacheFile) && existsSync(metaFile)) {
    try {
      const mime = readFileSync(metaFile, 'utf8').trim();
      res.setHeader('Content-Type', mime || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(cacheFile);
    } catch (e) {
      // continue to fetch
    }
  }

  // Attempt direct download from Google Drive
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    timeout: 25000
  };
  if (authHeader) {
    options.headers['Authorization'] = authHeader;
  }

  function fetchUrl(targetUrl, depth = 0) {
    if (depth > 5) return res.status(502).send('Too many redirects');
    const reqObj = https.get(targetUrl, options, (driveRes) => {
      if (driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
        let redirectUrl = driveRes.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, targetUrl).href;
        }
        return fetchUrl(redirectUrl, depth + 1);
      }

      const contentType = driveRes.headers['content-type'] || 'image/jpeg';
      // If HTML returned on uc?export=download (e.g. large file virus scan warning or auth page), fallback to thumbnail w1600
      if (contentType.includes('text/html') && !targetUrl.includes('googleusercontent.com')) {
        const thumbUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
        return fetchUrl(thumbUrl, depth + 1);
      }

      res.status(driveRes.statusCode || 200);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const chunks = [];
      driveRes.on('data', (c) => chunks.push(c));
      driveRes.on('end', () => {
        const fullBuffer = Buffer.concat(chunks);
        if (!res.headersSent) res.end(fullBuffer);
        // Save to cache asynchronously
        try {
          if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
          writeFileSync(cacheFile, fullBuffer);
          writeFileSync(metaFile, contentType);
        } catch (errSave) {
          // ignore cache error
        }
      });
    });

    reqObj.on('error', (err) => {
      console.error('[proxy drive file error]:', err.message);
      if (!res.headersSent) res.status(502).send('Proxy error: ' + err.message);
    });
  }

  fetchUrl(downloadUrl);
});

// Single-file offline build access
app.get('/autostudio3d.html', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'autostudio3d.html'));
});

// Serve dist/web static assets
app.use(express.static(join(__dirname, 'dist', 'web')));
app.use(express.static(join(__dirname, 'dist')));

// Fallback to dist/web/index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'web', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`AUTOSTUDIO 3D server running on http://${HOST}:${PORT}`);
});
