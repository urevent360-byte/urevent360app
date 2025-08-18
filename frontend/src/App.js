import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { EnhancedAuthProvider } from './contexts/EnhancedAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import VendorLayout from './components/VendorLayout';
import EmployeeLayout from './components/EmployeeLayout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CreateEventWizard from './components/CreateEventWizard';
import StepByStepMode from './components/StepByStepMode';
import EventCreation from './components/EventCreation';
import VenueBrowser from './components/VenueBrowser';
import VendorMarketplace from './components/VendorMarketplace';
import EventPlanning from './components/EventPlanning';
import PaymentCenter from './components/PaymentCenter';
import LoanCenter from './components/LoanCenter';
import CommunicationCenter from './components/CommunicationCenter';
import GuestManagement from './components/GuestManagement';
import EventHistory from './components/EventHistory';
import BudgetTracker from './components/BudgetTracker';
import Profile from './components/Profile';
import CalendarView from './components/CalendarView';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import VendorManagement from './components/VendorManagement';
import OperationsManagement from './components/OperationsManagement';
import AdminReports from './components/AdminReports';
import VendorDashboard from './components/VendorDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import CEOConsolePage from './components/CEOConsolePage';

// Settings Components
import Settings from './components/settings/Settings';
import EditProfile from './components/settings/EditProfile';
import ChangePassword from './components/settings/ChangePassword';
import LanguageSettings from './components/settings/LanguageSettings';
import SecuritySettings from './components/settings/SecuritySettings';
import NotificationSettings from './components/settings/NotificationSettings';
import PrivacySettings from './components/settings/PrivacySettings';
import IntegrationSettings from './components/settings/IntegrationSettings';
import BillingSettings from './components/settings/BillingSettings';
import HelpSupport from './components/settings/HelpSupport';

// Enhanced Settings Components
import EnhancedAccountSettings from './components/settings/EnhancedAccountSettings';

function App() {
  return (
    <EnhancedAuthProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* CEO Console Routes */}
              <Route 
                path="/ceo/*" 
                element={
                  <ProtectedRoute requiredRole="ROLE_CEO">
                    <CEOConsolePage />
                  </ProtectedRoute>
                } 
              />

              {/* Admin routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <UserManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/vendors" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <VendorManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/operations" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <OperationsManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout>
                      <AdminReports />
                    </AdminLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Vendor routes */}
              <Route 
                path="/vendor" 
                element={
                  <ProtectedRoute requiredRole="vendor">
                    <VendorLayout>
                      <VendorDashboard />
                    </VendorLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Employee routes */}
              <Route 
                path="/employee" 
                element={
                  <ProtectedRoute requiredRole="employee">
                    <EmployeeLayout>
                      <EmployeeDashboard />
                    </EmployeeLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Client routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/events/new" element={<CreateEventWizard />} />
                        <Route path="/events/create" element={<EventCreation />} />
                        <Route path="/events/:eventId/plan" element={<StepByStepMode />} />
                        <Route path="/events/:eventId/planning" element={<EventPlanning />} />
                        <Route path="/venues" element={<VenueBrowser />} />
                        <Route path="/vendors" element={<VendorMarketplace />} />
                        <Route path="/payments" element={<PaymentCenter />} />
                        <Route path="/loans" element={<LoanCenter />} />
                        <Route path="/communication" element={<CommunicationCenter />} />
                        <Route path="/events/:eventId/guests" element={<GuestManagement />} />
                        <Route path="/events/:eventId/budget" element={<BudgetTracker />} />
                        <Route path="/history" element={<EventHistory />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/calendar" element={<CalendarView />} />
                        
                        {/* Settings routes */}
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/settings/profile" element={<EditProfile />} />
                        <Route path="/settings/password" element={<ChangePassword />} />
                        <Route path="/settings/language" element={<LanguageSettings />} />
                        <Route path="/settings/security" element={<SecuritySettings />} />
                        <Route path="/settings/notifications" element={<NotificationSettings />} />
                        <Route path="/settings/privacy" element={<PrivacySettings />} />
                        <Route path="/settings/integrations" element={<IntegrationSettings />} />
                        <Route path="/settings/billing" element={<BillingSettings />} />
                        <Route path="/settings/help" element={<HelpSupport />} />
                        <Route path="/settings/account" element={<EnhancedAccountSettings />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </EnhancedAuthProvider>
  );
}

export default App;

// Export AuthContext for components that expect it from App.js
export { AuthContext };