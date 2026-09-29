import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Checkbox, TextInput } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { clearRememberedCredentials, getRememberedCredentials } from '../auth/rememberedCredentials';
import { Button, Notice, usePalette } from './Pharmacy/PharmacyUI';
import style from '../theme/style';
import themeContext from '../theme/themeContext';

export default function Login() {
  const { login, message } = useAuth();
  const theme = React.useContext(themeContext);
  const p = usePalette();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [changingRemember, setChangingRemember] = useState(false);
  const [storageError, setStorageError] = useState('');
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    getRememberedCredentials()
      .then(saved => {
        if (active && saved) {
          setUsername(saved.username);
          setPassword(saved.password);
        }
      })
      .catch(err => active && setStorageError(err.message))
      .finally(() => active && setLoadingSaved(false));
    return () => { active = false; };
  }, []);
  const toggleRemember = async () => {
    if (remember) {
      setChangingRemember(true);
      try {
        await clearRememberedCredentials();
        setRemember(false);
        setStorageError('');
      } catch (err) {
        setStorageError(err.message);
      } finally {
        setChangingRemember(false);
      }
    } else {
      setRemember(true);
      setStorageError('');
    }
  };
  const submit = async () => {
    if (submitting.current || loadingSaved || changingRemember) {
      return;
    }
    if (!username.trim() || !password) {
      setError('Enter your account email and password.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const rememberFailure = await login(username, password, remember);
      if (rememberFailure) {
        Alert.alert('Remember me unavailable', rememberFailure.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, paddingTop: 40 }}
        >
          <Image
            source={theme.logo}
            resizeMode="contain"
            style={{ width: Dimensions.get('window').width / 3, height: 45 }}
          />
          <Text style={[style.apptitle, { color: p.text, marginTop: 30 }]}>
            Welcome Back
          </Text>
          <Text style={[style.r14, { color: p.muted, marginVertical: 16 }]}>
            Sign in with your MD Tracker account email and password.
          </Text>
          <TextInput
            label="Username (email)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="username"
            textContentType="username"
            editable={!busy && !loadingSaved}
            mode="outlined"
          />
          <View style={{ height: 16 }} />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            editable={!busy && !loadingSaved}
            mode="outlined"
            onSubmitEditing={submit}
            right={
              <TextInput.Icon
                icon={visible ? 'eye-off' : 'eye'}
                onPress={() => setVisible(v => !v)}
              />
            }
          />
          <Checkbox.Item
            label="Remember me"
            status={remember ? 'checked' : 'unchecked'}
            onPress={toggleRemember}
            disabled={busy || loadingSaved || changingRemember}
            position="leading"
            labelStyle={{ color: p.text }}
            style={{ paddingHorizontal: 0, marginTop: 10 }}
            accessibilityLabel="Remember me"
          />
          {!!(error || message || storageError) && <Notice warning text={error || message || storageError} />}
          <View style={{ marginTop: 24 }}>
            <Button
              title={busy ? 'Signing in…' : 'Login'}
              onPress={submit}
              disabled={busy || loadingSaved || changingRemember}
            />
          </View>
          {busy && <ActivityIndicator style={{ marginTop: 16 }} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
