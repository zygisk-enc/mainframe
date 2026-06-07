import { AppProvider, useApp } from './store';
import { VideoBackground } from './components/VideoBackground';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LoginScreen, RegisterScreen } from './components/AuthScreens';
import { DashboardScreen } from './components/DashboardScreen';
import { InterviewSetupScreen, InterviewSessionScreen } from './components/InterviewScreens';
import { ReportScreen, HistoryScreen, AnalyticsScreen, RecommendationsScreen, ProfileScreen } from './components/AppScreens';

function AppRouter() {
  const { state } = useApp();
  const { screen } = state;

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
