/**
 * STRcalc Phase 2: 1031 Exchange Calculations
 * ============================================
 * 
 * Extends Phase 1 calculation engine with 1031 exchange scenario.
 * A 1031 exchange allows deferral of capital gains tax if proceeds
 * are reinvested in like-kind property within 45/180 day windows.
 * 
 * Key mechanics:
 * - NO capital gains tax paid (deferred until future sale or death)
 * - NO depreciation recapture tax (if replacement is residential)
 * - Qualified intermediary fee: ~$700
 * - Fresh depreciation basis on replacement property
 * - Can ladder indefinitely (each exchange → another exchange)
 * 
 * IMPORTS:
 * - From Phase 1: calculateHoldScenario, calculateSellScenario, round
 */

const round = (n, decimals = 2) => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);

/**
 * CALCULATE 1031 EXCHANGE SCENARIO
 * ================================
 * 
 * Model: Sell property, reinvest proceeds in like-kind property (tax-deferred).
 * Full proceeds grow without tax drag until future sale or step-up at death.
 * 
 * ASSUMPTIONS:
 * - Replacement property is residential rental (like-kind)
 * - Full proceeds can be reinvested ($X sale → $X reinvestment)
 * - No boot taken (no taxable cash back to investor)
 * - 45-day identification window assumed manageable
 * - 180-day close window assumed achievable
 * - Fresh depreciation basis = replacement property purchase price
 * 
 * PARAMETERS:
 * - data: Original property data (from questionnaire)
 * - replacementData: New property assumptions
 *   • replacementValue: Purchase price of replacement property
 *   • replacementAnnualRent: Expected rental income
 *   • replacementExpenses: Expected operating expenses
 *   • replacementAppreciation: Expected appreciation rate
 *   • replacementCapRate: Cap rate of replacement market
 * - years: Projection period
 * 
 * RETURNS:
 * - Year-by-year projection of replacement property equity
 * - Tax deferral benefit compared to sell
 * - Stepped-up basis potential at death
 */

function calculateOneZeroThreeOneScenario(data, replacementData, years = 10) {
  const {
    currentValue,
    purchasePrice,
    depreciation,
    mortgageBalance,
    realtorFeePercent = 0.06,
  } = data;

  const {
    replacementValue,
    replacementAnnualRent,
    replacementExpenses,
    replacementVacancyRate = 0.08,
    replacementAppreciation = 0.03,
    replacementMortgagePercent = 0, // Assume some LTV
    replacementMortgageRate = 0.045,
    replacementMortgageYears = 25,
  } = replacementData;

  // ==================== SALE & EXCHANGE SETUP ====================

  // Sale of original property
  const salePrice = currentValue;
  const realtorFees = salePrice * realtorFeePercent;
  const qiFeesAndClosingCosts = 2500; // Typical QI + closing costs

  // Calculate net proceeds available for reinvestment
  // In a 1031, depreciation recapture is deferred, not paid
  const grossProceeds = salePrice - realtorFees - qiFeesAndClosingCosts - mortgageBalance;

  // KEY: In a 1031 exchange with no "boot," full proceeds are reinvested
  const proceedsAvailableForReinvestment = grossProceeds;

  // Determine replacement property financing
  const replacementDownPayment = grossProceeds;
  const replacementMortgageBalance = replacementValue * replacementMortgagePercent;
  
  // If replacement value > available proceeds, assumes additional financing or
  // the user is providing additional capital (not modeled here for simplicity)
  const actualReplacementValue = Math.max(replacementValue, replacementDownPayment);

  // Fresh depreciation basis (entire purchase price is new basis)
  const replacementDepreciationBasis = actualReplacementValue * 0.8; // 80% depreciable
  const annualReplacementDepreciation = replacementDepreciationBasis / 27.5;

  // ==================== YEAR-BY-YEAR PROJECTION ====================

  const yearByYear = [];
  let replacementPropertyValue = actualReplacementValue;
  let replacementRemainingMortgage = replacementMortgageBalance;
  let replacementMortgageYearsRemaining = replacementMortgageYears;
  let totalReplacementDepreciation = 0;

  for (let year = 1; year <= years; year++) {
    // Rental income
    const grossRent = replacementAnnualRent * (1 - replacementVacancyRate);

    // Operating expenses
    const opex = replacementExpenses;

    // Maintenance reserve (simplified for replacement property)
    const maintReserve = replacementPropertyValue * 0.01; // 1% base

    // Debt service (if financed)
    let debtService = 0;
    if (replacementRemainingMortgage > 0 && replacementMortgageYearsRemaining > 0) {
      const monthlyRate = replacementMortgageRate / 12;
      const remainingMonths = replacementMortgageYearsRemaining * 12;
      const monthlyPayment = replacementRemainingMortgage *
        (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
        (Math.pow(1 + monthlyRate, remainingMonths) - 1);
      debtService = monthlyPayment * 12;

      const interestPaid = replacementRemainingMortgage * replacementMortgageRate;
      const principalPaid = debtService - interestPaid;
      replacementRemainingMortgage -= principalPaid;
      replacementRemainingMortgage = Math.max(replacementRemainingMortgage, 0);
      replacementMortgageYearsRemaining = Math.max(replacementMortgageYearsRemaining - 1, 0);
    }

    // Annual cash flow
    const cashFlow = grossRent - opex - maintReserve - debtService;

    // Property appreciation
    replacementPropertyValue = replacementPropertyValue * (1 + replacementAppreciation);

    // Depreciation deduction (fresh basis)
    totalReplacementDepreciation += annualReplacementDepreciation;

    // Equity in replacement
    const equity = replacementPropertyValue - replacementRemainingMortgage;

    // Tax-deferred gain growth (the benefit of 1031)
    // This represents the gains that have NOT been taxed yet
    const deferredGain = equity - grossProceeds;

    yearByYear.push({
      year,
      grossRent: round(grossRent),
      opex: round(opex),
      maintReserve: round(maintReserve),
      debtService: round(debtService),
      cashFlow: round(cashFlow),
      propertyValue: round(replacementPropertyValue),
      remainingMortgage: round(replacementRemainingMortgage),
      equity: round(equity),
      annualDepreciation: round(annualReplacementDepreciation),
      cumulativeDepreciation: round(totalReplacementDepreciation),
      deferredGain: round(deferredGain),
    });
  }

  // ==================== 1031-SPECIFIC METRICS ====================

  const finalEquity = replacementPropertyValue - replacementRemainingMortgage;
  const totalDeferredGain = finalEquity - grossProceeds;

  // Tax impact IF sold at end of period (1031 ladder would reset this)
  const gainWhenSold = replacementPropertyValue - actualReplacementValue;
  const depreciationRecaptureTax = totalReplacementDepreciation * 0.25;
  const capitalGainsTax = gainWhenSold * 0.2;
  const totalTaxIfSoldAtEnd = depreciationRecaptureTax + capitalGainsTax;

  // Stepped-up basis benefit at death (no tax if inherited)
  const stepUpBasisValue = replacementPropertyValue;

  // Key comparison: Tax deferral benefit vs. Sell outright
  // If you had sold outright, you'd pay taxes NOW
  // With 1031, you defer until future sale
  // This is the time-value benefit of deferral

  return {
    scenario: "1031-exchange",
    sale: {
      salePrice: round(salePrice),
      realtorFees: round(realtorFees),
      qiFeesAndClosingCosts: round(qiFeesAndClosingCosts),
      mortgagePayoff: round(mortgageBalance),
      grossProceeds: round(grossProceeds),
    },
    replacement: {
      purchasePrice: round(actualReplacementValue),
      downPayment: round(replacementDownPayment),
      mortgageBalance: round(replacementMortgageBalance),
      depreciationBasis: round(replacementDepreciationBasis),
    },
    yearByYear,
    summary: {
      endPropertyValue: round(replacementPropertyValue),
      endEquity: round(finalEquity),
      endMortgageBalance: round(replacementRemainingMortgage),
      totalCashFlowGenerated: round(yearByYear.reduce((sum, y) => sum + y.cashFlow, 0)),
      totalDepreciationTaken: round(totalReplacementDepreciation),
      totalDeferredGain: round(totalDeferredGain),
      taxIfSoldAtEnd: round(totalTaxIfSoldAtEnd),
      stepUpBasisValue: round(stepUpBasisValue),
      // These are NOT paid now, but would be due if property is sold
      depreciationRecaptureTaxDeferred: round(depreciationRecaptureTax),
      capitalGainsTaxDeferred: round(capitalGainsTax),
      totalTaxDeferred: round(totalTaxIfSoldAtEnd),
    },
  };
}

/**
 * THREE-WAY COMPARISON
 * ===================
 * Compare Hold vs. Sell vs. 1031 scenarios
 * 
 * Returns metrics to determine best strategy
 */

function compareThreeScenarios(holdData, sellData, exchangeData, year = 10) {
  const holdYear = holdData.yearByYear[year - 1] || holdData.yearByYear[holdData.yearByYear.length - 1];
  const sellYear = sellData.yearByYear[year - 1] || sellData.yearByYear[sellData.yearByYear.length - 1];
  const exchangeYear = exchangeData.yearByYear[year - 1] || exchangeData.yearByYear[exchangeData.yearByYear.length - 1];

  // Rank by total wealth at year X
  const scenarios = [
    { name: 'hold', value: holdYear.equity, cashFlow: holdData.yearByYear.slice(0, year).reduce((sum, y) => sum + y.cashFlow, 0) },
    { name: 'sell', value: sellYear.investedValue, cashFlow: 0 }, // No cash flow from sell scenario
    { name: '1031', value: exchangeYear.equity, cashFlow: exchangeData.yearByYear.slice(0, year).reduce((sum, y) => sum + y.cashFlow, 0) },
  ];

  scenarios.sort((a, b) => b.value - a.value);

  const winner = scenarios[0].name;
  const advantage = round(scenarios[0].value - scenarios[1].value);

  // Break-even years
  let breakEvenHoldVsSell = null;
  let breakEvenHoldVs1031 = null;
  let breakEven1031VsSell = null;

  for (let i = 0; i < Math.min(holdData.yearByYear.length, sellData.yearByYear.length); i++) {
    if (holdData.yearByYear[i].equity > sellData.yearByYear[i].investedValue && !breakEvenHoldVsSell) {
      breakEvenHoldVsSell = i + 1;
    }
  }

  for (let i = 0; i < Math.min(holdData.yearByYear.length, exchangeData.yearByYear.length); i++) {
    if (holdData.yearByYear[i].equity > exchangeData.yearByYear[i].equity && !breakEvenHoldVs1031) {
      breakEvenHoldVs1031 = i + 1;
    }
  }

  for (let i = 0; i < Math.min(sellData.yearByYear.length, exchangeData.yearByYear.length); i++) {
    if (exchangeData.yearByYear[i].equity > sellData.yearByYear[i].investedValue && !breakEven1031VsSell) {
      breakEven1031VsSell = i + 1;
    }
  }

  // Tax deferral benefit: How much in taxes NOT paid yet with 1031
  const taxDeferralBenefit = exchangeData.summary.totalTaxDeferred;

  return {
    year,
    holdEquity: round(holdYear.equity),
    sellInvestedValue: round(sellYear.investedValue),
    exchangeEquity: round(exchangeYear.equity),
    winner,
    advantage,
    breakEvenHoldVsSell,
    breakEvenHoldVs1031,
    breakEven1031VsSell,
    holdCashFlow: round(scenarios.find(s => s.name === 'hold')?.cashFlow || 0),
    exchangeCashFlow: round(scenarios.find(s => s.name === '1031')?.cashFlow || 0),
    taxDeferralBenefit,
  };
}

/**
 * RECOMMENDATION ENGINE (Phase 2)
 * ==============================
 * Logic to recommend Hold, Sell, or 1031
 */

function getPhase2Recommendation(data, holdData, sellData, exchangeData, comparison) {
  const {
    gain,
    purchasePrice,
    yearsOwned,
    taxBracket = 0.2,
  } = data;

  const recommendations = [];

  // Calculate total gain on original property
  const totalGain = (data.currentValue - data.purchasePrice) + data.depreciation;

  // ==================== 1031 EXCHANGE ADVANTAGE ====================

  if (totalGain > 250000) {
    // Large gains = strong 1031 case
    recommendations.push({
      scenario: '1031-exchange',
      score: 100,
      reason: 'Large gains ($' + totalGain.toLocaleString() + ') create significant tax burden if sold outright',
      keyPoints: [
        'Tax deferral benefit: $' + exchangeData.summary.totalTaxDeferred.toLocaleString(),
        'Wealth advantage vs. sell: $' + (comparison.exchangeEquity - comparison.sellInvestedValue).toLocaleString(),
        'Fresh depreciation basis resets tax shelter',
      ],
    });
  }

  // ==================== HOLD ADVANTAGE ====================

  if (exchangeData.yearByYear[9]?.equity < holdData.yearByYear[9]?.equity) {
    // Hold beats 1031 in this property's appreciation
    recommendations.push({
      scenario: 'hold',
      score: 85,
      reason: 'Current property appreciation outpaces typical replacement',
      keyPoints: [
        'Equity advantage: $' + (holdData.summary.endEquity - exchangeData.summary.endEquity).toLocaleString(),
        'Strong local market (cap rate: ' + (data.capRate * 100).toFixed(1) + '%)',
        'Avoid 45/180 day identification/close pressure',
      ],
    });
  }

  // ==================== SELL ADVANTAGE ====================

  if (totalGain < 100000 && yearsOwned > 7) {
    // Small gains + owned long = maybe just sell
    recommendations.push({
      scenario: 'sell',
      score: 60,
      reason: 'Modest gain + held long term = clean exit option',
      keyPoints: [
        'Taxes on gain: $' + (totalGain * 0.2).toLocaleString(),
        'Simplicity of outright sale (no 1031 windows)',
        'Funds available for any investment (not just property)',
      ],
    });
  }

  // ==================== DEFAULT: SHOW TOP 2 ====================

  if (recommendations.length === 0) {
    // If no special logic triggered, rank by wealth
    if (comparison.exchangeEquity > comparison.holdEquity) {
      recommendations.push({
        scenario: '1031-exchange',
        score: 95,
        reason: 'Projected wealth advantage of $' + (comparison.exchangeEquity - comparison.holdEquity).toLocaleString() + ' over 10 years',
        keyPoints: [
          'Tax-deferred growth maximizes compounding',
          'Suitable replacement property identified',
        ],
      });
    } else {
      recommendations.push({
        scenario: 'hold',
        score: 95,
        reason: 'Current property continues to outperform alternatives',
        keyPoints: [
          'Hold equity: $' + comparison.holdEquity.toLocaleString(),
          'Annual cash flow continues',
          'No execution risk from 1031 windows',
        ],
      });
    }
  }

  // Always show comparison context
  return {
    recommendations: recommendations.slice(0, 2), // Top 2
    comparisonContext: {
      holdAdvantage: comparison.holdEquity > comparison.exchangeEquity ? 
        (comparison.holdEquity - comparison.exchangeEquity) : 0,
      exchangeAdvantage: comparison.exchangeEquity > comparison.holdEquity ? 
        (comparison.exchangeEquity - comparison.holdEquity) : 0,
      taxDeferralBenefit: exchangeData.summary.totalTaxDeferred,
      bestCase: comparison.winner === '1031' ? 'exchange' : 'hold',
    },
  };
}

/**
 * EXPORT FOR USE IN REACT
 */

module.exports = {
  calculateOneZeroThreeOneScenario,
  compareThreeScenarios,
  getPhase2Recommendation,
  round,
};
