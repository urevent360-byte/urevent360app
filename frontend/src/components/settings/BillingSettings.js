import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, DollarSign, Calendar, Download, Plus, X, 
  Check, AlertCircle, FileText, Receipt, History, Edit
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BillingSettings = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    name_on_card: '',
    billing_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [methodsRes, historyRes, subRes] = await Promise.all([
        axios.get(`${API}/users/payment-methods`),
        axios.get(`${API}/users/billing-history`),
        axios.get(`${API}/users/subscription`)
      ]);
      
      setPaymentMethods(methodsRes.data.payment_methods || []);
      setBillingHistory(historyRes.data.billing_history || []);
      setSubscription(subRes.data.subscription || null);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    }
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setCardForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      let formattedValue = value;
      
      // Format card number
      if (name === 'card_number') {
        formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
        formattedValue = formattedValue.substring(0, 19); // Max length with spaces
      }
      
      // Format expiry
      if (name === 'expiry_month' || name === 'expiry_year') {
        formattedValue = value.replace(/\D/g, '');
        if (name === 'expiry_month') {
          formattedValue = formattedValue.substring(0, 2);
        } else {
          formattedValue = formattedValue.substring(0, 4);
        }
      }
      
      // Format CVV
      if (name === 'cvv') {
        formattedValue = value.replace(/\D/g, '').substring(0, 4);
      }
      
      setCardForm(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    }
  };

  const addPaymentMethod = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      await axios.post(`${API}/users/payment-methods`, cardForm);
      setMessage('Payment method added successfully!');
      setShowAddCard(false);
      setCardForm({
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        name_on_card: '',
        billing_address: {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        }
      });
      fetchBillingData();
    } catch (error) {
      console.error('Failed to add payment method:', error);
      setMessage('Failed to add payment method. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API}/users/payment-methods/${methodId}`);
      setMessage('Payment method removed successfully.');
      fetchBillingData();
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      setMessage('Failed to remove payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultPaymentMethod = async (methodId) => {
    setLoading(true);
    try {
      await axios.put(`${API}/users/payment-methods/${methodId}/default`);
      setMessage('Default payment method updated successfully.');
      fetchBillingData();
    } catch (error) {
      console.error('Failed to update default payment method:', error);
      setMessage('Failed to update default payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(`${API}/users/invoices/${invoiceId}/download`, {
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
      setMessage('Failed to download invoice. Please try again.');
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

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <CreditCard className="h-6 w-6 mr-3" />
            Billing & Payments
          </h1>
          <p className="text-green-100 mt-1">Manage your payment methods and billing information</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Subscription Info */}
          {subscription && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{subscription.plan_name}</h4>
                    <p className="text-gray-600 mt-1">{subscription.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Renews on {new Date(subscription.next_billing_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${subscription.amount}/{subscription.interval}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">${subscription.amount}</div>
                    <div className="text-sm text-gray-500">per {subscription.interval}</div>
                    <button className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium">
                      Change Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
              <button
                onClick={() => setShowAddCard(!showAddCard)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </button>
            </div>

            {/* Add Card Form */}
            {showAddCard && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <form onSubmit={addPaymentMethod} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        name="card_number"
                        value={cardForm.card_number}
                        onChange={handleCardInputChange}
                        placeholder="1234 5678 9012 3456"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name on Card *
                      </label>
                      <input
                        type="text"
                        name="name_on_card"
                        value={cardForm.name_on_card}
                        onChange={handleCardInputChange}
                        placeholder="John Doe"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Month *
                        </label>
                        <input
                          type="text"
                          name="expiry_month"
                          value={cardForm.expiry_month}
                          onChange={handleCardInputChange}
                          placeholder="12"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Year *
                        </label>
                        <input
                          type="text"
                          name="expiry_year"
                          value={cardForm.expiry_year}
                          onChange={handleCardInputChange}
                          placeholder="2025"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV *
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={cardForm.cvv}
                          onChange={handleCardInputChange}
                          placeholder="123"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddCard(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Card'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payment Methods List */}
            <div className="space-y-4">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a payment method to get started with premium features.
                  </p>
                </div>
              ) : (
                paymentMethods.map((method) => (
                  <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gray-100 p-2 rounded">
                          <CreditCard className="h-5 w-5 text-gray-600" />
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
                            Expires {method.expiry_month}/{method.expiry_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!method.is_default && (
                          <button
                            onClick={() => setDefaultPaymentMethod(method.id)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                          >
                            Make Default
                          </button>
                        )}
                        <button
                          onClick={() => removePaymentMethod(method.id)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 flex items-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Billing History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {billingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <History className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          No billing history available
                        </td>
                      </tr>
                    ) : (
                      billingHistory.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status === 'paid' && <Check className="h-3 w-3 mr-1" />}
                              {transaction.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {transaction.status === 'failed' && <X className="h-3 w-3 mr-1" />}
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {transaction.invoice_id && (
                              <button
                                onClick={() => downloadInvoice(transaction.invoice_id)}
                                className="text-blue-600 hover:text-blue-700 flex items-center"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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

          {/* Security Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Security Notice:</strong> All payment information is encrypted and securely processed. 
                  We never store your complete credit card numbers on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;