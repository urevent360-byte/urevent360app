import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Search, 
  Filter, 
  Eye, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorAnalytics, setVendorAnalytics] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API}/admin/vendors`);
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      // Mock data for subscribed vendors
      setVendors([
        {
          id: '1',
          business_name: 'Elite Catering Services',
          owner_name: 'John Anderson',
          email: 'john@elitecatering.com',
          mobile: '+1 (555) 123-4567',
          service_category: 'Catering',
          city: 'New York',
          state: 'NY',
          subscription_status: 'active',
          subscription_plan: 'premium',
          monthly_fee: 199.0,
          rating: 4.8,
          total_reviews: 156,
          next_billing_date: new Date(Date.now() + 86400000 * 15).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 90).toISOString()
        },
        {
          id: '2',
          business_name: 'Elegant Decorations',
          owner_name: 'Sarah Wilson',
          email: 'sarah@elegantdecorations.com',
          mobile: '+1 (555) 987-6543',
          service_category: 'Decoration',
          city: 'Los Angeles',
          state: 'CA',
          subscription_status: 'active',
          subscription_plan: 'enterprise',
          monthly_fee: 399.0,
          rating: 4.9,
          total_reviews: 203,
          next_billing_date: new Date(Date.now() + 86400000 * 8).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 120).toISOString()
        },
        {
          id: '3',
          business_name: 'Perfect Photography Studio',
          owner_name: 'Mike Johnson',
          email: 'mike@perfectphoto.com',
          mobile: '+1 (555) 456-7890',
          service_category: 'Photography',
          city: 'Chicago',
          state: 'IL',
          subscription_status: 'suspended',
          subscription_plan: 'basic',
          monthly_fee: 99.0,
          rating: 4.6,
          total_reviews: 89,
          next_billing_date: new Date(Date.now() - 86400000 * 5).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 60).toISOString()
        },
        {
          id: '4',
          business_name: 'Sound & Music Co.',
          owner_name: 'Lisa Davis',
          email: 'lisa@soundmusic.com',
          mobile: '+1 (555) 321-0987',
          service_category: 'Music/DJ',
          city: 'Miami',
          state: 'FL',
          subscription_status: 'active',
          subscription_plan: 'basic',
          monthly_fee: 99.0,
          rating: 4.5,
          total_reviews: 67,
          next_billing_date: new Date(Date.now() + 86400000 * 22).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 45).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorAnalytics = async (vendorId) => {
    try {
      const response = await axios.get(`${API}/vendor/analytics/${vendorId}`);
      setVendorAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch vendor analytics:', error);
      // Mock analytics data
      setVendorAnalytics({
        total_leads: 145,
        total_bookings: 87,
        conversion_rate: 60.0,
        monthly_leads: 23,
        monthly_bookings: 14,
        total_revenue: 87500,
        average_booking_value: 1005.75
      });
    }
  };

  const updateVendorCommission = async (vendorId, commissionRate) => {
    try {
      await axios.put(`${API}/admin/vendors/${vendorId}/commission`, {
        commission_rate: commissionRate
      });
      
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, commission_rate: commissionRate }
          : vendor
      ));
    } catch (error) {
      console.error('Failed to update commission:', error);
    }
  };

  const suspendVendor = async (vendorId) => {
    try {
      await axios.post(`${API}/vendor/subscription/${vendorId}/cancel`, {
        reason: 'Administrative suspension'
      });
      
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, subscription_status: 'suspended' }
          : vendor
      ));
    } catch (error) {
      console.error('Failed to suspend vendor:', error);
    }
  };

  const openVendorModal = async (vendor) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
    await fetchVendorAnalytics(vendor.id);
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
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.service_category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage subscribed vendors and their performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Vendors</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {vendors.filter(v => v.subscription_status === 'active').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(vendors.filter(v => v.subscription_status === 'active')
                      .reduce((sum, v) => sum + v.monthly_fee, 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Suspended</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {vendors.filter(v => v.subscription_status === 'suspended').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Rating</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {vendors.length > 0 
                      ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)
                      : '0.0'
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendors..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={`https://ui-avatars.com/api/?name=${vendor.business_name}&background=7c3aed&color=fff`}
                          alt={vendor.business_name}
                          className="h-10 w-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vendor.business_name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {vendor.city}, {vendor.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {vendor.service_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.subscription_status)}`}>
                          {vendor.subscription_status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(vendor.subscription_plan)}`}>
                          {vendor.subscription_plan} - {formatCurrency(vendor.monthly_fee)}/mo
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {renderStars(vendor.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {vendor.rating} ({vendor.total_reviews})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(vendor.next_billing_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openVendorModal(vendor)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {vendor.subscription_status === 'active' && (
                        <button
                          onClick={() => suspendVendor(vendor.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showVendorModal && selectedVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowVendorModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=${selectedVendor.business_name}&background=7c3aed&color=fff&size=80`}
                      alt={selectedVendor.business_name}
                      className="h-20 w-20 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-medium text-gray-900">{selectedVendor.business_name}</h3>
                      <p className="text-gray-500">{selectedVendor.owner_name}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-1" />
                          {selectedVendor.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          {selectedVendor.mobile}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedVendor.subscription_status)}`}>
                      {selectedVendor.subscription_status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedVendor.subscription_plan} Plan - {formatCurrency(selectedVendor.monthly_fee)}/month
                    </p>
                  </div>
                </div>

                {/* Analytics */}
                {vendorAnalytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-blue-600">Total Leads</p>
                          <p className="text-xl font-semibold text-blue-900">{vendorAnalytics.total_leads}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm text-green-600">Total Bookings</p>
                          <p className="text-xl font-semibold text-green-900">{vendorAnalytics.total_bookings}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-6 w-6 text-purple-600 mr-2" />
                        <div>
                          <p className="text-sm text-purple-600">Total Revenue</p>
                          <p className="text-xl font-semibold text-purple-900">{formatCurrency(vendorAnalytics.total_revenue)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Star className="h-6 w-6 text-yellow-600 mr-2" />
                        <div>
                          <p className="text-sm text-yellow-600">Conversion Rate</p>
                          <p className="text-xl font-semibold text-yellow-900">{vendorAnalytics.conversion_rate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Details */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Subscription Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Plan Type</label>
                      <p className="font-medium capitalize">{selectedVendor.subscription_plan}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Monthly Fee</label>
                      <p className="font-medium">{formatCurrency(selectedVendor.monthly_fee)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Next Billing</label>
                      <p className="font-medium">{formatDate(selectedVendor.next_billing_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowVendorModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;