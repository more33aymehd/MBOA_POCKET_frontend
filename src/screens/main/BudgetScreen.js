import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { categoryService } from '../../services/categoryService';
import { budgetService } from '../../services/budgetService';
import { formatFCFA, nomMois } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';

function progressColor(pct) {
  if (pct >= 90) return Colors.danger;
  if (pct >= 70) return Colors.warning;
  return Colors.primary;
}

function ZoneCard({ cat, onPress }) {
  const { colors } = useTheme();
  const pct = Math.min(cat.progressPercent ?? 0, 100);
  const color = progressColor(pct);
  return (
    <TouchableOpacity style={[s.zoneCard, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.7}>
      <View style={s.zoneRow}>
        <View style={[s.zoneIconBg, { backgroundColor: (cat.couleur || Colors.primary) + '20' }]}>
          <Text style={s.zoneIcon}>{cat.icone}</Text>
        </View>
        <View style={s.zoneTexts}>
          <Text style={[s.zoneNom, { color: colors.text }]}>{cat.nom}</Text>
          <Text style={[s.zoneSub, { color: colors.textSecondary }]}>
            {formatFCFA(cat.montantDepense ?? 0)} / {formatFCFA(cat.montantAlloue)}
          </Text>
        </View>
        <View style={s.zoneRight}>
          <Text style={[s.zonePct, { color }]}>{Math.round(pct)}%</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
      </View>
      <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </TouchableOpacity>
  );
}

export default function BudgetScreen({ navigation }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee] = useState(now.getFullYear());
  const [categories, setCategories] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [cats, bud] = await Promise.all([
        categoryService.getAll(token, mois, annee),
        budgetService.getCurrent(token),
      ]);
      setCategories(cats ?? []);
      setBudget(bud);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, mois, annee]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalAlloue = categories.reduce((s, c) => s + c.montantAlloue, 0);
  const totalDepense = categories.reduce((s, c) => s + (c.montantDepense ?? 0), 0);
  const totalRestant = totalAlloue - totalDepense;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: colors.text }]}>{t('budget.title')}</Text>
          <View style={s.monthRow}>
            <TouchableOpacity onPress={() => setMois(m => m === 1 ? 12 : m - 1)}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[s.monthLabel, { color: colors.text }]}>{nomMois(mois)} {annee}</Text>
            <TouchableOpacity onPress={() => setMois(m => m === 12 ? 1 : m + 1)}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Résumé */}
        <View style={[s.summaryCard, { backgroundColor: colors.card }]}>
          {[
            { label: t('budget.alloc'), value: totalAlloue, color: colors.text },
            { label: t('budget.spent'), value: totalDepense, color: Colors.secondary },
            { label: t('budget.remaining'), value: totalRestant, color: Colors.success },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={[s.statDivider, { backgroundColor: colors.border }]} />}
              <View style={s.statCol}>
                <Text style={[s.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                <Text style={[s.statValue, { color: item.color }]}>{(item.value / 1000).toFixed(0)}K</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Bannière IA */}
        <TouchableOpacity style={s.iaBanner} onPress={() => navigation.navigate('SetupBudget')}>
          <MaterialCommunityIcons name="shimmer" size={20} color={Colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={s.iaBannerTitle}>{t('budget.aiAnalyze') ?? 'Analyser avec l\'IA ✨'}</Text>
            <Text style={s.iaBannerSub}>{t('budget.aiSub') ?? 'Génère ton budget automatiquement'}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Zones */}
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : categories.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.textSecondary} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>{t('budget.noZones')}</Text>
            <Text style={[s.emptySub, { color: colors.textSecondary }]}>{t('budget.noZonesSub')}</Text>
          </View>
        ) : (
          <View style={s.zoneList}>
            {categories.map(cat => (
              <ZoneCard key={cat.id} cat={cat} onPress={() => navigation.navigate('ZoneDetail', { id: cat.id })} />
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AddCategory')}>
        <MaterialCommunityIcons name="plus" size={24} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthLabel: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  summaryCard: { marginHorizontal: Layout.screenPaddingHorizontal, marginTop: 16, borderRadius: Radius.card, padding: 16, flexDirection: 'row', alignItems: 'center', ...Shadows.card },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statDivider: { width: 1, height: 32 },
  iaBanner: { marginHorizontal: Layout.screenPaddingHorizontal, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.secondary, borderRadius: Radius.card, padding: 14, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  iaBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.white },
  iaBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  zoneList: { marginTop: 16, paddingHorizontal: Layout.screenPaddingHorizontal, gap: 10 },
  zoneCard: { borderRadius: Radius.card, padding: 16, gap: 12, ...Shadows.card },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  zoneIconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  zoneIcon: { fontSize: 20 },
  zoneTexts: { flex: 1, gap: 2 },
  zoneNom: { fontSize: 15, fontWeight: '600' },
  zoneSub: { fontSize: 12 },
  zoneRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  zonePct: { fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  fab: { position: 'absolute', bottom: 24, left: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
