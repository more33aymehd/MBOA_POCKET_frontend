import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

const FIELDS = [
  { key: 'nom',       label: 'Nom complet',            placeholder: 'Entrez votre nom',       keyboard: 'default',       auto: 'words' },
  { key: 'email',     label: 'Email',                  placeholder: 'email@exemple.com',       keyboard: 'email-address', auto: 'none' },
  { key: 'telephone', label: 'Téléphone',              placeholder: '+237 6XX XXX XXX',        keyboard: 'phone-pad',     auto: 'none' },
  { key: 'password',  label: 'Mot de passe',           placeholder: 'Minimum 8 caractères',   keyboard: 'default',       auto: 'none', secure: true },
  { key: 'confirm',   label: 'Confirmer mot de passe', placeholder: 'Confirmez le mot de passe', keyboard: 'default',    auto: 'none', secure: true },
];

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const { isLandscape } = useResponsive();
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  async function handleRegister() {
    if (!form.nom.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Champs requis', 'Remplissez tous les champs obligatoires.');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    try {
      setLoading(true);
      const res = await authService.register({
        nom: form.nom.trim(), email: form.email.trim(),
        telephone: form.telephone, password: form.password,
      });
      await login(res.token, { id: res.userId, nom: res.nom, email: res.email });
      navigation.replace('SetupBudget');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  const branding = (
    <View style={[styles.branding, isLandscape && styles.brandingLandscape]}>
      <View style={styles.logoBox}>
        <Text style={styles.logoLetter}>M</Text>
      </View>
      <Text style={styles.appName}>Mboapocket</Text>
      {isLandscape && <Text style={styles.tagline}>Votre argent,{'\n'}votre communauté</Text>}
    </View>
  );

  const formContent = (
    <View style={styles.form}>
      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>Rejoignez la communauté Mboapocket</Text>

      {FIELDS.map(f => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={form[f.key]}
            onChangeText={v => set(f.key, v)}
            placeholder={f.placeholder}
            placeholderTextColor={Colors.textSecondary}
            keyboardType={f.keyboard}
            autoCapitalize={f.auto}
            secureTextEntry={!!f.secure}
            returnKeyType="next"
          />
        </View>
      ))}

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>S'inscrire</Text>}
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Déjà un compte ? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.card }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {isLandscape ? (
          <View style={styles.landscapeContainer}>
            {branding}
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.landscapeScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {formContent}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.portraitScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {branding}
            {formContent}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },

  portraitScroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: 36, paddingBottom: 40,
    gap: 24,
  },

  landscapeContainer: { flex: 1, flexDirection: 'row' },
  landscapeScroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
  },

  branding: { alignItems: 'center', gap: 8 },
  brandingLandscape: {
    width: '38%',
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingHorizontal: 24,
  },
  logoBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { fontSize: 24, fontWeight: '800', color: Colors.white },
  appName: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  tagline: {
    fontSize: 14, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },

  form: { gap: 14 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  field: { gap: 5 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  input: {
    height: Layout.inputHeight, backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.input, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary,
  },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    marginTop: 4, ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  loginText: { fontSize: 14, color: Colors.textSecondary },
  loginLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});
