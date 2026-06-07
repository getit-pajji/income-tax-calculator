import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite DB
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Profile Table (Stores user preferences)
  db.run(`CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT '$',
    entity_type TEXT NOT NULL DEFAULT 'Individual',
    filing_status TEXT DEFAULT 'Single',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Calculations Table (Saved calculators history)
  db.run(`CREATE TABLE IF NOT EXISTS calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    country TEXT NOT NULL,
    tax_year INTEGER NOT NULL,
    gross_income REAL NOT NULL,
    deductions REAL NOT NULL,
    calculated_tax REAL NOT NULL,
    net_income REAL NOT NULL,
    inputs_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Transactions Table (Income & Expense Tracker ledger)
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'income' or 'expense'
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Deadlines Table (Filing dates & reminders)
  db.run(`CREATE TABLE IF NOT EXISTS deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    title TEXT NOT NULL,
    deadline_date TEXT NOT NULL,
    country TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'Pending', -- 'Pending' or 'Completed'
    is_custom INTEGER DEFAULT 1 -- 1 for user-created, 0 for system default
  )`);
});

// Seed default deadlines helper function
const seedDefaultDeadlines = (country, profileId = 1) => {
  const defaults = {
    US: [
      { title: 'US Individual Tax Filing (Form 1040)', date: '2026-04-15', notes: 'Federal tax deadline for individual returns.' },
      { title: 'US Q1 Estimated Tax Payment', date: '2026-04-15', notes: 'First quarter payment due for self-employed/organizations.' },
      { title: 'US Q2 Estimated Tax Payment', date: '2026-06-15', notes: 'Second quarter estimated payment.' },
      { title: 'US Q3 Estimated Tax Payment', date: '2026-09-15', notes: 'Third quarter estimated payment.' },
      { title: 'US Q4 Estimated Tax Payment', date: '2027-01-15', notes: 'Fourth quarter estimated payment.' },
      { title: 'US Corporate Filing (Form 1120)', date: '2026-04-15', notes: 'C-Corporation tax filing deadline.' }
    ],
    UK: [
      { title: 'UK Tax Year Ends', date: '2026-04-05', notes: 'Last day of the 2025/2026 tax year. Ensure allowances are maximized.' },
      { title: 'UK Self-Assessment Paper Filing', date: '2026-10-31', notes: 'Deadline for paper tax returns.' },
      { title: 'UK Self-Assessment Online Filing & Tax Payment', date: '2027-01-31', notes: 'Deadline to file self-assessment online and pay balance tax.' }
    ],
    IN: [
      { title: 'India Individual ITR Filing Deadline', date: '2026-07-31', notes: 'Deadline to file Individual Income Tax Return (ITR).' },
      { title: 'India Advance Tax - 1st Instalment', date: '2026-06-15', notes: '15% of estimated tax liability due.' },
      { title: 'India Advance Tax - 2nd Instalment', date: '2026-09-15', notes: '45% of cumulative estimated tax liability due.' },
      { title: 'India Advance Tax - 3rd Instalment', date: '2026-12-15', notes: '75% of cumulative estimated tax liability due.' },
      { title: 'India Advance Tax - 4th Instalment', date: '2027-03-15', notes: '100% of estimated tax liability due.' },
      { title: 'India Corporate ITR Filing', date: '2026-10-31', notes: 'Deadline for corporate tax filing.' }
    ],
    CA: [
      { title: 'Canada Personal Income Tax Filing', date: '2026-04-30', notes: 'Deadline to file personal tax returns and pay taxes.' },
      { title: 'Canada Self-Employed Tax Filing', date: '2026-06-15', notes: 'Filing deadline for self-employed individuals.' },
      { title: 'Canada Q1 Estimated Tax Instalment', date: '2026-03-15', notes: 'First quarterly tax installment.' }
    ],
    AU: [
      { title: 'Australia Individual Tax Filing Deadline', date: '2026-10-31', notes: 'Tax return lodging deadline if filing on your own.' },
      { title: 'Australia Income Tax Year Ends', date: '2026-06-30', notes: 'End of Australian financial year.' }
    ],
    DE: [
      { title: 'Germany Income Tax Return (Regular)', date: '2026-07-31', notes: 'Standard deadline for filing personal taxes (Einkommensteuererklärung).' },
      { title: 'Germany Tax Return (Filing via Tax Advisor)', date: '2027-02-28', notes: 'Extended deadline if using an official tax advisor.' }
    ]
  };

  const selectedDeadlines = defaults[country] || [];
  
  // Clean old system deadlines first
  db.run("DELETE FROM deadlines WHERE profile_id = ? AND is_custom = 0", [profileId], () => {
    const stmt = db.prepare("INSERT INTO deadlines (profile_id, title, deadline_date, country, notes, is_custom) VALUES (?, ?, ?, ?, ?, 0)");
    selectedDeadlines.forEach(item => {
      stmt.run([profileId, item.title, item.date, country, item.notes]);
    });
    stmt.finalize();
  });
};

// --- API Endpoints ---

// 1. Profile Endpoints
app.get('/api/profile', (req, res) => {
  db.get("SELECT * FROM profiles ORDER BY id LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      // Return null or empty representation
      return res.json(null);
    }
    res.json(row);
  });
});

app.post('/api/profile', (req, res) => {
  const { name, country, currency, entity_type, filing_status } = req.body;
  
  db.get("SELECT id FROM profiles ORDER BY id LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      // Update existing profile
      db.run(
        "UPDATE profiles SET name = ?, country = ?, currency = ?, entity_type = ?, filing_status = ? WHERE id = ?",
        [name, country, currency, entity_type, filing_status, row.id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          // Update / Seed system deadlines for the country
          seedDefaultDeadlines(country, row.id);
          res.json({ success: true, id: row.id, name, country, currency, entity_type, filing_status });
        }
      );
    } else {
      // Insert new profile
      db.run(
        "INSERT INTO profiles (name, country, currency, entity_type, filing_status) VALUES (?, ?, ?, ?, ?)",
        [name, country, currency, entity_type, filing_status],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const newId = this.lastID;
          seedDefaultDeadlines(country, newId);
          res.json({ success: true, id: newId, name, country, currency, entity_type, filing_status });
        }
      );
    }
  });
});

// 2. Saved Calculations Endpoints
app.get('/api/calculations', (req, res) => {
  db.all("SELECT * FROM calculations ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/calculations', (req, res) => {
  const { country, tax_year, gross_income, deductions, calculated_tax, net_income, inputs_json } = req.body;
  
  db.run(
    "INSERT INTO calculations (profile_id, country, tax_year, gross_income, deductions, calculated_tax, net_income, inputs_json) VALUES (1, ?, ?, ?, ?, ?, ?, ?)",
    [country, tax_year, gross_income, deductions, calculated_tax, net_income, JSON.stringify(inputs_json)],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete('/api/calculations/:id', (req, res) => {
  db.run("DELETE FROM calculations WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 3. Financial Transactions Ledger Endpoints
app.get('/api/transactions', (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY date DESC, id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/transactions', (req, res) => {
  const { date, type, category, amount, description } = req.body;
  db.run(
    "INSERT INTO transactions (profile_id, date, type, category, amount, description) VALUES (1, ?, ?, ?, ?, ?)",
    [date, type, category, amount, description],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete('/api/transactions/:id', (req, res) => {
  db.run("DELETE FROM transactions WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 4. Deadlines & Calendar Endpoints
app.get('/api/deadlines', (req, res) => {
  db.all("SELECT * FROM deadlines ORDER BY deadline_date ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/deadlines', (req, res) => {
  const { title, deadline_date, country, notes } = req.body;
  db.run(
    "INSERT INTO deadlines (profile_id, title, deadline_date, country, notes, is_custom) VALUES (1, ?, ?, ?, ?, 1)",
    [title, deadline_date, country || 'Custom', notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put('/api/deadlines/:id/status', (req, res) => {
  const { status } = req.body;
  db.run(
    "UPDATE deadlines SET status = ? WHERE id = ?",
    [status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/deadlines/:id', (req, res) => {
  db.run("DELETE FROM deadlines WHERE id = ? AND is_custom = 1", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Debug dump endpoint
app.get('/api/debug-tax', (req, res) => {
  const dump = {};
  db.serialize(() => {
    db.get("SELECT * FROM profiles LIMIT 1", (err, prof) => {
      dump.profile = prof;
      db.all("SELECT * FROM calculations", (err, calc) => {
        dump.calculations = calc;
        db.all("SELECT * FROM transactions", (err, txs) => {
          dump.transactions = txs;
          db.all("SELECT * FROM deadlines", (err, dls) => {
            dump.deadlines = dls;
            res.json(dump);
          });
        });
      });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Tax Tracker Backend running on http://localhost:${PORT}`));
