/**
 * api.ts — calls Flask backend at localhost:8501
 * Uses simple POST requests with JSON body — no CORS issues.
 */

const BASE = 'http://localhost:8501';

async function post(endpoint: string, body: Record<string, any> = {}): Promise<any> {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    post('login', { username, password }),

  register: (username: string, email: string, password: string, full_name: string) =>
    post('register', { username, email, password, full_name }),

  getQuestions: (user_id: number, role: string, interview_type: string,
                  difficulty: string, count: number) =>
    post('get_questions', { user_id, role, interview_type, difficulty, count }),

  evaluate: (question_id: number, interview_id: number, answer: string, is_correct: boolean,
              question: string, role: string, interview_type: string, difficulty: string) =>
    post('evaluate', { question_id, interview_id, answer, is_correct, question, role, interview_type, difficulty }),

  getReport: (interview_id: number, user_id: number) =>
    post('get_report', { interview_id, user_id }),

  getReportByInterview: (interview_id: number) =>
    post('get_report_by_interview', { interview_id }),

  getExplanation: (question: string, answer: string, is_correct: boolean, role: string) =>
    post('get_explanation', { question, answer, is_correct, role }),

  getHistory: (user_id: number) =>
    post('get_history', { user_id }),

  getAnalytics: (user_id: number) =>
    post('get_analytics', { user_id }),

  getRecommendations: (user_id: number) =>
    post('get_recommendations', { user_id }),

  getProfile: (user_id: number) =>
    post('get_profile', { user_id }),

  updateProfile: (user_id: number, full_name: string, email: string) =>
    post('update_profile', { user_id, full_name, email }),
};
