# When Cloning

git clone git@github.com:<your-username>/<repo-name>.git
cd <repo-name>

# Virtual Envi

python3 -m venv env
source env/bin/activate
.\venv\Scripts\activate 
# Requirements

pip install -r requirements.txt

# Then Create `.env` file with `SECRET_KEY=...`

python app.py

# run the server: uvicorn app.main:app --reload --port 5001
