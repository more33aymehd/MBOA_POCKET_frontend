import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { fetchAuth } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  getAll: (token, type) => {
    const params = type ? `?type=${type}` : '';
    return fetchAuth(`/notifications${params}`, token);
  },

  getUnreadCount: (token) => fetchAuth('/notifications/unread-count', token),

  markRead: (token, id) =>
    fetchAuth(`/notifications/${id}/read`, token, { method: 'PUT' }),

  markAllRead: (token) =>
    fetchAuth('/notifications/read-all', token, { method: 'PUT' }),

  delete: (token, id) =>
    fetchAuth(`/notifications/${id}`, token, { method: 'DELETE' }),

  registerPushToken: async (token) => {
    const pushToken = await getPushToken();
    if (!pushToken) {
      console.warn('[Push] Pas de push token obtenu — enregistrement annulé');
      return;
    }
    console.log('[Push] Token obtenu, envoi au backend:', pushToken);
    await fetchAuth('/notifications/device-token', token, {
      method: 'POST',
      body: JSON.stringify({ pushToken }),
    });
    console.log('[Push] Token enregistré avec succès côté backend');
  },

  scheduleDailyReminder: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Récapitulatif du jour 💰',
        body: 'Avez-vous des dépenses en cash à enregistrer ?',
        data: { screen: 'SaisieCash' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 30,
      },
    });
    console.log('[Push] Rappel quotidien 18h30 programmé');
  },

  cancelDailyReminder: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Notification locale immédiate — fonctionne SANS projectId ni EAS
  notifyExpenseCreated: async ({ montant, categoryNom, categoryIcone }) => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${categoryIcone ?? '💰'} Dépense enregistrée`,
          body: `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA débités — ${categoryNom ?? 'Budget'}`,
          sound: true,
          data: { screen: 'Budget' },
        },
        trigger: null, // null = immédiat
      });
    } catch (err) {
      console.warn('[Push] notifyExpenseCreated échoué:', err.message);
    }
  },
};

export async function getPushToken() {
  if (!Device.isDevice) {
    console.warn('[Push] Simulateur détecté — les push ne fonctionnent que sur un vrai appareil');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('[Push] Demande de permission...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission refusée par l\'utilisateur');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mboapocket', {
      name: 'Mboapocket',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B8A5A',
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    console.log('[Push] ExponentPushToken:', tokenData.data);
    return tokenData.data;
  } catch (err) {
    console.error('[Push] Erreur getExpoPushTokenAsync:', err.message);
    return null;
  }
}
