import React from 'react';
import {
  KeyboardAvoidingView, ScrollView, Platform, StyleSheet,
} from 'react-native';

/**
 * Wrapper réutilisable pour tous les écrans avec formulaires.
 * Règle le problème "clavier qui cache les champs" sur iOS et Android.
 */
export default function KeyboardLayout({ children, style }) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 40 },
});
