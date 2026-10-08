/**
 * ILLUSTRATIVE SIMULATION DATA
 *
 * IMPORTANT: These values are NOT from the Gender Shades paper.
 * They are generated to demonstrate fairness concepts such as:
 *   - How threshold changes affect error trade-offs
 *   - How dataset composition affects subgroup performance
 *   - Hypothetical deployment scenarios
 *
 * These numbers should NEVER be presented as empirical research findings.
 * All UI elements using this data must carry the label:
 * "Illustrative simulation — not data from Gender Shades."
 */

const SIMULATION_DATA = {

  // Predefined test cases for the testing interface
  // These are controlled demonstration scenarios — not real photos
  testCases: [
    {
      id: "tc01",
      label: "Test Case 01",
      description: "Portrait — controlled lighting, direct gaze",
      skinTone: "lighter",
      gender: "female",
      notes: "High-confidence scenario for most systems",
      // Simulated model responses (DEMO MODE)
      demoResponses: {
        modelA: { prediction: "Female", confidence: 98.2, correct: true },
        modelB: { prediction: "Female", confidence: 96.7, correct: true },
        modelC: { prediction: "Female", confidence: 94.1, correct: true }
      }
    },
    {
      id: "tc02",
      label: "Test Case 02",
      description: "Portrait — controlled lighting, direct gaze",
      skinTone: "darker",
      gender: "female",
      notes: "This subgroup had the highest error rates in the paper",
      demoResponses: {
        modelA: { prediction: "Male", confidence: 71.4, correct: false },
        modelB: { prediction: "Male", confidence: 68.9, correct: false },
        modelC: { prediction: "Female", confidence: 52.3, correct: true }
      }
    },
    {
      id: "tc03",
      label: "Test Case 03",
      description: "Portrait — controlled lighting, direct gaze",
      skinTone: "lighter",
      gender: "male",
      notes: "Lowest error rates in the paper for all three systems",
      demoResponses: {
        modelA: { prediction: "Male", confidence: 99.1, correct: true },
        modelB: { prediction: "Male", confidence: 98.4, correct: true },
        modelC: { prediction: "Male", confidence: 97.8, correct: true }
      }
    },
    {
      id: "tc04",
      label: "Test Case 04",
      description: "Portrait — controlled lighting, direct gaze",
      skinTone: "darker",
      gender: "male",
      notes: "Intermediate performance across models",
      demoResponses: {
        modelA: { prediction: "Male", confidence: 88.6, correct: true },
        modelB: { prediction: "Male", confidence: 99.2, correct: true },
        modelC: { prediction: "Female", confidence: 57.1, correct: false }
      }
    },
    {
      id: "tc05",
      label: "Test Case 05",
      description: "Portrait — controlled lighting, direct gaze",
      skinTone: "medium",
      gender: "ambiguous",
      notes: "Borderline confidence — demonstrates human review scenario",
      demoResponses: {
        modelA: { prediction: "Female", confidence: 63.2, correct: true },
        modelB: { prediction: "Male", confidence: 54.8, correct: false },
        modelC: { prediction: "Female", confidence: 61.0, correct: true }
      }
    }
  ],

  // Illustrative threshold experiment data
  // Shows how FP/FN trade-offs shift as threshold changes from 0% to 100%
  // Values are conceptually plausible but not from research
  thresholdData: {
    // darkerFemale subgroup (illustrative simulation)
    darkerFemale: [
      { threshold: 0,   fp: 55, fn: 0  },
      { threshold: 10,  fp: 52, fn: 0  },
      { threshold: 20,  fp: 48, fn: 1  },
      { threshold: 30,  fp: 45, fn: 2  },
      { threshold: 40,  fp: 38, fn: 5  },
      { threshold: 50,  fp: 30, fn: 10 },
      { threshold: 60,  fp: 22, fn: 18 },
      { threshold: 70,  fp: 14, fn: 28 },
      { threshold: 80,  fp: 8,  fn: 42 },
      { threshold: 90,  fp: 3,  fn: 61 },
      { threshold: 100, fp: 0,  fn: 75 }
    ],
    // lighterMale subgroup (illustrative simulation)
    lighterMale: [
      { threshold: 0,   fp: 18, fn: 0  },
      { threshold: 10,  fp: 16, fn: 0  },
      { threshold: 20,  fp: 14, fn: 0  },
      { threshold: 30,  fp: 12, fn: 1  },
      { threshold: 40,  fp: 8,  fn: 2  },
      { threshold: 50,  fp: 5,  fn: 3  },
      { threshold: 60,  fp: 3,  fn: 5  },
      { threshold: 70,  fp: 1,  fn: 8  },
      { threshold: 80,  fp: 0,  fn: 13 },
      { threshold: 90,  fp: 0,  fn: 22 },
      { threshold: 100, fp: 0,  fn: 32 }
    ]
  },

  // Dataset balance experiment (illustrative)
  datasetBalance: {
    biased: {
      label: "Current (Biased) Dataset",
      composition: { darkerFemale: 7, darkerMale: 8, lighterFemale: 35, lighterMale: 50 },
      // Illustrative error rates with biased training data
      errorRates: { darkerFemale: 38, darkerMale: 14, lighterFemale: 3, lighterMale: 1 }
    },
    balanced: {
      label: "More Representative Dataset",
      composition: { darkerFemale: 25, darkerMale: 25, lighterFemale: 25, lighterMale: 25 },
      // Illustrative error rates with more balanced training
      errorRates: { darkerFemale: 18, darkerMale: 9, lighterFemale: 5, lighterMale: 3 }
    }
  },

  // Deployment decision scenarios (illustrative)
  deploymentScenarios: [
    {
      id: "sys1",
      label: "System Alpha",
      overallAccuracy: 95.4,
      worstSubgroupError: 22.1,
      disparity: 22.1,
      falsePositiveRate: 4.2,
      falseNegativeRate: 0.4,
      notes: "High aggregate accuracy, but significant subgroup disparity"
    },
    {
      id: "sys2",
      label: "System Beta",
      overallAccuracy: 91.2,
      worstSubgroupError: 11.3,
      disparity: 10.8,
      falsePositiveRate: 7.1,
      falseNegativeRate: 1.7,
      notes: "Lower overall accuracy but more consistent across subgroups"
    },
    {
      id: "sys3",
      label: "System Gamma",
      overallAccuracy: 88.7,
      worstSubgroupError: 6.4,
      disparity: 5.9,
      falsePositiveRate: 9.8,
      falseNegativeRate: 1.5,
      notes: "Lowest disparity, highest false positive rate"
    }
  ]
};
