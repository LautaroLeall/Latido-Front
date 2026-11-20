import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import AppRoutes from './AppRoutes';

export default function AuthenticatedApp() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
