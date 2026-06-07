import os
import sqlite3
import json
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
DB_PATH = 'mainframe.db'
PORT = 8501

# Initialize Gemini
gemini_ready = False
if os.getenv("GEMINI_API_KEY"):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-3.1-flash-lite')
        gemini_ready = True
        print("Gemini initialized successfully with model: gemini-3.1-flash-lite")
    except Exception as e:
        print(f"Gemini Init Error: {e}")

# --- DATABASE SETUP ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT, full_name TEXT)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS interviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, role TEXT, interview_type TEXT, difficulty TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY AUTOINCREMENT, interview_id INTEGER, question_text TEXT, options_json TEXT, correct_option_index INTEGER, category TEXT, difficulty TEXT)''')
        conn.execute('''CREATE TABLE IF NOT EXISTS evaluations (id INTEGER PRIMARY KEY AUTOINCREMENT, interview_id INTEGER, question_id INTEGER, answer TEXT, is_correct INTEGER, score INTEGER, feedback TEXT, new_difficulty TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        conn.commit()

init_db()

# --- HELPER: AI LOGIC ---
def ai_generate_questions(role, interview_type, difficulty, count):
    if not gemini_ready:
        return [{"question": f"Question {i+1} for {role}", "options": ["A","B","C","D"], "correct_index": 0, "category": "General", "difficulty": difficulty} for i in range(count)]
    prompt = (f"Generate exactly {count} unique multiple-choice interview questions for a {role} applying for a {interview_type} at {difficulty} level. Each question must have 4 options. Return ONLY a JSON object with key 'questions' containing list of objects with keys: 'question', 'options' (4 strings), 'correct_index' (0-3), 'category', 'difficulty'.")
    try:
        response = model.generate_content(prompt)
        data = json.loads(response.text.replace('```json', '').replace('```', '').strip())
        return data.get('questions', data) 
    except:
        return [{"question": "What is the difference between a process and a thread?", "options": ["Memory sharing", "Speed", "Security", "Network"], "correct_index": 0, "category": "Fundamentals", "difficulty": difficulty}]

# --- ENDPOINTS ---

@app.route('/')
def health_check(): return jsonify({"status": "Mainframe Backend Live", "ai_ready": gemini_ready})

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    try:
        with get_db() as conn:
            cur = conn.execute('INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)', (data['username'], data['email'], data['password'], data['full_name']))
            user_id = cur.lastrowid
            conn.commit()
        return jsonify({"success": True, "user_id": user_id, "username": data['username'], "full_name": data['full_name']})
    except: return jsonify({"success": False, "message": "User exists"}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    with get_db() as conn:
        user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', (data['username'], data['password'])).fetchone()
    if user: return jsonify({"success": True, "user_id": user['id'], "username": user['username'], "full_name": user['full_name']})
    return jsonify({"success": False, "message": "Invalid"}), 401

@app.route('/get_questions', methods=['POST'])
def get_questions():
    data = request.json
    with get_db() as conn:
        cur = conn.execute('INSERT INTO interviews (user_id, role, interview_type, difficulty) VALUES (?, ?, ?, ?)', (data['user_id'], data['role'], data['interview_type'], data['difficulty']))
        interview_id = cur.lastrowid
        qs = ai_generate_questions(data['role'], data['interview_type'], data['difficulty'], data['count'])
        for q in qs:
            conn.execute('INSERT INTO questions (interview_id, question_text, options_json, correct_option_index, category, difficulty) VALUES (?, ?, ?, ?, ?, ?)', (interview_id, q['question'], json.dumps(q['options']), q['correct_index'], q['category'], q['difficulty']))
        conn.commit()
    # Refetch to get IDs
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM questions WHERE interview_id = ?', (interview_id,)).fetchall()
        saved = [{"id": r['id'], "question": r['question_text'], "options": json.loads(r['options_json']), "correct_index": r['correct_option_index'], "category": r['category'], "difficulty": r['difficulty']} for r in rows]
    return jsonify({"interview_id": interview_id, "questions": saved})

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.json
    is_correct = 1 if data.get('is_correct') else 0
    with get_db() as conn:
        conn.execute('INSERT INTO evaluations (interview_id, question_id, answer, is_correct, score, feedback, new_difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)', (data['interview_id'], data['question_id'], data['answer'], is_correct, 100 if is_correct else 0, "", data.get('difficulty', 'Intermediate')))
        conn.commit()
    return jsonify({"success": True})

@app.route('/get_explanation', methods=['POST'])
def get_explanation():
    data = request.json
    if not gemini_ready: return jsonify({"explanation": "AI offline."})
    prompt = f"Explain why the answer '{data['answer']}' is {'correct' if data['is_correct'] else 'incorrect'} for the question: '{data['question']}' (Role: {data['role']}). Concise 2 sentences."
    try:
        res = model.generate_content(prompt)
        return jsonify({"explanation": res.text.strip()})
    except: return jsonify({"explanation": "Could not generate analysis."})

def get_report_data(interview_id):
    with get_db() as conn:
        evs = conn.execute('SELECT * FROM evaluations WHERE interview_id = ?', (interview_id,)).fetchall()
        interview = conn.execute('SELECT * FROM interviews WHERE id = ?', (interview_id,)).fetchone()
        questions = conn.execute('SELECT * FROM questions WHERE interview_id = ?', (interview_id,)).fetchall()
    if not interview: return None
    correct = sum([e['is_correct'] for e in evs])
    total = len(evs)
    acc = (correct / total * 100) if total > 0 else 0
    return {
        "role": interview['role'], "interview_type": interview['interview_type'], "accuracy_pct": acc,
        "qa_pairs": [{"question_text": q['question_text'], "answer_text": e['answer'], "is_correct": bool(e['is_correct'])} for q, e in zip(questions, evs)]
    }

@app.route('/get_report', methods=['POST'])
def get_report():
    return jsonify(get_report_data(request.json['interview_id']))

@app.route('/get_report_by_interview', methods=['POST'])
def get_report_by_interview():
    return jsonify(get_report_data(request.json['interview_id']))

@app.route('/get_history', methods=['POST'])
def get_history():
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM interviews WHERE user_id = ? ORDER BY timestamp DESC', (request.json['user_id'],)).fetchall()
        res = []
        for r in rows:
            d = dict(r)
            evs = conn.execute('SELECT is_correct FROM evaluations WHERE interview_id = ?', (r['id'],)).fetchall()
            d['overall_score'] = (sum([e['is_correct'] for e in evs]) / len(evs) * 100) if evs else 0
            d['completed_at'] = r['timestamp']
            res.append(d)
    return jsonify({"interviews": res})

@app.route('/get_analytics', methods=['POST'])
def get_analytics():
    user_id = request.json['user_id']
    with get_db() as conn:
        interviews = conn.execute('SELECT id, role, timestamp FROM interviews WHERE user_id = ?', (user_id,)).fetchall()
        if not interviews: return jsonify({"total_interviews": 0, "avg_score": 0, "best_score": 0, "worst_score": 0, "trend": [], "skill_performance": {}})
        trend = []; all_scores = []
        for iv in interviews:
            evs = conn.execute('SELECT is_correct FROM evaluations WHERE interview_id = ?', (iv['id'],)).fetchall()
            if evs:
                avg = (sum([e['is_correct'] for e in evs]) / len(evs)) * 100
                all_scores.append(avg)
                trend.append({"id": iv['id'], "role": iv['role'], "completed_at": iv['timestamp'], "overall_score": avg})
        cats = conn.execute('SELECT q.category, AVG(e.is_correct) * 100 as avg FROM evaluations e JOIN questions q ON e.question_id = q.id JOIN interviews i ON e.interview_id = i.id WHERE i.user_id = ? GROUP BY q.category', (user_id,)).fetchall()
        skills = {c['category']: c['avg'] for c in cats}
    return jsonify({"total_interviews": len(interviews), "avg_score": sum(all_scores)/len(all_scores) if all_scores else 0, "best_score": max(all_scores) if all_scores else 0, "worst_score": min(all_scores) if all_scores else 0, "trend": trend[-5:], "skill_performance": skills})

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    user_id = request.json['user_id']
    with get_db() as conn:
        evs = conn.execute('SELECT e.is_correct, q.question_text, q.category FROM evaluations e JOIN questions q ON e.question_id = q.id JOIN interviews i ON e.interview_id = i.id WHERE i.user_id = ? ORDER BY i.timestamp DESC LIMIT 20', (user_id,)).fetchall()
    if not evs: return jsonify({"topics": ["Start practicing!"], "resources": ["Docs"], "practice_qs": ["What is coding?"], "weekly_plan": "Step 1: Start."})
    if gemini_ready:
        try:
            res = model.generate_content(f"Analyze these results: {json.dumps([dict(e) for e in evs])}. Return JSON: topics (list), resources (list), practice_qs (list), weekly_plan (string).")
            return jsonify(json.loads(res.text.replace('```json', '').replace('```', '').strip()))
        except: pass
    return jsonify({"topics": ["Fundamentals"], "resources": ["Tutorials"], "practice_qs": ["Explain logic."], "weekly_plan": "Week 1: Logic."})

@app.route('/get_profile', methods=['POST'])
def get_profile():
    with get_db() as conn:
        user = conn.execute('SELECT * FROM users WHERE id = ?', (request.json['user_id'],)).fetchone()
        stats = conn.execute('SELECT COUNT(id) as count FROM interviews WHERE user_id = ?', (request.json['user_id'],)).fetchone()
    return jsonify({**dict(user), "total_interviews": stats['count']})

@app.route('/update_profile', methods=['POST'])
def update_profile():
    with get_db() as conn:
        conn.execute('UPDATE users SET full_name = ?, email = ? WHERE id = ?', (request.json['full_name'], request.json['email'], request.json['user_id']))
        conn.commit()
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=PORT)
