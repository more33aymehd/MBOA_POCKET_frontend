import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { tontineService } from '../../services/tontineService';
import { formatFCFA } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';

function AvatarGroup({ membres = [], max = 4 }) {
  const shown = membres.slice(0, max);
  const extra = membres.length - max;
  return (
    <View style={s.avatarGroup}>
      {shown.map((m, i) => (
        <View key={m.id ?? i} style={[s.avatar, { marginLeft: i === 0 ? 0 : -8, zIndex: max - i }]}>
          <Text style={s.avatarText}>{(m.userNom ?? '?')[0].toUpperCase()}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[s.avatar, s.avatarExtra, { marginLeft: -8 }]}>
          <Text style={s.avatarExtraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

function TontineCard({ tontine, onPress, onPay }) {
  const { colors } = useTheme();
  const freq = { MENSUEL: 'mois', HEBDOMADAIRE: 'semaine', BIMENSUEL: '2 semaines' }[tontine.frequence] ?? 'mois';
  const isActive = tontine.statut === 'ACTIVE';

  return (
    <View style={[s.tontineCard, { backgroundColor: colors.card }]}>
      <View style={s.tontineHeader}>
        <AvatarGroup membres={tontine.membres ?? []} />
        <View style={[s.statutBadge, isActive ? s.statutBadgeActive : { backgroundColor: colors.border }]}>
          <Text style={[s.statutText, isActive && s.statutTextActive, !isActive && { color: colors.textSecondary }]}>
            {isActive ? 'Actif' : tontine.statut}
          </Text>
        </View>
      </View>

      <Text style={[s.tontineName, { color: colors.text }]}>{tontine.nom}</Text>
      <Text style={[s.tontineInfo, { color: colors.textSecondary }]}>
        {formatFCFA(tontine.montantParTour)} / {freq} · {tontine.nbMembres} membre{tontine.nbMembres > 1 ? 's' : ''}
      </Text>

      {isActive && tontine.prochainBeneficiaire && (
        <View style={s.tourInfo}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.secondary} />
          <Text style={[s.tourText, { color: Colors.secondary }]}>Tour de {tontine.prochainBeneficiaire}</Text>
        </View>
      )}

      {isActive && tontine.totalParTour && (
        <View style={s.duRow}>
          <MaterialCommunityIcons name="arrow-up-circle" size={14} color={colors.textSecondary} />
          <Text style={[s.duText, { color: colors.textSecondary }]}>À verser : {formatFCFA(tontine.montantParTour)}</Text>
        </View>
      )}

      <Text style={[s.nbPaiements, { color: colors.textSecondary }]}>
        Tour {tontine.tourActuel} / {tontine.nbTours}
      </Text>

      <View style={s.cardActions}>
        <TouchableOpacity style={[s.detailBtn, { borderColor: Colors.primary }]} onPress={onPress}>
          <Text style={s.detailBtnLabel}>Voir détails</Text>
        </TouchableOpacity>
        {isActive && (
          <TouchableOpacity style={s.payBtn} onPress={onPay}>
            <Text style={s.payBtnLabel}>Payer maintenant</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CommunityScreen({ navigation }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [tontines, setTontines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('actives');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await tontineService.getMy(token);
      setTontines(data ?? []);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const actives   = tontines.filter(t => t.statut === 'ACTIVE' || t.statut === 'EN_ATTENTE');
  const historique = tontines.filter(t => t.statut === 'TERMINEE');
  const displayed = activeTab === 'actives' ? actives : historique;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Mes tontines</Text>
        <TouchableOpacity style={[s.notifBtn, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Bons Plans */}
      <TouchableOpacity
        style={[s.bonsPlansBtn, { backgroundColor: colors.card, borderColor: Colors.secondary + '30' }]}
        onPress={() => navigation.navigate('BonsPlans')}>
        <MaterialCommunityIcons name="tag-multiple" size={16} color={Colors.secondary} />
        <Text style={s.bonsPlansBtnLabel}>Bons plans à proximité</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.secondary} />
      </TouchableOpacity>

      {/* Tabs */}
      <View style={s.tabs}>
        {[
          { key: 'actives',    label: `Actives${actives.length > 0 ? ` (${actives.length})` : ''}` },
          { key: 'historique', label: `Historique${historique.length > 0 ? ` (${historique.length})` : ''}` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[s.tabLabel, { color: activeTab === tab.key ? Colors.white : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : displayed.length === 0 ? (
          <View style={s.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={56} color={colors.textSecondary} />
            <Text style={[s.emptyTitle, { color: colors.text }]}>
              {activeTab === 'actives' ? 'Aucune tontine active' : 'Aucun historique'}
            </Text>
            {activeTab === 'actives' && (
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                Créez ou rejoignez une tontine pour commencer.
              </Text>
            )}
          </View>
        ) : (
          displayed.map(t => (
            <TontineCard
              key={t.id}
              tontine={t}
              onPress={() => navigation.navigate('TontineDetail', { id: t.id })}
              onPay={() => navigation.navigate('TontineDetail', { id: t.id })}
            />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('CreateTontine')}>
        <MaterialCommunityIcons name="plus" size={20} color={Colors.white} />
        <Text style={s.fabLabel}>Créer une tontine</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  notifBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...Shadows.card },

  bonsPlansBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Layout.screenPaddingHorizontal, marginBottom: 8, borderRadius: Radius.input, padding: 12, borderWidth: 1 },
  bonsPlansBtnLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.secondary },

  tabs: { flexDirection: 'row', paddingHorizontal: Layout.screenPaddingHorizontal, gap: 8, marginBottom: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: 14, fontWeight: '500' },

  scroll: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 8, gap: 14 },

  tontineCard: { borderRadius: Radius.card, padding: 16, gap: 8, ...Shadows.card },
  tontineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  avatarGroup: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  avatarText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  avatarExtra: { backgroundColor: Colors.textSecondary },
  avatarExtraText: { fontSize: 10, fontWeight: '700', color: Colors.white },

  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statutBadgeActive: { backgroundColor: Colors.accent },
  statutText: { fontSize: 11, fontWeight: '600' },
  statutTextActive: { color: Colors.primary },

  tontineName: { fontSize: 16, fontWeight: '700' },
  tontineInfo: { fontSize: 13 },
  tourInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tourText: { fontSize: 13, fontWeight: '500' },
  duRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  duText: { fontSize: 13 },
  nbPaiements: { fontSize: 12 },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  detailBtn: { flex: 1, height: 40, borderRadius: Radius.button, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  detailBtnLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  payBtn: { flex: 1, height: 40, borderRadius: Radius.button, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.button },
  payBtnLabel: { fontSize: 13, fontWeight: '600', color: Colors.white },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },

  fab: { position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabLabel: { fontSize: 15, fontWeight: '600', color: Colors.white },
});
