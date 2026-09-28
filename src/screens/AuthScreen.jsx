import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native';
import { COLORS } from '../constants/theme';
import { login, register } from '../services/auth';

export default function AuthScreen({ navigation, route }) {
  const [mode, setMode] = useState(route?.params?.mode === 'register' ? 'register' : 'login');
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');

  const run = async (fn) => { setBusy(true); try { return await fn(); } catch (e) { Alert.alert('AZKOM', e.message); } finally { setBusy(false); } };

  const submit = () => run(async () => {
    const u = username.trim();

    if (!u || !password) {
      throw new Error('Username dan password wajib diisi.');
    }

    if (mode === 'login') {
      await login(u, password);
      navigation.goBack();
      return;
    }

    if (password !== confirm) {
      throw new Error('Konfirmasi password tidak sama.');
    }

    await register(u, password, confirm, email.trim());
    navigation.goBack();
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Kembali</Text></TouchableOpacity>
          <Text style={styles.logo}>AZKOM</Text>
          <Text style={styles.title}>{mode === 'login' ? 'Login' : 'Daftar'}</Text>
          <Text style={styles.subtitle}>{mode === 'login' ? 'Masuk dengan username dan password AZKOM.' : 'Buat akun AZKOM langsung dari website.'}</Text>
          <Text style={styles.label}>Username</Text>
          <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={styles.input} placeholder="Username" placeholderTextColor={COLORS.textMuted} />
          <Text style={styles.label}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholder="Password" placeholderTextColor={COLORS.textMuted} />
          {mode === 'register' && <>
            <Text style={styles.label}>Konfirmasi Password</Text>
            <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry style={styles.input} placeholder="Ulangi password" placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.label}>Email (Opsional)</Text>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} placeholder="Email opsional" placeholderTextColor={COLORS.textMuted} />
          </>}
          <TouchableOpacity disabled={busy} style={styles.primary} onPress={submit}><Text style={styles.primaryText}>{busy ? 'Memproses...' : mode === 'login' ? 'LOGIN' : 'DAFTAR'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={styles.switch}><Text style={styles.switchText}>{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}</Text></TouchableOpacity>        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingBottom: 50 },
  back: { color: COLORS.textMuted, fontSize: 18, marginBottom: 35 },
  logo: { color: COLORS.primary, fontSize: 30, fontWeight: '900', marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: COLORS.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 22 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: { backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  primary: { marginTop: 22, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '900' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  link: { color: '#B38CFF', fontWeight: '800', textAlign: 'center', marginTop: 16 },
  switch: { marginTop: 25, padding: 12, borderRadius: 10, backgroundColor: COLORS.surface },
  switchText: { color: COLORS.text, textAlign: 'center', fontWeight: '700' },
});
