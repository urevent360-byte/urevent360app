import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Building, 
  UserCheck, 
  Truck, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_events: 0,
    pending_applications: 0,
    active_businesses: 0,
    total_vendors: 0,
    total_associates: 0,
    revenue_this_month: 0,
    commission_earned: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Use mock data for demo
      setStats({
        total_users: 1247,
        total_events: 856,
        pending_applications: 23,
        active_businesses: 147,
        total_vendors: 89,
        total_associates: 234,
        revenue_this_month: 125000,
        commission_earned: 18750
      });
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

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total_users,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Events',
      value: stats.total_events,
      icon: Calendar,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive' 
    },
    {
      title: 'Pending Applications',
      value: stats.pending_applications,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      change: '-3%',
      changeType: 'negative'
    },
    {
      title: 'Active Businesses',
      value: stats.active_businesses,
      icon: Building,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Registered Vendors',
      value: stats.total_vendors,
      icon: Truck,
      color: 'bg-indigo-500',
      change: '+7%',
      changeType: 'positive'
    },
    {
      title: 'Associates',
      value: stats.total_associates,
      icon: UserCheck,
      color: 'bg-pink-500',
      change: '+11%',
      changeType: 'positive'
    }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your Urevent 360 platform
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value.toLocaleString()}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Revenue This Month
            </h3>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.revenue_this_month)}
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>+18% from last month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Commission Earned
            </h3>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.commission_earned)}
                </div>
                <div className="flex items-center text-sm text-purple-600">
                  <span>15% of total revenue</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          New business application approved{' '}
                          <span className="font-medium text-gray-900">Elite Catering Services</span>
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        2 hours ago
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <Users className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          25 new users registered today
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        4 hours ago
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                        <Clock className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          3 business applications pending review
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        6 hours ago
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              
              <li>
                <div className="relative">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                        <Calendar className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          47 events created this week
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        1 day ago
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Review Applications</p>
                <p className="text-sm text-gray-500 truncate">{stats.pending_applications} pending</p>
              </div>
            </button>

            <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-500 truncate">View all users</p>
              </div>
            </button>

            <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <div className="flex-shrink-0">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Business Settings</p>
                <p className="text-sm text-gray-500 truncate">Configure commissions</p>
              </div>
            </button>

            <button className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-500 truncate">View detailed reports</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;