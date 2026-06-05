import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { categoryService } from '../../services/categoryService';
import { expenseService } from '../../services/expenseService';
import { budgetService } from '../../services/budgetService';
import { notificationService } from '../../services/notificationService';
import { formatFCFA } from '../../utils/format';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}h00`);

function todayLabel() {
  const d = new Date();
  return `Aujourd'hui — ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

function yesterdayRange() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SaisieCashScreen({ navigation }) {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [budget, setBudget] = useState(null);
  const [todayExpenses, setTodayExpenses] = useState([]);

  const [entries, setEntries] = useState([{
    montant: '', categoryId: null, description: '', heure: '14h00',
  }]);
  const [saving, setSaving] = useState(false);

  const now = new Date();

  const load = useCallback(async () => {
    if (!token) return;
    const [cats, bud, exps] = await Promise.all([
      categoryService.getAll(token).catch(() => []),
      budgetService.getCurrent(token).catch(() => null),
      expenseService.getByMonth(token, now.getMonth() + 1, now.getFullYear()).catch(() => []),
    ]);
    setCategories(cats ?? []);
    setBudget(bud);
    const todayStr = now.toISOString().split('T')[0];
    setTodayExpenses((exps ?? []).filter(e => e.date === todayStr));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function updateEntry(index, field, value) {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }

  function addEntry() {
    setEntries(prev => [...prev, { montant: '', categoryId: null, description: '', heure: '14h00' }]);
  }

  function removeEntry(index) {
    if (entries.length === 1) return;
    setEntries(prev => prev.filter((_, i) => i !== index));
  }

  async function handleValidate() {
    const valid = entries.filter(e => e.montant && Number(e.montant) > 0 && e.categoryId);
    if (!valid.length) { navigation.goBack(); return; }
    setSaving(true);
    try {
      const todayStr = now.toISOString().split('T')[0];
      const results = await Promise.all(valid.map(e =>
        expenseService.create(token, {
          montant: Number(e.montant),
          categoryId: e.categoryId,
          description: e.description || 'Dépense cash',
          date: todayStr,
        })
      ));
      const total = valid.reduce((s, e) => s + Number(e.montant), 0);
      const first = results[0];
      notificationService.notifyExpenseCreated({
        montant: total,
        categoryNom: valid.length > 1 ? `${valid.length} dépenses` : first?.categoryNom,
        categoryIcone: valid.length > 1 ? '💰' : first?.categoryIcone,
      });
      navigation.goBack();
    } catch { } finally {
      setSaving(false);
    }
  }

  const totalSaisie = entries.reduce((s, e) => s + (Number(e.montant) || 0), 0);
  const totalBudget = budget?.montantTotal ?? 0;
  const totalDepenses = categories.reduce((s, c) => s + (c.montantDepense ?? 0), 0);
  const restantAvant = totalBudget - totalDepenses;
  const restantApres = restantAvant - totalSaisie;

  const firstEntry = entries[0];
  const selectedCat = categories.find(c => c.id === firstEntry.categoryId);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saisir les dépenses cash</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <MaterialCommunityIcons name="information-outline" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              Entrez vos dépenses cash du jour pour garder votre budget à jour
            </Text>
          </View>

          <Text style={styles.dateLabel}>{todayLabel()}</Text>

          {/* Entries */}
          {entries.map((entry, idx) => (
            <View key={idx} style={styles.entryCard}>
              {entries.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeEntry(idx)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={Colors.danger} />
                </TouchableOpacity>
              )}

              {/* Amount */}
              <View style={styles.amountRow}>
                <TextInput
                  style={styles.amountInput}
                  value={entry.montant}
                  onChangeText={v => updateEntry(idx, 'montant', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#CBD5E1"
                />
                <Text style={styles.amountCurrency}>FCFA</Text>
                {entry.montant ? (
                  <TouchableOpacity onPress={() => updateEntry(idx, 'montant', '')} style={styles.resetBtn}>
                    <MaterialCommunityIcons name="close-circle-outline" size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Category */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, entry.categoryId === cat.id && styles.catChipActive]}
                    onPress={() => updateEntry(idx, 'categoryId', cat.id)}>
                    <Text style={[styles.catChipText, entry.categoryId === cat.id && styles.catChipTextActive]}>
                      {cat.icone} {cat.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Description */}
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="text" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  value={entry.description}
                  onChangeText={v => updateEntry(idx, 'description', v)}
                  placeholder="Description (ex: Marché, taxi...)"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              {/* Time */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {['08h00', '10h00', '12h00', '14h00', '16h00', '18h00', '20h00'].map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timeChip, entry.heure === h && styles.timeChipActive]}
                    onPress={() => updateEntry(idx, 'heure', h)}>
                    <Text style={[styles.timeChipText, entry.heure === h && styles.timeChipTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}

          {/* Add another */}
          <TouchableOpacity onPress={addEntry} style={styles.addMore}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addMoreText}>Ajouter une autre dépense</Text>
          </TouchableOpacity>

          {/* Recap */}
          {totalSaisie > 0 && (
            <View style={styles.recapCard}>
              <View style={styles.recapHeader}>
                <MaterialCommunityIcons name="calendar-range" size={16} color={Colors.textSecondary} />
                <Text style={styles.recapHeaderText}>{yesterdayRange()}</Text>
                <Text style={styles.recapCount}>{todayExpenses.length} dépenses enregistrées</Text>
              </View>
              <View style={styles.recapDivider} />
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>Récapitulatif</Text>
                <Text style={styles.recapAmount}>{formatFCFA(totalSaisie)}</Text>
              </View>
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>Total du jour</Text>
                <Text style={styles.recapAmount}>{formatFCFA(totalSaisie)}</Text>
              </View>
              {selectedCat && (
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>{selectedCat.nom} après</Text>
                  <View style={styles.recapArrow}>
                    <Text style={styles.recapBefore}>{formatFCFA(restantAvant)}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color={Colors.textSecondary} />
                    <Text style={[styles.recapAfter, restantApres < 0 && { color: Colors.danger }]}>
                      {formatFCFA(Math.max(restantApres, 0))}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnValidate, saving && { opacity: 0.7 }]}
          onPress={handleValidate}
          disabled={saving}>
          <MaterialCommunityIcons name="check" size={20} color={Colors.white} />
          <Text style={styles.btnValidateText}>
            {saving ? 'Enregistrement...' : 'Valider et fermer'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  content: { padding: 16, gap: 12, paddingBottom: 24 },

  infoBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: Colors.accent, borderRadius: 12,
    padding: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.primary, lineHeight: 18 },

  dateLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, paddingLeft: 2 },

  entryCard: {
    backgroundColor: Colors.white, borderRadius: Radius.card,
    padding: 16, gap: 12, ...Shadows.card, position: 'relative',
  },
  removeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 1 },

  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountInput: {
    fontSize: 40, fontWeight: '700', color: Colors.textPrimary,
    flex: 1, padding: 0,
  },
  amountCurrency: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500', marginTop: 8 },
  resetBtn: { padding: 4 },

  catScroll: { marginHorizontal: -4 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginHorizontal: 4,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  catChipActive: { backgroundColor: Colors.accent, borderColor: Colors.primary },
  catChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  catChipTextActive: { color: Colors.primary },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: Radius.input,
    paddingHorizontal: 12, height: 46,
  },
  textInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  timeScroll: { marginHorizontal: -4 },
  timeChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginHorizontal: 4,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  timeChipActive: { backgroundColor: Colors.accent, borderColor: Colors.primary },
  timeChipText: { fontSize: 12, color: Colors.textSecondary },
  timeChipTextActive: { color: Colors.primary, fontWeight: '600' },

  addMore: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 4, paddingHorizontal: 4,
  },
  addMoreText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },

  recapCard: {
    backgroundColor: Colors.white, borderRadius: Radius.card,
    padding: 16, gap: 8, ...Shadows.card,
  },
  recapHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recapHeaderText: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  recapCount: { fontSize: 11, color: Colors.primary, fontWeight: '500' },
  recapDivider: { height: 1, backgroundColor: '#F3F4F6' },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recapLabel: { fontSize: 13, color: Colors.textSecondary },
  recapAmount: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  recapArrow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recapBefore: { fontSize: 13, color: Colors.textSecondary },
  recapAfter: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  footer: {
    backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  btnValidate: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: Layout.buttonHeight, borderRadius: Radius.button,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnValidateText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
