import React from 'react';
import AppNavigator from './src/navigator/AppNavigator';
import { AuthProvider } from './src/auth/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
