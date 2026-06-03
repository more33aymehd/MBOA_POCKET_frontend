import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { scannerService } from '../../services/scannerService';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.65;

export default function ScannerScreen({ navigation, route }) {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [merchantInput, setMerchantInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const categoryId = route.params?.categoryId ?? '';
  const categoryNom = route.params?.categoryNom ?? '';
  const categoryIcone = route.params?.categoryIcone ?? '';
  const categoryRestant = route.params?.categoryRestant ?? '0';

  async function handleDecode(content) {
    if (loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const result = await scannerService.decode(token, content);
      navigateToConfirmation(result);
    } catch (e) {
      Alert.alert('Erreur de scan', e.message, [
        { text: 'Réessayer', onPress: () => { setScanned(false); setLoading(false); } },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleManualValidate() {
    if (!merchantInput.trim()) {
      Alert.alert('Champ requis', 'Entrez le numéro ou nom du marchand.');
      return;
    }
    handleDecode(merchantInput.trim());
  }

  function navigateToConfirmation(result) {
    const montant = amountInput.trim()
      ? parseInt(amountInput.replace(/\s/g, ''), 10)
      : result.suggestedAmount ?? 0;

    navigation.replace('Confirmation', {
      categoryId,
      categoryNom,
      categoryIcone,
      categoryRestant,
      montant: String(montant),
      methode: result.method ?? 'MOCK',
      merchantName: result.merchant ?? 'Marchand',
      phoneFrom: result.phoneNumber ?? '',
    });
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionScreen}>
          <MaterialCommunityIcons name="camera-off" size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Caméra requise</Text>
          <Text style={styles.permissionSub}>
            L'accès à la caméra est nécessaire pour scanner les codes marchands.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnLabel}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            <Text style={styles.backLink}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Caméra plein écran */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }) => handleDecode(data)}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'] }}>

        {/* Overlay sombre */}
        <View style={styles.overlay}>

          {/* Header */}
          <SafeAreaView style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scanner le code marchand</Text>
            <View style={{ width: 40 }} />
          </SafeAreaView>

          {/* Cadre de scan */}
          <View style={styles.frameArea}>
            <View style={styles.frame}>
              {/* Coins verts */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* Ligne de scan animée */}
              {!loading && !scanned && (
                <View style={styles.scanLine} />
              )}

              {/* Indicateur de chargement */}
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Analyse en cours...</Text>
                </View>
              )}
            </View>
            <Text style={styles.hint}>Pointez vers le code ou l'affiche du marchand</Text>
          </View>

          {/* Chips d'info */}
          <View style={styles.chipsRow}>
            <View style={styles.infoChip}>
              <MaterialCommunityIcons name="eye" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoChipText}>Filmez le numéro affiché</Text>
            </View>
            <View style={styles.infoChip}>
              <MaterialCommunityIcons name="qrcode-scan" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.infoChipText}>Extraction automatique</Text>
            </View>
          </View>

          {/* Panneau saisie manuelle */}
          <View style={styles.manualPanel}>
            <Text style={styles.manualTitle}>Ou entrez manuellement</Text>

            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="store-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={merchantInput}
                onChangeText={setMerchantInput}
                placeholder="Numéro marchand"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="default"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="currency-usd" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={amountInput}
                onChangeText={setAmountInput}
                placeholder="Montant (FCFA)"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleManualValidate}
              />
            </View>

            <TouchableOpacity
              style={[styles.validateBtn, loading && { opacity: 0.7 }]}
              onPress={handleManualValidate}
              disabled={loading}>
              <Text style={styles.validateBtnLabel}>Valider</Text>
            </TouchableOpacity>

            {scanned && !loading && (
              <TouchableOpacity
                style={styles.rescanBtn}
                onPress={() => { setScanned(false); setMerchantInput(''); }}>
                <MaterialCommunityIcons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.rescanLabel}>Scanner à nouveau</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER = 24;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'transparent' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },

  /* Zone cadre de scan */
  frameArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  frame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },

  /* Coins verts du cadre */
  corner: {
    position: 'absolute', width: CORNER, height: CORNER,
    borderColor: Colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK },

  scanLine: {
    position: 'absolute', top: '45%',
    width: '80%', height: 2,
    backgroundColor: Colors.primary, opacity: 0.7,
    borderRadius: 1,
  },

  loadingOverlay: { alignItems: 'center', gap: 12 },
  loadingText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  hint: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  /* Chips */
  chipsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  infoChipText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  /* Panneau saisie manuelle */
  manualPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 14,
  },
  manualTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.input, borderWidth: 1, borderColor: '#E5E7EB',
    height: Layout.inputHeight, paddingHorizontal: 12, gap: 8,
  },
  inputIcon: { flexShrink: 0 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  validateBtn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    marginTop: 4, ...Shadows.button,
  },
  validateBtnLabel: { color: Colors.white, fontSize: 16, fontWeight: '600' },

  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  rescanLabel: { fontSize: 14, color: Colors.primary, fontWeight: '500' },

  /* Permission screen */
  permissionScreen: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 16,
  },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  permissionSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  permissionBtn: {
    height: Layout.buttonHeight, width: '100%',
    backgroundColor: Colors.primary, borderRadius: Radius.button,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    ...Shadows.button,
  },
  permissionBtnLabel: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  backLink: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
});
