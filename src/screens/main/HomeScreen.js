import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { budgetService } from '../../services/budgetService';
import { categoryService } from '../../services/categoryService';
import { expenseService } from '../../services/expenseService';
import { notificationService } from '../../services/notificationService';
import { formatFCFA, nomMois } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';
import CashReminderModal from '../../components/CashReminderModal';

function progressColor(pct) {
  if (pct >= 90) return Colors.danger;
  if (pct >= 70) return Colors.warning;
  return Colors.success;
}

function dateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function HomeScreen({ navigation }) {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const now = new Date();

  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const cashModalShownToday = useRef(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [bud, cats, exps, notifStats] = await Promise.all([
        budgetService.getCurrent(token),
        categoryService.getAll(token),
        expenseService.getByMonth(token, now.getMonth() + 1, now.getFullYear()),
        notificationService.getUnreadCount(token).catch(() => ({ nonLues: 0 })),
      ]);
      setBudget(bud);
      setCategories(cats ?? []);
      setUnreadCount(notifStats?.nonLues ?? 0);
      const sorted = (exps ?? []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentExpenses(sorted.slice(0, 5));
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    load();
    const hour = new Date().getHours();
    if (hour >= 18 && !cashModalShownToday.current) {
      cashModalShownToday.current = true;
      setTimeout(() => setShowCashModal(true), 800);
    }
  }, [load]));

  const totalDepense = categories.reduce((s, c) => s + (c.montantDepense ?? 0), 0);
  const restant = budget ? budget.montantTotal - totalDepense : 0;
  const pct = budget && budget.montantTotal > 0
    ? Math.min((totalDepense / budget.montantTotal) * 100, 100) : 0;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <CashReminderModal
        visible={showCashModal}
        onClose={() => setShowCashModal(false)}
        onValidate={() => { setShowCashModal(false); load(); }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.greeting, { color: colors.text }]}>
            {t('home.greeting')}, {user?.nom?.split(' ')[0] ?? 'vous'} 👋
          </Text>
          <View style={s.headerActions}>
            <TouchableOpacity style={[s.headerBtn, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('BilanMensuel')}>
              <MaterialCommunityIcons name="chart-pie" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.headerBtn, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={colors.text} />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : budget ? (
          <LinearGradient colors={['#1B8A5A', '#126644']} style={s.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.heroLabel}>{t('home.budgetMonth')} {nomMois(now.getMonth() + 1)}</Text>
            <Text style={s.heroRestant}>{formatFCFA(restant)}</Text>
            <Text style={s.heroSurTotal}>sur {formatFCFA(budget.montantTotal)}</Text>
            <View style={s.heroBarTrack}>
              <View style={[s.heroBarFill, { width: `${pct}%`, backgroundColor: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#4ADE80' }]} />
            </View>
            <View style={s.heroBottom}>
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>{t('home.spent')}</Text>
                <Text style={s.heroStatValue}>{formatFCFA(totalDepense)}</Text>
              </View>
              <View style={s.heroStat}>
                <Text style={[s.heroStatLabel, { textAlign: 'right' }]}>{t('home.savings')}</Text>
                <Text style={[s.heroStatValue, { textAlign: 'right' }]}>{formatFCFA(budget.objectifEpargne ?? 0)}</Text>
              </View>
            </View>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={[s.setupCard, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('SetupBudget')}>
            <MaterialCommunityIcons name="wallet-plus-outline" size={32} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.setupTitle, { color: colors.text }]}>{t('home.setupBudget')}</Text>
              <Text style={[s.setupSub, { color: colors.textSecondary }]}>{t('home.setupBudgetSub')}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Mes zones */}
        {categories.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>{t('home.myZones')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
                <Text style={s.seeAll}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.zonesRow}>
                {categories.slice(0, 5).map(cat => {
                  const catPct = Math.min(cat.progressPercent ?? 0, 100);
                  const barColor = progressColor(catPct);
                  return (
                    <TouchableOpacity key={cat.id} style={[s.zoneChip, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('ZoneDetail', { id: cat.id })}>
                      <Text style={s.zoneChipIcon}>{cat.icone}</Text>
                      <Text style={[s.zoneChipName, { color: colors.text }]} numberOfLines={1}>{cat.nom}</Text>
                      <View style={[s.zoneChipBar, { backgroundColor: colors.border }]}>
                        <View style={[s.zoneChipFill, { width: `${catPct}%`, backgroundColor: barColor }]} />
                      </View>
                      <Text style={[s.zoneChipAmt, { color: colors.textSecondary }]}>{formatFCFA(cat.montantAlloue - (cat.montantDepense ?? 0))}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Activité récente */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>{t('home.recentActivity')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
              <Text style={s.seeAll}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {recentExpenses.length === 0 ? (
            <View style={s.emptyActivity}>
              <MaterialCommunityIcons name="receipt-text-outline" size={32} color={colors.textSecondary} />
              <Text style={[s.emptyActivityText, { color: colors.textSecondary }]}>{t('home.noExpense')}</Text>
            </View>
          ) : (
            <View style={[s.activityCard, { backgroundColor: colors.card }]}>
              {recentExpenses.map((exp, i) => (
                <View key={exp.id ?? i} style={[s.activityRow, i < recentExpenses.length - 1 && [s.activityBorder, { borderBottomColor: colors.borderLight }]]}>
                  <View style={[s.activityIconBg, { backgroundColor: colors.accent ?? Colors.accent }]}>
                    <Text style={s.activityEmoji}>{exp.categoryIcone ?? '💰'}</Text>
                  </View>
                  <View style={s.activityMeta}>
                    <Text style={[s.activityDesc, { color: colors.text }]} numberOfLines={1}>
                      {exp.description || exp.categoryNom || 'Dépense'}
                    </Text>
                    <Text style={[s.activitySub, { color: colors.textSecondary }]}>
                      {exp.categoryNom}{exp.date ? ` · ${dateLabel(exp.date)}` : ''}
                    </Text>
                  </View>
                  <Text style={s.activityAmount}>-{formatFCFA(exp.montant)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 18, paddingBottom: 14 },
  greeting: { fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...Shadows.card, position: 'relative' },
  notifBadge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.white },
  heroCard: { marginHorizontal: Layout.screenPaddingHorizontal, borderRadius: 20, padding: 22, gap: 10 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase' },
  heroRestant: { fontSize: 42, fontWeight: '800', color: Colors.white, letterSpacing: -1, lineHeight: 48 },
  heroSurTotal: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: -4 },
  heroBarTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden', marginTop: 4 },
  heroBarFill: { height: '100%', borderRadius: 99 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  heroStat: { gap: 2 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  heroStatValue: { fontSize: 15, fontWeight: '700', color: Colors.white },
  setupCard: { marginHorizontal: Layout.screenPaddingHorizontal, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, ...Shadows.card },
  setupTitle: { fontSize: 15, fontWeight: '600' },
  setupSub: { fontSize: 13, marginTop: 2 },
  section: { marginTop: 24, paddingHorizontal: Layout.screenPaddingHorizontal, gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  zonesRow: { flexDirection: 'row', gap: 10, paddingRight: Layout.screenPaddingHorizontal },
  zoneChip: { width: 100, borderRadius: Radius.card, padding: 12, gap: 6, ...Shadows.card },
  zoneChipIcon: { fontSize: 22 },
  zoneChipName: { fontSize: 12, fontWeight: '600' },
  zoneChipBar: { height: 4, borderRadius: 99, overflow: 'hidden' },
  zoneChipFill: { height: '100%', borderRadius: 99 },
  zoneChipAmt: { fontSize: 11, fontWeight: '700' },
  activityCard: { borderRadius: Radius.card, overflow: 'hidden', ...Shadows.card },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  activityBorder: { borderBottomWidth: 1 },
  activityIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activityEmoji: { fontSize: 18 },
  activityMeta: { flex: 1, gap: 3 },
  activityDesc: { fontSize: 14, fontWeight: '600' },
  activitySub: { fontSize: 12 },
  activityAmount: { fontSize: 14, fontWeight: '700', color: Colors.danger },
  emptyActivity: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyActivityText: { fontSize: 13 },
});
