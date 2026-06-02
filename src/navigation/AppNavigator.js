import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ChatBotFAB from '../components/ChatBotFAB';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import HomeScreen from '../screens/main/HomeScreen';
import BudgetScreen from '../screens/main/BudgetScreen';
import PayScreen from '../screens/main/PayScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

import SetupBudgetScreen from '../screens/budget/SetupBudgetScreen';
import QuestionnaireScreen from '../screens/budget/QuestionnaireScreen';
import PropositionIAScreen from '../screens/budget/PropositionIAScreen';
import AddCategoryScreen from '../screens/budget/AddCategoryScreen';
import AddExpenseScreen from '../screens/budget/AddExpenseScreen';
import ZoneDetailScreen from '../screens/budget/ZoneDetailScreen';
import SaisieCashScreen from '../screens/budget/SaisieCashScreen';

import ConfirmationScreen from '../screens/payment/ConfirmationScreen';
import SuccesPaiementScreen from '../screens/payment/SuccesPaiementScreen';
import ScannerScreen from '../screens/payment/ScannerScreen';
import CreateTontineScreen from '../screens/tontine/CreateTontineScreen';
import TontineDetailScreen from '../screens/tontine/TontineDetailScreen';
import BonsPlansScreen from '../screens/deals/BonsPlansScreen';
import DealDetailScreen from '../screens/deals/DealDetailScreen';
import BilanMensuelScreen from '../screens/stats/BilanMensuelScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:      ['home', 'home-outline'],
  Pay:       ['send', 'send-outline'],
  Budget:    ['chart-pie', 'chart-pie'],
  Community: ['account-group', 'account-group-outline'],
  Profile:   ['account-circle', 'account-circle-outline'],
};

function MainTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const TAB_LABELS = {
    Home:      t('nav.home'),
    Pay:       t('nav.pay'),
    Budget:    t('nav.budget'),
    Community: t('nav.community'),
    Profile:   t('nav.profile'),
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 8,
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarIcon: ({ focused, color }) => {
            const [active, inactive] = TAB_ICONS[route.name] || ['circle', 'circle-outline'];
            return <MaterialCommunityIcons name={focused ? active : inactive} size={24} color={color} />;
          },
          tabBarLabel: TAB_LABELS[route.name] || route.name,
        })}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Pay" component={PayScreen} />
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <ChatBotFAB />
    </View>
  );
}

export default function AppNavigator() {
  const { isDark, colors } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SetupBudget" component={SetupBudgetScreen} />
        <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
        <Stack.Screen name="PropositionIA" component={PropositionIAScreen} />
        <Stack.Screen name="AddCategory" component={AddCategoryScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="ZoneDetail" component={ZoneDetailScreen} />
        <Stack.Screen name="SaisieCash" component={SaisieCashScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="SuccesPaiement" component={SuccesPaiementScreen} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="CreateTontine" component={CreateTontineScreen} />
        <Stack.Screen name="TontineDetail" component={TontineDetailScreen} />
        <Stack.Screen name="BonsPlans" component={BonsPlansScreen} />
        <Stack.Screen name="DealDetail" component={DealDetailScreen} />
        <Stack.Screen name="BilanMensuel" component={BilanMensuelScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
