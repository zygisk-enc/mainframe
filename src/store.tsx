/**
 * store.ts — simple global state using React context + useReducer.
 * No external libraries needed.
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';

export type Screen =
  | 'hero'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'interview_setup'
  | 'interview_session'
  | 'report'
  | 'history'
  | 'analytics'
  | 'recommendations'
  | 'profile';

export interface User {
  user_id: number;
  username: string;
  full_name: string;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  category: string;
  difficulty: string;
}

export interface AppState {
  screen: Screen;
  user: User | null;
  // Interview session
  interviewId: number | null;
  questions: Question[];
  answers: { question: string; answer: string; evaluation: any }[];
  currentQIndex: number;
  currentDifficulty: string;
  interviewRole: string;
  interviewType: string;
  // Report
  lastReport: any | null;
  // History selected
  selectedInterviewId: number | null;
}

type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'START_INTERVIEW'; interviewId: number; questions: Question[]; role: string; itype: string; difficulty: string }
  | { type: 'SUBMIT_ANSWER'; answer: string; evaluation: any }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SET_DIFFICULTY'; difficulty: string }
  | { type: 'SET_REPORT'; report: any }
  | { type: 'SET_SELECTED_INTERVIEW'; id: number };

// Initial state
const savedUser = localStorage.getItem('mf_user');
const initialUser = savedUser ? JSON.parse(savedUser) : null;

const initial: AppState = {
  screen: 'hero',
  user: initialUser,
  interviewId: null,
  questions: [],
  answers: [],
  currentQIndex: 0,
  currentDifficulty: 'Intermediate',
  interviewRole: '',
  interviewType: '',
  lastReport: null,
  selectedInterviewId: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    case 'LOGIN':
      localStorage.setItem('mf_user', JSON.stringify(action.user));
      return { ...state, user: action.user, screen: 'dashboard' };

    case 'LOGOUT':
      localStorage.removeItem('mf_user');
      return { ...initial, user: null, screen: 'hero' };

    case 'START_INTERVIEW':
      return {
        ...state,
        screen: 'interview_session',
        interviewId: action.interviewId,
        questions: action.questions,
        answers: [],
        currentQIndex: 0,
        interviewRole: action.role,
        interviewType: action.itype,
        currentDifficulty: action.difficulty,
      };

    case 'SUBMIT_ANSWER': {
      const q = state.questions[state.currentQIndex];
      return {
        ...state,
        answers: [...state.answers, {
          question: q.question,
          answer: action.answer,
          evaluation: action.evaluation,
        }],
      };
    }

    case 'NEXT_QUESTION':
      return { ...state, currentQIndex: state.currentQIndex + 1 };

    case 'SET_DIFFICULTY':
      return { ...state, currentDifficulty: action.difficulty };

    case 'SET_REPORT':
      return { ...state, lastReport: action.report, screen: 'report' };

    case 'SET_SELECTED_INTERVIEW':
      return { ...state, selectedInterviewId: action.id };

    default:
      return state;
  }
}

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
