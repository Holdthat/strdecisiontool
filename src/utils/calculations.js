export function getMaintenanceReservePercentage(propertyAge, roofAge, hvacAge, waterHeaterAge) {
  let baseRate = 0.01;
  if (roofAge > 15) baseRate += 0.01;
  if (hvacAge > 10) baseRate += 0.01;
  if (waterHeaterAge > 8) baseRate += 0.01;
  if (propertyAge > 50) baseRate += 0.01;
  return Math.min(baseRate, 0.05);
}

function round(num, decimals = 2) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function calculateHoldScenario(data, years = 10) {
  const yearByYear = [];
  let propertyValue = data.currentValue;
  let mortgageBalance = data.mortgageBalance;
  
  for (let year = 1; year <= years; year++) {
    const grossRent = data.annualRent * Math.pow(1 + data.annualRentGrowth, year - 1);
    const vacancy = grossRent * data.vacancyRate;
    const effectiveRent = grossRent - vacancy;
    const expenses = data.annualExpenses * Math.pow(1 + data.annualExpenseGrowth, year - 1);
    const maintenancePercent = getMaintenanceReservePercentage(data.propertyAge + year, data.roofAge + year, data.hvacAge + year, data.waterHeaterAge + year);
    const maintenanceReserve = propertyValue * maintenancePercent;
    
    const mortgagePayment = (mortgageBalance * (data.mortgageRate / 12)) / (1 - Math.pow(1 + data.mortgageRate / 12, -(data.mortgageYearsRemaining * 12 - (year - 1) * 12)));
    const annualMortgage = mortgagePayment * 12;
    const cashFlow = effectiveRent - expenses - maintenanceReserve - annualMortgage;
    
    mortgageBalance = Math.max(0, mortgageBalance - (annualMortgage - (mortgageBalance * data.mortgageRate)));
    propertyValue = propertyValue * (1 + data.annualAppreciation);
    const equity = propertyValue - mortgageBalance;
    
    yearByYear.push({
      year, grossRent: round(grossRent), vacancy: round(vacancy), effectiveRent: round(effectiveRent),
      expenses: round(expenses), maintenanceReserve: round(maintenanceReserve), mortgage: round(annualMortgage),
      cashFlow: round(cashFlow), propertyValue: round(propertyValue), mortgageBalance: round(mortgageBalance),
      equity: round(equity)
    });
  }
  
  const totalCashFlow = yearByYear.reduce((sum, y) => sum + y.cashFlow, 0);
  const finalEquity = yearByYear[yearByYear.length - 1].equity;
  return {
    yearByYear,
    totalCashFlow: round(totalCashFlow),
    finalEquity: round(finalEquity),
    totalWealth: round(finalEquity + totalCashFlow)
  };
}

export function calculateSellScenario(data, years = 10, alternativeReturn = 0.05) {
  const salePrice = data.currentValue;
  const realtorFees = salePrice * 0.06;
  const depreciationRecapture = (salePrice - data.purchasePrice) > 0 ? (data.depreciation * 0.25) : 0;
  const capitalGainsTax = (salePrice - data.purchasePrice) * 0.15;
  const mortgagePayoff = data.mortgageBalance;
  const netProceeds = salePrice - realtorFees - depreciationRecapture - capitalGainsTax - mortgagePayoff;
  
  let investedAmount = netProceeds;
  for (let year = 1; year <= years; year++) {
    investedAmount = investedAmount * (1 + alternativeReturn);
  }
  
  return {
    salePrice: round(salePrice),
    realtorFees: round(realtorFees),
    depreciationRecapture: round(depreciationRecapture),
    capitalGainsTax: round(capitalGainsTax),
    mortgagePayoff: round(mortgagePayoff),
    netProceeds: round(netProceeds),
    investedValue: round(investedAmount),
    totalTaxesPaid: round(depreciationRecapture + capitalGainsTax)
  };
}

export function compareScenarios(holdData, sellData, year = 10) {
  const holdValue = holdData.yearByYear[year - 1].equity + holdData.yearByYear.slice(0, year).reduce((sum, y) => sum + y.cashFlow, 0);
  const sellValue = sellData.investedValue;
  const difference = holdValue - sellValue;
  const winner = difference > 0 ? 'hold' : 'sell';
  return { holdEquity: round(holdValue), sellValue: round(sellValue), difference: round(difference), winner, advantage: round(Math.abs(difference)) };
}
