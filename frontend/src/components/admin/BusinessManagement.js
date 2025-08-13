import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone,
  MapPin,
  DollarSign,
  Percent,
  Plus
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BusinessManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('businesses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [commissionSettings, setCommissionSettings] = useState({
    registration_fee: 0,
    commission_percentage: 0,
    subscription_fee: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'businesses') {
        const response = await axios.get(`${API}/admin/businesses`);
        setBusinesses(response.data || []);
      } else {
        const response = await axios.get(`${API}/admin/businesses/applications`);
        setApplications(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data for demo
      if (activeTab === 'businesses') {
        setBusinesses([
          {
            id: '1',
            name: 'Elite Catering Services',
            owner_name: 'John Anderson',
            email: 'john@elitecatering.com',
            mobile: '+1 (555) 123-4567',
            business_type: 'Catering',
            address: '123 Main St, New York, NY',
            description: 'Premium catering services for all events',
            status: 'active',
            created_at: new Date(Date.now() - 86400000 * 30).toISOString()
          },
          {
            id: '2',
            name: 'Elegant Decorations',
            owner_name: 'Sarah Wilson',
            email: 'sarah@elegantdecorations.com',
            mobile: '+1 (555) 987-6543',
            business_type: 'Decoration',
            address: '456 Oak Ave, Los Angeles, CA',
            description: 'Beautiful event decorations and styling',
            status: 'active',
            created_at: new Date(Date.now() - 86400000 * 45).toISOString()
          }
        ]);
      } else {
        setApplications([
          {
            id: '1',
            business_name: 'Perfect Photography Studio',
            owner_name: 'Mike Johnson',
            email: 'mike@perfectphoto.com',
            mobile: '+1 (555) 456-7890',
            business_type: 'Photography',
            address: '789 Pine St, Chicago, IL',
            description: 'Professional event photography services',
            status: 'pending',
            applied_at: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            id: '2',
            business_name: 'Sound & Music Co.',
            owner_name: 'Lisa Davis',
            email: 'lisa@soundmusic.com',
            mobile: '+1 (555) 321-0987',
            business_type: 'Music/DJ',
            address: '321 Elm St, Miami, FL',
            description: 'DJ services and sound equipment rental',
            status: 'pending',
            applied_at: new Date(Date.now() - 86400000 * 5).toISOString()
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const reviewApplication = async (appId, status, comments = '') => {
    try {
      await axios.put(`${API}/admin/businesses/applications/${appId}/review`, {
        status,
        comments
      });
      
      setApplications(applications.map(app => 
        app.id === appId 
          ? { ...app, status, review_comments: comments }
          : app
      ));
      
      setShowApplicationModal(false);
    } catch (error) {
      console.error('Failed to review application:', error);
    }
  };

  const updateCommissionSettings = async (businessId) => {
    try {
      await axios.put(`${API}/admin/businesses/${businessId}/commission`, {
        business_id: businessId,
        ...commissionSettings
      });
      
      setShowBusinessModal(false);
    } catch (error) {
      console.error('Failed to update commission settings:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = activeTab === 'businesses' 
    ? businesses.filter(business => 
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.business_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : applications.filter(app => 
        app.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.business_type.toLowerCase().includes(searchTerm.toLowerCase())
      );

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
          <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage business applications and registered service providers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'businesses'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="mr-2 h-4 w-4 inline" />
            Active Businesses ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'applications'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="mr-2 h-4 w-4 inline" />
            Applications ({applications.filter(app => app.status === 'pending').length})
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'businesses' ? 'Registered' : 'Applied'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {activeTab === 'businesses' ? item.name : item.business_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.owner_name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {item.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.business_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(activeTab === 'businesses' ? item.created_at : item.applied_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          if (activeTab === 'businesses') {
                            setSelectedBusiness(item);
                            setShowBusinessModal(true);
                          } else {
                            setSelectedApplication(item);
                            setShowApplicationModal(true);
                          }
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {activeTab === 'applications' && item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => reviewApplication(item.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => reviewApplication(item.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Business Details Modal */}
      {showBusinessModal && selectedBusiness && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowBusinessModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Business Details & Commission Settings
                </h3>
                
                {/* Business Info */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Business Name</label>
                      <p className="font-medium">{selectedBusiness.name}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Owner</label>
                      <p className="font-medium">{selectedBusiness.owner_name}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Email</label>
                      <p className="font-medium">{selectedBusiness.email}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Phone</label>
                      <p className="font-medium">{selectedBusiness.mobile}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-gray-500">Address</label>
                      <p className="font-medium">{selectedBusiness.address}</p>
                    </div>
                  </div>
                </div>

                {/* Commission Settings */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Commission Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Fee
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="number"
                          value={commissionSettings.registration_fee}
                          onChange={(e) => setCommissionSettings({
                            ...commissionSettings,
                            registration_fee: parseFloat(e.target.value) || 0
                          })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commission Percentage
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="number"
                          value={commissionSettings.commission_percentage}
                          onChange={(e) => setCommissionSettings({
                            ...commissionSettings,
                            commission_percentage: parseFloat(e.target.value) || 0
                          })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0.00"
                          max="100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Subscription Fee
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="number"
                          value={commissionSettings.subscription_fee}
                          onChange={(e) => setCommissionSettings({
                            ...commissionSettings,
                            subscription_fee: parseFloat(e.target.value) || 0
                          })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => updateCommissionSettings(selectedBusiness.id)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Review Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowApplicationModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Business Application Review
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Business Name</label>
                      <p className="font-medium">{selectedApplication.business_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Owner</label>
                      <p className="font-medium">{selectedApplication.owner_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="font-medium">{selectedApplication.mobile}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Business Type</label>
                      <p className="font-medium">{selectedApplication.business_type}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Applied Date</label>
                      <p className="font-medium">{formatDate(selectedApplication.applied_at)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="font-medium">{selectedApplication.address}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500">Description</label>
                    <p className="font-medium">{selectedApplication.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => reviewApplication(selectedApplication.id, 'approved')}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => reviewApplication(selectedApplication.id, 'rejected')}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessManagement;