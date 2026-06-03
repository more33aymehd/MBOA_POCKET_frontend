import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { formatFCFA } from '../../utils/format';

const METHOD_LABELS = {
  ORANGE_MONEY: { label: 'Orange Money', color: '#FF6B00' },
  MTN_MOMO: { label: 'MTN MoMo', color: '#FFC200' },
  CASH: { label: 'Cash', color: '#6B7280' },
  MOCK: { label: '🧪 Simulateur', color: Colors.primary },
};

const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];

export default function ConfirmationScreen({ navigation, route }) {
  const { token } = useAuth();
  const params = route.params ?? {};
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const montant = parseInt(params.montant ?? '0', 10);
  const restantApres = parseInt(params.categoryRestant ?? '0', 10) - montant;
  const method = METHOD_LABELS[params.methode ?? ''] ?? { label: params.methode, color: Colors.primary };
  const budgetPct = parseInt(params.categoryRestant ?? '1', 10) > 0
    ? (montant / parseInt(params.categoryRestant, 10)) * 100 : 0;

  function handleKey(key) {
    if (key === '⌫') setPin(p => p.slice(0, -1));
    else if (key === '✓') handleConfirm();
    else if (pin.length < 4) setPin(p => p + key);
  }

  async function handleConfirm() {
    if (params.methode !== 'MOCK' && params.methode !== 'CASH' && pin.length < 4) {
      return Alert.alert('PIN requis', 'Entrez votre code PIN à 4 chiffres.');
    }
    try {
      setLoading(true);
      const result = await paymentService.initiate(token, {
        categoryId: params.categoryId ? parseInt(params.categoryId, 10) : null,
        montant,
        methode: params.methode,
        phoneFrom: params.phoneFrom || undefined,
        merchantName: params.merchantName,
        description: `Paiement chez ${params.merchantName}`,
      });
      navigation.replace('SuccesPaiement', {
        reference: result.reference,
        montant: String(result.montant),
        merchantName: params.merchantName,
        methode: params.methode,
        categoryNom: params.categoryNom,
        categoryIcone: params.categoryIcone,
        categoryRestant: String(restantApres),
        categoryAlloue: params.categoryRestant,
      });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmer le paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.recapCard}>
          <View style={styles.merchantRow}>
            <View style={styles.merchantIconBg}>
              <Text style={styles.merchantEmoji}>🏪</Text>
            </View>
            <Text style={styles.merchantName}>{params.merchantName}</Text>
            {params.phoneFrom ? <Text style={styles.merchantPhone}>{params.phoneFrom}</Text> : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Montant à payer</Text>
            <Text style={styles.amountValue}>{formatFCFA(montant)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            {[
              { label: 'Via', value: method.label, color: method.color },
              { label: 'Zone imputée', value: `${params.categoryIcone} ${params.categoryNom}` },
              { label: 'Budget restant après', value: formatFCFA(Math.max(restantApres, 0)), color: restantApres < 0 ? Colors.danger : Colors.primary },
            ].map(r => (
              <View key={r.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{r.label}</Text>
                <Text style={[styles.detailValue, r.color && { color: r.color }]}>{r.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {budgetPct > 70 && (
          <View style={styles.warning}>
            <MaterialCommunityIcons name="alert-triangle" size={18} color="#D97706" />
            <Text style={styles.warningText}>Il vous restera moins de {Math.round(100 - budgetPct)}% sur {params.categoryNom}</Text>
          </View>
        )}

        {params.methode !== 'CASH' && params.methode !== 'MOCK' && (
          <>
            <View style={styles.pinSection}>
              <Text style={styles.pinLabel}>Entrez votre code PIN</Text>
              <View style={styles.pinDots}>
                {[0,1,2,3].map(i => <View key={i} style={[styles.pinDot, i < pin.length && styles.pinDotFilled]} />)}
              </View>
            </View>
            <View style={styles.keypad}>
              {[0,1,2,3].map(row => (
                <View key={row} style={styles.keyRow}>
                  {KEYS.slice(row * 3, row * 3 + 3).map(key => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.key, key === '✓' && styles.keyConfirm, key === '⌫' && styles.keyDel]}
                      onPress={() => handleKey(key)}>
                      <Text style={[styles.keyLabel, key === '✓' && styles.keyConfirmLabel]}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.secureRow}>
          <MaterialCommunityIcons name="lock" size={14} color={Colors.textSecondary} />
          <Text style={styles.secureText}>Paiement sécurisé via Mboapocket</Text>
        </View>
      </ScrollView>

      {(params.methode === 'CASH' || params.methode === 'MOCK') && (
        <View style={styles.bottom}>
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleConfirm} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>Confirmer</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Layout.screenPaddingHorizontal, gap: 12, paddingBottom: 24 },
  recapCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, gap: 16, ...Shadows.card },
  merchantRow: { alignItems: 'center', gap: 8 },
  merchantIconBg: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  merchantEmoji: { fontSize: 26 },
  merchantName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  merchantPhone: { fontSize: 13, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  amountSection: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  amountLabel: { fontSize: 13, color: Colors.textSecondary },
  amountValue: { fontSize: 40, fontWeight: '700', color: Colors.textPrimary },
  detailsSection: { gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  warning: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12,
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400E' },
  pinSection: { alignItems: 'center', gap: 12 },
  pinLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  pinDots: { flexDirection: 'row', gap: 16 },
  pinDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB' },
  pinDotFilled: { backgroundColor: Colors.primary },
  keypad: { gap: 8, paddingHorizontal: 24 },
  keyRow: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 58, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.card },
  keyDel: { backgroundColor: '#F3F4F6' },
  keyConfirm: { backgroundColor: Colors.primary },
  keyLabel: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  keyConfirmLabel: { color: Colors.white },
  secureRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 8 },
  secureText: { fontSize: 12, color: Colors.textSecondary },
  bottom: { padding: Layout.screenPaddingHorizontal, backgroundColor: Colors.white },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '500' },
});
