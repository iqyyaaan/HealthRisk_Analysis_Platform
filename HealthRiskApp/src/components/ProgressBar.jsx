import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const STEP_LABELS = ['Demographics', 'Lifestyle', 'Risk perception', 'Results'];

export default function ProgressBar({ step, total }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length: total }, (_, i) => i + 1).map((s, i) => (
          <React.Fragment key={s}>
            <View style={[styles.dot, s < step && styles.dotDone, s === step && styles.dotActive]}>
              {s < step
                ? <Text style={styles.check}>✓</Text>
                : s === step
                  ? <View style={styles.dotInner} />
                  : <Text style={styles.dotNum}>{s}</Text>
              }
            </View>
            {i < total - 1 && (
              <View style={[styles.line, s < step && styles.lineDone]} />
            )}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.label}>{STEP_LABELS[step - 1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 28, paddingTop: 14, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: colors.gray5,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { borderColor: colors.accent },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  check: { fontSize: 11, color: colors.white, fontWeight: '700' },
  dotNum: { fontSize: 10, color: colors.gray4, fontWeight: '600' },
  line: { flex: 1, height: 2, backgroundColor: colors.gray5, marginHorizontal: 4 },
  lineDone: { backgroundColor: colors.accent },
  label: { fontSize: 12, fontWeight: '600', color: colors.gray3 },
});