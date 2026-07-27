import os
import json
import sqlite3
import requests
import xml.etree.ElementTree as ET
from datetime import datetime

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from groq import Groq
import PyPDF2

load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-me')
CORS(app)

IMAGES_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'images')
os.makedirs(IMAGES_FOLDER, exist_ok=True)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ai_client = Groq(
    api_key=os.getenv('GROQ_API_KEY', '')
)
AI_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')

DATABASE = os.path.join(os.path.dirname(__file__), 'database.db')


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            summary TEXT,
            key_points TEXT,
            terms TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    ''')
    conn.commit()
    conn.close()


init_db()


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    conn = get_db()
    existing = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Email already registered'}), 409

    hashed = generate_password_hash(password)
    conn.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                 (name, email, hashed))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Account created successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid email or password'}), 401

    session['user_id'] = user['id']

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'joined': user['created_at']
        }
    })


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'})


@app.route('/api/me')
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'joined': user['created_at']
        }
    })


@app.route('/api/upload', methods=['POST'])
def upload_paper():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Please log in first'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '' or not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Please upload a valid PDF file'}), 400

    filename = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        text = extract_pdf_text(filepath)
        if len(text.strip()) < 50:
            return jsonify({'error': 'Could not extract enough text from the PDF'}), 400
    except Exception as e:
        return jsonify({'error': f'Error reading PDF: {str(e)}'}), 400

    try:
        result = generate_summary(text)
    except Exception as e:
        return jsonify({'error': f'AI analysis failed: {str(e)}'}), 500

    conn = get_db()
    conn.execute(
        'INSERT INTO papers (user_id, filename, summary, key_points, terms) VALUES (?, ?, ?, ?, ?)',
        (user_id, file.filename, result.get('summary', ''),
         json.dumps(result.get('key_points', [])),
         json.dumps(result.get('terms', [])))
    )
    conn.commit()
    conn.close()

    return jsonify(result)


def extract_pdf_text(filepath):
    text = ''
    with open(filepath, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + '\n'
    return text


def generate_summary(text):
    truncated = text[:12000]

    prompt = """Analyze this research paper text and return a JSON object with these fields:
    - "summary": A clear 2-3 paragraph summary of the paper
    - "key_points": An array of 5-7 key points or findings (strings)
    - "terms": An array of 4-6 important technical terms, each as {"term": "...", "definition": "..."}

    Return ONLY valid JSON, no markdown formatting or extra text.

    Paper text:
    """ + truncated

    response = ai_client.chat.completions.create(
        model=AI_MODEL,
        messages=[
            {'role': 'system', 'content': 'You are a research paper analyst. Always respond with valid JSON only.'},
            {'role': 'user', 'content': prompt}
        ],
        temperature=0.3
    )

    content = response.choices[0].message.content.strip()
    if content.startswith('```'):
        content = content.split('\n', 1)[1]
        content = content.rsplit('```', 1)[0]
    return json.loads(content)


@app.route('/api/search')
def search_papers():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'error': 'Please provide a search query'}), 400

    try:
        results = search_arxiv(query)
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': f'Search failed: {str(e)}'}), 500


def search_arxiv(query, max_results=10):
    url = 'http://export.arxiv.org/api/query'
    params = {
        'search_query': f'all:{query}',
        'start': 0,
        'max_results': max_results,
        'sortBy': 'relevance',
        'sortOrder': 'descending'
    }

    response = requests.get(url, params=params, timeout=15)
    response.raise_for_status()

    root = ET.fromstring(response.text)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}

    papers = []
    for entry in root.findall('atom:entry', ns):
        authors = [a.find('atom:name', ns).text
                    for a in entry.findall('atom:author', ns)]

        abstract = entry.find('atom:summary', ns).text.strip()
        if len(abstract) > 300:
            abstract = abstract[:300] + '...'

        papers.append({
            'title': entry.find('atom:title', ns).text.strip().replace('\n', ' '),
            'authors': ', '.join(authors[:3]) + ('...' if len(authors) > 3 else ''),
            'abstract': abstract,
            'link': entry.find('atom:id', ns).text.strip()
        })

    return papers


@app.route('/api/analyze', methods=['POST'])
def analyze_idea():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Please log in first'}), 401

    data = request.get_json()
    idea = data.get('idea', '').strip()
    if not idea:
        return jsonify({'error': 'Please describe your idea'}), 400

    try:
        result = evaluate_startup_idea(idea)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


def evaluate_startup_idea(idea):
    prompt = f"""Evaluate this startup/research idea and return a JSON object with these fields:
    - "innovation_score": integer 0-10
    - "feasibility_score": integer 0-10
    - "market_score": integer 0-10
    - "overall_score": integer 0-10
    - "feasibility": A 2-3 sentence feasibility assessment
    - "market_potential": A 2-3 sentence market potential assessment
    - "suggestions": An array of 4-5 actionable suggestions (strings)

    Return ONLY valid JSON, no markdown formatting or extra text.

    Idea: {idea}"""

    response = ai_client.chat.completions.create(
        model=AI_MODEL,
        messages=[
            {
                'role': 'system',
                'content': 'You are a startup evaluator and innovation analyst. Always respond with valid JSON only.'
            },
            {'role': 'user', 'content': prompt}
        ],
        temperature=0.4
    )

    content = response.choices[0].message.content.strip()
    if content.startswith('```'):
        content = content.split('\n', 1)[1]
        content = content.rsplit('```', 1)[0]
    return json.loads(content)


@app.route('/api/papers')
def get_papers():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Please log in first'}), 401

    conn = get_db()
    rows = conn.execute(
        'SELECT * FROM papers WHERE user_id = ? ORDER BY uploaded_at DESC',
        (user_id,)
    ).fetchall()
    conn.close()

    papers = []
    for row in rows:
        papers.append({
            'id': row['id'],
            'filename': row['filename'],
            'summary': row['summary'],
            'key_points': json.loads(row['key_points']) if row['key_points'] else [],
            'terms': json.loads(row['terms']) if row['terms'] else [],
            'uploaded_at': row['uploaded_at']
        })

    return jsonify({'papers': papers})


if __name__ == '__main__':
    print('\n📡 ResearchRadar is running!')
    print('   Open http://localhost:5000 in your browser\n')
    app.run(debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true', host='0.0.0.0', port=5000)
