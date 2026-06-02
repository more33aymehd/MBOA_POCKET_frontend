import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, Modal, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { userService } from '../../services/userService';
import { useFocusEffect } from '@react-navigation/native';

function EditProfileModal({ visible, profile, token, onClose, onSaved, colors, t }) {
  const [nom, setNom] = useState(profile?.nom ?? '');
  const [telephone, setTelephone] = useState(profile?.telephone ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    try {
      setLoading(true);
      const updated = await userService.updateProfile(token, { nom: nom.trim(), telephone: telephone.trim() });
      onSaved(updated);
      onClose();
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.card }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.editProfile')}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.modalSave}>{t('profile.save')}</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          {[
            { label: t('profile.fullName'), val: nom, set: setNom, placeholder: t('profile.fullName') },
            { label: t('profile.phone'), val: telephone, set: setTelephone, placeholder: '+237 6XX XXX XXX', keyboard: 'phone-pad' },
          ].map(f => (
            <View key={f.label} style={styles.modalField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{f.label}</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={f.val} onChangeText={f.set}
                placeholder={f.placeholder} placeholderTextColor={colors.textSecondary}
                keyboardType={f.keyboard}
              />
            </View>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ChangePasswordModal({ visible, token, onClose, colors, t }) {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (newPwd.length < 8) return Alert.alert(t('common.error'), 'Minimum 8 caractères.');
    if (newPwd !== confirm) return Alert.alert(t('common.error'), 'Les mots de passe ne correspondent pas.');
    try {
      setLoading(true);
      await userService.changePassword(token, current, newPwd);
      Alert.alert('✅', t('common.success'));
      setCurrent(''); setNewPwd(''); setConfirm('');
      onClose();
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { label: t('profile.currentPassword'), val: current, set: setCurrent },
    { label: t('profile.newPassword'), val: newPwd, set: setNewPwd },
    { label: t('profile.confirmPassword'), val: confirm, set: setConfirm },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.card }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose}><Text style={[styles.modalCancel, { color: colors.textSecondary }]}>{t('common.cancel')}</Text></TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile.changePassword')}</Text>
          <TouchableOpacity onPress={handleChange} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.modalSave}>{t('profile.validate')}</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          {fields.map(f => (
            <View key={f.label} style={styles.modalField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{f.label}</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={f.val} onChangeText={f.set}
                secureTextEntry placeholder="••••••••" placeholderTextColor={colors.textSecondary}
              />
            </View>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try { const data = await userService.getProfile(token); setProfile(data); }
    catch { } finally { setRefreshing(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function handleLogout() {
    Alert.alert(t('profile.logoutConfirm'), t('profile.logoutMessage'), [
      { text: t('profile.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => { logout(); navigation.replace('Login'); } },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(t('profile.deleteConfirm'), t('profile.deleteMessage'), [
      { text: t('profile.cancel'), style: 'cancel' },
      {
        text: t('profile.delete'), style: 'destructive',
        onPress: async () => {
          try { await userService.deleteAccount(token); logout(); navigation.replace('Login'); }
          catch (e) { Alert.alert(t('common.error'), e.message); }
        },
      },
    ]);
  }

  const initiales = (profile?.nom ?? user?.nom ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.title')}</Text>
        </View>

        {/* Avatar */}
        <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initiales}</Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile?.nom ?? user?.nom ?? '—'}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile?.email ?? user?.email ?? '—'}</Text>
          <TouchableOpacity style={[styles.editBtn, { borderColor: Colors.primary }]} onPress={() => setEditOpen(true)}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.primary} />
            <Text style={styles.editBtnLabel}>{t('profile.edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.text }]} numberOfLines={1}>
              {profile?.depensesTotales ? (profile.depensesTotales / 1000).toFixed(0) + 'K' : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.totalExpenses')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.text }]}>{profile?.tauxBudgetRespect?.toFixed(0) ?? '—'}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.budgetRespect')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.text }]}>
              {profile?.epargneTotal ? (profile.epargneTotal / 1000).toFixed(0) + 'K' : '0K'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.saved')}</Text>
          </View>
        </View>

        {/* PARAMÈTRES */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profile.settings')}</Text>
        </View>
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>

          {/* Dark mode */}
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="weather-night" size={20} color={colors.textSecondary} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.darkMode')}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Langue */}
          <View style={[styles.settingRow, styles.settingBorder, { borderTopColor: colors.borderLight }]}>
            <MaterialCommunityIcons name="translate" size={20} color={colors.textSecondary} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.language')}</Text>
            <View style={styles.langToggle}>
              <TouchableOpacity
                style={[styles.langBtn, lang === 'fr' && styles.langBtnActive]}
                onPress={() => setLang('fr')}>
                <Text style={[styles.langBtnText, lang === 'fr' && styles.langBtnTextActive]}>FR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
                onPress={() => setLang('en')}>
                <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications */}
          <View style={[styles.settingRow, styles.settingBorder, { borderTopColor: colors.borderLight }]}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile.notifications')}</Text>
            <Switch
              value={profile?.notificationsEnabled ?? true}
              onValueChange={v => userService.updatePreferences(token, { notificationsEnabled: v }).then(setProfile).catch(() => {})}
              trackColor={{ false: colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* COMPTE */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profile.account')}</Text>
        </View>
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          {[
            { label: t('profile.changePassword'), icon: 'lock-outline', onPress: () => setPwdOpen(true) },
            { label: t('profile.notifCenter'), icon: 'bell-ring-outline', onPress: () => navigation.navigate('Notifications') },
            { label: t('profile.monthlyReport'), icon: 'chart-pie', onPress: () => navigation.navigate('BilanMensuel') },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingRow, i > 0 && styles.settingBorder, i > 0 && { borderTopColor: colors.borderLight }]}
              onPress={item.onPress}>
              <MaterialCommunityIcons name={item.icon} size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.settingRow, styles.settingBorder, { borderTopColor: colors.borderLight }]}
            onPress={handleDeleteAccount}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.danger} />
            <Text style={[styles.settingLabel, { color: Colors.danger }]}>{t('profile.deleteAccount')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={Colors.danger} />
          <Text style={styles.logoutLabel}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditProfileModal
        visible={editOpen} profile={profile} token={token}
        onClose={() => setEditOpen(false)} onSaved={setProfile}
        colors={colors} t={t}
      />
      <ChangePasswordModal
        visible={pwdOpen} token={token}
        onClose={() => setPwdOpen(false)}
        colors={colors} t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  profileSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, gap: 6 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: Colors.white },
  profileName: { fontSize: 20, fontWeight: '700' },
  profileEmail: { fontSize: 13 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 8,
  },
  editBtnLabel: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  statsRow: {
    flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 8, marginTop: 10,
    ...Shadows.card,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4 },

  sectionHeader: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 20, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  settingsCard: {
    marginHorizontal: Layout.screenPaddingHorizontal,
    borderRadius: Radius.card, overflow: 'hidden', ...Shadows.card,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  settingBorder: { borderTopWidth: 1 },
  settingLabel: { flex: 1, fontSize: 15 },

  langToggle: { flexDirection: 'row', gap: 4 },
  langBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  langBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary ?? '#6B7280' },
  langBtnTextActive: { color: Colors.white },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Layout.screenPaddingHorizontal, marginTop: 14,
    height: 52, borderRadius: Radius.button,
    borderWidth: 1.5, borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  logoutLabel: { fontSize: 15, fontWeight: '700', color: Colors.danger },

  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSave: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  modalBody: { padding: 20, gap: 20 },
  modalField: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '500' },
  fieldInput: {
    height: 52, borderRadius: Radius.input, borderWidth: 1,
    paddingHorizontal: 16, fontSize: 15,
  },
});
