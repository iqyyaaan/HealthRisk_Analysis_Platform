const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "healthrisk.sqlite");
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id TEXT NOT NULL,
      created_at TEXT NOT NULL,

      age_band TEXT,
      gender TEXT,
      education TEXT,
      region TEXT,

      exercise_days INTEGER,
      sleep_hours REAL,
      stress_level INTEGER,
      diet_quality INTEGER,

      perceived_diabetes_risk INTEGER,

      height_cm REAL,
      weight_kg REAL,
      bmi REAL,

      objective_risk_bucket TEXT,
      perceived_risk_bucket TEXT,
      reliability_label TEXT,

      lifestyle_text TEXT
    )
  `);
});

module.exports = db;