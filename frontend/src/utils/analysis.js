export const SAFE_THRESHOLD = 0.35;
export const SUSPICIOUS_THRESHOLD = 0.58;
export const HIGH_RISK_THRESHOLD = 0.75;

const predictionTheme = {
  safe: {
    label: 'Safe',
    color: '#22c55e',
    tone: 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30',
  },
  suspicious: {
    label: 'Suspicious',
    color: '#eab308',
    tone: 'text-amber-300 bg-amber-500/15 border border-amber-500/30',
  },
  phishing: {
    label: 'Phishing',
    color: '#ef4444',
    tone: 'text-red-300 bg-red-500/15 border border-red-500/30',
  },
};

const riskTheme = {
  low: {
    label: 'Low',
    tone: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
  medium: {
    label: 'Medium',
    tone: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  high: {
    label: 'High',
    tone: 'bg-red-500/15 text-red-300 border border-red-500/30',
  },
};

const normalizeKey = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

export const clampScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(1, score));
};

export const getPredictionKey = (prediction, score = 0) => {
  const normalizedPrediction = normalizeKey(prediction);
  if (predictionTheme[normalizedPrediction]) {
    return normalizedPrediction;
  }

  const normalizedScore = clampScore(score);

  if (normalizedScore < SAFE_THRESHOLD) {
    return 'safe';
  }

  if (normalizedScore < SUSPICIOUS_THRESHOLD) {
    return 'suspicious';
  }

  return 'phishing';
};

export const getPredictionLabel = (prediction, score = 0) =>
  predictionTheme[getPredictionKey(prediction, score)].label;

export const getPredictionTone = (prediction, score = 0) =>
  predictionTheme[getPredictionKey(prediction, score)].tone;

export const getPredictionColor = (prediction, score = 0) =>
  predictionTheme[getPredictionKey(prediction, score)].color;

export const getRiskKey = (riskLevel, score = 0) => {
  const normalizedRiskLevel = normalizeKey(riskLevel);
  if (riskTheme[normalizedRiskLevel]) {
    return normalizedRiskLevel;
  }

  const normalizedScore = clampScore(score);

  if (normalizedScore < SAFE_THRESHOLD) {
    return 'low';
  }

  if (normalizedScore < HIGH_RISK_THRESHOLD) {
    return 'medium';
  }

  return 'high';
};

export const getRiskLabel = (riskLevel, score = 0) =>
  riskTheme[getRiskKey(riskLevel, score)].label;

export const getRiskTone = (riskLevel, score = 0) =>
  riskTheme[getRiskKey(riskLevel, score)].tone;

export const formatPercent = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }

  return `${(value * 100).toFixed(1)}%`;
};

export const formatScore = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }

  return Math.round(clampScore(value) * 100);
};

export const formatTimestamp = (value) => {
  if (!value) return 'Unknown';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
};

export const countByPrediction = (items, predictionKey) =>
  items.filter((item) => getPredictionKey(item?.prediction, item?.score) === predictionKey).length;
