import { Session } from '@supabase/supabase-js';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
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
  | 'scan3d'
  | 'scan3dResults'
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
  const [scan3dScore, setScan3dScore] = useState<number | null>(null);

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
      case 'scan3d':
        return (
          <AI3DScanScreen
            onCancel={() => setScreen('dashboard')}
            onComplete={(score) => {
              setScan3dScore(score);
              setScreen('scan3dResults');
            }}
          />
        );
      case 'scan3dResults':
        return (
          <AI3DResultsScreen
            score={scan3dScore ?? 78}
            onBackHome={() => setScreen('dashboard')}
            onRescan={() => setScreen('scan3d')}
          />
        );
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
            onScan3D={() => setScreen('scan3d')}
          />
        );
    }
  }, [screen, authLoading, session?.user?.email, scan3dScore]);

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
  onScan3D,
}: {
  userEmail?: string | null;
  onScan: () => void;
  onScan3D: () => void;
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
      <Pressable
        onPress={onScan3D}
        style={{
          backgroundColor: colors.accent,
          borderRadius: 22,
          paddingVertical: 18,
          paddingHorizontal: 18,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 4,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.2 }}>AI 3D Scan</Text>
        <Text style={{ color: '#EAF0FF', marginTop: 6, lineHeight: 20 }}>
          3D face scan → skin score → personal routine & product advice.
        </Text>
      </Pressable>
      <View style={{ height: 16 }} />
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

function AI3DScanScreen({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: (score: number) => void;
}) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [angleIdx, setAngleIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [captures, setCaptures] = useState<Array<{ angle: string; uri: string }>>([]);
  const [baselineYaw, setBaselineYaw] = useState<number | null>(null);
  const [poseProgress, setPoseProgress] = useState(0); // 0..1
  const [statusText, setStatusText] = useState<string>('Hold your face inside the oval');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [liveCheckAvailable, setLiveCheckAvailable] = useState<boolean | null>(null);
  const [manualConfirmUri, setManualConfirmUri] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;
  const successFlash = useRef(new Animated.Value(0)).current;

  const angles = useMemo(
    () => [
      { id: 'front', title: 'Look straight', hint: 'Hold still. Keep your face inside the oval.' },
      { id: 'right', title: 'Turn right', hint: 'Rotate your head a little to the right.' },
      { id: 'left', title: 'Turn left', hint: 'Rotate your head a little to the left.' },
      { id: 'up', title: 'Tilt up', hint: 'Lift your chin a bit.' },
      { id: 'down', title: 'Tilt down', hint: 'Lower your chin a bit.' },
    ],
    []
  );

  const current = angles[angleIdx] ?? angles[0];
  const readyToCheck = permission?.granted && !busy;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    setPoseProgress(0);
    setStatusText('Hold your face inside the oval');
    setPreviewUri(null);
    setManualConfirmUri(null);
  }, [angleIdx]);

  useEffect(() => {
    // expo-face-detector is NOT available in Expo Go on some SDKs.
    // If it's missing, we gracefully fall back to manual confirmation flow.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('expo-face-detector');
      setLiveCheckAvailable(true);
    } catch {
      setLiveCheckAvailable(false);
    }
  }, []);

  function isPoseCorrect(yaw: number, roll: number | undefined): { ok: boolean; message: string } {
    const base = baselineYaw ?? yaw;
    const relYaw = yaw - base;
    const absRoll = Math.abs(roll ?? 0);

    // Keep phone reasonably upright
    if (absRoll > 18) return { ok: false, message: 'Keep the phone straight' };

    switch (current.id) {
      case 'front':
        if (Math.abs(relYaw) <= 10) return { ok: true, message: 'Nice. Hold…' };
        return { ok: false, message: 'Face forward' };
      case 'right':
        if (relYaw <= -18) return { ok: true, message: 'Good right turn. Hold…' };
        return { ok: false, message: 'Turn a bit more right' };
      case 'left':
        if (relYaw >= 18) return { ok: true, message: 'Good left turn. Hold…' };
        return { ok: false, message: 'Turn a bit more left' };
      case 'up':
        // We don't have pitch here reliably; approximate by asking user + require near-front yaw
        if (Math.abs(relYaw) <= 12) return { ok: true, message: 'Chin up. Hold…' };
        return { ok: false, message: 'Face forward, then chin up' };
      case 'down':
        if (Math.abs(relYaw) <= 12) return { ok: true, message: 'Chin down. Hold…' };
        return { ok: false, message: 'Face forward, then chin down' };
      default:
        return { ok: false, message: 'Hold still' };
    }
  }

  async function tickPoseCheck() {
    if (!readyToCheck) return;
    if (!cameraRef.current) return;
    if (liveCheckAvailable === false) return;
    setBusy(true);
    try {
      // Quick low-quality frame for pose check
      const probe = await cameraRef.current.takePictureAsync({
        quality: 0.15,
        skipProcessing: true,
        exif: false,
      });
      if (!probe?.uri) return;

      // Lazy-load to avoid crashing when module isn't available (Expo Go).
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FaceDetector = require('expo-face-detector') as typeof import('expo-face-detector');

      const faces = await FaceDetector.detectFacesAsync(probe.uri, {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
        tracking: false,
      });

      const face = faces.faces[0];
      if (!face || typeof face.yawAngle !== 'number') {
        setPoseProgress((p) => Math.max(0, p - 0.18));
        setStatusText('No face found. Move closer');
        return;
      }

      if (current.id === 'front' && baselineYaw === null) {
        setBaselineYaw(face.yawAngle);
      }

      const { ok, message } = isPoseCorrect(face.yawAngle, face.rollAngle);
      setStatusText(message);
      setPoseProgress((p) => {
        const next = ok ? Math.min(1, p + 0.22) : Math.max(0, p - 0.22);
        return next;
      });

      // If we're at 100% ready, capture a real frame and advance.
      if (ok) {
        // Require it to be stable for a moment (progress hits 1)
        // We'll handle the threshold in a separate effect.
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!readyToCheck) return;
    if (Platform.OS === 'web') return;
    if (liveCheckAvailable === false) return;

    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        // eslint-disable-next-line no-await-in-loop
        await tickPoseCheck();
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 700));
      }
    };
    void loop();
    return () => {
      cancelled = true;
    };
    // We intentionally don't include tickPoseCheck in deps (function is stable enough for this screen lifetime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToCheck, angleIdx, baselineYaw, liveCheckAvailable]);

  useEffect(() => {
    if (poseProgress < 1) return;
    if (!cameraRef.current) return;
    if (liveCheckAvailable === false) return;
    let cancelled = false;

    const run = async () => {
      try {
        Animated.sequence([
          Animated.timing(successFlash, { toValue: 1, duration: 120, useNativeDriver: false }),
          Animated.timing(successFlash, { toValue: 0, duration: 120, useNativeDriver: false }),
          Animated.timing(successFlash, { toValue: 1, duration: 120, useNativeDriver: false }),
          Animated.timing(successFlash, { toValue: 0, duration: 140, useNativeDriver: false }),
        ]).start();

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise((r) => setTimeout(r, 140));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Final capture (higher quality)
        const photo = await cameraRef.current?.takePictureAsync({
          quality: 0.65,
          skipProcessing: false,
          exif: false,
        });
        if (cancelled || !photo?.uri) return;

        setPreviewUri(photo.uri);
        setCaptures((prev) => [...prev, { angle: current.id, uri: photo.uri }]);

        await new Promise((r) => setTimeout(r, 350));

        const next = angleIdx + 1;
        if (next >= angles.length) {
          const score = Math.max(1, Math.min(100, Math.round(55 + Math.random() * 40)));
          onComplete(score);
          return;
        }
        setPoseProgress(0);
        setAngleIdx(next);
      } catch {
        setPoseProgress(0.6);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [poseProgress, angleIdx, angles.length, current.id, onComplete, successFlash, liveCheckAvailable]);

  async function captureManualFrame() {
    if (!cameraRef.current) return;
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65,
        skipProcessing: false,
        exif: false,
      });
      if (!photo?.uri) return;
      setManualConfirmUri(photo.uri);
      setPreviewUri(photo.uri);
    } finally {
      setBusy(false);
    }
  }

  async function acceptManualFrame() {
    if (!manualConfirmUri) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCaptures((prev) => [...prev, { angle: current.id, uri: manualConfirmUri }]);
    setManualConfirmUri(null);
    setPoseProgress(0);

    const next = angleIdx + 1;
    if (next >= angles.length) {
      const score = Math.max(1, Math.min(100, Math.round(55 + Math.random() * 40)));
      onComplete(score);
      return;
    }
    setAngleIdx(next);
  }

  function retakeManualFrame() {
    setManualConfirmUri(null);
    setPreviewUri(null);
  }

  if (Platform.OS === 'web') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 110 }]}>
        <Text style={[styles.title, { fontSize: 30 }]}>AI 3D Scan</Text>
        <Text style={styles.subtitle}>Camera scanning works on iOS/Android. Open this screen in Expo Go.</Text>
        <View style={{ height: 14 }} />
        <SecondaryButton label='Back' onPress={onCancel} />
      </ScrollView>
    );
  }

  if (!permission) {
    return (
      <View style={styles.page}>
        <View style={[styles.content, { flex: 1, justifyContent: 'center' }]}>
          <ActivityIndicator size='large' color={colors.accent} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 110 }]}>
        <Text style={[styles.title, { fontSize: 30 }]}>AI 3D Scan</Text>
        <Text style={styles.subtitle}>We need camera permission to scan your face.</Text>
        <View style={{ height: 18 }} />
        <PrimaryButton label='Allow camera' onPress={() => void requestPermission()} />
        <View style={{ height: 10 }} />
        <SecondaryButton label='Back' onPress={onCancel} />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={(r) => {
          cameraRef.current = r;
        }}
        style={{ flex: 1 }}
        facing='front'
      />

      <View pointerEvents='none' style={scanUi.overlay}>
        <View style={scanUi.topShade} />
        <View style={scanUi.midRow}>
          <View style={scanUi.sideShade} />
          <View style={scanUi.ovalWrap}>
            <Animated.View
              style={[
                scanUi.ovalBorder,
                {
                  borderColor: successFlash.interpolate({
                    inputRange: [0, 1],
                    outputRange: [
                      poseProgress >= 0.9 ? 'rgba(46,175,98,0.95)' : 'rgba(255,255,255,0.9)',
                      'rgba(255,201,67,1.0)',
                    ],
                  }),
                  transform: [
                    {
                      scale: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, poseProgress >= 0.1 ? 1.02 : 1.0],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <View style={scanUi.sideShade} />
        </View>
        <View style={scanUi.bottomShade} />
      </View>

      <View style={scanUi.header}>
        <Pressable onPress={onCancel} style={scanUi.headerBtn}>
          <Text style={scanUi.headerBtnText}>Back</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={scanUi.progressPill}>
          <Text style={scanUi.progressText}>
            {angleIdx + 1}/{angles.length}
          </Text>
        </View>
      </View>

      <View style={scanUi.footer}>
        <Text style={scanUi.title}>{current.title}</Text>
        <Text style={scanUi.hint}>{current.hint}</Text>
        <View style={{ height: 10 }} />
        <View style={scanUi.captureRow}>
          <Text style={scanUi.countdownText}>
            {busy
              ? liveCheckAvailable ? 'Checking…' : 'Capturing…'
              : liveCheckAvailable
                ? `${Math.round(poseProgress * 100)}%`
                : 'Manual'}
          </Text>
          <View style={{ flex: 1 }} />
          <View style={scanUi.smallPill}>
            <Text style={scanUi.smallPillText}>
              {captures.length} / {angles.length} saved
            </Text>
          </View>
        </View>
        <View style={{ height: 8 }} />
        {liveCheckAvailable ? (
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '800' }}>{statusText}</Text>
        ) : (
          <>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '800' }}>
              Expo Go doesn’t include live face detection. We’ll use a manual confirm flow for now.
            </Text>
            <View style={{ height: 10 }} />
            {manualConfirmUri ? (
              <View style={scanUi.confirmRow}>
                <View style={scanUi.confirmBadge}>
                  <Text style={scanUi.confirmBadgeText}>✓ Captured</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Pressable onPress={retakeManualFrame} style={[scanUi.actionBtn, scanUi.actionBtnSecondary]}>
                  <Text style={[scanUi.actionBtnText, scanUi.actionBtnTextDark]}>Retake</Text>
                </Pressable>
                <Pressable onPress={() => void acceptManualFrame()} style={[scanUi.actionBtn, scanUi.actionBtnPrimary]}>
                  <Text style={scanUi.actionBtnText}>Use</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => void captureManualFrame()} style={[scanUi.actionBtn, scanUi.actionBtnPrimary]}>
                <Text style={scanUi.actionBtnText}>Capture</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {previewUri ? (
        <View style={scanUi.preview}>
          <Image source={{ uri: previewUri }} style={scanUi.previewImg} />
        </View>
      ) : null}
    </View>
  );
}

function StepRow({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  const bg = done ? '#EAF7EF' : active ? '#EAF0FF' : colors.secondary;
  const border = done ? '#BEE7CC' : active ? '#B9CCFF' : colors.divider;
  const dot = done ? '#2EAF62' : active ? colors.accent : colors.secondaryText;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: dot,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>{index}</Text>
      </View>
      <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.secondaryText, fontWeight: '700' }}>{done ? 'Done' : active ? 'Now' : ''}</Text>
    </View>
  );
}

function AI3DResultsScreen({
  score,
  onBackHome,
  onRescan,
}: {
  score: number;
  onBackHome: () => void;
  onRescan: () => void;
}) {
  const label =
    score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Needs care' : 'Needs attention';
  const advice =
    score >= 80
      ? ['Keep SPF daily', 'Hydrate + barrier support', 'Maintain gentle cleanser']
      : score >= 65
        ? ['Add SPF daily', 'Moisturize after cleansing', 'Reduce harsh exfoliation']
        : ['SPF every morning', 'Focus on barrier repair', 'Avoid fragrance + over-exfoliation'];

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingBottom: 110 }]}>
      <Text style={[styles.title, { fontSize: 44 }]}>{score}%</Text>
      <Text style={styles.subtitle}>AI Skin Score • {label}</Text>
      <View style={{ height: 18 }} />
      <View style={styles.card}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Today’s plan</Text>
        <View style={{ height: 10 }} />
        {advice.map((line) => (
          <View key={line} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginTop: 6 }} />
            <Text style={{ color: colors.text, lineHeight: 22, flex: 1 }}>{line}</Text>
          </View>
        ))}
        <Text style={{ color: colors.secondaryText, marginTop: 6, lineHeight: 20 }}>
          Next: we’ll store this score in Supabase so you can track progress over time.
        </Text>
      </View>
      <View style={{ height: 14 }} />
      <PrimaryButton label='Scan again' onPress={onRescan} />
      <View style={{ height: 10 }} />
      <SecondaryButton label='Back to Home' onPress={onBackHome} />
    </ScrollView>
  );
}

const scanUi = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  topShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  midRow: { flexDirection: 'row', alignItems: 'center' },
  sideShade: { flex: 1, height: 340, backgroundColor: 'rgba(0,0,0,0.55)' },
  ovalWrap: {
    width: 240,
    height: 340,
    borderRadius: 140,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  ovalBorder: {
    width: 240,
    height: 340,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  bottomShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },

  header: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerBtnText: { color: '#fff', fontWeight: '700' },
  progressPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  progressText: { color: '#fff', fontWeight: '800' },

  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    borderRadius: 22,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  hint: { color: 'rgba(255,255,255,0.78)', marginTop: 6, lineHeight: 20 },
  captureRow: { flexDirection: 'row', alignItems: 'center' },
  countdownText: { color: '#fff', fontWeight: '900', fontSize: 16, minWidth: 90 },
  smallPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  smallPillText: { color: 'rgba(255,255,255,0.86)', fontWeight: '800' },

  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(46,175,98,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(46,175,98,0.35)',
  },
  confirmBadgeText: { color: '#CFF5DC', fontWeight: '900' },
  actionBtn: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimary: { backgroundColor: colors.accent },
  actionBtnSecondary: { backgroundColor: 'rgba(255,255,255,0.86)' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  actionBtnTextDark: { color: '#000' },

  preview: {
    position: 'absolute',
    top: 86,
    right: 16,
    width: 96,
    height: 132,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  previewImg: { width: '100%', height: '100%' },
});

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
