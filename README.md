# AI Fairness Lab

An interactive university seminar experiment for an AI Fairness course.

> **Can you tell which AI is actually fair?**

Students take the role of an AI auditor: they test three AI systems on the same task, compare results, discover subgroup disparities, experiment with thresholds and dataset composition, and reach the central question of the course:
>
> *Fair according to which definition, for whom, and in which context?*

Based on: Buolamwini, J. & Gebru, T. (2018). **Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification.** *Proceedings of Machine Learning Research 81:1–15.*

---

## Table of Contents

1. [Project overview](#project-overview)
2. [Running locally](#running-locally)
3. [How Demo Mode works](#how-demo-mode-works)
4. [How to enable Live Mode](#how-to-enable-live-mode)
5. [Configuring API keys](#configuring-api-keys)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Project structure](#project-structure)
8. [How Gender Shades data is used](#how-gender-shades-data-is-used)
9. [Which values are research data vs simulations](#which-values-are-research-data-vs-simulations)
10. [Adding a new AI model](#adding-a-new-ai-model)
11. [Accessibility](#accessibility)
12. [Ethical guardrails](#ethical-guardrails)

---

## Project overview

This is a **static web application** — HTML, CSS, and vanilla JavaScript. It has no npm dependencies and requires no build step to run locally.

The application contains five interactive stages:

| Stage | Description |
|-------|-------------|
| 01 — Choose | Make an initial trust judgement before seeing data |
| 02 — Test | Run predefined test cases through three AI models |
| 03 — Compare | See aggregate accuracy, then reveal subgroup breakdowns |
| 04 — Audit | Experiment with threshold, dataset balance, human review, deployment |
| 05 — Reflect | Final reflection on fairness metrics and context |

---

## Running locally

You can run AI Fairness Lab using any of the following methods:

### Method 1: Node.js Live Server (Recommended)
Now that Node.js is installed, you can start the live server with real-time audit logging and backend API:

```bash
# Using npm
npm start

# Or directly with node
node local-server.js
```
Then open: **`http://localhost:3000`**

*(On Windows, you can also double-click [`run-node.bat`](run-node.bat))*

---

### Method 2: Python Live Server
If you prefer running via Python 3 (zero extra pip packages required):

```bash
python server.py
```
Then open: **`http://localhost:8000`**

*(On Windows, you can also double-click [`run-python.bat`](run-python.bat))*

---

### Method 3: Direct Browser (No Server / Zero Install)
You can also open [`index.html`](index.html) directly in any modern web browser:
- **Windows**: Double-click `index.html` or run `Start-Process index.html` in PowerShell.
- **Mac/Linux**: `open index.html`

The app automatically operates in self-contained **Demo Mode** when opened as a file.

---

## How Demo Mode works

**Demo Mode** (the default) uses pre-stored model responses from `data/simulationData.js`.

- No external API calls are made
- All model predictions and confidence values are hardcoded illustrative responses
- A small artificial delay simulates real API latency
- The mode indicator in the top-right corner shows **DEMO**

Demo Mode is the **recommended mode for classroom presentations** because:
- It works without internet connectivity
- It produces consistent, predictable results
- There is no risk of API failures or rate limits during the session

---

## How to enable Live Mode

There are multiple ways to toggle Live Mode:

### 1. Click the Header Badge (Direct in UI)
Click the **`DEMO / LIVE`** badge in the upper right of the application header to toggle between Demo and Live Mode at any time.

### 2. URL parameter
Append `?mode=live` to the URL:
```
http://localhost:3000/?mode=live
```

### 3. Automatic Server Auto-Detection
When running `node server.js` or `python server.py`, the lab automatically probes `/api/health` upon load and engages Live Mode connected to your backend.

### 4. Browser console (during a session)
Open the browser developer console and run:
```javascript
switchToLiveMode()
// or
switchToDemoMode()
```

**When Live Mode is active:**
- The application calls `POST /api/predict` on the server
- The server uses the configured API keys to call external providers
- Results are returned to the frontend
- If the API call fails, the app **automatically falls back** to Demo Mode responses

---

## Configuring API keys

1. Copy `.env.example` to `.env`
2. Fill in the API keys for each model provider
3. **Never commit `.env` to version control**

```bash
cp .env.example .env
# Edit .env with your keys
```

See `.env.example` for full documentation of all variables.

### Backend API endpoint

For Live Mode, you need a backend endpoint at `POST /api/predict`.

Request body:
```json
{ "testCaseId": "tc01", "modelKey": "modelA" }
```

Response:
```json
{ "prediction": "Female", "confidence": 94.1, "correct": true }
```

**API keys must only exist server-side.** They must never appear in any frontend JavaScript file.

---

## Deploying to Vercel

### Static deployment (Demo Mode only)

1. Push the project to a GitHub repository
2. Import the repository in [Vercel](https://vercel.com)
3. Set framework to **"Other"** (static site)
4. Set output directory to **`.`** (the project root)
5. Deploy

The application will work immediately in Demo Mode.

### Full deployment (with Live Mode support)

To support Live Mode, you need a backend. Options:

- Add a `/api/predict.js` Vercel serverless function
- Use Next.js API routes
- Use any other backend (Express, Flask, etc.)

Example Vercel serverless function structure:
```
/api/
  predict.js    ← Serverless function (reads API keys from env)
```

Set environment variables in the Vercel dashboard:
- `MODEL_A_API_KEY`
- `MODEL_B_API_KEY`
- `MODEL_C_API_KEY`
- (and any other provider-specific variables)

---

## Project structure

```
ai-fairness-lab/
├── index.html              ← Main application HTML (all stages)
├── styles.css              ← Complete stylesheet
├── app.js                  ← Application logic, state, ModelAdapter
├── data/
│   ├── genderShadesData.js ← REAL research data (do not modify values)
│   └── simulationData.js   ← Illustrative simulation data
├── .env.example            ← Environment variable template
├── README.md               ← This file
└── vercel.json             ← (Optional) Vercel deployment config
```

---

## How Gender Shades data is used

The Gender Shades paper is the primary research reference for this application.

**What is reproduced from the paper:**
- Subgroup error rates for Microsoft, Face++, and IBM (Stage 03)
- Dataset composition of the PPB benchmark (lighter/darker, female/male percentages)
- The key finding about darker-skinned females representing 21.3% of the dataset but approximately 61–72.4% of errors
- All values are clearly labelled with a **Research Data** badge

**What is NOT from the paper:**
- Individual test case responses in Stage 02
- Threshold experiment values (Stage 04)
- Dataset balance experiment values (Stage 04)
- Deployment scenario values (Stage 04)

These are clearly labelled with a **Simulation** badge throughout the application.

---

## Which values are research data vs simulations

| Section | Data type | Source |
|---------|-----------|--------|
| Stage 03: Aggregate accuracy | Research | Gender Shades (2018) |
| Stage 03: Subgroup error rates chart | Research | Gender Shades (2018) |
| Stage 03: 21.3% / 61–72.4% finding | Research | Gender Shades (2018) |
| Stage 02: Test case responses | Simulation | Pre-stored demo values |
| Stage 04: Threshold FP/FN values | Simulation | Illustrative |
| Stage 04: Dataset balance error rates | Simulation | Illustrative |
| Stage 04: Deployment scenarios | Simulation | Illustrative |

The distinction is clearly marked in the UI with data labels and notices at every relevant point.

---

## Adding a new AI model

1. **Add test case responses** to `data/simulationData.js`:
   ```javascript
   demoResponses: {
     // existing
     modelA: { ... },
     modelB: { ... },
     modelC: { ... },
     // new
     modelD: { prediction: "Female", confidence: 91.2, correct: true }
   }
   ```

2. **Add a result card** to the frontend by adding `modelD` to the `['modelA', 'modelB', 'modelC']` array in `renderResultCards()` in `app.js`.

3. **Add an API adapter** in your backend `/api/predict.js`:
   ```javascript
   case 'modelD':
     return callModelDAPI(testCaseId, process.env.MODEL_D_API_KEY);
   ```

4. **Add the API key** to `.env.example` and your deployment environment.

5. **Add a UI element** (vote card, aggregate card) in `index.html`.

The frontend ModelAdapter requires no structural changes — it only needs to know the modelKey string.

---

## Accessibility

- Semantic HTML with ARIA labels throughout
- All charts have text alternatives (accessible summary text and expandable data tables)
- Color is never the sole indicator of information (correct/incorrect shown by icon + text)
- Keyboard accessible — all interactive elements reachable by Tab
- Presentation Mode supports Arrow key navigation for the presenter
- Sufficient color contrast across all text/background combinations
- Responsive design for mobile and tablet
- No audio-only content

---

## Ethical guardrails

This application:

- Does **not** ask students to upload photos of themselves
- Does **not** perform demographic inference on any user
- Does **not** store any user data
- Does **not** claim model disagreement is proof of bias
- Does **not** present simulated values as research findings
- Does **not** claim one fairness metric determines whether a system is ethically fair
- Does **not** label any AI system as objectively "fair" or "unfair" based on one experiment

The purpose is to give students a structured way to experience and reason about the problems described in the Gender Shades study — not to make definitive claims about specific AI systems.

---

## Citation

```
Buolamwini, J. & Gebru, T. (2018).
Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification.
Proceedings of Machine Learning Research 81:1–15.
http://proceedings.mlr.press/v81/buolamwini18a.html
```
