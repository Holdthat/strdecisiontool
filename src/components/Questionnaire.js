import React, { useState } from 'react';
import { Card, SectionLabel, InputField, SelectField, AppHeader } from './UI';
import { fmt } from '../utils/calculations';

const defaultForm = {
  propertyType:'single-family',location:'',purchasePrice:'',currentValue:'',yearsOwned:'',
  managementStyle:'self-managed',annualRent:'',annualExpenses:'',vacancyRate:'10',
  mortgageBalance:'',mortgageRate:'',mortgageYearsRemaining:'',roofAge:'5',hvacAge:'5',
  waterHeaterAge:'3',capRate:'',annualAppreciation:'3',alternativeInvestment:'stock-market',
  alternativeReturn:'7',exitStrategy:'undecided',replacementValue:'',replacementRent:'',
  replacementExpenses:'',taxBracket:'32',sellingCostsPct:'7.5',
};

export default function Questionnaire({onComplete, initialData, dark, discoveryData}) {
  const isBuyer = discoveryData?.situation_value === 'evaluating-purchase';
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [form, setForm] = useState(initialData || defaultForm);
  const [errors, setErrors] = useState({});
  const hc = e => {
    const updated = {...form,[e.target.name]:e.target.value};
    // Auto-calculate mortgage years remaining when years owned changes (owners only)
    if(e.target.name==='yearsOwned' && !isBuyer) {
      const yrsOwned = parseInt(e.target.value)||0;
      updated.mortgageYearsRemaining = String(Math.max(0, 30 - yrsOwned));
    }
    setForm(updated);
    if(errors[e.target.name]) setErrors({...errors,[e.target.name]:null});
  };

  const validate = () => {
    const e = {};
    if(step===1){if(!form.location)e.location='Required';if(!form.purchasePrice||form.purchasePrice<=0)e.purchasePrice='Required';if(!form.currentValue||form.currentValue<=0)e.currentValue='Required';if(!form.annualRent||form.annualRent<=0)e.annualRent='Required';}
    if(step===2){if(!form.annualExpenses&&form.annualExpenses!=='0')e.annualExpenses='Required';}
    setErrors(e); return Object.keys(e).length===0;
  };
  const next=()=>{if(validate()){setStep(s=>Math.min(s+1,totalSteps));window.scrollTo({top:0,behavior:'smooth'});}};
  const prev=()=>{setStep(s=>Math.max(s-1,1));window.scrollTo({top:0,behavior:'smooth'});};
  const submit=()=>{if(validate())onComplete(form);};

  return (
    <div style={{maxWidth:640,margin:'0 auto',padding:'40px 20px'}}>
      <AppHeader dark={dark}/>
      {/* Progress */}
      <div style={{marginBottom:32}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          {['Property','Financials','Market','Review'].map((l,i)=>(
            <div key={i} style={{fontSize:11,fontWeight:step>i?700:500,color:step>i?'var(--accent)':step===i+1?'var(--gold)':'var(--text-muted)',letterSpacing:'0.05em',textTransform:'uppercase',fontFamily:"'JetBrains Mono',monospace"}}>{l}</div>
          ))}
        </div>
        <div style={{height:3,background:'var(--border-primary)',borderRadius:2}}>
          <div style={{height:'100%',width:`${(step/totalSteps)*100}%`,background:'linear-gradient(90deg,var(--accent),var(--gold))',borderRadius:2,transition:'width 0.3s'}}/>
        </div>
      </div>

      <Card>
        {step===1&&(<>
          <SectionLabel>Property & Portfolio</SectionLabel>
          <SelectField label="Property Type" name="propertyType" value={form.propertyType} onChange={hc} tip="Affects default assumptions for maintenance and insurance." options={[{value:'single-family',label:'Single Family'},{value:'condo',label:'Condo / Townhome'},{value:'multi-family',label:'Multi-Family'},{value:'cabin',label:'Cabin / Vacation Home'}]}/>
          <InputField label="Location" name="location" value={form.location} onChange={hc} placeholder="e.g. North Conway, NH" error={errors.location} tip="City and state where the property is located."/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Purchase Price" name="purchasePrice" value={form.purchasePrice} onChange={hc} type="number" prefix="$" error={errors.purchasePrice} tip={isBuyer?"The asking or offer price for this property.":"What you originally paid for the property."}/>
            <InputField label="Current Value" name="currentValue" value={form.currentValue} onChange={hc} type="number" prefix="$" error={errors.currentValue} tip={isBuyer?"Appraised or estimated market value. May differ from asking price if you're getting a deal (or overpaying).":"Today's estimated market value. Check Zillow, Redfin, or a recent appraisal."}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {isBuyer?null:<InputField label="Years Owned" name="yearsOwned" value={form.yearsOwned} onChange={hc} type="number" suffix="yrs" tip="How long you've held the property. Affects depreciation recapture on sale."/>}
            <InputField label="Annual Gross Rent" name="annualRent" value={form.annualRent} onChange={hc} type="number" prefix="$" error={errors.annualRent} tip={isBuyer?"Expected annual rental income based on market comps. Check AirDNA or local STR data.":"Total rental income per year before expenses and vacancy."}/>
          </div>
          <SelectField label="Management Style" name="managementStyle" value={form.managementStyle} onChange={hc} tip="Self-managed saves PM fees (20-25%) but costs your time." options={[{value:'self-managed',label:'Self-Managed'},{value:'property-manager',label:'Property Manager (20-25%)'},{value:'hybrid',label:'Hybrid'}]}/>
        </>)}

        {step===2&&(<>
          <SectionLabel>Financial Snapshot</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Annual Expenses" name="annualExpenses" value={form.annualExpenses} onChange={hc} type="number" prefix="$" error={errors.annualExpenses} tip="Total operating costs: insurance, taxes, utilities, cleaning, supplies, repairs, PM fees."/>
            <InputField label="Vacancy Rate" name="vacancyRate" value={form.vacancyRate} onChange={hc} type="number" suffix="%" tip="Percent of the year the property sits empty. STR average is 25-40%."/>
          </div>
          <SectionLabel>Mortgage Details</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label={isBuyer?"Loan Amount":"Mortgage Balance"} name="mortgageBalance" value={form.mortgageBalance} onChange={hc} type="number" prefix="$" tip={isBuyer?"The loan amount you plan to take out.":"Current outstanding loan balance. Check your latest statement."}/>
            <InputField label="Interest Rate" name="mortgageRate" value={form.mortgageRate} onChange={hc} type="number" suffix="%" tip="Annual interest rate on your mortgage."/>
          </div>
          <InputField label={isBuyer?"Loan Term":"Years Remaining"} name="mortgageYearsRemaining" value={form.mortgageYearsRemaining} onChange={hc} type="number" suffix="yrs" tip={isBuyer?"Mortgage term in years (typically 15 or 30).":"Auto-calculated as 30 minus years owned. Edit if your original term was different (e.g., 15-year mortgage)."}/>
          <SectionLabel tip="Component ages determine when major replacement costs will hit.">Property Condition</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <InputField label="Roof Age" name="roofAge" value={form.roofAge} onChange={hc} type="number" suffix="yrs" tip="Roofs typically last 25-30 years. Replacement costs ~4% of property value."/>
            <InputField label="HVAC Age" name="hvacAge" value={form.hvacAge} onChange={hc} type="number" suffix="yrs" tip="HVAC systems last 15-20 years. Replacement costs ~2% of property value."/>
            <InputField label="Water Heater" name="waterHeaterAge" value={form.waterHeaterAge} onChange={hc} type="number" suffix="yrs" tip="Water heaters last 10-15 years."/>
          </div>
          <SectionLabel>Tax Info</SectionLabel>
          <SelectField label="Federal Tax Bracket" name="taxBracket" value={form.taxBracket} onChange={hc} tip="Your marginal federal income tax rate. Affects depreciation tax savings calculations." options={[{value:'10',label:'10%'},{value:'12',label:'12%'},{value:'22',label:'22%'},{value:'24',label:'24%'},{value:'32',label:'32%'},{value:'35',label:'35%'},{value:'37',label:'37%'}]}/>
        </>)}

        {step===3&&(<>
          <SectionLabel>Market Assumptions</SectionLabel>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <InputField label="Appreciation" name="annualAppreciation" value={form.annualAppreciation} onChange={hc} type="number" suffix="%" tip="Expected annual property value growth. US average is ~3-4%."/>
            <InputField label="Cap Rate" name="capRate" value={form.capRate} onChange={hc} type="number" suffix="%" tip="Optional reference value. The dashboard calculates your actual cap rate from your inputs. Enter a market average here for comparison if you have one."/>
          </div>
          <SectionLabel>Alternative Investment</SectionLabel>
          <SelectField label={isBuyer?"If you don't buy, invest where?":"Invest proceeds where?"} name="alternativeInvestment" value={form.alternativeInvestment} onChange={hc} tip={isBuyer?"If you don't buy this property, where would you invest your down payment?":"If you sell, where would the after-tax proceeds go?"} options={[{value:'stock-market',label:'Stock Market (S&P 500)'},{value:'bonds',label:'Bonds / Fixed Income'},{value:'another-property',label:'Another Property (non-1031)'},{value:'mixed',label:'Mixed Portfolio'}]}/>
          <InputField label="Expected Return" name="alternativeReturn" value={form.alternativeReturn} onChange={hc} type="number" suffix="%" tip="Annual return on your alternative investment. S&P 500 averages ~10% historically."/>
          <SectionLabel>{isBuyer ? 'Purchase Costs' : 'Selling Costs'}</SectionLabel>
          <InputField label={isBuyer ? 'Closing & Acquisition Costs' : 'Total Selling Costs'} name="sellingCostsPct" value={form.sellingCostsPct} onChange={hc} type="number" suffix="%" tip={isBuyer ? 'Buyer closing costs as a % of purchase price. Typically 2-4% (title insurance, loan origination, inspections, attorney fees). These reduce your starting equity.' : 'Realtor commissions + closing costs as a % of sale price. Standard is 7-8% (6% agent + 1.5% closing). Private sales can be 1-3%.'}/>
          {!isBuyer&&<SectionLabel>Exit Strategy Interest</SectionLabel>}
          {!isBuyer&&<SelectField label="What are you considering?" name="exitStrategy" value={form.exitStrategy} onChange={hc} options={[{value:'undecided',label:"Not sure yet — show me the data"},{value:'hold',label:'Leaning toward holding'},{value:'sell',label:'Leaning toward selling'},{value:'1031',label:'Interested in 1031 Exchange'}]}/>
          {form.exitStrategy==='1031'&&(<>
            <SectionLabel>1031 Exchange — Replacement Property</SectionLabel>
            <InputField label="Replacement Property Value" name="replacementValue" value={form.replacementValue} onChange={hc} type="number" prefix="$"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <InputField label="Expected Annual Rent" name="replacementRent" value={form.replacementRent} onChange={hc} type="number" prefix="$"/>
              <InputField label="Expected Annual Expenses" name="replacementExpenses" value={form.replacementExpenses} onChange={hc} type="number" prefix="$"/>
            </div>
          </>)}
          }
        </>)}

        {step===4&&(<>
          <SectionLabel>Review Your Inputs</SectionLabel>
          <div style={{fontSize:14,color:'var(--text-secondary)',lineHeight:2}}>
            <p><strong style={{color:'var(--gold)'}}>Property:</strong> {form.propertyType} in {form.location||'—'}</p>
            <p><strong style={{color:'var(--gold)'}}>{isBuyer?'Asking Price':'Purchase Price'}:</strong> {fmt(form.purchasePrice)}</p>
            <p><strong style={{color:'var(--gold)'}}>{isBuyer?'Est. Market Value':'Current Value'}:</strong> {fmt(form.currentValue)}</p>
            <p><strong style={{color:'var(--gold)'}}>{isBuyer?'Expected Rent':'Annual Rent'}:</strong> {fmt(form.annualRent)}</p>
            <p><strong style={{color:'var(--gold)'}}>Annual Expenses:</strong> {fmt(form.annualExpenses)}</p>
            <p><strong style={{color:'var(--gold)'}}>{isBuyer?'Loan':'Mortgage'}:</strong> {fmt(form.mortgageBalance)} @ {form.mortgageRate||0}%</p>
            <p><strong style={{color:'var(--gold)'}}>Appreciation:</strong> {form.annualAppreciation}%/yr</p>
            <p><strong style={{color:'var(--gold)'}}>Alt. Return:</strong> {form.alternativeReturn}%</p>
            <p><strong style={{color:'var(--gold)'}}>Tax Bracket:</strong> {form.taxBracket}%</p>
            <p><strong style={{color:'var(--gold)'}}>{isBuyer ? 'Purchase Costs' : 'Selling Costs'}:</strong> {form.sellingCostsPct}%</p>
            {!isBuyer&&<p><strong style={{color:'var(--gold)'}}>Strategy:</strong> {form.exitStrategy}</p>}
          </div>
          <div style={{marginTop:20,padding:12,borderRadius:8,background:'var(--bg-subtle)',border:'1px solid var(--border-accent)',fontSize:13,color:'var(--text-muted)'}}>
            {isBuyer
              ? 'Click "Analyze" to compare buying this property vs. investing your capital elsewhere.'
              : `Click "Analyze" to run your Hold vs. Sell${form.exitStrategy==='1031'?' vs. 1031 Exchange':''} comparison.`
            }
          </div>
        </>)}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:28}}>
          {step>1?<button onClick={prev} style={{padding:'10px 24px',borderRadius:8,border:'1px solid var(--border-primary)',background:'transparent',color:'var(--text-muted)',fontSize:14,cursor:'pointer'}}>← Back</button>:<div/>}
          {step<totalSteps?<button onClick={next} style={{padding:'10px 28px',borderRadius:8,border:'none',background:'var(--accent)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>Continue →</button>
          :<button onClick={submit} style={{padding:'12px 36px',borderRadius:8,border:'none',background:'var(--gold)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',letterSpacing:'0.05em'}}>Analyze →</button>}
        </div>
      </Card>
    </div>
  );
}
