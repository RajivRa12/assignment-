# Assessment Portal Backend (FastAPI)

A lightweight, robust FastAPI backend for the Assessment Portal. It serves technical assessment questions, validates candidate submissions, detects suspicious phrases and paste events, and returns comprehensive evaluation metrics.

---

## 1. Project Overview

- **Framework**: FastAPI (Python 3.9+)
- **Validation**: Pydantic v2
- **ASGI Server**: Uvicorn
- **Testing**: Pytest + FastAPI TestClient (HTTPX)
- **Database**: None required (Stateless MVP)

---

## 2. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entrypoint, CORS & error handlers
│   ├── routes/
│   │   ├── __init__.py
│   │   └── assessment.py    # GET /questions & POST /submit routes
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── assessment.py    # Pydantic v2 models & validators
│   └── services/
│       ├── __init__.py
│       └── evaluation.py    # Integrity heuristic & scoring engine
├── tests/
│   ├── __init__.py
│   └── test_assessment.py   # Comprehensive automated test suite
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Local Environment Setup

### Prerequisites
- Python 3.9 or higher

### Step 1: Create and Activate Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate
```

*(On Windows PowerShell: `venv\Scripts\Activate.ps1`)*

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Default configuration in `.env`:
```ini
PORT=8000
HOST=127.0.0.1
FRONTEND_ORIGIN=http://localhost:3000
```

---

## 4. Running the FastAPI Server

Start the server using Uvicorn with hot-reload enabled:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The service is available at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 5. API Endpoints

### 1. `GET /api/v1/assessment/questions`

Fetches the assessment questions.

**Response (200 OK):**
```json
{
  "questions": [
    {
      "id": "1",
      "type": "mcq",
      "question": "Which of the following best describes a REST API?",
      "options": [
        "A. A database management system",
        "B. An architectural style for communication between systems",
        "C. A programming language",
        "D. A frontend framework"
      ]
    },
    {
      "id": "2",
      "type": "short_answer",
      "question": "Explain how an API works and how two applications communicate with each other."
    },
    {
      "id": "3",
      "type": "scenario",
      "question": "Imagine two identical POST requests arrive simultaneously to create the same user account. How would you prevent duplicate records in the database?"
    }
  ]
}
```

---

### 2. `POST /api/v1/assessment/submit`

Submits candidate answers and paste attempt metrics for integrity evaluation.

**Request Payload:**
```json
{
  "answers": {
    "1": "B. An architectural style for communication between systems",
    "2": "APIs allow systems to exchange data. In conclusion, they play a vital role.",
    "3": "Use a unique constraint on the email field and transaction isolation."
  },
  "paste_count": 1
}
```

**Response (200 OK):**
```json
{
  "overall_score": 70,
  "authenticity_score": 70,
  "integrity_status": "Flagged",
  "paste_count": 1,
  "detected_phrases": [
    "in conclusion"
  ],
  "deductions": {
    "initial_score": 100,
    "phrase_deduction": 15,
    "paste_deduction": 15,
    "final_score": 70
  }
}
```

---

## 6. Evaluation Logic & Scoring Rules

1. **Initial Score**: Starts at `100`.
2. **Suspicious Phrase Detection**:
   - Monitored exclusively in the **short-answer** response (`id: "2"`).
   - Case-insensitive matching for:
     - `"in conclusion"`
     - `"furthermore"`
     - `"pivotal role"`
   - If one or more phrases are detected: **15 points deducted once**.
3. **Paste Attempts**:
   - If `paste_count > 0`: **15 points deducted once**.
4. **Combined Deductions**:
   - Both triggered: **30 points total deduction** (Final score: `70`).
5. **Score Boundaries**: Enforced between `0` and `100`.
6. **Integrity Status**:
   - `Flagged`: If suspicious phrases detected OR `paste_count > 0`.
   - `Verified Human`: Otherwise.

---

## 7. Running Automated Tests

Run the complete pytest test suite:

```bash
pytest -v
```

Tests cover:
- Question retrieval and structure (count, types, unique IDs)
- Score calculation and boundary enforcement
- Deduction rules for phrases and paste attempts
- Input validation (missing answers, invalid IDs, negative/boolean paste counts)
- CORS preflight and health check

---

## 8. Deployment on Ubuntu Linux VM

### Step 1: Install Python and Nginx
```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx
```

### Step 2: Clone and Setup Application
```bash
cd /opt
sudo git clone <your-repository-url> assessment-portal
cd assessment-portal/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Create Systemd Service
Create `/etc/systemd/system/assessment-backend.service`:
```ini
[Unit]
Description=Assessment Portal FastAPI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/assessment-portal/backend
Environment="PATH=/opt/assessment-portal/backend/venv/bin"
Environment="FRONTEND_ORIGIN=https://assessment.yourdomain.com"
ExecStart=/opt/assessment-portal/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now assessment-backend
```

### Step 4: Configure Nginx Reverse Proxy
Add to `/etc/nginx/sites-available/assessment-api`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/assessment-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
