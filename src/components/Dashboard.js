import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';
import { Card, SectionLabel, Slider, TabBar, ChartTooltip, InputField, SelectField, AppHeader } from './UI';
import { calculateHoldScenario, calculateSellScenario, calculate1031Scenario, calculateTaxBenefits, calculateMortgageScenario, fmt, fmtK } from '../utils/calculations';
import { chartColors } from '../utils/theme';

export default function Dashboard({formData, rawFormData, sellResult, exchangeResult, onEditAssumptions, onLoadProperty, dark, isPro, onProClick, discoveryData, proUserEmail}) {
  const show1031 = !!exchangeResult;
  const colors = chartColors(dark);
  const isBuyer = discoveryData?.situation_value === 'evaluating-purchase';
  const HOLD_LABEL = isBuyer ? 'Buy & Hold' : 'Hold';
  const SELL_LABEL = isBuyer ? "Don't Buy, Invest" : 'Sell & Invest';

  // AI Summary state (declared early so loadProperty can use it)
  const [aiSummary, setAiSummary] = useState('');

  // Saved Properties (localStorage)
  const [savedProperties, setSavedProperties] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vhg-saved-properties')||'[]'); } catch(_e) { return []; }
  });
  const saveCurrentProperty = () => {
    const entry = {
      id: Date.now(),
      name: `${formData.propertyType} - ${formData.location}`,
      location: formData.location,
      formData: rawFormData || formData,
      discoveryData,
      holdWealth: hold.totalWealth,
      sellWealth: sell.totalWealthAtEnd,
      recommendation: rec.text,
      aiSummary: aiSummary || '',
      savedAt: new Date().toLocaleDateString(),
    };
    const updated = [...savedProperties.slice(-2), entry]; // Keep max 3
    setSavedProperties(updated);
    try { localStorage.setItem('vhg-saved-properties', JSON.stringify(updated)); } catch(_e) {}
  };
  const deleteProperty = (id) => {
    const updated = savedProperties.filter(p => p.id !== id);
    setSavedProperties(updated);
    try { localStorage.setItem('vhg-saved-properties', JSON.stringify(updated)); } catch(_e) {}
  };
  const loadProperty = (prop) => {
    // Restore AI summary if saved, otherwise clear
    setAiSummary(prop.aiSummary || '');
    onLoadProperty(prop.formData);
  };

  // Onboarding tour
  const [showTour, setShowTour] = useState(() => {
    try { return !localStorage.getItem('vhg-tour-done'); } catch(_e) { return true; }
  });
  const [tourStep, setTourStep] = useState(0);
  const dismissTour = () => {
    setShowTour(false);
    try { localStorage.setItem('vhg-tour-done', '1'); } catch(_e) {}
  };

  // Email full results
  const emailResults = async () => {
    const email = proUserEmail;
    if (!email) { alert('Unlock Pro to email results.'); return; }
    const yr1 = hold.yearlyData[0];
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#F8FAFC;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-size:24px;color:#167A5E;margin:0;">Property<span style="color:#9A7820;">Path</span></h1>
        <p style="color:#94A3B8;font-size:13px;">by Vacation Home Group</p>
      </div>
      <h2 style="font-size:18px;color:#1E293B;border-bottom:2px solid #E2E8F0;padding-bottom:6px;">Investment Analysis: ${formData.location}</h2>
      <table style="width:100%;font-size:14px;color:#1E293B;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#94A3B8;">Property</td><td style="padding:8px 0;font-weight:700;">${formData.propertyType} in ${formData.location}</td></tr>
        <tr><td style="padding:8px 0;color:#94A3B8;">${isBuyer?'Asking Price':'Current Value'}</td><td style="padding:8px 0;">${fmt(isBuyer?formData.purchasePrice:formData.currentValue)}</td></tr>
        <tr><td style="padding:8px 0;color:#94A3B8;">Annual Rent</td><td style="padding:8px 0;">${fmt(formData.annualRent)}</td></tr>
      </table>
      <div style="margin:20px 0;padding:16px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;">
        <table style="width:100%;font-size:15px;color:#1E293B;">
          <tr><td style="padding:6px 0;color:#167A5E;font-weight:700;">${HOLD_LABEL} Total</td><td style="padding:6px 0;font-weight:700;text-align:right;">${fmtK(hold.totalWealth)}</td></tr>
          <tr><td style="padding:6px 0;color:#3B82F6;font-weight:700;">${SELL_LABEL}</td><td style="padding:6px 0;font-weight:700;text-align:right;">${fmtK(sell.totalWealthAtEnd)}</td></tr>
          ${show1031?`<tr><td style="padding:6px 0;color:#8B5CF6;font-weight:700;">1031 Exchange</td><td style="padding:6px 0;font-weight:700;text-align:right;">${fmtK(exch.totalWealth)}</td></tr>`:''}
          <tr style="border-top:2px solid #E2E8F0;"><td style="padding:8px 0;font-weight:700;">Recommendation</td><td style="padding:8px 0;font-weight:700;text-align:right;color:${rec.text.includes('Hold')||rec.text.includes('Buy')?'#167A5E':'#3B82F6'};">${rec.text}</td></tr>
        </table>
      </div>
      <table style="width:100%;font-size:13px;color:#64748B;border-collapse:collapse;">
        <tr><td style="padding:4px 0;">Cap Rate</td><td style="padding:4px 0;text-align:right;">${calcCapRate.toFixed(1)}%</td></tr>
        <tr><td style="padding:4px 0;">Year 1 Cash Flow</td><td style="padding:4px 0;text-align:right;color:${(yr1?.netCashFlow||0)>=0?'#167A5E':'#EF4444'};">${fmtK(yr1?.netCashFlow||0)}</td></tr>
        <tr><td style="padding:4px 0;">Vacancy</td><td style="padding:4px 0;text-align:right;">${sens.vacancyRate}%</td></tr>
        <tr><td style="padding:4px 0;">Appreciation</td><td style="padding:4px 0;text-align:right;">${sens.appreciation}%</td></tr>
        <tr><td style="padding:4px 0;">Hold Period</td><td style="padding:4px 0;text-align:right;">${sens.yearsToHold} years</td></tr>
      </table>
      ${hold.maintEvents?.length>0?`<p style="font-size:13px;color:#EF4444;margin-top:12px;">Capital expenses projected: ${hold.maintEvents.map(e=>e.component+' Year '+e.year+' ('+fmtK(e.cost)+')').join(', ')}</p>`:''}
      <p style="font-size:12px;color:#94A3B8;margin-top:20px;text-align:center;">Open PropertyPath for interactive charts, sensitivity sliders, and AI analysis.</p>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;"/>
      <p style="font-size:11px;color:#94A3B8;text-align:center;line-height:1.6;">This analysis does not constitute financial or investment advice. Consult a qualified professional.<br/>Vacation Home Group &middot; Real Broker NH &middot; vacationhomegroup.net</p>
    </div>`;
    try {
      const resp = await fetch('/api/send-code', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,name:'PropertyPath Results',skipCode:true,customSubject:`PropertyPath Analysis: ${formData.location}`,customHtml:html}),
      });
      alert(resp.ok?'Results emailed!':'Failed to send.');
    } catch(_e) { alert('Failed to send.'); }
  };

  // Simple markdown to HTML renderer
  const renderMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4 style="font-size:15px;font-weight:700;color:var(--gold);margin:16px 0 8px;font-family:\'JetBrains Mono\',monospace;letter-spacing:0.04em;">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:20px 0 10px;border-bottom:1px solid var(--border-primary);padding-bottom:6px;">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="font-size:20px;font-weight:800;color:var(--accent);margin:0 0 12px;">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary);">$1</strong>')
      .replace(/^- (.+)$/gm, '<div style="padding:3px 0 3px 16px;position:relative;"><span style="position:absolute;left:0;color:var(--gold);">\u2022</span>$1</div>')
      .replace(/^(\d+)\. (.+)$/gm, '<div style="padding:3px 0 3px 20px;position:relative;"><span style="position:absolute;left:0;color:var(--gold);font-weight:700;">$1.</span>$2</div>')
      .replace(/\n\n/g, '<div style="margin:12px 0;"></div>')
      .replace(/\n/g, '<br/>');
  };

  // PDF Export — generates a printable report in a new window
  const generatePDF = () => {
    const yr1 = hold.yearlyData[0];
    const maintTotal = hold.maintEvents ? hold.maintEvents.reduce((s,e)=>s+e.cost,0) : 0;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PropertyPath Report — ${formData.location}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1E293B;font-size:14px;line-height:1.6;}
  h1{color:#167A5E;font-size:26px;margin:0 0 4px;} h2{color:#1A1A1A;font-size:18px;border-bottom:2px solid #E2E8F0;padding-bottom:6px;margin:28px 0 12px;}
  h3{color:#9A7820;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;margin:20px 0 8px;}
  .subtitle{color:#94A3B8;font-size:13px;} .gold{color:#9A7820;} .green{color:#167A5E;} .red{color:#EF4444;}
  table{width:100%;border-collapse:collapse;margin:12px 0;} td,th{padding:8px 10px;border-bottom:1px solid #E2E8F0;text-align:left;font-size:13px;}
  th{background:#F0F4F8;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#64748B;}
  .metric{display:inline-block;width:30%;vertical-align:top;margin-bottom:16px;}
  .metric-val{font-size:22px;font-weight:700;} .metric-label{font-size:11px;color:#94A3B8;text-transform:uppercase;}
  .disclaimer{margin-top:32px;padding:16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;font-size:11px;color:#94A3B8;line-height:1.6;}
  @media print{body{padding:20px;} .no-print{display:none;}}
</style></head><body>
<div style="text-align:center;margin-bottom:24px;">
  <h1>Property<span class="gold">Path</span></h1>
  <div class="subtitle">by Vacation Home Group · Investment Analysis Report</div>
</div>

<h2>Property Overview</h2>
<table>
  <tr><td style="width:40%;color:#94A3B8;">Property</td><td><strong>${formData.propertyType} in ${formData.location}</strong></td></tr>
  <tr><td style="color:#94A3B8;">Current Value</td><td>${fmt(formData.currentValue)}</td></tr>
  <tr><td style="color:#94A3B8;">Purchase Price</td><td>${fmt(formData.purchasePrice)}</td></tr>
  <tr><td style="color:#94A3B8;">Annual Gross Rent</td><td>${fmt(formData.annualRent)}</td></tr>
  <tr><td style="color:#94A3B8;">Annual Expenses</td><td>${fmt(formData.annualExpenses)}</td></tr>
  <tr><td style="color:#94A3B8;">Mortgage</td><td>${fmt(formData.mortgageBalance)} at ${(parseFloat(formData.mortgageRate)*100).toFixed(1)}%</td></tr>
  <tr><td style="color:#94A3B8;">${isBuyer?'Purchase Costs':'Selling Costs'}</td><td>${parseFloat(formData.sellingCostsPct)||(isBuyer?3:7.5)}%</td></tr>
</table>

<h2>Key Metrics</h2>
<div>
  <div class="metric"><div class="metric-val green">${fmtK(hold.totalWealth)}</div><div class="metric-label">${HOLD_LABEL} Total (${sens.yearsToHold}yr)</div></div>
  <div class="metric"><div class="metric-val" style="color:#3B82F6;">${fmtK(sell.totalWealthAtEnd)}</div><div class="metric-label">${SELL_LABEL}</div></div>
  ${show1031?`<div class="metric"><div class="metric-val" style="color:#8B5CF6;">${fmtK(exch.totalWealth)}</div><div class="metric-label">1031 Exchange</div></div>`:''}
  <div class="metric"><div class="metric-val" style="color:${rec.text.includes('Hold')?'#167A5E':'#3B82F6'};">${rec.text}</div><div class="metric-label">Recommendation</div></div>
  <div class="metric"><div class="metric-val gold">${calcCapRate.toFixed(1)}%</div><div class="metric-label">Cap Rate</div></div>
  <div class="metric"><div class="metric-val ${(yr1?.netCashFlow||0)>=0?'green':'red'}">${fmtK(yr1?.netCashFlow||0)}</div><div class="metric-label">Year 1 Cash Flow</div></div>
</div>

<h2>Assumptions</h2>
<table>
  <tr><td style="color:#94A3B8;">Vacancy Rate</td><td>${sens.vacancyRate}%</td></tr>
  <tr><td style="color:#94A3B8;">Annual Appreciation</td><td>${sens.appreciation}%</td></tr>
  <tr><td style="color:#94A3B8;">Alternative Return</td><td>${sens.altReturn}%</td></tr>
  <tr><td style="color:#94A3B8;">Hold Period</td><td>${sens.yearsToHold} years</td></tr>
</table>

${hold.maintEvents&&hold.maintEvents.length>0?`
<h2>Projected Capital Expenses</h2>
<table>
  <tr><th>Component</th><th>Year</th><th>Est. Cost</th><th>Age at Replacement</th></tr>
  ${hold.maintEvents.map(e=>`<tr><td>${e.component}</td><td>${e.year===1&&e.age>=25?'Overdue':'Year '+e.year}</td><td>${fmtK(e.cost)}</td><td>${e.age} years</td></tr>`).join('')}
  <tr><td><strong>Total</strong></td><td></td><td><strong>${fmtK(maintTotal)}</strong></td><td></td></tr>
</table>`:''}

<h2>Year-by-Year Projection</h2>
<table>
  <tr><th>Year</th><th>Property Value</th><th>Equity</th><th>Cash Flow</th><th>${HOLD_LABEL} Total</th><th>${SELL_LABEL}</th></tr>
  ${hold.yearlyData.slice(0,sens.yearsToHold).map((d,i)=>`<tr><td>${d.year}</td><td>${fmtK(d.propertyValue)}</td><td>${fmtK(d.equity)}</td><td class="${d.netCashFlow>=0?'green':'red'}">${fmtK(d.netCashFlow)}</td><td>${fmtK(d.equity+d.cumulativeCashFlow)}</td><td>${fmtK(sell.yearlyData[i]?.investedValue||0)}</td></tr>`).join('')}
</table>

${aiSummary?`<h2>AI Investment Analysis</h2><div style="line-height:1.8;">${renderMarkdown(aiSummary)}</div>`:''}

${discoveryData?`<h2>Client Profile</h2>
<table>
  <tr><td style="color:#94A3B8;">Situation</td><td>${discoveryData.situation||'-'}</td></tr>
  <tr><td style="color:#94A3B8;">Priority</td><td>${discoveryData.priority||'-'}</td></tr>
  <tr><td style="color:#94A3B8;">Risk Tolerance</td><td>${discoveryData.risk||'-'}</td></tr>
  <tr><td style="color:#94A3B8;">Timeline</td><td>${discoveryData.timeline||'-'}</td></tr>
  <tr><td style="color:#94A3B8;">Experience</td><td>${discoveryData.experience||'-'}</td></tr>
</table>`:''}

${savedProperties.length>1?`<h2>Saved Properties Comparison</h2>
<table>
  <tr><th>Property</th><th>${HOLD_LABEL} Total</th><th>${SELL_LABEL}</th><th>Recommendation</th></tr>
  ${savedProperties.map(sp=>{
    return `<tr><td>${sp.location||sp.name}</td><td class="green">${fmtK(sp.holdWealth)}</td><td style="color:#3B82F6;">${fmtK(sp.sellWealth)}</td><td style="font-weight:700;">${sp.recommendation}</td></tr>`;
  }).join('')}
</table>`:''}

<div class="disclaimer">
  <strong>Disclaimer:</strong> This report is generated by PropertyPath, a tool by Vacation Home Group. Projections are estimates based on user-provided inputs and do not constitute financial, tax, or investment advice. Consult a qualified real estate professional, CPA, or financial advisor before making investment decisions. Vacation Home Group, its agents, and this platform assume no liability for decisions made based on this analysis.<br/><br/>
  Joe Mori & Dino Amato · Real Broker NH · Each office is independently owned and operated.<br/>
  vacationhomegroup.net · vacationhome.group · 855-450-0442
</div>

<div class="no-print" style="text-align:center;margin-top:24px;">
  <button onclick="window.print()" style="padding:12px 32px;border-radius:8px;border:none;background:#167A5E;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
</div>
</body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [slidersOpen, setSlidersOpen] = useState(true);

  // Sensitivity — formData values are already normalized (0.03 = 3%, 0.07 = 7%)
  const [sens, setSens] = useState({
    vacancyRate: parseFloat(formData.vacancyRate)||10,
    appreciation: Math.round((parseFloat(formData.annualAppreciation)||0.03)*200)/2,
    altReturn: Math.round((parseFloat(formData.alternativeReturn)||0.07)*200)/2,
    yearsToHold: 10,
  });

  // What-If Snapshots (Pro)
  const [snapshots, setSnapshots] = useState([]);
  const [snapName, setSnapName] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);

  // Mortgage Scenarios (Pro) — sync with formData on mount and after Edit
  const getMortRate = () => {
    const raw = parseFloat(formData.mortgageRate) || 0;
    // formData.mortgageRate is normalized (e.g., 0.03 for 3%)
    const pct = raw < 1 ? Math.round(raw * 10000) / 100 : raw;
    return pct || 6.5;
  };
  const [mortScenarios, setMortScenarios] = useState([
    {label:'Current',principal:parseFloat(formData.mortgageBalance)||0,rate:getMortRate(),term:parseInt(formData.mortgageYearsRemaining)||30},
    {label:'Refi Option',principal:parseFloat(formData.mortgageBalance)||0,rate:5.5,term:30},
  ]);

  // AI Summary with user controls
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState('claude');
  const [aiPreset, setAiPreset] = useState('investor-brief');
  const [aiTone, setAiTone] = useState('professional');
  const [aiLength, setAiLength] = useState('medium');

  // API Key Settings
  const [geminiKey, setGeminiKey] = useState(() => {try{return localStorage.getItem('vhg-gemini-key')||'';}catch(_e){return '';}});
  const [notifyEmails, setNotifyEmails] = useState(() => {try{return localStorage.getItem('vhg-notify-emails')||'joemori@vacationhome.group,dinoamato@vacationhome.group';}catch(_e){return 'joemori@vacationhome.group,dinoamato@vacationhome.group';}});
  const [settingsSaved, setSettingsSaved] = useState(false);

  const AI_PRESETS = [
    {value:'investor-brief',label:'💼 Investor Brief',desc:'Concise analysis for decision-makers. Numbers-heavy, bottom-line focused.'},
    {value:'partner-explainer',label:'🤝 Partner Explainer',desc:'Plain English for a spouse or partner. Avoids jargon, explains trade-offs clearly.'},
    {value:'cpa-memo',label:'📋 CPA Memo',desc:'Tax-focused summary for your accountant. Depreciation, capital gains, 1031 implications.'},
    {value:'risk-assessment',label:'⚠️ Risk Assessment',desc:'What could go wrong? Stress-tests assumptions and flags vulnerabilities.'},
    {value:'market-letter',label:'📨 Client Market Letter',desc:'Polished summary suitable for sharing with clients or in a newsletter.'},
    {value:'quick-take',label:'⚡ Quick Take',desc:'One paragraph. The fastest possible read.'},
  ];
  const AI_TONES = [{value:'professional',label:'Professional'},{value:'conversational',label:'Conversational'},{value:'technical',label:'Technical'},{value:'encouraging',label:'Encouraging'}];
  const AI_LENGTHS = [{value:'short',label:'Short (2-3 sentences)',tokens:400},{value:'medium',label:'Medium (1 paragraph)',tokens:800},{value:'detailed',label:'Detailed (2-3 paragraphs)',tokens:1500}];

  // ── Core calculations ──
  const results = useMemo(() => {
    const a = {...formData, annualAppreciation:sens.appreciation/100, vacancyRate:sens.vacancyRate};
    const hold = calculateHoldScenario(a, sens.yearsToHold);
    const sell = calculateSellScenario(a, sens.yearsToHold, sens.altReturn/100);
    const exch = show1031 ? calculate1031Scenario(a, sens.yearsToHold) : null;
    return {hold, sell, exch};
  }, [formData, sens, show1031]);
  const {hold, sell, exch} = results;

  const taxBenefits = useMemo(() => calculateTaxBenefits(formData, sens.yearsToHold), [formData, sens.yearsToHold]);

  const rec = useMemo(() => {
    const hW=hold.totalWealth, sW=sell.totalWealthAtEnd, xW=exch?.totalWealth||0;
    if(show1031&&xW>hW&&xW>sW) return {text:'1031 Exchange',color:'var(--purple)'};
    if(hW>sW) return {text:isBuyer?'Buy & Hold':'Hold Property',color:'var(--accent)'};
    return {text:isBuyer?"Don't Buy, Invest Instead":'Sell & Invest',color:'var(--blue)'};
  }, [hold, sell, exch, show1031, isBuyer]);

  // ── Chart data ──
  const wealthChart = useMemo(() => {
    const d = [];
    for(let y=0;y<=sens.yearsToHold;y++){
      const p={year:y};
      if(y===0){p.hold=parseFloat(formData.currentValue)-parseFloat(formData.mortgageBalance||0);p.sell=sell.netProceeds;if(show1031)p.exchange=exch.equityTransferred;}
      else{p.hold=(hold.yearlyData[y-1]?.equity||0)+(hold.yearlyData[y-1]?.cumulativeCashFlow||0);p.sell=sell.yearlyData[y-1]?.investedValue;if(show1031)p.exchange=(exch.yearlyData[y-1]?.equity||0)+(exch.yearlyData[y-1]?.cumulativeCashFlow||0);}
      d.push(p);
    } return d;
  }, [hold, sell, exch, sens.yearsToHold, formData, show1031]);

  const cashFlowChart = useMemo(() => hold.yearlyData.map(d => ({
    year:`Yr ${d.year}`,revenue:d.effectiveRent,expenses:-(d.opExpenses+d.maintenance),debtService:-d.debtService,net:d.netCashFlow
  })), [hold]);

  const equityChart = useMemo(() => hold.yearlyData.map(d => ({
    year:`Yr ${d.year}`,equity:d.equity,cashFlow:d.cumulativeCashFlow,
  })), [hold]);

  const expensePie = useMemo(() => {
    const y=hold.yearlyData[0]||{};
    return [{name:'Operating',value:y.opExpenses||0,color:colors.blue},{name:'Maintenance',value:y.maintenance||0,color:colors.gold},{name:'Debt Service',value:y.debtService||0,color:colors.red}].filter(d=>d.value>0);
  }, [hold, colors]);

  const radarData = useMemo(() => {
    const hW=hold.totalWealth,sW=sell.totalWealthAtEnd,xW=exch?.totalWealth||0;
    const maxW=Math.max(hW,sW,xW,1);
    const hCF=hold.totalCashFlow,xCF=exch?.yearlyData?.reduce((s,d)=>s+d.netCashFlow,0)||0;
    const maxCF=Math.max(Math.abs(hCF),Math.abs(xCF),1);
    return [
      {metric:'Wealth',hold:hW/maxW*100,sell:sW/maxW*100,...(show1031?{exchange:xW/maxW*100}:{})},
      {metric:'Cash Flow',hold:Math.max(0,hCF/maxCF*100),sell:0,...(show1031?{exchange:Math.max(0,xCF/maxCF*100)}:{})},
      {metric:'Tax Efficiency',hold:60,sell:30,...(show1031?{exchange:95}:{})},
      {metric:'Liquidity',hold:20,sell:95,...(show1031?{exchange:15}:{})},
      {metric:'Appreciation',hold:80,sell:50,...(show1031?{exchange:85}:{})},
    ];
  }, [hold, sell, exch, show1031]);

  // ── Handlers ──
  const saveSnapshot = () => {
    if(!snapName.trim()) return;
    setSnapshots([...snapshots,{name:snapName,sens:{...sens},timestamp:Date.now()}]);
    setSnapName('');
  };

  const generateAI = async () => {
    setAiLoading(true);
    const preset = AI_PRESETS.find(p=>p.value===aiPreset);
    const lengthCfg = AI_LENGTHS.find(l=>l.value===aiLength);
    const presetInstructions = {
      'investor-brief':'Write a concise investment brief. Lead with the recommendation and key numbers. Include ROI metrics. End with the single biggest risk factor.',
      'partner-explainer':'Explain this like you\'re talking to someone\'s spouse who isn\'t in real estate. No jargon. Use simple comparisons. Help them understand the trade-offs of holding vs selling.',
      'cpa-memo':'Write a tax-focused memo. Cover depreciation (straight-line and cost segregation potential), capital gains exposure if selling, depreciation recapture, and 1031 exchange tax deferral if applicable.',
      'risk-assessment':'Focus entirely on risk. What assumptions are most fragile? What market conditions would flip the recommendation? What\'s the worst-case for each scenario? Be specific about dollar amounts at risk.',
      'market-letter':'Write a polished, professional market analysis suitable for a real estate newsletter. Contextualize the numbers with market observations. Make it feel like expert commentary.',
      'quick-take':'One paragraph maximum. Fastest possible read. Lead with the bottom line, include 2-3 key numbers, done.',
    };
    // Build discovery context for AI
    const discoveryContext = discoveryData ? `
The client describes themselves as: ${discoveryData.situation}.
Their top priority is: ${discoveryData.priority}.
Risk tolerance: ${discoveryData.risk}.
Timeline: ${discoveryData.timeline}.
Investment experience: ${discoveryData.experience}.
Tailor your analysis to this profile.` : '';

    // Property condition context
    const roofAge = parseInt(formData.roofAge)||0;
    const hvacAge = parseInt(formData.hvacAge)||0;
    const whAge = parseInt(formData.waterHeaterAge)||0;
    const conditionNotes = [];
    if(roofAge>=20) conditionNotes.push(`Roof is ${roofAge} years old (typical life 25-30yr, replacement ~4% of value)`);
    else conditionNotes.push(`Roof is ${roofAge} years old (good condition)`);
    if(hvacAge>=12) conditionNotes.push(`HVAC is ${hvacAge} years old (typical life 15-20yr, replacement ~2% of value)`);
    else conditionNotes.push(`HVAC is ${hvacAge} years old (good condition)`);
    if(whAge>=10) conditionNotes.push(`Water heater is ${whAge} years old (typical life 10-15yr)`);

    const buyerContext = isBuyer ? `
IMPORTANT: This user does NOT currently own this property. They are EVALUATING A POTENTIAL PURCHASE. Frame your entire analysis as a buy/don't-buy decision. Instead of "hold vs sell," compare "buy and hold this property" vs "don't buy and invest the capital elsewhere." Never refer to selling the property since they don't own it yet. Focus on whether the purchase price, projected cash flow, and appreciation justify the investment compared to alternative uses of their capital.` : '';

    const prompt = `You are a senior real estate investment analyst who specializes in SHORT-TERM RENTALS (STR) — vacation homes, Airbnb, VRBO properties. You understand the STR market deeply.${discoveryContext}${buyerContext}

CRITICAL — STR INDUSTRY BENCHMARKS (use these, NOT long-term rental norms):
- Vacancy: 40-55% is NORMAL for STR. Most vacation rentals are occupied 45-60% of the year. Under 30% vacancy is exceptional. Over 60% may indicate a problem. Do NOT judge STR vacancy by long-term rental standards (where 5-10% is normal).
- Cap Rate: 5-10% is typical for STR. Above 10% is strong. Below 4% may be weak.
- Cash-on-Cash Return: 8-15% is good for STR. Above 15% is excellent.
- Appreciation: 3-4% is US average. 5-8% for hot vacation markets. Above 10% is aggressive assumption.
- Operating Expenses: 35-50% of gross rent is typical for STR (higher than LTR due to cleaning, supplies, turnover).
- Selling Costs: 7-8% is standard (agent + closing). 1-3% for private sale.

TASK: ${presetInstructions[aiPreset]||'Provide a clear investment analysis.'}

TONE: ${aiTone}
LENGTH: ${aiLength} — you MUST write a complete, finished response. Do not cut off mid-sentence.

PROPERTY DATA:
- Type: ${formData.propertyType} in ${formData.location}
- Current Value: ${fmt(formData.currentValue)}, Purchase Price: ${fmt(formData.purchasePrice)}
- Annual Gross Rent: ${fmt(formData.annualRent)}, Annual Expenses: ${fmt(formData.annualExpenses)}
- Expense Ratio: ${((parseFloat(formData.annualExpenses)/parseFloat(formData.annualRent))*100).toFixed(0)}% of gross rent
- Vacancy: ${sens.vacancyRate}% (remember: 40-55% is normal for STR)
- Mortgage: ${fmt(formData.mortgageBalance)} at ${(parseFloat(formData.mortgageRate)*100).toFixed(1)}%
- ${isBuyer?'Purchase/Closing Costs':'Selling Costs'}: ${parseFloat(formData.sellingCostsPct)||(isBuyer?3:7.5)}%
- Appreciation assumption: ${sens.appreciation}%/yr
- Alternative return assumption: ${sens.altReturn}%

PROPERTY CONDITION:
${conditionNotes.join('\n')}
${hold.maintEvents&&hold.maintEvents.length>0?`Projected capital expenses: ${hold.maintEvents.map(e=>`${e.component} in Year ${e.year} (${fmtK(e.cost)}${e.year===1?' - OVERDUE':''})`).join(', ')}`:'No major replacements projected during hold period.'}

ANALYSIS RESULTS:
- ${HOLD_LABEL} ${sens.yearsToHold} years total wealth: ${fmtK(hold.totalWealth)}
- ${SELL_LABEL} total wealth: ${fmtK(sell.totalWealthAtEnd)}${show1031?`\n- 1031 Exchange total wealth: ${fmtK(exch.totalWealth)}`:''}
- Year 1 Cash Flow: ${fmtK(hold.yearlyData[0]?.netCashFlow||0)}
- Calculated Cap Rate: ${calcCapRate.toFixed(1)}%
- Recommendation: ${rec.text}, advantage: ${fmtK(Math.abs(hold.totalWealth-sell.totalWealthAtEnd))}

Write your complete analysis now. Judge all metrics by STR standards, not long-term rental standards.

IMPORTANT: End your response with this disclaimer on its own line, separated by a horizontal rule (---):
"This analysis is generated by AI based on user-provided inputs and does not constitute financial, tax, or investment advice. Projections are estimates and may not reflect actual market conditions. Consult a qualified real estate professional, CPA, or financial advisor before making investment decisions. Vacation Home Group, its agents, and this platform assume no liability for decisions made based on this analysis."`;
    try {
      const key = geminiKey || (()=>{try{return localStorage.getItem('vhg-gemini-key')||'';}catch(_e){return '';}})();
      const resp = await fetch('/api/ai-summary', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          provider: aiProvider,
          prompt,
          maxTokens: lengthCfg?.tokens||400,
          ...(aiProvider==='gemini' ? {geminiKey:key} : {}),
        }),
      });
      const data = await resp.json();
      if (data.text) {
        setAiSummary(data.text);
      } else {
        setAiSummary(data.error || 'Unable to generate summary.');
      }
    } catch(err) { setAiSummary('AI error: ' + (err.message || 'Check your connection and try again.')); }
    setAiLoading(false);
  };

  // ═══════════════════════════════════════════════════════════
  // ASSUMPTIONS BAR — always visible, collapsible on mobile
  // ═══════════════════════════════════════════════════════════
  const AssumptionsBar = () => (
    <div style={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:10,padding:slidersOpen?'16px 16px 8px':'12px 16px',marginBottom:16,transition:'padding 0.2s'}}>
      {/* Collapsed: summary row + toggle */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,cursor:'pointer'}} onClick={()=>setSlidersOpen(!slidersOpen)}>
        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)'}}>ASSUMPTIONS</span>
          <span style={{fontSize:14,color:'var(--text-muted)'}}>
            Vac {Math.round(sens.vacancyRate)}% · App {Math.round(sens.appreciation)}% · Alt {Math.round(sens.altReturn)}% · {sens.yearsToHold}yr
          </span>
        </div>
        <button style={{background:'none',border:'1px solid var(--border-primary)',borderRadius:6,padding:'5px 12px',color:'var(--accent)',fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>
          {slidersOpen ? 'Collapse ▲' : 'Tune ▼'}
        </button>
      </div>
      {/* Expanded: sliders */}
      {slidersOpen && (
        <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
          <Slider label="Vacancy" min={0} max={100} step={1} value={sens.vacancyRate} displayValue={`${Math.round(sens.vacancyRate)}%`} tip="Percentage of the year the property sits empty. National STR average is 25-40%." onChange={e=>setSens({...sens,vacancyRate:e.target.value})}/>
          <Slider label="Appreciation" min={-5} max={15} step={0.5} value={sens.appreciation} displayValue={`${Number(sens.appreciation).toFixed(1)}%`} tip="Annual property value growth. US historical average is ~3-4%. Hot markets can see 8-10%." onChange={e=>setSens({...sens,appreciation:e.target.value})}/>
          <Slider label="Alt. Return" min={0} max={15} step={0.5} value={sens.altReturn} displayValue={`${Number(sens.altReturn).toFixed(1)}%`} tip="What you'd earn if you sold and invested the proceeds elsewhere. S&P 500 averages ~10% historically." onChange={e=>setSens({...sens,altReturn:e.target.value})}/>
          <Slider label="Hold Period" min={1} max={30} step={1} value={sens.yearsToHold} displayValue={`${sens.yearsToHold} yrs`} suffix=" yrs" tip="How many years into the future to project. Longer periods favor holding due to appreciation compounding." onChange={e=>setSens({...sens,yearsToHold:e.target.value})}/>
        </div>
      )}
    </div>
  );

  // Calculated cap rate: NOI / Current Value
  const calcCapRate = useMemo(() => {
    const yr1 = hold.yearlyData[0];
    if (!yr1) return 0;
    const noi = yr1.effectiveRent - yr1.opExpenses - yr1.maintenance;
    const cv = parseFloat(formData.currentValue) || 1;
    return (noi / cv * 100);
  }, [hold, formData]);

  // ═══════════════════════════════════════════════════════════
  // TAB: OVERVIEW — metric cards + wealth chart + radar
  // ═══════════════════════════════════════════════════════════
  const renderOverview = () => (
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:20}}>
        <Card style={{padding:'16px 18px'}}><SectionLabel tip="Property equity plus cumulative net cash flow over your hold period.">{HOLD_LABEL} Total</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--accent)'}}>{fmtK(hold.totalWealth)}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>{sens.yearsToHold}yr equity+cash</p></Card>
        <Card style={{padding:'16px 18px'}}><SectionLabel tip="After-tax sale proceeds invested at your chosen alternative return rate.">{SELL_LABEL}</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--blue)'}}>{fmtK(sell.totalWealthAtEnd)}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>At {sens.altReturn}% return</p></Card>
        {show1031&&<Card style={{padding:'16px 18px'}}><SectionLabel tip="Tax-deferred exchange into replacement property. Defers capital gains and depreciation recapture.">1031 Exchange</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--purple)'}}>{fmtK(exch.totalWealth)}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>Deferred: {fmtK(exch.taxDeferred)}</p></Card>}
        <Card style={{padding:'16px 18px',background:'var(--bg-subtle)',border:'1px solid var(--border-accent)'}}><SectionLabel tip="Whichever scenario produces the highest total wealth wins.">Recommendation</SectionLabel><div style={{fontSize:24,fontWeight:700,color:rec.color}}>{rec.text}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>+{fmtK(Math.abs(hold.totalWealth-sell.totalWealthAtEnd))}</p></Card>
      </div>

      {/* Secondary metrics row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:20}}>
        <Card style={{padding:'14px 16px'}}><SectionLabel tip="Net Operating Income divided by property value. Measures investment yield independent of financing. Higher is better.">Cap Rate</SectionLabel><div style={{fontSize:22,fontWeight:700,color:'var(--gold)'}}>{calcCapRate.toFixed(1)}%</div><p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>calculated from inputs</p></Card>
        <Card style={{padding:'14px 16px'}}><SectionLabel tip="Year 1 net cash flow: rental income minus expenses, maintenance, and debt service.">Cash Flow /Yr</SectionLabel><div style={{fontSize:22,fontWeight:700,color:hold.yearlyData[0]?.netCashFlow>=0?'var(--accent)':'var(--red)'}}>{fmtK(hold.yearlyData[0]?.netCashFlow||0)}</div><p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>year 1 net</p></Card>
        <Card style={{padding:'14px 16px'}}><SectionLabel tip={isBuyer?"Buyer closing costs as % of purchase price. Reduces your starting equity.":"Your total selling costs as a percentage of sale price. Includes agent commissions and closing costs."}>{isBuyer?'Purchase Costs':'Selling Costs'}</SectionLabel><div style={{fontSize:22,fontWeight:700,color:'var(--text-secondary)'}}>{parseFloat(formData.sellingCostsPct)||(isBuyer?3:7.5)}%</div><p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{fmtK(isBuyer?hold.closingCosts:sell.sellingCosts)}</p></Card>
      </div>

      {/* Maintenance Alerts */}
      {hold.maintEvents && hold.maintEvents.length > 0 && (
        <Card style={{marginBottom:16,padding:'16px 20px'}}>
          <SectionLabel tip="Major replacement costs projected based on component ages you entered. These are factored into your Hold scenario cash flow.">Upcoming Capital Expenses</SectionLabel>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {hold.maintEvents.map((ev,i) => (
              <div key={i} style={{padding:'10px 16px',borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--bg-primary)',minWidth:160}}>
                <div style={{fontSize:14,fontWeight:700,color:'var(--red)'}}>{fmtK(ev.cost)}</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)',marginTop:2}}>{ev.component}</div>
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                  {ev.year === 1 && ev.age >= 25 ? 'Overdue now' : ev.year === 1 ? 'Due now' : `Year ${ev.year}`}
                  {' '}&middot; Age {ev.age}yr
                </div>
              </div>
            ))}
          </div>
          <p style={{fontSize:12,color:'var(--text-faint)',marginTop:10}}>
            Total projected: {fmtK(hold.maintEvents.reduce((s,e)=>s+e.cost,0))} over {sens.yearsToHold} years. These costs are included in the Hold scenario cash flow calculations.
          </p>
        </Card>
      )}

      <Card style={{marginBottom:16}}>
        <SectionLabel>Cumulative Wealth</SectionLabel>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={wealthChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={11}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="hold" name={HOLD_LABEL} stroke={colors.accent} fill={colors.accent} fillOpacity={0.15} strokeWidth={2}/>
            <Area type="monotone" dataKey="sell" name={SELL_LABEL} stroke={colors.blue} fill={colors.blue} fillOpacity={0.1} strokeWidth={2}/>
            {show1031&&<Area type="monotone" dataKey="exchange" name="1031" stroke={colors.purple} fill={colors.purple} fillOpacity={0.1} strokeWidth={2}/>}
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionLabel>Scenario Radar</SectionLabel>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={colors.grid}/>
            <PolarAngleAxis dataKey="metric" tick={{fontSize:10,fill:colors.muted}}/>
            <PolarRadiusAxis tick={false} axisLine={false}/>
            <Radar name={HOLD_LABEL} dataKey="hold" stroke={colors.accent} fill={colors.accent} fillOpacity={0.2}/>
            <Radar name={SELL_LABEL} dataKey="sell" stroke={colors.blue} fill={colors.blue} fillOpacity={0.15}/>
            {show1031&&<Radar name="1031" dataKey="exchange" stroke={colors.purple} fill={colors.purple} fillOpacity={0.15}/>}
            <Legend wrapperStyle={{fontSize:11}}/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* Action buttons */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {proUserEmail&&<button onClick={emailResults} style={{padding:'10px 20px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>Email My Results</button>}
        <button onClick={saveCurrentProperty} style={{padding:'10px 20px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-primary)',fontSize:14,cursor:'pointer'}}>Save Property ({savedProperties.length}/3)</button>
      </div>
    </>
  );
  // ═══════════════════════════════════════════════════════════
  const renderAnalysis = () => (
    <>
      <Card style={{marginBottom:16}}>
        <SectionLabel>Cash Flow & Net Income</SectionLabel>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={cashFlowChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={10}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="revenue" name="Revenue" fill={colors.accent} radius={[3,3,0,0]}/>
            <Bar dataKey="expenses" name="Expenses" fill={colors.red} radius={[3,3,0,0]}/>
            <Bar dataKey="debtService" name="Debt" fill={colors.gold} radius={[3,3,0,0]}/>
            <Line type="monotone" dataKey="net" name="Net Cash" stroke={colors.orange} strokeWidth={2} dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{marginBottom:16}}>
        <SectionLabel>Equity Growth</SectionLabel>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={equityChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={10}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="equity" name="Property Equity" stackId="1" stroke={colors.accent} fill={colors.accent} fillOpacity={0.4}/>
            <Area type="monotone" dataKey="cashFlow" name="Cumulative Cash" stackId="1" stroke={colors.teal} fill={colors.teal} fillOpacity={0.3}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginBottom:16}}>
        <Card>
          <SectionLabel>Year 1 Expenses</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={expensePie} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>{expensePie.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionLabel>Sale Proceeds</SectionLabel>
          <div style={{fontSize:13,lineHeight:2.2,color:'var(--text-secondary)'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>Gross Equity</span><span>{fmt(sell.grossProceeds)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',color:'var(--red)'}}><span>− Selling Costs</span><span>{fmt(sell.sellingCosts)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',color:'var(--red)'}}><span>− Capital Gains</span><span>{fmt(sell.capitalGainsTax)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border-primary)',paddingTop:8,marginTop:8,fontWeight:700,color:'var(--accent)'}}><span>Net to Invest</span><span>{fmt(sell.netProceeds)}</span></div>
          </div>
        </Card>
      </div>

      {/* Year-by-Year Table — bottom of analysis */}
      <Card style={{overflowX:'auto'}}>
        <SectionLabel>Year-by-Year Comparison</SectionLabel>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:500}}>
          <thead><tr style={{borderBottom:'1px solid var(--border-primary)'}}>
            {['Yr','Prop Value','Equity','Cash Flow',HOLD_LABEL+' Total',SELL_LABEL,show1031&&'1031'].filter(Boolean).map(h=>
              <th key={h} style={{padding:'8px 4px',textAlign:'right',color:'var(--gold)',fontWeight:700,fontSize:11,textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>{h}</th>
            )}
          </tr></thead>
          <tbody>{hold.yearlyData.map((d,i)=>(
            <tr key={i} style={{borderBottom:'1px solid var(--border-primary)'}}>
              <td style={{padding:'5px 4px',color:'var(--text-muted)'}}>{d.year}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--text-secondary)'}}>{fmtK(d.propertyValue)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--accent)'}}>{fmtK(d.equity)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:d.netCashFlow>=0?'var(--green)':'var(--red)'}}>{fmtK(d.netCashFlow)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--accent)',fontWeight:600}}>{fmtK(d.equity+d.cumulativeCashFlow)}</td>
              <td style={{padding:'5px 4px',textAlign:'right',color:'var(--blue)'}}>{fmtK(sell.yearlyData[i]?.investedValue)}</td>
              {show1031&&<td style={{padding:'5px 4px',textAlign:'right',color:'var(--purple)'}}>{fmtK((exch.yearlyData[i]?.equity||0)+(exch.yearlyData[i]?.cumulativeCashFlow||0))}</td>}
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // PRO TABS
  // ═══════════════════════════════════════════════════════════
  const renderTax = () => (
    <Card>
      <SectionLabel>Tax Benefits Calculator</SectionLabel>
      <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:16}}>Straight-line depreciation vs. cost segregation study at your {(parseFloat(formData.taxBracket)*100).toFixed(0)}% bracket.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div style={{padding:14,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
          <div style={{fontSize:10,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Straight-Line</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--accent)'}}>{fmt(taxBenefits.annualStraightLine)}<span style={{fontSize:11,color:'var(--text-muted)'}}>/yr</span></div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{sens.yearsToHold}yr savings: {fmt(taxBenefits.totalSLSavings10yr)}</div>
        </div>
        <div style={{padding:14,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--gold-subtle)'}}>
          <div style={{fontSize:10,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Cost Segregation</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--gold)'}}>{fmt(taxBenefits.costSegYear1Bonus)}<span style={{fontSize:11,color:'var(--text-muted)'}}> yr1</span></div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{sens.yearsToHold}yr savings: {fmt(taxBenefits.totalCSSavings10yr)}</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={taxBenefits.yearlyData.slice(0,sens.yearsToHold)} margin={{top:10,right:10,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
          <XAxis dataKey="year" stroke={colors.muted} fontSize={10}/>
          <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
          <Tooltip content={<ChartTooltip/>}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          <Bar dataKey="slTaxSavings" name="SL Savings" fill={colors.accent} radius={[3,3,0,0]}/>
          <Bar dataKey="csTaxSavings" name="Cost Seg" fill={colors.gold} radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
      <p style={{fontSize:10,color:'var(--text-faint)',marginTop:10}}>Basis: {fmt(taxBenefits.depreciableBasis)} (85% of purchase price). Consult a CPA.</p>
    </Card>
  );

  const renderMortgage = () => {
    const results = mortScenarios.map(s => ({...s, calc:calculateMortgageScenario(s.principal, s.rate, s.term)}));
    // Build comparison chart data
    const maxYears = Math.max(...results.map(r=>r.term));
    const balanceChart = [];
    for(let y=1;y<=Math.min(maxYears,30);y++){
      const pt = {year:y};
      results.forEach((r,i)=>{
        const d = r.calc.yearlyData[y-1];
        if(d){pt[`bal${i}`]=d.remainingBalance;pt[`prin${i}`]=d.principalPaid;pt[`int${i}`]=d.interestPaid;}
      });
      balanceChart.push(pt);
    }
    // Payment comparison for bar chart
    const paymentCompare = results.map((r,i)=>({name:r.label,monthly:r.calc.monthlyPayment,totalInterest:r.calc.totalInterest,totalPaid:r.calc.totalPaid}));

    return (<>
      <Card style={{marginBottom:16}}>
        <SectionLabel tip="Compare loan structures side by side. Edit inputs to see charts update.">Mortgage Comparison</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginBottom:16}}>
          {results.map((s,i)=>(
            <div key={i} style={{padding:14,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>{s.label}</div>
              <InputField label="Principal" name="p" value={s.principal} onChange={e=>{const n=[...mortScenarios];n[i].principal=Number(e.target.value);setMortScenarios(n);}} type="number" prefix="$"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <InputField label="Rate" name="r" value={s.rate} onChange={e=>{const n=[...mortScenarios];n[i].rate=Number(e.target.value);setMortScenarios(n);}} type="number" suffix="%"/>
                <InputField label="Term" name="t" value={s.term} onChange={e=>{const n=[...mortScenarios];n[i].term=Number(e.target.value);setMortScenarios(n);}} type="number" suffix="yrs"/>
              </div>
              <div style={{borderTop:'1px solid var(--border-primary)',paddingTop:8,marginTop:8}}>
                <div style={{fontSize:22,fontWeight:700,color:i===0?'var(--accent)':'var(--blue)'}}>{fmt(s.calc.monthlyPayment)}<span style={{fontSize:12,color:'var(--text-muted)'}}>/mo</span></div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>Total interest: {fmtK(s.calc.totalInterest)}</div>
              </div>
            </div>
          ))}
        </div>
        {results.length>=2&&results[0].calc.monthlyPayment>0&&results[1].calc.monthlyPayment>0&&(()=>{
          const r0=results[0].calc, r1=results[1].calc;
          const monthlyDiff=r1.monthlyPayment-r0.monthlyPayment;
          const interestDiff=r1.totalInterest-r0.totalInterest;
          const monthlyLabel=monthlyDiff>0?`costs ${fmt(monthlyDiff)} more/mo`:`saves ${fmt(Math.abs(monthlyDiff))}/mo`;
          const interestLabel=interestDiff>0?`${fmt(interestDiff)} more total interest`:`${fmt(Math.abs(interestDiff))} less total interest`;
          return (
            <div style={{padding:12,borderRadius:8,background:'var(--bg-subtle)',border:'1px solid var(--border-accent)',fontSize:14,color:'var(--text-secondary)'}}>
              <strong>{results[1].label}</strong> {monthlyLabel} and pays <strong style={{color:interestDiff<=0?'var(--accent)':'var(--red)'}}>{interestLabel}</strong>.
            </div>
          );
        })()}
      </Card>

      {/* Remaining Balance Over Time */}
      <Card style={{marginBottom:16}}>
        <SectionLabel>Remaining Balance Over Time</SectionLabel>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={balanceChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={11} label={{value:'Year',position:'insideBottom',offset:-3,fill:colors.muted,fontSize:10}}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            {results.map((r,i)=><Area key={i} type="monotone" dataKey={`bal${i}`} name={r.label} stroke={i===0?colors.accent:colors.blue} fill={i===0?colors.accent:colors.blue} fillOpacity={0.12} strokeWidth={2}/>)}
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Annual Principal vs Interest */}
      <Card style={{marginBottom:16}}>
        <SectionLabel>Annual Principal vs Interest (Scenario 1)</SectionLabel>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={results[0]?.calc.yearlyData.slice(0,30)||[]} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={10}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="principalPaid" name="Principal" stackId="a" fill={colors.accent} radius={[0,0,0,0]}/>
            <Bar dataKey="interestPaid" name="Interest" stackId="a" fill={colors.red} radius={[3,3,0,0]}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly Payment Comparison */}
      <Card>
        <SectionLabel>Payment Comparison</SectionLabel>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={paymentCompare} layout="vertical" margin={{top:10,right:20,left:60,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis type="number" stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <YAxis type="category" dataKey="name" stroke={colors.muted} fontSize={12}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="monthly" name="Monthly Payment" fill={colors.accent} radius={[0,3,3,0]}/>
            <Bar dataKey="totalInterest" name="Total Interest" fill={colors.gold} radius={[0,3,3,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </>);
  };

  // Toggle snapshot for comparison (max 3)
  const toggleCompare = (idx) => {
    setCompareSelected(prev => {
      if (prev.includes(idx)) return prev.filter(i=>i!==idx);
      if (prev.length >= 3) return [...prev.slice(1), idx]; // rotate oldest out
      return [...prev, idx];
    });
  };

  // Compute results for all snapshots
  const snapshotResults = useMemo(() => snapshots.map(s => {
    const adj = {...formData, annualAppreciation:s.sens.appreciation/100, vacancyRate:s.sens.vacancyRate};
    const h = calculateHoldScenario(adj, s.sens.yearsToHold);
    const sv = calculateSellScenario(adj, s.sens.yearsToHold, s.sens.altReturn/100);
    const noi = (h.yearlyData[0]?.effectiveRent||0) - (h.yearlyData[0]?.opExpenses||0) - (h.yearlyData[0]?.maintenance||0);
    const capRate = noi / (parseFloat(formData.currentValue)||1) * 100;
    return { ...s, hold: h, sell: sv, noi, capRate, cashFlow: h.yearlyData[0]?.netCashFlow||0 };
  }), [snapshots, formData]);

  const COMPARE_COLORS = [colors.accent, colors.blue, colors.gold];

  const renderSnapshots = () => {
    const selected = compareSelected.filter(i => i < snapshotResults.length);
    const compareData = selected.map(i => snapshotResults[i]);

    return (<>
      {/* Save controls */}
      <Card style={{marginBottom:16}}>
        <SectionLabel tip="Save your current slider assumptions as a named scenario. Compare up to 3 side by side.">What-If Snapshots</SectionLabel>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <input value={snapName} onChange={e=>setSnapName(e.target.value)} placeholder="Scenario name..." onKeyDown={e=>{if(e.key==='Enter')saveSnapshot();}}
            style={{flex:1,padding:'10px 14px',borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--input-bg)',color:'var(--text-primary)',fontSize:14,outline:'none'}}/>
          <button onClick={saveSnapshot} disabled={!snapName.trim()} style={{padding:'10px 20px',borderRadius:8,border:'none',background:snapName.trim()?'var(--accent)':'var(--text-dim)',color:'#fff',fontSize:14,fontWeight:700,cursor:snapName.trim()?'pointer':'not-allowed'}}>Save</button>
        </div>

        {snapshots.length===0&&<p style={{fontSize:14,color:'var(--text-faint)',textAlign:'center',padding:20}}>No snapshots yet. Adjust the sliders above, name the scenario, and save.</p>}

        {/* Snapshot list with checkboxes */}
        {snapshotResults.map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:12,borderRadius:8,border:`1.5px solid ${compareSelected.includes(i)?COMPARE_COLORS[compareSelected.indexOf(i)]||'var(--accent)':'var(--border-primary)'}`,marginBottom:8,background:compareSelected.includes(i)?'var(--bg-subtle)':'transparent',transition:'all 0.15s'}}>
            {/* Checkbox */}
            <div onClick={()=>toggleCompare(i)} style={{width:22,height:22,borderRadius:4,border:`2px solid ${compareSelected.includes(i)?COMPARE_COLORS[compareSelected.indexOf(i)]:'var(--border-primary)'}`,background:compareSelected.includes(i)?COMPARE_COLORS[compareSelected.indexOf(i)]:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff',fontSize:14,fontWeight:700}}>
              {compareSelected.includes(i)&&'✓'}
            </div>
            {/* Info */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{s.name}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Vac {s.sens.vacancyRate}% · App {s.sens.appreciation}% · Alt {s.sens.altReturn}% · {s.sens.yearsToHold}yr</div>
            </div>
            {/* Quick metrics */}
            <div style={{display:'flex',gap:12,alignItems:'center',flexShrink:0}}>
              <div style={{textAlign:'right'}}><div style={{fontSize:13,fontWeight:700,color:'var(--accent)'}}>{fmtK(s.hold.totalWealth)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>{HOLD_LABEL}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:13,fontWeight:700,color:'var(--blue)'}}>{fmtK(s.sell.totalWealthAtEnd)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>{SELL_LABEL}</div></div>
              <button onClick={()=>setSens({...s.sens})} style={{padding:'4px 10px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--accent)',fontSize:11,cursor:'pointer'}}>Load</button>
              <button onClick={()=>{setSnapshots(snapshots.filter((_,j)=>j!==i));setCompareSelected(prev=>prev.filter(j=>j!==i).map(j=>j>i?j-1:j));}} style={{padding:'4px 8px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--red)',fontSize:11,cursor:'pointer'}}>x</button>
            </div>
          </div>
        ))}

        {snapshots.length>=2&&<p style={{fontSize:12,color:'var(--text-muted)',marginTop:8,textAlign:'center'}}>Check 2-3 scenarios above to compare them side by side below.</p>}
      </Card>

      {/* ── COMPARISON VIEW ── */}
      {selected.length>=2&&(<>
        {/* Grouped Bar Chart: Hold vs Sell per scenario */}
        <Card style={{marginBottom:16}}>
          <SectionLabel>Scenario Comparison: Total Wealth</SectionLabel>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={compareData.map((s,i)=>({name:s.name,[HOLD_LABEL]:s.hold.totalWealth,[SELL_LABEL]:s.sell.totalWealthAtEnd,Advantage:s.hold.totalWealth-s.sell.totalWealthAtEnd}))} margin={{top:10,right:10,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
              <XAxis dataKey="name" stroke={colors.muted} fontSize={12}/>
              <YAxis stroke={colors.muted} fontSize={11} tickFormatter={fmtK}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Bar dataKey={HOLD_LABEL} fill={colors.accent} radius={[4,4,0,0]}/>
              <Bar dataKey={SELL_LABEL} fill={colors.blue} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar overlay */}
        <Card style={{marginBottom:16}}>
          <SectionLabel>Multi-Dimensional Comparison</SectionLabel>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={[
              {metric:'Hold Wealth',...Object.fromEntries(compareData.map((s,i)=>[s.name,s.hold.totalWealth/Math.max(...compareData.map(d=>d.hold.totalWealth),1)*100]))},
              {metric:'Sell Wealth',...Object.fromEntries(compareData.map((s,i)=>[s.name,s.sell.totalWealthAtEnd/Math.max(...compareData.map(d=>d.sell.totalWealthAtEnd),1)*100]))},
              {metric:'Cash Flow',...Object.fromEntries(compareData.map((s,i)=>[s.name,Math.max(0,s.cashFlow/Math.max(...compareData.map(d=>Math.abs(d.cashFlow)),1)*100)]))},
              {metric:'Cap Rate',...Object.fromEntries(compareData.map((s,i)=>[s.name,s.capRate/Math.max(...compareData.map(d=>d.capRate),1)*100]))},
              {metric:'Hold Period',...Object.fromEntries(compareData.map((s,i)=>[s.name,s.sens.yearsToHold/30*100]))},
            ]}>
              <PolarGrid stroke={colors.grid}/>
              <PolarAngleAxis dataKey="metric" tick={{fontSize:11,fill:colors.muted}}/>
              <PolarRadiusAxis tick={false} axisLine={false}/>
              {compareData.map((s,i)=><Radar key={i} name={s.name} dataKey={s.name} stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]} fillOpacity={0.15} strokeWidth={2}/>)}
              <Legend wrapperStyle={{fontSize:12}}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Comparison Table */}
        <Card>
          <SectionLabel>Side-by-Side Comparison</SectionLabel>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:400}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--border-primary)'}}>
                  <th style={{textAlign:'left',padding:'10px 8px',color:'var(--gold)',fontWeight:700,fontSize:11,textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>Metric</th>
                  {compareData.map((s,i)=><th key={i} style={{textAlign:'right',padding:'10px 8px',color:COMPARE_COLORS[i],fontWeight:700,fontSize:12}}>{s.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  [HOLD_LABEL+' Total Wealth',d=>fmtK(d.hold.totalWealth),'accent'],
                  [SELL_LABEL,d=>fmtK(d.sell.totalWealthAtEnd),'blue'],
                  ['Advantage (Hold-Sell)',d=>{const v=d.hold.totalWealth-d.sell.totalWealthAtEnd;return <span style={{color:v>=0?'var(--accent)':'var(--red)'}}>{v>=0?'+':''}{fmtK(v)}</span>;}],
                  ['Year 1 Cash Flow',d=><span style={{color:(d.cashFlow>=0)?'var(--accent)':'var(--red)'}}>{fmtK(d.cashFlow)}</span>],
                  ['Cap Rate',d=>`${d.capRate.toFixed(1)}%`],
                  ['Vacancy',d=>`${d.sens.vacancyRate}%`],
                  ['Appreciation',d=>`${d.sens.appreciation}%`],
                  ['Alt. Return',d=>`${d.sens.altReturn}%`],
                  ['Hold Period',d=>`${d.sens.yearsToHold} yrs`],
                  ['Recommendation',d=>{const better=d.hold.totalWealth>=d.sell.totalWealthAtEnd;return <span style={{color:better?'var(--accent)':'var(--blue)',fontWeight:700}}>{better?HOLD_LABEL:SELL_LABEL}</span>;}],
                ].map(([label,fn],ri)=>(
                  <tr key={ri} style={{borderBottom:'1px solid var(--border-primary)'}}>
                    <td style={{padding:'8px',color:'var(--text-muted)',fontSize:12}}>{label}</td>
                    {compareData.map((s,ci)=>{
                      const val = fn(s);
                      // Highlight the best value in the row
                      const vals = compareData.map(d=>fn(d));
                      return <td key={ci} style={{textAlign:'right',padding:'8px',color:'var(--text-primary)',fontWeight:600}}>{val}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>)}
    </>);
  };

  const renderAI = () => (
    <Card>
      <SectionLabel tip="AI generates a written analysis of your investment scenarios using the current slider assumptions.">AI Investment Summary</SectionLabel>

      {/* Preset cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,marginBottom:20}}>
        {AI_PRESETS.map(p=>(
          <div key={p.value} onClick={()=>setAiPreset(p.value)} style={{
            padding:'12px 14px',borderRadius:8,cursor:'pointer',transition:'all 0.15s',
            background:aiPreset===p.value?'var(--bg-subtle)':'var(--bg-primary)',
            border:`1.5px solid ${aiPreset===p.value?'var(--accent)':'var(--border-primary)'}`,
          }}>
            <div style={{fontSize:14,fontWeight:700,color:aiPreset===p.value?'var(--accent)':'var(--text-primary)',marginBottom:4}}>{p.label}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',lineHeight:1.4}}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
        <SelectField label="Tone" name="tone" value={aiTone} onChange={e=>setAiTone(e.target.value)} options={AI_TONES}/>
        <SelectField label="Length" name="length" value={aiLength} onChange={e=>setAiLength(e.target.value)} options={AI_LENGTHS}/>
        <SelectField label="AI Model" name="provider" value={aiProvider} onChange={e=>setAiProvider(e.target.value)} options={[{value:'claude',label:'Claude (Anthropic)'},{value:'gemini',label:'Gemini (Free)'}]}/>
      </div>

      <button onClick={generateAI} disabled={aiLoading} style={{
        width:'100%',padding:'14px 24px',borderRadius:8,border:'none',
        background:aiLoading?'var(--text-dim)':'var(--accent)',color:'#fff',
        fontSize:16,fontWeight:700,cursor:aiLoading?'wait':'pointer',marginBottom:16,
      }}>
        {aiLoading?'Generating...':'Generate Summary'}
      </button>

      {aiLoading ? (
        /* Loading skeleton */
        <div style={{padding:20,borderRadius:10,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
          {[100,85,92,70,88].map((w,i)=>(
            <div key={i} style={{height:16,borderRadius:4,background:'var(--border-primary)',marginBottom:12,width:`${w}%`,animation:'pulse 1.5s ease-in-out infinite',opacity:0.4}}/>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:0.6}}`}</style>
          <div style={{textAlign:'center',fontSize:13,color:'var(--text-faint)',marginTop:8}}>Analyzing your property data...</div>
        </div>
      ) : aiSummary ? (
        <div style={{padding:20,borderRadius:10,background:'var(--bg-primary)',border:'1px solid var(--border-accent)',fontSize:15,color:'var(--text-secondary)',lineHeight:1.8}}>
          <div dangerouslySetInnerHTML={{__html: renderMarkdown(aiSummary)}} />
          <div style={{marginTop:16,display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={generateAI} style={{padding:'8px 16px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>Regenerate</button>
            <button onClick={()=>navigator.clipboard?.writeText(aiSummary)} style={{padding:'8px 16px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>Copy</button>
            {proUserEmail&&<button onClick={async()=>{
              try{
                const resp=await fetch('/api/send-code',{method:'POST',headers:{'Content-Type':'application/json'},
                  body:JSON.stringify({email:proUserEmail,name:'PropertyPath Summary',skipCode:true,
                    customSubject:'Your PropertyPath Investment Analysis',
                    customHtml:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#F8FAFC;border-radius:12px;"><div style="text-align:center;margin-bottom:24px;"><h1 style="font-size:24px;color:#167A5E;margin:0;">Property<span style="color:#9A7820;">Path</span></h1><p style="color:#94A3B8;font-size:13px;">by Vacation Home Group</p></div><div style="font-size:15px;color:#1E293B;line-height:1.8;">${renderMarkdown(aiSummary)}</div><hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;"/><p style="font-size:11px;color:#94A3B8;text-align:center;">Vacation Home Group &middot; Real Broker NH</p></div>`})});
                alert(resp.ok?'Summary emailed!':'Failed to send.');
              }catch(_e){alert('Failed to send.');}
            }} style={{padding:'8px 16px',borderRadius:6,border:'1px solid var(--accent)',background:'transparent',color:'var(--accent)',fontSize:13,cursor:'pointer'}}>Email to Me</button>}
          </div>
        </div>
      ) : (
        <div style={{padding:24,textAlign:'center',color:'var(--text-faint)',fontSize:14}}>
          Pick a preset above and click "Generate Summary" for an AI analysis tailored to your audience.
        </div>
      )}
    </Card>
  );

  // ── How It Works tab ──
  const renderHowItWorks = () => (
    <div>
      <Card style={{marginBottom:16}}>
        <SectionLabel>How PropertyPath Works</SectionLabel>
        <p style={{fontSize:15,color:'var(--text-secondary)',lineHeight:1.7,marginBottom:20}}>
          This tool models three investment scenarios for your short-term rental property and recommends the best path based on your specific numbers and assumptions.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
          {[
            ['1','Enter Property Data','Purchase price, current value, rental income, expenses, mortgage details, and property condition (roof, HVAC, water heater ages).'],
            ['2','Set Market Assumptions','Annual appreciation rate, vacancy rate, and what you\'d earn if you sold and invested elsewhere (S&P 500, bonds, etc).'],
            ['3','Choose Your Strategy','Decide if you\'re interested in holding, selling outright, or exploring a 1031 exchange into a replacement property.'],
            ['4','Review the Dashboard','Metric cards, interactive charts, and a year-by-year table show you exactly how each scenario plays out over your chosen time horizon.'],
            ['5','Tune with Sliders','The assumptions bar at the top lets you stress-test in real time. Watch the recommendation shift as you drag vacancy, appreciation, and returns.'],
            ['6','Go Pro (Free)','Unlock Tax Benefits, Mortgage Comparison, What-If Snapshots, and AI-powered summaries — at no cost for VHG clients.'],
          ].map(([n,t,d],i)=>(
            <div key={i} style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:15,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>{n}</div>
              <h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>{t}</h3>
              <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{marginBottom:16}}>
        <SectionLabel>Key Metrics Explained</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
          {[
            [HOLD_LABEL+' Total Wealth','Property equity + cumulative net cash flow over the hold period. This is what you\'d be worth if you kept renting.'],
            ['Sell & Invest Value','After-tax sale proceeds invested at your chosen alternative return rate. Accounts for realtor fees, closing costs, capital gains, and depreciation recapture.'],
            ['1031 Exchange','Tax-deferred swap into a replacement property. Defers capital gains and depreciation recapture, letting your full equity compound in the new property.'],
            ['Recommendation','Whichever scenario produces the highest total wealth at the end of your hold period wins. The advantage shows the dollar difference.'],
            ['Sensitivity Sliders','Vacancy, appreciation, alternative returns, and hold period. All charts recalculate instantly when you adjust.'],
            ['Radar Chart','Compares scenarios across 5 dimensions: total wealth, cash flow, tax efficiency, liquidity, and appreciation exposure.'],
          ].map(([term,def],i)=>(
            <div key={i} style={{padding:12,borderRadius:8,border:'1px solid var(--border-primary)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--gold)',marginBottom:4,fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase',letterSpacing:'0.08em'}}>{term}</div>
              <div style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.5}}>{def}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Documentation Downloads */}
      <Card style={{marginTop:16}}>
        <SectionLabel>Documentation</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:16}}>
          <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
            <div style={{fontSize:28,marginBottom:8}}>📖</div>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>User Manual</h3>
            <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.5,marginBottom:12}}>Complete guide to every feature, tab, chart, and slider in the tool.</p>
            <a href="/docs/PropertyPath_User_Manual.docx" download style={{display:'inline-block',padding:'8px 16px',borderRadius:6,background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Download</a>
          </div>
          <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
            <div style={{fontSize:28,marginBottom:8}}>📋</div>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>Glossary</h3>
            <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.5,marginBottom:12}}>24 terms defined: 1031 Exchange, Cap Rate, Cost Segregation, NOI, and more.</p>
            <a href="/docs/PropertyPath_Glossary.docx" download style={{display:'inline-block',padding:'8px 16px',borderRadius:6,background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Download</a>
          </div>
        </div>
      </Card>
    </div>
  );
  const renderSettings = () => {
    const saveSettings = () => {
      try{
        localStorage.setItem('vhg-gemini-key',geminiKey);
        localStorage.setItem('vhg-notify-emails',notifyEmails);
      }catch(_e){}
      setSettingsSaved(true);
      setTimeout(()=>setSettingsSaved(false),2000);
    };
    const emailList = notifyEmails.split(',').map(e=>e.trim()).filter(Boolean);
    return (
      <Card>
        <SectionLabel>Admin Settings</SectionLabel>
        <div style={{padding:'10px 14px',borderRadius:8,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',marginBottom:20,fontSize:13,color:'var(--text-muted)'}}>
          This panel is only visible to administrators via <code style={{color:'var(--accent)'}}>?admin=true</code> URL parameter. End users will never see this tab.
        </div>

        {/* Notification Emails */}
        <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:emailList.length>0?'var(--green)':'var(--text-dim)'}}/>
            <span style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>Pro Signup Notifications</span>
          </div>
          <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}>When someone unlocks Pro, notification emails are sent to these addresses. Separate multiple emails with commas.</p>
          <InputField label="Notification Emails" name="notifyEmails" value={notifyEmails} onChange={e=>setNotifyEmails(e.target.value)} placeholder="joe@example.com, dino@example.com" tip="Comma-separated list. Each recipient gets an email with the new user's name, email, phone, and a reply button."/>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
            {emailList.map((em,i)=>(
              <span key={i} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,background:'var(--bg-subtle)',border:'1px solid var(--border-primary)',fontSize:12,color:'var(--text-secondary)'}}>
                {em}
                <span onClick={()=>setNotifyEmails(emailList.filter((_,j)=>j!==i).join(', '))} style={{cursor:'pointer',color:'var(--red)',fontWeight:700,fontSize:14}}>x</span>
              </span>
            ))}
          </div>
        </div>

        {/* Claude */}
        <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)'}}/>
            <span style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>Claude (Anthropic)</span>
          </div>
          <p style={{fontSize:13,color:'var(--text-muted)'}}>Server-side via ANTHROPIC_API_KEY env var. No browser config needed.</p>
        </div>

        {/* Gemini */}
        <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:geminiKey?'var(--green)':'var(--text-dim)'}}/>
            <span style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>Gemini (Google AI)</span>
            <span style={{fontSize:11,color:'var(--text-faint)',background:'var(--bg-card)',padding:'2px 6px',borderRadius:4}}>Free tier available</span>
          </div>
          <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}>Get a free API key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{color:'var(--gold)',textDecoration:'none'}}>aistudio.google.com/apikey</a></p>
          <InputField label="Gemini API Key" name="geminiKey" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)} placeholder="AIzaSy..." type="password" tip="Your key is stored locally in your browser. It is never sent to our servers."/>
        </div>

        <button onClick={saveSettings} style={{padding:'12px 24px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>
          {settingsSaved ? '✓ Saved' : 'Save Settings'}
        </button>

        <div style={{marginTop:24,padding:14,borderRadius:8,border:'1px solid var(--border-primary)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--gold)',marginBottom:8,fontFamily:"'JetBrains Mono',monospace",textTransform:'uppercase',letterSpacing:'0.1em'}}>Privacy</div>
          <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>
            All settings are stored in your browser's localStorage on this device only. Notification emails are passed to the verification endpoint at signup time. API keys are sent to their respective providers server-side.
          </p>
        </div>
      </Card>
    );
  };

  // ── Saved Properties comparison tab ──
  const PROP_COLORS = [colors.accent, colors.blue, colors.gold];
  const renderSavedProperties = () => {
    const propResults = savedProperties.map(p => {
      const fd = {...p.formData, vacancyRate:parseFloat(p.formData.vacancyRate)||10, mortgageRate:(parseFloat(p.formData.mortgageRate)||0)/100, annualAppreciation:(parseFloat(p.formData.annualAppreciation)||3)/100, alternativeReturn:(parseFloat(p.formData.alternativeReturn)||7)/100, taxBracket:(parseFloat(p.formData.taxBracket)||32)/100, sellingCostsPct:parseFloat(p.formData.sellingCostsPct)||7.5};
      const h = calculateHoldScenario(fd, 10);
      const s = calculateSellScenario(fd, 10, fd.alternativeReturn);
      return {...p, hold:h, sell:s};
    });

    return (<>
      <Card style={{marginBottom:16}}>
        <SectionLabel tip="Save up to 3 properties and compare them side by side.">Saved Properties</SectionLabel>
        {savedProperties.length===0&&<p style={{fontSize:14,color:'var(--text-faint)',textAlign:'center',padding:20}}>No saved properties yet. Run an analysis and click "Save Property" on the Overview tab.</p>}
        {propResults.map((p,i)=>(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:14,borderRadius:8,border:`1.5px solid ${PROP_COLORS[i]||'var(--border-primary)'}`,marginBottom:8,flexWrap:'wrap'}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:PROP_COLORS[i],flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{p.location||p.name}</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Saved {p.savedAt}</div>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center',flexShrink:0}}>
              <div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:'var(--accent)'}}>{fmtK(p.holdWealth)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>{HOLD_LABEL}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:14,fontWeight:700,color:'var(--blue)'}}>{fmtK(p.sellWealth)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>{SELL_LABEL}</div></div>
              <button onClick={()=>deleteProperty(p.id)} style={{padding:'4px 8px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--red)',fontSize:11,cursor:'pointer'}}>x</button>
              <button onClick={()=>loadProperty(p)} style={{padding:'4px 10px',borderRadius:6,border:'none',background:'var(--accent)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Load</button>
            </div>
          </div>
        ))}
      </Card>

      {propResults.length>=2&&(<>
        <Card style={{marginBottom:16}}>
          <SectionLabel>Property Comparison</SectionLabel>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={propResults.map(p=>({name:p.location||p.name,[HOLD_LABEL]:p.hold.totalWealth,[SELL_LABEL]:p.sell.totalWealthAtEnd}))} margin={{top:10,right:10,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
              <XAxis dataKey="name" stroke={colors.muted} fontSize={11}/>
              <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Bar dataKey={HOLD_LABEL} fill={colors.accent} radius={[4,4,0,0]}/>
              <Bar dataKey={SELL_LABEL} fill={colors.blue} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionLabel>Side-by-Side</SectionLabel>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:400}}>
              <thead><tr style={{borderBottom:'2px solid var(--border-primary)'}}>
                <th style={{textAlign:'left',padding:'10px 8px',color:'var(--gold)',fontSize:11,textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>Metric</th>
                {propResults.map((p,i)=><th key={i} style={{textAlign:'right',padding:'10px 8px',color:PROP_COLORS[i],fontWeight:700,fontSize:12}}>{p.location||p.name}</th>)}
              </tr></thead>
              <tbody>
                {[
                  [HOLD_LABEL+' Total',p=>fmtK(p.hold.totalWealth)],
                  [SELL_LABEL,p=>fmtK(p.sell.totalWealthAtEnd)],
                  ['Year 1 Cash Flow',p=><span style={{color:(p.hold.yearlyData[0]?.netCashFlow||0)>=0?'var(--accent)':'var(--red)'}}>{fmtK(p.hold.yearlyData[0]?.netCashFlow||0)}</span>],
                  ['Recommendation',p=><span style={{fontWeight:700,color:p.hold.totalWealth>=p.sell.totalWealthAtEnd?'var(--accent)':'var(--blue)'}}>{p.hold.totalWealth>=p.sell.totalWealthAtEnd?HOLD_LABEL:SELL_LABEL}</span>],
                ].map(([label,fn],ri)=>(
                  <tr key={ri} style={{borderBottom:'1px solid var(--border-primary)'}}>
                    <td style={{padding:'8px',color:'var(--text-muted)',fontSize:12}}>{label}</td>
                    {propResults.map((p,ci)=><td key={ci} style={{textAlign:'right',padding:'8px',fontWeight:600}}>{fn(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>)}
    </>);
  };

  // Onboarding tour steps
  const TOUR_STEPS = [
    {target:'overview',title:'Welcome to PropertyPath!',desc:'This is your investment dashboard. The Overview tab shows your key metrics and recommendation.'},
    {target:'sliders',title:'Tune Your Assumptions',desc:'Drag these sliders to stress-test vacancy, appreciation, returns, and hold period. All charts update instantly.'},
    {target:'tabs',title:'Explore Tabs',desc:'Analysis shows detailed charts. Pro users get Tax Benefits, Mortgage Comparison, What-If Snapshots, and AI Summary.'},
    {target:'actions',title:'Save & Share',desc:'Save properties for comparison, generate PDF reports, email results, or share a link.'},
  ];

  // Admin mode — accessed via ?admin=true in URL (for site owner only)
  const isAdmin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === 'true';

  // ── Tab config ──
  const tabs = [
    {id:'overview',label:'Overview'},
    {id:'analysis',label:'Analysis'},
    ...(savedProperties.length>0 ? [{id:'properties',label:`Properties (${savedProperties.length})`}] : []),
    ...(isPro ? [
      {id:'tax',label:'Tax'},
      {id:'mortgage',label:'Mortgage'},
      {id:'snapshots',label:'What-If'},
      {id:'ai',label:'AI Summary'},
    ] : []),
    ...(isAdmin ? [{id:'settings',label:'Admin'}] : []),
    {id:'how',label:'How It Works'},
  ];

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{maxWidth:1100,margin:'0 auto',padding:'16px 12px'}}>
      {/* App Header Bar — like STRcalc */}
      <AppHeader dark={dark}/>

      {/* Property info + action buttons */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div style={{fontSize:16,fontWeight:600,color:'var(--text-muted)'}}>{formData.propertyType} · {formData.location}</div>
          <div style={{padding:'4px 12px',borderRadius:20,background:rec.color==='var(--accent)'?'rgba(22,122,94,0.12)':rec.color==='var(--blue)'?'rgba(59,130,246,0.12)':'rgba(139,92,246,0.12)',border:`1px solid ${rec.color}`,display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:rec.color}}/>
            <span style={{fontSize:13,fontWeight:700,color:rec.color}}>{rec.text}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button onClick={()=>{
            // Compact share: only non-empty, non-default values with short keys
            const raw = rawFormData||formData;
            const defaults = {propertyType:'single-family',managementStyle:'self-managed',vacancyRate:'10',roofAge:'5',hvacAge:'5',waterHeaterAge:'3',annualAppreciation:'3',alternativeInvestment:'stock-market',alternativeReturn:'7',exitStrategy:'undecided',taxBracket:'32',sellingCostsPct:'7.5'};
            const keyMap = {propertyType:'t',location:'l',purchasePrice:'pp',currentValue:'cv',yearsOwned:'yo',annualRent:'ar',annualExpenses:'ae',vacancyRate:'vr',mortgageBalance:'mb',mortgageRate:'mr',mortgageYearsRemaining:'my',roofAge:'ra',hvacAge:'ha',waterHeaterAge:'wa',annualAppreciation:'ap',alternativeReturn:'rt',exitStrategy:'es',taxBracket:'tb',sellingCostsPct:'sc',managementStyle:'ms',alternativeInvestment:'ai',replacementValue:'rv',replacementRent:'rr',replacementExpenses:'re',capRate:'cr'};
            const compact = {};
            Object.entries(raw).forEach(([k,v]) => {
              if(v && v !== '' && v !== defaults[k] && keyMap[k]) compact[keyMap[k]] = v;
            });
            if(discoveryData?.situation_value) compact.ds = discoveryData.situation_value;
            if(discoveryData?.risk_value) compact.dr = discoveryData.risk_value;
            const encoded = btoa(JSON.stringify(compact)).replace(/=/g,'');
            const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
            navigator.clipboard?.writeText(url);
            alert('Share link copied! (' + url.length + ' chars)');
          }} style={{padding:'7px 14px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:12,cursor:'pointer'}}>Share Link</button>
          <button onClick={()=>generatePDF()} style={{padding:'7px 14px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:12,cursor:'pointer'}}>PDF Report</button>
          {!isPro&&<button onClick={onProClick} style={{padding:'7px 16px',borderRadius:6,border:'none',background:'var(--gold)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>PRO</button>}
          <button onClick={onEditAssumptions} style={{padding:'7px 16px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:13,cursor:'pointer'}}>← Edit</button>
        </div>
      </div>

      {/* Assumptions Bar — always visible */}
      <AssumptionsBar/>

      {/* Tabs */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab}/>

      {/* Pro upsell for non-pro users */}
      {!isPro && (activeTab==='overview'||activeTab==='analysis') && (
        <div style={{marginBottom:12,padding:'10px 16px',borderRadius:8,background:'var(--gold-subtle)',border:'1px solid rgba(154,120,32,0.2)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <span style={{fontSize:14,color:'var(--text-muted)'}}><strong style={{color:'var(--gold)'}}>PRO</strong> adds Tax Benefits, Mortgage Comparison, What-If Snapshots, and AI Summary.</span>
          <button onClick={onProClick} style={{padding:'6px 14px',borderRadius:6,border:'none',background:'var(--gold)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Unlock</button>
        </div>
      )}

      {/* Content */}
      {activeTab==='overview'&&renderOverview()}
      {activeTab==='analysis'&&renderAnalysis()}
      {activeTab==='properties'&&renderSavedProperties()}
      {activeTab==='how'&&renderHowItWorks()}
      {activeTab==='tax'&&isPro&&renderTax()}
      {activeTab==='mortgage'&&isPro&&renderMortgage()}
      {activeTab==='snapshots'&&isPro&&renderSnapshots()}
      {activeTab==='ai'&&isPro&&renderAI()}
      {activeTab==='settings'&&isAdmin&&renderSettings()}

      {/* Spacer for mobile bottom nav */}
      <div style={{height:64}}/>

      {/* Onboarding Tour */}
      {showTour&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={dismissTour}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:12,padding:'28px 32px',maxWidth:400,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {TOUR_STEPS.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=tourStep?'var(--accent)':'var(--border-primary)'}}/>)}
            </div>
            <div style={{fontSize:13,color:'var(--text-faint)',fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>{tourStep+1}/{TOUR_STEPS.length}</div>
            <h3 style={{fontSize:20,fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>{TOUR_STEPS[tourStep].title}</h3>
            <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.6,marginBottom:20}}>{TOUR_STEPS[tourStep].desc}</p>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <button onClick={dismissTour} style={{padding:'8px 16px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-faint)',fontSize:13,cursor:'pointer'}}>Skip Tour</button>
              <button onClick={()=>{if(tourStep<TOUR_STEPS.length-1)setTourStep(tourStep+1);else dismissTour();}} style={{padding:'8px 20px',borderRadius:6,border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
                {tourStep===TOUR_STEPS.length-1?'Get Started':'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div style={{
        position:'fixed',bottom:0,left:0,right:0,
        background:'var(--bg-card)',borderTop:'1px solid var(--border-primary)',
        display:'none',justifyContent:'space-around',padding:'6px 0 env(safe-area-inset-bottom,6px)',
        zIndex:100,
      }} className="mobile-bottom-nav">
        {[
          {id:'overview',icon:'📊',label:'Overview'},
          {id:'analysis',icon:'📈',label:'Analysis'},
          ...(savedProperties.length>0?[{id:'properties',icon:'🏠',label:'Properties'}]:[]),
          ...(isPro?[{id:'ai',icon:'🤖',label:'AI'}]:[]),
          {id:'how',icon:'❓',label:'Help'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            display:'flex',flexDirection:'column',alignItems:'center',gap:2,
            background:'none',border:'none',cursor:'pointer',padding:'4px 8px',minWidth:0,
            color:activeTab===t.id?'var(--accent)':'var(--text-faint)',
          }}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:activeTab===t.id?700:500}}>{t.label}</span>
          </button>
        ))}
      </div>

      <style>{`@media(max-width:640px){.mobile-bottom-nav{display:flex!important;}}`}</style>
    </div>
  );
}
