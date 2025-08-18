import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  BarChart3,
  Lock,
  Brain,
  Zap,
  Target,
  Lightbulb
} from 'lucide-react';
import { AuthContext } from '../../App';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CEODashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [aiSummary, setAISummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetchCEOStats();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCEOStats = async () => {
    try {
      // Fetch succession status
      const successionResponse = await axios.get('/api/ceo/succession/status', {
        headers: getAuthHeaders()
      });
      
      // Fetch AI dashboard summary
      try {
        const aiResponse = await axios.get('/api/ceo/intelligence/dashboard-summary', {
          headers: getAuthHeaders()
        });
        setAISummary(aiResponse.data.data);
        setRecommendations(aiResponse.data.data.top_recommendations?.slice(0, 3) || []);
      } catch (aiError) {
        console.log('AI Intelligence not available:', aiError);
      }
      
      // Mock additional CEO metrics (in production, these would come from CEO analytics endpoints)
      const mockStats = {
        succession: successionResponse.data.data,
        business: {
          totalRevenue: 2850000,
          monthlyGrowth: 12.5,
          activeEvents: 89,
          customerSatisfaction: 94.8
        }
      };
      
      setStats(mockStats);
      
      // Set alerts based on succession readiness and AI insights
      const newAlerts = [];
      if (!mockStats.succession.succession_ready) {
        newAlerts.push({
          type: 'warning',
          title: 'Security Setup Required',
          message: 'Complete WebAuthn and 2FA setup for CEO succession capabilities.'
        });
      }
      
      if (mockStats.succession.active_handovers > 0) {
        newAlerts.push({
          type: 'info',
          title: 'Active Handover',
          message: `${mockStats.succession.active_handovers} CEO handover(s) in progress.`
        });
      }

      // Add AI-generated alerts
      if (aiSummary?.real_time_alerts?.length > 0) {
        aiSummary.real_time_alerts.slice(0, 2).forEach(alert => {
          newAlerts.push({
            type: 'ai',
            title: alert.title,
            message: alert.message
          });
        });
      }
      
      setAlerts(newAlerts);
      
    } catch (error) {
      console.error('Failed to fetch CEO stats:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-blue-100">Your executive dashboard is ready. Here's what needs your attention today.</p>
          </div>
          <div className="p-3 bg-white/20 rounded-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'warning' 
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800' 
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-medium">{alert.title}</h3>
              </div>
              <p className="mt-1 text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Executive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  ${stats?.business.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Monthly Growth</p>
                <p className="text-2xl font-bold text-blue-900">
                  +{stats?.business.monthlyGrowth}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Active Events</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats?.business.activeEvents}
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Satisfaction</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats?.business.customerSatisfaction}%
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CEO Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Intelligence Co-Pilot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {aiSummary ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-medium">AI System Status</span>
                  </div>
                </div>
                <Badge className={aiSummary ? 'bg-green-500' : 'bg-yellow-500'}>
                  {aiSummary ? 'Active' : 'Initializing'}
                </Badge>
              </div>

              {aiSummary && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">
                      {aiSummary.intelligence_summary?.business_health_score || 85}%
                    </div>
                    <div className="text-sm text-blue-700">Business Health</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900">
                      {aiSummary.intelligence_summary?.critical_actions || 0}
                    </div>
                    <div className="text-sm text-orange-700">Critical Actions</div>
                  </div>
                </div>
              )}

              <Link to="/ceo/ai-copilot">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Brain className="h-4 w-4 mr-2" />
                  Open AI Co-Pilot
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Succession Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Succession Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {stats?.succession.succession_ready ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-medium">Security Status</span>
                  </div>
                </div>
                <Badge 
                  className={stats?.succession.succession_ready ? 'bg-green-500' : 'bg-yellow-500'}
                >
                  {stats?.succession.succession_ready ? 'Ready' : 'Setup Required'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">
                    {stats?.succession.webauthn_credentials || 0}
                  </div>
                  <div className="text-sm text-blue-700">WebAuthn Keys</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-900">
                    {stats?.succession.emergency_trustees || 0}
                  </div>
                  <div className="text-sm text-purple-700">Trustees</div>
                </div>
              </div>

              <Link to="/ceo/succession">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Succession
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Executive Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/ceo/intelligence">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Intelligence Center
                </Button>
              </Link>
              
              <Link to="/ceo/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Executive Analytics
                </Button>
              </Link>
              
              <Link to="/ceo/security">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Security Center
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations Section */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              AI Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          rec.priority === 'high' ? 'bg-red-500 text-white' :
                          rec.priority === 'medium' ? 'bg-yellow-500 text-black' :
                          'bg-green-500 text-white'
                        }>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline">
                          {rec.category?.replace('_', ' ')}
                        </Badge>
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                      </div>
                      <h3 className="font-medium mb-1">{rec.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {rec.description?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Timeline: {rec.timeline_weeks} weeks</span>
                        <span>Confidence: {Math.round((rec.confidence_score || 0.8) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <Link to="/ceo/ai-copilot?tab=recommendations">
                <Button variant="outline" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  View All Recommendations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executive Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">CEO succession system activated</p>
                <p className="text-sm text-gray-600">Security infrastructure initialized</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Today</Badge>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Quarterly revenue report generated</p>
                <p className="text-sm text-gray-600">Growth targets exceeded by 12.5%</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Yesterday</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CEODashboard;