import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Lightbulb,
  BarChart3,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Zap,
  Eye,
  Activity,
  DollarSign,
  Users,
  Shield
} from 'lucide-react';
import { AuthContext } from '../../App';
import axios from 'axios';

const AICopilot = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAIStatus] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    timeRange: '24h'
  });

  useEffect(() => {
    if (user && user.role === 'ROLE_CEO') {
      initializeAICopilot();
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const initializeAICopilot = async () => {
    try {
      setLoading(true);
      
      // Fetch AI system status
      const statusResponse = await axios.get('/api/ceo/intelligence/status', {
        headers: getAuthHeaders()
      });
      setAIStatus(statusResponse.data.data);

      // Fetch dashboard summary
      const summaryResponse = await axios.get('/api/ceo/intelligence/dashboard-summary', {
        headers: getAuthHeaders()
      });
      setDashboardSummary(summaryResponse.data.data);

      // Fetch recommendations
      const recsResponse = await axios.get('/api/ceo/intelligence/recommendations?limit=10', {
        headers: getAuthHeaders()
      });
      setRecommendations(recsResponse.data.data.recommendations);

      // Fetch alerts
      const alertsResponse = await axios.get('/api/ceo/intelligence/alerts?limit=10', {
        headers: getAuthHeaders()
      });
      setAlerts(alertsResponse.data.data.alerts);

    } catch (error) {
      console.error('Failed to initialize AI Co-Pilot:', error);
    }
    setLoading(false);
  };

  const generateIntelligenceReport = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/ceo/intelligence/generate-report', {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end_date: new Date(),
        focus_areas: null // All categories
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        alert('Intelligence report generated successfully!');
        await initializeAICopilot(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to generate intelligence report:', error);
      alert('Failed to generate intelligence report');
    }
    setLoading(false);
  };

  const handleRecommendationAction = async (recommendationId, action) => {
    try {
      await axios.post(`/api/ceo/intelligence/recommendations/${recommendationId}/action`, {
        recommendation_id: recommendationId,
        action: action,
        notes: `Action taken: ${action}`
      }, {
        headers: getAuthHeaders()
      });

      // Update local state
      setRecommendations(prev => prev.map(rec => 
        rec.id === recommendationId 
          ? { ...rec, status: action, action_taken_at: new Date() }
          : rec
      ));

      alert(`Recommendation ${action}ed successfully!`);
    } catch (error) {
      console.error('Failed to take recommendation action:', error);
      alert('Failed to update recommendation');
    }
  };

  const searchInsights = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get('/api/ceo/intelligence/insights/search', {
        params: {
          query: searchQuery,
          category: filters.category || undefined,
          limit: 10
        },
        headers: getAuthHeaders()
      });
      setInsights(response.data.data.insights);
    } catch (error) {
      console.error('Failed to search insights:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-green-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const getStatusIcon = (status) => {
    const icons = {
      implement: <CheckCircle className="w-4 h-4 text-green-600" />,
      dismiss: <XCircle className="w-4 h-4 text-red-600" />,
      defer: <PauseCircle className="w-4 h-4 text-yellow-600" />
    };
    return icons[status] || <Clock className="w-4 h-4 text-gray-600" />;
  };

  if (loading && !dashboardSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Initializing AI Co-Pilot...</p>
          <p className="text-sm text-gray-600">Loading strategic intelligence systems</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Co-Pilot Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8" />
              AI Strategic Co-Pilot
            </h1>
            <p className="text-purple-100">
              Your intelligent partner for strategic decision-making and business growth
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="font-medium">AI Status</span>
            </div>
            <Badge className="bg-green-500 text-white">
              {aiStatus?.system_status || 'Operational'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Intelligence Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <span className="font-medium">Business Health</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {dashboardSummary?.intelligence_summary?.business_health_score || 85}%
            </div>
            <p className="text-sm text-blue-700 mt-1">Overall Score</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-8 h-8 text-orange-600" />
              <span className="font-medium">Critical Actions</span>
            </div>
            <div className="text-3xl font-bold text-orange-900">
              {dashboardSummary?.intelligence_summary?.critical_actions || 0}
            </div>
            <p className="text-sm text-orange-700 mt-1">Require Attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="w-8 h-8 text-green-600" />
              <span className="font-medium">Opportunities</span>
            </div>
            <div className="text-3xl font-bold text-green-900">
              {dashboardSummary?.intelligence_summary?.opportunities_identified || 0}
            </div>
            <p className="text-sm text-green-700 mt-1">Identified</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-8 h-8 text-red-600" />
              <span className="font-medium">Risk Monitoring</span>
            </div>
            <div className="text-3xl font-bold text-red-900">
              {dashboardSummary?.intelligence_summary?.risks_monitored || 0}
            </div>
            <p className="text-sm text-red-700 mt-1">Being Monitored</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Co-Pilot Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Intelligence Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={generateIntelligenceReport}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Intelligence Report
                  </Button>
                  
                  <Button variant="outline">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Predictive Analysis
                  </Button>
                  
                  <Button variant="outline">
                    <Search className="w-4 h-4 mr-2" />
                    Market Intelligence
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Latest AI Summary */}
            {dashboardSummary?.latest_report && (
              <Card>
                <CardHeader>
                  <CardTitle>Latest AI Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Analysis Date:</span>
                      <span>{new Date(dashboardSummary.latest_report.generated_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Business Health Score:</span>
                      <Badge className="bg-green-500 text-white">
                        {dashboardSummary.latest_report.executive_summary?.business_health_score || 85}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Insights Generated:</span>
                      <span>{Object.keys(dashboardSummary.latest_report.insights || {}).length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Recommendations:</span>
                      <span>{dashboardSummary.latest_report.recommendations?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                AI Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No recommendations available</p>
                  <p className="text-sm text-gray-500">Generate an intelligence report to get AI recommendations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.slice(0, 10).map((rec) => (
                    <div key={rec.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline">
                              {rec.category?.replace('_', ' ')}
                            </Badge>
                            {rec.status && getStatusIcon(rec.status)}
                          </div>
                          <h3 className="font-medium mb-1">{rec.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Timeline: {rec.timeline_weeks} weeks</span>
                            <span>Confidence: {Math.round((rec.confidence_score || 0.8) * 100)}%</span>
                          </div>
                        </div>
                        
                        {!rec.status && (
                          <div className="flex gap-2 ml-4">
                            <Button 
                              size="sm" 
                              onClick={() => handleRecommendationAction(rec.id, 'implement')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Implement
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRecommendationAction(rec.id, 'defer')}
                            >
                              Defer
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRecommendationAction(rec.id, 'dismiss')}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Real-Time AI Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-green-600 font-medium">All Clear</p>
                  <p className="text-sm text-gray-500">No critical alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 border-l-4 rounded-lg ${
                      alert.priority === 'high' 
                        ? 'border-red-500 bg-red-50' 
                        : alert.priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className={`w-4 h-4 ${
                              alert.priority === 'high' ? 'text-red-600' : 
                              alert.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                            <span className="font-medium">{alert.title}</span>
                            <Badge className={
                              alert.priority === 'high' ? 'bg-red-500' : 
                              alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }>
                              {alert.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        
                        {alert.requires_action && (
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-6">
            {/* Search Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Search Intelligence Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search for insights, trends, or analysis..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      onKeyDown={(e) => e.key === 'Enter' && searchInsights()}
                    />
                  </div>
                  <Button onClick={searchInsights}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{insight.category}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(insight.generated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium mb-2">{insight.insight.title}</h3>
                        <p className="text-sm text-gray-600">{insight.insight.summary}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Predictive Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 font-medium">Advanced Analytics Coming Soon</p>
                <p className="text-sm text-gray-500">Revenue forecasting, trend prediction, and growth modeling</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICopilot;