import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../App';
import { 
  CreditCard, Plus, Edit, Trash2, Check, X, Star, Shield, 
  MapPin, Building, Phone, Mail, Download, Eye, EyeOff,
  AlertCircle, ChevronDown, ChevronUp, Calendar, Receipt,
  RefreshCw, Settings, Lock, Smartphone, Bell
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnhancedAccountSettings = () => {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('payment-methods');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [billingAddress, setBillingAddress] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [showEditBilling, setShowEditBilling] = useState(false);

  // Form states
  const [cardForm, setCardForm] = useState({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    name_on_card: '',
    is_default: false
  });

  const [billingForm, setBillingForm] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    company_name: '',
    tax_id: ''
  });

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, billingRes, subscriptionRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/users/payment-methods`),
        axios.get(`${API}/users/billing-address`),
        axios.get(`${API}/users/subscription`),
        axios.get(`${API}/users/booking-history`)
      ]);

      setPaymentMethods(paymentsRes.data.payment_methods || mockPaymentMethods);
      setBillingAddress(billingRes.data.billing_address || {});
      setSubscription(subscriptionRes.data.subscription || mockSubscription);
      setBookingHistory(bookingsRes.data.bookings || mockBookingHistory);
      
      setBillingForm(billingRes.data.billing_address || billingForm);
    } catch (error) {
      console.error('Failed to fetch account data:', error);
      // Use mock data on error
      setPaymentMethods(mockPaymentMethods);
      setSubscription(mockSubscription);
      setBookingHistory(mockBookingHistory);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const mockPaymentMethods = [
    {
      id: 'pm_123',
      card_number: '4242424242424242',
      name_on_card: 'Sarah Johnson',
      expiry_month: '12',
      expiry_year: '2025',
      brand: 'Visa',
      is_default: true,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'pm_456',
      card_number: '5555555555554444',
      name_on_card: 'Sarah Johnson',
      expiry_month: '08',
      expiry_year: '2026',
      brand: 'Mastercard',
      is_default: false,
      created_at: '2024-03-20T00:00:00Z'
    }
  ];

  const mockSubscription = {
    plan_name: 'Premium Plan',
    description: 'Full access to all event planning features',
    amount: 29.99,
    interval: 'month',
    status: 'active',
    current_period_start: '2024-11-15T00:00:00Z',
    current_period_end: '2024-12-15T00:00:00Z',
    cancel_at_period_end: false
  };

  const mockBookingHistory = [
    {
      id: 'booking_123',
      event_name: 'Sarah\'s Wedding Reception',
      vendor_name: 'Elegant Catering Co.',
      service_type: 'Catering',
      amount: 4500.00,
      status: 'completed',
      booking_date: '2024-02-15T00:00:00Z',
      event_date: '2024-03-15T00:00:00Z',
      invoice_id: 'inv_123'
    },
    {
      id: 'booking_456',
      event_name: 'Corporate Annual Gala',
      vendor_name: 'Premier Photography',
      service_type: 'Photography',
      amount: 2800.00,
      status: 'completed',
      booking_date: '2024-01-20T00:00:00Z',
      event_date: '2024-02-20T00:00:00Z',
      invoice_id: 'inv_456'
    },
    {
      id: 'booking_789',
      event_name: 'Birthday Celebration',
      vendor_name: 'Royal Decorations',
      service_type: 'Decoration',
      amount: 1200.00,
      status: 'upcoming',
      booking_date: '2024-11-01T00:00:00Z',
      event_date: '2024-12-01T00:00:00Z',
      invoice_id: 'inv_789'
    }
  ];

  const handleCardInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let formattedValue = value;
    
    if (name === 'card_number') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      formattedValue = formattedValue.substring(0, 19);
    } else if (name === 'expiry_month' || name === 'expiry_year') {
      formattedValue = value.replace(/\D/g, '');
      if (name === 'expiry_month') formattedValue = formattedValue.substring(0, 2);
      else formattedValue = formattedValue.substring(0, 4);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }
    
    setCardForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : formattedValue
    }));
  };

  const handleBillingInputChange = (e) => {
    const { name, value } = e.target;
    setBillingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addPaymentMethod = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/users/payment-methods`, cardForm);
      setPaymentMethods(prev => [...prev, response.data]);
      setShowAddCard(false);
      setCardForm({
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        name_on_card: '',
        is_default: false
      });
      setMessage('Payment method added successfully!');
    } catch (error) {
      console.error('Failed to add payment method:', error);
      setMessage('Failed to add payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return;
    
    try {
      await axios.delete(`${API}/users/payment-methods/${methodId}`);
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      setMessage('Payment method removed successfully.');
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      setMessage('Failed to remove payment method.');
    }
  };

  const setDefaultPaymentMethod = async (methodId) => {
    try {
      await axios.put(`${API}/users/payment-methods/${methodId}/default`);
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        is_default: method.id === methodId
      })));
      setMessage('Default payment method updated.');
    } catch (error) {
      console.error('Failed to update default payment method:', error);
      setMessage('Failed to update default payment method.');
    }
  };

  const updateBillingAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/users/billing-address`, billingForm);
      setBillingAddress(billingForm);
      setShowEditBilling(false);
      setMessage('Billing address updated successfully!');
    } catch (error) {
      console.error('Failed to update billing address:', error);
      setMessage('Failed to update billing address.');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(`${API}/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download invoice:', error);
      setMessage('Failed to download invoice.');
    }
  };

  const formatCardNumber = (number) => {
    return `**** **** **** ${number.slice(-4)}`;
  };

  const getCardBrand = (number) => {
    const firstDigit = number.charAt(0);
    if (firstDigit === '4') return 'Visa';
    if (firstDigit === '5') return 'Mastercard';
    if (firstDigit === '3') return 'American Express';
    return 'Card';
  };

  const sections = [
    { id: 'payment-methods', title: 'Payment Methods', icon: CreditCard },
    { id: 'billing-info', title: 'Billing Information', icon: MapPin },
    { id: 'subscription', title: 'Subscription Management', icon: Star },
    { id: 'booking-history', title: 'Booking History', icon: Receipt },
    { id: 'payment-security', title: 'Payment Security', icon: Shield }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Settings className="h-6 w-6 mr-3" />
            Account Settings
          </h1>
          <p className="text-green-100 mt-1">Manage your payment methods, billing, and account preferences</p>
        </div>

        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {section.title}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Payment Methods Section */}
            {activeSection === 'payment-methods' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                  <button
                    onClick={() => setShowAddCard(!showAddCard)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </button>
                </div>

                {/* Add Card Form */}
                {showAddCard && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Payment Method</h3>
                    <form onSubmit={addPaymentMethod} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                          <input
                            type="text"
                            name="card_number"
                            value={cardForm.card_number}
                            onChange={handleCardInputChange}
                            placeholder="1234 5678 9012 3456"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card *</label>
                          <input
                            type="text"
                            name="name_on_card"
                            value={cardForm.name_on_card}
                            onChange={handleCardInputChange}
                            placeholder="John Doe"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                            <input
                              type="text"
                              name="expiry_month"
                              value={cardForm.expiry_month}
                              onChange={handleCardInputChange}
                              placeholder="12"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                            <input
                              type="text"
                              name="expiry_year"
                              value={cardForm.expiry_year}
                              onChange={handleCardInputChange}
                              placeholder="2025"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                            <input
                              type="text"
                              name="cvv"
                              value={cardForm.cvv}
                              onChange={handleCardInputChange}
                              placeholder="123"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="is_default"
                            checked={cardForm.is_default}
                            onChange={handleCardInputChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Set as default payment method
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddCard(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {loading ? 'Adding...' : 'Add Card'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Payment Methods List */}
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <CreditCard className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {getCardBrand(method.card_number)} {formatCardNumber(method.card_number)}
                              </span>
                              {method.is_default && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Expires {method.expiry_month}/{method.expiry_year} • {method.name_on_card}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!method.is_default && (
                            <button
                              onClick={() => setDefaultPaymentMethod(method.id)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            onClick={() => removePaymentMethod(method.id)}
                            className="text-red-600 hover:text-red-700 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PayPal Option */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">PayPal</h4>
                        <p className="text-sm text-gray-600">Connect your PayPal account for easy payments</p>
                      </div>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Connect PayPal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Information Section */}
            {activeSection === 'billing-info' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Billing Information</h2>
                  <button
                    onClick={() => setShowEditBilling(!showEditBilling)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Billing Address
                  </button>
                </div>

                {/* Current Billing Address */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Street Address</label>
                      <p className="text-gray-900">{billingAddress.street || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">City</label>
                      <p className="text-gray-900">{billingAddress.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">State</label>
                      <p className="text-gray-900">{billingAddress.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">ZIP Code</label>
                      <p className="text-gray-900">{billingAddress.zip || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Country</label>
                      <p className="text-gray-900">{billingAddress.country || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Edit Billing Form */}
                {showEditBilling && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Billing Address</h3>
                    <form onSubmit={updateBillingAddress} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                          <input
                            type="text"
                            name="street"
                            value={billingForm.street}
                            onChange={handleBillingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            name="city"
                            value={billingForm.city}
                            onChange={handleBillingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            name="state"
                            value={billingForm.state}
                            onChange={handleBillingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                          <input
                            type="text"
                            name="zip"
                            value={billingForm.zip}
                            onChange={handleBillingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <select
                            name="country"
                            value={billingForm.country}
                            onChange={handleBillingInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select Country</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="UK">United Kingdom</option>
                            <option value="AU">Australia</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                          </select>
                        </div>
                      </div>

                      {/* Company Information */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Company Information (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input
                              type="text"
                              name="company_name"
                              value={billingForm.company_name}
                              onChange={handleBillingInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / VAT Number</label>
                            <input
                              type="text"
                              name="tax_id"
                              value={billingForm.tax_id}
                              onChange={handleBillingInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowEditBilling(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Management Section */}
            {activeSection === 'subscription' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Subscription Management</h2>
                
                {subscription && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{subscription.plan_name}</h3>
                        <p className="text-gray-600 mt-1">{subscription.description}</p>
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-600">${subscription.amount}</div>
                        <div className="text-sm text-gray-500">per {subscription.interval}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Options */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Available Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: 'Basic', price: 9.99, features: ['Up to 3 events', 'Basic vendor search', 'Email support'] },
                      { name: 'Premium', price: 29.99, features: ['Unlimited events', 'Advanced planning tools', 'Priority support', '2FA security'], current: true },
                      { name: 'Pro', price: 59.99, features: ['Everything in Premium', 'White-label options', 'API access', 'Dedicated manager'] }
                    ].map((plan) => (
                      <div key={plan.name} className={`border rounded-lg p-6 ${plan.current ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                        <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                        <div className="text-2xl font-bold text-gray-900 mt-2">${plan.price}</div>
                        <div className="text-sm text-gray-500">per month</div>
                        <ul className="mt-4 space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <button className={`w-full mt-6 px-4 py-2 rounded-lg font-medium ${
                          plan.current 
                            ? 'bg-purple-100 text-purple-700 cursor-default' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}>
                          {plan.current ? 'Current Plan' : 'Upgrade'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscription Actions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800">Subscription Management</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Changes to your subscription will take effect at the next billing cycle.
                      </p>
                      <div className="mt-3 space-x-3">
                        <button className="text-yellow-800 hover:text-yellow-900 text-sm font-medium">
                          Pause Subscription
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                          Cancel Subscription
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking History Section */}
            {activeSection === 'booking-history' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Booking & Order History</h2>
                
                <div className="space-y-4">
                  {bookingHistory.map((booking) => (
                    <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">{booking.event_name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              booking.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{booking.vendor_name} • {booking.service_type}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Event Date: {new Date(booking.event_date).toLocaleDateString()}</span>
                            <span>Booked: {new Date(booking.booking_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">${booking.amount.toLocaleString()}</div>
                          <div className="mt-2 space-x-2">
                            {booking.status === 'completed' && (
                              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                                Rebook Service
                              </button>
                            )}
                            <button
                              onClick={() => downloadInvoice(booking.invoice_id)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {bookingHistory.filter(b => b.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-500">Completed Bookings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${bookingHistory.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {bookingHistory.filter(b => b.status === 'upcoming').length}
                      </div>
                      <div className="text-sm text-gray-500">Upcoming Events</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Security Section */}
            {activeSection === 'payment-security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Payment Security</h2>
                
                <div className="space-y-4">
                  {/* Payment Confirmations */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Confirmations</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">Email Confirmations</p>
                            <p className="text-sm text-gray-500">Receive email confirmations for all payments</p>
                          </div>
                        </div>
                        <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 bg-green-600">
                          <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">SMS Confirmations</p>
                            <p className="text-sm text-gray-500">Receive SMS confirmations for payments over $500</p>
                          </div>
                        </div>
                        <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 bg-gray-200">
                          <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-0" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2FA for Payments */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication for Payments</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium text-gray-900">Require 2FA for Large Payments</p>
                          <p className="text-sm text-gray-500">Require additional verification for payments over $1,000</p>
                        </div>
                      </div>
                      <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 bg-purple-600">
                        <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-5" />
                      </button>
                    </div>
                  </div>

                  {/* Security Alerts */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Security Alerts</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bell className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium text-gray-900">Suspicious Activity Alerts</p>
                            <p className="text-sm text-gray-500">Get notified of unusual payment activity</p>
                          </div>
                        </div>
                        <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 bg-orange-600">
                          <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Lock className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-gray-900">Login from New Device</p>
                            <p className="text-sm text-gray-500">Alert when someone logs in from an unrecognized device</p>
                          </div>
                        </div>
                        <button className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 bg-red-600">
                          <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 translate-x-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message Display */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAccountSettings;