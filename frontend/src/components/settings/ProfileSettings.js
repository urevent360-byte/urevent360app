import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../App';
import { 
  User, Edit, Lock, Globe, Shield, HelpCircle, 
  ChevronRight, ChevronDown, Settings, UserCog, 
  Bell, Languages, Eye, LinkIcon, CreditCard, MessageCircle,
  Smartphone, Mail, Phone, Calendar
} from 'lucide-react';

const ProfileSettings = () => {
  const { user } = useContext(AuthContext);
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    settings: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const CollapsibleSection = ({ title, isExpanded, onToggle, children }) => (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset rounded-lg transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="border-t border-gray-100 pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );

  const SettingsItem = ({ to, icon: Icon, title, description, badge, statusColor }) => (
    <Link
      to={to}
      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all group"
    >
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 group-hover:bg-purple-100 p-3 rounded-lg transition-colors">
          <Icon className="h-5 w-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {badge && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            statusColor === 'green' ? 'bg-green-100 text-green-800' : 
            statusColor === 'blue' ? 'bg-blue-100 text-blue-800' : 
            statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {badge}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
      </div>
    </Link>
  );

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg px-6 py-8 text-white">
          <div className="flex items-center space-x-6">
            <img
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=7c3aed&color=fff&size=100`}
              alt={user?.name}
              className="h-20 w-20 rounded-full border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-purple-100 mt-1">{user?.email}</p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-purple-100">
                <span className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {user?.mobile}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Member since {new Date(user?.created_at).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <CollapsibleSection
          title="Profile"
          isExpanded={expandedSections.profile}
          onToggle={() => toggleSection('profile')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsItem
              to="/profile"
              icon={User}
              title="View Profile"
              description="See your complete profile and preferences"
            />
            <SettingsItem
              to="/profile/edit"
              icon={Edit}
              title="Edit Profile"
              description="Update name, email, photo and bio"
            />
            <SettingsItem
              to="/profile/change-password"
              icon={Lock}
              title="Change Password"
              description="Update your account password"
            />
            <SettingsItem
              to="/profile/language"
              icon={Globe}
              title="Language Settings"
              description="Choose your preferred language"
              badge="English"
              statusColor="blue"
            />
            <SettingsItem
              to="/profile/security"
              icon={Shield}
              title="Security & Two-Factor Auth"
              description="Enhance your account security"
              badge="Active"
              statusColor="green"
            />
            <SettingsItem
              to="/help"
              icon={HelpCircle}
              title="Help & Support"
              description="Get help and contact support"
              badge="24/7"
              statusColor="blue"
            />
          </div>
        </CollapsibleSection>

        {/* Settings Section */}
        <CollapsibleSection
          title="Settings"
          isExpanded={expandedSections.settings}
          onToggle={() => toggleSection('settings')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsItem
              to="/settings/account"
              icon={UserCog}
              title="Account Settings"
              description="Manage account details and contact info"
            />
            <SettingsItem
              to="/settings/security"
              icon={Shield}
              title="Security Settings"
              description="Advanced security preferences"
              badge="2FA Enabled"
              statusColor="green"
            />
            <SettingsItem
              to="/settings/notifications"
              icon={Bell}
              title="Notification Preferences"
              description="Control email, SMS and push notifications"
            />
            <SettingsItem
              to="/settings/language"
              icon={Languages}
              title="Language Preferences"
              description="App language and regional settings"
              badge="🇺🇸 EN"
              statusColor="blue"
            />
            <SettingsItem
              to="/settings/privacy"
              icon={Eye}
              title="Privacy Settings"
              description="Data sharing and visibility controls"
            />
            <SettingsItem
              to="/settings/integrations"
              icon={LinkIcon}
              title="Linked Accounts & Integrations"
              description="Connect third-party services"
              badge="3 Connected"
              statusColor="green"
            />
            <SettingsItem
              to="/settings/billing"
              icon={CreditCard}
              title="Billing & Payments"
              description="Payment methods and billing history"
            />
            <SettingsItem
              to="/help/support"
              icon={MessageCircle}
              title="Help & Support Center"
              description="Comprehensive help and contact options"
              badge="24/7"
              statusColor="blue"
            />
          </div>
        </CollapsibleSection>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/profile/edit"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-center group"
            >
              <Edit className="h-8 w-8 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">Update Photo</p>
              <p className="text-xs text-gray-500">Change profile picture</p>
            </Link>
            
            <Link
              to="/profile/security"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-center group"
            >
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">Setup 2FA</p>
              <p className="text-xs text-gray-500">Enhance security</p>
            </Link>
            
            <Link
              to="/settings/integrations"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-center group"
            >
              <LinkIcon className="h-8 w-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-gray-900">Connect Apps</p>
              <p className="text-xs text-gray-500">Link your accounts</p>
            </Link>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-2">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Security</p>
              <p className="text-xs text-green-600">Excellent</p>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-2">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Profile</p>
              <p className="text-xs text-blue-600">Complete</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mb-2">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
              <p className="text-xs text-purple-600">Configured</p>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mb-2">
                <LinkIcon className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Integrations</p>
              <p className="text-xs text-orange-600">3 Connected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;