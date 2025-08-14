import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Users, DollarSign, CheckCircle, Clock, MessageCircle, Plus } from 'lucide-react';
import BudgetTracker from './BudgetTracker';
import PaymentHistory from './PaymentHistory';
import InvoiceViewer from './InvoiceViewer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventPlanning = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showInvoiceViewer, setShowInvoiceViewer] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const [eventResponse, bookingsResponse] = await Promise.all([
        axios.get(`${API}/events/${eventId}`),
        axios.get(`${API}/bookings/event/${eventId}`)
      ]);
      
      setEvent(eventResponse.data);
      setBookings(bookingsResponse.data);
    } catch (error) {
      console.error('Failed to fetch event data:', error);
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBookingStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Calendar },
    { id: 'bookings', name: 'Bookings', icon: CheckCircle },
    { id: 'timeline', name: 'Timeline', icon: Clock },
    { id: 'budget', name: 'Budget Tracker', icon: DollarSign },
    { id: 'payments', name: 'Payment History', icon: DollarSign },
    { id: 'messages', name: 'Messages', icon: MessageCircle }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Event not found</h3>
        <p className="mt-1 text-sm text-gray-500">The requested event could not be found.</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Event Name</label>
                  <p className="mt-1 text-sm text-gray-900">{event.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Event Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{event.event_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Date & Time</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(event.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{event.location || 'TBD'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Guest Count</label>
                  <p className="mt-1 text-sm text-gray-900">{event.guest_count || 'TBD'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getBookingStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </div>
              {event.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{event.description}</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Confirmed Bookings</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {bookings.filter(b => b.status === 'confirmed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Budget</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {event.budget ? formatCurrency(event.budget) : 'TBD'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Days Until Event</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Service Bookings</h3>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start by adding services for your event.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <li key={booking.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {booking.service_type}
                              </p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <span>Service Date: {formatDate(booking.service_date)}</span>
                            </div>
                            {booking.notes && (
                              <p className="mt-1 text-sm text-gray-500">{booking.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(booking.price)}</p>
                            <p className="text-sm text-gray-500">Total Cost</p>
                          </div>
                          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Edit
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Event Timeline</h3>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                            <Calendar className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">Event created</p>
                            <p className="text-sm font-medium text-gray-900">{event.name}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {formatDate(event.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  
                  {bookings.map((booking, index) => (
                    <li key={booking.id}>
                      <div className={`relative ${index < bookings.length - 1 ? 'pb-8' : ''}`}>
                        {index < bookings.length - 1 && (
                          <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white ${
                              booking.status === 'confirmed' ? 'bg-green-500' : 
                              booking.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}>
                              <CheckCircle className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">{booking.service_type} booking</p>
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(booking.price)}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(booking.booking_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 'budget':
        return <BudgetTracker eventId={eventId} />;

      case 'payments':
        return <PaymentHistory eventId={eventId} />;

      case 'messages':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Messages & Communications</h3>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Communications with vendors will appear here.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(event.date)} • {event.location || 'Location TBD'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Edit Event
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            Share Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center
                  ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default EventPlanning;