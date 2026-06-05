import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet,  ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { formatFCFA } from '../../utils/format';

const METHOD_LABELS = {
  ORANGE_MONEY: { label: 'Orange Money', color: '#FF6B00' },
  MTN_MOMO: { label: 'MTN MoMo', color: '#FFC200' },
  CASH: { label: 'Cash', color: '#6B7280' },
  MOCK: { label: 'Simulateur', color: Colors.primary },
};

const CONFETTI = [Colors.secondary, Colors.primary, Colors.danger, '#3B82F6', '#8B5CF6'];

export default function SuccesPaiementScreen({ navigation, route }) {
  const params = route.params ?? {};
  const montant = parseInt(params.montant ?? '0', 10);
  const restant = parseInt(params.categoryRestant ?? '0', 10);
  const alloue = parseInt(params.categoryAlloue ?? '1', 10);
  const progress = alloue > 0 ? Math.min(((alloue - restant) / alloue) * 100, 100) : 0;
  const method = METHOD_LABELS[params.methode ?? ''] ?? { label: params.methode, color: Colors.primary };

  const now = new Date();
  const dateLabel = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' · ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const rows = [
    { label: 'Marchand', value: params.merchantName ?? 'Marchand' },
    { label: 'Montant', value: formatFCFA(montant), color: Colors.primary, large: true },
    { label: 'Date', value: dateLabel },
    { label: 'Référence', value: params.reference ?? '#---' },
    { label: 'Via', value: method.label, color: method.color },
    { label: 'Zone', value: `${params.categoryIcone} ${params.categoryNom}` },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons name="check" size={40} color={Colors.white} />
          </View>
          <View style={styles.confettiRow}>
            {CONFETTI.map((c, i) => <View key={i} style={[styles.confettiDot, { backgroundColor: c }]} />)}
          </View>
          <Text style={styles.successTitle}>Paiement réussi ! 🎉</Text>
          <Text style={styles.successSub}>Votre budget a été mis à jour automatiquement</Text>
        </View>

        <View style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>Reçu de paiement</Text>
          {rows.map(r => (
            <View key={r.label} style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{r.label}</Text>
              <Text style={[styles.receiptValue, r.large && styles.receiptValueLarge, r.color && { color: r.color }]}>
                {r.value}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Budget {params.categoryNom}</Text>
              <Text style={styles.progressValue}>{formatFCFA(alloue - restant)} / {formatFCFA(alloue)}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.newPayBtn} onPress={() => navigation.replace('Pay')}>
            <MaterialCommunityIcons name="plus" size={16} color={Colors.white} />
            <Text style={styles.newPayLabel}>Nouveau paiement</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.homeLink} onPress={() => navigation.replace('MainTabs')}>
          <Text style={styles.homeLinkText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingTop: 32, paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: 32, gap: 16 },
  topSection: { alignItems: 'center', gap: 12, paddingBottom: 8 },
  checkCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 12,
  },
  confettiRow: { flexDirection: 'row', gap: 6 },
  confettiDot: { width: 8, height: 8, borderRadius: 4 },
  successTitle: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  successSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  receiptCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, gap: 0, ...Shadows.card },
  receiptTitle: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  receiptLabel: { fontSize: 13, color: Colors.textSecondary },
  receiptValue: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  receiptValueLarge: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  progressSection: { gap: 6, paddingTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: Colors.textSecondary },
  progressValue: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 6, backgroundColor: Colors.accent, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 99 },
  actions: { flexDirection: 'row' },
  newPayBtn: {
    flex: 1, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.button, backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  newPayLabel: { fontSize: 13, fontWeight: '500', color: Colors.white },
  homeLink: { alignItems: 'center' },
  homeLinkText: { fontSize: 14, fontWeight: '500', color: Colors.primary },
});
