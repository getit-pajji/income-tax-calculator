# TaxTracker+ 📈 💸

TaxTracker+ is a premium, modern, and intuitive income tax tracking and optimization platform built with React, Vite, Recharts, and a local Express + SQLite3 backend. 

The application is designed to be simple for anyone to use, offering real-time tax estimation based on logged transactions, comparative optimization simulators, and structured filing calendar schedules.

---

## 🌟 Key Features

* **Interactive KPI Dashboard:** View logged cash flows, estimated taxes owed, actual net profit, and countdown timers to your next tax deadline. Uses beautiful visual cashflow charts.
* **Modular Multi-Country Tax Engine:** Out-of-the-box support for:
  * **United States (US):** Standard progressive brackets + standard/itemized deductions + Medicare/Social Security FICA taxes + state tax calculations.
  * **United Kingdom (UK):** Pay As You Earn (PAYE) bands + Personal Allowance phase-out rules + National Insurance (NI).
  * **India (IN):** Implements both **New Tax Regime (FY 2025-26 rules)** with zero-tax rebate up to ₹12L, and the Old Regime deductions.
  * **Canada (CA):** Federal tax calculation + CPP & EI + average provincial tax rules.
  * **Australia (AU):** Resident rates (including Stage 3 tax cuts) + Medicare Levy.
  * **Germany (DE):** Progressive Einkommensteuer approximations + solidarity surcharge (Soli) + pension/health employee insurance.
  * **Custom Country Engine:** Complete control to set custom standard deductions, custom currency symbols, and dynamically add/edit progressive tax brackets.
* **Organization & Corporate Tax support:** Switch profile to "Organization" to calculate flat corporate taxes on net business margins.
* **Income & Expense Tracker Ledger:** Log client invoicing, salaries, marketing expenses, or subscriptions. Real-time liability recalculations occur dynamically as you update items.
* **Tax Savings Optimizer Simulator:** Toggle range sliders (e.g. Traditional IRA, PPF 80C, UK Pension) to simulate immediate tax-saving deductions side-by-side.
* **Filing Dates & Reminders Calendar:** Filter standard deadlines matching your country and log custom reminders.

---

## 🛠️ Technology Stack

* **Frontend:** React (v19), React Router DOM (v7), Vite, Recharts (for charts), Lucide React (for icons)
* **Backend:** Express.js, SQLite3 (database file: `./database.sqlite`)
* **Styling:** Custom responsive Glassmorphism CSS with active light/dark theme parameters

---

## 📁 Project Structure

```text
├── database.sqlite       # Local persistent SQLite database file
├── server.js             # Express API server + database schema models
├── package.json          # Node dependencies and scripts
├── start-app.bat         # One-click app launcher for Windows
├── README.md             # Documentation
└── src/
    ├── App.jsx           # SPA router mapping layout & nav
    ├── index.css         # Styling system tokens & animations
    ├── main.jsx          # React app DOM loader
    ├── components/
    │   ├── Navbar.jsx    # Sidebar navigation with metadata widgets
    │   └── ThemeToggle.jsx # Theme switcher floating button
    ├── pages/
    │   ├── Login.jsx     # Onboarding Profile Configuration page
    │   ├── Dashboard.jsx # Metric widgets, Cashflow Area charts & tasks
    │   ├── Calculator.jsx# Dynamic multi-country bracket calculations
    │   ├── Tracker.jsx   # Cash ledger + running tax estimate card
    │   ├── TaxOptimizer.jsx # Interactive sliders + tax reduction simulator
    │   └── Deadlines.jsx # Deadline calendars & checklist reminders
    └── utils/
        └── taxCalc.js    # Core mathematical formula engine
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation

1. Clone or download the repository into your preferred folder:
   ```bash
   git clone <your-repository-url>
   cd "new project"
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Running the App (One-Click Launcher)

If you are on **Windows**, you can start both the frontend and backend servers together by simply double-clicking the launcher file in your folder:
```text
start-app.bat
```
This script will boot up the services and open [http://localhost:5173](http://localhost:5173) in your default browser.

### Running Manually

If you prefer to start the servers manually from a terminal:

1. **Start the backend server:**
   ```bash
   node server.js
   ```
2. **Start the Vite React frontend:**
   ```bash
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 License

This project is licensed under the MIT License.
