import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  Award,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';

const CEOAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalytics({
        revenue: {
          current: 2850000,
          previous: 2520000,
          growth: 13.1
        },
        events: {
          total: 234,
          completed: 198,
          completion_rate: 84.6
        },
        customers: {
          total: 1247,
          new: 89,
          retention: 92.3
        },
        metrics: [
          { name: 'Gross Revenue', value: '$2.85M', change: '+13.1%', positive: true },
          { name: 'Net Profit', value: '$890K', change: '+18.2%', positive: true },
          { name: 'Event Bookings', value: '234', change: '+7.3%', positive: true },
          { name: 'Customer Satisfaction', value: '94.8%', change: '+2.1%', positive: true },
          { name: 'Vendor Performance', value: '91.2%', change: '-1.2%', positive: false },
          { name: 'Market Share', value: '12.4%', change: '+0.8%', positive: true }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Executive Analytics</h1>
            <p className="text-blue-100">Comprehensive business intelligence and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range ? 'bg-white text-blue-600' : 'text-white hover:bg-white/20'}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-200 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
              <Badge className="bg-green-500 text-white flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                +{analytics.revenue.growth}%
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-900">
                ${(analytics.revenue.current / 1000000).toFixed(2)}M
              </p>
              <p className="text-sm text-green-600 mt-1">
                vs ${(analytics.revenue.previous / 1000000).toFixed(2)}M last period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-700" />
              </div>
              <Badge className="bg-blue-500 text-white">
                {analytics.events.completion_rate}%
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Events Completed</p>
              <p className="text-3xl font-bold text-blue-900">
                {analytics.events.completed}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                of {analytics.events.total} total events
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-200 rounded-lg">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
              <Badge className="bg-purple-500 text-white">
                {analytics.customers.retention}%
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Customer Base</p>
              <p className="text-3xl font-bold text-purple-900">
                {analytics.customers.total.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                +{analytics.customers.new} new this period
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics.metrics.map((metric, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  <div className={`flex items-center gap-1 ${
                    metric.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.positive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{metric.change}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Key Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Revenue Target Exceeded</p>
                  <p className="text-sm text-green-700">113% of quarterly goal achieved</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Customer Satisfaction Peak</p>
                  <p className="text-sm text-blue-700">Highest rating in company history</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Market Share Growth</p>
                  <p className="text-sm text-purple-700">Expanded presence in key markets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Areas of Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                <p className="font-medium text-orange-900">Vendor Performance</p>
                <p className="text-sm text-orange-700 mt-1">
                  Slight decline in vendor reliability metrics. Consider performance reviews.
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <p className="font-medium text-yellow-900">Seasonal Preparation</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Peak wedding season approaching. Ensure capacity planning is complete.
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="font-medium text-blue-900">Technology Upgrade</p>
                <p className="text-sm text-blue-700 mt-1">
                  Consider platform enhancements to support growing user base.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              <strong>Q4 Performance:</strong> UREVENT 360 continues to demonstrate exceptional growth with a 13.1% 
              increase in revenue and maintaining industry-leading customer satisfaction scores of 94.8%. 
              The platform has successfully completed 198 events this quarter with an 84.6% completion rate.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Strategic Position:</strong> Market share has grown to 12.4%, representing a 0.8% increase 
              from the previous quarter. Customer retention remains strong at 92.3%, indicating solid brand loyalty 
              and service quality. The addition of 89 new customers demonstrates healthy acquisition rates.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Recommendations:</strong> Focus on vendor performance optimization and seasonal capacity 
              planning to maintain service excellence. Consider technology investments to support continued growth 
              and explore new market opportunities based on current success metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CEOAnalytics;