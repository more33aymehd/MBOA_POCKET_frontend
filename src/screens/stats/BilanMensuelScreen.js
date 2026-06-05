import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { statsService } from '../../services/statsService';
import { formatFCFA, nomMois } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';

const CHART_COLORS = ['#1B8A5A', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

function DonutChart({ categories, size = 160, colors }) {
  const r = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filtered = categories.filter(c => c.montantDepense > 0);
  const total = filtered.reduce((s, c) => s + c.montantDepense, 0);

  let offset = 0;
  const segments = filtered.map(cat => {
    const pct = total > 0 ? cat.montantDepense / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { cat, dash, gap, offset };
    offset += dash;
    return seg;
  });

  if (filtered.length === 0) {
    return (
      <View style={[s.donutWrap, { width: size, height: size }]}>
        <View style={[s.donutEmpty, { width: size, height: size, borderRadius: size / 2, borderColor: colors.border }]} />
        <View style={s.donutCenter}>
          <Text style={[s.donutCenterText, { color: colors.textSecondary }]}>—</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.donutWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx},${cy}`}>
          {segments.map(({ cat, dash, gap, offset: off }, i) => (
            <Circle
              key={cat.categoryId ?? i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={cat.couleur || CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={22}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-off}
            />
          ))}
        </G>
      </Svg>
      <View style={s.donutCenter}>
        <Text style={[s.donutCenterPct, { color: colors.text }]}>{Math.round(filtered[0]?.pourcentageBudget ?? 0)}%</Text>
        <Text style={[s.donutCenterLabel, { color: colors.textSecondary }]} numberOfLines={1}>{filtered[0]?.nom ?? ''}</Text>
      </View>
    </View>
  );
}

function BarChart({ categories, colors }) {
  const max = Math.max(...categories.map(c => Math.max(c.montantAlloue, c.montantDepense)), 1);
  return (
    <View style={s.barChart}>
      <View style={s.barsRow}>
        {categories.slice(0, 6).map((cat, i) => {
          const hAlloue = ((cat.montantAlloue / max) * 80);
          const hDepense = ((cat.montantDepense / max) * 80);
          const color = cat.couleur || CHART_COLORS[i % CHART_COLORS.length];
          const over = cat.montantDepense > cat.montantAlloue;
          return (
            <View key={cat.categoryId ?? i} style={s.barGroup}>
              <View style={s.barBars}>
                <View style={[s.bar, { height: Math.max(hAlloue, 4), backgroundColor: colors.border }]} />
                <View style={[s.bar, { height: Math.max(hDepense, 4), backgroundColor: over ? Colors.danger : color }]} />
              </View>
              <Text style={[s.barLabel, { color: colors.textSecondary }]} numberOfLines={1}>{cat.nom.slice(0, 5)}</Text>
            </View>
          );
        })}
      </View>
      <View style={s.barLegend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: colors.border }]} />
          <Text style={[s.legendText, { color: colors.textSecondary }]}>Alloué</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={[s.legendText, { color: colors.textSecondary }]}>Dépensé</Text>
        </View>
      </View>
    </View>
  );
}

export default function BilanMensuelScreen({ navigation }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await statsService.getMonthly(token, mois, annee);
      setStats(data);
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, mois, annee]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function prevMois() {
    if (mois === 1) { setMois(12); setAnnee(a => a - 1); }
    else setMois(m => m - 1);
  }
  function nextMois() {
    if (mois === 12) { setMois(1); setAnnee(a => a + 1); }
    else setMois(m => m + 1);
  }

  async function handleShare() {
    if (!stats) return;
    const txt = `📊 Bilan ${nomMois(mois)} ${annee} — Mboapocket\n\n`
      + `Revenu : ${formatFCFA(stats.revenuMensuel)}\n`
      + `Dépensé : ${formatFCFA(stats.totalDepense)}\n`
      + `Restant : ${formatFCFA(stats.montantRestant)}\n`
      + `Épargne : ${formatFCFA(stats.epargnRealisee)}\n`;
    await Share.share({ message: txt });
  }

  const isCurrentMonth = mois === now.getMonth() + 1 && annee === now.getFullYear();
  const cats = stats?.categories ?? [];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Bilan Mensuel</Text>
        <TouchableOpacity onPress={handleShare}>
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Sélecteur de mois */}
      <View style={[s.monthSelector, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={prevMois} style={s.arrowBtn}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.monthLabel, { color: colors.text }]}>{nomMois(mois)} {annee}</Text>
        <TouchableOpacity onPress={nextMois} style={s.arrowBtn} disabled={isCurrentMonth}>
          <MaterialCommunityIcons name="chevron-right" size={22} color={isCurrentMonth ? colors.border : colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

          {/* Hero Card Gradient */}
          <LinearGradient colors={['#1B8A5A', '#156B46']} style={s.heroCard} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            <View style={s.heroBadge}>
              <MaterialCommunityIcons name={isCurrentMonth ? 'clock-outline' : 'check-circle'} size={12} color="rgba(255,255,255,0.8)" />
              <Text style={s.heroBadgeText}>{isCurrentMonth ? 'Mois en cours' : 'Mois terminé'}</Text>
            </View>
            <View style={s.heroStats}>
              {[
                { label: 'Revenu',  val: stats?.revenuMensuel },
                { label: 'Dépensé', val: stats?.totalDepense },
                { label: 'Épargne', val: stats?.epargnRealisee != null ? Math.max(stats.epargnRealisee, 0) : null },
              ].map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <View style={s.heroStatDivider} />}
                  <View style={s.heroStat}>
                    <Text style={s.heroStatLabel}>{item.label}</Text>
                    <Text style={s.heroStatVal}>{item.val != null ? (item.val / 1000).toFixed(0) + 'K' : '—'}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            <Text style={s.heroNote}>Montants en FCFA</Text>
            {stats?.revenuMensuel > 0 && (
              <View style={s.heroBar}>
                <View style={[s.heroBarFill, {
                  width: `${Math.min(stats.tauxUtilisation, 100)}%`,
                  backgroundColor: stats.tauxUtilisation > 90 ? Colors.danger : stats.tauxUtilisation > 70 ? Colors.warning : '#4ADE80',
                }]} />
              </View>
            )}
            {stats?.evolutionPct !== undefined && (
              <Text style={s.heroEvol}>
                {stats.evolutionPct > 0 ? `↑ +${stats.evolutionPct}%` : stats.evolutionPct < 0 ? `↓ ${stats.evolutionPct}%` : '= Stable'} vs mois précédent
              </Text>
            )}
          </LinearGradient>

          {/* Donut */}
          {cats.length > 0 && (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <Text style={[s.cardTitle, { color: colors.text }]}>Répartition des dépenses</Text>
              <View style={s.donutSection}>
                <DonutChart categories={cats} size={150} colors={colors} />
                <View style={s.legend}>
                  {cats.filter(c => c.montantDepense > 0).slice(0, 6).map((cat, i) => (
                    <View key={cat.categoryId ?? i} style={s.legendRow}>
                      <View style={[s.legendDotBig, { backgroundColor: cat.couleur || CHART_COLORS[i % CHART_COLORS.length] }]} />
                      <Text style={[s.legendName, { color: colors.text }]} numberOfLines={1}>{cat.nom}</Text>
                      <Text style={[s.legendPct, { color: colors.textSecondary }]}>{cat.pourcentageBudget?.toFixed(0)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Points forts / faibles */}
          {((stats?.pointsForts?.length > 0) || (stats?.pointsFaibles?.length > 0)) && (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <Text style={[s.cardTitle, { color: colors.text }]}>Points clés</Text>
              {(stats?.pointsForts ?? []).map((p, i) => (
                <View key={i} style={s.pointRow}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={[s.pointText, { color: colors.text }]}>{p}</Text>
                </View>
              ))}
              {(stats?.pointsFaibles ?? []).map((p, i) => (
                <View key={i} style={s.pointRow}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.warning} />
                  <Text style={[s.pointText, { color: colors.text }]}>{p}</Text>
                </View>
              ))}
              {!(stats?.pointsForts?.length) && !(stats?.pointsFaibles?.length) && (
                <Text style={[s.noPoints, { color: colors.textSecondary }]}>Pas encore assez de données ce mois.</Text>
              )}
            </View>
          )}

          {/* Bar Chart */}
          {cats.length > 0 && (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <Text style={[s.cardTitle, { color: colors.text }]}>Budget par zone</Text>
              <BarChart categories={cats} colors={colors} />
            </View>
          )}

          {/* Détail catégories */}
          {cats.length > 0 && (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <Text style={[s.cardTitle, { color: colors.text }]}>Détail par zone</Text>
              {cats.map((cat, i) => {
                const color = cat.couleur || CHART_COLORS[i % CHART_COLORS.length];
                const over = cat.progressPercent > 100;
                return (
                  <View key={cat.categoryId ?? i} style={[s.catRow, i > 0 && [s.catBorder, { borderTopColor: colors.borderLight }]]}>
                    <View style={[s.catIconBg, { backgroundColor: color + '20' }]}>
                      <Text style={s.catEmoji}>{cat.icone}</Text>
                    </View>
                    <View style={s.catInfo}>
                      <View style={s.catTop}>
                        <Text style={[s.catNom, { color: colors.text }]}>{cat.nom}</Text>
                        <Text style={[s.catPct, { color: over ? Colors.danger : color }]}>{cat.progressPercent?.toFixed(0)}%</Text>
                      </View>
                      <View style={[s.catBar, { backgroundColor: colors.border }]}>
                        <View style={[s.catBarFill, { width: `${Math.min(cat.progressPercent, 100)}%`, backgroundColor: over ? Colors.danger : color }]} />
                      </View>
                      <Text style={[s.catAmounts, { color: colors.textSecondary }]}>
                        {formatFCFA(cat.montantDepense)} / {formatFCFA(cat.montantAlloue)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {!isCurrentMonth && (
            <TouchableOpacity style={[s.nextMonthBtn, { backgroundColor: colors.card }]} onPress={nextMois}>
              <Text style={s.nextMonthLabel}>Voir le mois de {nomMois(mois === 12 ? 1 : mois + 1)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 10, borderBottomWidth: 1 },
  arrowBtn: { padding: 4 },
  monthLabel: { fontSize: 16, fontWeight: '700', minWidth: 140, textAlign: 'center' },
  heroCard: { marginHorizontal: Layout.screenPaddingHorizontal, marginTop: 16, borderRadius: 20, padding: 18, gap: 10 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroBadgeText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center', gap: 3 },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  heroStatVal: { fontSize: 20, fontWeight: '800', color: Colors.white },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroNote: { fontSize: 10, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  heroBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: 3 },
  heroEvol: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  card: { borderRadius: Radius.card, marginHorizontal: Layout.screenPaddingHorizontal, marginTop: 14, padding: 16, gap: 14, ...Shadows.card },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  donutSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  donutWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  donutEmpty: { borderWidth: 22 },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutCenterPct: { fontSize: 18, fontWeight: '800' },
  donutCenterLabel: { fontSize: 10, maxWidth: 70, textAlign: 'center' },
  donutCenterText: { fontSize: 20 },
  legend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDotBig: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendName: { flex: 1, fontSize: 12 },
  legendPct: { fontSize: 12, fontWeight: '700' },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pointText: { flex: 1, fontSize: 13, lineHeight: 20 },
  noPoints: { fontSize: 13, textAlign: 'center' },
  barChart: { gap: 10 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 },
  barGroup: { flex: 1, alignItems: 'center', gap: 4 },
  barBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 12, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 9, textAlign: 'center' },
  barLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  catBorder: { borderTopWidth: 1 },
  catIconBg: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catEmoji: { fontSize: 18 },
  catInfo: { flex: 1, gap: 5 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catNom: { fontSize: 13, fontWeight: '600' },
  catPct: { fontSize: 13, fontWeight: '700' },
  catBar: { height: 5, borderRadius: 99, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 99 },
  catAmounts: { fontSize: 11 },
  nextMonthBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: Layout.screenPaddingHorizontal, marginTop: 14, borderRadius: Radius.card, padding: 16, ...Shadows.card },
  nextMonthLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
