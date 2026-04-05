import React from 'react';
import { Card, SectionLabel, GoldDivider } from './UI';

export default function LandingPage({onOpenCalc, onStartDiscovery, onProClick, isPro, featRef, proRef, docsRef}) {
  const features = [
    {icon:'📊',title:'Personalized Analysis',desc:'Tell us your goals and risk tolerance. We tailor the analysis to what matters most to you.'},
    {icon:'🏦',title:'Hold vs. Sell vs. 1031',desc:'Three-scenario modeling with 10-year projections. Cash flow, equity, and wealth side by side.'},
    {icon:'⚙️',title:'Stress-Test Your Assumptions',desc:'Drag sliders to see how vacancy, appreciation, returns, and time horizon change the outcome.'},
    {icon:'🎯',title:'Smart Recommendation',desc:'Data-driven hold/sell/1031 recommendation that shifts dynamically with your numbers.'},
    {icon:'📈',title:'Charts and Visual Analysis',desc:'Area, bar, pie, radar, and composed charts. Side-by-side What-If comparison.'},
    {icon:'⚡',title:'No Account Required',desc:'Standard features work instantly. Everything runs in your browser. Pro is free for VHG clients.'},
  ];

  const proFeatures = [
    ['Core Calculator','',true,true],
    ['3-Scenario Analysis (Hold / Sell / 1031)',null,true,true],
    ['Sensitivity Sliders (4 core)',null,true,true],
    ['6 Interactive Charts',null,true,true],
    ['Year-by-Year Table',null,true,true],
    ['Radar Scenario Comparison',null,true,true],
    ['PRO FEATURES','',null,null],
    ['Tax Benefits Calculator (SL + Cost Seg)',null,false,true],
    ['Mortgage Scenario Comparison',null,false,true],
    ['What-If Snapshots with Side-by-Side',null,false,true],
    ['AI Investment Summary (Claude + Gemini)',null,false,true],
    ['Priority Support',null,false,true],
  ];

  return (
    <div>
      {/* HERO — Advisor-first messaging */}
      <div style={{textAlign:'center',padding:'60px 20px 48px',maxWidth:720,margin:'0 auto'}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)',marginBottom:16}}>Vacation Home Group · Your Real Estate Advisor</div>
        <h1 style={{fontSize:'clamp(28px,5vw,42px)',fontWeight:800,lineHeight:1.15,color:'var(--text-primary)',marginBottom:20,fontFamily:"'Playfair Display',Georgia,serif"}}>Not sure what to do with your property?</h1>
        <p style={{fontSize:17,color:'var(--text-muted)',lineHeight:1.7,maxWidth:580,margin:'0 auto 12px'}}>Whether you're thinking about holding, selling, refinancing, or exchanging — we'll help you model every option and find the smartest path forward.</p>
        <p style={{fontSize:15,color:'var(--text-faint)',lineHeight:1.6,maxWidth:520,margin:'0 auto 28px'}}>It starts with a few quick questions about your goals. No account needed.</p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={onStartDiscovery||onOpenCalc} style={{padding:'16px 32px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer'}}>Let's Figure It Out →</button>
          <button onClick={()=>featRef.current?.scrollIntoView({behavior:'smooth'})} style={{padding:'16px 28px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:15,cursor:'pointer'}}>How It Works</button>
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:32,marginTop:40,flexWrap:'wrap'}}>
          {[['5','Quick Questions'],['3','Scenarios'],['10+','Charts'],['AI','Powered']].map(([v,l],i)=>(
            <div key={i} style={{textAlign:'center'}}><div style={{fontSize:24,fontWeight:800,color:'var(--accent)'}}>{v}</div><div style={{fontSize:11,color:'var(--text-faint)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div ref={featRef} style={{maxWidth:960,margin:'0 auto',padding:'48px 20px'}} id="features">
        <div style={{textAlign:'center',marginBottom:32}}>
          <SectionLabel>What's included</SectionLabel>
          <h2 style={{fontSize:'clamp(22px,4vw,28px)',fontWeight:700,color:'var(--text-primary)',marginTop:8}}>Everything you need to evaluate an STR investment</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
          {features.map((f,i)=>(<Card key={i}><div style={{fontSize:28,marginBottom:10}}>{f.icon}</div><h3 style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>{f.title}</h3><p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>{f.desc}</p></Card>))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{maxWidth:720,margin:'0 auto',padding:'48px 20px'}}>
        <div style={{textAlign:'center',marginBottom:32}}><SectionLabel>Simple Process</SectionLabel><h2 style={{fontSize:'clamp(22px,4vw,28px)',fontWeight:700,color:'var(--text-primary)',marginTop:8}}>From property details to decision in 5 minutes</h2></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:20}}>
          {[['1','Enter Property Info','Price, rent, expenses, mortgage.'],['2','Set Assumptions','Appreciation, vacancy, returns.'],['3','Analyze','Dashboard updates instantly.'],['4','Decide','Hold, sell, or 1031 — backed by data.']].map(([n,t,d],i)=>(
            <div key={i} style={{textAlign:'center'}}><div style={{width:36,height:36,borderRadius:'50%',background:'var(--accent)',color:'#fff',fontSize:16,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>{n}</div><h3 style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>{t}</h3><p style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.6}}>{d}</p></div>
          ))}
        </div>
      </div>

      {/* STANDARD vs PRO */}
      <div ref={proRef} style={{maxWidth:640,margin:'0 auto',padding:'48px 20px'}} id="pro">
        <div style={{textAlign:'center',marginBottom:24}}><SectionLabel>Pricing</SectionLabel><h2 style={{fontSize:'clamp(22px,4vw,28px)',fontWeight:700,color:'var(--text-primary)',marginTop:8}}>Standard vs Pro</h2><p style={{fontSize:14,color:'var(--text-muted)',marginTop:8}}>Pro is available at <strong>no charge</strong> to Vacation Home Group clients.</p></div>
        <Card>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead><tr style={{borderBottom:'2px solid var(--border-primary)'}}><th style={{textAlign:'left',padding:'10px 6px',color:'var(--text-primary)'}}>Feature</th><th style={{textAlign:'center',padding:'10px 6px',color:'var(--text-primary)',width:70}}>Standard</th><th style={{textAlign:'center',padding:'10px 6px',color:'var(--gold)',fontWeight:700,width:70}}>PRO</th></tr></thead>
            <tbody>{proFeatures.map(([name,desc,std,pro],i)=>{
              const isHeader = std===null;
              return (
                <tr key={i} style={{borderBottom:isHeader?'none':'1px solid var(--border-primary)'}}>
                  <td style={{padding:'8px 6px',color:isHeader?'var(--gold)':'var(--text-secondary)',fontWeight:isHeader?700:400,fontSize:isHeader?11:13,...(isHeader?{letterSpacing:'0.1em',textTransform:'uppercase',paddingTop:16}:{})}}>{name}</td>
                  {!isHeader&&<><td style={{textAlign:'center',padding:'8px 6px',color:std?'var(--green)':'var(--text-dim)'}}>{std?'✓':'—'}</td><td style={{textAlign:'center',padding:'8px 6px',color:pro?'var(--green)':'var(--text-dim)'}}>{pro?'✓':'—'}</td></>}
                  {isHeader&&<td colSpan={2}/>}
                </tr>
              );
            })}</tbody>
          </table>
          <div style={{textAlign:'center',marginTop:20}}>
            {isPro?<div style={{color:'var(--accent)',fontWeight:700,fontSize:14}}>PRO Active</div>
            :<button onClick={onProClick} style={{padding:'12px 28px',borderRadius:8,border:'none',background:'var(--gold)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>Unlock Pro Access →</button>}
          </div>
        </Card>
      </div>

      {/* DOCUMENTATION DOWNLOADS */}
      <div ref={docsRef} id="resources" style={{maxWidth:720,margin:'0 auto',padding:'48px 20px'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <SectionLabel>Free Downloads</SectionLabel>
          <h2 style={{fontSize:'clamp(22px,4vw,28px)',fontWeight:700,color:'var(--text-primary)',marginTop:8}}>User Manual and Glossary</h2>
          <p style={{fontSize:14,color:'var(--text-muted)',marginTop:8}}>Everything you need to get the most out of STRInvestCalc.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
          <Card>
            <div style={{fontSize:32,marginBottom:12}}>📖</div>
            <h3 style={{fontSize:17,fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>User Manual</h3>
            <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.6,marginBottom:16}}>Step-by-step guide covering every section: questionnaire fields, dashboard tabs, sensitivity sliders, all chart types, Pro features, and AI summary presets.</p>
            <a href="/docs/STRInvestCalc_User_Manual.docx" download style={{display:'inline-block',padding:'10px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Download Manual</a>
          </Card>
          <Card>
            <div style={{fontSize:32,marginBottom:12}}>📋</div>
            <h3 style={{fontSize:17,fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>Abbreviations and Glossary</h3>
            <p style={{fontSize:14,color:'var(--text-muted)',lineHeight:1.6,marginBottom:16}}>Plain-English definitions for every term: 1031 Exchange, Cap Rate, Cost Segregation, Depreciation Recapture, NOI, and 20+ more, organized alphabetically.</p>
            <a href="/docs/STRInvestCalc_Glossary.docx" download style={{display:'inline-block',padding:'10px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>Download Glossary</a>
          </Card>
        </div>
      </div>
    </div>
  );
}
