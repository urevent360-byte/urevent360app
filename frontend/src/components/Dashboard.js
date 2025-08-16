import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Users, DollarSign, Clock, Plus, TrendingUp, Trash2, AlertTriangle, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalBudget: 0,
    activeBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const eventsResponse = await axios.get(`${API}/events`);
      const events = eventsResponse.data;
      setEvents(events);

      // Separate recent and past events
      const now = new Date();
      const upcoming = events.filter(event => new Date(event.date) >= now);
      const past = events.filter(event => new Date(event.date) < now);
      
      setRecentEvents(upcoming.slice(0, 5)); // Show 5 most recent upcoming events
      setPastEvents(past.sort((a, b) => new Date(b.date) - new Date(a.date))); // Sort past events by date desc

      // Calculate stats
      const totalBudget = events.reduce((sum, event) => sum + (event.budget || 0), 0);

      setStats({
        totalEvents: events.length,
        upcomingEvents: upcoming.length,
        totalBudget: totalBudget,
        activeBookings: events.filter(event => event.status === 'planning').length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    
    setDeleting(true);
    try {
      await axios.delete(`${API}/events/${eventToDelete.id}`);
      
      // Refresh dashboard data after successful deletion
      await fetchDashboardData();
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const getEventStatus = (event) => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Completed', color: 'bg-gray-100 text-gray-800' };
    if (diffDays === 0) return { text: 'Today', color: 'bg-red-100 text-red-800' };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'bg-yellow-100 text-yellow-800' };
    return { text: `${diffDays} days left`, color: 'bg-green-100 text-green-800' };
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your events.
          </p>
        </div>
        <Link
          to="/events/create"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalEvents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.upcomingEvents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Budget</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalBudget)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Planning</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Events</h3>
            <Link
              to="/events"
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              View all
            </Link>
          </div>
          
          {recentEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
              <div className="mt-6">
                <Link
                  to="/events/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {recentEvents.map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <li key={event.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {event.name}
                              </p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                {status.text}
                              </span>
                            </div>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="truncate">{event.location || 'Location TBD'}</span>
                              <span className="mx-2">•</span>
                              <span>{formatDate(event.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {event.budget && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(event.budget)}</p>
                              <p className="text-sm text-gray-500">Budget</p>
                            </div>
                          )}
                          <Link
                            to={`/events/${event.id}/planning`}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            Manage
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(event)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Interactive Event Planner - Prominent Call-to-Action */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 shadow-xl rounded-xl overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Interactive Event Planner</h3>
                  <p className="text-purple-200 text-sm">Your Complete Event Planning Solution</p>
                </div>
              </div>
              
              <p className="text-white text-base mb-6 max-w-2xl">
                🎯 <strong>Plan your entire event step-by-step</strong> with our intelligent planner. Get personalized recommendations, 
                manage budgets, book vendors, and handle all event details in one seamless experience.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-white">
                  <div className="h-2 w-2 rounded-full bg-white bg-opacity-80"></div>
                  <span className="text-sm">10-Step Guided Process</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <div className="h-2 w-2 rounded-full bg-white bg-opacity-80"></div>
                  <span className="text-sm">Cultural Intelligence</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <div className="h-2 w-2 rounded-full bg-white bg-opacity-80"></div>
                  <span className="text-sm">Budget Management</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <div className="h-2 w-2 rounded-full bg-white bg-opacity-80"></div>
                  <span className="text-sm">Venue & Vendor Matching</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <div className="h-2 w-2 rounded-full bg-white bg-opacity-80"></div>
                  <span className="text-sm">Real-time Collaboration</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <div className="h-2 w-2 rounded-full bg-white bg-opacity-80"></div>
                  <span className="text-sm">Booking Management</span>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white bg-opacity-10 animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-white bg-opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="relative h-24 w-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <TrendingUp className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <p className="text-sm opacity-90">Start planning in</p>
                <p className="text-2xl font-bold">Less than 2 minutes</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link
                to="/events/create"
                className="inline-flex items-center px-4 py-2 border border-white border-opacity-30 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200 text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Link>
              
              <Link
                to="/interactive-planner"
                className="inline-flex items-center px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Start Planning Now
                <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Popular</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom accent bar */}
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500"></div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/venues"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Find Venues</p>
                <p className="text-sm text-gray-500 truncate">Browse available venues</p>
              </div>
            </Link>

            <Link
              to="/vendors"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Find Vendors</p>
                <p className="text-sm text-gray-500 truncate">Discover service providers</p>
              </div>
            </Link>

            <Link
              to="/loans"
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Get Financing</p>
                <p className="text-sm text-gray-500 truncate">Explore loan options</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Event History</h3>
              <span className="text-sm text-gray-500">{pastEvents.length} completed events</span>
            </div>
            
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {pastEvents.slice(0, 10).map((event) => (
                  <li key={event.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{event.name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="truncate">{event.location || 'Location not specified'}</span>
                            <span className="mx-2">•</span>
                            <span>{formatDate(event.date)}</span>
                            {event.budget && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{formatCurrency(event.budget)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Completed
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {pastEvents.length > 10 && (
                <div className="mt-3 text-center">
                  <button className="text-sm text-purple-600 hover:text-purple-500">
                    View all {pastEvents.length} past events
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Event</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{eventToDelete?.name}"? This action cannot be undone.
                  All associated data including vendor bookings, payments, and planning information will be permanently deleted.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;