import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts';
import { Card, SectionLabel, Slider, TabBar, ChartTooltip, InputField, SelectField, AppHeader } from './UI';
import { calculateHoldScenario, calculateSellScenario, calculate1031Scenario, calculateTaxBenefits, calculateMortgageScenario, fmt, fmtK } from '../utils/calculations';
import { chartColors } from '../utils/theme';

export default function Dashboard({formData, sellResult, exchangeResult, onEditAssumptions, dark, isPro, onProClick}) {
  const show1031 = !!exchangeResult;
  const colors = chartColors(dark);

  const [activeTab, setActiveTab] = useState('overview');
  const [slidersOpen, setSlidersOpen] = useState(true);

  // Sensitivity — formData values are already normalized (0.03 = 3%, 0.07 = 7%)
  const [sens, setSens] = useState({
    vacancyRate: parseFloat(formData.vacancyRate)||10,
    appreciation: Math.round((parseFloat(formData.annualAppreciation)||0.03)*100),
    altReturn: Math.round((parseFloat(formData.alternativeReturn)||0.07)*100),
    yearsToHold: 10,
  });

  // What-If Snapshots (Pro)
  const [snapshots, setSnapshots] = useState([]);
  const [snapName, setSnapName] = useState('');

  // Mortgage Scenarios (Pro)
  const [mortScenarios, setMortScenarios] = useState([
    {label:'Current',principal:parseFloat(formData.mortgageBalance)||0,rate:parseFloat(formData.mortgageRate)*100||6.5,term:parseInt(formData.mortgageYearsRemaining)||30},
    {label:'Refi Option',principal:parseFloat(formData.mortgageBalance)||0,rate:5.5,term:30},
  ]);

  // AI Summary with user controls
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState('claude');
  const [aiPreset, setAiPreset] = useState('investor-brief');
  const [aiTone, setAiTone] = useState('professional');
  const [aiLength, setAiLength] = useState('medium');

  // API Key Settings
  const [geminiKey, setGeminiKey] = useState(() => {try{return localStorage.getItem('vhg-gemini-key')||'';}catch(_e){return '';}});
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
  const AI_LENGTHS = [{value:'short',label:'Short (2-3 sentences)',tokens:200},{value:'medium',label:'Medium (1 paragraph)',tokens:400},{value:'detailed',label:'Detailed (2-3 paragraphs)',tokens:800}];

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
    if(hW>sW) return {text:'Hold Property',color:'var(--accent)'};
    return {text:'Sell & Invest',color:'var(--blue)'};
  }, [hold, sell, exch, show1031]);

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
    const baseData = `Property: ${formData.propertyType} in ${formData.location}. Value: ${fmt(formData.currentValue)}, Purchase: ${fmt(formData.purchasePrice)}, Rent: ${fmt(formData.annualRent)}, Expenses: ${fmt(formData.annualExpenses)}, Vacancy: ${sens.vacancyRate}%, Mortgage: ${fmt(formData.mortgageBalance)} at ${(parseFloat(formData.mortgageRate)*100).toFixed(1)}%. Hold ${sens.yearsToHold}yr: ${fmtK(hold.totalWealth)}, Sell: ${fmtK(sell.totalWealthAtEnd)}${show1031?`, 1031: ${fmtK(exch.totalWealth)}`:''}. Rec: ${rec.text}, advantage ${fmtK(Math.abs(hold.totalWealth-sell.totalWealthAtEnd))}.`;
    const presetInstructions = {
      'investor-brief':'Write a concise investment brief. Lead with the recommendation and key numbers. Include ROI metrics. End with the single biggest risk factor.',
      'partner-explainer':'Explain this like you\'re talking to someone\'s spouse who isn\'t in real estate. No jargon. Use simple comparisons. Help them understand the trade-offs of holding vs selling.',
      'cpa-memo':'Write a tax-focused memo. Cover depreciation (straight-line and cost segregation potential), capital gains exposure if selling, depreciation recapture, and 1031 exchange tax deferral if applicable.',
      'risk-assessment':'Focus entirely on risk. What assumptions are most fragile? What market conditions would flip the recommendation? What\'s the worst-case for each scenario? Be specific about dollar amounts at risk.',
      'market-letter':'Write a polished, professional market analysis suitable for a real estate newsletter. Contextualize the numbers with market observations. Make it feel like expert commentary.',
      'quick-take':'One paragraph maximum. Fastest possible read. Lead with the bottom line, include 2-3 key numbers, done.',
    };
    const prompt = `You are a real estate investment analyst. ${presetInstructions[aiPreset]||''} Tone: ${aiTone}. Length: ${aiLength} (${lengthCfg?.tokens||400} tokens max). Data: ${baseData}`;
    try {
      if (aiProvider === 'claude') {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:lengthCfg?.tokens||400,messages:[{role:'user',content:prompt}]}),
        });
        const data = await resp.json();
        setAiSummary(data.content?.[0]?.text || 'Unable to generate summary.');
      } else {
        // Gemini
        const key = geminiKey || (()=>{try{return localStorage.getItem('vhg-gemini-key')||'';}catch(_e){return '';}})();
        if (!key) {
          setAiSummary('No Gemini API key found. Go to the Settings tab to add your free key from aistudio.google.com/apikey');
        } else {
          const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:lengthCfg?.tokens||400}}),
          });
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          setAiSummary(text || 'Gemini returned no content. Check your API key in Settings.');
        }
      }
    } catch(err) { setAiSummary('AI summary unavailable. Check your connection and try again.'); }
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
          <Slider label="Appreciation" min={-5} max={15} step={1} value={sens.appreciation} displayValue={`${Math.round(sens.appreciation)}%`} tip="Annual property value growth. US historical average is ~3-4%. Hot markets can see 8-10%." onChange={e=>setSens({...sens,appreciation:e.target.value})}/>
          <Slider label="Alt. Return" min={0} max={15} step={1} value={sens.altReturn} displayValue={`${Math.round(sens.altReturn)}%`} tip="What you'd earn if you sold and invested the proceeds elsewhere. S&P 500 averages ~10% historically." onChange={e=>setSens({...sens,altReturn:e.target.value})}/>
          <Slider label="Hold Period" min={1} max={30} step={1} value={sens.yearsToHold} displayValue={`${sens.yearsToHold} yrs`} suffix=" yrs" tip="How many years into the future to project. Longer periods favor holding due to appreciation compounding." onChange={e=>setSens({...sens,yearsToHold:e.target.value})}/>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // TAB: OVERVIEW — metric cards + wealth chart + radar
  // ═══════════════════════════════════════════════════════════
  const renderOverview = () => (
    <>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:20}}>
        <Card style={{padding:'16px 18px'}}><SectionLabel tip="Property equity plus cumulative net cash flow over your hold period.">Hold Total</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--accent)'}}>{fmtK(hold.totalWealth)}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>{sens.yearsToHold}yr equity+cash</p></Card>
        <Card style={{padding:'16px 18px'}}><SectionLabel tip="After-tax sale proceeds invested at your chosen alternative return rate.">Sell & Invest</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--blue)'}}>{fmtK(sell.totalWealthAtEnd)}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>At {sens.altReturn}% return</p></Card>
        {show1031&&<Card style={{padding:'16px 18px'}}><SectionLabel tip="Tax-deferred exchange into replacement property. Defers capital gains and depreciation recapture.">1031 Exchange</SectionLabel><div style={{fontSize:28,fontWeight:700,color:'var(--purple)'}}>{fmtK(exch.totalWealth)}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>Deferred: {fmtK(exch.taxDeferred)}</p></Card>}
        <Card style={{padding:'16px 18px',background:'var(--bg-subtle)',border:'1px solid var(--border-accent)'}}><SectionLabel tip="Whichever scenario produces the highest total wealth wins.">Recommendation</SectionLabel><div style={{fontSize:24,fontWeight:700,color:rec.color}}>{rec.text}</div><p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>+{fmtK(Math.abs(hold.totalWealth-sell.totalWealthAtEnd))}</p></Card>
      </div>

      <Card style={{marginBottom:16}}>
        <SectionLabel>Cumulative Wealth</SectionLabel>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={wealthChart} margin={{top:10,right:10,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid}/>
            <XAxis dataKey="year" stroke={colors.muted} fontSize={11}/>
            <YAxis stroke={colors.muted} fontSize={10} tickFormatter={fmtK}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="hold" name="Hold" stroke={colors.accent} fill={colors.accent} fillOpacity={0.15} strokeWidth={2}/>
            <Area type="monotone" dataKey="sell" name="Sell" stroke={colors.blue} fill={colors.blue} fillOpacity={0.1} strokeWidth={2}/>
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
            <Radar name="Hold" dataKey="hold" stroke={colors.accent} fill={colors.accent} fillOpacity={0.2}/>
            <Radar name="Sell" dataKey="sell" stroke={colors.blue} fill={colors.blue} fillOpacity={0.15}/>
            {show1031&&<Radar name="1031" dataKey="exchange" stroke={colors.purple} fill={colors.purple} fillOpacity={0.15}/>}
            <Legend wrapperStyle={{fontSize:11}}/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // TAB: ANALYSIS — charts + table (merged)
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
            {['Yr','Prop Value','Equity','Cash Flow','Hold Total','Sell Value',show1031&&'1031'].filter(Boolean).map(h=>
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
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>10yr savings: {fmt(taxBenefits.totalSLSavings10yr)}</div>
        </div>
        <div style={{padding:14,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--gold-subtle)'}}>
          <div style={{fontSize:10,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Cost Segregation</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--gold)'}}>{fmt(taxBenefits.costSegYear1Bonus)}<span style={{fontSize:11,color:'var(--text-muted)'}}> yr1</span></div>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>10yr savings: {fmt(taxBenefits.totalCSSavings10yr)}</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={taxBenefits.yearlyData.slice(0,Math.min(sens.yearsToHold,10))} margin={{top:10,right:10,left:0,bottom:0}}>
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
        {results.length>=2&&results[0].calc.monthlyPayment>0&&(
          <div style={{padding:12,borderRadius:8,background:'var(--bg-subtle)',border:'1px solid var(--border-accent)',fontSize:14,color:'var(--text-secondary)'}}>
            <strong>{results[1].label}</strong> saves <strong style={{color:'var(--accent)'}}>{fmt(Math.abs(results[0].calc.monthlyPayment-results[1].calc.monthlyPayment))}/mo</strong> ({fmt(Math.abs(results[0].calc.totalInterest-results[1].calc.totalInterest))} total interest {results[1].calc.totalInterest<results[0].calc.totalInterest?'saved':'more'})
          </div>
        )}
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

  const renderSnapshots = () => (
    <Card>
      <SectionLabel>What-If Snapshots</SectionLabel>
      <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>Save assumption sets to compare scenarios.</p>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <input value={snapName} onChange={e=>setSnapName(e.target.value)} placeholder="Scenario name..." style={{flex:1,padding:'8px 12px',borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--input-bg)',color:'var(--text-primary)',fontSize:13,outline:'none'}}/>
        <button onClick={saveSnapshot} disabled={!snapName.trim()} style={{padding:'8px 16px',borderRadius:8,border:'none',background:snapName.trim()?'var(--accent)':'var(--text-dim)',color:'#fff',fontSize:13,fontWeight:700,cursor:snapName.trim()?'pointer':'not-allowed'}}>Save</button>
      </div>
      {snapshots.length===0&&<p style={{fontSize:13,color:'var(--text-faint)',textAlign:'center',padding:16}}>No snapshots yet. Adjust sliders above and save.</p>}
      {snapshots.map((s,i)=>{
        const h=calculateHoldScenario({...formData,annualAppreciation:s.sens.appreciation/100,vacancyRate:s.sens.vacancyRate},s.sens.yearsToHold);
        const sv=calculateSellScenario({...formData,annualAppreciation:s.sens.appreciation/100,vacancyRate:s.sens.vacancyRate},s.sens.yearsToHold,s.sens.altReturn/100);
        return (
          <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:10,borderRadius:8,border:'1px solid var(--border-primary)',marginBottom:8,flexWrap:'wrap',gap:6}}>
            <div><div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>{s.name}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>Vac {s.sens.vacancyRate}% · App {s.sens.appreciation}% · Alt {s.sens.altReturn}% · {s.sens.yearsToHold}yr</div></div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:700,color:'var(--accent)'}}>{fmtK(h.totalWealth)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>Hold</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:700,color:'var(--blue)'}}>{fmtK(sv.totalWealthAtEnd)}</div><div style={{fontSize:9,color:'var(--text-faint)'}}>Sell</div></div>
              <button onClick={()=>setSens({...s.sens})} style={{padding:'3px 8px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--accent)',fontSize:10,cursor:'pointer'}}>Load</button>
            </div>
          </div>
        );
      })}
    </Card>
  );

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

      {aiSummary ? (
        <div style={{padding:20,borderRadius:10,background:'var(--bg-primary)',border:'1px solid var(--border-accent)',fontSize:15,color:'var(--text-secondary)',lineHeight:1.8}}>
          {aiSummary}
          <div style={{marginTop:12,display:'flex',gap:8}}>
            <button onClick={generateAI} style={{padding:'6px 14px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:12,cursor:'pointer'}}>Regenerate</button>
            <button onClick={()=>navigator.clipboard?.writeText(aiSummary)} style={{padding:'6px 14px',borderRadius:6,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:12,cursor:'pointer'}}>Copy</button>
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
        <SectionLabel>How STRInvestCalc Works</SectionLabel>
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
            ['Hold Total Wealth','Property equity + cumulative net cash flow over the hold period. This is what you\'d be worth if you kept renting.'],
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
            <a href="/docs/STRInvestCalc_User_Manual.docx" download style={{display:'inline-block',padding:'8px 16px',borderRadius:6,background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Download</a>
          </div>
          <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)'}}>
            <div style={{fontSize:28,marginBottom:8}}>📋</div>
            <h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>Glossary</h3>
            <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.5,marginBottom:12}}>24 terms defined: 1031 Exchange, Cap Rate, Cost Segregation, NOI, and more.</p>
            <a href="/docs/STRInvestCalc_Glossary.docx" download style={{display:'inline-block',padding:'8px 16px',borderRadius:6,background:'var(--accent)',color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none'}}>Download</a>
          </div>
        </div>
      </Card>
    </div>
  );
  const renderSettings = () => {
    const saveSettings = () => {
      try{localStorage.setItem('vhg-gemini-key',geminiKey);}catch(_e){}
      setSettingsSaved(true);
      setTimeout(()=>setSettingsSaved(false),2000);
    };
    return (
      <Card>
        <SectionLabel>Admin Settings</SectionLabel>
        <div style={{padding:'10px 14px',borderRadius:8,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',marginBottom:20,fontSize:13,color:'var(--text-muted)'}}>
          This panel is only visible to administrators via <code style={{color:'var(--accent)'}}>?admin=true</code> URL parameter. End users will never see this tab.
        </div>
        <p style={{fontSize:14,color:'var(--text-muted)',marginBottom:20,lineHeight:1.6}}>
          Configure API keys for AI features. Keys are stored in the browser's localStorage on this device only.
        </p>

        <div style={{padding:16,borderRadius:8,background:'var(--bg-primary)',border:'1px solid var(--border-primary)',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)'}}/>
            <span style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>Claude (Anthropic)</span>
          </div>
          <p style={{fontSize:13,color:'var(--text-muted)'}}>Built-in. No API key needed. Powered by Claude Sonnet.</p>
        </div>

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
            API keys are stored in your browser's localStorage only. They are sent directly to the respective AI provider when you generate a summary and are never transmitted to Vacation Home Group servers. All investment calculations run entirely in your browser.
          </p>
        </div>
      </Card>
    );
  };

  // Admin mode — accessed via ?admin=true in URL (for site owner only)
  const isAdmin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === 'true';

  // ── Tab config ──
  const tabs = [
    {id:'overview',label:'Overview'},
    {id:'analysis',label:'Analysis'},
    ...(isPro ? [
      {id:'tax',label:'Tax'},
      {id:'mortgage',label:'Mortgage'},
      {id:'snapshots',label:'What-If'},
      {id:'ai',label:'AI Summary'},
      ...(isAdmin ? [{id:'settings',label:'Admin'}] : []),
    ] : []),
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
        <div style={{fontSize:16,fontWeight:600,color:'var(--text-muted)'}}>{formData.propertyType} · {formData.location}</div>
        <div style={{display:'flex',gap:6}}>
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
      {activeTab==='how'&&renderHowItWorks()}
      {activeTab==='tax'&&isPro&&renderTax()}
      {activeTab==='mortgage'&&isPro&&renderMortgage()}
      {activeTab==='snapshots'&&isPro&&renderSnapshots()}
      {activeTab==='ai'&&isPro&&renderAI()}
      {activeTab==='settings'&&isPro&&isAdmin&&renderSettings()}
    </div>
  );
}
