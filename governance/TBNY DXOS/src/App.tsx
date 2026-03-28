import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MasterDataLayout } from './components/MasterDataLayout';
import { masterSchema } from './config/masterSchema';
import './styles/design-tokens.css';

function AppContent() {
  return (
    <div className="app-container">
      <MasterDataLayout schema={masterSchema} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
