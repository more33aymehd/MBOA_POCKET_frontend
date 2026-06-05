import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { categoryService } from '../../services/categoryService';
import { expenseService } from '../../services/expenseService';
import { formatFCFA } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';

function progressColor(pct) {
  if (pct >= 90) return Colors.danger;
  if (pct >= 70) return Colors.warning;
  return Colors.primary;
}

function groupByDate(expenses) {
  const groups = {};
  for (const e of expenses) {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function dateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ZoneDetailScreen({ navigation, route }) {
  const id = route.params?.id;
  const { token } = useAuth();
  const { colors } = useTheme();
  const [category, setCategory] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const [cats, exps] = await Promise.all([
        categoryService.getAll(token),
        expenseService.getByCategory(token, Number(id)),
      ]);
      setCategory(cats.find(c => c.id === Number(id)) ?? null);
      setExpenses(exps ?? []);
    } finally {
      setRefreshing(false);
    }
  }, [token, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function deleteExpense(expId) {
    Alert.alert('Supprimer', 'Supprimer cette dépense ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await expenseService.delete(token, expId); load(); } },
    ]);
  }

  const pct = category?.progressPercent ?? 0;
  const barColor = progressColor(pct);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>
          {category?.icone ?? '💰'} {category?.nom ?? ''}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={barColor} />}>

        {/* Budget Card */}
        {category && (
          <View style={[s.budgetCard, { backgroundColor: colors.card }]}>
            <View style={s.budgetCardTop}>
              <View style={s.statsCol}>
                {[
                  { label: 'Alloué',  value: category.montantAlloue,  color: colors.text },
                  { label: 'Dépensé', value: category.montantDepense, color: Colors.secondary },
                  { label: 'Restant', value: category.montantRestant, color: category.montantRestant >= 0 ? Colors.success : Colors.danger },
                ].map(item => (
                  <View key={item.label} style={s.statRow}>
                    <Text style={[s.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    <Text style={[s.statValue, { color: item.color }]}>{formatFCFA(item.value)}</Text>
                  </View>
                ))}
              </View>
              <View style={s.ring}>
                <View style={[s.ringOuter, { borderColor: barColor + '30' }]}>
                  <Text style={[s.ringPct, { color: barColor }]}>{Math.round(pct)}%</Text>
                  <Text style={[s.ringLabel, { color: colors.textSecondary }]}>utilisé</Text>
                </View>
              </View>
            </View>

            {/* Barre de progression */}
            <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[s.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
            </View>

            {pct >= 80 && (
              <View style={s.warning}>
                <MaterialCommunityIcons name="alert-triangle" size={18} color="#92400E" />
                <Text style={s.warningText}>Attention, budget presque épuisé</Text>
              </View>
            )}
          </View>
        )}

        {/* Liste des dépenses */}
        <View style={s.section}>
          {expenses.length === 0 ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="receipt-text-outline" size={40} color={colors.textSecondary} />
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>Aucune dépense ce mois</Text>
            </View>
          ) : (
            groupByDate(expenses).map(([date, items]) => (
              <View key={date} style={s.group}>
                <Text style={[s.groupDate, { color: colors.textSecondary }]}>{dateLabel(date)}</Text>
                {items.map(exp => (
                  <TouchableOpacity
                    key={exp.id}
                    style={[s.expenseRow, { backgroundColor: colors.cardSecondary ?? colors.inputBg }]}
                    onLongPress={() => deleteExpense(exp.id)}>
                    <View style={s.expLeft}>
                      <Text style={[s.expDesc, { color: colors.text }]}>{exp.description || exp.categoryNom}</Text>
                      <Text style={[s.expDate, { color: colors.textSecondary }]}>
                        {new Date(exp.date).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <Text style={s.expAmount}>- {formatFCFA(exp.montant)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <View style={[s.fabArea, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AddExpense', { categoryId: id })}>
          <MaterialCommunityIcons name="plus" size={20} color={Colors.white} />
          <Text style={s.fabLabel}>Ajouter une dépense</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scroll: { paddingBottom: 100 },
  budgetCard: { marginHorizontal: Layout.screenPaddingHorizontal, marginTop: 12, borderRadius: Radius.card, padding: 20, gap: 14, ...Shadows.card },
  budgetCardTop: { flexDirection: 'row', gap: 16 },
  statsCol: { flex: 1, gap: 10 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 14, fontWeight: '700' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 16, fontWeight: '700' },
  ringLabel: { fontSize: 10 },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10 },
  warningText: { fontSize: 13, fontWeight: '500', color: '#92400E' },
  section: { paddingHorizontal: Layout.screenPaddingHorizontal, marginTop: 16, gap: 16 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 14 },
  group: { gap: 6 },
  groupDate: { fontSize: 13, fontWeight: '500', paddingVertical: 4 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  expLeft: { gap: 2 },
  expDesc: { fontSize: 14, fontWeight: '500' },
  expDate: { fontSize: 12 },
  expAmount: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  fabArea: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: 16, paddingTop: 8 },
  fab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, backgroundColor: Colors.primary, borderRadius: Radius.button, ...Shadows.button },
  fabLabel: { color: Colors.white, fontSize: 15, fontWeight: '500' },
});
