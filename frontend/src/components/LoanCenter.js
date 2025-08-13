import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Calendar, Percent, Clock, CheckCircle, AlertCircle, Plus, Calculator } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoanCenter = () => {
  const [loans, setLoans] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanData, setLoanData] = useState({
    event_id: '',
    loan_amount: '',
    loan_provider: '',
    interest_rate: '',
    tenure_months: '12'
  });

  const loanProviders = [
    { name: 'QuickLoan Finance', rate: 8.5, maxAmount: 50000, description: 'Fast approval for event financing' },
    { name: 'EventFund Pro', rate: 7.2, maxAmount: 100000, description: 'Specialized event loans with flexible terms' },
    { name: 'CelebrateCash', rate: 9.1, maxAmount: 25000, description: 'Quick cash for celebrations' },
    { name: 'DreamEvent Loans', rate: 6.8, maxAmount: 75000, description: 'Low interest rates for dream events' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const eventsResponse = await axios.get(`${API}/events`);
      setEvents(eventsResponse.data);
      
      // Generate sample loans for demo
      setLoans(generateSampleLoans(eventsResponse.data));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoans(generateSampleLoans([]));
    } finally {
      setLoading(false);
    }
  };

  const generateSampleLoans = (events) => [
    {
      id: '1',
      user_id: '1',
      event_id: events[0]?.id || 'event_1',
      loan_amount: 15000,
      loan_provider: 'EventFund Pro',
      interest_rate: 7.2,
      tenure_months: 24,
      status: 'approved',
      application_date: new Date(Date.now() - 604800000).toISOString() // 7 days ago
    },
    {
      id: '2',
      user_id: '1',
      event_id: events[1]?.id || 'event_2',
      loan_amount: 8000,
      loan_provider: 'QuickLoan Finance',
      interest_rate: 8.5,
      tenure_months: 12,
      status: 'pending',
      application_date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ];

  const handleInputChange = (e) => {
    setLoanData({ ...loanData, [e.target.name]: e.target.value });
  };

  const handleProviderSelect = (provider) => {
    setLoanData({
      ...loanData,
      loan_provider: provider.name,
      interest_rate: provider.rate.toString()
    });
  };

  const calculateMonthlyPayment = (amount, rate, months) => {
    const monthlyRate = rate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1);
    return isNaN(payment) ? 0 : payment;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/loans`, {
        ...loanData,
        loan_amount: parseFloat(loanData.loan_amount),
        interest_rate: parseFloat(loanData.interest_rate),
        tenure_months: parseInt(loanData.tenure_months)
      });
      setLoans([response.data, ...loans]);
      setShowLoanForm(false);
      setLoanData({
        event_id: '',
        loan_amount: '',
        loan_provider: '',
        interest_rate: '',
        tenure_months: '12'
      });
    } catch (error) {
      console.error('Failed to apply for loan:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disbursed':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalLoaned = loans.filter(l => l.status === 'disbursed').reduce((sum, l) => sum + l.loan_amount, 0);
  const totalApproved = loans.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.loan_amount, 0);
  const monthlyPayment = loanData.loan_amount && loanData.interest_rate && loanData.tenure_months
    ? calculateMonthlyPayment(
        parseFloat(loanData.loan_amount),
        parseFloat(loanData.interest_rate),
        parseInt(loanData.tenure_months)
      )
    : 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Loan Center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Finance your dream event with flexible loan options
          </p>
        </div>
        <button
          onClick={() => setShowLoanForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Apply for Loan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Disbursed</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalLoaned)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved Amount</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalApproved)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Percent className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Interest Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loans.length > 0 
                      ? (loans.reduce((sum, l) => sum + l.interest_rate, 0) / loans.length).toFixed(1) + '%'
                      : '0%'
                    }
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
                <Calendar className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Loans</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Providers */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Available Loan Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loanProviders.map((provider, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{provider.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{provider.description}</p>
                    <div className="mt-3 flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-600">{provider.rate}% APR</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-600">Up to {formatCurrency(provider.maxAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleProviderSelect(provider);
                      setShowLoanForm(true);
                    }}
                    className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loan Application Form Modal */}
      {showLoanForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowLoanForm(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Apply for Event Loan
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Event</label>
                          <select
                            name="event_id"
                            value={loanData.event_id}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">Select an event</option>
                            {events.map(event => (
                              <option key={event.id} value={event.id}>{event.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              name="loan_amount"
                              value={loanData.loan_amount}
                              onChange={handleInputChange}
                              min="1000"
                              max="100000"
                              step="100"
                              required
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                              placeholder="10000"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Loan Provider</label>
                          <select
                            name="loan_provider"
                            value={loanData.loan_provider}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">Select a provider</option>
                            {loanProviders.map(provider => (
                              <option key={provider.name} value={provider.name}>
                                {provider.name} - {provider.rate}% APR
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <input
                                type="number"
                                name="interest_rate"
                                value={loanData.interest_rate}
                                onChange={handleInputChange}
                                step="0.1"
                                min="0"
                                max="30"
                                required
                                className="block w-full pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                placeholder="7.5"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Percent className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tenure (Months)</label>
                            <select
                              name="tenure_months"
                              value={loanData.tenure_months}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="6">6 months</option>
                              <option value="12">12 months</option>
                              <option value="18">18 months</option>
                              <option value="24">24 months</option>
                              <option value="36">36 months</option>
                            </select>
                          </div>
                        </div>

                        {monthlyPayment > 0 && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center">
                              <Calculator className="h-5 w-5 text-purple-600 mr-2" />
                              <span className="text-sm font-medium text-purple-900">
                                Estimated Monthly Payment: {formatCurrency(monthlyPayment)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Submit Application
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLoanForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loan Applications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Loan Applications</h3>
          
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No loan applications</h3>
              <p className="mt-1 text-sm text-gray-500">Apply for your first event loan to get started.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {loans.map((loan) => {
                  const event = events.find(e => e.id === loan.event_id);
                  const monthlyPayment = calculateMonthlyPayment(loan.loan_amount, loan.interest_rate, loan.tenure_months);
                  
                  return (
                    <li key={loan.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-4">
                            {getStatusIcon(loan.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {loan.loan_provider}
                              </p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                {loan.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <span>{formatCurrency(loan.loan_amount)} at {loan.interest_rate}% APR</span>
                              <span className="mx-2">•</span>
                              <span>{loan.tenure_months} months</span>
                              {event && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{event.name}</span>
                                </>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              Applied on {formatDate(loan.application_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(monthlyPayment)}</p>
                            <p className="text-xs text-gray-500">Monthly Payment</p>
                          </div>
                          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanCenter;