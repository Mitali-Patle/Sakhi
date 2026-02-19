const BAND_COLORS = {
  EXCELLENT: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', badge: 'bg-green-500' },
  GOOD: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', badge: 'bg-blue-500' },
  FAIR: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', badge: 'bg-amber-500' },
  NEEDS_IMPROVEMENT: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', badge: 'bg-red-500' },
};

export default function CreditScoreCard({ score, band, confidence, size = 'md' }) {
  const colors = BAND_COLORS[band] || BAND_COLORS.FAIR;
  const rounded = Math.round(score || 0);
  const isLarge = size === 'lg';

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 flex items-center gap-4`}>
      <div className={`${isLarge ? 'text-5xl font-black' : 'text-3xl font-bold'} ${colors.text} leading-none`}>
        {rounded}
        <span className={`${isLarge ? 'text-xl' : 'text-base'} font-normal`}>/100</span>
      </div>
      <div>
        <div className={`${colors.badge} text-white text-xs font-semibold px-2 py-1 rounded-full inline-block`}>
          {(band || 'FAIR').replace('_', ' ')}
        </div>
        <div className="text-xs text-gray-500 mt-1">Confidence: {confidence || 'LOW'}</div>
      </div>
    </div>
  );
}

export function ScoreBadge({ band }) {
  const colors = BAND_COLORS[band] || BAND_COLORS.FAIR;
  return (
    <span className={`${colors.badge} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}>
      {(band || 'FAIR').replace('_', ' ')}
    </span>
  );
}
