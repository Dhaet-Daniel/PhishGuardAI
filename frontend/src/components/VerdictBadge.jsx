import {
  getPredictionColor,
  getPredictionLabel,
  getPredictionTone,
} from '../utils/analysis';

const NEUTRAL_KEYS = new Set(['pending', 'failed', 'error', 'unknown']);

const NEUTRAL_TONE = 'bg-slate-500/15 text-slate-300 border border-slate-500/30';

/**
 * Consistent status pill for analysis verdicts.
 *
 * Reuses the prediction theme from utils/analysis.js so every surface
 * (dashboard, history, results) shows the same colors for the same state.
 * The verdict is always spelled out in text next to the color dot so the
 * meaning never depends on color alone.
 */
export default function VerdictBadge({ prediction, score = 0, className = '' }) {
  const normalized = typeof prediction === 'string' ? prediction.trim().toLowerCase() : '';

  if (NEUTRAL_KEYS.has(normalized) || normalized === '') {
    const label = prediction
      ? prediction.charAt(0).toUpperCase() + prediction.slice(1)
      : 'Unknown';
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${NEUTRAL_TONE} ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getPredictionTone(
        prediction,
        score
      )} ${className}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: getPredictionColor(prediction, score) }}
        aria-hidden="true"
      />
      {getPredictionLabel(prediction, score)}
    </span>
  );
}
