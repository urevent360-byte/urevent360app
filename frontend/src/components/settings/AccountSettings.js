import React from 'react';
import { Navigate } from 'react-router-dom';

const AccountSettings = () => {
  // Redirect to the enhanced account settings
  return <Navigate to="/settings/account-enhanced" replace />;
};

export default AccountSettings;