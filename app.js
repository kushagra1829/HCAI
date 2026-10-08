/**
 * AI Fairness Lab — Application Logic
 *
 * Architecture:
 * - State management (plain JS object)
 * - Stage navigation
 * - ModelAdapter abstraction (DEMO / LIVE modes)
 * - Chart rendering (pure SVG/DOM — no dependencies)
 * - Subgroup analysis visualisation
 * - Simulator experiments
 *
 * Data sources:
 * - GENDER_SHADES_DATA (genderShadesData.js) — Real research data
 * - SIMULATION_DATA (simulationData.js) — Illustrative simulations
 *
 * No external API calls are made in DEMO mode.
 * API keys must NEVER appear in this file.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════════════════════════════

const AppState = {
  currentStage: 0,
  mode: 'demo',          // 'demo' | 'live'
  presentationMode: false,

  // User choices
  initialVote: null,      // 'A' | 'B' | 'C'
  aggVote: null,          // 'A' | 'B' | 'C'
  deploymentVote: null,   // 'sys1' | 'sys2' | 'sys3'

  // Stage 02 state
  activeTestCase: 'tc01',
  testResults: {},        // keyed by test case id
  testedCases: new Set(),

  // Stage 03 state
  subgroupModel: 'A',
  subgroupRevealed: false,

  // Stage 04 simulator state
  dataset: 'biased',
  threshold: 50,
  simModel: 'A',
  humanReview: false,
  hrOptionSelected: null,
};

// ═══════════════════════════════════════════════════════════════
// MODEL ADAPTER — ABSTRACTION LAYER
// ═══════════════════════════════════════════════════════════════

/**
 * ModelAdapter is the abstraction that separates the frontend
 * from the actual AI provider implementation.
 *
 * To add a real API:
 * 1. Create a backend endpoint (e.g., /api/predict)
 * 2. Store API keys in environment variables on the server
 * 3. Change AppState.mode to 'live'
 * 4. Implement the livePredict() function to call your endpoint
 *
 * NEVER put API keys in this file.
 */

const ModelAdapter = {

  /**
   * Get prediction for a test case.
   * In DEMO mode: returns pre-stored responses immediately.
   * In LIVE mode: calls the secure backend API endpoint.
   *
   * @param {string} testCaseId - e.g. 'tc01'
   * @param {string} modelKey - 'modelA' | 'modelB' | 'modelC'
   * @returns {Promise<{prediction: string, confidence: number, correct: boolean}>}
   */
  async predict(testCaseId, modelKey) {
    if (AppState.mode === 'demo') {
      return this.demoPredict(testCaseId, modelKey);
    } else {
      return this.livePredict(testCaseId, modelKey);
    }
  },

  /**
   * DEMO MODE: Return pre-stored responses from SIMULATION_DATA.
   * Adds a small artificial delay to simulate a real API call.
   */
  async demoPredict(testCaseId, modelKey) {
    const tc = SIMULATION_DATA.testCases.find(t => t.id === testCaseId);
    if (!tc) throw new Error(`Unknown test case: ${testCaseId}`);

    const response = tc.demoResponses[modelKey];
    if (!response) throw new Error(`No demo response for ${modelKey} on ${testCaseId}`);

    // Simulate API latency
    await sleep(300 + Math.random() * 400);

    return { ...response };
  },

  /**
   * LIVE MODE: Call the secure backend API endpoint.
   *
   * Backend implementation notes:
   * - Endpoint: POST /api/predict
   * - Request body: { testCaseId, modelKey }
   * - Response: { prediction, confidence, correct }
   * - API keys stored in server environment variables:
   *   MODEL_A_API_KEY, MODEL_B_API_KEY, MODEL_C_API_KEY
   *
   * Falls back to DEMO mode if the API call fails.
   */
  async livePredict(testCaseId, modelKey) {
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCaseId, modelKey }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.warn(`Live API call failed for ${modelKey}, falling back to demo:`, error);
      // Graceful fallback to cached demo mode per Requirement 21
      showModeNotice('Live model unavailable. Switching to cached demonstration result.');
      const demoResult = await this.demoPredict(testCaseId, modelKey);
      return {
        ...demoResult,
        engine: 'Cached Demonstration Result (Fallback)'
      };
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function goToStage(n) {
  // Hide all stages
  document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));

  // Show target stage
  const target = document.getElementById(`stage-${n}`);
  if (target) {
    target.classList.add('active');
    AppState.currentStage = n;
    updateProgressBar(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Run stage-specific setup
  if (n === 1) setupStage1();
  if (n === 2) setupStage2();
  if (n === 3) setupStage3();
  if (n === 4) setupStage4();
  if (n === 5) setupStage5();
}

function updateProgressBar(n) {
  for (let i = 0; i <= 5; i++) {
    const el = document.getElementById(`prog-${i}`);
    if (!el) continue;
    el.classList.remove('active', 'completed');
    if (i === n) el.classList.add('active');
    else if (i < n) el.classList.add('completed');
  }
}

// ═══════════════════════════════════════════════════════════════
// STAGE 01 — PREDICT / VOTE
// ═══════════════════════════════════════════════════════════════

function setupStage1() {
  // Restore vote state if returning
  if (AppState.initialVote) {
    highlightVoteCard(AppState.initialVote);
  }
}

function selectModel(model) {
  AppState.initialVote = model;

  // Update cards
  ['A', 'B', 'C'].forEach(m => {
    const card = document.getElementById(`vote-model${m}`);
    card.classList.toggle('selected', m === model);
    card.setAttribute('aria-pressed', m === model ? 'true' : 'false');
  });

  // Show confirmation
  const conf = document.getElementById('vote-confirmation');
  conf.classList.remove('hidden');
  document.getElementById('vote-chosen-label').textContent = `System ${model}`;

  // Enable continue button
  document.getElementById('btn-to-stage2').disabled = false;
}

function highlightVoteCard(model) {
  ['A', 'B', 'C'].forEach(m => {
    const card = document.getElementById(`vote-model${m}`);
    card.classList.toggle('selected', m === model);
    card.setAttribute('aria-pressed', m === model ? 'true' : 'false');
  });
  document.getElementById('vote-confirmation').classList.remove('hidden');
  document.getElementById('vote-chosen-label').textContent = `System ${model}`;
  document.getElementById('btn-to-stage2').disabled = false;
}

// ═══════════════════════════════════════════════════════════════
// STAGE 02 — TEST THE MODELS
// ═══════════════════════════════════════════════════════════════

function setupStage2() {
  selectTestCase(AppState.activeTestCase);
}

function selectTestCase(id) {
  AppState.activeTestCase = id;

  // Update selector buttons
  SIMULATION_DATA.testCases.forEach(tc => {
    const btn = document.getElementById(`tcbtn-${tc.id}`);
    if (btn) {
      btn.classList.toggle('active', tc.id === id);
      btn.setAttribute('aria-pressed', tc.id === id ? 'true' : 'false');
    }
  });

  // Populate test case panel
  const tc = SIMULATION_DATA.testCases.find(t => t.id === id);
  if (!tc) return;

  document.getElementById('tc-panel-title').textContent = tc.label;
  document.getElementById('tc-detail-text').textContent = tc.description;
  document.getElementById('tc-detail-notes').textContent = tc.notes;

  // Tags
  const tagsEl = document.getElementById('tc-tags');
  const skinLabel = tc.skinTone === 'lighter' ? 'Lighter-skinned' : tc.skinTone === 'darker' ? 'Darker-skinned' : 'Medium-skinned';
  const genderLabel = tc.gender === 'female' ? 'Female' : tc.gender === 'male' ? 'Male' : 'Ambiguous';
  tagsEl.innerHTML = `
    <span class="tc-tag ${tc.skinTone}">${skinLabel}</span>
    <span class="tc-tag ${tc.gender}">${genderLabel}</span>
  `;

  // Visual — SVG face placeholder
  renderFacePlaceholder(tc);

  // Hide results if switching cases
  document.getElementById('results-area').classList.add('hidden');
  document.getElementById('disagreement-notice').classList.add('hidden');

  // Update batch summary if cases have been tested
  updateBatchSummary();
}

function renderFacePlaceholder(tc) {
  const visual = document.getElementById('tc-visual');
  const isDarker = tc.skinTone === 'darker';
  const isMedium = tc.skinTone === 'medium';
  const isFemale = tc.gender === 'female';
  const isAmbiguous = tc.gender === 'ambiguous';

  // Skin tones
  const skinFill = isDarker ? '#8B5C3A' : isMedium ? '#C8956A' : '#F5D5B0';
  const hairFill = isDarker ? '#1a0f08' : isMedium ? '#2e1a0e' : (isFemale ? '#5c3a1a' : '#3a2d1a');
  const featureFill = isDarker ? '#5a3520' : isMedium ? '#8a5535' : '#b89070';

  // Hair shape varies by gender
  let hairPath;
  if (isAmbiguous) {
    // Feminine bob hairstyle (long sides) — but with a beard below
    hairPath = `<ellipse cx="80" cy="60" rx="42" ry="46" fill="${hairFill}"/>
       <rect x="38" y="88" width="13" height="36" rx="6" fill="${hairFill}"/>
       <rect x="109" y="88" width="13" height="36" rx="6" fill="${hairFill}"/>`;
  } else if (isFemale) {
    hairPath = `<ellipse cx="80" cy="62" rx="42" ry="48" fill="${hairFill}"/>
       <rect x="38" y="90" width="12" height="30" rx="6" fill="${hairFill}"/>
       <rect x="110" y="90" width="12" height="30" rx="6" fill="${hairFill}"/>`;
  } else {
    hairPath = `<ellipse cx="80" cy="62" rx="42" ry="42" fill="${hairFill}"/>`;
  }

  // Beard (only for ambiguous)
  const beardPath = isAmbiguous ? `
    <!-- Beard / stubble -->
    <ellipse cx="80" cy="118" rx="22" ry="12" fill="${hairFill}" opacity="0.75"/>
    <ellipse cx="63" cy="113" rx="10" ry="7" fill="${hairFill}" opacity="0.6"/>
    <ellipse cx="97" cy="113" rx="10" ry="7" fill="${hairFill}" opacity="0.6"/>
  ` : '';

  visual.innerHTML = `
    <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg"
         role="img" aria-label="Schematic face representation: ${tc.skinTone}-skinned ${tc.gender}"
         style="width:80%; max-width:140px;">
      <!-- Background -->
      <rect width="160" height="160" fill="none"/>
      <!-- Hair -->
      ${hairPath}
      <!-- Face -->
      <ellipse cx="80" cy="90" rx="35" ry="42" fill="${skinFill}"/>
      <!-- Eyes -->
      <ellipse cx="67" cy="82" rx="5" ry="5.5" fill="${featureFill}"/>
      <ellipse cx="93" cy="82" rx="5" ry="5.5" fill="${featureFill}"/>
      <ellipse cx="67" cy="81" rx="3" ry="3.5" fill="#1a1210"/>
      <ellipse cx="93" cy="81" rx="3" ry="3.5" fill="#1a1210"/>
      <!-- Nose -->
      <ellipse cx="80" cy="95" rx="4" ry="3" fill="${featureFill}" opacity="0.5"/>
      <!-- Mouth -->
      <path d="M70 108 Q80 115 90 108" stroke="${featureFill}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Beard (ambiguous only) -->
      ${beardPath}
      <!-- Shoulders -->
      <ellipse cx="80" cy="155" rx="45" ry="20" fill="${skinFill}" opacity="0.4"/>
    </svg>
    <div style="font-size:0.6rem; color:var(--color-text-muted); margin-top:4px; text-align:center;">Schematic illustration</div>
  `;
}


async function runTest() {
  const tcId = AppState.activeTestCase;
  const btn = document.getElementById('btn-run-test');

  // Show loading
  btn.disabled = true;
  btn.textContent = 'Running…';

  const resultsGrid = document.getElementById('results-grid');
  resultsGrid.innerHTML = `
    <div class="results-loading" style="grid-column:1/-1;" aria-live="polite" aria-busy="true">
      <div class="spinner"></div>
      <span>Querying models…</span>
    </div>
  `;
  document.getElementById('results-area').classList.remove('hidden');

  try {
    // Run all three models in parallel
    const [resA, resB, resC] = await Promise.all([
      ModelAdapter.predict(tcId, 'modelA'),
      ModelAdapter.predict(tcId, 'modelB'),
      ModelAdapter.predict(tcId, 'modelC'),
    ]);

    const results = { modelA: resA, modelB: resB, modelC: resC };
    AppState.testResults[tcId] = results;
    AppState.testedCases.add(tcId);

    // Render result cards
    renderResultCards(results);
    checkDisagreement(results);
    updateBatchSummary();

  } catch (error) {
    resultsGrid.innerHTML = `
      <div class="info-box" style="grid-column:1/-1;">
        <strong>Error running test.</strong> Please try again. If this persists, check the Demo/Live mode setting.
        <br><small>${error.message}</small>
      </div>
    `;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Run all models';
  }
}

function renderResultCards(results) {
  const grid = document.getElementById('results-grid');
  const modelLabels = { modelA: 'System A', modelB: 'System B', modelC: 'System C' };

  grid.innerHTML = ['modelA', 'modelB', 'modelC'].map(mk => {
    const r = results[mk];
    const confPct = r.confidence ? r.confidence.toFixed(1) : null;
    const correctClass = r.correct ? 'correct' : 'incorrect';
    const statusText = r.correct ? 'Correct' : 'Incorrect';
    const isLive = AppState.mode === 'live';
    const modeTag = isLive
      ? '<span class="mono" style="font-size:0.65rem; color:var(--color-success); font-weight:600;">LIVE MODEL RESULT</span>'
      : '<span class="mono" style="font-size:0.65rem; color:var(--color-text-muted);">DEMO (CACHED)</span>';

    return `
      <div class="result-card" role="article" aria-label="${modelLabels[mk]} result">
        <div class="result-card-header">
          <span class="result-model-name">${modelLabels[mk]}</span>
          ${modeTag}
        </div>
        <div class="result-card-body">
          <div class="result-row">
            <span class="result-label">Prediction</span>
            <span class="result-value ${correctClass}">${r.prediction}</span>
          </div>
          ${confPct ? `
          <div class="result-row">
            <span class="result-label">Confidence</span>
            <span class="result-value">${confPct}%</span>
          </div>
          <div class="confidence-bar-wrap">
            <div class="confidence-bar-track">
              <div class="confidence-bar-fill" style="width: 0%;"
                   data-target="${confPct}"
                   role="progressbar" aria-valuenow="${confPct}" aria-valuemin="0" aria-valuemax="100"
                   aria-label="Confidence: ${confPct}%"></div>
            </div>
          </div>` : ''}
          <div class="result-status ${correctClass}" aria-label="Result: ${statusText}">
            ${r.correct ? '✓ Correct' : '✗ Incorrect'}
          </div>
          ${r.serverLatencyMs ? `<div style="font-size:0.65rem; color:var(--color-text-muted); margin-top:6px; text-align:center;">Latency: ${r.serverLatencyMs}ms · ${r.engine || 'Server'}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Animate confidence bars
  requestAnimationFrame(() => {
    grid.querySelectorAll('.confidence-bar-fill').forEach(bar => {
      const target = bar.dataset.target;
      if (target) {
        setTimeout(() => { bar.style.width = target + '%'; }, 100);
      }
    });
  });
}

function checkDisagreement(results) {
  const predictions = [
    results.modelA.prediction,
    results.modelB.prediction,
    results.modelC.prediction
  ];
  const hasDisagreement = new Set(predictions).size > 1;
  document.getElementById('disagreement-notice').classList.toggle('hidden', !hasDisagreement);
}

function updateBatchSummary() {
  const batchSummary = document.getElementById('batch-summary');
  if (AppState.testedCases.size === 0) {
    batchSummary.classList.add('hidden');
    return;
  }

  batchSummary.classList.remove('hidden');

  const rows = Array.from(AppState.testedCases).map(tcId => {
    const tc = SIMULATION_DATA.testCases.find(t => t.id === tcId);
    const results = AppState.testResults[tcId];
    if (!results) return '';

    const aCorr = results.modelA.correct ? '✓' : '✗';
    const bCorr = results.modelB.correct ? '✓' : '✗';
    const cCorr = results.modelC.correct ? '✓' : '✗';
    const aColor = results.modelA.correct ? 'var(--color-success)' : 'var(--color-accent)';
    const bColor = results.modelB.correct ? 'var(--color-success)' : 'var(--color-accent)';
    const cColor = results.modelC.correct ? 'var(--color-success)' : 'var(--color-accent)';

    return `<tr>
      <td>${tc.label}</td>
      <td>${tc.skinTone === 'lighter' ? 'Lighter' : tc.skinTone === 'darker' ? 'Darker' : 'Medium'}-skinned ${tc.gender === 'ambiguous' ? 'Ambiguous' : tc.gender}</td>
      <td style="color:${aColor}; font-weight:700;">${aCorr} ${results.modelA.prediction}</td>
      <td style="color:${bColor}; font-weight:700;">${bCorr} ${results.modelB.prediction}</td>
      <td style="color:${cColor}; font-weight:700;">${cCorr} ${results.modelC.prediction}</td>
    </tr>`;
  }).join('');

  document.getElementById('batch-table-wrap').innerHTML = `
    <table class="data-table" aria-label="Summary of tested cases">
      <thead>
        <tr>
          <th>Case</th>
          <th>Subgroup</th>
          <th>System A</th>
          <th>System B</th>
          <th>System C</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:0.72rem; color:var(--color-text-muted); margin-top:var(--space-sm); font-style:italic;">
      Demo mode responses. Illustrative simulation — not Gender Shades data.
    </p>
  `;
}

// ═══════════════════════════════════════════════════════════════
// STAGE 03 — COMPARE / REVEAL
// ═══════════════════════════════════════════════════════════════

function setupStage3() {
  // Restore aggregate vote state
  if (AppState.aggVote) {
    highlightAggCard(AppState.aggVote);
    document.getElementById('btn-look-deeper').disabled = false;
  }

  // Restore subgroup reveal
  if (AppState.subgroupRevealed) {
    showSubgroupReveal(false);
  }
}

function selectAggModel(model) {
  AppState.aggVote = model;

  ['A', 'B', 'C'].forEach(m => {
    const card = document.getElementById(`agg-model${m}`);
    card.classList.toggle('selected', m === model);
    card.setAttribute('aria-pressed', m === model ? 'true' : 'false');
  });

  const conf = document.getElementById('agg-confirmation');
  conf.classList.remove('hidden');
  document.getElementById('agg-chosen-label').textContent = `System ${model}`;
  document.getElementById('btn-look-deeper').disabled = false;
}

function highlightAggCard(model) {
  ['A', 'B', 'C'].forEach(m => {
    const card = document.getElementById(`agg-model${m}`);
    card.classList.toggle('selected', m === model);
    card.setAttribute('aria-pressed', m === model ? 'true' : 'false');
  });
  document.getElementById('agg-confirmation').classList.remove('hidden');
  document.getElementById('agg-chosen-label').textContent = `System ${model}`;
  document.getElementById('btn-look-deeper').disabled = false;
}

function showSubgroupReveal(animate = true) {
  AppState.subgroupRevealed = true;
  const reveal = document.getElementById('subgroup-reveal');
  reveal.classList.remove('hidden');

  renderSubgroupChart(AppState.subgroupModel);

  if (animate) {
    reveal.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function selectSubgroupModel(model) {
  AppState.subgroupModel = model;

  ['A', 'B', 'C'].forEach(m => {
    const tab = document.getElementById(`tab-${m}`);
    tab.classList.toggle('active', m === model);
    tab.setAttribute('aria-selected', m === model ? 'true' : 'false');
  });

  renderSubgroupChart(model);
}

function renderSubgroupChart(model) {
  const modelKey = { A: 'microsoft', B: 'facePlusPlus', C: 'ibm' }[model];
  const modelData = GENDER_SHADES_DATA.models[modelKey];
  const errs = modelData.subgroupErrorRates;

  const maxVal = 40; // fixed scale for visual comparison

  const subgroups = [
    { key: 'darkerFemale',  label: 'Darker-skinned female',  color: 'var(--color-df)', val: errs.darkerFemale },
    { key: 'darkerMale',    label: 'Darker-skinned male',    color: 'var(--color-dm)', val: errs.darkerMale },
    { key: 'lighterFemale', label: 'Lighter-skinned female', color: 'var(--color-lf)', val: errs.lighterFemale },
    { key: 'lighterMale',   label: 'Lighter-skinned male',   color: 'var(--color-lm)', val: errs.lighterMale },
  ];

  const chart = document.getElementById('subgroup-chart');
  chart.innerHTML = subgroups.map(sg => {
    const pct = (sg.val / maxVal) * 100;
    const isDarkerFemale = sg.key === 'darkerFemale';
    const explanation = modelData.errorExplanations ? modelData.errorExplanations[sg.key] : '';

    return `
      <div class="subgroup-row ${isDarkerFemale ? 'highlighted-row' : ''}">
        <div class="subgroup-label" style="${isDarkerFemale ? 'font-weight:600;' : ''}">
          ${sg.label}
          ${isDarkerFemale ? '<span style="font-size:0.65rem;color:var(--color-df);display:block;font-weight:400;">↑ Worst error rate</span>' : ''}
        </div>
        <div class="subgroup-bar-track" role="img" aria-label="${sg.label}: ${sg.val}% error rate">
          <div class="subgroup-bar-fill"
               style="width: 0%; background: ${sg.color}; ${isDarkerFemale ? 'outline: 2px solid var(--color-df); outline-offset:-1px;' : ''}"
               data-target="${pct}">
          </div>
        </div>
        <div class="subgroup-value" style="color: ${sg.color}; font-size: 0.95rem; font-weight:700;">${sg.val}%</div>
      </div>
      <div class="subgroup-explanation-text">
        <span class="info-icon-badge" title="Error rate measures how often the classifier produced an incorrect result for that subgroup.">i</span>
        <span><strong>${sg.val}% error rate:</strong> ${explanation}</span>
      </div>
    `;
  }).join('');

  // Animate bars
  requestAnimationFrame(() => {
    chart.querySelectorAll('.subgroup-bar-fill').forEach(bar => {
      const target = bar.dataset.target;
      setTimeout(() => { bar.style.width = target + '%'; }, 100);
    });
  });

  // Update Best vs Worst Comparison Card (Requirement 7)
  const maxErr = Math.max(...subgroups.map(s => s.val));
  const minErr = Math.min(...subgroups.map(s => s.val));
  const disparity = modelData.errorGapPp || (maxErr - minErr).toFixed(1);

  const bwBestName = document.getElementById('bw-best-name');
  const bwBestRate = document.getElementById('bw-best-rate');
  const bwWorstName = document.getElementById('bw-worst-name');
  const bwWorstRate = document.getElementById('bw-worst-rate');
  const bwGapValue = document.getElementById('bw-gap-value');
  const bwGapSub = document.getElementById('bw-gap-sub');

  if (bwBestName) bwBestName.textContent = modelData.bestSubgroup;
  if (bwBestRate) bwBestRate.textContent = `${minErr}% error rate`;
  if (bwWorstName) bwWorstName.textContent = modelData.worstSubgroup;
  if (bwWorstRate) bwWorstRate.textContent = `${maxErr}% error rate`;
  if (bwGapValue) bwGapValue.textContent = `${disparity} pp`;
  if (bwGapSub) bwGapSub.textContent = `${disparity} percentage-point error gap`;
}

// ── Model Reveal Function (Requirement 4) ────────────────────
function toggleModelReveal() {
  const panel = document.getElementById('model-reveal-panel');
  const btn = document.getElementById('btn-reveal-identities');
  if (!panel || !btn) return;
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !isHidden);
  btn.textContent = isHidden ? 'Hide model identities' : 'Reveal model identities';


  if (isHidden) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ═══════════════════════════════════════════════════════════════
// STAGE 04 — SIMULATOR
// ═══════════════════════════════════════════════════════════════

function setupStage4() {
  renderDatasetChart();
  updateThreshold(AppState.threshold);
}

// ── Dataset Toggle ────────────────────────────────────────────

function setDataset(mode) {
  AppState.dataset = mode;

  document.getElementById('toggle-biased').classList.toggle('active', mode === 'biased');
  document.getElementById('toggle-balanced').classList.toggle('active', mode === 'balanced');
  document.getElementById('toggle-biased').setAttribute('aria-pressed', mode === 'biased');
  document.getElementById('toggle-balanced').setAttribute('aria-pressed', mode === 'balanced');

  const data = SIMULATION_DATA.datasetBalance[mode];
  const descEl = document.getElementById('dataset-desc-short');
  const longEl = document.getElementById('dataset-desc-long');

  if (mode === 'biased') {
    descEl.textContent = 'Training data skewed toward lighter-skinned subjects.';
    longEl.innerHTML = `The current training dataset is skewed toward lighter-skinned subjects
      (${data.composition.lighterFemale}% lighter female, ${data.composition.lighterMale}% lighter male,
      ${data.composition.darkerFemale}% darker female, ${data.composition.darkerMale}% darker male).
      This can lead to better model performance for the over-represented groups.`;
  } else {
    descEl.textContent = 'Training data more evenly distributed across subgroups.';
    longEl.innerHTML = `The training dataset has been adjusted to more evenly represent each subgroup
      (${data.composition.lighterFemale}% lighter female, ${data.composition.lighterMale}% lighter male,
      ${data.composition.darkerFemale}% darker female, ${data.composition.darkerMale}% darker male).
      Note that this is illustrative — in practice, dataset curation involves many other considerations.`;
  }

  renderDatasetChart();
}

function renderDatasetChart() {
  const data = SIMULATION_DATA.datasetBalance[AppState.dataset];
  const errs = data.errorRates;
  const maxVal = 45;

  const subgroups = [
    { label: 'Darker-skinned female',  color: 'var(--color-df)', val: errs.darkerFemale },
    { label: 'Darker-skinned male',    color: 'var(--color-dm)', val: errs.darkerMale },
    { label: 'Lighter-skinned female', color: 'var(--color-lf)', val: errs.lighterFemale },
    { label: 'Lighter-skinned male',   color: 'var(--color-lm)', val: errs.lighterMale },
  ];

  const chart = document.getElementById('dataset-chart');
  chart.innerHTML = subgroups.map(sg => {
    const pct = (sg.val / maxVal) * 100;
    return `
      <div class="subgroup-row">
        <div class="subgroup-label">${sg.label}</div>
        <div class="subgroup-bar-track" role="img" aria-label="${sg.label}: ${sg.val}% error rate">
          <div class="subgroup-bar-fill" style="width: 0%; background: ${sg.color};" data-target="${pct}"></div>
        </div>
        <div class="subgroup-value" style="color:${sg.color};">${sg.val}%</div>
      </div>
    `;
  }).join('');

  requestAnimationFrame(() => {
    chart.querySelectorAll('.subgroup-bar-fill').forEach(bar => {
      const target = bar.dataset.target;
      setTimeout(() => { bar.style.width = target + '%'; }, 100);
    });
  });
}

// ── Threshold ─────────────────────────────────────────────────

function updateThreshold(value) {
  AppState.threshold = parseInt(value);
  document.getElementById('threshold-display').textContent = `Threshold: ${value}%`;
  document.getElementById('threshold-header-val').textContent = `${value}%`;

  const thresholds = SIMULATION_DATA.thresholdData;
  const dfRow = findClosestThreshold(thresholds.darkerFemale, parseInt(value));
  const lmRow = findClosestThreshold(thresholds.lighterMale, parseInt(value));

  animateNumber('thresh-fp-df', dfRow.fp);
  animateNumber('thresh-fn-df', dfRow.fn);
  animateNumber('thresh-fp-lm', lmRow.fp);
  animateNumber('thresh-fn-lm', lmRow.fn);
}

function findClosestThreshold(data, target) {
  return data.reduce((prev, curr) =>
    Math.abs(curr.threshold - target) < Math.abs(prev.threshold - target) ? curr : prev
  );
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  const diff = target - current;
  const steps = 20;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    el.textContent = Math.round(current + (diff * step / steps));
    if (step >= steps) {
      el.textContent = target;
      clearInterval(interval);
    }
  }, 15);
}

// ── Model selector (simulator) ────────────────────────────────

function setSimModel(model) {
  AppState.simModel = model;
  ['A', 'B', 'C'].forEach(m => {
    const btn = document.getElementById(`sim-tab-${m}`);
    btn.classList.toggle('active', m === model);
    btn.setAttribute('aria-pressed', m === model ? 'true' : 'false');
  });
  // Re-render dataset chart with model context (currently model-agnostic in sim)
  renderDatasetChart();
}

// ── Human Review ──────────────────────────────────────────────

function setHumanReview(on) {
  AppState.humanReview = on;

  document.getElementById('toggle-review-off').classList.toggle('active', !on);
  document.getElementById('toggle-review-on').classList.toggle('active', on);
  document.getElementById('toggle-review-off').setAttribute('aria-pressed', !on);
  document.getElementById('toggle-review-on').setAttribute('aria-pressed', on);

  const desc = document.getElementById('human-review-desc');
  const conf = document.getElementById('hr-conf-display');

  if (on) {
    desc.textContent = 'Borderline cases sent for human review.';
    conf.textContent = '63%';
    conf.style.color = 'var(--color-warning)';
  } else {
    desc.textContent = 'Borderline cases handled automatically.';
    conf.textContent = '63%';
  }
}

function selectHROption(option) {
  AppState.hrOptionSelected = option;

  document.getElementById('hr-auto').classList.toggle('selected', option === 'auto');
  document.getElementById('hr-review').classList.toggle('selected', option === 'review');
  document.getElementById('hr-auto').setAttribute('aria-pressed', option === 'auto');
  document.getElementById('hr-review').setAttribute('aria-pressed', option === 'review');

  document.getElementById('hr-explanation').classList.remove('hidden');
}

// ── Deployment Decision ───────────────────────────────────────

function selectDeployment(sysId) {
  AppState.deploymentVote = sysId;

  ['sys1', 'sys2', 'sys3'].forEach(id => {
    const card = document.getElementById(`dep-${id}`);
    card.classList.toggle('selected', id === sysId);
    card.setAttribute('aria-pressed', id === sysId ? 'true' : 'false');
  });

  const explanation = document.getElementById('deployment-explanation');
  explanation.classList.remove('hidden');

  const labels = { sys1: 'System A', sys2: 'System B', sys3: 'System C' };
  const text = document.getElementById('deployment-chosen-text');
  text.innerHTML = `You chose <strong>${labels[sysId]}</strong>. This choice reflects a particular set of priorities. In a different context, the right choice might be different.`;

  explanation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ═══════════════════════════════════════════════════════════════
// STAGE 05 — REFLECTION
// ═══════════════════════════════════════════════════════════════

function setupStage5() {
  // Animate reflection questions
  const questions = document.querySelectorAll('.reflection-q');
  questions.forEach((q, i) => {
    q.classList.remove('visible');
    setTimeout(() => q.classList.add('visible'), 200 + i * 180);
  });

  // Show final reveal after questions
  const finalReveal = document.getElementById('final-reveal');
  finalReveal.classList.remove('visible');
  setTimeout(() => finalReveal.classList.add('visible'), 200 + questions.length * 180 + 400);

  // Show session summary
  renderSessionSummary();
}

function renderSessionSummary() {
  const summaryEl = document.getElementById('summary-choices');

  const modelNames = {
    A: 'System A',
    B: 'System B',
    C: 'System C',
  };

  const items = [];

  if (AppState.initialVote) {
    items.push(`<p><strong>Initial choice (before data):</strong> ${modelNames[AppState.initialVote]}</p>`);
  }

  if (AppState.aggVote) {
    items.push(`<p style="margin-top:6px;"><strong>Based on aggregate accuracy:</strong> ${modelNames[AppState.aggVote]}</p>`);
  }

  if (AppState.initialVote && AppState.aggVote) {
    const changed = AppState.initialVote !== AppState.aggVote;
    items.push(`<p style="margin-top:6px; font-style:italic; color:var(--color-text-muted);">
      ${changed
        ? '↔ Your aggregate-accuracy choice differed from your initial choice.'
        : '→ Your aggregate-accuracy choice matched your initial choice.'}
    </p>`);
  }

  if (AppState.deploymentVote) {
    const depLabels = { sys1: 'System A', sys2: 'System B', sys3: 'System C' };
    items.push(`<p style="margin-top:6px;"><strong>Deployment choice:</strong> ${depLabels[AppState.deploymentVote]}</p>`);
  }

  if (AppState.testedCases.size > 0) {
    items.push(`<p style="margin-top:6px;"><strong>Test cases run:</strong> ${AppState.testedCases.size} of ${SIMULATION_DATA.testCases.length}</p>`);
  }

  if (items.length === 0) {
    items.push('<p style="font-style:italic;">No choices recorded in this session — go back to explore the earlier stages.</p>');
  }

  summaryEl.innerHTML = items.join('');
}

// ═══════════════════════════════════════════════════════════════
// PRESENTATION MODE
// ═══════════════════════════════════════════════════════════════

function togglePresentationMode() {
  AppState.presentationMode = !AppState.presentationMode;
  document.body.classList.toggle('presentation-mode', AppState.presentationMode);
  const btn = document.getElementById('btn-presentation');
  btn.textContent = AppState.presentationMode ? 'Exit presentation' : 'Presentation Mode';

  // Keyboard navigation in presentation mode
  if (AppState.presentationMode) {
    document.addEventListener('keydown', handlePresentationKey);
  } else {
    document.removeEventListener('keydown', handlePresentationKey);
  }
}

function handlePresentationKey(e) {
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    if (AppState.currentStage < 5) goToStage(AppState.currentStage + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    if (AppState.currentStage > 0) goToStage(AppState.currentStage - 1);
  }
}

// ═══════════════════════════════════════════════════════════════
// MODE SWITCHING (DEMO / LIVE)
// ═══════════════════════════════════════════════════════════════

/**
 * To switch to LIVE mode:
 * 1. Set DEMO_MODE=false in your environment/config
 * 2. Call switchToLiveMode() from a developer console or config
 * 3. Ensure /api/predict endpoint is available with API keys configured
 *
 * The mode indicator in the header will update automatically.
 */

function toggleMode() {
  if (AppState.mode === 'demo') {
    switchToLiveMode();
    showModeNotice('Switched to LIVE Mode (connected to /api/predict)');
  } else {
    switchToDemoMode();
    showModeNotice('Switched to DEMO Mode (cached benchmark)');
  }
}

function switchToLiveMode() {
  AppState.mode = 'live';
  updateModeBadge();
  console.info('[AI Fairness Lab] Switched to LIVE mode. API calls will be made to /api/predict');
}

function switchToDemoMode() {
  AppState.mode = 'demo';
  updateModeBadge();
  console.info('[AI Fairness Lab] Switched to DEMO mode. Pre-stored responses will be used.');
}

function updateModeBadge() {
  const badge = document.getElementById('mode-badge');
  const label = document.getElementById('mode-label');
  if (badge && label) {
    badge.className = 'mode-badge ' + AppState.mode;
    label.textContent = AppState.mode.toUpperCase();
    badge.setAttribute('title', AppState.mode === 'live' 
      ? 'LIVE MODE active: Requests are sent to /api/predict. Click to switch to Demo Mode.' 
      : 'DEMO MODE active: Using cached responses. Click to switch to Live Mode.');
  }
}

function showModeNotice(message) {
  // Brief transient notice — not a modal
  const notice = document.createElement('div');
  notice.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    background: var(--color-warning-bg); color: var(--color-warning);
    border: 1px solid var(--color-warning); border-radius: 4px;
    padding: 8px 14px; font-size: 0.78rem; font-family: var(--font-mono);
    z-index: 999; max-width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  notice.textContent = message;
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 4000);
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// ABOUT MODAL CONTROLS
// ═══════════════════════════════════════════════════════════════

function openAboutModal() {
  const modal = document.getElementById('about-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeAboutModal() {
  const modal = document.getElementById('about-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Close modal on Escape key press
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAboutModal();
  }
});

// Close modal on background overlay click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('about-modal');
  if (modal && !modal.classList.contains('hidden') && e.target === modal) {
    closeAboutModal();
  }
});

// ═══════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════

function init() {
  // Show stage 0
  goToStage(0);

  // Check URL for mode override
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'live') {
    switchToLiveMode();
  }

  // Auto-detect server backend if served via HTTP/HTTPS
  if (window.location.protocol.startsWith('http')) {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'ok') {
          console.info(`[AI Fairness Lab] Connected to ${data.server} backend (${data.mode} mode ready).`);
          if (params.get('mode') !== 'demo') {
            switchToLiveMode();
          }
        }
      })
      .catch(() => {
        // Running on a static web server without the /api backend
      });
  }

  // Check URL for direct stage navigation (for presentation use)
  const stageParam = parseInt(params.get('stage'));
  if (!isNaN(stageParam) && stageParam >= 0 && stageParam <= 5) {
    goToStage(stageParam);
  }

  // Presentation mode via URL
  if (params.get('presentation') === 'true') {
    togglePresentationMode();
  }

  console.info(
    '%c[AI Fairness Lab]%c Loaded successfully.\n' +
    'Developer notes:\n' +
    '  switchToLiveMode()  — enable live API calls\n' +
    '  switchToDemoMode()  — return to demo mode\n' +
    '  goToStage(n)        — navigate to stage n (0–5)\n' +
    '  AppState            — inspect current state',
    'font-weight:bold; color:#b84b2b;',
    'color:inherit;'
  );
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
