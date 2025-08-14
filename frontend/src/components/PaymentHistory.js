import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Filter, Calendar, DollarSign, Search, CreditCard, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentHistory = ({ eventId }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    paymentType: 'all',
    paymentMethod: 'all',
    status: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/events/${eventId}/payment-history`);
      setPayments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load payment history');
      console.error('Payment history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(payment => 
        payment.vendor_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        payment.transaction_id?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Payment type filter
    if (filters.paymentType !== 'all') {
      filtered = filtered.filter(payment => payment.payment_type === filters.paymentType);
    }

    // Payment method filter
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method === filters.paymentMethod);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(payment => 
          new Date(payment.payment_date) >= filterDate
        );
      }
    }

    setFilteredPayments(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-800 bg-green-100';
      case 'pending': return 'text-yellow-800 bg-yellow-100';
      case 'failed': return 'text-red-800 bg-red-100';
      case 'refunded': return 'text-gray-800 bg-gray-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'deposit': return 'text-blue-800 bg-blue-100';
      case 'partial': return 'text-purple-800 bg-purple-100';
      case 'final': return 'text-green-800 bg-green-100';
      case 'extra': return 'text-indigo-800 bg-indigo-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Service', 'Amount', 'Type', 'Method', 'Status', 'Transaction ID', 'Description'];
    const csvData = filteredPayments.map(payment => [
      formatDate(payment.payment_date),
      payment.vendor_name,
      payment.service_type,
      payment.amount,
      payment.payment_type,
      payment.payment_method,
      payment.status,
      payment.transaction_id || '',
      payment.description || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-history-${eventId}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = filteredPayments.filter(p => p.status === 'completed');
  const completedAmount = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <CreditCard className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Payment History</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchPaymentHistory}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Payments</div>
              <div className="text-2xl font-bold text-blue-600">{filteredPayments.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Amount</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Completed</div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(completedAmount)}</div>
              <div className="text-sm text-gray-400">{completedPayments.length} payments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search payments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Payment Type Filter */}
            <select
              value={filters.paymentType}
              onChange={(e) => handleFilterChange('paymentType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="partial">Partial</option>
              <option value="final">Final</option>
              <option value="extra">Extra</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
          <p className="text-sm text-gray-500">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
        </div>
        
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {payments.length === 0 ? "No payments have been made yet." : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(payment.payment_date)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.vendor_name}</div>
                        <div className="text-sm text-gray-500">{payment.service_type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.description && (
                        <div className="text-sm text-gray-500">{payment.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentTypeColor(payment.payment_type)}`}>
                        {payment.payment_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.payment_method.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {payment.transaction_id || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;