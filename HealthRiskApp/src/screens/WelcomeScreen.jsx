import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { colors, shadows } from '../theme';

const FEATURES = [
  { label: 'Fully anonymous', sub: 'No names, emails, or identifiers collected' },
  { label: 'AI-powered insight', sub: 'GPT-4o analyses your lifestyle response' },
  { label: 'Instant result', sub: 'See your BMI and risk calibration score live' },
  { label: 'Research-backed', sub: 'Contributes to NTU health perception study' },
];

export default function WelcomeScreen({ navigation }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>

          {/* Header chip */}
          <View style={styles.chip}>
            <View style={styles.chipDot} />
            <Text style={styles.chipText}>NTU COMPUTER SCIENCE · FYP 2025</Text>
          </View>

          {/* Hero */}
          <Text style={styles.title}>Understand{'\n'}your health{'\n'}risk.</Text>
          <Text style={styles.subtitle}>
            A 2-minute anonymous questionnaire using AI to analyse how accurately you perceive your own health risks.
          </Text>

          {/* Feature cards */}
          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureCard, shadows.sm]}>
                <View style={styles.featureIconWrap}>
                  <View style={styles.featureIcon} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            ))}
          </View>

          {/* Stats strip */}
          <View style={[styles.statsStrip, shadows.sm]}>
            <StatItem value="2 min" label="to complete" />
            <View style={styles.statDivider} />
            <StatItem value="4" label="short sections" />
            <View style={styles.statDivider} />
            <StatItem value="0" label="personal data" />
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, shadows.accent]}
            onPress={() => navigation.navigate('Demographics')}
            activeOpacity={0.88}
          >
            <Text style={styles.btnText}>Begin questionnaire</Text>
            <Text style={styles.btnArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            All responses are pseudonymous and used solely for academic research at Nottingham Trent University.
          </Text>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ value, label }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 28, paddingTop: 52, paddingBottom: 52 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 24,
    backgroundColor: colors.accentLight,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  chipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  chipText: { fontSize: 9, fontWeight: '700', color: colors.accentDark, letterSpacing: 0.8 },
  title: {
    fontSize: 38, fontWeight: '800', color: colors.black,
    lineHeight: 44, marginBottom: 14, letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15, color: colors.gray2, lineHeight: 23,
    marginBottom: 28,
  },
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
  },
  featureCard: {
    width: '47%', backgroundColor: colors.white,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.gray5,
  },
  featureIconWrap: { marginBottom: 10 },
  featureIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.accentLight,
  },
  featureLabel: { fontSize: 13, fontWeight: '700', color: colors.black, marginBottom: 3 },
  featureSub: { fontSize: 11, color: colors.gray3, lineHeight: 16 },
  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.gray5,
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.accent, marginBottom: 2 },
  statLabel: { fontSize: 10, color: colors.gray3, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.gray5 },
  btn: {
    backgroundColor: colors.black, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    marginBottom: 18,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: 0.2 },
  btnArrow: { fontSize: 18, color: 'rgba(255,255,255,0.6)' },
  footer: {
    fontSize: 11, color: colors.gray3,
    textAlign: 'center', lineHeight: 17,
  },
});