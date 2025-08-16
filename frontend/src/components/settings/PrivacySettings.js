import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Shield, Users, Mail, Smartphone, Globe, Lock, Check } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PrivacySettings = () => {
  const [settings, setSettings] = useState({
    profile_visibility: 'public', // public, contacts, private
    event_visibility: 'public', // public, contacts, private
    contact_info_visibility: 'contacts', // public, contacts, private
    activity_sharing: true,
    data_analytics: true,
    marketing_emails: false,
    third_party_sharing: false,
    search_indexing: true,
    location_sharing: false,
    photo_tagging: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const response = await axios.get(`${API}/users/privacy-settings`);
      if (response.data.settings) {
        setSettings({ ...settings, ...response.data.settings });
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
    }
  };

  const handleToggleChange = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await axios.put(`${API}/users/privacy-settings`, { settings });
      setMessage('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setMessage('Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
        enabled ? 'bg-purple-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  const VisibilitySelector = ({ value, onChange, options }) => (
    <div className="flex space-x-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-2 text-sm rounded-md border ${
            value === option.value
              ? 'bg-purple-100 border-purple-300 text-purple-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } transition-colors`}
        >
          <option.icon className="h-4 w-4 inline mr-1" />
          {option.label}
        </button>
      ))}
    </div>
  );

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe },
    { value: 'contacts', label: 'Contacts Only', icon: Users },
    { value: 'private', label: 'Private', icon: Lock }
  ];

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Eye className="h-6 w-6 mr-3" />
            Privacy Settings
          </h1>
          <p className="text-indigo-100 mt-1">Control how your information is shared and used</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Profile Visibility */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Profile & Event Visibility
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Profile Visibility</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Control who can view your profile information
                </p>
                <VisibilitySelector
                  value={settings.profile_visibility}
                  onChange={(value) => handleSelectChange('profile_visibility', value)}
                  options={visibilityOptions}
                />
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Event Visibility</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Control who can see your events and event history
                </p>
                <VisibilitySelector
                  value={settings.event_visibility}
                  onChange={(value) => handleSelectChange('event_visibility', value)}
                  options={visibilityOptions}
                />
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Control who can see your email and phone number
                </p>
                <VisibilitySelector
                  value={settings.contact_info_visibility}
                  onChange={(value) => handleSelectChange('contact_info_visibility', value)}
                  options={visibilityOptions}
                />
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Data Sharing & Analytics
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Activity Sharing</h4>
                  <p className="text-sm text-gray-600">
                    Allow sharing of your event activity with other users for recommendations
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.activity_sharing}
                  onChange={() => handleToggleChange('activity_sharing')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Analytics & Insights</h4>
                  <p className="text-sm text-gray-600">
                    Allow us to analyze your usage to improve our services
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.data_analytics}
                  onChange={() => handleToggleChange('data_analytics')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Third-Party Data Sharing</h4>
                  <p className="text-sm text-gray-600">
                    Allow sharing anonymized data with trusted partners for research
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.third_party_sharing}
                  onChange={() => handleToggleChange('third_party_sharing')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Search Engine Indexing</h4>
                  <p className="text-sm text-gray-600">
                    Allow search engines to index your public profile
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.search_indexing}
                  onChange={() => handleToggleChange('search_indexing')}
                />
              </div>
            </div>
          </div>

          {/* Communication Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-purple-600" />
              Communication Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Marketing Emails</h4>
                  <p className="text-sm text-gray-600">
                    Receive promotional emails about new features and offers
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.marketing_emails}
                  onChange={() => handleToggleChange('marketing_emails')}
                />
              </div>
            </div>
          </div>

          {/* Location & Media */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-purple-600" />
              Location & Media
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Location Sharing</h4>
                  <p className="text-sm text-gray-600">
                    Share your location for better vendor and venue recommendations
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.location_sharing}
                  onChange={() => handleToggleChange('location_sharing')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Photo Tagging</h4>
                  <p className="text-sm text-gray-600">
                    Allow others to tag you in event photos and videos
                  </p>
                </div>
                <ToggleSwitch
                  enabled={settings.photo_tagging}
                  onChange={() => handleToggleChange('photo_tagging')}
                />
              </div>
            </div>
          </div>

          {/* Privacy Policy Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Resources</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Privacy Policy</span>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    View →
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Data Usage Terms</span>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    View →
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Download Your Data</span>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    Request →
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Delete Your Account</span>
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                    Delete →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <div className="flex items-center">
                {message.includes('success') ? (
                  <Check className="h-5 w-5 mr-2" />
                ) : (
                  <X className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Privacy Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;