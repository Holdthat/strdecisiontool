import React, { useState } from 'react';

function App() {
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
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        STRInvest<span style={{ color: theme.gold }}>Calc</span>
      </h1>
      <p style={{ fontSize: '18px', color: theme.gold, marginBottom: '40px' }}>
        Professional Investment Analysis Tool
      </p>
      <p style={{ fontSize: '16px', color: theme.textPrimary, marginBottom: '20px' }}>
        ✓ Setup Complete!
      </p>
      <p style={{ fontSize: '14px', color: '#94A3B8' }}>
        Short-Term Rental Investment Analysis<br />
        Hold vs. Sell vs. 1031 Exchange Comparison
      </p>
      <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '40px' }}>
        v1.0.0 • Production Ready
      </p>
    </div>
  );
}

export default App;
