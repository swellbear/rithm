// Cadence Logo Component
// Clean, agricultural-focused design with green color scheme emphasizing rhythm and flow

interface CadenceLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function CadenceLogo({ size = 32, showText = true, className = "" }: CadenceLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        {/* Flowing arrow suggesting movement and optimization */}
        <path d="M 4 16 Q 12 8 20 16 Q 28 24 32 16" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 6 20 Q 14 12 22 20 Q 30 28 34 20" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
        {/* Central point */}
        <circle cx="16" cy="16" r="2" fill="#15803d"/>
        {/* Arrow head */}
        <path d="M 24 12 L 28 16 L 24 20" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {showText && (
        <span className="logo-text-clean font-bold">
          Cadence
        </span>
      )}
    </div>
  );
}