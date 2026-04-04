function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function calculateOneZeroThreeOneScenario(data, replacementData, years = 10) {
  const salePrice = data.currentValue;
  const realtorFees = salePrice * 0.06;
  const qiFees = 2500;
  const mortgagePayoff = data.mortgageBalance;
  const proceedsFromSale = salePrice - realtorFees - qiFees - mortgagePayoff;
  
  const replacementValue = replacementData.replacementValue;
  const replacementMortgage = replacementValue * replacementData.replacementMortgagePercent;
  const downPayment = replacementValue - replacementMortgage;
  const depreciationBasis = replacementValue * 0.8;
  
  const yearByYear = [];
  let propertyValue = replacementValue;
  let mortgageBalance = replacementMortgage;
  let totalCashFlow = 0;
  
  for (let year = 1; year <= years; year++) {
    const grossRent = replacementData.replacementAnnualRent * Math.pow(1.03, year - 1);
    const vacancy = grossRent * replacementData.replacementVacancyRate;
    const effectiveRent = grossRent - vacancy;
    const expenses = replacementData.replacementExpenses * Math.pow(1.025, year - 1);
    const maintenanceReserve = propertyValue * 0.02;
    
    const mortgagePayment = (mortgageBalance * (replacementData.replacementMortgageRate / 12)) / (1 - Math.pow(1 + replacementData.replacementMortgageRate / 12, -(replacementData.replacementMortgageYears * 12 - (year - 1) * 12)));
    const annualMortgage = mortgagePayment * 12;
    const cashFlow = effectiveRent - expenses - maintenanceReserve - annualMortgage;
    totalCashFlow += cashFlow;
    
    mortgageBalance = Math.max(0, mortgageBalance - (annualMortgage - (mortgageBalance * replacementData.replacementMortgageRate)));
    propertyValue = propertyValue * (1 + replacementData.replacementAppreciation);
    const equity = propertyValue - mortgageBalance;
    
    yearByYear.push({ year, grossRent: round(grossRent), expenses: round(expenses), cashFlow: round(cashFlow),
      propertyValue: round(propertyValue), mortgageBalance: round(mortgageBalance), equity: round(equity) });
  }
  
  const endEquity = yearByYear[yearByYear.length - 1].equity;
  const stepUpBasisValue = replacementValue * 1.5;
  
  return {
    salePrice: round(salePrice), realtorFees: round(realtorFees), qiFees: round(qiFees), mortgagePayoff: round(mortgagePayoff),
    proceedsFromSale: round(proceedsFromSale), replacementValue: round(replacementValue), downPayment: round(downPayment),
    replacementMortgage: round(replacementMortgage), depreciationBasis: round(depreciationBasis), yearByYear, endEquity: round(endEquity),
    totalCashFlow: round(totalCashFlow), totalTaxDeferred: round(realtorFees + qiFees), stepUpBasisValue: round(stepUpBasisValue)
  };
}

export function compareThreeScenarios(holdData, sellData, exchangeData, year = 10) {
  const holdEquity = holdData.yearByYear[year - 1].equity;
  const holdCashFlow = holdData.yearByYear.slice(0, year).reduce((sum, y) => sum + y.cashFlow, 0);
  const holdTotal = holdEquity + holdCashFlow;
  const sellTotal = sellData.investedValue;
  const exchangeEquity = exchangeData.yearByYear[year - 1].equity;
  const exchangeCashFlow = exchangeData.yearByYear.slice(0, year).reduce((sum, y) => sum + y.cashFlow, 0);
  const exchangeTotal = exchangeEquity + exchangeCashFlow;
  
  const values = [
    { scenario: 'hold', value: holdTotal },
    { scenario: 'sell', value: sellTotal },
    { scenario: '1031', value: exchangeTotal }
  ];
  values.sort((a, b) => b.value - a.value);
  
  return {
    hold: round(holdTotal), sell: round(sellTotal), exchange: round(exchangeTotal),
    winner: values[0].scenario, topThree: values, advantage: round(values[0].value - values[1].value)
  };
}

export function getPhase2Recommendation(data, holdData, sellData, exchangeData, comparison) {
  const scenarios = [
    { name: 'Hold', value: comparison.hold, pros: ['Keep property', 'Ongoing cash flow', 'Appreciation'], cons: ['Continued management', 'Depreciation limits'] },
    { name: 'Sell', value: comparison.sell, pros: ['Liquidity', 'Diversification', 'No management'], cons: ['Taxes owed', 'Loss of appreciation'] },
    { name: '1031 Exchange', value: comparison.exchange, pros: ['Tax deferred', 'Fresh depreciation', 'New property'], cons: ['Time constraints', 'Like-kind requirement'] }
  ];
  scenarios.sort((a, b) => b.value - a.value);
  return {
    topRecommendation: scenarios[0],
    alternatives: scenarios.slice(1),
    taxDeferralBenefit: round(Math.max(0, comparison.exchange - comparison.sell))
  };
}
