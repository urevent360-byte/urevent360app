import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../App';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VendorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      completedEvents: 0
    },
    recentBookings: [],
    upcomingEvents: [],
    reviews: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real implementation, this would fetch vendor-specific data
      // For now, using mock data
      setDashboardData({
        stats: {
          totalBookings: 24,
          pendingBookings: 3,
          totalRevenue: 15750,
          averageRating: 4.8,
          completedEvents: 21
        },
        recentBookings: [
          {
            id: '1',
            eventName: 'Sarah & John Wedding',
            clientName: 'Sarah Johnson',
            serviceDate: '2024-02-15',
            status: 'confirmed',
            amount: 2500
          },
          {
            id: '2',
            eventName: 'Corporate Annual Gala',
            clientName: 'TechCorp Inc.',
            serviceDate: '2024-02-20',
            status: 'pending',
            amount: 3200
          },
          {
            id: '3',
            eventName: 'Birthday Celebration',
            clientName: 'Mike Wilson',
            serviceDate: '2024-02-25',
            status: 'completed',
            amount: 800
          }
        ],
        upcomingEvents: [
          {
            id: '1',
            eventName: 'Sarah & John Wedding',
            date: '2024-02-15',
            time: '6:00 PM',
            location: 'Grand Ballroom Hotel'
          },
          {
            id: '2',
            eventName: 'Corporate Annual Gala',
            date: '2024-02-20',
            time: '7:00 PM',
            location: 'Convention Center'
          }
        ],
        reviews: [
          {
            id: '1',
            clientName: 'Emily Davis',
            rating: 5,
            comment: 'Exceptional service! Everything was perfect.',
            eventName: 'Anniversary Party',
            date: '2024-01-28'
          },
          {
            id: '2',
            clientName: 'Robert Brown',
            rating: 4,
            comment: 'Great work, very professional team.',
            eventName: 'Corporate Event',
            date: '2024-01-25'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'purple' }) => {
    const colorClasses = {
      purple: 'from-purple-500 to-purple-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600'
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {typeof value === 'number' && title.includes('Revenue') 
                ? `$${value.toLocaleString()}` 
                : typeof value === 'number' && title.includes('Rating')
                ? `${value}/5`
                : typeof value === 'number' 
                ? value.toLocaleString() 
                : value}
            </p>
            {change && (
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{change}% from last month
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active Vendor
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={dashboardData.stats.totalBookings}
          change={15}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Pending Bookings"
          value={dashboardData.stats.pendingBookings}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Total Revenue"
          value={dashboardData.stats.totalRevenue}
          change={22}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Average Rating"
          value={dashboardData.stats.averageRating}
          icon={Star}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{booking.eventName}</h3>
                    <p className="text-sm text-gray-600">Client: {booking.clientName}</p>
                    <p className="text-sm text-gray-600">Date: {new Date(booking.serviceDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${booking.amount.toLocaleString()}</div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
              View All Bookings
            </button>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.upcomingEvents.map(event => (
                <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{event.eventName}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
              View Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboardData.reviews.map(review => (
              <div key={review.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={`https://ui-avatars.com/api/?name=${review.clientName}&background=7c3aed&color=fff`}
                  alt={review.clientName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">{review.clientName}</h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                  <div className="text-xs text-gray-500">
                    {review.eventName} • {new Date(review.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
            View All Reviews
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage Calendar</h3>
              <p className="text-sm text-gray-600">Update availability</p>
            </div>
          </div>
        </button>

        <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Update Pricing</h3>
              <p className="text-sm text-gray-600">Manage service rates</p>
            </div>
          </div>
        </button>

        <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600">Business insights</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default VendorDashboard;