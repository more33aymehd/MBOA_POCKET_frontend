import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { budgetService } from '../../services/budgetService';
import { useAuth } from '../../context/AuthContext';
import { formatFCFA } from '../../utils/format';
import KeyboardLayout from '../../components/KeyboardLayout';

const CHIPS = [50000, 100000, 150000, 200000];

export default function SetupBudgetScreen({ navigation }) {
  const { token } = useAuth();
  const [step, setStep] = useState('revenu');
  const [montant, setMontant] = useState('');
  const [epargne, setEpargne] = useState('');
  const [loading, setLoading] = useState(false);

  const montantNum = parseInt(montant.replace(/\s/g, ''), 10) || 0;
  const epargneNum = parseInt(epargne.replace(/\s/g, ''), 10) || 0;
  const stepNum = step === 'revenu' ? 1 : 2;
  const progressW = step === 'revenu' ? '50%' : '100%';
  const currentValue = step === 'revenu' ? montant : epargne;
  const currentSet = step === 'revenu' ? setMontant : setEpargne;

  async function handleContinuer() {
    if (step === 'revenu') {
      if (montantNum < 1000) return Alert.alert('Montant invalide', "Entrez un revenu d'au moins 1 000 FCFA.");
      setStep('epargne');
      return;
    }
    try {
      setLoading(true);
      let income = montantNum;
      try {
        await budgetService.create(token, { montantTotal: montantNum, objectifEpargne: epargneNum });
      } catch (createErr) {
        if (createErr.message?.includes('existe déjà')) {
          const existing = await budgetService.getCurrent(token);
          income = existing?.montantTotal ?? montantNum;
        } else throw createErr;
      }
      navigation.navigate('Questionnaire', { income: String(income) });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardLayout>
        <View style={styles.inner}>
          {/* Barre de progression */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => step === 'epargne' ? setStep('revenu') : navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.progressWrapper}>
              <Text style={styles.stepLabel}>Étape {stepNum} sur 2</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressW }]} />
              </View>
            </View>
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {step === 'revenu' ? 'Quel est votre revenu mensuel ?' : "Objectif d'épargne mensuel ?"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'revenu'
                ? 'Cette information reste privée et nous aide à mieux vous conseiller'
                : 'Combien souhaitez-vous mettre de côté chaque mois ?'}
            </Text>

            {/* Saisie montant */}
            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={currentValue}
                  onChangeText={currentSet}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleContinuer}
                />
                <Text style={styles.currency}>FCFA</Text>
              </View>
              <View style={styles.underline} />
            </View>

            {/* Chips rapides */}
            <View style={styles.chipsRow}>
              {CHIPS.map(v => {
                const active = parseInt(currentValue) === v;
                return (
                  <TouchableOpacity key={v} style={[styles.chip, active && styles.chipActive]} onPress={() => currentSet(String(v))}>
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{(v / 1000).toFixed(0)}K</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {step === 'epargne' && montantNum > 0 && (
              <Text style={styles.hint}>Budget disponible : {formatFCFA(montantNum - epargneNum)}</Text>
            )}
          </View>

          {/* Bouton */}
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleContinuer} disabled={loading}>
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnLabel}>{step === 'revenu' ? 'Continuer' : 'Valider mon budget'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardLayout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  inner: { flex: 1, paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 16, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
  },
  progressWrapper: { flex: 1, gap: 4 },
  stepLabel: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  content: { flex: 1, paddingTop: 32, gap: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  amountSection: { alignItems: 'center', gap: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  amountInput: { fontSize: 48, fontWeight: '700', color: Colors.textPrimary, minWidth: 80, textAlign: 'right' },
  currency: { fontSize: 20, fontWeight: '500', color: Colors.textSecondary, paddingBottom: 6 },
  underline: { width: 200, height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.accent },
  chipActive: { backgroundColor: Colors.primary },
  chipLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  chipLabelActive: { color: Colors.white },
  hint: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    marginTop: 16, ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '500' },
});
