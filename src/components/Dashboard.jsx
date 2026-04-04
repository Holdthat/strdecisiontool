import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard({ data, scenarios, comparison, onEditAssumptions }) {
  const [activeTab, setActiveTab] = useState('overview');
  const theme = { bg: '#0B1120', card: '#151D2E', accent: '#167A5E', gold: '#9A7820', text: '#F8FAFC', positive: '#10B981', negative: '#EF4444' };
  const holdYears = scenarios.hold.yearByYear;
  const wealthData = holdYears.map((y, i) => ({
    year: y.year, hold: y.equity + holdYears.slice(0, i + 1).reduce((sum, h) => sum + h.cashFlow, 0),
    sell: comparison.sell * Math.pow(1.05, y.year) / Math.pow(1.05, 10)
  }));

  const handleExport = () => {
    const content = `STRInvestCalc Report\nProperty: $${data.currentValue?.toLocaleString()}\nHold: $${scenarios.hold.totalWealth?.toLocaleString()}\nSell: $${comparison.sell?.toLocaleString()}\nWinner: ${comparison.winner?.toUpperCase()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strinvestcalc.txt';
    a.click();
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1>STRInvestCalc Results</h1>
        <p style={{ color: theme.gold }}>10-Year Analysis</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: theme.gold }}>HOLD</p>
            <h3>${scenarios.hold.totalWealth?.toLocaleString()}</h3>
          </div>
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: theme.gold }}>SELL</p>
            <h3>${comparison.sell?.toLocaleString()}</h3>
          </div>
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: theme.gold }}>WINNER</p>
            <h3>{comparison.winner?.toUpperCase()}</h3>
          </div>
        </div>

        <div style={{ marginBottom: '20px', borderBottom: `1px solid ${theme.card}`, display: 'flex', gap: '20px' }}>
          {['overview', 'yearly', 'breakdown'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 20px', background: 'transparent', color: activeTab === tab ? theme.gold : theme.text,
              border: 'none', borderBottom: activeTab === tab ? `2px solid ${theme.gold}` : 'none', cursor: 'pointer'
            }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h3>Wealth Over 10 Years</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={wealthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gold} />
                <XAxis dataKey="year" stroke={theme.text} />
                <YAxis stroke={theme.text} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hold" stroke={theme.accent} name="Hold" strokeWidth={2} />
                <Line type="monotone" dataKey="sell" stroke={theme.gold} name="Sell" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'yearly' && (
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h3>Cash Flow</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={holdYears.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gold} />
                <XAxis dataKey="year" stroke={theme.text} />
                <YAxis stroke={theme.text} />
                <Tooltip />
                <Bar dataKey="cashFlow" fill={theme.accent} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div style={{ background: theme.card, padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h3>Year 1 Breakdown</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Rent:</span>
                <strong>${holdYears[0]?.grossRent?.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Expenses:</span>
                <strong>-${holdYears[0]?.expenses?.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Mortgage:</span>
                <strong>-${holdYears[0]?.mortgage?.toLocaleString()}</strong>
              </div>
              <div style={{ borderTop: `1px solid ${theme.gold}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <strong>Cash Flow:</strong>
                <strong>${holdYears[0]?.cashFlow?.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onEditAssumptions} style={{ padding: '12px 24px', background: theme.accent, color: 'white', border: 'none', cursor: 'pointer' }}>
            Edit
          </button>
          <button onClick={handleExport} style={{ padding: '12px 24px', background: theme.gold, color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
