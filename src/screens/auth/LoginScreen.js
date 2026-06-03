import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const { isLandscape } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  // 2FA
  const [step, setStep] = useState('login'); // 'login' | '2fa'
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Champs requis', 'Remplissez email et mot de passe.');
      return;
    }
    try {
      setLoading(true);
      const res = await authService.login(email.trim(), password);
      if (res.requiresTwoFactor) {
        setTempToken(res.tempToken);
        setStep('2fa');
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2fa() {
    if (code.length !== 6) {
      Alert.alert('Code invalide', 'Entrez le code à 6 chiffres reçu par email.');
      return;
    }
    try {
      setLoading(true);
      const res = await authService.verify2fa(tempToken, code);
      await login(res.token, { id: res.userId, nom: res.nom, email: res.email });
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Code incorrect', e.message);
      setCode('');
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
      {!isLandscape && <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>}
    </View>
  );

  const form = (
    <View style={styles.form}>
      {isLandscape && (
        <Text style={styles.titleLandscape}>Bon retour 👋</Text>
      )}
      {!isLandscape && (
        <Text style={styles.title}>Bon retour 👋</Text>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemple.com"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.pwdRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Entrez votre mot de passe"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry={!showPwd}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
            <MaterialCommunityIcons name={showPwd ? 'eye-off' : 'eye'} size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={styles.forgot}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>Se connecter</Text>}
      </TouchableOpacity>

      <View style={styles.orRow}>
        <View style={styles.line} /><Text style={styles.orText}>ou</Text><View style={styles.line} />
      </View>

      <TouchableOpacity style={styles.socialBtn}>
        <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
        <Text style={styles.socialLabel}>Continuer avec Google</Text>
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={styles.registerText}>Pas encore de compte ? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (step === '2fa') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.card }]} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.portraitScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.branding}>
              <View style={styles.logoBox}><Text style={styles.logoLetter}>M</Text></View>
              <Text style={styles.appName}>Mboapocket</Text>
            </View>
            <View style={styles.form}>
              <Text style={styles.title}>Vérification</Text>
              <Text style={[styles.twoFaSubtitle, { color: Colors.textSecondary }]}>
                Un code à 6 chiffres a été envoyé à{'\n'}<Text style={{ color: Colors.primary, fontWeight: '600' }}>{email}</Text>
              </Text>
              <View style={styles.field}>
                <Text style={styles.label}>Code de vérification</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={code}
                  onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
              <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleVerify2fa} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnLabel}>Vérifier</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('login'); setCode(''); }} style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>← Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.card }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {isLandscape ? (
          <View style={styles.landscapeContainer}>
            {branding}
            <ScrollView
              style={[styles.flex, { backgroundColor: colors.card }]}
              contentContainerStyle={styles.landscapeScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {form}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.portraitScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {branding}
            {form}
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
    paddingTop: 40, paddingBottom: 40,
    gap: 32,
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },

  logoBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { fontSize: 24, fontWeight: '800', color: Colors.white },
  appName: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  titleLandscape: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },

  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  input: {
    height: Layout.inputHeight, backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.input, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary,
  },
  pwdRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  eyeBtn: {
    width: Layout.inputHeight, height: Layout.inputHeight,
    backgroundColor: Colors.surfaceCard, borderRadius: Radius.input,
    borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  forgotRow: { alignItems: 'flex-end', marginTop: 4 },
  forgot: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    marginTop: 4, ...Shadows.button,
  },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { fontSize: 13, color: Colors.textSecondary },
  socialBtn: {
    height: 48, borderRadius: Radius.input, borderWidth: 1, borderColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  socialLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  registerText: { fontSize: 14, color: Colors.textSecondary },
  registerLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  twoFaSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: -8 },
  codeInput: { textAlign: 'center', fontSize: 28, fontWeight: '700', letterSpacing: 12 },
});
