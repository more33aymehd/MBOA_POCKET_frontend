import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { paymentService } from '../../services/paymentService';
import { formatFCFA } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';

const METHODS = {
  ORANGE_MONEY: { label: 'Orange Money', color: '#FF6B00', icon: '🟠' },
  MTN_MOMO:     { label: 'MTN MoMo',     color: '#FFC200', icon: '🟡' },
  CASH:         { label: 'Cash',          color: '#6B7280', icon: '💵' },
  MOCK:         { label: 'Simulateur',    color: Colors.primary, icon: '🧪' },
};

const STATUTS = [
  { id: 'TOUS',       label: 'Tous' },
  { id: 'SUCCESSFUL', label: 'Réussis' },
  { id: 'PENDING',    label: 'En attente' },
  { id: 'FAILED',     label: 'Échoués' },
];

const STATUT_STYLE = {
  SUCCESSFUL: { bg: '#DCFCE7', color: '#166534', label: 'Réussi' },
  PENDING:    { bg: '#FEF9C3', color: '#854D0E', label: 'En attente' },
  FAILED:     { bg: '#FEE2E2', color: '#991B1B', label: 'Échoué' },
};

function dateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function groupByDate(payments) {
  const groups = {};
  payments.forEach(p => {
    const label = dateLabel(p.dateCreation);
    if (!groups[label]) groups[label] = [];
    groups[label].push(p);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

function PaymentRow({ payment, colors }) {
  const method = METHODS[payment.methode] ?? METHODS.CASH;
  const statut = STATUT_STYLE[payment.statut] ?? STATUT_STYLE.PENDING;

  return (
    <View style={[s.row, { backgroundColor: colors.card }]}>
      <View style={[s.methodIcon, { backgroundColor: method.color + '20' }]}>
        <Text style={s.methodEmoji}>{method.icon}</Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={[s.rowMerchant, { color: colors.text }]} numberOfLines={1}>
          {payment.merchantName || 'Paiement'}
        </Text>
        <View style={s.rowMeta}>
          {payment.categoryIcone && (
            <Text style={s.rowCatIcon}>{payment.categoryIcone}</Text>
          )}
          <Text style={[s.rowCategory, { color: colors.textSecondary }]} numberOfLines={1}>
            {payment.categoryNom || method.label}
          </Text>
        </View>
      </View>
      <View style={s.rowRight}>
        <Text style={[s.rowAmount, { color: payment.statut === 'FAILED' ? Colors.danger : colors.text }]}>
          -{formatFCFA(payment.montant)}
        </Text>
        <View style={[s.statutBadge, { backgroundColor: statut.bg }]}>
          <Text style={[s.statutText, { color: statut.color }]}>{statut.label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function PaymentHistoryScreen({ navigation }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtre, setFiltre] = useState('TOUS');

  const load = useCallback(async () => {
    try {
      const data = await paymentService.getHistory(token);
      setPayments(Array.isArray(data) ? data : []);
    } catch { setPayments([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = filtre === 'TOUS' ? payments : payments.filter(p => p.statut === filtre);
  const grouped = groupByDate(filtered);

  const totalReussi = payments
    .filter(p => p.statut === 'SUCCESSFUL')
    .reduce((sum, p) => sum + parseFloat(p.montant ?? 0), 0);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>Historique</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Résumé */}
      <View style={[s.summary, { backgroundColor: Colors.primary }]}>
        <Text style={s.summaryLabel}>Total dépensé (paiements réussis)</Text>
        <Text style={s.summaryAmount}>{formatFCFA(totalReussi)}</Text>
        <Text style={s.summaryCount}>{payments.filter(p => p.statut === 'SUCCESSFUL').length} transaction(s)</Text>
      </View>

      {/* Filtres */}
      <View style={[s.filtresWrap, { backgroundColor: colors.card }]}>
        {STATUTS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[s.filtreBtn, filtre === f.id && s.filtreBtnActive]}
            onPress={() => setFiltre(f.id)}>
            <Text style={[s.filtreBtnLabel, { color: filtre === f.id ? Colors.white : colors.textSecondary }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <MaterialCommunityIcons name="receipt-text-outline" size={52} color={colors.textSecondary} />
          <Text style={[s.emptyTitle, { color: colors.text }]}>Aucun paiement</Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            {filtre === 'TOUS' ? 'Vos paiements apparaîtront ici.' : `Aucun paiement "${STATUTS.find(f => f.id === filtre)?.label}".`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={g => g.date}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
          contentContainerStyle={s.list}
          renderItem={({ item: group }) => (
            <View style={s.group}>
              <Text style={[s.groupDate, { color: colors.textSecondary }]}>{group.date}</Text>
              <View style={s.groupItems}>
                {group.items.map((p, i) => (
                  <View key={p.id ?? i}>
                    <PaymentRow payment={p} colors={colors} />
                    {i < group.items.length - 1 && <View style={[s.divider, { backgroundColor: colors.borderLight }]} />}
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  summary: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 20, gap: 4 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  summaryAmount: { fontSize: 36, fontWeight: '800', color: Colors.white, letterSpacing: -1 },
  summaryCount: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  filtresWrap: { flexDirection: 'row', paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 10, gap: 8 },
  filtreBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: 'transparent' },
  filtreBtnActive: { backgroundColor: Colors.primary },
  filtreBtnLabel: { fontSize: 13, fontWeight: '500' },
  list: { padding: Layout.screenPaddingHorizontal, gap: 20, paddingBottom: 32 },
  group: { gap: 8 },
  groupDate: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  groupItems: { borderRadius: Radius.card, overflow: 'hidden', ...Shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { height: 1 },
  methodIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  methodEmoji: { fontSize: 20 },
  rowInfo: { flex: 1, gap: 3 },
  rowMerchant: { fontSize: 14, fontWeight: '600' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowCatIcon: { fontSize: 12 },
  rowCategory: { fontSize: 12 },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  rowAmount: { fontSize: 14, fontWeight: '700' },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statutText: { fontSize: 10, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});
