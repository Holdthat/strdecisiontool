/**
 * PropertyPath — Investment Decision Tool
 * Vacation Home Group · v3.3.0
 * 
 * Flow: Landing → Goal Discovery (5 questions) → Questionnaire → Dashboard
 * Discovery data feeds into AI prompts, Pro signup notifications, and CRM.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { darkVars, lightVars } from './utils/theme';
import { calculateHoldScenario, calculateSellScenario, calculate1031Scenario } from './utils/calculations';
import { NavBar, VHGFooter, ProGate } from './components/UI';
import GoalDiscovery from './components/GoalDiscovery';
import Questionnaire from './components/Questionnaire';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';

export default function App() {
  // Theme — auto-detect system preference, then localStorage override
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('vhg-theme');
      if (saved) return saved === 'dark';
      // Auto-detect system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return true;
    } catch (_e) { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('vhg-theme', dark ? 'dark' : 'light'); } catch (_e) {}
  }, [dark]);

  // Load shared analysis from URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      // Compact format (?s=...)
      const compact = params.get('s');
      if (compact) {
        const keyMap = {t:'propertyType',l:'location',pp:'purchasePrice',cv:'currentValue',yo:'yearsOwned',ar:'annualRent',ae:'annualExpenses',vr:'vacancyRate',mb:'mortgageBalance',mr:'mortgageRate',my:'mortgageYearsRemaining',ra:'roofAge',ha:'hvacAge',wa:'waterHeaterAge',ap:'annualAppreciation',rt:'alternativeReturn',es:'exitStrategy',tb:'taxBracket',sc:'sellingCostsPct',ms:'managementStyle',ai:'alternativeInvestment',rv:'replacementValue',rr:'replacementRent',re:'replacementExpenses',cr:'capRate'};
        const defaults = {propertyType:'single-family',managementStyle:'self-managed',vacancyRate:'10',roofAge:'5',hvacAge:'5',waterHeaterAge:'3',annualAppreciation:'3',alternativeInvestment:'stock-market',alternativeReturn:'7',exitStrategy:'undecided',taxBracket:'32',sellingCostsPct:'7.5'};
        const parsed = JSON.parse(atob(compact + '=='.slice(0, (4 - compact.length % 4) % 4)));
        const formData = {...defaults};
        Object.entries(parsed).forEach(([k,v]) => { if(keyMap[k]) formData[keyMap[k]] = v; });
        if (parsed.ds) setDiscoveryData({situation_value:parsed.ds, risk_value:parsed.dr||''});
        setTimeout(() => handleAnalyze(formData), 100);
        return;
      }
      // Legacy format (?share=...)
      const shared = params.get('share');
      if (shared) {
        const data = JSON.parse(decodeURIComponent(atob(shared)));
        if (data.formData) {
          if (data.discovery) setDiscoveryData(data.discovery);
          setTimeout(() => handleAnalyze(data.formData), 100);
        }
      }
    } catch (_e) {}
  }, []); // eslint-disable-line

  // App state
  const [view, setView] = useState('landing');
  const [discoveryData, setDiscoveryData] = useState(null); // Goal discovery answers
  const [rawFormData, setRawFormData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [holdResult, setHoldResult] = useState(null);
  const [sellResult, setSellResult] = useState(null);
  const [exchangeResult, setExchangeResult] = useState(null);
  const [isPro, setIsPro] = useState(() => {
    try { return !!localStorage.getItem('vhg-pro-email'); } catch(_e) { return false; }
  });
  const [proUserEmail, setProUserEmail] = useState(() => {
    try { return localStorage.getItem('vhg-pro-email')||''; } catch(_e) { return ''; }
  });
  const [showProGate, setShowProGate] = useState(false);

  const calcRef = useRef(null);
  const featRef = useRef(null);
  const proRef = useRef(null);
  const docsRef = useRef(null);

  // Navigation handler
  const handleNav = (target) => {
    if (target === 'landing') { setView('landing'); window.scrollTo({top:0,behavior:'smooth'}); }
    else if (target === 'calculator') { setView(discoveryData ? 'questionnaire' : 'discovery'); }
    else if (target === 'features') { if(view!=='landing') setView('landing'); setTimeout(()=>featRef.current?.scrollIntoView({behavior:'smooth'}),100); }
    else if (target === 'pro') { if(view!=='landing') setView('landing'); setTimeout(()=>proRef.current?.scrollIntoView({behavior:'smooth'}),100); }
    else if (target === 'resources') { if(view!=='landing') setView('landing'); setTimeout(()=>docsRef.current?.scrollIntoView({behavior:'smooth'}),100); }
  };

  // Discovery complete
  const handleDiscoveryComplete = (data) => {
    setDiscoveryData(data);
    setView('questionnaire');
    window.scrollTo({top:0,behavior:'smooth'});
  };

  // Run analysis
  const handleAnalyze = useCallback((data) => {
    const isBuyerMode = discoveryData?.situation_value === 'evaluating-purchase';
    const n = {
      ...data,
      vacancyRate: parseFloat(data.vacancyRate)||10,
      mortgageRate: (parseFloat(data.mortgageRate)||0)/100,
      annualAppreciation: (parseFloat(data.annualAppreciation)||3)/100,
      alternativeReturn: (parseFloat(data.alternativeReturn)||7)/100,
      taxBracket: (parseFloat(data.taxBracket)||32)/100,
      sellingCostsPct: parseFloat(data.sellingCostsPct)||(isBuyerMode?3:7.5),
      isBuyer: isBuyerMode,
    };
    setRawFormData(data);
    setFormData(n);
    setHoldResult(calculateHoldScenario(n, 10));
    setSellResult(calculateSellScenario(n, 10, n.alternativeReturn));
    setExchangeResult(data.exitStrategy === '1031' ? calculate1031Scenario(n, 10) : null);
    setView('dashboard');
    window.scrollTo({top:0,behavior:'smooth'});
  }, []);

  const themeVars = dark ? darkVars : lightVars;

  return (
    <div style={{
      ...themeVars,
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <NavBar dark={dark} setDark={setDark} onNav={handleNav}/>

      {view === 'landing' && (
        <LandingPage
          isPro={isPro}
          onOpenCalc={() => setView('questionnaire')}
          onStartDiscovery={() => setView('discovery')}
          onLoadSaved={() => {
            try {
              const saved = JSON.parse(localStorage.getItem('vhg-saved-properties')||'[]');
              if (saved.length > 0) {
                const latest = saved[saved.length - 1];
                if (latest.discoveryData) setDiscoveryData(latest.discoveryData);
                handleAnalyze(latest.formData);
              }
            } catch(_e) {}
          }}
          onProClick={() => setShowProGate(true)}
          featRef={featRef}
          proRef={proRef}
          docsRef={docsRef}
        />
      )}

      {view === 'discovery' && (
        <GoalDiscovery onComplete={handleDiscoveryComplete} dark={dark}/>
      )}

      {view === 'questionnaire' && (
        <div ref={calcRef}>
          <Questionnaire onComplete={handleAnalyze} initialData={rawFormData} dark={dark} discoveryData={discoveryData}/>
        </div>
      )}

      {view === 'dashboard' && holdResult && sellResult && (
        <Dashboard
          formData={formData}
          rawFormData={rawFormData}
          holdResult={holdResult}
          sellResult={sellResult}
          exchangeResult={exchangeResult}
          onEditAssumptions={() => setView('questionnaire')}
          onLoadProperty={(savedFormData) => handleAnalyze(savedFormData)}
          dark={dark}
          isPro={isPro}
          onProClick={() => setShowProGate(true)}
          discoveryData={discoveryData}
          proUserEmail={proUserEmail}
        />
      )}

      <VHGFooter dark={dark}/>

      {showProGate && (
        <ProGate
          onUnlock={(user) => {
            setIsPro(true);
            setProUserEmail(user.email||'');
            setShowProGate(false);
            try{localStorage.setItem('vhg-pro-email',user.email||'pro');localStorage.setItem('vhg-pro-name',user.name||'');}catch(_e){}
          }}
          onClose={() => setShowProGate(false)}
          discoveryData={discoveryData}
        />
      )}
    </div>
  );
}
