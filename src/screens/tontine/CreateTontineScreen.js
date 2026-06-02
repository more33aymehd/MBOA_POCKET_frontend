import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { tontineService } from '../../services/tontineService';
import KeyboardLayout from '../../components/KeyboardLayout';

const FREQUENCES = [
  { id: 'MENSUEL', label: 'Chaque mois', icon: 'calendar-month' },
  { id: 'HEBDOMADAIRE', label: 'Chaque semaine', icon: 'calendar-week' },
  { id: 'BIMENSUEL', label: 'Tous les 2 mois', icon: 'calendar' },
];

const TOURS_OPTIONS = [6, 8, 10, 12];

export default function CreateTontineScreen({ navigation }) {
  const { token } = useAuth();
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('50000');
  const [frequence, setFrequence] = useState('MENSUEL');
  const [nbTours, setNbTours] = useState(10);
  const [emailInput, setEmailInput] = useState('');
  const [membres, setMembres] = useState([]);
  const [loading, setLoading] = useState(false);

  function addMember() {
    const email = emailInput.trim().toLowerCase();
    if (!email.includes('@')) {
      Alert.alert('Email invalide', 'Entrez une adresse email valide.');
      return;
    }
    if (membres.includes(email)) {
      Alert.alert('Déjà ajouté', 'Cet email est déjà dans la liste.');
      return;
    }
    setMembres(prev => [...prev, email]);
    setEmailInput('');
  }

  function removeMember(email) {
    setMembres(prev => prev.filter(e => e !== email));
  }

  async function handleCreate() {
    if (!nom.trim()) return Alert.alert('Champ requis', 'Donnez un nom à votre tontine.');
    const m = parseInt(montant.replace(/\s/g, ''), 10);
    if (isNaN(m) || m < 1000) return Alert.alert('Montant invalide', 'Minimum 1 000 FCFA.');

    try {
      setLoading(true);
      const tontine = await tontineService.create(token, {
        nom: nom.trim(),
        description: description.trim() || undefined,
        montantParTour: m,
        frequence,
        nbTours,
        membresEmails: membres,
      });
      navigation.replace('TontineDetail', { id: tontine.id });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  const montantNum = parseInt(montant.replace(/\s/g, ''), 10) || 0;
  const totalParTour = montantNum * (membres.length + 1); // +1 pour le créateur

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Créer une tontine</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardLayout>
        <View style={styles.inner}>

          {/* Infos générales */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Infos générales</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="format-title" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder="Tontine du quartier"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="text" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez l'objectif..."
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          {/* Paramètres financiers */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Paramètres financiers</Text>

            <View style={styles.montantRow}>
              <TextInput
                style={styles.montantInput}
                value={montant}
                onChangeText={setMontant}
                keyboardType="numeric"
                returnKeyType="done"
              />
              <Text style={styles.montantUnit}>FCFA / personne</Text>
            </View>

            {/* Fréquence */}
            <View style={styles.optionsRow}>
              {FREQUENCES.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.optionChip, frequence === f.id && styles.optionChipActive]}
                  onPress={() => setFrequence(f.id)}>
                  <MaterialCommunityIcons name={f.icon} size={14} color={frequence === f.id ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.optionChipLabel, frequence === f.id && styles.optionChipLabelActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nombre de tours */}
            <View style={styles.toursRow}>
              <Text style={styles.toursLabel}>Nombre de tours</Text>
              <View style={styles.toursOptions}>
                {TOURS_OPTIONS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.tourChip, nbTours === n && styles.tourChipActive]}
                    onPress={() => setNbTours(n)}>
                    <Text style={[styles.tourChipLabel, nbTours === n && styles.tourChipLabelActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calcul */}
            {montantNum > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcText}>
                  {membres.length + 1} × {montantNum.toLocaleString('fr-FR')} = {totalParTour.toLocaleString('fr-FR')} FCFA par tour
                </Text>
              </View>
            )}
          </View>

          {/* Membres invités */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Membres invités</Text>
            <View style={styles.emailRow}>
              <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Rechercher par email"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={addMember}
              />
              <TouchableOpacity onPress={addMember} style={styles.addBtn}>
                <MaterialCommunityIcons name="plus" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {membres.map(email => (
              <View key={email} style={styles.memberChip}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{email[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.memberEmail} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => removeMember(email)}>
                  <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>Continuer</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardLayout>
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
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },

  inner: { padding: Layout.screenPaddingHorizontal, gap: 16 },

  section: {
    backgroundColor: Colors.white, borderRadius: Radius.card,
    padding: 16, gap: 12, ...Shadows.card,
  },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 4 },

  montantRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  montantInput: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  montantUnit: { fontSize: 14, color: Colors.textSecondary },

  optionsRow: { gap: 6 },
  optionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: '#E5E7EB',
  },
  optionChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionChipLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  optionChipLabelActive: { color: Colors.white },

  toursRow: { gap: 8 },
  toursLabel: { fontSize: 13, color: Colors.textSecondary },
  toursOptions: { flexDirection: 'row', gap: 8 },
  tourChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surfaceCard, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  tourChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tourChipLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tourChipLabelActive: { color: Colors.white },

  calcRow: { backgroundColor: Colors.accent, borderRadius: 10, padding: 12 },
  calcText: { fontSize: 13, fontWeight: '600', color: Colors.primary, textAlign: 'center' },

  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: Radius.input,
    paddingHorizontal: 12, height: 48,
  },
  addBtn: { padding: 4 },

  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.accent, borderRadius: 10, padding: 10,
  },
  memberAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  memberEmail: { flex: 1, fontSize: 13, color: Colors.textPrimary },

  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
