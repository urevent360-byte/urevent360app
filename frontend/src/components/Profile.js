import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Star, Heart, Trash2, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [preferredVendors, setPreferredVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    preferences: {
      event_types: [],
      budget_range: '',
      notification_preferences: {
        email: true,
        sms: false,
        push: true
      }
    }
  });

  const eventTypes = [
    'Wedding',
    'Corporate Event',
    'Birthday Party',
    'Anniversary',
    'Graduation',
    'Baby Shower',
    'Retirement Party',
    'Holiday Party',
    'Conference',
    'Workshop'
  ];

  const budgetRanges = [
    'Under $1,000',
    '$1,000 - $5,000',
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    'Over $50,000'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/profile`);
      if (response.data.profile) {
        setProfile(response.data.profile);
        setFormData({
          bio: response.data.profile.bio || '',
          location: response.data.profile.location || '',
          preferences: response.data.profile.preferences || {
            event_types: [],
            budget_range: '',
            notification_preferences: {
              email: true,
              sms: false,
              push: true
            }
          }
        });
      } else {
        // Initialize with default values
        setProfile({
          bio: '',
          location: '',
          preferences: {
            event_types: [],
            budget_range: '',
            notification_preferences: {
              email: true,
              sms: false,
              push: true
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'preferences') {
        setFormData(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEventTypeToggle = (eventType) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        event_types: prev.preferences.event_types.includes(eventType)
          ? prev.preferences.event_types.filter(type => type !== eventType)
          : [...prev.preferences.event_types, eventType]
      }
    }));
  };

  const handleNotificationChange = (type) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notification_preferences: {
          ...prev.preferences.notification_preferences,
          [type]: !prev.preferences.notification_preferences[type]
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/users/profile`, formData);
      setProfile({ ...profile, ...formData });
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        location: profile.location || '',
        preferences: profile.preferences || {
          event_types: [],
          budget_range: '',
          notification_preferences: {
            email: true,
            sms: false,
            push: true
          }
        }
      });
    }
    setEditing(false);
  };

  // Preferred Vendors Functions
  const fetchPreferredVendors = async () => {
    setLoadingVendors(true);
    try {
      const response = await axios.get(`${API}/users/preferred-vendors`);
      setPreferredVendors(response.data.preferred_vendors || []);
    } catch (error) {
      console.error('Failed to fetch preferred vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const removePreferredVendor = async (vendorId) => {
    try {
      await axios.delete(`${API}/users/preferred-vendors/${vendorId}`);
      setPreferredVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
    } catch (error) {
      console.error('Failed to remove preferred vendor:', error);
    }
  };

  // Load preferred vendors when switching to that tab
  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchPreferredVendors();
    }
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account information and preferences
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </button>
        ) : (
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=7c3aed&color=fff&size=128`}
                alt={user?.name}
                className="h-20 w-20 rounded-full"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Phone className="h-4 w-4 mr-2" />
                <span>{user?.mobile}</span>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Member since {new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">About</h3>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your city, state"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Bio</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {profile?.bio || 'No bio provided yet.'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Location</h4>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{profile?.location || 'Location not specified'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Event Preferences</h3>
          
          <div className="space-y-6">
            {/* Event Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preferred Event Types</h4>
              {editing ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {eventTypes.map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.event_types.includes(type)}
                        onChange={() => handleEventTypeToggle(type)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.preferences?.event_types?.length > 0 ? (
                    profile.preferences.event_types.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No preferences selected</span>
                  )}
                </div>
              )}
            </div>

            {/* Budget Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Typical Budget Range</h4>
              {editing ? (
                <select
                  name="preferences.budget_range"
                  value={formData.preferences.budget_range}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select budget range</option>
                  {budgetRanges.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">
                  {profile?.preferences?.budget_range || 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Notification Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive updates about your events via email</p>
              </div>
              <button
                type="button"
                onClick={() => editing && handleNotificationChange('email')}
                disabled={!editing}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  formData.preferences.notification_preferences.email
                    ? 'bg-purple-600'
                    : 'bg-gray-200'
                } ${!editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    formData.preferences.notification_preferences.email
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-500">Receive important updates via text message</p>
              </div>
              <button
                type="button"
                onClick={() => editing && handleNotificationChange('sms')}
                disabled={!editing}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  formData.preferences.notification_preferences.sms
                    ? 'bg-purple-600'
                    : 'bg-gray-200'
                } ${!editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    formData.preferences.notification_preferences.sms
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications in the app</p>
              </div>
              <button
                type="button"
                onClick={() => editing && handleNotificationChange('push')}
                disabled={!editing}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                  formData.preferences.notification_preferences.push
                    ? 'bg-purple-600'
                    : 'bg-gray-200'
                } ${!editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                    formData.preferences.notification_preferences.push
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;