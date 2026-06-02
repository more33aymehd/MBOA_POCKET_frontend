import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';

const CAT_COLORS = {
  RESTOS: '#FF6B6B', SHOPPING: '#4ECDC4', SERVICES: '#F5A623',
  SANTE: '#1B8A5A', TOUS: Colors.primary,
};

export default function DealDetailScreen({ navigation, route }) {
  const deal = route.params?.deal;
  if (!deal) return null;

  const color = CAT_COLORS[deal.categorie] || Colors.primary;
  const dist = deal.distanceKm != null
    ? deal.distanceKm < 1 ? `${Math.round(deal.distanceKm * 1000)} m` : `${deal.distanceKm} km`
    : null;
  const exp = deal.expiration
    ? new Date(deal.expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bon plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: color + '20' }]}>
          <Text style={styles.heroEmoji}>{deal.icone ?? '🏷️'}</Text>
          {deal.reduction && (
            <View style={[styles.reductionBadge, { backgroundColor: color }]}>
              <Text style={styles.reductionText}>{deal.reduction}</Text>
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.infoCard}>
          <Text style={styles.titre}>{deal.titre}</Text>
          <Text style={styles.desc}>{deal.description}</Text>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
            <Text style={styles.metaText}>{deal.rating?.toFixed(1)} ({deal.nbAvis} avis)</Text>
            {dist && <>
              <View style={styles.dot} />
              <MaterialCommunityIcons name="map-marker" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{dist}</Text>
            </>}
          </View>

          <View style={styles.divider} />

          {[
            deal.adresse && { icon: 'map-marker-outline', label: 'Adresse', val: deal.adresse },
            exp && { icon: 'calendar-clock', label: 'Expire le', val: exp },
            { icon: 'tag-outline', label: 'Catégorie', val: deal.categorie },
          ].filter(Boolean).map((r, i) => (
            <View key={i} style={styles.detailRow}>
              <MaterialCommunityIcons name={r.icon} size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{r.label}</Text>
                <Text style={styles.detailVal}>{r.val}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={[styles.cta, { backgroundColor: color }]}>
          <MaterialCommunityIcons name="navigation-variant" size={20} color={Colors.white} />
          <Text style={styles.ctaLabel}>Itinéraire</Text>
        </TouchableOpacity>

      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Layout.screenPaddingHorizontal, gap: 14, paddingBottom: 32 },

  hero: {
    height: 160, borderRadius: Radius.card,
    alignItems: 'center', justifyContent: 'center', gap: 12,
    position: 'relative',
  },
  heroEmoji: { fontSize: 56 },
  reductionBadge: {
    position: 'absolute', top: 14, right: 14,
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6,
  },
  reductionText: { fontSize: 14, fontWeight: '800', color: Colors.white },

  infoCard: {
    backgroundColor: Colors.white, borderRadius: Radius.card,
    padding: 18, gap: 10, ...Shadows.card,
  },
  titre: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  desc: { fontSize: 15, color: Colors.secondary, fontWeight: '500' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textSecondary },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  detailVal: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', marginTop: 1 },

  cta: {
    height: Layout.buttonHeight, borderRadius: Radius.button,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...Shadows.button,
  },
  ctaLabel: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
