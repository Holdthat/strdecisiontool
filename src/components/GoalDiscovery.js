import React, { useState } from 'react';
import { Card, SectionLabel, AppHeader } from './UI';

const QUESTIONS = [
  {
    id: 'situation',
    title: 'What best describes your situation?',
    subtitle: 'This helps us tailor the analysis to your needs.',
    options: [
      { value: 'owner-unsure', label: 'I own an STR and I\'m not sure what to do next' },
      { value: 'considering-selling', label: 'I\'m considering selling my property' },
      { value: 'maximize-income', label: 'I want to maximize my rental income' },
      { value: 'exploring-1031', label: 'I\'m exploring a 1031 exchange' },
      { value: 'evaluating-purchase', label: 'I\'m evaluating a new purchase' },
    ],
  },
  {
    id: 'priority',
    title: 'What\'s your biggest priority right now?',
    subtitle: 'Pick the one that matters most today.',
    options: [
      { value: 'cash-flow', label: 'Maximize cash flow' },
      { value: 'long-term-wealth', label: 'Build long-term wealth' },
      { value: 'reduce-taxes', label: 'Reduce my tax burden' },
      { value: 'simplify', label: 'Simplify — less management hassle' },
      { value: 'exit-redeploy', label: 'Exit and redeploy capital' },
    ],
  },
  {
    id: 'risk',
    title: 'How would you describe your risk tolerance?',
    subtitle: 'There\'s no wrong answer — this shapes our recommendations.',
    options: [
      { value: 'conservative', label: 'Conservative — protect what I have' },
      { value: 'moderate', label: 'Moderate — balanced growth' },
      { value: 'aggressive', label: 'Aggressive — maximize returns, accept volatility' },
    ],
  },
  {
    id: 'timeline',
    title: 'What\'s your timeline?',
    subtitle: 'When are you looking to take action?',
    options: [
      { value: 'no-rush', label: 'No rush — 3 to 5+ years' },
      { value: 'exploring', label: 'Exploring options — 1 to 2 years' },
      { value: 'ready', label: 'Ready to act — next 6 months' },
    ],
  },
  {
    id: 'experience',
    title: 'How many investment properties do you own?',
    subtitle: 'Helps us calibrate the level of detail.',
    options: [
      { value: 'first', label: 'This is my first' },
      { value: '2-3', label: '2 to 3 properties' },
      { value: '4-10', label: '4 to 10 properties' },
      { value: '10+', label: '10+ properties' },
    ],
  },
];

export default function GoalDiscovery({ onComplete, dark }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [otherText, setOtherText] = useState({});
  const [showOther, setShowOther] = useState({});

  const q = QUESTIONS[step];
  const currentAnswer = answers[q.id];
  const isOther = currentAnswer === 'other';
  const hasAnswer = currentAnswer && (currentAnswer !== 'other' || otherText[q.id]?.trim());

  const selectOption = (value) => {
    setAnswers({ ...answers, [q.id]: value });
    if (value !== 'other') {
      setShowOther({ ...showOther, [q.id]: false });
    }
  };

  const next = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Build final discovery data
      const discovery = {};
      QUESTIONS.forEach(question => {
        const ans = answers[question.id];
        if (ans === 'other') {
          discovery[question.id] = otherText[question.id] || '';
          discovery[question.id + '_type'] = 'custom';
          discovery[question.id + '_value'] = 'other';
        } else {
          const opt = question.options.find(o => o.value === ans);
          discovery[question.id] = opt ? opt.label : ans || '';
          discovery[question.id + '_type'] = 'preset';
          discovery[question.id + '_value'] = ans || '';
        }
      });
      onComplete(discovery);
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>
      <AppHeader dark={dark} />

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {QUESTIONS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= step ? 'var(--accent)' : 'var(--border-primary)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-faint)', fontFamily: "'JetBrains Mono',monospace" }}>
          {step + 1} of {QUESTIONS.length}
        </span>
      </div>

      <Card>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
          {q.title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          {q.subtitle}
        </p>

        {/* Option cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map(opt => (
            <div
              key={opt.value}
              onClick={() => selectOption(opt.value)}
              style={{
                padding: '16px 20px',
                borderRadius: 10,
                border: `2px solid ${currentAnswer === opt.value ? 'var(--accent)' : 'var(--border-primary)'}`,
                background: currentAnswer === opt.value ? 'var(--bg-subtle)' : 'var(--bg-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontSize: 15,
                fontWeight: currentAnswer === opt.value ? 700 : 500,
                color: currentAnswer === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {opt.label}
            </div>
          ))}

          {/* STRcalc recommendation for new purchase evaluators */}
          {q.id === 'situation' && currentAnswer === 'evaluating-purchase' && (
            <div style={{
              padding: '14px 18px', borderRadius: 10, marginTop: 4,
              background: 'rgba(154,120,32,0.08)', border: '1.5px solid rgba(154,120,32,0.2)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>
                Also check out STRcalc
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                For a deeper purchase analysis with 3-scenario modeling (worst/likely/best), cleaning economics, PM suite, and deal signal scoring, try our dedicated purchase tool at{' '}
                <a href="https://str-calc-sigma.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>STRcalc</a>.
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, margin: '6px 0 0' }}>
                PropertyPath will model this as a buy-and-hold vs. invest-elsewhere comparison.
              </p>
            </div>
          )}

          {/* Other option */}
          <div
            onClick={() => { selectOption('other'); setShowOther({ ...showOther, [q.id]: true }); }}
            style={{
              padding: '16px 20px',
              borderRadius: 10,
              border: `2px solid ${isOther ? 'var(--gold)' : 'var(--border-primary)'}`,
              background: isOther ? 'var(--bg-subtle)' : 'var(--bg-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontSize: 15,
              fontWeight: isOther ? 700 : 500,
              color: isOther ? 'var(--gold)' : 'var(--text-muted)',
            }}
          >
            Something else...
          </div>

          {/* Other text input - expands when selected */}
          {(isOther || showOther[q.id]) && (
            <textarea
              value={otherText[q.id] || ''}
              onChange={e => setOtherText({ ...otherText, [q.id]: e.target.value })}
              placeholder="Tell us in your own words..."
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 10,
                border: '1.5px solid var(--gold)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontFamily: "'Inter',sans-serif",
                lineHeight: 1.5,
                minHeight: 80,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          {step > 0 ? (
            <button onClick={prev} style={{
              padding: '12px 24px', borderRadius: 8,
              border: '1px solid var(--border-primary)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: 15, cursor: 'pointer',
            }}>Back</button>
          ) : <div />}
          <button
            onClick={next}
            disabled={!hasAnswer}
            style={{
              padding: '12px 32px', borderRadius: 8, border: 'none',
              background: hasAnswer ? 'var(--accent)' : 'var(--text-dim)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: hasAnswer ? 'pointer' : 'not-allowed',
            }}
          >
            {step === QUESTIONS.length - 1 ? 'Start Analysis' : 'Continue'}
          </button>
        </div>
      </Card>
    </div>
  );
}
