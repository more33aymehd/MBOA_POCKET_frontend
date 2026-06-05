import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { categoryService } from '../services/categoryService';
import { expenseService } from '../services/expenseService';
import { notificationService } from '../services/notificationService';
import { formatFCFA } from '../utils/format';

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000];

export default function CashReminderModal({ visible, onClose, onValidate }) {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([{ montant: '', categoryId: null, description: '' }]);
  const [paiementsEnregistres, setPaiementsEnregistres] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !token) return;
    categoryService.getAll(token).then(cats => setCategories(cats ?? [])).catch(() => {});
    const now = new Date();
    expenseService.getByMonth(token, now.getMonth() + 1, now.getFullYear())
      .then(exps => setPaiementsEnregistres((exps ?? []).length))
      .catch(() => {});
  }, [visible, token]);

  function addEntry() {
    setEntries(prev => [...prev, { montant: '', categoryId: null, description: '' }]);
  }

  function updateEntry(index, field, value) {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }

  async function handleValidate() {
    const valid = entries.filter(e => e.montant && Number(e.montant) > 0 && e.categoryId);
    if (!valid.length) { onClose(); return; }
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const results = await Promise.all(valid.map(e =>
        expenseService.create(token, {
          montant: Number(e.montant),
          categoryId: e.categoryId,
          description: e.description || 'Dépense cash',
          date: today,
        })
      ));
      const total = valid.reduce((s, e) => s + Number(e.montant), 0);
      const first = results[0];
      notificationService.notifyExpenseCreated({
        montant: total,
        categoryNom: valid.length > 1 ? `${valid.length} dépenses` : first?.categoryNom,
        categoryIcone: valid.length > 1 ? '💰' : first?.categoryIcone,
      });
      onValidate?.();
    } catch { } finally {
      setSaving(false);
      onClose();
    }
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvCenter}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Récapitulatif du jour</Text>
                <Text style={styles.cardSubtitle}>
                  {timeStr} — Avez-vous des dépenses en cash à enregistrer ?
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Icon */}
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="cash-register" size={32} color={Colors.primary} />
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Paiements enregistrés</Text>
              <Text style={styles.statValue}>{paiementsEnregistres}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Dépenses cash estimées...</Text>
              <Text style={[styles.statValue, { color: Colors.warning }]}>?</Text>
            </View>

            <View style={styles.divider} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {entries.map((entry, idx) => (
                <View key={idx} style={styles.entryBlock}>
                  <Text style={styles.sectionLabel}>Ajouter une dépense</Text>

                  {/* Quick amount chips */}
                  <View style={styles.chips}>
                    {QUICK_AMOUNTS.map(amt => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.chip,
                          entry.montant === String(amt) && styles.chipActive,
                        ]}
                        onPress={() => updateEntry(idx, 'montant', String(amt))}>
                        <Text style={[
                          styles.chipText,
                          entry.montant === String(amt) && styles.chipTextActive,
                        ]}>
                          {formatFCFA(amt).replace(' FCFA', ' F')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Custom amount */}
                  <TextInput
                    style={styles.input}
                    placeholder="Montant personnalisé (FCFA)"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    value={entry.montant}
                    onChangeText={v => updateEntry(idx, 'montant', v)}
                  />

                  {/* Category selector */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catChip,
                          entry.categoryId === cat.id && styles.catChipActive,
                        ]}
                        onPress={() => updateEntry(idx, 'categoryId', cat.id)}>
                        <Text style={styles.catChipText}>{cat.icone} {cat.nom}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ))}

              <TouchableOpacity onPress={addEntry} style={styles.addMore}>
                <MaterialCommunityIcons name="plus" size={16} color={Colors.primary} />
                <Text style={styles.addMoreText}>Ajouter une autre</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnIgnore} onPress={onClose}>
                <Text style={styles.btnIgnoreText}>Ignorer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnValidate, saving && { opacity: 0.7 }]}
                onPress={handleValidate}
                disabled={saving}>
                <Text style={styles.btnValidateText}>
                  {saving ? 'Enregistrement...' : 'Valider et fermer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,31,23,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  kvCenter: { justifyContent: 'center' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    ...Shadows.card,
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, fontFamily: 'System' },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, maxWidth: 240 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },

  iconWrap: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  statLabel: { fontSize: 13, color: Colors.textSecondary },
  statValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  entryBlock: { marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },

  chips: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, backgroundColor: '#F3F4F6',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },

  input: {
    height: 46, borderRadius: Radius.input,
    borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, fontSize: 14,
    color: Colors.textPrimary, marginBottom: 10,
    backgroundColor: Colors.white,
  },

  catScroll: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginRight: 8,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  catChipActive: { backgroundColor: Colors.accent, borderColor: Colors.primary },
  catChipText: { fontSize: 12, color: Colors.textPrimary },

  addMore: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, marginTop: 4,
  },
  addMoreText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnIgnore: {
    flex: 1, height: 48, borderRadius: Radius.button,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  btnIgnoreText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  btnValidate: {
    flex: 2, height: 48, borderRadius: Radius.button,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  btnValidateText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});
