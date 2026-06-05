import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { tontineService } from '../../services/tontineService';
import { formatFCFA } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';

const AVATAR_COLORS = ['#1B8A5A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

function Avatar({ nom, index }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{(nom ?? '?')[0].toUpperCase()}</Text>
    </View>
  );
}

const TABS = ['Membres', 'Paiements', 'Historique'];

export default function TontineDetailScreen({ navigation, route }) {
  const id = route.params?.id;
  const { token, user } = useAuth();
  const [tontine, setTontine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Membres');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await tontineService.getById(token, id);
      setTontine(data);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handlePay() {
    Alert.alert(
      'Payer ma cotisation',
      `Confirmer le paiement de ${formatFCFA(tontine.montantParTour)} pour le tour ${tontine.tourActuel} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setPaying(true);
              await tontineService.pay(token, id, tontine.montantParTour);
              Alert.alert('✅ Paiement enregistré', 'Votre cotisation a été enregistrée avec succès.');
              load();
            } catch (e) {
              Alert.alert('Erreur', e.message);
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  }

  async function handleAdvanceTour() {
    Alert.alert(
      'Avancer au tour suivant',
      `Confirmer la fin du tour ${tontine.tourActuel} et commencer le tour ${tontine.tourActuel + 1} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await tontineService.advanceTour(token, id);
              load();
            } catch (e) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!tontine) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Tontine introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const freq = { MENSUEL: 'mois', HEBDOMADAIRE: 'semaine', BIMENSUEL: '2 mois' }[tontine.frequence] ?? 'mois';
  const isCreator = tontine.creatorId === user?.id;
  const myMember = (tontine.membres ?? []).find(m => m.userId === user?.id);
  const iHavePaid = myMember?.statutPaiementTourActuel === 'PAYE';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{tontine.nom}</Text>
        {isCreator ? (
          <TouchableOpacity onPress={handleAdvanceTour}>
            <MaterialCommunityIcons name="skip-next" size={24} color={Colors.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoAmount}>{formatFCFA(tontine.montantParTour)} / {freq}</Text>
          <Text style={styles.infoSub}>
            Depuis {tontine.dateCreation ? new Date(tontine.dateCreation).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'} · {tontine.nbMembres} membres
          </Text>

          <View style={styles.infoStats}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>Tour {tontine.tourActuel}</Text>
              <Text style={styles.statLbl}>En cours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{tontine.nbTours}</Text>
              <Text style={styles.statLbl}>Tours total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{formatFCFA(tontine.totalParTour ?? 0)}</Text>
              <Text style={styles.statLbl}>Pot/tour</Text>
            </View>
          </View>

          {tontine.prochainBeneficiaire && tontine.prochainBeneficiaire !== '—' && (
            <View style={styles.benefRow}>
              <MaterialCommunityIcons name="crown" size={16} color={Colors.secondary} />
              <Text style={styles.benefText}>Tour de : <Text style={{ fontWeight: '700' }}>{tontine.prochainBeneficiaire}</Text></Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contenu des tabs */}
        <View style={styles.tabContent}>

          {/* Membres */}
          {activeTab === 'Membres' && (tontine.membres ?? []).map((m, i) => (
            <View key={m.id ?? i} style={[styles.memberRow, i < (tontine.membres.length - 1) && styles.memberBorder]}>
              <Avatar nom={m.userNom} index={i} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.userNom}</Text>
                <Text style={styles.memberEmail}>{m.userEmail}</Text>
              </View>
              {m.aRecu ? (
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                  <Text style={styles.badgeTextOk}>Reçu ✓</Text>
                </View>
              ) : m.statutPaiementTourActuel === 'PAYE' ? (
                <View style={[styles.badge, styles.badgePaid]}>
                  <Text style={styles.badgeTextOk}>Payé ✓</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgePending]}>
                  <Text style={styles.badgeTextPending}>
                    {m.montantDu ? `Dû: ${formatFCFA(parseInt(m.montantDu))}` : 'Attente'}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Paiements */}
          {activeTab === 'Paiements' && (
            (tontine.paiements ?? []).filter(p => p.tourNumero === tontine.tourActuel).length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucun paiement pour ce tour</Text>
              </View>
            ) : (
              (tontine.paiements ?? [])
                .filter(p => p.tourNumero === tontine.tourActuel)
                .map((p, i) => (
                  <View key={p.id ?? i} style={[styles.payRow, i > 0 && styles.memberBorder]}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{p.payerNom}</Text>
                      <Text style={styles.memberEmail}>{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : ''}</Text>
                    </View>
                    <Text style={styles.payAmount}>{formatFCFA(p.montant)}</Text>
                  </View>
                ))
            )
          )}

          {/* Historique */}
          {activeTab === 'Historique' && (
            (tontine.paiements ?? []).length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucun historique</Text>
              </View>
            ) : (
              (tontine.paiements ?? []).map((p, i) => (
                <View key={p.id ?? i} style={[styles.payRow, i > 0 && styles.memberBorder]}>
                  <View style={[styles.tourBadge]}>
                    <Text style={styles.tourBadgeText}>T{p.tourNumero}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{p.payerNom}</Text>
                    <Text style={styles.memberEmail}>{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : ''}</Text>
                  </View>
                  <Text style={styles.payAmount}>{formatFCFA(p.montant)}</Text>
                </View>
              ))
            )
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton payer */}
      {tontine.statut === 'ACTIVE' && myMember && !iHavePaid && (
        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.payNowBtn, paying && { opacity: 0.7 }]}
            onPress={handlePay}
            disabled={paying}>
            {paying ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <MaterialCommunityIcons name="cash" size={20} color={Colors.white} />
                <Text style={styles.payNowLabel}>Payer ma cotisation — {formatFCFA(tontine.montantParTour)}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {tontine.statut === 'ACTIVE' && myMember && iHavePaid && (
        <View style={styles.bottom}>
          <View style={styles.paidBanner}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.paidText}>Cotisation payée pour ce tour ✓</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 8 },

  infoCard: {
    backgroundColor: Colors.white, margin: Layout.screenPaddingHorizontal,
    borderRadius: Radius.card, padding: 18, gap: 10, ...Shadows.card,
  },
  infoAmount: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  infoSub: { fontSize: 13, color: Colors.textSecondary },
  infoStats: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  statLbl: { fontSize: 11, color: Colors.textSecondary },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  benefRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF8E7', borderRadius: 8, padding: 10 },
  benefText: { fontSize: 13, color: Colors.textPrimary },

  tabs: {
    flexDirection: 'row', paddingHorizontal: Layout.screenPaddingHorizontal,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabLabel: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.primary, fontWeight: '700' },

  tabContent: { backgroundColor: Colors.white, marginHorizontal: Layout.screenPaddingHorizontal, borderRadius: Radius.card, marginTop: 12, ...Shadows.card },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  memberBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  memberEmail: { fontSize: 12, color: Colors.textSecondary },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  badgePaid: { backgroundColor: Colors.accent },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeTextOk: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  badgeTextPending: { fontSize: 11, fontWeight: '600', color: '#92400E' },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  payAmount: { fontSize: 14, fontWeight: '700', color: Colors.success },
  tourBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  tourBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  empty: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 13, color: Colors.textSecondary },

  bottom: { padding: Layout.screenPaddingHorizontal, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  payNowBtn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    ...Shadows.button,
  },
  payNowLabel: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  paidBanner: {
    height: 50, backgroundColor: Colors.accent, borderRadius: Radius.button,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  paidText: { fontSize: 14, fontWeight: '600', color: Colors.success },
});
