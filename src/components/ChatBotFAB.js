import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { fetchAuth } from '../services/api';

const SUGGESTIONS = [
  'Analyse mon budget ce mois',
  'Où est-ce que je dépense le plus ?',
  'Comment économiser davantage ?',
  'Quel est mon budget restant ?',
];

export default function ChatBotFAB() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);

  function handleOpen() {
    setMessages([{
      id: '0',
      role: 'ai',
      text: 'Bonjour ! 👋 Je suis votre assistant financier Mboapocket.\n\nJe connais votre budget, vos zones de dépenses et vos transactions. Posez-moi n\'importe quelle question sur vos finances !',
    }]);
    setInput('');
    setOpen(true);
  }

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { id: `u_${Date.now()}`, role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await fetchAuth('/ai/chat', token, {
        method: 'POST',
        body: JSON.stringify({ message: userText }),
      });

      const aiText = data.response || 'Je n\'ai pas pu obtenir de réponse.';
      setMessages(prev => [...prev, { id: `a_${Date.now()}`, role: 'ai', text: aiText }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `e_${Date.now()}`,
        role: 'ai',
        text: `⚠️ Erreur : ${e.message || 'Impossible de contacter le serveur.'}`,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <TouchableOpacity style={styles.fab} onPress={handleOpen} activeOpacity={0.85}>
        <MaterialCommunityIcons name="robot-excited-outline" size={26} color={Colors.white} />
      </TouchableOpacity>

      {/* Modal chat plein écran */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.safe}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="robot-excited-outline" size={20} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.headerName}>Assistant Mboapocket</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Connecté à vos données</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Liste des messages */}
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.bubbleWrap, item.role === 'user' && styles.bubbleWrapRight]}>
                {item.role === 'ai' && (
                  <View style={styles.aiBadge}>
                    <MaterialCommunityIcons name="shimmer" size={12} color={Colors.primary} />
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  item.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
                ]}>
                  <Text style={[
                    styles.bubbleText,
                    item.role === 'user' && styles.bubbleTextUser,
                  ]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={loading ? (
              <View style={styles.bubbleWrap}>
                <View style={styles.aiBadge}>
                  <MaterialCommunityIcons name="shimmer" size={12} color={Colors.primary} />
                </View>
                <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>Groq analyse vos données...</Text>
                </View>
              </View>
            ) : null}
          />

          {/* Suggestions rapides (uniquement au début) */}
          {messages.length <= 1 && !loading && (
            <View style={styles.suggestionsWrap}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => sendMessage(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Zone de saisie */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Posez une question sur votre budget..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                maxLength={300}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                onPress={() => sendMessage()}
                disabled={!input.trim() || loading}>
                <MaterialCommunityIcons name="send" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },

  /* Modal */
  safe: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  statusText: { fontSize: 11, color: Colors.textSecondary },
  closeBtn: { padding: 6 },

  /* Messages */
  msgList: { padding: 16, gap: 12, paddingBottom: 8 },

  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleWrapRight: { flexDirection: 'row-reverse' },

  aiBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: { maxWidth: '78%', borderRadius: 18, padding: 13 },
  bubbleAi: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    ...Shadows.card,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 21 },
  bubbleTextUser: { color: Colors.white },

  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typingText: { fontSize: 13, color: Colors.textSecondary },

  /* Suggestions */
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    ...Shadows.card,
  },
  chipText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },

  /* Input */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: '#F5F5F7',
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
