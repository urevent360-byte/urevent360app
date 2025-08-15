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
    </div>
  );
};

export default Dashboard;