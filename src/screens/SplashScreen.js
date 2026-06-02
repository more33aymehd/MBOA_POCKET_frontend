import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

// Formes décoratives — positions fixes comme dans le design Pencil
const DIAMONDS = [
  { x: 40,  y: 100, size: 18, opacity: 0.08 },
  { x: 310, y: 160, size: 14, opacity: 0.06 },
  { x: 70,  y: 680, size: 16, opacity: 0.07 },
  { x: 280, y: 720, size: 12, opacity: 0.05 },
  { x: 160, y: 60,  size: 10, opacity: 0.04 },
  { x: 350, y: 400, size: 9,  opacity: 0.06 },
  { x: 10,  y: 450, size: 11, opacity: 0.05 },
  { x: 240, y: 780, size: 8,  opacity: 0.04 },
];

function Diamond({ x, y, size, opacity }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: '#1B8A5A',
        opacity,
        transform: [{ rotate: '45deg' }],
        borderRadius: 2,
      }}
    />
  );
}

export default function SplashScreen({ navigation }) {
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      navigation.replace(token ? 'MainTabs' : 'Onboarding');
    }, 2200);
    return () => clearTimeout(timer);
  }, [loading, token]);

  return (
    <View style={styles.container}>
      {/* Fond sombre */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0F1F17' }]} />

      {/* Formes géométriques décoratives */}
      {DIAMONDS.map((d, i) => <Diamond key={i} {...d} />)}

      {/* Glow vert radial au centre */}
      <View style={styles.glow} />

      {/* Contenu central */}
      <View style={styles.center}>
        {/* Icône logo */}
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="wallet" size={30} color="#fff" />
        </View>

        <Text style={styles.appName}>Mboapocket</Text>
        <Text style={styles.tagline}>Votre argent. bien géré</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1F17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#1B8A5A',
    opacity: 0.18,
    top: height * 0.5 - 130,
    left: width * 0.5 - 130,
  },
  center: {
    alignItems: 'center',
    gap: 14,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1B8A5A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B8A5A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.2,
  },
});
