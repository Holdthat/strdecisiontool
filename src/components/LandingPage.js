import React from 'react';
import { Card, SectionLabel, GoldDivider } from './UI';

export default function LandingPage({onOpenCalc, onProClick, isPro, featRef, proRef, docsRef}) {
  const features = [
    {icon:'📊',title:'Hold vs. Sell vs. 1031',desc:'Three-scenario modeling with 10-year projections. Cumulative wealth, cash flow, and equity side by side.'},
    {icon:'🏦',title:'Full Financial Engine',desc:'Mortgage P&I, depreciation, capital gains, depreciation recapture, vacancy, and maintenance reserves.'},
    {icon:'⚙️',title:'Sensitivity Sliders',desc:'Drag to stress-test. Vacancy, appreciation, returns, and time horizon update charts in real time.'},
    {icon:'🎯',title:'Smart Recommendation',desc:'Data-driven hold/sell/1031 recommendation that shifts dynamically with your assumptions.'},
    {icon:'📈',title:'6 Interactive Charts',desc:'Area, bar, pie, radar, stacked equity, and composed cash flow charts — all responsive.'},
    {icon:'⚡',title:'No Account Required',desc:'Standard features work instantly. No login, no signup. Everything runs in your browser.'},
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
    ['What-If Snapshots',null,false,true],
    ['AI Investment Summary (Claude + Gemini)',null,false,true],
    ['Save & Compare Properties',null,false,true],
    ['Priority Support',null,false,true],
  ];

  return (
    <div>
      {/* HERO */}
      <div style={{textAlign:'center',padding:'60px 20px 48px',maxWidth:720,margin:'0 auto'}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)',marginBottom:16}}>Vacation Home Group · STR Investment Tool</div>
        <h1 style={{fontSize:'clamp(28px,5vw,42px)',fontWeight:800,lineHeight:1.15,color:'var(--text-primary)',marginBottom:20,fontFamily:"'Playfair Display',Georgia,serif"}}>Should you hold, sell, or 1031 exchange your vacation rental?</h1>
        <p style={{fontSize:16,color:'var(--text-muted)',lineHeight:1.7,maxWidth:560,margin:'0 auto 28px'}}>Model cash flow, equity, and returns across three scenarios. Real numbers before you make a decision.</p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={onOpenCalc} style={{padding:'14px 28px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>Open Calculator →</button>
          <button onClick={()=>featRef.current?.scrollIntoView({behavior:'smooth'})} style={{padding:'14px 28px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:15,cursor:'pointer'}}>See Features</button>
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:32,marginTop:40,flexWrap:'wrap'}}>
          {[['3','Scenarios'],['10+','Charts'],['30yr','Projections'],['∞','Properties']].map(([v,l],i)=>(
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
