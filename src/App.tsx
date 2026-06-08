import { useEffect } from 'react';
import { AppProvider, useApp, type Screen } from './store';
import { VideoBackground } from './components/VideoBackground';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LoginScreen, RegisterScreen } from './components/AuthScreens';
import { DashboardScreen } from './components/DashboardScreen';
import { InterviewSetupScreen, InterviewSessionScreen } from './components/InterviewScreens';
import { ReportScreen, HistoryScreen, AnalyticsScreen, RecommendationsScreen, ProfileScreen } from './components/AppScreens';

function AppRouter() {
  const { state, dispatch } = useApp();
  const { screen, user } = state;

  // ── History Sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Initial sync: if no history state exists, set the current screen
    if (!window.history.state) {
      window.history.replaceState({ screen }, '', '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        dispatch({ type: 'SET_SCREEN', screen: event.state.screen });
      } else {
        // Fallback if no history state is found
        dispatch({ type: 'SET_SCREEN', screen: user ? 'dashboard' : 'hero' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dispatch, user]);

  useEffect(() => {
    // Push new state to history when screen changes (unless it matches current state)
    if (window.history.state?.screen !== screen) {
      window.history.pushState({ screen }, '', '');
    }
  }, [screen]);

  // ── Auth Guards ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      // If logged in, prevent access to landing/auth screens
      if (['hero', 'login', 'register'].includes(screen)) {
        dispatch({ type: 'SET_SCREEN', screen: 'dashboard' });
      }
    } else {
      // If not logged in, prevent access to protected app screens
      const protectedScreens: Screen[] = [
        'dashboard',
        'interview_setup',
        'interview_session',
        'report',
        'history',
        'analytics',
        'recommendations',
        'profile',
      ];
      if (protectedScreens.includes(screen)) {
        dispatch({ type: 'SET_SCREEN', screen: 'login' });
      }
    }
  }, [user, screen, dispatch]);

  // ── Auth screens ──────────────────────────────────────────────────────────
  if (screen === 'login') return <LoginScreen />;
  if (screen === 'register') return <RegisterScreen />;

  // ── App screens (require login) ────────────────────────────────────────────
  if (screen === 'dashboard') return <DashboardScreen />;
  if (screen === 'interview_setup') return <InterviewSetupScreen />;
  if (screen === 'interview_session') return <InterviewSessionScreen />;
  if (screen === 'report') return <ReportScreen />;
  if (screen === 'history') return <HistoryScreen />;
  if (screen === 'analytics') return <AnalyticsScreen />;
  if (screen === 'recommendations') return <RecommendationsScreen />;
  if (screen === 'profile') return <ProfileScreen />;

  // ── Hero (default) ─────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-white">
      <VideoBackground />
      <Navbar />
      <Hero />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
