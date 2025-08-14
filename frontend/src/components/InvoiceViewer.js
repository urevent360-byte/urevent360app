import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Printer, Mail, Calendar, MapPin, Phone, Globe, CreditCard, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InvoiceViewer = ({ eventId, invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [eventId, invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/events/${eventId}/invoices/${invoiceId}`);
      setInvoice(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load invoice');
      console.error('Invoice error:', err);
    } finally {
      setLoading(false);
    }
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
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(document.getElementById('invoice-content').outerHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'fully_paid': return 'text-green-800 bg-green-100';
      case 'partially_paid': return 'text-yellow-800 bg-yellow-100';
      case 'pending': return 'text-red-800 bg-red-100';
      case 'overdue': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Invoice</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-4 space-x-3">
              <button
                onClick={fetchInvoice}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const totalPaid = invoice.payments?.reduce((sum, payment) => 
    payment.status === 'completed' ? sum + payment.amount : sum, 0) || 0;
  const remainingBalance = invoice.total_amount - totalPaid;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-20">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="bg-white">
          {/* Invoice Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <img 
                  src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=120&h=40&fit=crop&crop=center" 
                  alt="Urevent 360" 
                  className="h-10 mb-4"
                />
                <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                <p className="text-sm text-gray-600">Invoice ID: {invoice.id}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Issue Date:</strong> {formatDate(invoice.created_at)}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Due Date:</strong> {formatDate(invoice.final_due_date)}
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                  {invoice.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Vendor and Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Vendor Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Provider</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-2">{invoice.vendor_details?.name}</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {invoice.vendor_details?.location}
                  </div>
                  {invoice.vendor_details?.contact_info?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {invoice.vendor_details.contact_info.phone}
                    </div>
                  )}
                  {invoice.vendor_details?.contact_info?.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {invoice.vendor_details.contact_info.email}
                    </div>
                  )}
                  {invoice.vendor_details?.contact_info?.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      {invoice.vendor_details.contact_info.website}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-2">Event Client</div>
                <div className="text-sm text-gray-600">
                  <div>Event ID: {invoice.event_id}</div>
                  <div>Service Type: {invoice.vendor_details?.service_type}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Items */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description || item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity || 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.rate || item.price || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount || item.total || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.vendor_details?.service_type} Service
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Payment Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Required Deposit:</span>
                  <span className="font-medium">{formatCurrency(invoice.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-medium">{formatCurrency(invoice.final_amount)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Outstanding Balance:</span>
                  <span className="font-medium text-red-600">{formatCurrency(remainingBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Progress:</span>
                  <span className="font-medium">
                    {invoice.total_amount > 0 ? ((totalPaid / invoice.total_amount) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${invoice.total_amount > 0 ? (totalPaid / invoice.total_amount) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
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
                    {invoice.payments
                      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                      .map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
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
            </div>
          )}

          {/* Terms and Conditions */}
          {invoice.terms && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>Thank you for choosing Urevent 360!</p>
              <p>For questions about this invoice, please contact the vendor directly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;