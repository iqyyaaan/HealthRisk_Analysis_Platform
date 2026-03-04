import { useState } from "react";

const initialForm = {
  age_band: "18-24",
  gender: "prefer_not_to_say",
  education: "undergraduate",
  region: "England - East Midlands",
  exercise_days: 3,
  sleep_hours: 7,
  stress_level: 3,
  diet_quality: 3,
  perceived_diabetes_risk: 3,
  height_cm: 170,
  weight_kg: 70,
  lifestyle_text: "",
};

export default function App() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          exercise_days: Number(form.exercise_days),
          sleep_hours: Number(form.sleep_hours),
          stress_level: Number(form.stress_level),
          diet_quality: Number(form.diet_quality),
          perceived_diabetes_risk: Number(form.perceived_diabetes_risk),
          height_cm: Number(form.height_cm),
          weight_kg: Number(form.weight_kg),
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Submit failed");

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 6 }}>Health-Risk Questionnaire (MVP)</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Pseudonymous submission. No names/emails collected.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <Section title="Demographics">
          <Row label="Age band">
            <select value={form.age_band} onChange={(e) => update("age_band", e.target.value)}>
              <option>18-24</option>
              <option>25-34</option>
              <option>35-44</option>
              <option>45-54</option>
              <option>55+</option>
            </select>
          </Row>

          <Row label="Gender">
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="non_binary">non_binary</option>
              <option value="prefer_not_to_say">prefer_not_to_say</option>
            </select>
          </Row>

          <Row label="Education">
            <select value={form.education} onChange={(e) => update("education", e.target.value)}>
              <option value="high_school">high_school</option>
              <option value="undergraduate">undergraduate</option>
              <option value="postgraduate">postgraduate</option>
              <option value="other">other</option>
            </select>
          </Row>

          <Row label="Region">
            <input
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
              placeholder="e.g., England - East Midlands"
            />
          </Row>
        </Section>

        <Section title="Lifestyle & Wellbeing">
          <Row label="Exercise days/week (0–7)">
            <input
              type="number"
              min="0"
              max="7"
              value={form.exercise_days}
              onChange={(e) => update("exercise_days", e.target.value)}
            />
          </Row>

          <Row label="Sleep hours/night">
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={form.sleep_hours}
              onChange={(e) => update("sleep_hours", e.target.value)}
            />
          </Row>

          <Row label="Stress level (1–5)">
            <input
              type="number"
              min="1"
              max="5"
              value={form.stress_level}
              onChange={(e) => update("stress_level", e.target.value)}
            />
          </Row>

          <Row label="Diet quality (1–5)">
            <input
              type="number"
              min="1"
              max="5"
              value={form.diet_quality}
              onChange={(e) => update("diet_quality", e.target.value)}
            />
          </Row>
        </Section>

        <Section title="Risk Perception & Objective Marker">
          <Row label="Perceived diabetes risk (1–5)">
            <input
              type="number"
              min="1"
              max="5"
              value={form.perceived_diabetes_risk}
              onChange={(e) => update("perceived_diabetes_risk", e.target.value)}
            />
          </Row>

          <Row label="Height (cm)">
            <input
              type="number"
              min="50"
              max="250"
              value={form.height_cm}
              onChange={(e) => update("height_cm", e.target.value)}
            />
          </Row>

          <Row label="Weight (kg)">
            <input
              type="number"
              min="20"
              max="300"
              value={form.weight_kg}
              onChange={(e) => update("weight_kg", e.target.value)}
            />
          </Row>
        </Section>

        <Section title="Optional (LLM text input)">
          <Row label="Lifestyle text (1–2 sentences)">
            <textarea
              rows={3}
              value={form.lifestyle_text}
              onChange={(e) => update("lifestyle_text", e.target.value)}
              placeholder="e.g., I walk daily but eat late at night..."
            />
          </Row>
        </Section>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 16px",
            fontSize: 16,
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>

        {error && (
          <div style={{ padding: 12, border: "1px solid #f2b8b8", borderRadius: 10, background: "#fff5f5" }}>
            <b>Error:</b> {error}
          </div>
        )}

        {result && (
          <div style={{ padding: 12, border: "1px solid #cfe8cf", borderRadius: 10, background: "#f5fff5" }}>
            <div><b>Saved!</b> participant_id: {result.participant_id}</div>
            <div>BMI: {result.bmi?.toFixed?.(2) ?? result.bmi}</div>
            <div>Objective risk bucket: {result.objective_risk_bucket}</div>
            <div>Perceived risk bucket: {result.perceived_risk_bucket}</div>
            <div><b>Reliability label:</b> {result.reliability_label}</div>
          </div>
        )}
      </form>

      <p style={{ marginTop: 26, color: "#666", fontSize: 13 }}>
        This implements the data-collection deliverable and computes reliability labels on submission.
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>{title}</h2>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, alignItems: "center" }}>
      <span style={{ color: "#222" }}>{label}</span>
      <div>
        {children}
      </div>
    </label>
  );
}