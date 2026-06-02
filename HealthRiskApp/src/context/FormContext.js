import React, { createContext, useContext, useReducer } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  computeCompositeRiskScore,
  bucketObjectiveFromCompositeScore,
  bucketPerceived,
  labelReliability,
  computeFullObjectiveRiskFINDRISC,  // ADD
} from '../utils/Label';

const initialState = {
  age_band: '25-34',
  gender: 'prefer_not_to_say',
  education: 'undergraduate',
  region: '',
  exercise_days: 3,
  sleep_hours: 7,
  stress_level: 3,
  diet_quality: 3,
  perceived_diabetes_risk: 3,
  height_cm: 170,
  weight_kg: 70,
  lifestyle_text: '',
  // ADD — new clinical history fields
  bp_medication: false,
  high_glucose_history: false,
  family_history: false,
};

function reducer(state, action) {
  if (action.type === 'UPDATE') return { ...state, [action.field]: action.value };
  if (action.type === 'RESET') return initialState;
  return state;
}

const FormContext = createContext(null);

export function FormProvider({ children }) {
  const [form, dispatch] = useReducer(reducer, initialState);

  async function submitForm() {
    // 🔹 STEP 1: Compute composite score (kept as before)
    const { bmi, score } = computeCompositeRiskScore(form);

    // 🔹 STEP 2: Original composite risk buckets (kept as before)
    const objective_risk_bucket = bucketObjectiveFromCompositeScore(score);
    const perceived_risk_bucket = bucketPerceived(form.perceived_diabetes_risk);
    const reliability_label = labelReliability(perceived_risk_bucket, objective_risk_bucket);

    // 🔹 STEP 3: Normalised score (kept as before)
    const max_score = 14;
    const normalised_score = parseFloat((score / max_score).toFixed(3));

    // 🔹 STEP 4: Feature summary (kept as before)
    const feature_summary = `
    Age: ${form.age_band},
    Exercise days: ${form.exercise_days},
    Sleep hours: ${form.sleep_hours},
    Stress level: ${form.stress_level},
    Diet quality: ${form.diet_quality},
    BMI: ${bmi}
    `.trim();

    // 🔹 STEP 5: FINDRISC score (ADD — runs alongside composite, doesn't replace it)
    const {
      findrisc_score,
      objective_risk_bucket: findrisc_objective_bucket,
    } = computeFullObjectiveRiskFINDRISC({ ...form, bmi });

    const findrisc_reliability_label = labelReliability(
      perceived_risk_bucket,
      findrisc_objective_bucket
    );

    // 🔹 STEP 6: Payload (kept as before + FINDRISC fields added)
    const payload = {
      participant_id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      created_at: new Date().toISOString(),
      risk_model_version: 'composite_v2_findrisc_v1',  // updated version tag

      ...form,

      bmi,
      composite_risk_score: score,
      normalised_risk_score: normalised_score,

      objective_risk_bucket,
      perceived_risk_bucket,
      reliability_label,

      feature_summary,

      // ADD — FINDRISC fields stored alongside existing fields
      findrisc_score,
      findrisc_objective_bucket,
      findrisc_reliability_label,
    };

    // 🔹 STEP 7: Save to Firebase (kept as before)
    addDoc(collection(db, 'responses'), payload)
      .then(() => console.log('✅ Saved to Firebase'))
      .catch((err) => console.error('❌ Firebase error:', err));

    return payload;
  }

  return (
    <FormContext.Provider value={{ form, dispatch, submitForm }}>
      {children}
    </FormContext.Provider>
  );
}

export const useForm = () => useContext(FormContext);