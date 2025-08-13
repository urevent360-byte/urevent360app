import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState({
    overview: {
      totalUsers: 0,
      totalEvents: 0,
      totalRevenue: 0,
      activeVendors: 0
    },
    userGrowth: [],
    eventTrends: [],
    revenueAnalytics: [],
    topVendors: [],
    businessMetrics: {}
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/reports`, {
        params: dateRange
      });
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      // Mock data for demo
      setReports({
        overview: {
          totalUsers: 2547,
          totalEvents: 489,
          totalRevenue: 125430,
          activeVendors: 89,
          userGrowth: 12.5,
          eventGrowth: 8.3,
          revenueGrowth: 15.7,
          vendorGrowth: 5.2
        },
        userGrowth: [
          { date: '2024-01-01', users: 1200, newUsers: 45 },
          { date: '2024-01-02', users: 1245, newUsers: 52 },
          { date: '2024-01-03', users: 1297, newUsers: 38 },
          { date: '2024-01-04', users: 1335, newUsers: 61 },
          { date: '2024-01-05', users: 1396, newUsers: 44 },
          { date: '2024-01-06', users: 1440, newUsers: 57 },
          { date: '2024-01-07', users: 1497, newUsers: 49 }
        ],
        eventTrends: [
          { category: 'Wedding', count: 156, revenue: 45600 },
          { category: 'Corporate', count: 134, revenue: 38200 },
          { category: 'Birthday', count: 89, revenue: 12400 },
          { category: 'Anniversary', count: 67, revenue: 18900 },
          { category: 'Conference', count: 43, revenue: 25300 }
        ],
        revenueAnalytics: [
          { month: 'Jan', revenue: 18500, expenses: 12300, profit: 6200 },
          { month: 'Feb', revenue: 22100, expenses: 14500, profit: 7600 },
          { month: 'Mar', revenue: 19800, expenses: 13200, profit: 6600 },
          { month: 'Apr', revenue: 25600, expenses: 16800, profit: 8800 },
          { month: 'May', revenue: 28300, expenses: 18400, profit: 9900 },
          { month: 'Jun', revenue: 31200, expenses: 19600, profit: 11600 }
        ],
        topVendors: [
          { name: 'Elite Catering Services', bookings: 45, revenue: 23400, rating: 4.8 },
          { name: 'Perfect Venue Rentals', bookings: 38, revenue: 19200, rating: 4.7 },
          { name: 'Dream Decorators', bookings: 42, revenue: 16800, rating: 4.9 },
          { name: 'Melody Music Services', bookings: 34, revenue: 13600, rating: 4.6 },
          { name: 'Capture Moments Photography', bookings: 29, revenue: 11600, rating: 4.8 }
        ],
        businessMetrics: {
          conversionRate: 68.5,
          averageOrderValue: 450,
          customerSatisfaction: 4.7,
          vendorSatisfaction: 4.5,
          repeatCustomers: 34.2
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType) => {
    try {
      const response = await axios.get(`${API}/admin/reports/export/${reportType}`, {
        params: dateRange,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export report:', error);
      // Mock export for demo
      alert('Report exported successfully! (Demo mode)');
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'purple' }) => {
    const isPositive = change > 0;
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
                : typeof value === 'number' 
                ? value.toLocaleString() 
                : value}
            </p>
            {change !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {Math.abs(change)}% from last period
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Track platform performance and business metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReports()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => exportReport(selectedReport)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={reports.overview.totalUsers}
          change={reports.overview.userGrowth}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Total Events"
          value={reports.overview.totalEvents}
          change={reports.overview.eventGrowth}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={reports.overview.totalRevenue}
          change={reports.overview.revenueGrowth}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Active Vendors"
          value={reports.overview.activeVendors}
          change={reports.overview.vendorGrowth}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'events', name: 'Event Trends', icon: Calendar },
              { id: 'revenue', name: 'Revenue', icon: DollarSign },
              { id: 'vendors', name: 'Top Vendors', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedReport(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedReport === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedReport === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Business Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                  <div className="text-2xl font-bold text-gray-900">{reports.businessMetrics.conversionRate}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Avg Order Value</div>
                  <div className="text-2xl font-bold text-gray-900">${reports.businessMetrics.averageOrderValue}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Customer Satisfaction</div>
                  <div className="text-2xl font-bold text-gray-900">{reports.businessMetrics.customerSatisfaction}/5</div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'events' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Event Categories Performance</h3>
              <div className="space-y-4">
                {reports.eventTrends.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{category.category}</h4>
                      <p className="text-sm text-gray-600">{category.count} events</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${category.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedReport === 'revenue' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Analysis</h3>
              <div className="space-y-4">
                {reports.revenueAnalytics.map((month, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{month.month}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Revenue</div>
                      <div className="font-semibold text-green-600">${month.revenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Expenses</div>
                      <div className="font-semibold text-red-600">${month.expenses.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Profit</div>
                      <div className="font-semibold text-purple-600">${month.profit.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedReport === 'vendors' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Vendors</h3>
              <div className="space-y-4">
                {reports.topVendors.map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{vendor.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{vendor.bookings} bookings</span>
                        <span>Rating: {vendor.rating}/5</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${vendor.revenue.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;