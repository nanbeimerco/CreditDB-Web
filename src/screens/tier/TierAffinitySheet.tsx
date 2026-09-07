import React, { useState, useMemo } from 'react';
import { TierTableConfig } from '../../types/tier';
import { TierAnalysisEngine, DEPARTMENT_KEYS } from './tierAnalysisEngine';
import { useLanguage } from '../../theme/languageManager';
import { AppStrings } from '../../theme/strings';
import { X, Trophy } from 'lucide-react';

interface TierAffinitySheetProps {
  config: TierTableConfig;
  onDismiss: () => void;
  onStaffClick: (staffName: string, isStudio: boolean) => void;
}

export const TierAffinitySheet: React.FC<TierAffinitySheetProps> = ({
  config,
  onDismiss,
  onStaffClick
}) => {
  const { isEn } = useLanguage();
  const [selectedRole, setSelectedRole] = useState('all');

  const affinityList = useMemo(() => {
    return TierAnalysisEngine.calculateStaffAffinity(config, selectedRole, isEn);
  }, [config, selectedRole, isEn]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] shadow-2xl border border-outlineVariant/35 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-outlineVariant/25 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
              <span>{AppStrings.tierAffinityTitle(isEn)}</span>
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
              {AppStrings.tierAffinitySubtitle(isEn)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Chips */}
        <div className="px-6 py-3 border-b border-outlineVariant/20 overflow-x-auto flex gap-2 scrollbar-none shrink-0">
          {DEPARTMENT_KEYS.map((roleKey: string) => {
            const isSelected = selectedRole === roleKey;

            const label = AppStrings.roleFull(roleKey, isEn);
            return (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm'
                    : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {affinityList.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {isEn
                ? "No staff data available for ranked anime."
                : "Tier表に作品を追加すると、好みのスタッフが集計されます。"}
            </div>
          ) : (
            affinityList.map((item, index) => {
              const rank = index + 1;
              const rankColor =
                rank === 1
                  ? 'bg-[#FFD700] text-[#1F1B04]'
                  : rank === 2
                  ? 'bg-[#C0C0C0] text-[#1F1B04]'
                  : rank === 3
                  ? 'bg-[#CD7F32] text-[#1F1B04]'
                  : 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)]';


              return (
                <div
                  key={`${item.roleKey}_${item.staffName}_${index}`}
                  onClick={() => onStaffClick(item.staffName, item.roleKey === 'studio')}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] border border-outlineVariant/35 hover:border-primary/50 transition-all cursor-pointer group"
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${rankColor}`}
                  >
                    {rank}
                  </div>

                  {/* Staff Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                        {item.staffName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] shrink-0">
                        {AppStrings.roleCompact(item.roleKey, isEn)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">
                      {item.workCount}{isEn ? ' works: ' : '作品: '}
                      {item.works.slice(0, 3).join(', ')}
                      {item.works.length > 3 ? '…' : ''}
                    </div>
                  </div>

                  {/* Weighted Score */}
                  <div className="px-2.5 py-1 rounded-xl bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-bold text-xs shrink-0">
                    {item.weightedScore.toFixed(1)} pt
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
