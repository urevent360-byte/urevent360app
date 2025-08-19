import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { EnhancedAuthProvider } from './contexts/EnhancedAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import VendorLayout from './components/VendorLayout';
import EmployeeLayout from './components/EmployeeLayout';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CreateEventWizard from './components/CreateEventWizard';
import StepByStepMode from './components/StepByStepMode';
import EventCreation from './components/EventCreation';
import VenueBrowser from './components/VenueBrowser';
import VenueCreate from './components/VenueCreate';
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
import Messages from './components/Messages';
import Analytics from './components/Analytics';
import PreferredVendors from './components/PreferredVendors';
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
    <ErrorBoundary>
      <EnhancedAuthProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* CEO Portal */}
                <Route 
                  path="/ceo/*" 
                  element={
                    <ProtectedRoute requiredRole="ROLE_CEO">
                      <ErrorBoundary>
                        <CEOConsolePage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />

                {/* Admin Portal */}
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ErrorBoundary>
                        <AdminLayout>
                          <Routes>
                            <Route path="/" element={<AdminDashboard />} />
                            <Route path="/users" element={<UserManagement />} />
                            <Route path="/vendors" element={<VendorManagement />} />
                            <Route path="/operations" element={<OperationsManagement />} />
                            <Route path="/reports" element={<AdminReports />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </AdminLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />

                {/* Vendor Portal */}
                <Route 
                  path="/vendor/*" 
                  element={
                    <ProtectedRoute requiredRole="vendor">
                      <ErrorBoundary>
                        <VendorLayout>
                          <Routes>
                            <Route path="/" element={<VendorDashboard />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </VendorLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />

                {/* Employee Portal */}
                <Route 
                  path="/employee/*" 
                  element={
                    <ProtectedRoute requiredRole="employee">
                      <ErrorBoundary>
                        <EmployeeLayout>
                          <Routes>
                            <Route path="/" element={<EmployeeDashboard />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </EmployeeLayout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />

                {/* Client Portal - Specific Routes Only */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/events/new" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <CreateEventWizard />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/events/create" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <EventCreation />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/events/:eventId/plan" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <StepByStepMode />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/events/:eventId/planning" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <EventPlanning />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/venues" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <VenueBrowser />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/venues/new" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <VenueCreate />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/vendors" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <VendorMarketplace />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/preferred-vendors" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <PreferredVendors />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <Messages />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analytics" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/payments" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <PaymentCenter />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/loans" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <LoanCenter />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/communication" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <CommunicationCenter />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/events/:eventId/guests" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <GuestManagement />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/events/:eventId/budget" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <BudgetTracker />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <EventHistory />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/calendar" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <CalendarView />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Settings routes */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <Settings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/profile" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <EditProfile />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/password" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <ChangePassword />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/language" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <LanguageSettings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/security" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <SecuritySettings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/notifications" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <NotificationSettings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/privacy" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <PrivacySettings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/integrations" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <IntegrationSettings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/billing" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <BillingSettings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/help" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <HelpSupport />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings/account" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Layout>
                          <EnhancedAccountSettings />
                        </Layout>
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                
                {/* Global 404 catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </EnhancedAuthProvider>
    </ErrorBoundary>
  );
}

export default App;

