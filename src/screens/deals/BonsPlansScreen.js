import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dealService } from '../../services/dealService';

const YAOUNDE = { latitude: 3.8667, longitude: 11.5167 };

const FILTRES = [
  { id: 'TOUS',     label: 'Tous',     icon: 'tag-multiple' },
  { id: 'RESTOS',   label: 'Restos',   icon: 'silverware-fork-knife' },
  { id: 'SHOPPING', label: 'Shopping', icon: 'shopping' },
  { id: 'SERVICES', label: 'Services', icon: 'tools' },
  { id: 'SANTE',    label: 'Santé',    icon: 'medical-bag' },
];

const CAT_COLORS = {
  RESTOS: '#FF6B6B', SHOPPING: '#4ECDC4',
  SERVICES: '#F5A623', SANTE: '#1B8A5A', TOUS: Colors.primary,
};

const MOCK_DEALS = [
  {
    id: 1, titre: 'Pizza Palace', description: 'Réduction 20% après 18h',
    icone: '🍕', categorie: 'RESTOS', rating: 4.8, nbAvis: 120,
    latitude: 3.869, longitude: 11.520, reduction: '-20%', distanceKm: 2.3,
  },
  {
    id: 2, titre: 'Pharmacie du Centre', description: 'Achetez 3, payez 2',
    icone: '💊', categorie: 'SANTE', rating: 4.8, nbAvis: 45,
    latitude: 3.864, longitude: 11.514, reduction: '3 pour 2', distanceKm: 0.8,
  },
  {
    id: 3, titre: 'Coupe Prestige', description: '10% pour clients fidèles',
    icone: '✂️', categorie: 'SERVICES', rating: 5.0, nbAvis: 12,
    latitude: 3.872, longitude: 11.522, reduction: '-10%', distanceKm: 1.1,
  },
  {
    id: 4, titre: 'Marché Mokolo', description: 'Légumes frais du matin',
    icone: '🥦', categorie: 'SHOPPING', rating: 4.5, nbAvis: 88,
    latitude: 3.862, longitude: 11.510, reduction: '-15%', distanceKm: 3.2,
  },
  {
    id: 5, titre: 'Chez Paul', description: 'Happy hour 17h-19h',
    icone: '🍺', categorie: 'RESTOS', rating: 4.3, nbAvis: 67,
    latitude: 3.875, longitude: 11.518, reduction: '-30%', distanceKm: 1.8,
  },
];

function DealCard({ deal, onPress, colors }) {
  const color = CAT_COLORS[deal.categorie] || Colors.primary;
  const dist = deal.distanceKm < 1
    ? `${Math.round(deal.distanceKm * 1000)} m`
    : `${deal.distanceKm} km`;

  return (
    <TouchableOpacity
      style={[s.dealCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}>
      {/* Accent latéral */}
      <View style={[s.dealAccent, { backgroundColor: color }]} />

      {/* Icône */}
      <View style={[s.dealIconWrap, { backgroundColor: color + '18' }]}>
        <Text style={s.dealEmoji}>{deal.icone ?? '🏷️'}</Text>
      </View>

      {/* Infos */}
      <View style={s.dealInfo}>
        <Text style={[s.dealTitre, { color: colors.text }]} numberOfLines={1}>
          {deal.titre}
        </Text>
        <Text style={[s.dealDesc, { color: Colors.secondary }]} numberOfLines={1}>
          {deal.description}
        </Text>
        <View style={s.dealMeta}>
          <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
          <Text style={[s.ratingText, { color: colors.text }]}>{deal.rating?.toFixed(1)}</Text>
          <Text style={[s.dealAvis, { color: colors.textSecondary }]}>· {deal.nbAvis} avis</Text>
        </View>
      </View>

      {/* Droite */}
      <View style={s.dealRight}>
        <Text style={[s.dealDist, { color: colors.textSecondary }]}>{dist}</Text>
        {deal.reduction && (
          <View style={[s.badge, { backgroundColor: color }]}>
            <Text style={s.badgeText}>{deal.reduction}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function BonsPlansScreen({ navigation }) {
  const { token } = useAuth();
  const { colors, isDark } = useTheme();
  const mapRef = useRef(null);

  const [deals, setDeals] = useState(MOCK_DEALS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filtre, setFiltre] = useState('TOUS');
  const [region, setRegion] = useState({
    ...YAOUNDE,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });
  const [cityName, setCityName] = useState('Yaoundé');
  const [selectedDeal, setSelectedDeal] = useState(null);

  async function getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 600);
        const geo = await Location.reverseGeocodeAsync(loc.coords);
        if (geo?.[0]?.city) setCityName(geo[0].city);
        return loc.coords;
      }
    } catch { }
    return YAOUNDE;
  }

  const load = useCallback(async (coords) => {
    try {
      const loc = coords || YAOUNDE;
      const data = await dealService.getNearby(
        token, loc.latitude, loc.longitude, 15,
        filtre === 'TOUS' ? undefined : filtre
      );
      if (data && data.length > 0) setDeals(data);
    } catch {
      setDeals(MOCK_DEALS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, filtre]);

  useEffect(() => {
    setLoading(true);
    getLocation().then(coords => load(coords));
  }, []);

  useEffect(() => { if (!loading) load(); }, [filtre]);

  const displayed = filtre === 'TOUS' ? deals : deals.filter(d => d.categorie === filtre);

  function focusDeal(deal) {
    setSelectedDeal(deal.id);
    if (deal.latitude && deal.longitude) {
      mapRef.current?.animateToRegion({
        latitude: deal.latitude,
        longitude: deal.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 500);
    }
  }

  const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#0B1A11' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#162318' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8EA898' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F3528' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B1A11' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#162318' }] },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: colors.text }]}>Bons plans</Text>
        <TouchableOpacity style={[s.locationChip, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="map-marker" size={14} color={Colors.primary} />
          <Text style={s.locationText}>{cityName}</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtresScroll}>
        <View style={s.filtresRow}>
          {FILTRES.map(f => {
            const active = filtre === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[s.filtreChip, { backgroundColor: colors.card, borderColor: colors.border }, active && s.filtreChipActive]}
                onPress={() => setFiltre(f.id)}>
                <MaterialCommunityIcons name={f.icon} size={13} color={active ? Colors.white : colors.textSecondary} />
                <Text style={[s.filtreLabel, { color: active ? Colors.white : colors.textSecondary }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

        {/* Vraie carte */}
        <View style={s.mapWrap}>
          <MapView
            ref={mapRef}
            style={s.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            showsUserLocation
            showsMyLocationButton={false}
            customMapStyle={isDark ? darkMapStyle : []}
            mapType="standard">
            {displayed.map(deal => deal.latitude && (
              <Marker
                key={deal.id}
                coordinate={{ latitude: deal.latitude, longitude: deal.longitude }}
                onPress={() => focusDeal(deal)}>
                <View style={[
                  s.marker,
                  { backgroundColor: selectedDeal === deal.id ? CAT_COLORS[deal.categorie] : Colors.white },
                ]}>
                  <Text style={s.markerEmoji}>{deal.icone ?? '🏷️'}</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Badge ville */}
          <View style={[s.mapBadge, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="map-marker" size={13} color={Colors.primary} />
            <Text style={[s.mapBadgeText, { color: Colors.primary }]}>{cityName}</Text>
          </View>

          {/* Bouton recentrer */}
          <TouchableOpacity style={[s.recenterBtn, { backgroundColor: colors.card }]} onPress={getLocation}>
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Compteur */}
        <View style={[s.countRow, { paddingHorizontal: Layout.screenPaddingHorizontal }]}>
          <Text style={[s.countText, { color: colors.textSecondary }]}>
            {displayed.length} bon{displayed.length > 1 ? 's' : ''} plan{displayed.length > 1 ? 's' : ''} à proximité
          </Text>
        </View>

        {/* Deals */}
        <View style={s.listSection}>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          ) : displayed.length === 0 ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="tag-off-outline" size={52} color={colors.textSecondary} />
              <Text style={[s.emptyTitle, { color: colors.text }]}>Aucun bon plan trouvé</Text>
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                Essayez une autre catégorie ou élargissez la zone.
              </Text>
            </View>
          ) : (
            displayed.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                colors={colors}
                onPress={() => {
                  focusDeal(deal);
                  navigation.navigate('DealDetail', { deal });
                }}
              />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  locationChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary + '30', ...Shadows.card },
  locationText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  filtresScroll: { marginBottom: 4 },
  filtresRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Layout.screenPaddingHorizontal, paddingBottom: 8 },
  filtreChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filtreChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtreLabel: { fontSize: 13, fontWeight: '500' },

  mapWrap: { marginHorizontal: Layout.screenPaddingHorizontal, marginBottom: 12, borderRadius: Radius.card, overflow: 'hidden', height: 220, position: 'relative', ...Shadows.card },
  map: { flex: 1 },
  mapBadge: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, ...Shadows.card },
  mapBadgeText: { fontSize: 11, fontWeight: '600' },
  recenterBtn: { position: 'absolute', bottom: 10, right: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...Shadows.card },

  marker: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  markerEmoji: { fontSize: 16 },

  countRow: { marginBottom: 10 },
  countText: { fontSize: 12, fontWeight: '500' },

  listSection: { paddingHorizontal: Layout.screenPaddingHorizontal, gap: 10 },

  dealCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radius.card, overflow: 'hidden', ...Shadows.card },
  dealAccent: { width: 4, alignSelf: 'stretch' },
  dealIconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginVertical: 14, flexShrink: 0 },
  dealEmoji: { fontSize: 24 },
  dealInfo: { flex: 1, gap: 3, paddingVertical: 14 },
  dealTitre: { fontSize: 14, fontWeight: '700' },
  dealDesc: { fontSize: 12, fontWeight: '600' },
  dealMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 12, fontWeight: '700' },
  dealAvis: { fontSize: 11 },
  dealRight: { alignItems: 'flex-end', gap: 6, paddingRight: 14, paddingVertical: 14, flexShrink: 0 },
  dealDist: { fontSize: 11, fontWeight: '600' },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },

  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
});
