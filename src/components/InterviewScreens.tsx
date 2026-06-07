import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Screen, NavBar, Select, Btn, Loading, Notice, Card } from './ui';

const ROLES = [
  'Python Developer', 'AI Engineer', 'Data Scientist', 'Cybersecurity Analyst', 
  'Full Stack Developer', 'Cloud Architect', 'DevOps Engineer', 'Mobile App Developer',
  'UI/UX Designer', 'Product Manager', 'Data Analyst', 'Blockchain Developer',
  'Embedded Systems Engineer', 'Game Developer', 'Sales Executive', 'Marketing Manager',
  'Financial Analyst', 'HR Manager', 'Customer Success', 'Legal Consultant', 
  'Operations Manager', 'Project Manager', 'Custom Role'
];
const TYPES = ['HR Interview', 'Technical Interview', 'Situational Interview'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// ── SETUP ──────────────────────────────────────────────────────────────────

export function InterviewSetupScreen() {
  const { state, dispatch } = useApp();
  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });

  const [role, setRole] = useState('Full Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [itype, setItype] = useState('Technical Interview');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [count, setCount] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!state.user) return;
    setLoading(true); setError('');
    try {
      const finalRole = role === 'Custom Role' ? customRole : role;
      const res = await api.getQuestions(
        state.user.user_id, finalRole, itype, difficulty, parseInt(count)
      );
      if (res.error) { setError(res.error); setLoading(false); return; }
      dispatch({
        type: 'START_INTERVIEW',
        interviewId: res.interview_id,
        questions: res.questions,
        role: finalRole,
        itype,
        difficulty,
      });
    } catch {
      setError('Failed to generate questions. Check API connection.');
      setLoading(false);
    }
  };

  return (
    <Screen>
      <NavBar username={state.user?.username || ''} onNavigate={nav} onLogout={() => dispatch({ type: 'LOGOUT' })} />

      <div className="px-5 sm:px-10 pt-10 pb-16 max-w-2xl mx-auto w-full">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-1">
          New Interview.
        </div>
        <p className="text-[14px] text-black/40 mb-10">Configure your session below.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
          <Select label="Role" value={role} onChange={setRole} options={ROLES} />
          {role === 'Custom Role' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-widest text-black/50">Custom Role</label>
              <input
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="e.g. DevOps Engineer"
                className="border-b border-black/20 focus:border-black outline-none py-2 text-[16px] bg-transparent text-black placeholder:text-black/25 transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
          )}
          <Select label="Interview Type" value={itype} onChange={setItype} options={TYPES} />
          <Select label="Starting Difficulty" value={difficulty} onChange={setDifficulty} options={LEVELS} />
          <Select label="Number of Questions" value={count} onChange={setCount} options={['3','5','10','15','20','25']} />
        </div>

        {/* Interview type description */}
        <Card className="mb-8 bg-black/2">
          <p className="text-[12px] uppercase tracking-widest text-black/30 mb-1">{itype}</p>
          <p className="text-[14px] text-black/60 leading-relaxed">
            {itype === 'HR Interview' && 'Behavioral questions: tell me about yourself, strengths, career goals, culture fit.'}
            {itype === 'Technical Interview' && 'Concepts, coding principles, system design, data structures, role-specific technology.'}
            {itype === 'Situational Interview' && 'Hypothetical scenarios: conflicts, deadlines, team dynamics, ethical dilemmas.'}
          </p>
        </Card>

        {error && <Notice type="error" children={error} />}

        <Btn onClick={handleStart} disabled={loading} fullWidth>
          {loading ? 'Generating questions…' : `Start ${itype} →`}
        </Btn>
      </div>
    </Screen>
  );
}

// ── SESSION ────────────────────────────────────────────────────────────────

export function InterviewSessionScreen() {
  const { state, dispatch } = useApp();
  const { questions, answers, currentQIndex, interviewId, interviewRole, interviewType, currentDifficulty } = state;
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const total = questions.length;
  const currentQ = questions[currentQIndex];
  const isLast = currentQIndex === total - 1;
  const userId = state.user?.user_id ?? 0;

  useEffect(() => {
    setSelectedIndex(null);
    setFeedback(null);
    setShowFeedback(false);
  }, [currentQIndex]);

  const handleSelect = async (index: number) => {
    if (loading || showFeedback) return;
    setSelectedIndex(index);
    setLoading(true);

    const isCorrect = index === currentQ.correct_index;
    const selectedAnswer = currentQ.options[index];

    try {
      const ev = await api.evaluate(
        currentQ.id, interviewId!, selectedAnswer, isCorrect,
        currentQ.question, interviewRole, interviewType, currentDifficulty
      );
      dispatch({ type: 'SUBMIT_ANSWER', answer: selectedAnswer, evaluation: ev });
      if (ev.new_difficulty && ev.new_difficulty !== currentDifficulty) {
        dispatch({ type: 'SET_DIFFICULTY', difficulty: ev.new_difficulty });
      }
      setFeedback(ev);
      setShowFeedback(true);
    } catch {
      setFeedback({ error: true });
      setShowFeedback(true);
    }
    setLoading(false);
  };

  const handleNext = async () => {
    if (isLast) {
      setLoading(true);
      try {
        const report = await api.getReport(interviewId!, userId);
        dispatch({ type: 'SET_REPORT', report });
      } catch {
        dispatch({ type: 'SET_SCREEN', screen: 'dashboard' });
      }
      setLoading(false);
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  if (!currentQ) return <Loading text="Loading question…" />;

  const progress = ((currentQIndex) / total) * 100;

  return (
    <Screen className="bg-white">
      {/* Top bar */}
      <div className="border-b border-black/8 px-6 sm:px-10 py-4 flex items-center justify-between">
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', letterSpacing: '-0.02em' }}>
          Mainframe®
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-black/40 uppercase tracking-widest">
            {interviewRole} · {currentDifficulty}
          </span>
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'dashboard' })}
            className="text-[12px] text-black/30 hover:text-black transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-black/5">
        <div
          className="h-full bg-black transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-5 sm:px-10 py-10">
        {/* Question counter */}
        <div className="text-[11px] uppercase tracking-widest text-black/30 mb-6">
          Question {currentQIndex + 1} of {total}
        </div>

        {/* Question */}
        <div
          className="mb-10"
          style={{
            fontSize: 'clamp(20px, 3.5vw, 28px)',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-heading)',
            color: '#000',
          }}
        >
          {currentQ.question}
        </div>

        {/* MCQ Options */}
        <div className="grid grid-cols-1 gap-4 mb-10">
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedIndex === i;
            const isCorrect = i === currentQ.correct_index;
            const showResult = showFeedback;
            
            let borderColor = 'border-black/10';
            let bgColor = 'bg-white';
            let textColor = 'text-black';

            if (showResult) {
              if (isCorrect) {
                borderColor = 'border-green-500';
                bgColor = 'bg-green-50';
                textColor = 'text-green-700';
              } else if (isSelected && !isCorrect) {
                borderColor = 'border-red-500';
                bgColor = 'bg-red-50';
                textColor = 'text-red-700';
              } else {
                borderColor = 'border-black/5';
                textColor = 'text-black/30';
              }
            } else if (isSelected) {
              borderColor = 'border-black';
              bgColor = 'bg-black/5';
            }

            return (
              <button
                key={i}
                disabled={showFeedback || loading}
                onClick={() => handleSelect(i)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${borderColor} ${bgColor} ${textColor} ${!showFeedback && 'hover:border-black active:scale-[0.99]'}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold border ${showResult ? (isCorrect ? 'bg-green-500 border-green-500 text-white' : isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-black/10') : 'border-black/10'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-[16px] font-medium leading-tight">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback & Navigation */}
        {showFeedback && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 rounded-xl border mb-8 ${selectedIndex === currentQ.correct_index ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1.5 rounded-full ${selectedIndex === currentQ.correct_index ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {selectedIndex === currentQ.correct_index ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  )}
                </div>
                <div>
                  <h4 className={`text-[15px] font-bold mb-1 ${selectedIndex === currentQ.correct_index ? 'text-green-800' : 'text-red-800'}`}>
                    {selectedIndex === currentQ.correct_index ? 'Correct Answer' : 'Incorrect Answer'}
                  </h4>
                  <p className="text-[14px] leading-relaxed text-black/60">
                    {feedback.feedback}
                  </p>
                </div>
              </div>
            </div>

            <Btn onClick={handleNext} disabled={loading} fullWidth>
              {loading ? 'Processing…' : isLast ? 'Finish Interview' : 'Next Question →'}
            </Btn>
          </div>
        )}
      </div>
    </Screen>
  );
}
