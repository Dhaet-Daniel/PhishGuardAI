import { formatScore, getPredictionColor, getPredictionLabel } from '../utils/analysis';

export default function ScoreGauge({ score }) {
  const normalizedScore = formatScore(score);
  const color = getPredictionColor(undefined, score);
  const label = getPredictionLabel(undefined, score);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - ((typeof normalizedScore === 'number' ? normalizedScore : 0) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border border-slate-700">
      <div className="relative w-32 h-32 transform -rotate-90">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#334155" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="8" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center transform rotate-90 flex-col">
          <span className="text-3xl font-bold text-white">
            {typeof normalizedScore === 'number' ? normalizedScore : 'N/A'}
          </span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold" style={{ color }}>{label}</h3>
    </div>
  );
}
