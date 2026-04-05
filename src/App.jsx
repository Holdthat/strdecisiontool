/**
 * STRInvestCalc — Investment Decision Tool
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
  // Theme with localStorage persistence
  const [dark, setDark] = useState(() => {
    try { const s = localStorage.getItem('vhg-theme'); return s ? s === 'dark' : true; }
    catch (_e) { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('vhg-theme', dark ? 'dark' : 'light'); } catch (_e) {}
  }, [dark]);

  // App state
  const [view, setView] = useState('landing');
  const [discoveryData, setDiscoveryData] = useState(null); // Goal discovery answers
  const [rawFormData, setRawFormData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [holdResult, setHoldResult] = useState(null);
  const [sellResult, setSellResult] = useState(null);
  const [exchangeResult, setExchangeResult] = useState(null);
  const [isPro, setIsPro] = useState(false);
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
    const n = {
      ...data,
      vacancyRate: parseFloat(data.vacancyRate)||10,
      mortgageRate: (parseFloat(data.mortgageRate)||0)/100,
      annualAppreciation: (parseFloat(data.annualAppreciation)||3)/100,
      alternativeReturn: (parseFloat(data.alternativeReturn)||7)/100,
      taxBracket: (parseFloat(data.taxBracket)||32)/100,
      sellingCostsPct: parseFloat(data.sellingCostsPct)||7.5,
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
          <Questionnaire onComplete={handleAnalyze} initialData={rawFormData} dark={dark}/>
        </div>
      )}

      {view === 'dashboard' && holdResult && sellResult && (
        <Dashboard
          formData={formData}
          holdResult={holdResult}
          sellResult={sellResult}
          exchangeResult={exchangeResult}
          onEditAssumptions={() => setView('questionnaire')}
          dark={dark}
          isPro={isPro}
          onProClick={() => setShowProGate(true)}
          discoveryData={discoveryData}
        />
      )}

      <VHGFooter dark={dark}/>

      {showProGate && (
        <ProGate
          onUnlock={(user) => { setIsPro(true); setShowProGate(false); }}
          onClose={() => setShowProGate(false)}
          discoveryData={discoveryData}
        />
      )}
    </div>
  );
}
