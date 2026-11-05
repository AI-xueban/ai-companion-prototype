import React from 'react';

export const RuleEffectSwitch: React.FC<{ label: string; enabled: boolean; disabled?: boolean; onToggle: () => void }> = ({ label, enabled, disabled, onToggle }) => <label className="borrow-rule-enabled"><span>生效</span><button type="button" role="switch" aria-label={`${label}生效`} aria-checked={enabled} disabled={disabled} onClick={onToggle}><span /></button></label>;
