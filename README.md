# DataDojo 🥋

DataDojo is an open-source interactive website that teaches total beginners Python and data analysis through short, playful lessons called **Katas**.

Everything runs directly in your web browser using WebAssembly (Pyodide). There is no setup, no installation, and no database.

---

## 🥋 The Belt System

Katas are organized into martial arts belts:

1. **White Belt**: Start Here (First lines of code, variables, and feedback)
2. **Yellow Belt**: Python Basics (Conditions, loops, and custom functions)
3. **Orange Belt**: NumPy (Grids and numeric lists)
4. **Green Belt**: pandas (Tables, spreadsheets, and cleaning)
5. **Blue Belt**: Visualization (Charts, plotting, and storytelling)
6. **Purple Belt**: Stats (Averages, spreads, and signals)
7. **Brown Belt**: Intro ML (Patterns and predictive models)
8. **Black Belt**: Capstone (Full end-to-end data project)

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ (for testing)

### Installation & Local Server
```bash
# Clone the repository
git clone https://github.com/DatagenieSK/DataDojo.git
cd DataDojo

# Install pinned dependencies
pip install -r requirements.txt

# Start the MkDocs development server
mkdocs serve
```

Visit `http://127.0.0.1:8000` in your browser.

---

## 🧪 Testing & Validation

Run all project checks with these commands:

```bash
# Run JavaScript unit tests (error translator & progress store)
node --test

# Validate all katas and exercises against CPython
python tools/validate_katas.py

# Build site with strict checks
mkdocs build --strict
```

---

## 🤝 Contributing

We welcome community katas! Please see [CONTRIBUTING.md](CONTRIBUTING.md) and the [Kata Authoring Guide](docs/contribute/writing-a-kata.md).

---

## 📄 License & Conduct
- **Code**: MIT License (see [LICENSE](LICENSE))
- **Curriculum & Content**: CC BY-SA 4.0 (see [LICENSE-CONTENT](LICENSE-CONTENT))
- **Community**: Contributor Covenant (see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md))

> **TODO**: The repository maintainer will paste the official legal text into `LICENSE`, `LICENSE-CONTENT`, and `CODE_OF_CONDUCT.md`.
