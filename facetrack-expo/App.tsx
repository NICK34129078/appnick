import { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { createElement, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { signInWithOAuthProvider } from './lib/oauth';
import { supabase } from './lib/supabase';

type Screen =
  | 'onboarding'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'scan'
  | 'results'
  | 'chat'
  | 'subscription'
  | 'settings';

const colors = {
  bg: '#FFFFFF',
  text: '#000000',
  accent: '#2F6BFF',
  secondary: '#F5F5F7',
  secondaryText: '#8D8D93',
  divider: '#E9E9ED',
  aiBubble: '#EAF0FF',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        setScreen('dashboard');
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_OUT') {
        setScreen('login');
      } else if (s && event === 'SIGNED_IN') {
        setScreen((prev) =>
          prev === 'login' || prev === 'signup' || prev === 'onboarding' ? 'dashboard' : prev
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const content = useMemo(() => {
    if (authLoading) {
      return (
        <View style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size='large' color={colors.accent} />
        </View>
      );
    }

    switch (screen) {
      case 'onboarding':
        return <OnboardingScreen onNext={() => setScreen('login')} />;
      case 'login':
        return (
          <LoginScreen
            onSignup={() => setScreen('signup')}
            onSuccess={() => setScreen('dashboard')}
          />
        );
      case 'signup':
        return <SignupScreen onBackToLogin={() => setScreen('login')} />;
      case 'scan':
        return <ScanScreen onDone={() => setScreen('results')} />;
      case 'results':
        return <ResultsScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'subscription':
        return <SubscriptionScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'dashboard':
      default:
        return (
          <DashboardScreen
            userEmail={session?.user?.email}
            onScan={() => setScreen('scan')}
          />
        );
    }
  }, [screen, authLoading, session?.user?.email]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style='dark' />
        {content}
        {screen !== 'onboarding' && screen !== 'login' && screen !== 'signup' ? (
          <BottomNav screen={screen} onChange={setScreen} />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, color: colors.secondaryText, marginTop: 8, lineHeight: 22 },
  card: {
    backgroundColor: colors.bg,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextDark: { color: colors.text, fontSize: 16, fontWeight: '600' },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  nav: {
    height: 64,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 12, fontWeight: '600' },
  errorText: { color: '#C00', fontSize: 14, marginBottom: 8 },
});

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, disabled ? { opacity: 0.6 } : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.buttonSecondary} onPress={onPress}>
      <Text style={styles.buttonTextDark}>{label}</Text>
    </Pressable>
  );
}

function OnboardingScreen({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.page}>
      <View style={[styles.content, { flex: 1 }]}>
        <View style={{ flex: 1 }} />
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 18,
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 34, color: colors.accent, fontWeight: '700' }}>F</Text>
        </View>
        <Text style={[styles.title, { marginTop: 24 }]}>FaceTrack AI</Text>
        <Text style={styles.subtitle}>Bright skincare intelligence with calm, premium guidance.</Text>
        <View style={{ flex: 1 }} />
        <PrimaryButton label='Get Started' onPress={onNext} />
      </View>
    </View>
  );
}

function LoginScreen({ onSignup, onSuccess }: { onSignup: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin() {
    setError(null);
    setLoading(true);
    const { error: signError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    onSuccess();
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setError(null);
    setLoading(true);
    const { error: oAuthError } = await signInWithOAuthProvider(provider);
    setLoading(false);
    if (oAuthError) {
      setError(oAuthError.message);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { fontSize: 30, marginTop: 20 }]}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to continue your skin progress.</Text>
      <View style={{ height: 28 }} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        placeholder='Email'
        style={styles.input}
        placeholderTextColor={colors.secondaryText}
        autoCapitalize='none'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />
      <View style={{ height: 12 }} />
      <TextInput
        placeholder='Password'
        secureTextEntry
        style={styles.input}
        placeholderTextColor={colors.secondaryText}
        value={password}
        onChangeText={setPassword}
      />
      <View style={{ height: 28 }} />
      <PrimaryButton label={loading ? 'Please wait…' : 'Login'} onPress={handleEmailLogin} disabled={loading} />
      <View style={{ height: 12 }} />
      <SecondaryButton
        label='Continue with Google'
        onPress={() => {
          void handleOAuth('google');
        }}
      />
      {Platform.OS === 'ios' ? (
        <>
          <View style={{ height: 12 }} />
          <SecondaryButton
            label='Continue with Apple'
            onPress={() => {
              void handleOAuth('apple');
            }}
          />
        </>
      ) : null}
      <View style={{ height: 12 }} />
      <Pressable onPress={onSignup}>
        <Text style={{ textAlign: 'center', color: colors.accent, fontWeight: '600' }}>Create account</Text>
      </Pressable>
    </ScrollView>
  );
}

function SignupScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    setError(null);
    setLoading(true);
    const { error: signError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    Alert.alert(
      'Check your email',
      'If email confirmation is enabled in Supabase, open the link in your inbox to finish signup.'
    );
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setError(null);
    setLoading(true);
    const { error: oAuthError } = await signInWithOAuthProvider(provider);
    setLoading(false);
    if (oAuthError) {
      setError(oAuthError.message);
    }
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { fontSize: 30, marginTop: 20 }]}>Create account</Text>
      <Text style={styles.subtitle}>Minimal signup, premium experience.</Text>
      <View style={{ height: 28 }} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        placeholder='Full name'
        style={styles.input}
        placeholderTextColor={colors.secondaryText}
        value={fullName}
        onChangeText={setFullName}
      />
      <View style={{ height: 12 }} />
      <TextInput
        placeholder='Email'
        style={styles.input}
        placeholderTextColor={colors.secondaryText}
        autoCapitalize='none'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />
      <View style={{ height: 12 }} />
      <TextInput
        placeholder='Password'
        secureTextEntry
        style={styles.input}
        placeholderTextColor={colors.secondaryText}
        value={password}
        onChangeText={setPassword}
      />
      <View style={{ height: 28 }} />
      <PrimaryButton
        label={loading ? 'Please wait…' : 'Create account'}
        onPress={handleSignup}
        disabled={loading}
      />
      <View style={{ height: 12 }} />
      <SecondaryButton
        label='Sign up with Google'
        onPress={() => {
          void handleOAuth('google');
        }}
      />
      {Platform.OS === 'ios' ? (
        <>
          <View style={{ height: 12 }} />
          <SecondaryButton
            label='Sign up with Apple'
            onPress={() => {
              void handleOAuth('apple');
            }}
          />
        </>
      ) : null}
      <View style={{ height: 12 }} />
      <Pressable onPress={onBackToLogin}>
        <Text style={{ textAlign: 'center', color: colors.accent, fontWeight: '600' }}>Already have an account? Log in</Text>
      </Pressable>
    </ScrollView>
  );
}

function DashboardScreen({
  userEmail,
  onScan,
}: {
  userEmail?: string | null;
  onScan: () => void;
}) {
  const greeting = userEmail ? userEmail.split('@')[0] : 'there';
  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 110 }]}>
      <Text style={{ color: colors.secondaryText, fontSize: 16 }}>Hello, {greeting}</Text>
      <Text style={[styles.title, { marginTop: 8 }]}>Face Score 78%</Text>
      <View style={{ marginTop: 18, alignSelf: 'center' }}>
        <View
          style={{
            width: 170,
            height: 170,
            borderRadius: 90,
            borderWidth: 12,
            borderColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: -12,
              left: -12,
              right: -12,
              bottom: -12,
              borderRadius: 90,
              borderWidth: 12,
              borderColor: colors.accent,
              borderRightColor: 'transparent',
              transform: [{ rotate: '-35deg' }],
            }}
          />
          <Text style={{ fontSize: 34, fontWeight: '700', color: colors.text }}>78%</Text>
        </View>
      </View>
      <View style={{ height: 26 }} />
      <View style={styles.card}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Latest scan</Text>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>
          Hydration improved. Texture stable. Tone slightly brighter.
        </Text>
        <View style={{ height: 18 }} />
        <PrimaryButton label='Scan Face' onPress={onScan} />
      </View>
      <View style={{ height: 24 }} />
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>Weekly improvement</Text>
      <View style={{ height: 16 }} />
      <Graph />
    </ScrollView>
  );
}

function GraphBar({ height, highlight }: { height: number; highlight: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        height,
        borderRadius: 8,
        backgroundColor: highlight ? colors.accent : '#B9CCFF',
      }}
    />
  );
}

function Graph() {
  const points = [40, 54, 50, 66, 62, 74, 78];
  return (
    <View
      style={{
        height: 120,
        backgroundColor: colors.secondary,
        borderRadius: 18,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {points.map((item, idx) =>
        createElement(GraphBar, {
          key: idx,
          height: item,
          highlight: idx === points.length - 1,
        })
      )}
    </View>
  );
}

function ScanScreen({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.page}>
      <View style={[styles.content, { flex: 1, justifyContent: 'space-between', paddingBottom: 50 }]}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>Face Scan</Text>
          <Text style={styles.subtitle}>Center your face in the frame.</Text>
        </View>
        <View style={{ height: 360, borderRadius: 24, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.divider }} />
        <Pressable
          onPress={onDone}
          style={{
            alignSelf: 'center',
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 10,
          }}
        >
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.accent }} />
        </Pressable>
      </View>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 16, color: colors.text, marginBottom: 6 }}>{label}</Text>
      <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.secondary }}>
        <View
          style={{
            width: `${value}%`,
            height: 10,
            borderRadius: 999,
            backgroundColor: colors.accent,
          }}
        />
      </View>
    </View>
  );
}

function ResultsScreen() {
  const metrics = [
    { label: 'Hydration', value: 82 },
    { label: 'Texture', value: 74 },
    { label: 'Tone', value: 79 },
  ];
  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 110 }]}>
      <Text style={[styles.title, { fontSize: 44 }]}>78%</Text>
      <Text style={styles.subtitle}>Overall Face Score</Text>
      <View style={{ height: 26 }} />
      {metrics.map((m) =>
        createElement(MetricRow, {
          key: m.label,
          label: m.label,
          value: m.value,
        })
      )}
      <View style={{ height: 20 }} />
      <View style={styles.card}>
        <Text style={{ color: colors.text, lineHeight: 22 }}>
          Skin trend is positive. Keep hydration and SPF consistency this week.
        </Text>
      </View>
    </ScrollView>
  );
}

function ChatScreen() {
  return (
    <View style={styles.page}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: 12 }]}>
        <View
          style={{
            alignSelf: 'flex-end',
            backgroundColor: colors.secondary,
            borderRadius: 16,
            padding: 12,
            maxWidth: '82%',
          }}
        >
          <Text style={{ color: colors.text }}>Hoe verminder ik roodheid deze week?</Text>
        </View>
        <View style={{ height: 12 }} />
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.aiBubble,
            borderRadius: 16,
            padding: 12,
            maxWidth: '82%',
          }}
        >
          <Text style={{ color: colors.text }}>Gebruik een parfumvrije moisturizer en vermijd agressieve exfoliatie.</Text>
        </View>
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderTopColor: colors.divider, padding: 12, backgroundColor: colors.bg }}>
        <TextInput
          placeholder='Ask AI skincare coach...'
          style={styles.input}
          placeholderTextColor={colors.secondaryText}
        />
      </View>
    </View>
  );
}

function SubscriptionScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 110 }]}>
      <Text style={[styles.title, { fontSize: 30 }]}>FaceTrack Premium</Text>
      <Text style={styles.subtitle}>Unlock unlimited AI analysis and guidance.</Text>
      <View style={{ height: 20 }} />
      <View style={styles.card}>
        <Text style={{ fontSize: 30, fontWeight: '700', color: colors.text }}>1 month free</Text>
        <Text style={{ marginTop: 8, fontSize: 18, color: colors.text }}>€9.99/month</Text>
      </View>
      <View style={{ height: 20 }} />
      <PrimaryButton label='Start Free Trial' onPress={() => {}} />
    </ScrollView>
  );
}

function SettingsRow({ label }: { label: string }) {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: 16 }}>
      <Text style={{ color: colors.text, fontSize: 16 }}>{label}</Text>
    </View>
  );
}

function SettingsScreen() {
  const items = ['Weekly reminders', 'Privacy & GDPR consent', 'Delete my data', 'Subscription'];
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 110 }]}>
      <Text style={[styles.title, { fontSize: 30 }]}>Settings</Text>
      <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: colors.divider }}>
        <Pressable
          onPress={handleLogout}
          disabled={signingOut}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.divider, paddingVertical: 16 }}
        >
          <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>
            {signingOut ? 'Signing out…' : 'Log out'}
          </Text>
        </Pressable>
        {items.map((item) =>
          createElement(SettingsRow, {
            key: item,
            label: item,
          })
        )}
      </View>
    </ScrollView>
  );
}

function BottomNav({ screen, onChange }: { screen: Screen; onChange: (s: Screen) => void }) {
  const entries: Array<{ id: Screen; label: string }> = [
    { id: 'dashboard', label: 'Home' },
    { id: 'scan', label: 'Scan' },
    { id: 'results', label: 'Results' },
    { id: 'chat', label: 'Chat' },
    { id: 'settings', label: 'Settings' },
  ];
  return (
    <View style={styles.nav}>
      {entries.map((entry) => {
        const active = entry.id === screen;
        return (
          <Pressable key={entry.id} style={styles.navItem} onPress={() => onChange(entry.id)}>
            <Text style={[styles.navText, { color: active ? colors.accent : colors.secondaryText }]}>{entry.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
