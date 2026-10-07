/**
 * AI Fairness Lab — Node.js Local Server
 * 
 * University Seminar Interactive Experiment
 * 
 * Features:
 * - Zero external dependencies (uses standard Node.js libraries)
 * - Static file serving with proper MIME types & security checks
 * - POST /api/predict live inference backend endpoint
 * - GET /api/health health-check endpoint
 * - Console logger displaying auditor requests in real time
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

// Ground truth & simulation benchmark responses
const BENCHMARK_CASES = {
  tc01: {
    groundTruth: 'Female',
    subgroup: 'lighterFemale',
    models: {
      modelA: { prediction: 'Female', confidence: 98.2, correct: true },
      modelB: { prediction: 'Female', confidence: 96.7, correct: true },
      modelC: { prediction: 'Female', confidence: 94.1, correct: true }
    }
  },
  tc02: {
    groundTruth: 'Female',
    subgroup: 'darkerFemale',
    models: {
      modelA: { prediction: 'Male', confidence: 71.4, correct: false },
      modelB: { prediction: 'Male', confidence: 68.9, correct: false },
      modelC: { prediction: 'Female', confidence: 52.3, correct: true }
    }
  },
  tc03: {
    groundTruth: 'Male',
    subgroup: 'lighterMale',
    models: {
      modelA: { prediction: 'Male', confidence: 99.1, correct: true },
      modelB: { prediction: 'Male', confidence: 98.4, correct: true },
      modelC: { prediction: 'Male', confidence: 97.8, correct: true }
    }
  },
  tc04: {
    groundTruth: 'Male',
    subgroup: 'darkerMale',
    models: {
      modelA: { prediction: 'Male', confidence: 88.6, correct: true },
      modelB: { prediction: 'Male', confidence: 99.2, correct: true },
      modelC: { prediction: 'Female', confidence: 57.1, correct: false }
    }
  },
  tc05: {
    groundTruth: 'Female',
    subgroup: 'lighterFemale',
    models: {
      modelA: { prediction: 'Female', confidence: 63.2, correct: true },
      modelB: { prediction: 'Male', confidence: 54.8, correct: false },
      modelC: { prediction: 'Female', confidence: 61.0, correct: true }
    }
  }
};

/**
 * Handle API prediction requests
 */
async function handlePredict(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1e6) req.connection.destroy(); // 1MB limit
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      const { testCaseId, modelKey } = data;

      if (!testCaseId || !modelKey) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing testCaseId or modelKey' }));
        return;
      }

      const caseData = BENCHMARK_CASES[testCaseId];
      if (!caseData || !caseData.models[modelKey]) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Unknown testCaseId (${testCaseId}) or modelKey (${modelKey})` }));
        return;
      }

      // Add simulated network/inference latency
      const simulatedLatency = Math.floor(120 + Math.random() * 160);
      await new Promise(r => setTimeout(r, simulatedLatency));

      const result = caseData.models[modelKey];
      const responsePayload = {
        testCaseId,
        modelKey,
        prediction: result.prediction,
        confidence: result.confidence,
        correct: result.correct,
        serverLatencyMs: simulatedLatency,
        engine: 'Node.js Local Inference Runner',
        timestamp: new Date().toISOString()
      };

      console.log(`[API /predict] Audited Case: ${testCaseId} | Model: ${modelKey.padEnd(6)} | Pred: ${result.prediction.padEnd(6)} | Conf: ${result.confidence}% | Correct: ${result.correct} (${simulatedLatency}ms)`);

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(responsePayload));
    } catch (err) {
      console.error('[API /predict Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error processing prediction' }));
    }
  });
}

/**
 * Main HTTP Request Listener
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/api/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      status: 'ok',
      server: 'Node.js',
      version: process.version,
      mode: 'live',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Predict endpoint
  if (pathname === '/api/predict' && req.method === 'POST') {
    handlePredict(req, res);
    return;
  }

  // Static File Serving
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(ROOT_DIR, safePath);

  // Path traversal check
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>404 Not Found</h2><p>Resource <code>${pathname}</code> was not found.</p><p><a href="/">Return to AI Fairness Lab</a></p>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n============================================================');
    console.log('         AI FAIRNESS LAB — NODE.JS LOCAL SERVER             ');
    console.log('       University Seminar Interactive Experiment            ');
    console.log('============================================================');
    console.log(`  Local Web Server:  http://127.0.0.1:${PORT}`);
    console.log(`  Alternative URL:   http://localhost:${PORT}`);
    console.log(`  Live API Endpoint: http://127.0.0.1:${PORT}/api/predict`);
    console.log(`  Health Check:      http://127.0.0.1:${PORT}/api/health`);
    console.log('============================================================');
    console.log('  Server is active! Press Ctrl+C to stop.\n');
  });
}

module.exports = server;
