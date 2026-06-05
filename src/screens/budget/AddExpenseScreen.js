import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { expenseService } from '../../services/expenseService';
import { notificationService } from '../../services/notificationService';
import KeyboardLayout from '../../components/KeyboardLayout';

export default function AddExpenseScreen({ navigation, route }) {
  const { token } = useAuth();
  const categoryId = route.params?.categoryId;
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const m = parseInt(montant.replace(/\s/g, ''), 10);
    if (!categoryId || isNaN(m) || m <= 0) return Alert.alert('Erreur', 'Entrez un montant valide.');
    try {
      setLoading(true);
      const result = await expenseService.create(token, {
        categoryId: Number(categoryId),
        montant: m,
        description: description.trim() || undefined,
      });
      notificationService.notifyExpenseCreated({
        montant: m,
        categoryNom: result?.categoryNom ?? route.params?.categoryNom,
        categoryIcone: result?.categoryIcone ?? route.params?.categoryIcone,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header fixe en dehors du scroll */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouvelle dépense</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardLayout>
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Montant (FCFA)</Text>
            <TextInput
              style={styles.input}
              value={montant}
              onChangeText={setMontant}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Restaurant, Carburant..."
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>Enregistrer</Text>}
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
  form: { padding: Layout.screenPaddingHorizontal, gap: 20, flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  input: {
    height: Layout.inputHeight, backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.input, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary,
  },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '500' },
});
