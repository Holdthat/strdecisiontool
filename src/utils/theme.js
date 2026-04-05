// Theme system - VHG Brand Guide v4.1
export const APP_VERSION = '3.6.1';

export const darkVars = {
  '--bg-primary':'#0B1120','--bg-secondary':'#151D2E','--bg-tertiary':'#0F172A',
  '--bg-card':'#151D2E','--bg-hover':'rgba(21,29,46,0.8)','--bg-subtle':'rgba(22,122,94,0.08)',
  '--border-primary':'rgba(255,255,255,0.08)','--border-accent':'rgba(22,122,94,0.25)',
  '--text-primary':'#F8FAFC','--text-secondary':'#E2E8F0','--text-muted':'#94A3B8',
  '--text-faint':'#64748B','--text-dim':'#475569',
  '--accent':'#167A5E','--accent-dark':'#0F5E48','--accent-glow':'#1A9070',
  '--gold':'#9A7820','--gold-light':'#B8922E','--gold-subtle':'rgba(154,120,32,0.12)',
  '--green':'#1A9070','--red':'#EF4444','--blue':'#3B82F6','--purple':'#8B5CF6',
  '--tooltip-bg':'#151D2E','--tooltip-border':'rgba(255,255,255,0.1)',
  '--input-bg':'#0F172A','--chart-grid':'rgba(255,255,255,0.06)',
};

export const lightVars = {
  '--bg-primary':'#F5F5F5','--bg-secondary':'#FFFFFF','--bg-tertiary':'#EFEFEF',
  '--bg-card':'#EFEFEF','--bg-hover':'#E8E8E8','--bg-subtle':'rgba(22,122,94,0.06)',
  '--border-primary':'#D8D8D8','--border-accent':'rgba(22,122,94,0.3)',
  '--text-primary':'#0A0A0A','--text-secondary':'#1E293B','--text-muted':'#3A3A3A',
  '--text-faint':'#6B7280','--text-dim':'#94A3B8',
  '--accent':'#167A5E','--accent-dark':'#0F5E48','--accent-glow':'#1A9070',
  '--gold':'#9A7820','--gold-light':'#B8922E','--gold-subtle':'rgba(154,120,32,0.08)',
  '--green':'#167A5E','--red':'#DC2626','--blue':'#3B82F6','--purple':'#8B5CF6',
  '--tooltip-bg':'#FFFFFF','--tooltip-border':'#D8D8D8',
  '--input-bg':'#FFFFFF','--chart-grid':'#E8E8E8',
};

// Chart color helpers
export const chartColors = (dark) => ({
  accent: dark ? '#1A9070' : '#167A5E',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: dark ? '#EF4444' : '#DC2626',
  gold: '#9A7820',
  grid: dark ? 'rgba(255,255,255,0.06)' : '#E8E8E8',
  muted: dark ? '#94A3B8' : '#6B7280',
  orange: '#F97316',
  teal: '#14B8A6',
});
