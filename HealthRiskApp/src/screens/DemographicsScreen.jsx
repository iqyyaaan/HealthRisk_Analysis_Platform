import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useForm } from '../context/FormContext';
import ProgressBar from '../components/ProgressBar';
import { colors, shadows } from '../theme';

const AGE_BANDS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GENDERS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non_binary' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];
const EDUCATIONS = [
  { label: 'High school', value: 'high_school' },
  { label: 'Undergraduate', value: 'undergraduate' },
  { label: 'Postgraduate', value: 'postgraduate' },
  { label: 'Other', value: 'other' },
];

export default function DemographicsScreen({ navigation }) {
  const { form, dispatch } = useForm();
  const update = (field, value) => dispatch({ type: 'UPDATE', field, value });

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar step={1} total={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.stepTag}>STEP 1 OF 4</Text>
        <Text style={styles.title}>About you</Text>
        <Text style={styles.subtitle}>
          Used only for demographic bias analysis — never stored with any identifier.
        </Text>

        <PickerField
          label="Age band"
          value={form.age_band}
          onChange={v => update('age_band', v)}
          items={AGE_BANDS.map(b => ({ label: b, value: b }))}
        />
        <PickerField
          label="Gender"
          value={form.gender}
          onChange={v => update('gender', v)}
          items={GENDERS}
        />
        <PickerField
          label="Education level"
          value={form.education}
          onChange={v => update('education', v)}
          items={EDUCATIONS}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why we ask this</Text>
          <Text style={styles.infoText}>
            These fields help identify whether age, gender, or education level influence how accurately people perceive their own health risks — a core research question.
          </Text>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.nextBtn, shadows.accent]} onPress={() => navigation.navigate('Lifestyle')} activeOpacity={0.88}>
            <Text style={styles.nextText}>Continue →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function PickerField({ label, value, onChange, items }) {
  return (
    <View style={styles.fieldCard}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.picker}
          dropdownIconColor={colors.accent}
        >
          {items.map(i => (
            <Picker.Item key={i.value} label={i.label} value={i.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingBottom: 48 },
  stepTag: { fontSize: 10, fontWeight: '700', color: colors.accent, letterSpacing: 1.2, marginBottom: 6, marginTop: 6 },
  title: { fontSize: 28, fontWeight: '800', color: colors.black, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.gray2, lineHeight: 21, marginBottom: 24 },
  fieldCard: {
    backgroundColor: colors.white,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.gray5,
    marginBottom: 12,
  },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.gray3, letterSpacing: 1, marginBottom: 6 },
  pickerWrap: {
    backgroundColor: colors.bgSurface,
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.gray5,
  },
  picker: { color: colors.black },
  infoBox: {
    backgroundColor: colors.blueLight,
    borderRadius: 12, padding: 14,
    marginBottom: 28, marginTop: 4,
    borderWidth: 1, borderColor: '#D0E8FF',
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: colors.blue, marginBottom: 4 },
  infoText: { fontSize: 12, color: '#1a3a6a', lineHeight: 18 },
  navRow: { flexDirection: 'row', gap: 12 },
  backBtn: {
    flex: 1, padding: 16, borderRadius: 14,
    alignItems: 'center', borderWidth: 1,
    borderColor: colors.gray5,
  },
  backText: { fontSize: 14, color: colors.gray2, fontWeight: '600' },
  nextBtn: {
    flex: 2, backgroundColor: colors.black,
    padding: 16, borderRadius: 14, alignItems: 'center',
  },
  nextText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});