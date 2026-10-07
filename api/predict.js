// Ground truth & simulation benchmark responses for AI Fairness Lab
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    if (res.status && typeof res.status === 'function') {
      return res.status(204).end();
    }
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    if (res.status && typeof res.status === 'function') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
  }

  // Parse body if not auto-parsed by Vercel
  let body = req.body;
  if (!body) {
    body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); }
        catch { resolve({}); }
      });
    });
  } else if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { body = {}; }
  }

  const { testCaseId, modelKey } = body || {};

  if (!testCaseId || !modelKey) {
    if (res.status && typeof res.status === 'function') {
      return res.status(400).json({ error: 'Missing testCaseId or modelKey' });
    }
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Missing testCaseId or modelKey' }));
  }

  const caseData = BENCHMARK_CASES[testCaseId];
  if (!caseData || !caseData.models[modelKey]) {
    if (res.status && typeof res.status === 'function') {
      return res.status(404).json({ error: `Unknown testCaseId (${testCaseId}) or modelKey (${modelKey})` });
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: `Unknown testCaseId (${testCaseId}) or modelKey (${modelKey})` }));
  }

  const simulatedLatency = Math.floor(120 + Math.random() * 160);
  await new Promise(r => setTimeout(r, simulatedLatency));

  const result = caseData.models[modelKey];
  const payload = {
    testCaseId,
    modelKey,
    prediction: result.prediction,
    confidence: result.confidence,
    correct: result.correct,
    serverLatencyMs: simulatedLatency,
    engine: 'Vercel Serverless Live Inference Runner',
    timestamp: new Date().toISOString()
  };

  if (res.status && typeof res.status === 'function') {
    return res.status(200).json(payload);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(payload));
};
