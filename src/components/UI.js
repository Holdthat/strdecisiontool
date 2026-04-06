// Shared UI Components — VHG Brand Guide v4.1
import React, { useState } from 'react';
import { APP_VERSION } from '../utils/theme';

// ═══════════════════════════════════════════════════════════
// TOOLTIP — Brand Guide: bg-card bg, border-primary border, never green/gold
// ═══════════════════════════════════════════════════════════
export const Tooltip_ = ({text, children}) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{position:'relative',display:'inline-flex',alignItems:'center'}}>
      {children}
      <span
        onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
        onClick={()=>setShow(!show)}
        style={{
          display:'inline-flex',alignItems:'center',justifyContent:'center',
          width:20,height:20,borderRadius:'50%',marginLeft:6,cursor:'pointer',
          background:'var(--bg-card)',color:'var(--text-faint)',
          border:'1.5px solid var(--border-primary)',
          fontSize:12,fontWeight:700,fontFamily:'Georgia,serif',flexShrink:0,
        }}>?</span>
      {show && (
        <span style={{
          position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',
          background:'var(--tooltip-bg)',color:'var(--text-secondary)',
          border:'1px solid var(--tooltip-border)',borderRadius:8,padding:'10px 14px',
          fontSize:13,fontFamily:"'Inter',sans-serif",lineHeight:1.5,
          boxShadow:'0 8px 24px rgba(0,0,0,0.4)',whiteSpace:'normal',
          width:'max-content',maxWidth:280,zIndex:50,
        }}>{text}</span>
      )}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════
// LAYOUT — bigger fonts to match STRcalc
// ═══════════════════════════════════════════════════════════
export const Card = ({children, style={}}) => (
  <div style={{background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:10,padding:'24px 28px',...style}}>{children}</div>
);

export const SectionLabel = ({children, tip}) => (
  <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:16}}>
    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--gold)'}}>{children}</span>
    {tip && <Tooltip_ text={tip}><span/></Tooltip_>}
  </div>
);

export const GoldDivider = ({width=120,mb=20}) => (
  <div style={{width,height:1,margin:`0 auto ${mb}px`,background:'linear-gradient(90deg,transparent,var(--gold),transparent)'}}/>
);

// Tab bar — larger touch targets
export const TabBar = ({tabs, active, onChange}) => (
  <div style={{display:'flex',gap:4,overflowX:'auto',WebkitOverflowScrolling:'touch',padding:'4px 0',marginBottom:16}}>
    {tabs.map(t => (
      <button key={t.id} onClick={()=>onChange(t.id)} style={{
        padding:'10px 18px',borderRadius:6,border:'none',fontSize:15,fontWeight:active===t.id?700:500,
        cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,
        background:active===t.id?'var(--accent)':'transparent',
        color:active===t.id?'#fff':'var(--text-faint)',transition:'all 0.15s',
      }}>{t.label}</button>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════
// FORM FIELDS — larger inputs
// ═══════════════════════════════════════════════════════════
export const InputField = ({label,name,value,onChange,type='text',prefix,suffix,placeholder,error,tip}) => {
  // Format display value with commas for dollar fields
  const isDollar = prefix === '$';
  const displayVal = isDollar && value && !isNaN(value) 
    ? Number(value).toLocaleString('en-US') 
    : value;
  
  const handleChange = (e) => {
    if (isDollar) {
      // Strip commas before passing to parent
      const raw = e.target.value.replace(/,/g, '');
      if (raw === '' || !isNaN(raw)) {
        onChange({target:{name:e.target.name, value:raw}});
      }
    } else {
      onChange(e);
    }
  };

  return (
    <div style={{marginBottom:18}}>
      <label style={{display:'flex',alignItems:'center',gap:2,fontSize:14,fontWeight:700,color:'var(--text-secondary)',marginBottom:8,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'0.04em',textTransform:'uppercase'}}>
        {label}
        {tip && <Tooltip_ text={tip}><span/></Tooltip_>}
      </label>
      <div style={{position:'relative'}}>
        {prefix&&<span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:16}}>{prefix}</span>}
        <input 
          type={isDollar ? 'text' : type} 
          inputMode={isDollar ? 'numeric' : undefined}
          name={name} 
          value={displayVal} 
          onChange={handleChange} 
          placeholder={placeholder} 
          style={{
            width:'100%',padding:'12px 14px',paddingLeft:prefix?32:14,paddingRight:suffix?44:14,
            background:'var(--input-bg)',border:`1px solid ${error?'var(--red)':'var(--border-primary)'}`,
            borderRadius:8,color:'var(--text-primary)',fontSize:16,outline:'none',fontFamily:"'JetBrains Mono',monospace",
          }}
        />
        {suffix&&<span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',fontSize:14}}>{suffix}</span>}
      </div>
      {error&&<p style={{color:'var(--red)',fontSize:12,marginTop:4}}>{error}</p>}
    </div>
  );
};

export const SelectField = ({label,name,value,onChange,options,tip}) => (
  <div style={{marginBottom:18}}>
    {label&&<label style={{display:'flex',alignItems:'center',gap:2,fontSize:14,fontWeight:700,color:'var(--text-secondary)',marginBottom:8,fontFamily:"'JetBrains Mono',monospace",letterSpacing:'0.04em',textTransform:'uppercase'}}>
      {label}{tip && <Tooltip_ text={tip}><span/></Tooltip_>}
    </label>}
    <select name={name} value={value} onChange={onChange} style={{
      width:'100%',padding:'12px 14px',background:'var(--input-bg)',border:'1px solid var(--border-primary)',
      borderRadius:8,color:'var(--text-primary)',fontSize:16,outline:'none',
    }}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
  </div>
);

export const Slider = ({label,min,max,step,value,onChange,displayValue,suffix='%',tip}) => {
  const pct = Math.max(0,Math.min(100,((value-min)/(max-min))*100));
  return (
    <div style={{marginBottom:12,padding:'12px 14px',background:'var(--bg-card)',borderRadius:8,border:'1px solid var(--border-primary)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{display:'flex',alignItems:'center',gap:4,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)'}}>
          {label}{tip&&<Tooltip_ text={tip}><span/></Tooltip_>}
        </span>
        <span style={{fontSize:20,fontWeight:700,color:'var(--accent)',fontFamily:"'JetBrains Mono',monospace"}}>{displayValue}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>{const raw=Number(e.target.value);const rounded=Math.round(raw/step)*step;onChange({target:{value:rounded}});}}
        style={{width:'100%',height:6,borderRadius:3,background:`linear-gradient(to right,var(--accent) 0%,var(--accent) ${pct}%,var(--border-primary) ${pct}%,var(--border-primary) 100%)`}}
      />
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-faint)',marginTop:4}}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// LOGOS — exact SVGs from uploaded files
// ═══════════════════════════════════════════════════════════
export const VHGLogoMark = ({size=36}) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{flexShrink:0}}>
    <rect width="64" height="64" rx="12" fill="var(--bg-card)" stroke="var(--border-primary)" strokeWidth="1"/>
    <path d="M10 38 L18 26 L24 30 L32 18 L38 26 L42 22 L54 38" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <line x1="8" y1="38" x2="56" y2="38" stroke="#C8962E" strokeWidth="0.8"/>
    <text x="32" y="50" textAnchor="middle" fill="var(--text-primary)" fontFamily="Georgia,serif" fontSize="8" fontWeight="700" letterSpacing="0.04em">VH</text>
    <text x="32" y="58" textAnchor="middle" fill="#C8962E" fontFamily="Georgia,serif" fontSize="7" fontStyle="italic">group</text>
  </svg>
);

export const VHGFooterLogo = ({dark}) => {
  const f = dark ? '#FFFFFF' : '#1A1A1A';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 170" width="220" height="117">
      <path d="M85 28 L110 12 L128 22 L155 4 L178 18 L195 10 L235 28" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1="80" y1="28" x2="240" y2="28" stroke="#C8962E" strokeWidth="0.8"/>
      <text x="160" y="62" textAnchor="middle" fill={f} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">VACATION</text>
      <text x="160" y="95" textAnchor="middle" fill={f} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">HOME</text>
      <line x1="60" y1="103" x2="112" y2="103" stroke="#C8962E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="60" y1="109" x2="98" y2="109" stroke="#C8962E" strokeWidth="1" strokeLinecap="round"/>
      <text x="165" y="138" textAnchor="middle" fill="#C8962E" fontFamily="Georgia,serif" fontSize="32" fontStyle="italic">group</text>
    </svg>
  );
};

// ═══════════════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════════════
export const ThemeToggle = ({dark,setDark}) => (
  <button onClick={()=>setDark(!dark)} style={{
    width:36,height:36,borderRadius:8,border:'1px solid var(--border-primary)',
    background:'rgba(255,255,255,0.06)',color:'var(--text-primary)',fontSize:18,
    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
  }}>{dark?'☀':'☾'}</button>
);

// ═══════════════════════════════════════════════════════════
// NAV BAR — VHG footer logo as header logo, fixed Standard/Pro
// ═══════════════════════════════════════════════════════════
export const NavBar = ({dark,setDark,onNav}) => (
  <nav style={{
    borderBottom:'1px solid var(--border-primary)',padding:'12px 20px',
    display:'flex',alignItems:'center',justifyContent:'space-between',
    background:dark?'linear-gradient(135deg,#0B1120,#151D2E)':'linear-gradient(135deg,#FFFFFF,#F5F5F5)',
    position:'sticky',top:0,zIndex:100,
  }}>
    <div style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',minWidth:0}} onClick={()=>onNav&&onNav('landing')}>
      <svg viewBox="0 0 320 170" width="90" height="48" style={{flexShrink:0}}>
        <path d="M85 28 L110 12 L128 22 L155 4 L178 18 L195 10 L235 28" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <line x1="80" y1="28" x2="240" y2="28" stroke="#C8962E" strokeWidth="0.8"/>
        <text x="160" y="62" textAnchor="middle" fill={dark?'#FFFFFF':'#1A1A1A'} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">VACATION</text>
        <text x="160" y="95" textAnchor="middle" fill={dark?'#FFFFFF':'#1A1A1A'} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">HOME</text>
        <line x1="60" y1="103" x2="112" y2="103" stroke="#C8962E" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="60" y1="109" x2="98" y2="109" stroke="#C8962E" strokeWidth="1" strokeLinecap="round"/>
        <text x="165" y="138" textAnchor="middle" fill="#C8962E" fontFamily="Georgia,serif" fontSize="32" fontStyle="italic">group</text>
      </svg>
      <div style={{minWidth:0}}>
        <div style={{fontSize:30,fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.02em',lineHeight:1}}>
          Property<span style={{color:'var(--gold)'}}>Path</span>
        </div>
        <div style={{fontSize:13,color:'var(--gold)',fontStyle:'italic',fontFamily:'Georgia,serif',marginTop:3}}>
          by Vacation Home Group
        </div>
      </div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
      {onNav&&<>
        <button onClick={()=>onNav('calculator')} style={{background:'none',border:'none',color:'var(--accent)',fontSize:14,fontWeight:700,cursor:'pointer',padding:'6px 12px'}}>Calculator</button>
        <button onClick={()=>onNav('resources')} style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:14,cursor:'pointer',padding:'6px 12px'}}>Resources</button>
        <button onClick={()=>onNav('pro')} style={{background:'none',border:'none',color:'var(--gold)',fontSize:14,fontWeight:700,cursor:'pointer',padding:'6px 12px'}}>Standard / Pro</button>
      </>}
      <span style={{fontSize:10,color:'var(--text-faint)',fontFamily:"'JetBrains Mono',monospace"}}>v{APP_VERSION}</span>
      <ThemeToggle dark={dark} setDark={setDark}/>
    </div>
  </nav>
);

// ===================================================================
// APP HEADER BAR - shown inside the calculator/dashboard (like STRcalc)
// ===================================================================
export const AppHeader = ({dark, setDark, isPro, onProClick, onTogglePro, onSave, onPDF, onShare}) => (
  <div style={{marginBottom:16}}>
    <div style={{
      background:dark?'linear-gradient(135deg,#0B1120,#151D2E)':'linear-gradient(135deg,#FFFFFF,#F5F5F5)',
      border:'1px solid var(--border-primary)',borderRadius:isPro?'10px 10px 0 0':'10px',
      padding:'12px 20px',
      display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <svg viewBox="0 0 320 170" width="60" height="32" style={{flexShrink:0}}>
          <path d="M85 28 L110 12 L128 22 L155 4 L178 18 L195 10 L235 28" fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
          <line x1="80" y1="28" x2="240" y2="28" stroke="#C8962E" strokeWidth="0.8"/>
          <text x="160" y="62" textAnchor="middle" fill={dark?'#FFFFFF':'#1A1A1A'} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">VACATION</text>
          <text x="160" y="95" textAnchor="middle" fill={dark?'#FFFFFF':'#1A1A1A'} fontFamily="Georgia,serif" fontSize="34" fontWeight="700" letterSpacing="0.08em">HOME</text>
          <line x1="60" y1="103" x2="112" y2="103" stroke="#C8962E" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="60" y1="109" x2="98" y2="109" stroke="#C8962E" strokeWidth="1" strokeLinecap="round"/>
          <text x="165" y="138" textAnchor="middle" fill="#C8962E" fontFamily="Georgia,serif" fontSize="32" fontStyle="italic">group</text>
        </svg>
        <div>
          <div style={{display:'flex',alignItems:'baseline',gap:6,flexWrap:'wrap'}}>
            <span style={{fontSize:22,fontWeight:800,color:'var(--text-primary)',letterSpacing:'-0.01em'}}>
              Property<span style={{color:'var(--gold)'}}>Path</span>
            </span>
            <span style={{fontSize:12,color:'var(--gold)',fontStyle:'italic',fontFamily:'Georgia,serif'}}>by Vacation Home Group</span>
          </div>
          <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:"'JetBrains Mono',monospace",letterSpacing:'0.08em',marginTop:2}}>
            YOUR REAL ESTATE INVESTMENT ADVISOR {String.fromCharCode(183)} Ver. {APP_VERSION}
          </div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        {onSave&&<button onClick={onSave} title="Save Property" style={{width:36,height:36,borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--bg-primary)',color:'var(--gold)',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>💾</button>}
        {onPDF&&<button onClick={onPDF} title="PDF Report" style={{padding:'6px 12px',borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--bg-primary)',color:'var(--text-muted)',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
          <span style={{fontSize:14}}>📄</span> PDF
        </button>}
        <button onClick={()=>{if(isPro&&onTogglePro)onTogglePro(false);}} style={{padding:'6px 14px',borderRadius:8,border:!isPro?'1.5px solid var(--text-muted)':'1px solid var(--border-primary)',background:!isPro?'var(--bg-subtle)':'transparent',color:'var(--text-muted)',fontSize:13,fontWeight:!isPro?700:600,cursor:isPro?'pointer':'default'}}>STD</button>
        <button onClick={()=>{if(isPro){if(onTogglePro)onTogglePro(true);}else{if(onProClick)onProClick();}}} style={{padding:'6px 14px',borderRadius:8,border:isPro?'none':'1px solid var(--gold)',background:isPro?'var(--gold)':'transparent',color:isPro?'#fff':'var(--gold)',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
          {isPro&&<span style={{fontSize:12}}>★</span>} PRO
        </button>
        {setDark&&<button onClick={()=>setDark(!dark)} title={dark?'Light mode':'Dark mode'} style={{width:36,height:36,borderRadius:8,border:'1px solid var(--border-primary)',background:'var(--bg-primary)',color:'var(--text-primary)',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{dark?'☀':'☾'}</button>}
      </div>
    </div>
    {/* Pro features banner */}
    {isPro&&(
      <div style={{
        background:dark?'rgba(154,120,32,0.08)':'rgba(154,120,32,0.06)',
        borderLeft:'1px solid var(--border-primary)',borderRight:'1px solid var(--border-primary)',borderBottom:'1px solid var(--border-primary)',
        borderRadius:'0 0 10px 10px',padding:'8px 20px',
        display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',
      }}>
        <span style={{color:'var(--gold)',fontSize:14}}>★</span>
        <span style={{fontSize:13,color:'var(--gold)',fontFamily:"'JetBrains Mono',monospace"}}>
          PRO — Tax Benefits · Mortgage · What-If · AI Summary · Save & Compare · PDF · Email Results
        </span>
      </div>
    )}
  </div>
);



// ═══════════════════════════════════════════════════════════
// PRO GATE
// ═══════════════════════════════════════════════════════════
export const ProGate = ({onUnlock,onClose,discoveryData}) => {
  const [step,setStep] = useState('info');
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [phone,setPhone] = useState('');
  const [code,setCode] = useState('');
  const [loading,setLoading] = useState(false);
  const [token,setToken] = useState('');
  const [error,setError] = useState('');

  const sendCode = async () => {
    if(!name||!email) return;
    setLoading(true); setError('');
    try {
      const resp = await fetch('/api/send-code', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,name,phone}),
      });
      const data = await resp.json();
      if(resp.ok && data.success) { setToken(data.token); setStep('verify'); }
      else { setError(data.error||'Failed to send code. Try again.'); }
    } catch(err) { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  const verifyCode = async () => {
    if(!code) return;
    setLoading(true); setError('');
    try {
      const resp = await fetch('/api/verify-code', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code,token,name,phone,discoveryData:discoveryData||null,notifyEmails:(()=>{try{return localStorage.getItem('vhg-notify-emails')||'';}catch(_e){return '';}})()}),
      });
      const data = await resp.json();
      if(resp.ok && data.success) { 
        setStep('done');
        setTimeout(()=>{onUnlock({name:data.name||name,email,phone});},1500);
      } else { setError(data.error||'Invalid code. Try again.'); }
    } catch(err) { setError('Network error. Please check your connection.'); }
    setLoading(false);
  };

  const closeBtn = {position:'absolute',top:12,right:16,background:'none',border:'none',color:'var(--text-muted)',fontSize:22,cursor:'pointer'};
  const modalBg = {position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20};
  const modalBox = {background:'var(--bg-card)',border:'1px solid var(--border-primary)',borderRadius:16,padding:32,maxWidth:440,width:'100%',position:'relative'};
  const btnStyle = (active) => ({width:'100%',padding:'14px 24px',borderRadius:8,border:'none',background:active?'var(--gold)':'var(--text-dim)',color:'#fff',fontSize:17,fontWeight:700,cursor:active?'pointer':'not-allowed',marginTop:8});
  const btnVerify = (active) => ({width:'100%',padding:'14px 24px',borderRadius:8,border:'none',background:active?'var(--accent)':'var(--text-dim)',color:'#fff',fontSize:17,fontWeight:700,cursor:active?'pointer':'not-allowed',marginTop:16});

  return (
    <div style={modalBg}>
      <div style={modalBox}>
        <button onClick={onClose} style={closeBtn}>x</button>

        {step==='info' && (<>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:26,fontWeight:700,color:'var(--gold)',marginBottom:4}}>Unlock Pro</div>
            <p style={{fontSize:15,color:'var(--text-muted)',lineHeight:1.6}}>Pro is available at no charge to Vacation Home Group clients. Enter your info and we will send a verification code to your email.</p>
          </div>
          <InputField label="Full Name" name="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith"/>
          <InputField label="Email" name="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="jane@example.com" type="email"/>
          <InputField label="Phone (optional)" name="phone" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="603-555-1234" type="tel"/>
          {error && <p style={{color:'var(--red)',fontSize:13,marginBottom:8,textAlign:'center'}}>{error}</p>}
          <button onClick={sendCode} disabled={!name||!email||loading} style={btnStyle(name&&email&&!loading)}>
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
          <p style={{fontSize:11,color:'var(--text-faint)',textAlign:'center',marginTop:12,lineHeight:1.6}}>By submitting, you consent to the collection of your email address and preferences for the purpose of delivering personalized market analysis. We do not sell or share your information with third parties.</p>
        </>)}

        {step==='verify' && (<>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:26,fontWeight:700,color:'var(--gold)',marginBottom:4}}>Enter Code</div>
            <p style={{fontSize:15,color:'var(--text-muted)',lineHeight:1.6}}>We sent a 6-digit code to <strong style={{color:'var(--text-primary)'}}>{email}</strong>. Check your inbox and spam folder.</p>
          </div>
          <div style={{maxWidth:280,margin:'0 auto'}}>
            <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6}
              style={{width:'100%',padding:'16px',fontSize:32,fontWeight:700,textAlign:'center',letterSpacing:12,fontFamily:"'JetBrains Mono',monospace",background:'var(--input-bg)',border:'1px solid var(--border-primary)',borderRadius:10,color:'var(--text-primary)',outline:'none'}}
            />
          </div>
          {error && <p style={{color:'var(--red)',fontSize:13,marginTop:8,textAlign:'center'}}>{error}</p>}
          <button onClick={verifyCode} disabled={code.length!==6||loading} style={btnVerify(code.length===6&&!loading)}>
            {loading ? 'Verifying...' : 'Verify and Unlock'}
          </button>
          <div style={{textAlign:'center',marginTop:12}}>
            <button onClick={()=>{setStep('info');setError('');setCode('');}} style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:13,cursor:'pointer',textDecoration:'underline'}}>Back</button>
            <span style={{color:'var(--text-dim)',margin:'0 8px'}}>|</span>
            <button onClick={sendCode} disabled={loading} style={{background:'none',border:'none',color:'var(--accent)',fontSize:13,cursor:'pointer',textDecoration:'underline'}}>{loading?'Sending...':'Resend Code'}</button>
          </div>
        </>)}

        {step==='done' && (
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{fontSize:48,marginBottom:16}}>✓</div>
            <div style={{fontSize:22,fontWeight:700,color:'var(--accent)'}}>Pro Unlocked!</div>
            <p style={{fontSize:15,color:'var(--text-muted)',marginTop:8}}>Welcome, {name}. All features are now active.</p>
          </div>
        )}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════
// VHG FOOTER
// ═══════════════════════════════════════════════════════════
export const VHGFooter = ({dark}) => (
  <footer style={{borderTop:'1px solid var(--border-primary)',padding:'32px 24px',textAlign:'center',marginTop:40}}>
    <div style={{marginBottom:0}}><VHGFooterLogo dark={dark}/></div>
    <div style={{fontSize:15,color:'var(--text-muted)',fontStyle:'italic',fontFamily:'Georgia,serif'}}>Your Retreat, Our Expertise</div>
    <div style={{fontSize:15,color:'var(--text-primary)',marginBottom:20,fontFamily:"'DM Mono',monospace"}}>Real Broker NH, LLC</div>
    <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:'var(--text-primary)',marginBottom:2}}>Property<span style={{color:'var(--gold)'}}>Path</span></div>
    <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:4}}>by Vacation Home Group</div>
    <div style={{fontSize:12,color:'var(--text-faint)',marginBottom:16,fontFamily:"'JetBrains Mono',monospace"}}>v{APP_VERSION}</div>
    <GoldDivider/>
    <div style={{display:'flex',justifyContent:'center',gap:60,marginBottom:20,flexWrap:'wrap'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:'var(--text-primary)'}}>Joe Mori</div>
        <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:4}}>REALTOR® · Vacation Home Specialist</div>
        <div style={{fontSize:15,color:'var(--text-muted)'}}>
          <a href="tel:6039017777" style={{color:'var(--text-primary)',textDecoration:'none'}}>603-901-7777</a>
          <span style={{margin:'0 4px'}}>·</span>
          <a href="mailto:joemori@vacationhome.group" style={{color:'var(--gold)',textDecoration:'none'}}>joemori@vacationhome.group</a>
        </div>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:'var(--text-primary)'}}>Dino Amato</div>
        <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:4}}>REALTOR® · Vacation Home Specialist</div>
        <div style={{fontSize:15,color:'var(--text-muted)'}}>
          <a href="tel:6032751191" style={{color:'var(--text-primary)',textDecoration:'none'}}>603-275-1191</a>
          <span style={{margin:'0 4px'}}>·</span>
          <a href="mailto:dinoamato@vacationhome.group" style={{color:'var(--gold)',textDecoration:'none'}}>dinoamato@vacationhome.group</a>
        </div>
      </div>
    </div>
    <div style={{fontSize:14,color:'var(--text-muted)',marginBottom:16}}>
      <a href="https://www.vacationhomegroup.net" style={{color:'var(--gold)',textDecoration:'none',fontWeight:600}}>vacationhomegroup.net</a>
      <span style={{margin:'0 6px'}}>·</span>
      <a href="https://www.vacationhome.group" style={{color:'var(--gold)',textDecoration:'none',fontWeight:600}}>vacationhome.group</a>
      <span style={{margin:'0 6px'}}>·</span>
      <span>Office: <a href="tel:8554500442" style={{color:'var(--text-primary)',textDecoration:'none'}}>855-450-0442</a></span>
    </div>
    <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.8,maxWidth:580,margin:'0 auto 10px'}}>Joe Mori & Dino Amato, Real Broker NH. Each office is independently owned and operated.</p>
    <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.8,maxWidth:580,margin:'0 auto 10px'}}>Projections are estimates based on user-provided inputs. This tool does not constitute financial or investment advice. Consult a qualified real estate professional before making investment decisions.</p>
    <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.8,maxWidth:580,margin:'0 auto'}}>By using this platform, you consent to the collection of your email address and preferences for the purpose of delivering personalized market analysis. We do not sell or share your information with third parties.</p>
  </footer>
);

// Recharts custom tooltip
export const ChartTooltip = ({active,payload,label}) => {
  if(!active||!payload) return null;
  return (
    <div style={{background:'var(--tooltip-bg)',border:'1px solid var(--tooltip-border)',borderRadius:8,padding:12,fontSize:13,boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}}>
      <p style={{color:'var(--gold)',fontWeight:700,marginBottom:6}}>Year {label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,margin:'2px 0'}}>{p.name}: {typeof p.value==='number'?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(p.value):p.value}</p>)}
    </div>
  );
};
