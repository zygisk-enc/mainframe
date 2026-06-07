import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../api';
import { Screen, NavBar, Metric, Card, Btn, Loading } from './ui';

export function DashboardScreen() {
  const { state, dispatch } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const nav = (screen: any) => dispatch({ type: 'SET_SCREEN', screen });

  useEffect(() => {
    if (!state.user) return;
    Promise.all([
      api.getAnalytics(state.user.user_id),
      api.getHistory(state.user.user_id),
    ]).then(([analytics, history]) => {
      setStats(analytics);
      setRecent((history.interviews || []).slice(0, 3));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [state.user]);

  const name = (state.user?.full_name || state.user?.username || '').split(' ')[0];

  return (
    <Screen>
      <NavBar
        username={state.user?.username || ''}
        onNavigate={nav}
        onLogout={() => dispatch({ type: 'LOGOUT' })}
      />

      <div className="px-5 sm:px-10 pt-10 pb-16 max-w-4xl mx-auto w-full">
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.05 }} className="mb-1">
          Hey, {name}.
        </div>
        <p className="text-[14px] text-black/40 mb-10">Ready to practice? Here's your overview.</p>

        {loading ? <Loading /> : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
              <Metric label="Interviews" value={stats?.total_interviews ?? 0} />
              <Metric label="Avg Accuracy" value={`${Number(stats?.avg_score ?? 0).toFixed(2)}%`} />
              <Metric label="Best Session" value={`${Number(stats?.best_score ?? 0).toFixed(2)}%`} />
              <Metric label="Latest Result" value={`${Number(stats?.trend?.[stats.trend.length - 1]?.overall_score ?? 0).toFixed(2)}%`} />
            </div>

            {/* Actions */}
            <div className="mb-12">
              <p className="text-[11px] uppercase tracking-widest text-black/30 mb-4">Quick Actions</p>
              <div className="flex flex-wrap gap-3">
                <Btn onClick={() => nav('interview_setup')}>🎤 Start Interview</Btn>
                <Btn onClick={() => nav('history')} variant="white">📋 View History</Btn>
                <Btn onClick={() => nav('analytics')} variant="white">📊 Analytics</Btn>
                <Btn onClick={() => nav('recommendations')} variant="white">💡 Learning Plan</Btn>
              </div>
            </div>

            {/* Recent */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-black/30 mb-4">Recent Interviews</p>
              {recent.length === 0 ? (
                <p className="text-[14px] text-black/30">No interviews yet. Start your first one above.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recent.map((iv) => (
                    <Card key={iv.id} className="flex items-center justify-between cursor-pointer hover:border-black/30 transition-colors">
                      <div>
                        <div className="text-[15px] font-medium text-black">{iv.role}</div>
                        <div className="text-[12px] text-black/40 mt-0.5">{iv.interview_type} · {iv.difficulty} · {iv.completed_at?.slice(0,10) || '—'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[18px] font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                          {iv.overall_score ? `${Number(iv.overall_score).toFixed(2)}%` : '—'}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
