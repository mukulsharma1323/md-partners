import React from 'react';
import { useAuth } from '../auth/AuthContext';
import Login from '../screens/Login';
import PartnerApp from '../screens/Partner/PartnerApp';

export default function AppNavigator() {
  const { user } = useAuth();
  return user ? <PartnerApp /> : <Login />;
}
