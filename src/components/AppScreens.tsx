import { useEffect, useState, memo } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Screen, NavBar, ScoreBar, Btn, Loading, Notice } from './ui';

// Individual Feedback row with real-time fetch
const AnalysisRow = memo(({ qa, reportRole }: { qa: any, reportRole: string }) => {
  const [analysisText, setAnalysisText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    if (analysisText || loading) return;
    setLoading(true);
    try {
      const res = await api.getExplanation(qa.question_text, qa.answer_text, qa.is_correct, reportRole);
      setAnalysisText(res.explanation);
    } catch {
      setAnalysisText('Failed to generate analysis.');
    }
    setLoading(false);
  };

  return (
    <div className="relative pl-6 border-l-2 border-black/5">
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${qa.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {qa.is_correct ? 'Pass' : 'Fail'}
        </span>
        <span className="text-[11px] text-black/30 font-bold">Question</span>
      </div>
      <p className="text-[17px] font-medium text-black mb-4 leading-snug">{qa.question_text}</p>
      
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-widest text-black/40 mb-1">Your Selection</p>
        <p className={`text-[15px] ${qa.is_correct ? 'text-black/70' : 'text-red-700'}`}>{qa.answer_text}</p>
      </div>

      <div className="mt-4">
        {!analysisText ? (
          <button 
            onClick={fetchAnalysis}
            disabled={loading}
            className="text-[12px] font-bold text-black/40 hover:text-black underline underline-offset-4 decoration-black/10 hover:decoration-black transition-all"
          >
            {loading ? 'Analyzing...' : 'Show AI Analysis +'}
          </button>
        ) : (
          <div className="animate-in fade-in duration-300">
            <p className="text-[11px] uppercase tracking-widest text-black/40 mb-1">Feedback</p>
            <p className="text-[14px] text-black/60 leading-relaxed italic border-l-2 border-black/10 pl-4 py-1">
              {analysisText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export function ReportScreen() {
  const { state, dispatch } = useApp();
  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });
  const report = state.lastReport;

  if (!report) {
    return (
      <Screen>
        <NavBar username={state.user?.username || ''} onNavigate={nav} onLogout={() => dispatch({ type: 'LOGOUT' })} />
        <div className="px-6 sm:px-10 pt-10">
          <Notice type="error">Report not found.</Notice>
          <div className="mt-4"><Btn onClick={() => nav('dashboard')}>← Dashboard</Btn></div>
        </div>
      </Screen>
    );
  }

  const accuracy = report.accuracy_pct ?? 0;
  const scoreColor = accuracy >= 70 ? 'text-black' : accuracy >= 50 ? 'text-black/70' : 'text-black/50';

  return (
    <Screen>
      <NavBar username={state.user?.username || ''} onNavigate={nav} onLogout={() => dispatch({ type: 'LOGOUT' })} />

      <div className="px-6 sm:px-10 pt-10 pb-16 max-w-3xl mx-auto w-full">
        {/* Percentage Score */}
        <div className="mb-2 flex items-baseline gap-2">
          <span
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(64px, 10vw, 100px)', letterSpacing: '-0.04em', lineHeight: 1 }}
            className={scoreColor}
          >
            {accuracy.toFixed(1)}
          </span>
          <span className="text-black/20 text-[32px] font-medium">/100%</span>
        </div>
        <p className="text-[14px] text-black/40 mb-10">
          {report.role} · {report.interview_type}
        </p>

        {/* Detailed Analysis Dropdown */}
        <details className="group border border-black/8 rounded-xl overflow-hidden mb-10">
          <summary className="flex items-center justify-between p-6 bg-black/2 cursor-pointer hover:bg-black/5 transition-colors list-none">
            <span className="text-[12px] uppercase tracking-widest text-black/40 font-bold">
              Detailed Question Analysis ({(report.qa_pairs || []).length})
            </span>
            <span className="text-black/20 group-open:rotate-180 transition-transform">↓</span>
          </summary>
          
          <div className="p-6 flex flex-col gap-10 bg-white border-t border-black/5">
            {(report.qa_pairs || []).map((qa: any, i: number) => (
              <AnalysisRow key={i} qa={qa} reportRole={report.role} />
            ))}
          </div>
        </details>

        <div className="flex gap-3 flex-wrap pt-6 border-t border-black/5">
          <Btn onClick={() => nav('interview_setup')}>New Interview</Btn>
          <Btn onClick={() => nav('dashboard')} variant="white">Dashboard</Btn>
        </div>
      </div>
    </Screen>
  );
}

export function HistoryScreen() {
  const { state, dispatch } = useApp();
  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) return;
    api.getHistory(state.user.user_id).then(res => {
      setInterviews(res.interviews || []);
      setLoading(false);
    });
  }, [state.user]);

  const openReport = async (iv: any) => {
    const res = await api.getReportByInterview(iv.id);
    if (!res.error) {
      dispatch({ type: 'SET_REPORT', report: res });
    }
  };

  return (
    <Screen>
      <NavBar username={state.user?.username || ''} onNavigate={nav} onLogout={() => dispatch({ type: 'LOGOUT' })} />
      <div className="px-6 sm:px-10 pt-10 pb-16 max-w-3xl mx-auto w-full">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-1">
          History.
        </div>
        <p className="text-[14px] text-black/40 mb-10">Review your past performance.</p>

        {loading ? <Loading /> : interviews.length === 0 ? (
          <p className="text-[14px] text-black/30">No completed interviews yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {interviews.map((iv) => (
              <div key={iv.id} className="border border-black/8 p-5 flex items-center justify-between hover:border-black/30 transition-colors cursor-pointer rounded-xl" onClick={() => openReport(iv)}>
                <div>
                  <div className="text-[16px] font-medium text-black">{iv.role}</div>
                  <div className="text-[12px] text-black/40 mt-1">{iv.interview_type} · {iv.completed_at?.slice(0,10)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px' }}>
                    {(iv.overall_score || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}

export function AnalyticsScreen() {
  const { state, dispatch } = useApp();
  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) return;
    api.getAnalytics(state.user.user_id).then(res => { setData(res); setLoading(false); });
  }, [state.user]);

  const trend = data?.trend || [];

  return (
    <Screen>
      <NavBar username={state.user?.username || ''} onNavigate={nav} onLogout={() => dispatch({ type: 'LOGOUT' })} />
      <div className="px-6 sm:px-10 pt-10 pb-16 max-w-4xl mx-auto w-full">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-1">
          Analytics.
        </div>
        <p className="text-[14px] text-black/40 mb-10">Track your improvement over time.</p>

        {loading ? <Loading /> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
              <Metric label="Interviews" value={data?.total_interviews ?? 0} />
              <Metric label="Avg Score" value={`${Number(data?.avg_score ?? 0).toFixed(2)}%`} />
              <Metric label="Best" value={`${Number(data?.best_score ?? 0).toFixed(2)}%`} />
              <Metric label="Worst" value={`${Number(data?.worst_score ?? 0).toFixed(2)}%`} />
            </div>

            {trend.length > 0 && (
              <div className="mb-12">
                <p className="text-[11px] uppercase tracking-widest text-black/30 mb-5">Score Trend</p>
                <div className="flex flex-col gap-2">
                  {trend.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-[12px] text-black/30 w-6">#{i+1}</span>
                      <span className="text-[13px] text-black/50 flex-1">{t.role}</span>
                      <span className="text-[12px] text-black/30">{t.completed_at?.slice(0,10)}</span>
                      <div className="w-32 h-[3px] bg-black/8 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${(t.overall_score || 0)}%` }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px' }} className="w-16 text-right">
                        {(t.overall_score || 0).toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data?.skill_performance && Object.keys(data.skill_performance).length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-black/30 mb-5">Category Accuracy</p>
                <div className="max-w-md">
                  {Object.entries(data.skill_performance).map(([label, value]: [string, any]) => (
                    <div key={label} className="mb-4">
                      <div className="flex justify-between text-[13px] mb-1.5">
                        <span className="text-black/60">{label}</span>
                        <span className="font-medium text-black">{Number(value).toFixed(2)}%</span>
                      </div>
                      <div className="h-[3px] bg-black/8 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}

export function RecommendationsScreen() {
  const { state, dispatch } = useApp();
  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });
  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) return;
    api.getRecommendations(state.user.user_id).then(res => { setRec(res); setLoading(false); });
  }, [state.user]);

  return (
    <Screen>
      <NavBar username={state.user?.username || ''} onNavigate={nav} onLogout={() => dispatch({ type: 'LOGOUT' })} />
      <div className="px-6 sm:px-10 pt-10 pb-16 max-w-3xl mx-auto w-full">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-1">
          Learning Plan.
        </div>
        <p className="text-[14px] text-black/40 mb-10">Personalized to your interview performance.</p>

        {loading ? <Loading text="Generating your plan…" /> : !rec ? (
          <Notice type="info">Complete an interview to get personalized recommendations.</Notice>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-black/30 mb-4">Topics to Study</p>
              <div className="flex flex-col gap-2">
                {(rec.topics || []).map((t: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-black/20 mt-0.5">—</span>
                    <span className="text-[14px] text-black/70">{t}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] uppercase tracking-widest text-black/30 mb-4 mt-8">Resources</p>
              <div className="flex flex-col gap-2">
                {(rec.resources || []).map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-black/20 mt-0.5">—</span>
                    <span className="text-[14px] text-black/70">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-widest text-black/30 mb-4">Practice Questions</p>
              <div className="flex flex-col gap-4">
                {(rec.practice_qs || []).map((q: string, i: number) => (
                  <div key={i} className="border-l border-black/10 pl-4">
                    <p className="text-[14px] text-black/70 leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            {rec.weekly_plan && (
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase tracking-widest text-black/30 mb-4">4-Week Plan</p>
                <div className="border-l-2 border-black pl-5">
                  <p className="text-[14px] text-black/70 leading-relaxed whitespace-pre-line">{rec.weekly_plan}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Screen>
  );
}

export function ProfileScreen() {
  const { state, dispatch } = useApp();
  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) return;
    api.getProfile(state.user.user_id).then(res => {
      setProfile(res);
      setFullName(res.full_name || '');
      setEmail(res.email || '');
      setLoading(false);
    });
  }, [state.user]);

  const handleSave = async () => {
    if (!state.user) return;
    await api.updateProfile(state.user.user_id, fullName, email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Screen>
      <NavBar username={state.user?.username || ''} onNavigate={nav} onLogout={() => dispatch({ type: 'LOGOUT' })} />
      <div className="px-6 sm:px-10 pt-10 pb-16 max-w-3xl mx-auto w-full">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-1">
          Profile.
        </div>
        <p className="text-[14px] text-black/40 mb-10">@{state.user?.username}</p>

        {loading ? <Loading /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-black/30 mb-6">Edit Profile</p>
              <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-black/50">Full Name</label>
                  <input
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    className="border-b border-black/20 focus:border-black outline-none py-2 text-[16px] bg-transparent text-black transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] uppercase tracking-widest text-black/50">Email</label>
                  <input
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="border-b border-black/20 focus:border-black outline-none py-2 text-[16px] bg-transparent text-black transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                </div>
              </div>
              <Btn onClick={handleSave}>{saved ? 'Saved ✓' : 'Save Changes'}</Btn>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-widest text-black/30 mb-6">Stats</p>
              <div className="flex flex-col gap-3">
                <Metric label="Total Interviews" value={profile?.total_interviews ?? 0} />
                <Metric label="Average Accuracy" value={`${(profile?.avg_score || 0).toFixed(2)}%`} />
              </div>
              <p className="text-[12px] text-black/30 mt-5">Member since {profile?.created_at?.slice(0,10)}</p>
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-black/8 p-4 rounded-xl">
      <div className="text-[11px] uppercase tracking-widest text-black/40 mb-1">{label}</div>
      <div className="text-[28px] font-medium text-black leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </div>
    </div>
  );
}
