import ScoreGauge from './ScoreGauge';

// Human-readable labels for each analysis component
const componentLabels = {
  keyword: 'Suspicious phrases detected',
  sender: 'Sender address looks unusual',
  url: 'Dangerous or suspicious links',
  ml: 'AI analysis flagged risky patterns',
  urgency: 'Creates time pressure or urgency',
  headers: 'Email authentication failed',
  attachments: 'Suspicious attachments found',
  alignment: 'Sender details are inconsistent',
  trust_credit: 'Trustworthy signals found'
};

// Convert a breakdown value (0-1) to a percentage width for the bar
const toPercent = (value) => `${(value * 100).toFixed(0)}%`;

export default function ResultPanel({ result }) {
  if (!result) return null;

  // Collect components that have a non-zero score
  const activeComponents = Object.entries(result.analysis_breakdown || {})
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]); // most significant first

  // Show only top 5 to avoid clutter; add a "show all" toggle if needed
  const displayedComponents = activeComponents.slice(0, 5);
  const hasMore = activeComponents.length > 5;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Overview – Score Gauge + Verdict */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreGauge score={result.score} />
        <div className="col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Analysis Verdict</h2>
            <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
              Confidence: {(result.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-slate-200 text-lg font-medium mb-2">
            {result.summary || result.reason || 'No additional details available.'}
          </p>
          <p className="text-sm text-slate-400 font-mono bg-slate-900 p-2 rounded">
            Category: {result.category}
          </p>
        </div>
      </div>

      {/* Risk & Trust Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-5 rounded-xl border border-red-900/30">
          <h3 className="text-lg font-semibold text-red-400 mb-3">
            <i className="fas fa-exclamation-triangle mr-2"></i>What looks suspicious
          </h3>
          <ul className="space-y-2">
            {result.risk_signals?.length > 0 ? result.risk_signals.map((signal, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start">
                <i className="fas fa-times text-red-500 mr-2 mt-1"></i> {signal}
              </li>
            )) : (
              <li className="text-sm text-slate-500">No suspicious signals detected.</li>
            )}
          </ul>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-green-900/30">
          <h3 className="text-lg font-semibold text-green-400 mb-3">
            <i className="fas fa-shield-check mr-2"></i>What looks trustworthy
          </h3>
          <ul className="space-y-2">
            {result.trust_signals?.length > 0 ? result.trust_signals.map((signal, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start">
                <i className="fas fa-check text-green-500 mr-2 mt-1"></i> {signal}
              </li>
            )) : (
              <li className="text-sm text-slate-500">No trust signals.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Why this score? – Plain language bars */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Why this score?</h3>
        {activeComponents.length === 0 ? (
          <p className="text-sm text-slate-400">All checks passed. No major phishing indicators found.</p>
        ) : (
          <div className="space-y-3">
            {displayedComponents.map(([key, value]) => {
              const percent = toPercent(value);
              const barColor = value > 0.15 ? 'bg-red-500' : value > 0.08 ? 'bg-yellow-500' : 'bg-blue-500';
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm text-slate-300 mb-1">
                    <span>{componentLabels[key] || key}</span>
                    <span className="text-slate-500">{percent}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: percent }}
                    />
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <p className="text-xs text-slate-500 mt-2">
                +{activeComponents.length - 5} more signals (hover for details or enable “Show all”)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
