import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { notificationService } from '../../services/notificationService';

const TABS = [
  { key: 'all',      apiType: null,        labelKey: 'notifications.all' },
  { key: 'payments', apiType: 'PAIEMENT',  labelKey: 'notifications.payments' },
  { key: 'budget',   apiType: 'BUDGET',    labelKey: 'notifications.budget' },
  { key: 'tontines', apiType: 'TONTINE',   labelKey: 'notifications.tontines' },
];

const TYPE_META = {
  BUDGET:   { icon: 'alert-circle',  color: '#F59E0B' },
  PAIEMENT: { icon: 'check-circle',  color: Colors.success },
  TONTINE:  { icon: 'account-group', color: '#8B5CF6' },
  CASH:     { icon: 'cash-clock',    color: Colors.secondary },
  DEAL:     { icon: 'tag',           color: Colors.primary },
  SYSTEM:   { icon: 'bell',          color: '#6B7280' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return 'Hier';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function NotifCard({ notif, onPress, onDelete, colors }) {
  const meta = TYPE_META[notif.type] ?? TYPE_META.SYSTEM;
  return (
    <TouchableOpacity
      style={[s.notifCard, { backgroundColor: colors.card }, !notif.lue && s.notifCardUnread]}
      onPress={() => onPress(notif)}
      onLongPress={() => onDelete(notif)}>
      <View style={[s.notifIcon, { backgroundColor: meta.color + '20' }]}>
        <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={s.notifInfo}>
        <Text style={[s.notifTitre, { color: colors.text }, !notif.lue && { fontWeight: '700' }]} numberOfLines={2}>
          {notif.titre}
        </Text>
        <Text style={[s.notifSousTitre, { color: colors.textSecondary }]} numberOfLines={1}>{notif.message}</Text>
        <Text style={[s.notifTemps, { color: colors.textSecondary }]}>{timeAgo(notif.date)}</Text>
      </View>
      {!notif.lue && <View style={[s.unreadDot, { backgroundColor: meta.color }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [activeKey, setActiveKey] = useState('all');
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeTab = TABS.find(tab => tab.key === activeKey) ?? TABS[0];

  const load = useCallback(async (apiType = activeTab.apiType) => {
    if (!token) return;
    try {
      const data = await notificationService.getAll(token, apiType);
      setNotifs(data ?? []);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, activeTab.apiType]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function switchTab(tab) {
    setActiveKey(tab.key);
    setLoading(true);
    notificationService.getAll(token, tab.apiType)
      .then(data => setNotifs(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handlePress(notif) {
    if (!notif.lue) {
      await notificationService.markRead(token, notif.id).catch(() => {});
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, lue: true } : n));
    }
  }

  async function handleDelete(notif) {
    await notificationService.delete(token, notif.id).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== notif.id));
  }

  async function markAllRead() {
    await notificationService.markAllRead(token).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, lue: true })));
  }

  const unreadCount = notifs.filter(n => !n.lue).length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={s.markAll}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={[s.tabsScroll, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}
        contentContainerStyle={s.tabsContent}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeKey === tab.key && s.tabActive]}
            onPress={() => switchTab(tab)}>
            <Text style={[s.tabLabel, activeKey === tab.key && s.tabLabelActive]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>
          {notifs.length === 0 ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="bell-off-outline" size={56} color={colors.textSecondary} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>{t('notifications.empty')}</Text>
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>{t('notifications.upToDate')}</Text>
            </View>
          ) : (
            notifs.map(notif => (
              <NotifCard key={notif.id} notif={notif} onPress={handlePress} onDelete={handleDelete} colors={colors} />
            ))
          )}
          {notifs.length > 0 && (
            <Text style={[s.hint, { color: colors.textSecondary }]}>{t('notifications.longPressDelete')}</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 14, borderBottomWidth: 1 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  badge: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  markAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  tabsScroll: { maxHeight: 52, flexGrow: 0, borderBottomWidth: 1 },
  tabsContent: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  tabLabelActive: { color: Colors.white },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.card, padding: 14, ...Shadows.card },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  notifIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifInfo: { flex: 1, gap: 3 },
  notifTitre: { fontSize: 14, lineHeight: 19 },
  notifSousTitre: { fontSize: 12 },
  notifTemps: { fontSize: 11, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13 },
  hint: { textAlign: 'center', fontSize: 11, marginTop: 4, paddingBottom: 8 },
});
