// src/App.js
// Main application component

import React, { useState } from 'react';
import { 
  calculateHoldScenario, 
  calculateSellScenario, 
  compareScenarios
} from './utils/calculations';
import { 
  calculateOneZeroThreeOneScenario, 
  compareThreeScenarios 
} from './utils/calculations-phase2';
import STRcalcQuestionnaire from './components/STRcalcQuestionnaire';
import Dashboard from './components/Dashboard';

function App() {
  const [appState, setAppState] = useState('questionnaire');
  const [formData, setFormData] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [comparison, setComparison] = useState(null);

  const handleQuestionnaireComplete = (data) => {
    const holdScenario = calculateHoldScenario(data, 10);
    const sellScenario = calculateSellScenario(data, 10, 0.05);
    
    let scenarioComparison;
    if (data.exitStrategy === '1031-exchange' || data.exitStrategy === 'undecided') {
      const exchangeData = {
        replacementValue: data.replacementValue || data.currentValue * 1.2,
        replacementAnnualRent: data.replacementAnnualRent || data.annualRent * 1.05,
        replacementExpenses: data.replacementExpenses || data.annualExpenses * 1.05,
        replacementVacancyRate: data.replacementVacancyRate || data.vacancyRate,
        replacementAppreciation: data.replacementAppreciation || 0.03,
        replacementMortgagePercent: data.replacementMortgagePercent || 0.7,
        replacementMortgageRate: data.replacementMortgageRate || 0.045,
        replacementMortgageYears: data.replacementMortgageYears || 25
      };
      
      const exchangeScenario = calculateOneZeroThreeOneScenario(data, exchangeData, 10);
      scenarioComparison = compareThreeScenarios(holdScenario, sellScenario, exchangeScenario, 10);
    } else {
      scenarioComparison = compareScenarios(holdScenario, sellScenario, 10);
    }
    
    setFormData(data);
    setScenarios({
      hold: holdScenario,
      sell: sellScenario
    });
    setComparison(scenarioComparison);
    setAppState('dashboard');
  };

  const handleEditAssumptions = () => {
    setAppState('questionnaire');
  };

  return (
    <div style={{
      background: '#0B1120',
      color: '#F8FAFC',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      {appState === 'questionnaire' && (
        <STRcalcQuestionnaire 
          onComplete={handleQuestionnaireComplete}
          initialData={formData}
        />
      )}
      
      {appState === 'dashboard' && scenarios && (
        <Dashboard
          data={formData}
          scenarios={scenarios}
          comparison={comparison}
          onEditAssumptions={handleEditAssumptions}
        />
      )}
    </div>
  );
}

export default App;
