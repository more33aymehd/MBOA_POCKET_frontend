import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAiFlow } from '../../context/AiFlowContext';
import { aiService } from '../../services/aiService';
import { formatFCFA } from '../../utils/format';

export default function PropositionIAScreen({ navigation }) {
  const { token } = useAuth();
  const { proposal, reset } = useAiFlow();
  const [categories, setCategories] = useState(proposal?.categories ?? []);
  const [loading, setLoading] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editValue, setEditValue] = useState('');

  const total = categories.reduce((s, c) => s + c.montantAlloue, 0);

  function openEdit(idx) {
    setEditingIdx(idx);
    setEditValue(String(categories[idx].montantAlloue));
  }

  function confirmEdit() {
    if (editingIdx === null) return;
    const v = parseInt(editValue, 10);
    if (isNaN(v) || v <= 0) return;
    setCategories(prev => prev.map((c, i) => i === editingIdx ? { ...c, montantAlloue: v } : c));
    setEditingIdx(null);
  }

  async function handleValidate() {
    try {
      setLoading(true);
      await aiService.saveAllocation(token, categories);
      reset();
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!proposal) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Aucune proposition disponible.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '90%' }]} />
        </View>
      </View>

      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Votre budget personnalisé</Text>
          <MaterialCommunityIcons name="shimmer" size={22} color={Colors.secondary} />
        </View>
        <Text style={styles.subtitle}>Basé sur vos réponses, voici notre suggestion</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {proposal.conseil && (
          <View style={styles.conseilCard}>
            <View style={styles.conseilHeader}>
              <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.primary} />
              <Text style={styles.conseilTitle}>Conseil de l'IA</Text>
            </View>
            <Text style={styles.conseilText}>{proposal.conseil}</Text>
          </View>
        )}

        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} style={styles.card} onPress={() => openEdit(idx)}>
            <View style={[styles.iconBg, { backgroundColor: (cat.couleur || Colors.primary) + '20' }]}>
              <Text style={styles.iconEmoji}>{cat.icone}</Text>
            </View>
            <View style={styles.cardTexts}>
              <Text style={styles.cardNom}>{cat.nom}</Text>
              <Text style={styles.cardPct}>{Math.round(cat.pourcentage ?? 0)}% du revenu</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardAmount}>{formatFCFA(cat.montantAlloue)}</Text>
              <MaterialCommunityIcons name="pencil" size={16} color={Colors.secondary} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Total alloué</Text>
          <View style={styles.totalRight}>
            <Text style={styles.totalAmount}>{formatFCFA(total)}</Text>
            <MaterialCommunityIcons name="check-circle" size={18} color={Colors.primary} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleValidate} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>Valider mon budget</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={editingIdx !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Modifier {editingIdx !== null ? categories[editingIdx]?.nom : ''}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.modalHint}>Montant en FCFA</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditingIdx(null)}>
                <Text style={styles.modalCancelLabel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmEdit}>
                <Text style={styles.modalConfirmLabel}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, color: Colors.textSecondary },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 12,
  },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 99 },
  headerSection: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 16, paddingBottom: 4, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  scroll: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 12, paddingBottom: 24, gap: 10 },
  conseilCard: {
    backgroundColor: Colors.accent, borderRadius: Radius.card, padding: 14, gap: 8,
    borderWidth: 1, borderColor: Colors.primary + '30', marginBottom: 4,
  },
  conseilHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  conseilTitle: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  conseilText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: Radius.card,
    padding: 14, paddingHorizontal: 16, ...Shadows.card,
  },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 20 },
  cardTexts: { flex: 1, gap: 2 },
  cardNom: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  cardPct: { fontSize: 12, color: Colors.textSecondary },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardAmount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.accent, borderRadius: Radius.input, padding: 14, paddingHorizontal: 16, marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  totalRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalAmount: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  bottom: { padding: Layout.screenPaddingHorizontal },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: '#00000060', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '80%', backgroundColor: Colors.white, borderRadius: Radius.card, padding: 24, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  modalInput: {
    height: Layout.inputHeight, backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.input, borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 16, fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center',
  },
  modalHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: {
    flex: 1, height: 44, borderRadius: Radius.input,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
  },
  modalCancelLabel: { fontSize: 14, color: Colors.textSecondary },
  modalConfirm: {
    flex: 1, height: 44, borderRadius: Radius.input,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  modalConfirmLabel: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
