import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Layout, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAiFlow } from '../../context/AiFlowContext';
import { aiService } from '../../services/aiService';

const QUESTIONS = [
  {
    id: 'situation',
    text: 'Quelle est votre situation professionnelle ?',
    options: [
      { value: 'Salarié(e)', label: 'Salarié(e)', desc: 'Emploi régulier', icon: 'briefcase-outline' },
      { value: 'Commerçant(e)', label: 'Commerçant(e)', desc: 'À mon compte', icon: 'store-outline' },
      { value: 'Fonctionnaire', label: 'Fonctionnaire', desc: 'Secteur public', icon: 'domain' },
      { value: 'Étudiant(e)', label: 'Étudiant(e)', desc: 'En formation', icon: 'school-outline' },
    ],
  },
  {
    id: 'foyer',
    text: 'Combien de personnes êtes-vous à charge dans votre foyer ?',
    options: [
      { value: 'Seul(e)', label: 'Seul(e)', desc: 'Juste moi', icon: 'account-outline' },
      { value: '2-3 personnes', label: '2-3 personnes', desc: 'Petit foyer', icon: 'account-group-outline' },
      { value: '4-5 personnes', label: '4-5 personnes', desc: 'Famille moyenne', icon: 'account-group-outline' },
      { value: '6+ personnes', label: '6+ personnes', desc: 'Grande famille', icon: 'account-multiple-outline' },
    ],
  },
  {
    id: 'priorites',
    text: 'Quelles sont vos priorités financières ?',
    options: [
      { value: 'Épargne', label: 'Épargne', desc: 'Mettre de côté', icon: 'piggy-bank-outline' },
      { value: 'Alimentation', label: 'Alimentation', desc: 'Bien se nourrir', icon: 'food-outline' },
      { value: 'Logement', label: 'Logement', desc: 'Confort du foyer', icon: 'home-outline' },
      { value: 'Santé', label: 'Santé', desc: 'Bien-être', icon: 'heart-outline' },
    ],
  },
  {
    id: 'loyer',
    text: 'Avez-vous un loyer ou crédit fixe mensuel ?',
    options: [
      { value: 'Non', label: 'Non', desc: 'Pas de charge fixe', icon: 'close-circle-outline' },
      { value: 'Oui', label: 'Oui', desc: 'Charge mensuelle fixe', icon: 'home-city-outline' },
    ],
    hasInput: true,
  },
  {
    id: 'objectif',
    text: 'Quel est votre objectif financier principal ?',
    options: [
      { value: 'Épargner', label: 'Épargner', desc: 'Construire mon patrimoine', icon: 'piggy-bank-outline' },
      { value: 'Équilibrer', label: 'Équilibrer', desc: 'Budget maîtrisé', icon: 'scale-balance' },
      { value: 'Investir', label: 'Investir', desc: 'Faire fructifier', icon: 'trending-up' },
      { value: 'Rembourser', label: 'Rembourser', desc: 'Réduire mes dettes', icon: 'credit-card-outline' },
    ],
  },
];

export default function QuestionnaireScreen({ navigation, route }) {
  const { token } = useAuth();
  const { setAnswer, answers, setProposal } = useAiFlow();
  const income = route.params?.income ?? '0';
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loyerMontant, setLoyerMontant] = useState('');
  const [loading, setLoading] = useState(false);

  const current = QUESTIONS[step];
  const prev = step > 0 ? QUESTIONS[step - 1] : null;
  const progressWidth = `${((step + 1) / QUESTIONS.length) * 100}%`;

  async function handleNext() {
    if (!selected) return Alert.alert('Sélectionnez une option pour continuer.');
    const finalValue = current.id === 'loyer' && selected === 'Oui' && loyerMontant
      ? loyerMontant : selected === 'Oui' ? '30000' : selected;
    setAnswer(current.id, finalValue);
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
      setSelected(null);
    } else {
      const allAnswers = { ...answers, [current.id]: finalValue };
      try {
        setLoading(true);
        const proposal = await aiService.proposeBudget(token, {
          revenuMensuel: parseInt(income, 10),
          situation: allAnswers.situation ?? '',
          foyer: allAnswers.foyer ?? '',
          priorites: [allAnswers.priorites ?? 'Équilibre'],
          loyer: allAnswers.loyer ?? 'Non',
          objectif: allAnswers.objectif ?? '',
        });
        setProposal(proposal);
        navigation.replace('PropositionIA');
      } catch (e) {
        Alert.alert('Erreur IA', e.message ?? "Impossible de contacter l'IA.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Personnalisons votre budget</Text>
          <MaterialCommunityIcons name="shimmer" size={22} color={Colors.secondary} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.stepLabel}>Étape {step + 2} sur {QUESTIONS.length + 1}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {prev && answers[prev.id] && (
          <View style={styles.prevQ}>
            <View style={styles.prevBubble}>
              <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.primary} />
              <Text style={styles.prevText}>{prev.text}</Text>
            </View>
            <View style={styles.answerTag}>
              <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.answerTagText}>{answers[prev.id]}</Text>
            </View>
          </View>
        )}

        <View style={styles.currentQ}>
          <View style={styles.aiAvatar}>
            <MaterialCommunityIcons name="shimmer" size={18} color={Colors.white} />
          </View>
          <View style={styles.currentBubble}>
            <Text style={styles.currentText}>{current.text}</Text>
          </View>
        </View>

        <View style={styles.optionsArea}>
          {current.options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, selected === opt.value && styles.optionActive]}
              onPress={() => setSelected(opt.value)}>
              <View style={[styles.iconBox, selected === opt.value && styles.iconBoxActive]}>
                <MaterialCommunityIcons name={opt.icon} size={20} color={selected === opt.value ? Colors.white : Colors.primary} />
              </View>
              <View style={styles.optionTexts}>
                <Text style={[styles.optionLabel, selected === opt.value && styles.optionLabelActive]}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.desc}</Text>
              </View>
              <MaterialCommunityIcons
                name={selected === opt.value ? 'check-circle' : 'chevron-right'}
                size={16}
                color={selected === opt.value ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>
          ))}

          {current.hasInput && selected === 'Oui' && (
            <TextInput
              style={styles.loyerInput}
              value={loyerMontant}
              onChangeText={setLoyerMontant}
              placeholder="Montant du loyer en FCFA"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
            />
          )}
        </View>

        <View style={styles.dots}>
          {QUESTIONS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btn, (!selected || loading) && styles.btnDisabled]}
          onPress={handleNext} disabled={!selected || loading}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.btnLabel}>L'IA analyse votre profil...</Text>
            </View>
          ) : (
            <Text style={styles.btnLabel}>
              {step < QUESTIONS.length - 1 ? 'Continuer' : 'Générer mon budget ✨'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  headerSection: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 16, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepLabel: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, minWidth: 80 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  scroll: { paddingHorizontal: Layout.screenPaddingHorizontal, paddingTop: 20, paddingBottom: 24, gap: 20 },
  prevQ: { gap: 8, opacity: 0.5 },
  prevBubble: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceCard, borderRadius: 16, borderBottomLeftRadius: 4, padding: 12,
  },
  prevText: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  answerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: Colors.accent,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  answerTagText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  currentQ: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  aiAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  currentBubble: {
    flex: 1, backgroundColor: Colors.accent,
    borderRadius: 16, borderBottomLeftRadius: 4, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  currentText: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary, lineHeight: 22 },
  optionsArea: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, paddingHorizontal: 16, backgroundColor: Colors.white,
    borderRadius: Radius.card, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.accent },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  iconBoxActive: { backgroundColor: Colors.primary },
  optionTexts: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  optionLabelActive: { color: Colors.primary },
  optionDesc: { fontSize: 12, color: Colors.textSecondary },
  loyerInput: {
    height: Layout.inputHeight, backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.input, borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  bottom: { padding: Layout.screenPaddingHorizontal },
  btn: {
    height: Layout.buttonHeight, backgroundColor: Colors.primary,
    borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    ...Shadows.button,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: Colors.white, fontSize: 16, fontWeight: '500' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
