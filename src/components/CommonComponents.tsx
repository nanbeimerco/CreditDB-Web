/**
 * Material 3 共通コンポーネント群 (Android版 CommonComponents.kt に完全準拠)
 */
import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { TierTheme } from '../theme/tierTheme';
import { VerdictSurprise, VerdictNormal, VerdictUnderperform } from '../theme/colors';
import { AppStrings } from '../theme/strings';

interface TierBadgeProps {
  tier: string;
  prefix?: string;
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, prefix = 'Tier ', className = '' }) => {
  const spec = TierTheme.forTier(tier);
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-md border border-outlineVariant/35 bg-surfaceVariant/80 font-sans tracking-tight ${className}`}
      style={{ color: spec.onContainerColor }}
    >
      {prefix}{tier}
    </span>
  );
};

export const LargeTierBadge: React.FC<{ tier: string; className?: string }> = ({ tier, className = '' }) => {
  const spec = TierTheme.forTier(tier);
  return (
    <div
      className={`inline-flex items-center justify-center px-4 py-2 text-2xl font-black rounded-xl border border-outlineVariant/35 bg-surfaceVariant/85 font-sans tracking-tight ${className}`}
      style={{ color: spec.onContainerColor }}
    >
      {tier}
    </div>
  );
};

export const DualTierBadge: React.FC<{ ratingTier: string; cumulativeTier: string; className?: string }> = ({
  ratingTier,
  cumulativeTier,
  className = ''
}) => {
  const rSpec = TierTheme.forTier(ratingTier);
  const cSpec = TierTheme.forTier(cumulativeTier);
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border border-outlineVariant/35 bg-surfaceVariant/80 font-sans ${className}`}>
      <span className="font-extrabold tracking-tight" style={{ color: rSpec.onContainerColor }}>{ratingTier}</span>
      <span className="text-onSurfaceVariant/60">/</span>
      <span className="font-extrabold tracking-tight" style={{ color: cSpec.onContainerColor }}>{cumulativeTier}</span>
    </div>
  );
};

export const VerdictBadge: React.FC<{ verdict: string; isEn?: boolean; className?: string }> = ({
  verdict,
  isEn = false,
  className = ''
}) => {
  const isSurprise = verdict.includes('サプライズ');
  const isUnder = verdict.includes('期待外れ') || verdict.includes('ポテンシャル未達');

  const bg = isSurprise ? 'rgba(130, 217, 167, 0.15)' : isUnder ? 'rgba(242, 139, 130, 0.15)' : 'rgba(148, 163, 184, 0.12)';
  const fg = isSurprise ? VerdictSurprise : isUnder ? VerdictUnderperform : VerdictNormal;
  const border = isSurprise ? 'rgba(130, 217, 167, 0.4)' : isUnder ? 'rgba(242, 139, 130, 0.4)' : 'rgba(148, 163, 184, 0.3)';

  const label = AppStrings.verdictCompact(verdict, isEn);

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded border font-sans ${className}`}
      style={{ backgroundColor: bg, color: fg, borderColor: border }}
    >
      {label}
    </span>
  );
};

export const RoleBadge: React.FC<{ roleKey: string; isEn?: boolean; className?: string }> = ({
  roleKey,
  isEn = false,
  className = ''
}) => {
  const name = AppStrings.roleCompact(roleKey, isEn);
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-medium rounded border border-outlineVariant/35 bg-surfaceVariant/60 text-onSurfaceVariant font-sans ${className}`}>
      {name}
    </span>
  );
};

export const MetricCard: React.FC<{
  title: string;
  value: string;
  subValue?: string | null;
  valueColor?: string;
  className?: string;
}> = ({ title, value, subValue, valueColor, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-2.5 rounded-xl bg-surfaceContainer border border-outlineVariant/35 text-center min-h-[76px] ${className}`}>
      <span className="text-[11px] text-onSurfaceVariant truncate max-w-full font-sans">{title}</span>
      <span
        className="text-base font-extrabold truncate max-w-full my-0.5 font-sans"
        style={{ color: valueColor || 'var(--md-sys-color-on-surface)' }}
      >
        {value}
      </span>
      {subValue && (
        <span className="text-[10px] text-onSurfaceVariant/80 truncate max-w-full font-sans">
          {subValue}
        </span>
      )}
    </div>
  );
};

interface SmartSearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onFilterClick?: () => void;
  hasActiveFilters?: boolean;
  placeholder?: string;
  hideFilterButton?: boolean;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  query,
  onQueryChange,
  onFilterClick,
  hasActiveFilters = false,
  placeholder = '検索...',
  hideFilterButton = false
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 w-full">
      <div className="flex-1 flex items-center h-11 px-3.5 rounded-full bg-surfaceContainer border border-outlineVariant/60 focus-within:border-primary transition-colors">
        <Search className="w-5 h-5 text-onSurfaceVariant flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-sm text-onSurface placeholder:text-onSurfaceVariant/60 ml-2.5"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="p-1 text-onSurfaceVariant hover:text-onSurface rounded-full"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!hideFilterButton && onFilterClick && (
        <button
          onClick={onFilterClick}
          className={`relative flex items-center justify-center w-11 h-11 rounded-full border transition-colors flex-shrink-0 ${
            hasActiveFilters
              ? 'bg-primaryContainer border-primary text-primary'
              : 'bg-surfaceContainer border-outlineVariant/60 text-onSurfaceVariant hover:text-onSurface'
          }`}
          aria-label="Filter"
        >
          <SlidersHorizontal className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      )}
    </div>
  );
};
