const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const {
  computeBMI,
  bucketObjectiveFromBMI,
  bucketPerceived,
  labelReliability,
} = require("./label");

const app = express();
app.use(cors());
app.use(express.json());

// Health check (easy to demo)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

// Submit questionnaire response
app.post("/api/submit", (req, res) => {
  const now = new Date().toISOString();
  const participant_id = uuidv4();

  const {
    age_band,
    gender,
    education,
    region,
    exercise_days,
    sleep_hours,
    stress_level,
    diet_quality,
    perceived_diabetes_risk,
    height_cm,
    weight_kg,
    lifestyle_text,
  } = req.body;

  const bmi = computeBMI(height_cm, weight_kg);
  const objective_risk_bucket = bucketObjectiveFromBMI(bmi);
  const perceived_risk_bucket = bucketPerceived(perceived_diabetes_risk);
  const reliability_label = labelReliability(perceived_risk_bucket, objective_risk_bucket);

  const sql = `
    INSERT INTO responses (
      participant_id, created_at,
      age_band, gender, education, region,
      exercise_days, sleep_hours, stress_level, diet_quality,
      perceived_diabetes_risk,
      height_cm, weight_kg, bmi,
      objective_risk_bucket, perceived_risk_bucket, reliability_label,
      lifestyle_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    participant_id, now,
    age_band, gender, education, region,
    exercise_days, sleep_hours, stress_level, diet_quality,
    perceived_diabetes_risk,
    height_cm, weight_kg, bmi,
    objective_risk_bucket, perceived_risk_bucket, reliability_label,
    lifestyle_text
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }

    // Return computed fields so frontend can show instant feedback (nice demo)
    res.json({
      ok: true,
      id: this.lastID,
      participant_id,
      created_at: now,
      bmi,
      objective_risk_bucket,
      perceived_risk_bucket,
      reliability_label,
    });
  });
});

// Fetch responses (for analysis/dashboard later)
app.get("/api/responses", (req, res) => {
  db.all("SELECT * FROM responses ORDER BY id DESC LIMIT 200", (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, count: rows.length, rows });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));