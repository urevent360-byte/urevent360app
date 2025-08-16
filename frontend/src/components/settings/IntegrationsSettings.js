import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Link as LinkIcon, Unlink, Plus, Check, X, ExternalLink, 
  Calendar, Mail, CreditCard, MessageCircle, Camera, Music,
  MapPin, Users, Smartphone, Globe
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IntegrationsSettings = () => {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [availableIntegrations, setAvailableIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await axios.get(`${API}/users/integrations`);
      setConnectedAccounts(response.data.connected || []);
      setAvailableIntegrations(response.data.available || defaultIntegrations);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      setAvailableIntegrations(defaultIntegrations);
    }
  };

  const connectIntegration = async (integrationId) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${API}/users/integrations/connect`, { 
        integration_id: integrationId 
      });
      
      if (response.data.redirect_url) {
        // Redirect to OAuth provider
        window.open(response.data.redirect_url, '_blank', 'width=600,height=700');
      } else {
        // Direct connection
        setMessage('Integration connected successfully!');
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Failed to connect integration:', error);
      setMessage('Failed to connect integration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectIntegration = async (integrationId) => {
    if (!window.confirm('Are you sure you want to disconnect this integration? This may affect some features.')) {
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      await axios.post(`${API}/users/integrations/disconnect`, { 
        integration_id: integrationId 
      });
      
      setMessage('Integration disconnected successfully.');
      fetchIntegrations();
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      setMessage('Failed to disconnect integration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const defaultIntegrations = [
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Sync your events with Google Calendar for better scheduling',
      icon: Calendar,
      category: 'Productivity',
      color: 'bg-blue-500',
      benefits: ['Auto-sync events', 'Calendar reminders', 'Scheduling conflicts detection']
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send event invitations and updates via Gmail',
      icon: Mail,
      category: 'Communication',
      color: 'bg-red-500',
      benefits: ['Email invitations', 'Automatic updates', 'Contact sync']
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept online payments for your events',
      icon: CreditCard,
      category: 'Payments',
      color: 'bg-purple-500',
      benefits: ['Secure payments', 'Multiple payment methods', 'Automatic receipts']
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get event notifications in your Slack workspace',
      icon: MessageCircle,
      category: 'Communication',
      color: 'bg-green-500',
      benefits: ['Real-time notifications', 'Team collaboration', 'Event updates']
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Share event photos and stories automatically',
      icon: Camera,
      category: 'Social Media',
      color: 'bg-pink-500',
      benefits: ['Auto-posting', 'Story creation', 'Event promotion']
    },
    {
      id: 'spotify',
      name: 'Spotify',
      description: 'Create event playlists and music recommendations',
      icon: Music,
      category: 'Entertainment',
      color: 'bg-green-600',
      benefits: ['Custom playlists', 'Music suggestions', 'Party atmosphere']
    },
    {
      id: 'google_maps',
      name: 'Google Maps',
      description: 'Enhanced venue search and location services',
      icon: MapPin,
      category: 'Location',
      color: 'bg-blue-600',
      benefits: ['Venue directions', 'Traffic updates', 'Parking information']
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Create and promote events on Facebook',
      icon: Users,
      category: 'Social Media',
      color: 'bg-blue-700',
      benefits: ['Event promotion', 'RSVP management', 'Social sharing']
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'Send SMS notifications and reminders',
      icon: Smartphone,
      category: 'Communication',
      color: 'bg-red-600',
      benefits: ['SMS reminders', 'Event updates', 'Emergency notifications']
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Create virtual events and meetings automatically',
      icon: Globe,
      category: 'Virtual Events',
      color: 'bg-blue-400',
      benefits: ['Auto meeting creation', 'Registration sync', 'Recording management']
    }
  ];

  const getIntegrationById = (id) => {
    return availableIntegrations.find(integration => integration.id === id);
  };

  const isConnected = (integrationId) => {
    return connectedAccounts.some(account => account.integration_id === integrationId);
  };

  const groupedIntegrations = availableIntegrations.reduce((groups, integration) => {
    const category = integration.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(integration);
    return groups;
  }, {});

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <LinkIcon className="h-6 w-6 mr-3" />
            Linked Accounts & Integrations
          </h1>
          <p className="text-cyan-100 mt-1">Connect your favorite apps and services to enhance your event planning experience</p>
        </div>

        <div className="p-6">
          {/* Connected Accounts */}
          {connectedAccounts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedAccounts.map((account) => {
                  const integration = getIntegrationById(account.integration_id);
                  if (!integration) return null;
                  
                  const Icon = integration.icon;
                  return (
                    <div key={account.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 ${integration.color} rounded-lg`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{integration.name}</h4>
                            <p className="text-xs text-gray-600">Connected on {new Date(account.connected_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      
                      {account.account_name && (
                        <p className="text-sm text-gray-700 mb-2">Account: {account.account_name}</p>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                          Active
                        </span>
                        <button
                          onClick={() => disconnectIntegration(account.integration_id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 flex items-center"
                        >
                          <Unlink className="h-3 w-3 mr-1" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Integrations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Integrations</h3>
            
            {Object.entries(groupedIntegrations).map(([category, integrations]) => (
              <div key={category} className="mb-8">
                <h4 className="text-md font-medium text-gray-700 mb-4 uppercase tracking-wide text-sm">
                  {category}
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {integrations.map((integration) => {
                    const Icon = integration.icon;
                    const connected = isConnected(integration.id);
                    
                    return (
                      <div key={integration.id} className={`border rounded-lg p-6 transition-all hover:shadow-md ${
                        connected ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 ${integration.color} rounded-lg flex-shrink-0`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                              {connected && (
                                <div className="flex items-center space-x-1 text-green-600 text-sm">
                                  <Check className="h-4 w-4" />
                                  <span>Connected</span>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-3">{integration.description}</p>
                            
                            {integration.benefits && (
                              <div className="mb-4">
                                <p className="text-xs font-medium text-gray-500 mb-2">Benefits:</p>
                                <div className="flex flex-wrap gap-1">
                                  {integration.benefits.slice(0, 3).map((benefit, index) => (
                                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                      {benefit}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              {connected ? (
                                <button
                                  onClick={() => disconnectIntegration(integration.id)}
                                  disabled={loading}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 flex items-center"
                                >
                                  <Unlink className="h-4 w-4 mr-1" />
                                  Disconnect
                                </button>
                              ) : (
                                <button
                                  onClick={() => connectIntegration(integration.id)}
                                  disabled={loading}
                                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center text-sm"
                                >
                                  {loading ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  ) : (
                                    <Plus className="h-4 w-4 mr-1" />
                                  )}
                                  Connect
                                </button>
                              )}
                              
                              <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                                Learn More
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mt-6 ${message.includes('success') || message.includes('connected') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <div className="flex items-center">
                {message.includes('success') || message.includes('connected') ? (
                  <Check className="h-5 w-5 mr-2" />
                ) : (
                  <X className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Integration Benefits */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Connect Your Accounts?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <LinkIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Seamless Workflow</h4>
                <p className="text-sm text-gray-600">Automate tasks between your favorite apps</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Save Time</h4>
                <p className="text-sm text-gray-600">Reduce manual work and focus on planning</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Better Collaboration</h4>
                <p className="text-sm text-gray-600">Keep everyone in sync across platforms</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsSettings;