/**
 * REAL RESEARCH DATA — Gender Shades
 *
 * Source: Buolamwini, J. & Gebru, T. (2018).
 * "Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification."
 * Proceedings of Machine Learning Research 81:1–15.
 *
 * These values are reproduced directly from the published paper.
 * DO NOT modify these values.
 */

const GENDER_SHADES_DATA = {
  citation: {
    authors: "Buolamwini, J. & Gebru, T.",
    year: 2018,
    title: "Gender Shades: Intersectional Accuracy Disparities in Commercial Gender Classification",
    venue: "Proceedings of Machine Learning Research 81:1–15",
    url: "http://proceedings.mlr.press/v81/buolamwini18a.html"
  },

  // PPB (Pilot Parliaments Benchmark) dataset composition
  datasetComposition: {
    darkerFemale: 21.3,    // % of PPB benchmark
    darkerMale: 20.2,
    lighterFemale: 28.2,
    lighterMale: 30.3
  },

  // Error rates (%) per subgroup — from the paper
  // Higher number = more errors = worse performance
  models: {
    microsoft: {
      provider: "Microsoft",
      systemLabel: "System A",
      overallAccuracy: 93.7,
      overallErrorRate: 6.3,
      subgroupErrorRates: {
        darkerFemale: 20.8,
        darkerMale: 6.0,
        lighterFemale: 1.7,
        lighterMale: 0.0
      },
      errorExplanations: {
        darkerFemale: "Approximately 1 in 5 evaluated cases were incorrectly classified.",
        darkerMale: "Approximately 1 in 17 evaluated cases were incorrectly classified.",
        lighterFemale: "Approximately 1 in 59 evaluated cases were incorrectly classified.",
        lighterMale: "0 evaluated cases were incorrectly classified."
      },
      bestSubgroup: "Lighter-skinned males",
      worstSubgroup: "Darker-skinned females",
      errorGapPp: 20.8
    },
    facePlusPlus: {
      provider: "Face++",
      systemLabel: "System B",
      overallAccuracy: 93.9,
      overallErrorRate: 6.1,
      subgroupErrorRates: {
        darkerFemale: 34.5,
        darkerMale: 0.7,
        lighterFemale: 9.8,
        lighterMale: 0.8
      },
      errorExplanations: {
        darkerFemale: "Approximately 1 in 3 evaluated cases were incorrectly classified.",
        darkerMale: "Approximately 1 in 143 evaluated cases were incorrectly classified.",
        lighterFemale: "Approximately 1 in 10 evaluated cases were incorrectly classified.",
        lighterMale: "Approximately 1 in 125 evaluated cases were incorrectly classified."
      },
      bestSubgroup: "Darker-skinned males (0.7%) / Lighter-skinned males (0.8%)",
      worstSubgroup: "Darker-skinned females",
      errorGapPp: 33.7
    },
    ibm: {
      provider: "IBM",
      systemLabel: "System C",
      overallAccuracy: 87.9,
      overallErrorRate: 12.1,
      subgroupErrorRates: {
        darkerFemale: 34.7,
        darkerMale: 12.0,
        lighterFemale: 7.1,
        lighterMale: 0.3
      },
      errorExplanations: {
        darkerFemale: "Approximately 1 in 3 evaluated cases were incorrectly classified.",
        darkerMale: "Approximately 1 in 8 evaluated cases were incorrectly classified.",
        lighterFemale: "Approximately 1 in 14 evaluated cases were incorrectly classified.",
        lighterMale: "Approximately 1 in 333 evaluated cases were incorrectly classified."
      },
      bestSubgroup: "Lighter-skinned males",
      worstSubgroup: "Darker-skinned females",
      errorGapPp: 34.4
    }
  },

  // Key finding from the paper
  keyFinding: {
    darkerFemale: {
      datasetShare: 21.3,
      errorShare: { low: 61, high: 72.4 }
    },
    lighterMale: {
      datasetShare: 30.3,
      errorShare: { low: 0, high: 2.4 }
    }
  }
};
