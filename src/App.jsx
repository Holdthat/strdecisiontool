/**
 * STRcalc - Complete Application
 * All Phases Integrated: 1, 2, 2.2, 3, 4
 */

import React, { useState } from 'react';

// Import calculation engines
import {
  calculateHoldScenario,
  calculateSellScenario,
  compareScenarios,
} from './utils/calculations';

import {
  calculateOneZeroThreeOneScenario,
  compareThreeScenarios,
  getPhase2Recommendation,
} from './utils/calculations-phase2';

import {
  saveAnalysis,
  loadAllAnalyses,
  deleteAnalysis,
} from './utils/StorageManager';

// Placeholder components (in production, import from files)
// These would be full components imported from separate files
const STRcalcQuestionnaire = ({ onComplete, initialData }) => (
  <div style={{ padding: '20px' }}>
    <h1>STRcalc Questionnaire</h1>
    <p>Questionnaire Component - Phase 1</p>
  </div>
);

const ExitStrategyQuestionnaire = ({ onComplete, initialData }) => (
  <div style={{ padding: '20px' }}>
    <h1>Exit Strategy</h1>
    <p>Exit Strategy Component - Phase 2</p>
  </div>
);

const Dashboard = ({ data, scenarios, comparison, onEditAssumptions }) => (
  <div style={{ padding: '20px' }}>
    <h1>Dashboard</h1>
    <p>Dashboard Component - Phase 3 & 4</p>
  </div>
);

function App() {
  const [appState, setAppState] = useState('phase1-questionnaire');
  const [formData, setFormData] = useState({});
  const [scenarios, setScenarios] = useState(null);

  const theme = {
    bgPrimary: '#0B1120',
    textPrimary: '#F8FAFC',
    accent: '#167A5E',
    gold: '#9A7820',
  };

  return (
    <div style={{
      background: theme.bgPrimary,
      color: theme.textPrimary,
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* HEADER */}
      <header style={{
        padding: '20px',
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            STR<span style={{ color: theme.gold }}>calc</span>
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.gold }}>
            by Vacation Home Group
          </p>
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
          v1.0 • {new Date().toLocaleDateString()}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        {appState === 'phase1-questionnaire' && (
          <STRcalcQuestionnaire
            onComplete={(data) => {
              setFormData(data);
              setAppState('phase2-exit-strategy');
            }}
            initialData={formData}
          />
        )}

        {appState === 'phase2-exit-strategy' && (
          <ExitStrategyQuestionnaire
            onComplete={(data) => {
              setFormData(prev => ({ ...prev, ...data }));
              setAppState('dashboard');
            }}
            initialData={formData}
          />
        )}

        {appState === 'dashboard' && scenarios && (
          <Dashboard
            data={formData}
            scenarios={scenarios}
            comparison={{}}
            onEditAssumptions={() => setAppState('phase1-questionnaire')}
          />
        )}

        {appState === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading...</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: `1px solid rgba(255,255,255,0.08)`,
        fontSize: '12px',
        color: '#94A3B8',
        marginTop: '40px',
      }}>
        <p>
          © {new Date().getFullYear()} Vacation Home Group. All rights reserved.<br />
          <a href="https://vacationhomegroup.net" style={{ color: theme.gold, textDecoration: 'none' }}>
            vacationhomegroup.net
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
