/**
 * STRcalc Phase 1: Calculation Engine
 * ====================================
 * 
 * Pure calculation functions for Hold and Sell scenarios.
 * No React, no UI—just math.
 * 
 * All monetary values in USD. All percentages as decimals (0.05 = 5%).
 * Returns rounded to 2 decimal places to avoid floating-point artifacts.
 * 
 * Test these independently before integrating into React.
 */

const round = (n, decimals = 2) => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);

/**
 * MAINTENANCE RESERVE MODEL
 * ========================
 * Age-based component lifecycle. Returns annual reserve provision.
 * 
 * Based on national averages:
 * - Roof: ~20 years
 * - HVAC: ~15 years
 * - Water heater: ~10 years
 * - Appliances: ~10-12 years
 * - Plumbing/electrical: 25+ years (lower reserve)
 */

function getMaintenanceReservePercentage(propertyAge, roofAge, hvacAge, waterHeaterAge) {
  // Base reserve: 1% of property value annually
  let reserve = 0.01;

  // Add surge years (when components near end of life and likely to need replacement)
  const nearEnd = (age, lifespan) => {
    if (!age) return 0;
    const remaining = lifespan - age;
    if (remaining <= 2) return 0.015; // Last 2 years: +1.5%
    if (remaining <= 5) return 0.008; // Last 5 years: +0.8%
    return 0;
  };

  reserve += nearEnd(roofAge, 20);
  reserve += nearEnd(hvacAge, 15);
  reserve += nearEnd(waterHeaterAge, 10);

  return Math.min(reserve, 0.05); // Cap at 5% annual reserve
}

/**
 * HOLD SCENARIO CALCULATION
 * ========================
 * Projects annual cash flow, equity, depreciation for X years.
 * 
 * @param {Object} data - Questionnaire answers
 * @param {number} years - Projection period (default 10)
 * @returns {Object} Year-by-year projection + summary
 */

function calculateHoldScenario(data, years = 10) {
  const {
    purchasePrice,
    currentValue,
    yearsOwned,
    annualRent,
    annualExpenses,
    vacancyRate,
    mortgageBalance,
    mortgageRate,
    depreciation,
    annualAppreciation,
    annualExpenseGrowth = 0.025, // 2.5% annual growth
    roofAge,
    hvacAge,
    waterHeaterAge,
  } = data;

  let {
    mortgageYearsRemaining,
  } = data;

  const yearByYear = [];
  let propertyValue = currentValue;
  let remainingMortgage = mortgageBalance;
  let totalDepreciationTaken = depreciation;

  for (let year = 1; year <= years; year++) {
    // Rental income (adjusted for vacancy)
    const grossRent = annualRent * (1 - vacancyRate);
    
    // Operating expenses (grow annually)
    const opex = annualExpenses * Math.pow(1 + annualExpenseGrowth, year - 1);
    
    // Maintenance reserve
    const maintReserveRate = getMaintenanceReservePercentage(
      yearsOwned + year,
      roofAge ? roofAge + year : null,
      hvacAge ? hvacAge + year : null,
      waterHeaterAge ? waterHeaterAge + year : null
    );
    const maintReserve = propertyValue * maintReserveRate;
    
    // Mortgage payment (principal + interest)
    let debtService = 0;
    if (remainingMortgage > 0 && mortgageYearsRemaining > 0) {
      const monthlyRate = mortgageRate / 12;
      const remainingMonths = mortgageYearsRemaining * 12;
      const monthlyPayment = remainingMortgage * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                    (Math.pow(1 + monthlyRate, remainingMonths) - 1);
      debtService = monthlyPayment * 12;
      
      // Update mortgage balance: interest accrued, then principal paid
      const interestPaid = remainingMortgage * mortgageRate;
      const principalPaid = debtService - interestPaid;
      remainingMortgage -= principalPaid;
      remainingMortgage = Math.max(remainingMortgage, 0);
      mortgageYearsRemaining = Math.max(mortgageYearsRemaining - 1, 0);
    }
    
    // Annual cash flow (before taxes)
    const cashFlow = grossRent - opex - maintReserve - debtService;
    
    // Property appreciation
    propertyValue = propertyValue * (1 + annualAppreciation);
    
    // Depreciation deduction (for taxes)
    const annualDepreciation = (purchasePrice * 0.8) / 27.5; // Residential = 27.5 years, 80% depreciable
    totalDepreciationTaken += annualDepreciation;
    
    // Equity = property value - remaining mortgage
    const equity = propertyValue - remainingMortgage;
    
    yearByYear.push({
      year,
      grossRent: round(grossRent),
      opex: round(opex),
      maintReserve: round(maintReserve),
      debtService: round(debtService),
      cashFlow: round(cashFlow),
      propertyValue: round(propertyValue),
      remainingMortgage: round(remainingMortgage),
      equity: round(equity),
      annualDepreciation: round(annualDepreciation),
      cumulativeDepreciation: round(totalDepreciationTaken),
    });
  }

  // Tax impact if sold at end of period
  const gain = propertyValue - purchasePrice;
  const depreciationRecaptureTax = totalDepreciationTaken * 0.25; // 25% recapture
  const capitalGainsTax = gain * 0.2; // 20% long-term cap gains (simplified)
  const totalTaxIfSold = depreciationRecaptureTax + capitalGainsTax;

  return {
    scenario: "hold",
    yearByYear,
    summary: {
      endPropertyValue: round(propertyValue),
      endEquity: round(propertyValue - remainingMortgage),
      endMortgageBalance: round(remainingMortgage),
      totalCashFlowGenerated: round(yearByYear.reduce((sum, y) => sum + y.cashFlow, 0)),
      totalDepreciationTaken: round(totalDepreciationTaken),
      taxIfSoldAtEnd: round(totalTaxIfSold),
    },
  };
}

/**
 * SELL SCENARIO CALCULATION
 * ========================
 * Models selling today and investing proceeds in alternative.
 * 
 * @param {Object} data - Questionnaire answers
 * @param {number} years - Projection period
 * @param {number} alternativeReturn - Annual return rate on proceeds (e.g., 0.05 for 5%)
 * @returns {Object} Year-by-year projection + summary
 */

function calculateSellScenario(data, years = 10, alternativeReturn = 0.05) {
  const {
    currentValue,
    purchasePrice,
    depreciation,
    mortgageBalance,
    realtorFeePercent = 0.06, // 6% realtor fee
    taxBracket = 0.2, // 20% long-term capital gains rate
  } = data;

  // Calculate taxes owed on sale
  const salePrice = currentValue;
  const realtorFees = salePrice * realtorFeePercent;
  const gain = salePrice - purchasePrice;
  const depreciationRecaptureTax = depreciation * 0.25; // 25% recapture
  const capitalGainsTax = Math.max(gain, 0) * taxBracket;
  const totalTaxes = depreciationRecaptureTax + capitalGainsTax;

  // Net proceeds to invest
  const netProceeds = salePrice - realtorFees - totalTaxes - mortgageBalance;

  // Project investment growth
  const yearByYear = [];
  let investedValue = netProceeds;

  for (let year = 1; year <= years; year++) {
    investedValue = investedValue * (1 + alternativeReturn);
    yearByYear.push({
      year,
      investedValue: round(investedValue),
      annualReturn: round(investedValue - yearByYear[year - 2]?.investedValue || netProceeds),
    });
  }

  return {
    scenario: "sell",
    salePrice: round(salePrice),
    realtorFees: round(realtorFees),
    depreciationRecaptureTax: round(depreciationRecaptureTax),
    capitalGainsTax: round(capitalGainsTax),
    totalTaxes: round(totalTaxes),
    netProceeds: round(netProceeds),
    yearByYear,
    summary: {
      endInvestedValue: round(investedValue),
      totalTaxesPaid: round(totalTaxes),
      netProceedsInvested: round(netProceeds),
    },
  };
}

/**
 * COMPARISON METRICS
 * =================
 * Compare Hold vs. Sell scenarios at various checkpoints.
 */

function compareScenarios(holdData, sellData, year = 10) {
  const holdYear = holdData.yearByYear[year - 1] || holdData.yearByYear[holdData.yearByYear.length - 1];
  const sellYear = sellData.yearByYear[year - 1] || sellData.yearByYear[sellData.yearByYear.length - 1];

  const breakEvenYear = holdData.yearByYear.findIndex((h, idx) => {
    const s = sellData.yearByYear[idx];
    return h.equity > s.investedValue;
  }) + 1 || null;

  return {
    year,
    holdEquity: round(holdYear.equity),
    sellInvestedValue: round(sellYear.investedValue),
    winner: holdYear.equity > sellYear.investedValue ? "hold" : "sell",
    advantage: round(Math.abs(holdYear.equity - sellYear.investedValue)),
    breakEvenYear,
    holdCashFlow: round(holdData.yearByYear.slice(0, year).reduce((sum, y) => sum + y.cashFlow, 0)),
    opportunityCost: round(sellYear.investedValue - holdYear.equity), // What you give up by holding
  };
}

/**
 * EXPORT FOR TESTING & USE
 */

module.exports = {
  calculateHoldScenario,
  calculateSellScenario,
  compareScenarios,
  getMaintenanceReservePercentage,
  round,
};
