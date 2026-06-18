# BigQuery Release Pulse ⚡

A premium, responsive dark-mode dashboard built with Python Flask and custom vanilla HTML, CSS, and JavaScript. It aggregates, parses, and segments the official Google Cloud BigQuery Release Notes, allowing you to browse updates and tweet them individually or as compiled summaries.

---

## 🚀 Key Features

* **Granular Deconstruction**: Monolithic daily feed notes are dynamically parsed and separated into individual update cards by category (e.g. `Feature`, `Announcement`, `Issue`, `Deprecation`).
* **Instant Category Filters & Full-Text Search**: Filter notes using category tabs or search keywords instantly on the client side.
* **Copy to Clipboard**: A quick copy button on each card copies the formatted update (Type, Date, Description, and Link) directly to your clipboard, featuring a visual state transition confirmation ("Copied!").
* **Export to CSV**: An export button in the filter bar generates a clean spreadsheet-ready CSV file of the currently filtered/searched list, correctly handling escaping and downloads in the browser.
* **Granular Tweeting**:
  * **Single Tweet**: Click any update's tweet icon to launch a pre-populated composer containing the update date, tag, shortened text description, and direct link.
  * **Compiled Selection**: Toggle checkmarks on multiple update cards to compile a bulleted summary tweet in a bottom dashboard drawer.
* **Auto-Truncation**: Automatically budgets text lengths to guarantee tweets stay under the 280-character limit, calculating URL shortening rules dynamically.
* **Premium Glassmorphic UI**: High-fidelity dark mode dashboard with smooth micro-animations, color-coded status badges, and inline SVG rendering.

---

## 🛠️ Technology Stack

* **Backend**: Python, Flask, requests, BeautifulSoup4
* **Frontend**: HTML5, Vanilla CSS3 (with CSS variables), Vanilla JavaScript (ES6)
* **API Feed Source**: [BigQuery Release Notes RSS XML Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml)

---

## 📂 Project Structure

```
bq-releases-notes/
├── app.py                  # Main Flask application and XML/HTML parsing engine
├── requirements.txt        # Python package dependencies
├── .gitignore              # Files ignored by git
├── templates/
│   └── index.html          # Main HTML5 semantic structure
└── static/
    ├── css/
    │   └── style.css       # Layout styles, HSL color tokens, and animations
    └── js/
        └── main.js         # API fetching, filter engines, selections, and Twitter integrations
```

---

## ⚙️ Installation & Running

### Option 1: Using `uv` (Recommended)

If you have [uv](https://github.com/astral-sh/uv) installed, running the app is extremely simple:

```powershell
# 1. Create a virtual environment and install dependencies
uv venv
uv pip install -r requirements.txt

# 2. Run the application
.venv\Scripts\python.exe app.py
```

### Option 2: Standard Python

Alternatively, you can run the app using standard Python virtual environments:

```bash
# 1. Create a virtual environment
python -m venv .venv

# 2. Activate the virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the application
python app.py
```

Once running, open your browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🐦 Tweeting Mechanics

When tweeting:
1. The app generates the text and character count representation using Twitter rules (where URLs count as exactly **23** characters).
2. The interactive **Tweet Composer Modal** opens on the dashboard.
3. You can review, add commentary, or modify hashtags in the composer.
4. Clicking **Post Tweet** launches the official Twitter Web Intent (`https://twitter.com/intent/tweet?text=...`) to post the message securely to your account.
