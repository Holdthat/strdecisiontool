// STRInvestCalc — Calculation Engine

export function calculateHoldScenario(data, years = 10) {
  const cv = parseFloat(data.currentValue)||0, pp = parseFloat(data.purchasePrice)||0;
  const rent = parseFloat(data.annualRent)||0, expenses = parseFloat(data.annualExpenses)||0;
  const vacancy = parseFloat(data.vacancyRate)||0, mortBal = parseFloat(data.mortgageBalance)||0;
  const mortRate = parseFloat(data.mortgageRate)||0, mortYrs = parseInt(data.mortgageYearsRemaining)||0;
  const appRate = parseFloat(data.annualAppreciation)||0.03;
  const mR = mortRate/12, tP = mortYrs*12;
  const mPay = mortBal>0&&mR>0&&tP>0 ? mortBal*(mR*Math.pow(1+mR,tP))/(Math.pow(1+mR,tP)-1) : 0;
  const annDS = mPay*12;
  const depBasis = pp*0.85, annDep = depBasis/27.5;
  const maintSched = [];
  for(let y=1;y<=years;y++){
    let e=0;
    const rA=(parseInt(data.roofAge)||0)+y, hA=(parseInt(data.hvacAge)||0)+y, wA=(parseInt(data.waterHeaterAge)||0)+y;
    if(rA>=25&&rA<=27) e+=cv*0.04;
    if(hA>=15&&hA<=17) e+=cv*0.02;
    if(wA>=12&&wA<=13) e+=cv*0.005;
    maintSched.push(e);
  }
  const yearlyData = []; let cumCF=0, remMort=mortBal;
  for(let y=1;y<=years;y++){
    const pv=cv*Math.pow(1+appRate,y), gr=rent*Math.pow(1.025,y-1), er=gr*(1-vacancy/100);
    const oe=expenses*Math.pow(1.03,y-1), m=maintSched[y-1]||0, ds=y<=mortYrs?annDS:0;
    if(remMort>0&&mortRate>0){const int=remMort*mortRate;const pr=Math.min(ds-int,remMort);remMort=Math.max(0,remMort-pr);}
    const ncf=er-oe-m-ds; cumCF+=ncf; const eq=pv-remMort;
    yearlyData.push({year:y,propertyValue:Math.round(pv),effectiveRent:Math.round(er),opExpenses:Math.round(oe),maintenance:Math.round(m),debtService:Math.round(ds),netCashFlow:Math.round(ncf),cumulativeCashFlow:Math.round(cumCF),equity:Math.round(eq),depreciation:Math.round(annDep)});
  }
  return {yearlyData, totalWealth:(yearlyData[years-1]?.equity||0)+cumCF, totalCashFlow:cumCF, annualCashFlow:cumCF/years};
}

export function calculateSellScenario(data, years = 10, altReturn = 0.07) {
  const cv=parseFloat(data.currentValue)||0, pp=parseFloat(data.purchasePrice)||0, mortBal=parseFloat(data.mortgageBalance)||0;
  const sellingPct=(parseFloat(data.sellingCostsPct)||7.5)/100;
  const sellCosts=cv*sellingPct, depBasis=pp*0.85, yrsOwned=parseInt(data.yearsOwned)||1;
  const totDep=Math.min((depBasis/27.5)*yrsOwned,depBasis), adjBasis=pp-totDep;
  const capGain=cv-adjBasis, depRecap=totDep*0.25, ltGainsTax=Math.max(0,capGain-totDep)*0.15;
  const totTax=depRecap+ltGainsTax, gross=cv-mortBal, net=gross-sellCosts-totTax;
  const yearlyData=[];
  for(let y=1;y<=years;y++){
    const iv=net*Math.pow(1+altReturn,y);
    yearlyData.push({year:y, investedValue:Math.round(iv)});
  }
  return {grossProceeds:Math.round(gross), sellingCosts:Math.round(sellCosts), capitalGainsTax:Math.round(totTax), depreciationRecapture:Math.round(depRecap), netProceeds:Math.round(net), yearlyData, totalWealthAtEnd:yearlyData[years-1]?.investedValue||0};
}

export function calculate1031Scenario(data, years = 10) {
  const cv=parseFloat(data.currentValue)||0, mortBal=parseFloat(data.mortgageBalance)||0;
  const repVal=parseFloat(data.replacementValue)||cv*1.2, repRent=parseFloat(data.replacementRent)||parseFloat(data.annualRent)*1.1;
  const repExp=parseFloat(data.replacementExpenses)||parseFloat(data.annualExpenses)*0.9;
  const appRate=parseFloat(data.annualAppreciation)||0.03, exchCosts=cv*0.03;
  const eqTransferred=cv-mortBal-exchCosts, newMort=repVal-eqTransferred;
  const mR=0.065/12, mPay=newMort>0?newMort*(mR*Math.pow(1+mR,360))/(Math.pow(1+mR,360)-1):0;
  const annDS=mPay*12; const yearlyData=[]; let cumCF=0, remMort=newMort;
  for(let y=1;y<=years;y++){
    const pv=repVal*Math.pow(1+appRate,y), r=repRent*Math.pow(1.025,y-1), e=repExp*Math.pow(1.03,y-1);
    const ncf=r*0.85-e-annDS; cumCF+=ncf;
    if(remMort>0){const int=remMort*0.065;const pr=Math.min(annDS-int,remMort);remMort=Math.max(0,remMort-pr);}
    yearlyData.push({year:y, propertyValue:Math.round(pv), netCashFlow:Math.round(ncf), cumulativeCashFlow:Math.round(cumCF), equity:Math.round(pv-remMort)});
  }
  return {equityTransferred:Math.round(eqTransferred), taxDeferred:Math.round(cv*0.15), newMortgage:Math.round(newMort), yearlyData, totalWealth:(yearlyData[years-1]?.equity||0)+cumCF};
}

// Tax Benefits Calculator (Pro)
export function calculateTaxBenefits(data, years = 10) {
  const pp = parseFloat(data.purchasePrice)||0;
  const depBasis = pp * 0.85; // Land excluded (15%)
  const annualSLDep = depBasis / 27.5; // Straight-line
  const costSegYear1 = depBasis * 0.25; // ~25% accelerated in year 1 via cost seg
  const costSegRemaining = depBasis * 0.75;
  const taxBracket = parseFloat(data.taxBracket) || 0.32;
  const yearlyData = [];

  for (let y = 1; y <= years; y++) {
    const slDep = annualSLDep;
    const csDep = y === 1 ? costSegYear1 : costSegRemaining / 26.5; // remaining over ~26.5 years
    const slTaxSavings = slDep * taxBracket;
    const csTaxSavings = csDep * taxBracket;
    yearlyData.push({
      year: y,
      straightLineDep: Math.round(slDep),
      costSegDep: Math.round(csDep),
      slTaxSavings: Math.round(slTaxSavings),
      csTaxSavings: Math.round(csTaxSavings),
      cumulativeSL: Math.round(slDep * y),
      cumulativeCS: Math.round(y === 1 ? costSegYear1 : costSegYear1 + costSegRemaining / 26.5 * (y - 1)),
    });
  }

  return {
    depreciableBasis: Math.round(depBasis),
    annualStraightLine: Math.round(annualSLDep),
    costSegYear1Bonus: Math.round(costSegYear1),
    yearlyData,
    totalSLSavings10yr: Math.round(annualSLDep * taxBracket * Math.min(years, 27.5)),
    totalCSSavings10yr: yearlyData.reduce((s, d) => s + d.csTaxSavings, 0),
  };
}

// Mortgage Scenario Comparison (Pro)
export function calculateMortgageScenario(principal, rate, termYears) {
  const mR = rate / 100 / 12;
  const n = termYears * 12;
  if (mR <= 0 || n <= 0 || principal <= 0) return { monthlyPayment: 0, totalInterest: 0, totalPaid: 0, yearlyData: [] };
  const mPay = principal * (mR * Math.pow(1 + mR, n)) / (Math.pow(1 + mR, n) - 1);
  const totalPaid = mPay * n;
  const totalInterest = totalPaid - principal;

  const yearlyData = [];
  let balance = principal;
  for (let y = 1; y <= termYears; y++) {
    let yearInterest = 0, yearPrincipal = 0;
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break;
      const int = balance * mR;
      const prin = Math.min(mPay - int, balance);
      yearInterest += int;
      yearPrincipal += prin;
      balance = Math.max(0, balance - prin);
    }
    yearlyData.push({
      year: y,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      remainingBalance: Math.round(balance),
    });
  }

  return {
    monthlyPayment: Math.round(mPay),
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    yearlyData,
  };
}

// Formatters
export const fmt = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(n||0);
export const fmtK = n => {const v=n||0; if(Math.abs(v)>=1e6) return `$${(v/1e6).toFixed(1)}M`; if(Math.abs(v)>=1e3) return `$${(v/1e3).toFixed(0)}K`; return fmt(v);};
