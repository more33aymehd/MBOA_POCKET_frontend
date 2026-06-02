import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../constants/theme';
import { useResponsive } from '../hooks/useResponsive';

const SLIDES = [
  {
    id: '1', icon: 'chart-pie', iconBg: '#E8F5EE',
    title: 'Gérez votre budget',
    subtitle: "L'IA analyse vos habitudes et alloue votre budget automatiquement",
  },
  {
    id: '2', icon: 'cellphone', iconBg: '#FFF3E0',
    title: 'Paiement mobile',
    subtitle: "Payez avec Orange Money, MTN MoMo directement depuis l'app",
  },
  {
    id: '3', icon: 'account-group', iconBg: '#E8F0FE',
    title: 'Tontines & Communauté',
    subtitle: "Créez des cotisations collectives et gérez l'entraide financière",
  },
];

export default function OnboardingScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const flatRef = useRef(null);
  const { width, isLandscape } = useResponsive();

  function next() {
    if (index < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      navigation.replace('Login');
    }
  }

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      {isLandscape ? (
        // Paysage : icône à gauche, texte à droite
        <View style={styles.slideLandscape}>
          <View style={[styles.illustrationLandscape, { backgroundColor: item.iconBg }]}>
            <MaterialCommunityIcons name={item.icon} size={72} color={Colors.primary} />
          </View>
          <View style={styles.textAreaLandscape}>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSub}>{item.subtitle}</Text>
          </View>
        </View>
      ) : (
        // Portrait : icône en haut, texte en bas
        <>
          <View style={[styles.illustrationArea, { backgroundColor: item.iconBg }]}>
            <MaterialCommunityIcons name={item.icon} size={80} color={Colors.primary} />
          </View>
          <View style={styles.textArea}>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSub}>{item.subtitle}</Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={i => i.id}
        renderItem={renderSlide}
        style={styles.flex}
      />

      <View style={[styles.bottom, isLandscape && styles.bottomLandscape]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={[styles.btn, isLandscape && styles.btnLandscape]} onPress={next}>
          <Text style={styles.btnLabel}>
            {index < SLIDES.length - 1 ? 'Suivant' : 'Commencer'}
          </Text>
        </TouchableOpacity>
        {index < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.skip}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },

  slide: { flex: 1 },

  // Portrait
  illustrationArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    minHeight: 240,
  },
  textArea: { padding: 32, gap: 12 },

  // Paysage
  slideLandscape: { flex: 1, flexDirection: 'row' },
  illustrationLandscape: {
    width: '42%', alignItems: 'center', justifyContent: 'center',
  },
  textAreaLandscape: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 24, gap: 12,
  },

  slideTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  slideSub: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },

  bottom: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingBottom: 24, paddingTop: 12,
    gap: 14, alignItems: 'center',
  },
  bottomLandscape: { paddingBottom: 12, paddingTop: 8, gap: 10 },

  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { width: 24, backgroundColor: Colors.primary },

  btn: {
    width: '100%', height: Layout.buttonHeight,
    backgroundColor: Colors.primary, borderRadius: Radius.button,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.button,
  },
  btnLandscape: { height: 44 },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  skip: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
});
