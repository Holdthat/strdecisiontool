/**
 * STRInvestCalc — Investment Decision Tool
 * =========================================
 * Vacation Home Group
 * 
 * Features:
 * - 4-step guided questionnaire
 * - Hold vs Sell vs 1031 Exchange analysis
 * - Recharts visualizations (line, bar, pie)
 * - Real-time sensitivity sliders
 * - Year-by-year comparison table
 * - Dark / Light theme with localStorage persistence
 * - VHG Brand Guide v4.1 compliant
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════
   THEME SYSTEM — CSS variable objects per Brand Guide v4.1
   ═══════════════════════════════════════════════════════════════ */

const darkVars = {
  '--bg-primary': '#0B1120',
  '--bg-secondary': '#151D2E',
  '--bg-tertiary': '#0F172A',
  '--bg-card': '#151D2E',
  '--bg-hover': 'rgba(21,29,46,0.8)',
  '--bg-subtle': 'rgba(22,122,94,0.08)',
  '--border-primary': 'rgba(255,255,255,0.08)',
  '--border-accent': 'rgba(22,122,94,0.25)',
  '--text-primary': '#F8FAFC',
  '--text-secondary': '#E2E8F0',
  '--text-muted': '#94A3B8',
  '--text-faint': '#64748B',
  '--text-dim': '#475569',
  '--accent': '#167A5E',
  '--accent-dark': '#0F5E48',
  '--accent-glow': '#1A9070',
  '--gold': '#9A7820',
  '--gold-light': '#B8922E',
  '--gold-subtle': 'rgba(154,120,32,0.12)',
  '--green': '#1A9070',
  '--red': '#EF4444',
  '--blue': '#3B82F6',
  '--purple': '#8B5CF6',
  '--amber': '#F59E0B',
  '--nav-bg': 'rgba(11,17,32,0.92)',
  '--tooltip-bg': '#151D2E',
  '--tooltip-border': 'rgba(255,255,255,0.1)',
  '--input-bg': '#0F172A',
  '--chart-grid': 'rgba(255,255,255,0.06)',
};

const lightVars = {
  '--bg-primary': '#F5F5F5',
  '--bg-secondary': '#FFFFFF',
  '--bg-tertiary': '#EFEFEF',
  '--bg-card': '#EFEFEF',
  '--bg-hover': '#E8E8E8',
  '--bg-subtle': 'rgba(22,122,94,0.06)',
  '--border-primary': '#D8D8D8',
  '--border-accent': 'rgba(22,122,94,0.3)',
  '--text-primary': '#0A0A0A',
  '--text-secondary': '#1E293B',
  '--text-muted': '#3A3A3A',
  '--text-faint': '#6B7280',
  '--text-dim': '#94A3B8',
  '--accent': '#167A5E',
  '--accent-dark': '#0F5E48',
  '--accent-glow': '#1A9070',
  '--gold': '#9A7820',
  '--gold-light': '#B8922E',
  '--gold-subtle': 'rgba(154,120,32,0.08)',
  '--green': '#167A5E',
  '--red': '#DC2626',
  '--blue': '#3B82F6',
  '--purple': '#8B5CF6',
  '--amber': '#D97706',
  '--nav-bg': 'rgba(255,255,255,0.92)',
  '--tooltip-bg': '#FFFFFF',
  '--tooltip-border': '#D8D8D8',
  '--input-bg': '#FFFFFF',
  '--chart-grid': '#E8E8E8',
};

/* ═══════════════════════════════════════════════════════════════
   CALCULATION ENGINE
   ═══════════════════════════════════════════════════════════════ */

function calculateHoldScenario(data, years = 10) {
  const cv = parseFloat(data.currentValue) || 0;
  const pp = parseFloat(data.purchasePrice) || 0;
  const rent = parseFloat(data.annualRent) || 0;
  const expenses = parseFloat(data.annualExpenses) || 0;
  const vacancy = parseFloat(data.vacancyRate) || 0;
  const mortBal = parseFloat(data.mortgageBalance) || 0;
  const mortRate = parseFloat(data.mortgageRate) || 0;
  const mortYrs = parseInt(data.mortgageYearsRemaining) || 0;
  const appRate = parseFloat(data.annualAppreciation) || 0.03;

  const monthlyRate = mortRate / 12;
  const totalPayments = mortYrs * 12;
  const monthlyPayment = mortBal > 0 && monthlyRate > 0 && totalPayments > 0
    ? mortBal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1) : 0;
  const annualDebtService = monthlyPayment * 12;

  const depreciableBasis = pp * 0.85;
  const annualDepreciation = depreciableBasis / 27.5;

  const maintenanceSchedule = [];
  for (let y = 1; y <= years; y++) {
    let extra = 0;
    const rAge = (parseInt(data.roofAge) || 0) + y;
    const hAge = (parseInt(data.hvacAge) || 0) + y;
    const wAge = (parseInt(data.waterHeaterAge) || 0) + y;
    if (rAge >= 25 && rAge <= 27) extra += cv * 0.04;
    if (hAge >= 15 && hAge <= 17) extra += cv * 0.02;
    if (wAge >= 12 && wAge <= 13) extra += cv * 0.005;
    maintenanceSchedule.push(extra);
  }

  const yearlyData = [];
  let cumulativeCashFlow = 0;
  let remainingMortgage = mortBal;

  for (let y = 1; y <= years; y++) {
    const propertyValue = cv * Math.pow(1 + appRate, y);
    const grossRent = rent * Math.pow(1.025, y - 1);
    const effectiveRent = grossRent * (1 - vacancy / 100);
    const opExpenses = expenses * Math.pow(1.03, y - 1);
    const maintenance = maintenanceSchedule[y - 1] || 0;
    const debtService = y <= mortYrs ? annualDebtService : 0;

    if (remainingMortgage > 0 && mortRate > 0) {
      const interestThisYear = remainingMortgage * mortRate;
      const principalPaid = Math.min(debtService - interestThisYear, remainingMortgage);
      remainingMortgage = Math.max(0, remainingMortgage - principalPaid);
    }

    const netCashFlow = effectiveRent - opExpenses - maintenance - debtService;
    cumulativeCashFlow += netCashFlow;
    const equity = propertyValue - remainingMortgage;

    yearlyData.push({
      year: y, propertyValue: Math.round(propertyValue),
      grossRent: Math.round(grossRent), effectiveRent: Math.round(effectiveRent),
      opExpenses: Math.round(opExpenses), maintenance: Math.round(maintenance),
      debtService: Math.round(debtService), netCashFlow: Math.round(netCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow), equity: Math.round(equity),
      mortgageBalance: Math.round(remainingMortgage),
      depreciation: Math.round(annualDepreciation),
    });
  }

  return {
    yearlyData,
    totalEquityAtEnd: yearlyData[years - 1]?.equity || 0,
    totalCashFlow: cumulativeCashFlow,
    annualCashFlow: cumulativeCashFlow / years,
    totalWealth: (yearlyData[years - 1]?.equity || 0) + cumulativeCashFlow,
  };
}

function calculateSellScenario(data, years = 10, altReturn = 0.07) {
  const cv = parseFloat(data.currentValue) || 0;
  const pp = parseFloat(data.purchasePrice) || 0;
  const mortBal = parseFloat(data.mortgageBalance) || 0;

  const realtorFees = cv * 0.06;
  const closingCosts = cv * 0.015;
  const totalSellingCosts = realtorFees + closingCosts;

  const depreciableBasis = pp * 0.85;
  const yearsOwned = parseInt(data.yearsOwned) || 1;
  const totalDepreciation = Math.min((depreciableBasis / 27.5) * yearsOwned, depreciableBasis);
  const adjustedBasis = pp - totalDepreciation;
  const capitalGain = cv - adjustedBasis;
  const depreciationRecapture = totalDepreciation * 0.25;
  const longTermGainsTax = Math.max(0, capitalGain - totalDepreciation) * 0.15;
  const totalTax = depreciationRecapture + longTermGainsTax;

  const grossProceeds = cv - mortBal;
  const netProceeds = grossProceeds - totalSellingCosts - totalTax;

  const yearlyData = [];
  for (let y = 1; y <= years; y++) {
    const investedValue = netProceeds * Math.pow(1 + altReturn, y);
    yearlyData.push({
      year: y, investedValue: Math.round(investedValue),
      annualReturn: Math.round(investedValue * altReturn),
    });
  }

  return {
    grossProceeds: Math.round(grossProceeds),
    sellingCosts: Math.round(totalSellingCosts),
    capitalGainsTax: Math.round(totalTax),
    depreciationRecapture: Math.round(depreciationRecapture),
    netProceeds: Math.round(netProceeds),
    yearlyData,
    totalWealthAtEnd: yearlyData[years - 1]?.investedValue || 0,
  };
}

function calculate1031Scenario(data, years = 10) {
  const cv = parseFloat(data.currentValue) || 0;
  const mortBal = parseFloat(data.mortgageBalance) || 0;
  const replacementValue = parseFloat(data.replacementValue) || cv * 1.2;
  const replacementRent = parseFloat(data.replacementRent) || parseFloat(data.annualRent) * 1.1;
  const replacementExpenses = parseFloat(data.replacementExpenses) || parseFloat(data.annualExpenses) * 0.9;
  const appRate = parseFloat(data.annualAppreciation) || 0.03;

  const exchangeCosts = cv * 0.03;
  const equityTransferred = cv - mortBal - exchangeCosts;
  const newMortgage = replacementValue - equityTransferred;

  const monthlyRate = 0.065 / 12;
  const totalPayments = 360;
  const monthlyPayment = newMortgage > 0
    ? newMortgage * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1) : 0;
  const annualDebtService = monthlyPayment * 12;

  const yearlyData = [];
  let cumulativeCashFlow = 0;
  let remainingMortgage = newMortgage;

  for (let y = 1; y <= years; y++) {
    const propValue = replacementValue * Math.pow(1 + appRate, y);
    const rent = replacementRent * Math.pow(1.025, y - 1);
    const expenses = replacementExpenses * Math.pow(1.03, y - 1);
    const netCash = rent * 0.85 - expenses - annualDebtService;
    cumulativeCashFlow += netCash;

    if (remainingMortgage > 0) {
      const interest = remainingMortgage * 0.065;
      const principal = Math.min(annualDebtService - interest, remainingMortgage);
      remainingMortgage = Math.max(0, remainingMortgage - principal);
    }

    yearlyData.push({
      year: y, propertyValue: Math.round(propValue),
      netCashFlow: Math.round(netCash),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      equity: Math.round(propValue - remainingMortgage),
    });
  }

  return {
    replacementValue: Math.round(replacementValue),
    equityTransferred: Math.round(equityTransferred),
    newMortgage: Math.round(newMortgage),
    exchangeCosts: Math.round(exchangeCosts),
    taxDeferred: Math.round(cv * 0.15),
    yearlyData,
    totalWealth: (yearlyData[years - 1]?.equity || 0) + cumulativeCashFlow,
  };
}

/* ═══════════════════════════════════════════════════════════════
   FORMATTERS
   ═══════════════════════════════════════════════════════════════ */

const fmt = (num) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(num || 0);

const fmtK = (num) => {
  const n = num || 0;
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return fmt(n);
};

/* ═══════════════════════════════════════════════════════════════
   VHG LOGOS — Brand Guide compliant
   ═══════════════════════════════════════════════════════════════ */

const VHGLogoMark = ({ size = 36 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ flexShrink: 0 }}>
    <rect width="64" height="64" rx="12" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="1"/>
    <path d="M14 38 L22 26 L28 31 L34 20 L40 27 L44 23 L50 38" fill="none" stroke="#167A5E" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="12" y1="38" x2="52" y2="38" stroke="#9A7820" strokeWidth="0.7"/>
    <text x="32" y="50" textAnchor="middle" fill="var(--text-primary)" fontFamily="Georgia, serif" fontSize="8" fontWeight="700" letterSpacing="0.04em">VH</text>
    <text x="32" y="58" textAnchor="middle" fill="#9A7820" fontFamily="Georgia, serif" fontSize="7" fontStyle="italic">group</text>
  </svg>
);

const VHGFooterLogo = ({ dark }) => {
  const textFill = dark ? '#FFFFFF' : '#1A1A1A';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 170" width="220" height="117">
      <path d="M85 28 L110 12 L128 22 L155 4 L178 18 L195 10 L235 28" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1="80" y1="28" x2="240" y2="28" stroke="#C8962E" strokeWidth="0.8"/>
      <text x="160" y="62" textAnchor="middle" fill={textFill} fontFamily="Georgia, serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">VACATION</text>
      <text x="160" y="95" textAnchor="middle" fill={textFill} fontFamily="Georgia, serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">HOME</text>
      <line x1="60" y1="103" x2="112" y2="103" stroke="#C8962E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="60" y1="109" x2="98" y2="109" stroke="#C8962E" strokeWidth="1" strokeLinecap="round"/>
      <text x="165" y="138" textAnchor="middle" fill="#C8962E" fontFamily="Georgia, serif" fontSize="32" fontStyle="italic">group</text>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
    borderRadius: 10, padding: '20px 24px', ...style,
  }}>{children}</div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16,
  }}>{children}</div>
);

const GoldDivider = ({ width = 120, mb = 20 }) => (
  <div style={{
    width, height: 1, margin: `0 auto ${mb}px`,
    background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
  }} />
);

const InputField = ({ label, name, value, onChange, type = 'text', prefix, suffix, placeholder, error }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block', fontSize: 13, fontWeight: 600,
      color: 'var(--text-secondary)', marginBottom: 6,
    }}>{label}</label>
    <div style={{ position: 'relative' }}>
      {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>{prefix}</span>}
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px',
          paddingLeft: prefix ? 28 : 12, paddingRight: suffix ? 40 : 12,
          background: 'var(--input-bg)',
          border: `1px solid ${error ? 'var(--red)' : 'var(--border-primary)'}`,
          borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          fontFamily: "'JetBrains Mono', monospace",
        }} />
      {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>{suffix}</span>}
    </div>
    {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{error}</p>}
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>
    <select name={name} value={value} onChange={onChange} style={{
      width: '100%', padding: '10px 12px', background: 'var(--input-bg)',
      border: '1px solid var(--border-primary)', borderRadius: 8,
      color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Slider = ({ label, min, max, step, value, onChange, displayValue }) => (
  <div style={{
    marginBottom: 20, padding: 14, background: 'var(--bg-card)',
    borderRadius: 8, border: '1px solid var(--border-primary)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)',
      }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{displayValue}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={onChange}
      style={{
        width: '100%', height: 6, borderRadius: 3,
        background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((value - min) / (max - min)) * 100}%, var(--border-primary) ${((value - min) / (max - min)) * 100}%, var(--border-primary) 100%)`,
      }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>
      <span>{min}</span><span>{max}</span>
    </div>
  </div>
);

const ThemeToggle = ({ dark, setDark }) => (
  <button onClick={() => setDark(!dark)} style={{
    width: 36, height: 36, borderRadius: 8,
    border: '1px solid var(--border-primary)',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>{dark ? '\u2600' : '\u263E'}</button>
);

/* ═══════════════════════════════════════════════════════════════
   VHG FOOTER — from Footer Template
   ═══════════════════════════════════════════════════════════════ */

const VHGFooter = ({ dark }) => (
  <footer style={{
    borderTop: '1px solid var(--border-primary)', padding: '32px 24px',
    textAlign: 'center', marginTop: 40,
  }}>
    <div style={{ marginBottom: 0 }}><VHGFooterLogo dark={dark} /></div>
    <div style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
      Your Retreat, Our Expertise
    </div>
    <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 28, fontFamily: "'DM Mono', monospace" }}>
      Real Broker NH, LLC
    </div>
    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
      STR<span style={{ color: 'var(--gold)' }}>Invest</span>Calc
    </div>
    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>by Vacation Home Group</div>
    <GoldDivider />
    <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginBottom: 20, flexWrap: 'wrap' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Joe Mori</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>REALTOR&reg; &middot; Vacation Home Specialist</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          <a href="tel:6039017777" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>603-901-7777</a>
          <span style={{ margin: '0 4px' }}>&middot;</span>
          <a href="mailto:joemori@vacationhome.group" style={{ color: 'var(--gold)', textDecoration: 'none' }}>joemori@vacationhome.group</a>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Dino Amato</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>REALTOR&reg; &middot; Vacation Home Specialist</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          <a href="tel:6032751191" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>603-275-1191</a>
          <span style={{ margin: '0 4px' }}>&middot;</span>
          <a href="mailto:dinoamato@vacationhome.group" style={{ color: 'var(--gold)', textDecoration: 'none' }}>dinoamato@vacationhome.group</a>
        </div>
      </div>
    </div>
    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
      <a href="https://www.vacationhomegroup.net" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>vacationhomegroup.net</a>
      <span style={{ margin: '0 6px' }}>&middot;</span>
      <a href="https://www.vacationhome.group" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>vacationhome.group</a>
      <span style={{ margin: '0 6px' }}>&middot;</span>
      <span>Office: <a href="tel:8554500442" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>855-450-0442</a></span>
    </div>
    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 10px' }}>
      Joe Mori &amp; Dino Amato, Real Broker NH. Each office is independently owned and operated.
    </p>
    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 10px' }}>
      Projections are estimates based on user-provided inputs. This tool does not constitute financial or investment advice. Consult a qualified real estate professional before making investment decisions.
    </p>
    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto' }}>
      By using this platform, you consent to the collection of your email address and preferences for the purpose of delivering personalized market analysis. We do not sell or share your information with third parties.
    </p>
  </footer>
);

/* ═══════════════════════════════════════════════════════════════
   NAV BAR
   ═══════════════════════════════════════════════════════════════ */

const NavBar = ({ dark, setDark, subtitle }) => (
  <nav style={{
    borderBottom: '1px solid var(--border-primary)', padding: '16px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: dark
      ? 'linear-gradient(135deg, #0B1120, #151D2E)'
      : 'linear-gradient(135deg, #FFFFFF, #F5F5F5)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <VHGLogoMark size={36} />
      <div>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          STR<span style={{ color: 'var(--gold)' }}>Invest</span>Calc
        </span>
        <div style={{ fontSize: 11, color: 'var(--gold)', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
          by Vacation Home Group
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {subtitle && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</span>}
      <ThemeToggle dark={dark} setDark={setDark} />
    </div>
  </nav>
);

/* ═══════════════════════════════════════════════════════════════
   QUESTIONNAIRE
   ═══════════════════════════════════════════════════════════════ */

const Questionnaire = ({ onComplete, initialData, dark, setDark }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [form, setForm] = useState(initialData || {
    propertyType: 'single-family', location: '', purchasePrice: '', purchaseDate: '',
    currentValue: '', yearsOwned: '', managementStyle: 'self-managed', annualRent: '',
    annualExpenses: '', vacancyRate: '10', mortgageBalance: '', mortgageRate: '',
    mortgageYearsRemaining: '', depreciation: '', roofAge: '5', hvacAge: '5',
    waterHeaterAge: '3', capRate: '', annualAppreciation: '3',
    alternativeInvestment: 'stock-market', alternativeReturn: '7',
    exitStrategy: 'undecided', replacementValue: '', replacementRent: '', replacementExpenses: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.location) e.location = 'Required';
      if (!form.purchasePrice || form.purchasePrice <= 0) e.purchasePrice = 'Required';
      if (!form.currentValue || form.currentValue <= 0) e.currentValue = 'Required';
      if (!form.annualRent || form.annualRent <= 0) e.annualRent = 'Required';
    }
    if (step === 2) {
      if (!form.annualExpenses && form.annualExpenses !== '0') e.annualExpenses = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, totalSteps)); };
  const prev = () => setStep(s => Math.max(s - 1, 1));
  const submit = () => { if (validate()) onComplete(form); };

  const ProgressBar = () => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        {['Property', 'Financials', 'Market', 'Review'].map((label, i) => (
          <div key={i} style={{
            fontSize: 11, fontWeight: step > i ? 700 : 500,
            color: step > i ? 'var(--accent)' : step === i + 1 ? 'var(--gold)' : 'var(--text-muted)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace",
          }}>{label}</div>
        ))}
      </div>
      <div style={{ height: 3, background: 'var(--border-primary)', borderRadius: 2 }}>
        <div style={{
          height: '100%', width: `${(step / totalSteps) * 100}%`,
          background: 'linear-gradient(90deg, var(--accent), var(--gold))',
          borderRadius: 2, transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      <NavBar dark={dark} setDark={setDark} />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>
        <ProgressBar />
        <Card>
          {step === 1 && (<>
            <SectionLabel>Property &amp; Portfolio</SectionLabel>
            <SelectField label="Property Type" name="propertyType" value={form.propertyType} onChange={handleChange} options={[
              { value: 'single-family', label: 'Single Family' }, { value: 'condo', label: 'Condo / Townhome' },
              { value: 'multi-family', label: 'Multi-Family' }, { value: 'cabin', label: 'Cabin / Vacation Home' },
            ]} />
            <InputField label="Location (City, State)" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Lincoln, NH" error={errors.location} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Purchase Price" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} type="number" prefix="$" error={errors.purchasePrice} />
              <InputField label="Current Market Value" name="currentValue" value={form.currentValue} onChange={handleChange} type="number" prefix="$" error={errors.currentValue} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Years Owned" name="yearsOwned" value={form.yearsOwned} onChange={handleChange} type="number" suffix="yrs" />
              <InputField label="Annual Gross Rent" name="annualRent" value={form.annualRent} onChange={handleChange} type="number" prefix="$" error={errors.annualRent} />
            </div>
            <SelectField label="Management Style" name="managementStyle" value={form.managementStyle} onChange={handleChange} options={[
              { value: 'self-managed', label: 'Self-Managed' }, { value: 'property-manager', label: 'Property Manager (20-25%)' }, { value: 'hybrid', label: 'Hybrid' },
            ]} />
          </>)}

          {step === 2 && (<>
            <SectionLabel>Financial Snapshot</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Annual Operating Expenses" name="annualExpenses" value={form.annualExpenses} onChange={handleChange} type="number" prefix="$" error={errors.annualExpenses} />
              <InputField label="Vacancy Rate" name="vacancyRate" value={form.vacancyRate} onChange={handleChange} type="number" suffix="%" />
            </div>
            <SectionLabel>Mortgage Details</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Mortgage Balance" name="mortgageBalance" value={form.mortgageBalance} onChange={handleChange} type="number" prefix="$" />
              <InputField label="Interest Rate" name="mortgageRate" value={form.mortgageRate} onChange={handleChange} type="number" suffix="%" />
            </div>
            <InputField label="Years Remaining" name="mortgageYearsRemaining" value={form.mortgageYearsRemaining} onChange={handleChange} type="number" suffix="yrs" />
            <SectionLabel>Property Condition</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <InputField label="Roof Age" name="roofAge" value={form.roofAge} onChange={handleChange} type="number" suffix="yrs" />
              <InputField label="HVAC Age" name="hvacAge" value={form.hvacAge} onChange={handleChange} type="number" suffix="yrs" />
              <InputField label="Water Heater" name="waterHeaterAge" value={form.waterHeaterAge} onChange={handleChange} type="number" suffix="yrs" />
            </div>
          </>)}

          {step === 3 && (<>
            <SectionLabel>Market Assumptions</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InputField label="Annual Appreciation" name="annualAppreciation" value={form.annualAppreciation} onChange={handleChange} type="number" suffix="%" />
              <InputField label="Cap Rate (optional)" name="capRate" value={form.capRate} onChange={handleChange} type="number" suffix="%" />
            </div>
            <SectionLabel>Alternative Investment</SectionLabel>
            <SelectField label="If you sell, where would you invest?" name="alternativeInvestment" value={form.alternativeInvestment} onChange={handleChange} options={[
              { value: 'stock-market', label: 'Stock Market (S&P 500)' }, { value: 'bonds', label: 'Bonds / Fixed Income' },
              { value: 'another-property', label: 'Another Property (non-1031)' }, { value: 'mixed', label: 'Mixed Portfolio' },
            ]} />
            <InputField label="Expected Annual Return" name="alternativeReturn" value={form.alternativeReturn} onChange={handleChange} type="number" suffix="%" />
            <SectionLabel>Exit Strategy Interest</SectionLabel>
            <SelectField label="What are you considering?" name="exitStrategy" value={form.exitStrategy} onChange={handleChange} options={[
              { value: 'undecided', label: "Not sure yet \u2014 show me the data" }, { value: 'hold', label: 'Leaning toward holding' },
              { value: 'sell', label: 'Leaning toward selling' }, { value: '1031', label: 'Interested in 1031 Exchange' },
            ]} />
            {form.exitStrategy === '1031' && (<>
              <SectionLabel>1031 Exchange \u2014 Replacement Property</SectionLabel>
              <InputField label="Replacement Property Value" name="replacementValue" value={form.replacementValue} onChange={handleChange} type="number" prefix="$" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InputField label="Expected Annual Rent" name="replacementRent" value={form.replacementRent} onChange={handleChange} type="number" prefix="$" />
                <InputField label="Expected Annual Expenses" name="replacementExpenses" value={form.replacementExpenses} onChange={handleChange} type="number" prefix="$" />
              </div>
            </>)}
          </>)}

          {step === 4 && (<>
            <SectionLabel>Review Your Inputs</SectionLabel>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 2 }}>
              <p><strong style={{ color: 'var(--gold)' }}>Property:</strong> {form.propertyType} in {form.location || '\u2014'}</p>
              <p><strong style={{ color: 'var(--gold)' }}>Purchase Price:</strong> {fmt(form.purchasePrice)}</p>
              <p><strong style={{ color: 'var(--gold)' }}>Current Value:</strong> {fmt(form.currentValue)}</p>
              <p><strong style={{ color: 'var(--gold)' }}>Annual Rent:</strong> {fmt(form.annualRent)}</p>
              <p><strong style={{ color: 'var(--gold)' }}>Annual Expenses:</strong> {fmt(form.annualExpenses)}</p>
              <p><strong style={{ color: 'var(--gold)' }}>Mortgage:</strong> {fmt(form.mortgageBalance)} @ {form.mortgageRate || 0}%</p>
              <p><strong style={{ color: 'var(--gold)' }}>Appreciation:</strong> {form.annualAppreciation}% / year</p>
              <p><strong style={{ color: 'var(--gold)' }}>Alt. Return:</strong> {form.alternativeReturn}%</p>
              <p><strong style={{ color: 'var(--gold)' }}>Strategy:</strong> {form.exitStrategy}</p>
            </div>
            <div style={{
              marginTop: 20, padding: 12, borderRadius: 8,
              background: 'var(--bg-subtle)', border: '1px solid var(--border-accent)',
              fontSize: 13, color: 'var(--text-muted)',
            }}>
              Click "Analyze" to run your Hold vs. Sell{form.exitStrategy === '1031' ? ' vs. 1031 Exchange' : ''} comparison. You can adjust assumptions anytime from the dashboard.
            </div>
          </>)}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
            {step > 1 ? (
              <button onClick={prev} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>&larr; Back</button>
            ) : <div />}
            {step < totalSteps ? (
              <button onClick={next} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Continue &rarr;</button>
            ) : (
              <button onClick={submit} style={{ padding: '12px 36px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}>Analyze &rarr;</button>
            )}
          </div>
        </Card>
        <VHGFooter dark={dark} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

const Dashboard = ({ formData, holdResult, sellResult, exchangeResult, onEditAssumptions, dark, setDark }) => {
  const show1031 = !!exchangeResult;

  const [sens, setSens] = useState({
    rentGrowth: 2.5, vacancyRate: parseFloat(formData.vacancyRate) || 10,
    maintenanceMult: 1.0, appreciation: parseFloat(formData.annualAppreciation) || 3,
    altReturn: parseFloat(formData.alternativeReturn) || 7, yearsToHold: 10,
  });

  const results = useMemo(() => {
    const adj = { ...formData, annualAppreciation: sens.appreciation / 100, vacancyRate: sens.vacancyRate, alternativeReturn: sens.altReturn / 100 };
    const hold = calculateHoldScenario(adj, sens.yearsToHold);
    const sell = calculateSellScenario(adj, sens.yearsToHold, sens.altReturn / 100);
    const exch = show1031 ? calculate1031Scenario(adj, sens.yearsToHold) : null;
    return { hold, sell, exch };
  }, [formData, sens, show1031]);

  const { hold, sell, exch } = results;

  const rec = useMemo(() => {
    const holdW = hold.totalWealth, sellW = sell.totalWealthAtEnd, exchW = exch?.totalWealth || 0;
    if (show1031 && exchW > holdW && exchW > sellW) return { text: '1031 Exchange', color: 'var(--purple)' };
    if (holdW > sellW) return { text: 'Hold Property', color: 'var(--accent)' };
    return { text: 'Sell & Invest', color: 'var(--blue)' };
  }, [hold, sell, exch, show1031]);

  const chartData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= sens.yearsToHold; y++) {
      const pt = { year: y };
      if (y === 0) {
        pt.hold = parseFloat(formData.currentValue) - parseFloat(formData.mortgageBalance || 0);
        pt.sell = sell.netProceeds;
        if (show1031) pt.exchange = exch.equityTransferred;
      } else {
        pt.hold = (hold.yearlyData[y - 1]?.equity || 0) + (hold.yearlyData[y - 1]?.cumulativeCashFlow || 0);
        pt.sell = sell.yearlyData[y - 1]?.investedValue;
        if (show1031) pt.exchange = (exch.yearlyData[y - 1]?.equity || 0) + (exch.yearlyData[y - 1]?.cumulativeCashFlow || 0);
      }
      data.push(pt);
    }
    return data;
  }, [hold, sell, exch, sens.yearsToHold, formData, show1031]);

  const cashFlowData = useMemo(() => hold.yearlyData.map(d => ({
    year: `Yr ${d.year}`, revenue: d.effectiveRent,
    expenses: -(d.opExpenses + d.maintenance), debtService: -d.debtService,
  })), [hold]);

  const expensePieData = useMemo(() => {
    const yr1 = hold.yearlyData[0] || {};
    return [
      { name: 'Operating', value: yr1.opExpenses || 0, color: '#3B82F6' },
      { name: 'Maintenance', value: yr1.maintenance || 0, color: '#9A7820' },
      { name: 'Debt Service', value: yr1.debtService || 0, color: dark ? '#EF4444' : '#DC2626' },
    ].filter(d => d.value > 0);
  }, [hold, dark]);

  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: 8, padding: 12, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <p style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>Year {label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {fmt(p.value)}</p>)}
      </div>
    );
  }, []);

  const accentHex = dark ? '#1A9070' : '#167A5E';
  const blueHex = '#3B82F6';
  const purpleHex = '#8B5CF6';
  const redHex = dark ? '#EF4444' : '#DC2626';
  const goldHex = '#9A7820';
  const gridHex = dark ? 'rgba(255,255,255,0.06)' : '#E8E8E8';
  const mutedHex = dark ? '#94A3B8' : '#6B7280';

  return (
    <div style={{ minHeight: '100vh' }}>
      <NavBar dark={dark} setDark={setDark} subtitle={`${formData.propertyType} in ${formData.location}`} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={onEditAssumptions} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>&larr; Edit Assumptions</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          <Card><SectionLabel>Hold Equity + Cash Flow</SectionLabel><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{fmtK(hold.totalWealth)}</div><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sens.yearsToHold}-year total wealth</p></Card>
          <Card><SectionLabel>Sell &amp; Invest Value</SectionLabel><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--blue)' }}>{fmtK(sell.totalWealthAtEnd)}</div><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Net proceeds invested at {sens.altReturn}%</p></Card>
          {show1031 && <Card><SectionLabel>1031 Exchange</SectionLabel><div style={{ fontSize: 28, fontWeight: 700, color: 'var(--purple)' }}>{fmtK(exch.totalWealth)}</div><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Tax-deferred: {fmtK(exch.taxDeferred)}</p></Card>}
          <Card style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-accent)' }}><SectionLabel>Recommendation</SectionLabel><div style={{ fontSize: 24, fontWeight: 700, color: rec.color }}>{rec.text}</div><p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Advantage: {fmtK(Math.abs(hold.totalWealth - sell.totalWealthAtEnd))}</p></Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div>
            <Card style={{ marginBottom: 24 }}>
              <SectionLabel>Cumulative Wealth Comparison</SectionLabel>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridHex} />
                  <XAxis dataKey="year" stroke={mutedHex} fontSize={12} label={{ value: 'Year', position: 'insideBottom', offset: -5, fill: mutedHex }} />
                  <YAxis stroke={mutedHex} fontSize={11} tickFormatter={fmtK} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="hold" name="Hold" stroke={accentHex} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="sell" name="Sell & Invest" stroke={blueHex} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                  {show1031 && <Line type="monotone" dataKey="exchange" name="1031 Exchange" stroke={purpleHex} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ marginBottom: 24 }}>
              <SectionLabel>Annual Cash Flow Breakdown</SectionLabel>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridHex} />
                  <XAxis dataKey="year" stroke={mutedHex} fontSize={11} />
                  <YAxis stroke={mutedHex} fontSize={11} tickFormatter={fmtK} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill={accentHex} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill={redHex} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debtService" name="Debt Service" fill={goldHex} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card>
                <SectionLabel>Year 1 Expense Split</SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {expensePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <SectionLabel>Sale Proceeds Breakdown</SectionLabel>
                <div style={{ fontSize: 13, lineHeight: 2.2, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Gross Equity</span><span>{fmt(sell.grossProceeds)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--red)' }}><span>&minus; Selling Costs</span><span>{fmt(sell.sellingCosts)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--red)' }}><span>&minus; Capital Gains Tax</span><span>{fmt(sell.capitalGainsTax)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-primary)', paddingTop: 8, marginTop: 8, fontWeight: 700, color: 'var(--accent)' }}><span>Net to Invest</span><span>{fmt(sell.netProceeds)}</span></div>
                </div>
              </Card>
            </div>
          </div>

          <div>
            <Card>
              <SectionLabel>Sensitivity Sliders</SectionLabel>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Adjust assumptions &mdash; charts update in real time.</p>
              <Slider label="Rent Growth" min={-2} max={6} step={0.5} value={sens.rentGrowth} displayValue={`${sens.rentGrowth}%`} onChange={(e) => setSens({ ...sens, rentGrowth: parseFloat(e.target.value) })} />
              <Slider label="Vacancy Rate" min={0} max={25} step={1} value={sens.vacancyRate} displayValue={`${sens.vacancyRate}%`} onChange={(e) => setSens({ ...sens, vacancyRate: parseFloat(e.target.value) })} />
              <Slider label="Maintenance Mult" min={0.5} max={2.0} step={0.1} value={sens.maintenanceMult} displayValue={`${sens.maintenanceMult}\u00D7`} onChange={(e) => setSens({ ...sens, maintenanceMult: parseFloat(e.target.value) })} />
              <Slider label="Appreciation" min={-1} max={6} step={0.5} value={sens.appreciation} displayValue={`${sens.appreciation}%`} onChange={(e) => setSens({ ...sens, appreciation: parseFloat(e.target.value) })} />
              <Slider label="Alt. Return" min={2} max={12} step={0.5} value={sens.altReturn} displayValue={`${sens.altReturn}%`} onChange={(e) => setSens({ ...sens, altReturn: parseFloat(e.target.value) })} />
              <Slider label="Years to Hold" min={1} max={10} step={1} value={sens.yearsToHold} displayValue={`${sens.yearsToHold} yrs`} onChange={(e) => setSens({ ...sens, yearsToHold: parseInt(e.target.value) })} />
              <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: 'var(--gold-subtle)', border: '1px solid rgba(154,120,32,0.3)', fontSize: 11, color: 'var(--text-muted)' }}>
                <strong>Tip:</strong> Drag sliders to stress-test your decision. Watch the recommendation change as assumptions shift.
              </div>
            </Card>
          </div>
        </div>

        <Card style={{ marginTop: 24, overflowX: 'auto' }}>
          <SectionLabel>Year-by-Year Comparison</SectionLabel>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                {['Year', 'Property Value', 'Hold Equity', 'Cash Flow', 'Hold Total', 'Sell Invested', show1031 && '1031 Total'].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.05em', fontSize: 10, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hold.yearlyData.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: 8, color: 'var(--text-muted)' }}>{d.year}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtK(d.propertyValue)}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: 'var(--accent)' }}>{fmtK(d.equity)}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: d.netCashFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtK(d.netCashFlow)}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{fmtK(d.equity + d.cumulativeCashFlow)}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: 'var(--blue)' }}>{fmtK(sell.yearlyData[i]?.investedValue)}</td>
                  {show1031 && <td style={{ padding: 8, textAlign: 'right', color: 'var(--purple)' }}>{fmtK((exch.yearlyData[i]?.equity || 0) + (exch.yearlyData[i]?.cumulativeCashFlow || 0))}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <VHGFooter dark={dark} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */

function App() {
  const [dark, setDark] = useState(() => {
    try { const s = localStorage.getItem('vhg-theme'); return s ? s === 'dark' : true; }
    catch (_e) { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('vhg-theme', dark ? 'dark' : 'light'); } catch (_e) { /* noop */ }
  }, [dark]);

  const [view, setView] = useState('questionnaire');
  const [formData, setFormData] = useState(null);
  const [holdResult, setHoldResult] = useState(null);
  const [sellResult, setSellResult] = useState(null);
  const [exchangeResult, setExchangeResult] = useState(null);

  const handleAnalyze = useCallback((data) => {
    const norm = {
      ...data,
      vacancyRate: parseFloat(data.vacancyRate) || 10,
      mortgageRate: (parseFloat(data.mortgageRate) || 0) / 100,
      annualAppreciation: (parseFloat(data.annualAppreciation) || 3) / 100,
      alternativeReturn: (parseFloat(data.alternativeReturn) || 7) / 100,
    };
    setFormData(norm);
    setHoldResult(calculateHoldScenario(norm, 10));
    setSellResult(calculateSellScenario(norm, 10, norm.alternativeReturn));
    setExchangeResult(data.exitStrategy === '1031' ? calculate1031Scenario(norm, 10) : null);
    setView('dashboard');
  }, []);

  const themeVars = dark ? darkVars : lightVars;

  return (
    <div style={{
      ...themeVars, background: 'var(--bg-primary)', color: 'var(--text-primary)',
      minHeight: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {view === 'dashboard' && holdResult && sellResult ? (
        <Dashboard formData={formData} holdResult={holdResult} sellResult={sellResult}
          exchangeResult={exchangeResult} onEditAssumptions={() => setView('questionnaire')}
          dark={dark} setDark={setDark} />
      ) : (
        <Questionnaire onComplete={handleAnalyze} initialData={formData} dark={dark} setDark={setDark} />
      )}
    </div>
  );
}

export default App;
