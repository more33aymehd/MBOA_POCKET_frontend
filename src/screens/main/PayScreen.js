import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { categoryService } from '../../services/categoryService';
import { formatFCFA } from '../../utils/format';
import { useFocusEffect } from '@react-navigation/native';

const METHODS = [
  { id: 'ORANGE_MONEY', label: 'Orange Money', desc: 'Paiement mobile',      color: '#FF6B00', icon: '🟠' },
  { id: 'MTN_MOMO',    label: 'MTN MoMo',     desc: 'Paiement mobile',      color: '#FFC200', icon: '🟡' },
  { id: 'CASH',        label: 'Cash',          desc: 'Rappel fin de journée', color: '#6B7280', icon: '💵' },
  { id: 'MOCK',        label: '🧪 Simulateur', desc: 'Test sans vrai paiement', color: Colors.primary, icon: '🧪' },
];

export default function PayScreen({ navigation }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [montant, setMontant] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [phoneFrom, setPhoneFrom] = useState('');

  useFocusEffect(useCallback(() => {
    categoryService.getAll(token).then(setCategories).catch(() => {});
  }, [token]));

  function handleContinuer() {
    const m = parseInt(montant.replace(/\s/g, ''), 10);
    if (!selectedCategory) return Alert.alert('Zone requise', 'Sélectionnez une zone de dépense.');
    if (!selectedMethod) return Alert.alert('Méthode requise', 'Choisissez un moyen de paiement.');
    if (isNaN(m) || m <= 0) return Alert.alert('Montant invalide', 'Entrez un montant valide.');
    if ((selectedMethod === 'ORANGE_MONEY' || selectedMethod === 'MTN_MOMO') && !phoneFrom.trim())
      return Alert.alert('Téléphone requis', 'Entrez votre numéro mobile money.');
    navigation.navigate('Confirmation', {
      categoryId: String(selectedCategory.id),
      categoryNom: selectedCategory.nom,
      categoryIcone: selectedCategory.icone,
      categoryRestant: String(selectedCategory.montantRestant ?? 0),
      montant: String(m),
      methode: selectedMethod,
      merchantName: merchantName.trim() || 'Marchand',
      phoneFrom: phoneFrom.trim(),
    });
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.borderLight }]}>
        <Text style={[s.title, { color: colors.text }]}>Effectuer un paiement</Text>
        <TouchableOpacity
          style={[s.scanBtn, { backgroundColor: colors.accent ?? Colors.accent }]}
          onPress={() => navigation.navigate('Scanner', {
            categoryId: selectedCategory ? String(selectedCategory.id) : '',
            categoryNom: selectedCategory?.nom ?? '',
            categoryIcone: selectedCategory?.icone ?? '',
            categoryRestant: selectedCategory ? String(selectedCategory.montantRestant ?? 0) : '0',
          })}>
          <MaterialCommunityIcons name="qrcode-scan" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Zone */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Zone de dépense</Text>
          <Text style={[s.sectionSub, { color: colors.textSecondary }]}>Sur quel budget imputer ce paiement ?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.chipsRow}>
              {categories.map(cat => {
                const active = selectedCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.chip, { backgroundColor: colors.inputBg, borderColor: colors.border }, active && s.chipActive]}
                    onPress={() => setSelectedCategory(cat)}>
                    <Text style={s.chipEmoji}>{cat.icone}</Text>
                    <Text style={[s.chipName, { color: active ? Colors.white : colors.text }]}>{cat.nom}</Text>
                    <Text style={[s.chipAmt, { color: active ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                      {formatFCFA(cat.montantRestant ?? 0)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Montant */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Montant (FCFA)</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={montant} onChangeText={setMontant}
            keyboardType="numeric" placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Marchand */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Nom du marchand (optionnel)</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={merchantName} onChangeText={setMerchantName}
            placeholder="Ex: Chez Paul Restaurant"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Méthode */}
        <View style={[s.section, { backgroundColor: colors.card }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Comment voulez-vous payer ?</Text>
          <View style={s.methodsGrid}>
            {METHODS.map(m => {
              const active = selectedMethod === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[s.methodCard, { backgroundColor: colors.card, borderColor: active ? Colors.primary : colors.border }, active && s.methodCardActive]}
                  onPress={() => setSelectedMethod(m.id)}>
                  <View style={[s.methodIconBg, { backgroundColor: m.color + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                  </View>
                  <Text style={[s.methodName, { color: colors.text }]}>{m.label}</Text>
                  <Text style={[s.methodDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Téléphone */}
        {(selectedMethod === 'ORANGE_MONEY' || selectedMethod === 'MTN_MOMO') && (
          <View style={[s.section, { backgroundColor: colors.card }]}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              Votre numéro {selectedMethod === 'ORANGE_MONEY' ? 'Orange' : 'MTN'}
            </Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={phoneFrom} onChangeText={setPhoneFrom}
              placeholder="237690000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={[s.bottom, { backgroundColor: colors.card, borderTopColor: colors.borderLight }]}>
        <TouchableOpacity style={s.btn} onPress={handleContinuer}>
          <Text style={s.btnLabel}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: Layout.screenPaddingHorizontal, borderBottomWidth: 1, position: 'relative' },
  title: { fontSize: 20, fontWeight: '700' },
  scanBtn: { position: 'absolute', right: Layout.screenPaddingHorizontal, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 24 },
  section: { padding: Layout.screenPaddingHorizontal, marginBottom: 8, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '500' },
  sectionSub: { fontSize: 13, marginTop: -4 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { alignItems: 'center', gap: 2, borderRadius: 14, padding: 10, paddingHorizontal: 12, borderWidth: 1 },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipEmoji: { fontSize: 18 },
  chipName: { fontSize: 12, fontWeight: '500' },
  chipAmt: { fontSize: 10, fontWeight: '700' },
  input: { height: Layout.inputHeight, borderRadius: Radius.input, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  methodCard: { width: '47%', borderRadius: Radius.card, padding: 14, gap: 8, borderWidth: 1, ...Shadows.card },
  methodCardActive: { borderWidth: 2 },
  methodIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodName: { fontSize: 14, fontWeight: '500' },
  methodDesc: { fontSize: 12 },
  bottom: { padding: Layout.screenPaddingHorizontal, borderTopWidth: 1 },
  btn: { height: Layout.buttonHeight, backgroundColor: Colors.primary, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center', ...Shadows.button },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '500' },
});
