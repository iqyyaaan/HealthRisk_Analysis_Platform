import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, TextInput, Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useForm } from '../context/FormContext';
import ProgressBar from '../components/ProgressBar';
import { colors, shadows } from '../theme';

function getAITip(form) {
  const { exercise_days, sleep_hours, stress_level, diet_quality } = form;
  if (stress_level >= 4 && sleep_hours < 6)
    return 'High stress and low sleep together significantly raise metabolic risk. Even small changes to sleep duration can help.';
  if (exercise_days >= 5 && diet_quality >= 4)
    return 'Excellent combination of exercise and diet. These are the two strongest predictors of low diabetes risk.';
  if (exercise_days <= 1)
    return 'Low physical activity is one of the strongest predictors of elevated diabetes risk. Even 20-minute daily walks make a measurable difference.';
  if (sleep_hours < 6)
    return 'Consistently sleeping under 6 hours raises cortisol and blood sugar levels. Aim for 7–9 hours where possible.';
  if (diet_quality <= 2)
    return 'Diet quality is a strong predictor of health outcomes. Small consistent improvements have large long-term effects.';
  if (stress_level >= 4)
    return 'Chronic high stress elevates inflammation markers linked to metabolic disease. Consider stress management techniques.';
  return 'Your lifestyle looks reasonably balanced. Maintaining consistency across all areas is key to long-term health.';
}

export default function LifestyleScreen({ navigation }) {
  const { form, dispatch } = useForm();
  const [tip, setTip] = useState(getAITip(form));
  const tipFade = useRef(new Animated.Value(1)).current;
  const update = (field, value) => dispatch({ type: 'UPDATE', field, value });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(tipFade, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(tipFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setTip(getAITip(form));
  }, [form.exercise_days, form.sleep_hours, form.stress_level, form.diet_quality]);

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar step={2} total={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.stepTag}>STEP 2 OF 4</Text>
        <Text style={styles.title}>Your lifestyle</Text>
        <Text style={styles.subtitle}>Approximate answers are fine. Adjust the sliders and watch the AI tip update.</Text>

        <SliderCard
          label="Exercise days per week"
          value={form.exercise_days}
          min={0} max={7} step={1}
          display={`${form.exercise_days} days`}
          onChange={v => update('exercise_days', Math.round(v))}
        />
        <SliderCard
          label="Sleep hours per night"
          value={form.sleep_hours}
          min={3} max={12} step={0.5}
          display={`${form.sleep_hours} hrs`}
          onChange={v => update('sleep_hours', parseFloat(v.toFixed(1)))}
        />
        <SliderCard
          label="Stress level"
          value={form.stress_level}
          min={1} max={5} step={1}
          display={`${form.stress_level} / 5`}
          hint="1 = very low  ·  5 = very high"
          onChange={v => update('stress_level', Math.round(v))}
        />
        <SliderCard
          label="Diet quality"
          value={form.diet_quality}
          min={1} max={5} step={1}
          display={`${form.diet_quality} / 5`}
          hint="1 = poor  ·  5 = excellent"
          onChange={v => update('diet_quality', Math.round(v))}
        />

        {/* Live AI tip */}
        <Animated.View style={[styles.aiBox, { opacity: tipFade }]}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconWrap}>
              <Text style={styles.aiIcon}>✦</Text>
            </View>
            <Text style={styles.aiLabel}>AI LIFESTYLE TIP</Text>
          </View>
          <Text style={styles.aiText}>{tip}</Text>
          <Text style={styles.aiNote}>Updates as you adjust sliders · Powered by local analysis</Text>
        </Animated.View>

        {/* Lifestyle text */}
        <View style={styles.textSection}>
          <Text style={styles.textLabel}>DESCRIBE YOUR LIFESTYLE <Text style={styles.optional}>(optional)</Text></Text>
          <Text style={styles.textHint}>1–2 sentences. Used for GPT-4o deep analysis on your result screen.</Text>
          <TextInput
            style={styles.textarea}
            value={form.lifestyle_text}
            onChangeText={v => update('lifestyle_text', v)}
            placeholder="e.g. I walk to work daily but eat late and rarely cook fresh food..."
            placeholderTextColor={colors.gray4}
            multiline
            numberOfLines={3}
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{form.lifestyle_text.length} / 300</Text>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.nextBtn, shadows.accent]} onPress={() => navigation.navigate('Risk')} activeOpacity={0.88}>
            <Text style={styles.nextText}>Continue →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SliderCard({ label, value, min, max, step, display, hint, onChange }) {
  return (
    <View style={styles.sliderCard}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <View style={styles.valuePill}>
          <Text style={styles.valueText}>{display}</Text>
        </View>
      </View>
      {hint && <Text style={styles.sliderHint}>{hint}</Text>}
      <Slider
        minimumValue={min} maximumValue={max} step={step} value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.gray5}
        thumbTintColor={colors.accent}
        style={{ marginTop: 6, marginHorizontal: -4 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingBottom: 48 },
  stepTag: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1.2, marginBottom: 6, marginTop: 6 },
  title: { fontSize: 28, fontWeight: '800', color: colors.black, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.gray2, lineHeight: 21, marginBottom: 20 },
  sliderCard: {
    backgroundColor: colors.white,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.gray5,
    marginBottom: 10,
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderLabel: { fontSize: 14, fontWeight: '600', color: colors.black, flex: 1 },
  sliderHint: { fontSize: 11, color: colors.gray3, marginTop: 2 },
  valuePill: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  valueText: { fontSize: 12, fontWeight: '700', color: colors.accentDark },
  aiBox: {
    backgroundColor: colors.accentLight,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#B3E8D8',
    marginBottom: 20, marginTop: 4,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiIconWrap: {
    width: 24, height: 24, backgroundColor: colors.accent,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  aiIcon: { fontSize: 11, color: colors.white },
  aiLabel: { fontSize: 10, fontWeight: '700', color: colors.accentDark, letterSpacing: 0.8 },
  aiText: { fontSize: 13, color: '#1a5a48', lineHeight: 20, marginBottom: 6 },
  aiNote: { fontSize: 10, color: colors.accent, opacity: 0.6 },
  textSection: { marginBottom: 28 },
  textLabel: { fontSize: 10, fontWeight: '700', color: colors.gray3, letterSpacing: 1, marginBottom: 4 },
  optional: { fontSize: 10, fontWeight: '400', color: colors.gray4 },
  textHint: { fontSize: 12, color: colors.gray3, marginBottom: 8, lineHeight: 17 },
  textarea: {
    borderWidth: 1, borderColor: colors.gray5,
    borderRadius: 12, padding: 14,
    fontSize: 14, color: colors.black,
    minHeight: 90, backgroundColor: colors.bgSurface,
  },
  charCount: { fontSize: 11, color: colors.gray4, textAlign: 'right', marginTop: 4 },
  navRow: { flexDirection: 'row', gap: 12 },
  backBtn: {
    flex: 1, padding: 16, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.gray5,
  },
  backText: { fontSize: 14, color: colors.gray2, fontWeight: '600' },
  nextBtn: {
    flex: 2, backgroundColor: colors.black,
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  nextText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});