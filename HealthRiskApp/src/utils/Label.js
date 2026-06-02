export function computeBMI(height_cm, weight_kg) {
  const h = Number(height_cm) / 100;
  const w = Number(weight_kg);

  if (!h || !w || h <= 0 || w <= 0) return null;

  return parseFloat((w / (h * h)).toFixed(2));
}

export function bucketPerceived(score) {
  const r = Number(score);

  if (r <= 2) return 'low';
  if (r === 3) return 'medium';
  return 'high';
}

export function labelReliability(perceived, objective) {
  if (!perceived || !objective) return null;

  const order = { low: 0, medium: 1, high: 2 };
  const p = order[perceived];
  const o = order[objective];

  if (p === o) return 'aligned';
  if (p < o) return 'underestimate';
  return 'overestimate';
}

/* =========================
   RISK POINT FUNCTIONS
   ========================= */

function bmiRiskPoints(bmi) {
  if (bmi == null) return 0;
  if (bmi < 25) return 0;
  if (bmi < 30) return 1;
  return 2;
}

function exerciseRiskPoints(exercise_days) {
  const v = Number(exercise_days);

  if (v >= 5) return 0;
  if (v >= 2) return 1;
  return 2;
}

function sleepRiskPoints(sleep_hours) {
  const v = Number(sleep_hours);

  if (v >= 7 && v <= 9) return 0;
  if ((v >= 6 && v < 7) || (v > 9 && v <= 10)) return 1;
  return 2;
}

function stressRiskPoints(stress_level) {
  const v = Number(stress_level);

  if (v <= 2) return 0;
  if (v === 3) return 1;
  return 2;
}

function dietRiskPoints(diet_quality) {
  const v = Number(diet_quality);

  if (v >= 4) return 0;
  if (v === 3) return 1;
  return 2;
}

function ageRiskPoints(age_band) {
  switch (age_band) {
    case '18-24':
      return 0;
    case '25-34':
      return 1;
    case '35-44':
      return 2;
    case '45-54':
      return 3;
    case '55+':
      return 4;
    default:
      return 0;
  }
}

/* =========================
   COMPOSITE RISK MODEL
   ========================= */

export function computeCompositeRiskScore(form) {
  const bmi = computeBMI(form.height_cm, form.weight_kg);

  const score =
    bmiRiskPoints(bmi) +
    exerciseRiskPoints(form.exercise_days) +
    sleepRiskPoints(form.sleep_hours) +
    stressRiskPoints(form.stress_level) +
    dietRiskPoints(form.diet_quality) +
    ageRiskPoints(form.age_band);

  return { bmi, score };
}

export function bucketObjectiveFromCompositeScore(score) {
  if (score <= 3) return 'low';
  if (score <= 7) return 'medium';
  return 'high';
}


export function computeFullObjectiveRisk(form) {
  const { bmi, score } = computeCompositeRiskScore(form);
  const objective_risk_bucket = bucketObjectiveFromCompositeScore(score);

  return {
    bmi,
    composite_score: score,
    objective_risk_bucket,
  };
}

/* =========================
   FINDRISC CLINICAL SCORE
   ========================= */

   export function computeFINDRISC(form) {
    let score = 0;
  
    // Age
    if (form.age_band === '45-54') score += 2;
    else if (form.age_band === '55+') score += 3;
  
    // BMI
    const bmi = form.bmi ?? computeBMI(form.height_cm, form.weight_kg);
    if (bmi >= 25 && bmi < 30) score += 1;
    else if (bmi >= 30) score += 3;
  
    // Physical activity — fewer than 4 days/week = not meeting threshold
    if (Number(form.exercise_days) < 4) score += 2;
  
    // Diet quality proxy
    if (Number(form.diet_quality) <= 2) score += 1;
  
    // Clinical history (new fields — default false if not present)
    if (form.bp_medication)        score += 2;
    if (form.high_glucose_history) score += 5;
    if (form.family_history)       score += 5;
  
    return score;
  }
  
  export function bucketObjectiveFromFINDRISC(score) {
    if (score < 7)  return 'low';
    if (score < 12) return 'medium';
    if (score < 15) return 'high';
    return 'high'; // very_high maps to high to stay compatible with existing labelReliability
  }
  
  export function computeFullObjectiveRiskFINDRISC(form) {
    const bmi = computeBMI(form.height_cm, form.weight_kg);
    const findrisc_score = computeFINDRISC({ ...form, bmi });
    const objective_risk_bucket = bucketObjectiveFromFINDRISC(findrisc_score);
  
    return {
      bmi,
      findrisc_score,
      objective_risk_bucket,
    };
  }