import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { categoryService } from '../../services/categoryService';
import KeyboardLayout from '../../components/KeyboardLayout';

const EMOJIS = ['🍽️','🚗','🏠','🎮','💊','💰','✈️','📚','👗','⚡','🛒','🎵'];
const COLORS_LIST = ['#1B8A5A','#22C55E','#F5A623','#3B82F6','#EF4444','#8B5CF6','#6B7280','#EC4899'];

export default function AddCategoryScreen({ navigation }) {
  const { token } = useAuth();
  const [nom, setNom] = useState('');
  const [icone, setIcone] = useState('💰');
  const [couleur, setCouleur] = useState('#1B8A5A');
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const m = parseInt(montant.replace(/\s/g, ''), 10);
    if (!nom.trim() || isNaN(m) || m <= 0) return Alert.alert('Erreur', 'Remplissez tous les champs.');
    try {
      setLoading(true);
      await categoryService.create(token, { nom: nom.trim(), icone, couleur, montantAlloue: m });
      navigation.goBack();
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
          <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouvelle zone</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardLayout>
        <View style={styles.inner}>
          {/* Preview */}
          <View style={styles.preview}>
            <View style={[styles.previewIconBg, { backgroundColor: couleur + '20' }]}>
              <Text style={styles.previewIcon}>{icone}</Text>
            </View>
            <Text style={styles.previewNom}>{nom || 'Nouvelle zone'}</Text>
          </View>

          {/* Emoji */}
          <View style={styles.section}>
            <Text style={styles.label}>Icône</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, icone === e && styles.emojiBtnActive]} onPress={() => setIcone(e)}>
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Couleur */}
          <View style={styles.section}>
            <Text style={styles.label}>Couleur</Text>
            <View style={styles.colorRow}>
              {COLORS_LIST.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, couleur === c && styles.colorDotActive]}
                  onPress={() => setCouleur(c)}
                />
              ))}
            </View>
          </View>

          {/* Nom */}
          <View style={styles.section}>
            <Text style={styles.label}>Nom de la zone</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Ex: Alimentation, Transport..."
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
            />
          </View>

          {/* Montant */}
          <View style={styles.section}>
            <Text style={styles.label}>Montant alloué (FCFA)</Text>
            <TextInput
              style={styles.input}
              value={montant}
              onChangeText={setMontant}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>Créer la zone</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardLayout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  inner: { paddingHorizontal: Layout.screenPaddingHorizontal },
  preview: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  previewIconBg: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewIcon: { fontSize: 32 },
  previewNom: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  section: { marginBottom: 20, gap: 10 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.surfaceCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  emojiBtnActive: { borderColor: Colors.primary, borderWidth: 2 },
  emojiText: { fontSize: 22 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.textPrimary },
  input: {
    height: Layout.inputHeight, backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.input, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary,
  },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '500' },
});
