import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useForm } from '../context/FormContext';
import {
  computeBMI,
  computeCompositeRiskScore,
  bucketObjectiveFromCompositeScore,
  computeFINDRISC,                    // ADD
  bucketObjectiveFromFINDRISC,        // ADD
} from '../utils/Label';
import ProgressBar from '../components/ProgressBar';
import { colors, shadows } from '../theme';

const API_URL = 'http://192.168.1.118:8000';

const RISK_LABELS = [
  { score: 1, label: 'Very unlikely', color: colors.accent },
  { score: 2, label: 'Unlikely', color: '#5DCAA5' },
  { score: 3, label: 'Neutral', color: colors.warning },
  { score: 4, label: 'Likely', color: colors.danger },
  { score: 5, label: 'Very likely', color: '#B03010' },
];

const LABEL_CONFIG = {
  aligned: {
    color: colors.accent,
    bg: colors.accentLight,
    border: '#B3E8D8',
    title: 'Well calibrated',
    emoji: '✓',
    desc: 'Your risk perception aligns well with your objective health indicators based on your FINDRISC score.',
  },
  underestimate: {
    color: colors.danger,
    bg: colors.dangerLight,
    border: '#F5C4B3',
    title: 'Possible underestimation',
    emoji: '↑',
    desc: 'Your perceived risk appears lower than your FINDRISC-based objective risk. Consider speaking to your GP.',
  },
  overestimate: {
    color: colors.warning,
    bg: colors.warningLight,
    border: '#F5DFA0',
    title: 'Possible overestimation',
    emoji: '↓',
    desc: 'Your perceived risk appears higher than your FINDRISC-based objective risk. This is worth discussing with a health professional.',
  },
};

// ── YES/NO TOGGLE COMPONENT ───────────────────────────────────────────────────
function YesNoToggle({ label, value, onToggle }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.black, marginBottom: 8, lineHeight: 18 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => onToggle(true)}
          activeOpacity={0.7}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            borderWidth: 1.5, alignItems: 'center',
            borderColor: value ? colors.accent : colors.gray5,
            backgroundColor: value ? colors.accentLight : colors.bgSurface,
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 13, color: value ? colors.accent : colors.gray3 }}>
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onToggle(false)}
          activeOpacity={0.7}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            borderWidth: 1.5, alignItems: 'center',
            borderColor: !value ? colors.accent : colors.gray5,
            backgroundColor: !value ? colors.accentLight : colors.bgSurface,
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 13, color: !value ? colors.accent : colors.gray3 }}>
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RiskScreen({ navigation }) {
  const { form, dispatch, submitForm } = useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [aiComment, setAiComment] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [simExercise, setSimExercise] = useState(null);
  const [simSleep, setSimSleep] = useState(null);
  const [simDiet, setSimDiet] = useState(null);

  const update = (field, value) => dispatch({ type: 'UPDATE', field, value });

  // ── EXISTING: live BMI ────────────────────────────────────────────────────
  const liveBMI = (form.height_cm && form.weight_kg)
    ? computeBMI(form.height_cm, form.weight_kg)
    : null;

  const bmiCategory = !liveBMI ? ''
    : liveBMI < 18.5 ? 'Underweight'
    : liveBMI < 25   ? 'Healthy weight'
    : liveBMI < 30   ? 'Overweight'
    : 'Obese';

  const bmiColor = !liveBMI ? colors.gray3
    : liveBMI < 18.5 ? colors.warning
    : liveBMI < 25   ? colors.accent
    : liveBMI < 30   ? colors.warning
    : colors.danger;

  // ── ADD: live FINDRISC (updates as user types height/weight and toggles) ──
  const liveFINDRISC = liveBMI
    ? computeFINDRISC({ ...form, bmi: liveBMI })
    : null;

  const liveFINDRISCBucket = liveFINDRISC !== null
    ? bucketObjectiveFromFINDRISC(liveFINDRISC)
    : null;

  const findriscColor = !liveFINDRISCBucket ? colors.gray3
    : liveFINDRISCBucket === 'low'    ? colors.accent
    : liveFINDRISCBucket === 'medium' ? colors.warning
    : colors.danger;

  const findriscLabel = !liveFINDRISCBucket ? ''
    : liveFINDRISCBucket === 'low'    ? 'Low risk — <1% 10-year risk'
    : liveFINDRISCBucket === 'medium' ? 'Moderate risk — 4–17% 10-year risk'
    : 'High risk — above 33% 10-year risk';

  // ── EXISTING: selected risk label ─────────────────────────────────────────
  const selectedRisk = RISK_LABELS.find(r => r.score === form.perceived_diabetes_risk);

  // ── EXISTING: simulator composite (kept exactly) ──────────────────────────
  const simulatedForm = result
    ? {
        ...form,
        exercise_days: simExercise ?? form.exercise_days,
        sleep_hours:   simSleep   ?? form.sleep_hours,
        diet_quality:  simDiet    ?? form.diet_quality,
        height_cm:     result.height_cm  ?? form.height_cm,
        weight_kg:     result.weight_kg  ?? form.weight_kg,
        age_band:      result.age_band   ?? form.age_band,
        stress_level:  result.stress_level ?? form.stress_level,
      }
    : null;

  const simulatedComposite = simulatedForm
    ? computeCompositeRiskScore(simulatedForm)
    : null;

  const simulatedObjectiveRisk = simulatedComposite
    ? bucketObjectiveFromCompositeScore(simulatedComposite.score)
    : null;

  const scoreDelta = result && simulatedComposite
    ? simulatedComposite.score - result.composite_risk_score
    : null;

  // ── ADD: simulator FINDRISC (runs alongside composite, doesn't replace) ───
  const simFINDRISCScore = simulatedForm
    ? computeFINDRISC({
        ...simulatedForm,
        bmi: result?.bmi,
        bp_medication:        form.bp_medication,
        high_glucose_history: form.high_glucose_history,
        family_history:       form.family_history,
      })
    : null;

  const simFINDRISCBucket = simFINDRISCScore !== null
    ? bucketObjectiveFromFINDRISC(simFINDRISCScore)
    : null;

  const findriscDelta = result && simFINDRISCScore !== null
    ? simFINDRISCScore - result.findrisc_score
    : null;

  // ── EXISTING: handleSubmit (unchanged) ────────────────────────────────────
  async function handleSubmit() {
    if (!form.height_cm || !form.weight_kg) {
      Alert.alert('Missing info', 'Please enter your height and weight.');
      return;
    }

    setLoading(true);

    try {
      const r = await submitForm();
      setResult(r);

      setSimExercise(form.exercise_days);
      setSimSleep(form.sleep_hours);
      setSimDiet(form.diet_quality);

      if (form.lifestyle_text && form.lifestyle_text.trim().length > 10) {
        setAiLoading(true);

        try {
          const res = await fetch(`${API_URL}/llm/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lifestyle_text:    form.lifestyle_text,
              reliability_label: r.reliability_label,
              bmi:               r.bmi,
            }),
          });

          const data = await res.json();
          if (data.comment) setAiComment(data.comment);
        } catch (err) {
          console.error('LLM error:', err);
        } finally {
          setAiLoading(false);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save response: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── RESULT SCREEN ────────────────────────────────────────────────────────
  if (result) {
    const config = LABEL_CONFIG[result.reliability_label] || {
      color: colors.gray2, bg: colors.bgSurface, border: colors.border,
      title: result.reliability_label, emoji: '?', desc: '',
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.resultHeading}>Your results</Text>

          {/* EXISTING: Main result card */}
          <View style={[styles.resultCard, { borderColor: config.border, backgroundColor: config.bg }]}>
            <View style={[styles.resultBadge, { backgroundColor: config.color }]}>
              <Text style={styles.resultBadgeText}>{config.emoji}  {config.title.toUpperCase()}</Text>
            </View>
            <Text style={styles.resultDesc}>{config.desc}</Text>
            <View style={styles.statsRow}>
              <ResultStat label="Your BMI"       value={result.bmi?.toFixed(1)}          sub={bmiCategory} color={bmiColor} />
              <View style={styles.statDivider} />
              <ResultStat label="FINDRISC score" value={result.findrisc_score}            color={colors.black} />
              <View style={styles.statDivider} />
              <ResultStat label="Your perception" value={result.perceived_risk_bucket}    color={colors.black} />
            </View>
          </View>

          {/* EXISTING: GPT-4o AI insight card — unchanged */}
          {(aiLoading || aiComment) && (
            <View style={styles.aiCard}>
              <View style={styles.aiCardHeader}>
                <View style={styles.aiCardIcon}>
                  <Text style={styles.aiCardIconText}>✦</Text>
                </View>
                <View>
                  <Text style={styles.aiCardTitle}>GPT-4o lifestyle insight</Text>
                  <Text style={styles.aiCardSub}>Based on your lifestyle description</Text>
                </View>
              </View>
              {aiLoading
                ? <View style={styles.aiLoadingRow}>
                    <ActivityIndicator size="small" color={colors.blue} />
                    <Text style={styles.aiLoadingText}>Analysing your response...</Text>
                  </View>
                : <Text style={styles.aiCardText}>{aiComment}</Text>
              }
              <Text style={styles.aiDisclaimer}>Not medical advice · GPT-4o mini</Text>
            </View>
          )}

          {/* EXISTING: What-if simulator — composite kept + FINDRISC added */}
          {result && simulatedComposite && (
            <View style={styles.simulatorCard}>
              <Text style={styles.simulatorTitle}>What-if simulator</Text>
              <Text style={styles.simulatorSubtitle}>
                Try healthier changes and see how your predicted risk changes instantly.
              </Text>

              <View style={styles.simRow}>
                <Text style={styles.simLabel}>Exercise days per week</Text>
                <Text style={styles.simValue}>{simExercise}</Text>
              </View>
              <Slider
                minimumValue={0} maximumValue={7} step={1}
                value={simExercise ?? 0}
                onValueChange={setSimExercise}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.gray5}
                thumbTintColor={colors.accent}
              />

              <View style={styles.simRow}>
                <Text style={styles.simLabel}>Sleep hours per night</Text>
                <Text style={styles.simValue}>{simSleep}</Text>
              </View>
              <Slider
                minimumValue={3} maximumValue={12} step={0.5}
                value={simSleep ?? 3}
                onValueChange={setSimSleep}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.gray5}
                thumbTintColor={colors.accent}
              />

              <View style={styles.simRow}>
                <Text style={styles.simLabel}>Diet quality</Text>
                <Text style={styles.simValue}>{simDiet} / 5</Text>
              </View>
              <Slider
                minimumValue={1} maximumValue={5} step={1}
                value={simDiet ?? 1}
                onValueChange={setSimDiet}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.gray5}
                thumbTintColor={colors.accent}
              />

              {/* EXISTING: composite result box — unchanged */}
              <View style={styles.simResultBox}>
                <Text style={styles.simResultTitle}>Simulated result</Text>
                <Text style={styles.simResultText}>
                  Objective risk: <Text style={{ fontWeight: '700' }}>{simulatedObjectiveRisk}</Text>
                </Text>
                <Text style={styles.simResultText}>
                  Composite score: <Text style={{ fontWeight: '700' }}>{simulatedComposite.score}</Text>
                </Text>
                {scoreDelta !== null && (
                  <Text style={styles.simResultDelta}>
                    {scoreDelta < 0
                      ? `Nice — your simulated score improves by ${Math.abs(scoreDelta)} point(s).`
                      : scoreDelta > 0
                      ? `This simulated change increases your score by ${scoreDelta} point(s).`
                      : 'No change in score with the current simulation.'}
                  </Text>
                )}
              </View>

              {/* ADD: FINDRISC simulator result box */}
              {simFINDRISCScore !== null && (
                <View style={[styles.simResultBox, { marginTop: 10, borderColor: findriscColor + '40' }]}>
                  <Text style={styles.simResultTitle}>Simulated FINDRISC score</Text>
                  <Text style={styles.simResultText}>
                    FINDRISC score: <Text style={{ fontWeight: '700' }}>{simFINDRISCScore} / 26</Text>
                  </Text>
                  <Text style={styles.simResultText}>
                    Risk category: <Text style={{ fontWeight: '700', color: findriscColor }}>{simFINDRISCBucket}</Text>
                  </Text>
                  {findriscDelta !== null && (
                    <Text style={[styles.simResultDelta, {
                      color: findriscDelta < 0 ? colors.accent : findriscDelta > 0 ? colors.danger : colors.gray3,
                    }]}>
                      {findriscDelta < 0
                        ? `↓ ${Math.abs(findriscDelta)} points lower than your submitted FINDRISC score.`
                        : findriscDelta > 0
                        ? `↑ ${findriscDelta} points higher than your submitted FINDRISC score.`
                        : 'No change in FINDRISC score with the current simulation.'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* EXISTING: What does this mean — unchanged */}
          <View style={styles.explainerCard}>
            <Text style={styles.explainerTitle}>What does this mean?</Text>
            <Text style={styles.explainerText}>
              Your <Text style={{ fontWeight: '700' }}>reliability label</Text> compares how you perceive your diabetes risk against your FINDRISC clinical score.{'\n\n'}
              <Text style={{ fontWeight: '700' }}>Aligned</Text> means your perception matches your indicators.{'\n'}
              <Text style={{ fontWeight: '700' }}>Underestimate</Text> means you may be underestimating your risk.{'\n'}
              <Text style={{ fontWeight: '700' }}>Overestimate</Text> means you may be overestimating your risk.
            </Text>
          </View>

          {/* EXISTING: Thank you box — unchanged */}
          <View style={styles.thankYouBox}>
            <Text style={styles.thankYouTitle}>Thank you for participating</Text>
            <Text style={styles.thankYouText}>
              Your anonymous response has been saved to the research database. This helps NTU researchers understand health risk perception across demographics.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              dispatch({ type: 'RESET' });
              setResult(null);
              setAiComment(null);
              navigation.navigate('Welcome');
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.resetBtnText}>Submit another response</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Results are based on the FINDRISC clinical scoring tool and are not a clinical assessment. Consult a GP for medical advice.
          </Text>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── FORM SCREEN ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar step={3} total={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.stepTag}>STEP 3 OF 4</Text>
        <Text style={styles.title}>Health risk perception</Text>
        <Text style={styles.subtitle}>Almost done — this is the most important section</Text>

        {/* EXISTING: Risk selector — unchanged */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How likely are you to develop type 2 diabetes?</Text>
          <Text style={styles.sectionHint}>Tap a number to select</Text>
          <View style={styles.riskButtonsRow}>
            {RISK_LABELS.map(r => (
              <TouchableOpacity
                key={r.score}
                style={[
                  styles.riskBtn,
                  form.perceived_diabetes_risk === r.score && { backgroundColor: r.color, borderColor: r.color },
                ]}
                onPress={() => update('perceived_diabetes_risk', r.score)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.riskBtnNum,
                  form.perceived_diabetes_risk === r.score && { color: colors.white },
                ]}>
                  {r.score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedRisk && (
            <View style={[styles.riskLabelPill, { backgroundColor: selectedRisk.color + '20' }]}>
              <Text style={[styles.riskLabelText, { color: selectedRisk.color }]}>
                {selectedRisk.label}
              </Text>
            </View>
          )}
          <View style={styles.riskScaleRow}>
            <Text style={styles.riskScaleText}>1 = very unlikely</Text>
            <Text style={styles.riskScaleText}>5 = very likely</Text>
          </View>
        </View>

        {/* EXISTING: Height & Weight — unchanged */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Physical measurements</Text>
          <Text style={styles.sectionHint}>Used to compute your BMI as an objective health indicator</Text>
          <View style={styles.measureRow}>
            <View style={styles.measureField}>
              <Text style={styles.measureLabel}>HEIGHT (CM)</Text>
              <TextInput
                style={styles.measureInput}
                keyboardType="numeric"
                value={form.height_cm === '' ? '' : String(form.height_cm)}
                onChangeText={v => update('height_cm', v === '' ? '' : parseInt(v) || '')}
                placeholder="170"
                placeholderTextColor={colors.gray4}
                maxLength={3}
              />
            </View>
            <View style={styles.measureField}>
              <Text style={styles.measureLabel}>WEIGHT (KG)</Text>
              <TextInput
                style={styles.measureInput}
                keyboardType="numeric"
                value={form.weight_kg === '' ? '' : String(form.weight_kg)}
                onChangeText={v => update('weight_kg', v === '' ? '' : parseInt(v) || '')}
                placeholder="70"
                placeholderTextColor={colors.gray4}
                maxLength={3}
              />
            </View>
          </View>

          {/* EXISTING: Live BMI preview — unchanged */}
          {liveBMI && (
            <View style={[styles.bmiPreview, { borderColor: bmiColor + '40' }]}>
              <View>
                <Text style={styles.bmiPreviewLabel}>LIVE BMI</Text>
                <Text style={[styles.bmiPreviewValue, { color: bmiColor }]}>{liveBMI.toFixed(1)}</Text>
              </View>
              <View style={styles.bmiCategoryWrap}>
                <View style={[styles.bmiCategoryPill, { backgroundColor: bmiColor + '15' }]}>
                  <Text style={[styles.bmiCategoryText, { color: bmiColor }]}>{bmiCategory}</Text>
                </View>
                <Text style={styles.bmiNote}>BMI under 25 is considered healthy weight</Text>
              </View>
            </View>
          )}

          {/* ADD: Live FINDRISC preview — appears below BMI when height/weight entered */}
          {liveFINDRISC !== null && (
            <View style={[styles.bmiPreview, { borderColor: findriscColor + '40', marginTop: 10 }]}>
              <View>
                <Text style={styles.bmiPreviewLabel}>FINDRISC SCORE</Text>
                <Text style={[styles.bmiPreviewValue, { color: findriscColor }]}>
                  {liveFINDRISC}
                  <Text style={{ fontSize: 14, color: colors.gray3, fontWeight: '400' }}> / 26</Text>
                </Text>
              </View>
              <View style={styles.bmiCategoryWrap}>
                <View style={[styles.bmiCategoryPill, { backgroundColor: findriscColor + '15' }]}>
                  <Text style={[styles.bmiCategoryText, { color: findriscColor }]}>
                    {liveFINDRISCBucket === 'low'    ? 'Low risk'
                   : liveFINDRISCBucket === 'medium' ? 'Moderate risk'
                   : 'High risk'}
                  </Text>
                </View>
                <Text style={styles.bmiNote}>{findriscLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ADD: Clinical history card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Clinical history</Text>
          <Text style={styles.sectionHint}>
            These three questions are part of the validated FINDRISC diabetes risk score used by the NHS and WHO
          </Text>

          <YesNoToggle
            label="Do you take medication for high blood pressure?"
            value={form.bp_medication}
            onToggle={v => update('bp_medication', v)}
          />
          <YesNoToggle
            label="Has a doctor ever told you your blood sugar was high?"
            value={form.high_glucose_history}
            onToggle={v => update('high_glucose_history', v)}
          />
          <YesNoToggle
            label="Does a parent or sibling have type 2 diabetes?"
            value={form.family_history}
            onToggle={v => update('family_history', v)}
          />
        </View>

        {/* EXISTING: Nav row — unchanged */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }, shadows.accent]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.submitText}>Submit and see results</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// EXISTING: ResultStat component — unchanged
function ResultStat({ label, value, sub, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, padding: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: color || colors.black }}>{value || '—'}</Text>
      {sub && <Text style={{ fontSize: 11, color: colors.gray3, marginTop: 1 }}>{sub}</Text>}
      <Text style={{ fontSize: 11, color: colors.gray3, marginTop: 3, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// EXISTING: All styles — unchanged + two new ones added at the bottom
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingBottom: 48 },
  resultScroll: { padding: 24, paddingBottom: 52 },
  stepTag: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1.2, marginBottom: 6, marginTop: 6 },
  title: { fontSize: 28, fontWeight: '800', color: colors.black, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.gray2, lineHeight: 21, marginBottom: 20 },

  sectionCard: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: colors.gray5,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.black, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: colors.gray3, marginBottom: 14 },

  riskButtonsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  riskBtn: {
    flex: 1, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.gray5,
    backgroundColor: colors.bgSurface,
  },
  riskBtnNum: { fontSize: 16, fontWeight: '700', color: colors.gray2 },
  riskLabelPill: {
    alignSelf: 'flex-start', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20, marginBottom: 8,
  },
  riskLabelText: { fontSize: 12, fontWeight: '600' },
  riskScaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  riskScaleText: { fontSize: 11, color: colors.gray4 },

  measureRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  measureField: { flex: 1 },
  measureLabel: { fontSize: 9, fontWeight: '700', color: colors.gray3, letterSpacing: 1, marginBottom: 6 },
  measureInput: {
    borderWidth: 1.5, borderColor: colors.gray5,
    borderRadius: 12, padding: 14,
    fontSize: 20, fontWeight: '700', color: colors.black,
    backgroundColor: colors.bgSurface, textAlign: 'center',
  },
  bmiPreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgSurface, borderRadius: 12,
    padding: 14, borderWidth: 1,
  },
  bmiPreviewLabel: { fontSize: 9, fontWeight: '700', color: colors.gray3, letterSpacing: 1, marginBottom: 2 },
  bmiPreviewValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  bmiCategoryWrap: { alignItems: 'flex-end' },
  bmiCategoryPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  bmiCategoryText: { fontSize: 13, fontWeight: '700' },
  bmiNote: { fontSize: 10, color: colors.gray4, textAlign: 'right' },

  navRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  backBtn: {
    flex: 1, padding: 16, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.gray5,
  },
  backText: { fontSize: 14, color: colors.gray2, fontWeight: '600' },
  submitBtn: {
    flex: 2, backgroundColor: colors.black,
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '700' },

  resultHeading: { fontSize: 30, fontWeight: '800', color: colors.black, marginBottom: 18, letterSpacing: -0.5 },
  resultCard: { borderWidth: 1.5, borderRadius: 18, padding: 18, marginBottom: 14 },
  resultBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 20, marginBottom: 12,
  },
  resultBadgeText: { color: colors.white, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  resultDesc: { fontSize: 14, color: colors.gray2, lineHeight: 21, marginBottom: 16 },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  statDivider: { width: 1, backgroundColor: colors.border },

  aiCard: {
    backgroundColor: colors.blueLight, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#C0D8F5', marginBottom: 14,
  },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  aiCardIcon: {
    width: 32, height: 32, backgroundColor: colors.blue,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  aiCardIconText: { fontSize: 13, color: colors.white },
  aiCardTitle: { fontSize: 13, fontWeight: '700', color: colors.blue },
  aiCardSub: { fontSize: 11, color: '#5A88C0' },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  aiLoadingText: { fontSize: 13, color: '#5A88C0', fontStyle: 'italic' },
  aiCardText: { fontSize: 13, color: '#1a3a6a', lineHeight: 20, marginBottom: 8 },
  aiDisclaimer: { fontSize: 10, color: '#5A88C0' },

  explainerCard: {
    backgroundColor: colors.bgSurface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.gray5, marginBottom: 14,
  },
  explainerTitle: { fontSize: 14, fontWeight: '700', color: colors.black, marginBottom: 8 },
  explainerText: { fontSize: 13, color: colors.gray2, lineHeight: 20 },

  thankYouBox: {
    backgroundColor: colors.accentLight, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#B3E8D8', marginBottom: 16,
  },
  thankYouTitle: { fontSize: 14, fontWeight: '700', color: colors.accentDark, marginBottom: 6 },
  thankYouText: { fontSize: 13, color: '#2A6B5A', lineHeight: 20 },

  resetBtn: {
    backgroundColor: colors.black, padding: 17,
    borderRadius: 14, alignItems: 'center', marginBottom: 14,
  },
  resetBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: colors.gray4, textAlign: 'center', lineHeight: 17, marginBottom: 8 },

  simulatorCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.gray5, marginBottom: 14,
  },
  simulatorTitle: { fontSize: 15, fontWeight: '700', color: colors.black, marginBottom: 4 },
  simulatorSubtitle: { fontSize: 12, color: colors.gray3, lineHeight: 18, marginBottom: 14 },
  simRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 8, marginBottom: 4,
  },
  simLabel: { fontSize: 13, color: colors.black, fontWeight: '600' },
  simValue: { fontSize: 13, color: colors.accent, fontWeight: '700' },
  simResultBox: {
    marginTop: 16, padding: 14, borderRadius: 12,
    backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.gray5,
  },
  simResultTitle: { fontSize: 13, fontWeight: '700', color: colors.black, marginBottom: 6 },
  simResultText: { fontSize: 13, color: colors.gray2, marginBottom: 4 },
  simResultDelta: { fontSize: 12, color: colors.accentDark, marginTop: 6, lineHeight: 18 },
});