import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Clock,
  Zap,
  Download,
  RefreshCw
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';

const AIIntelligenceCenter = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (user && user.role === 'ROLE_CEO') {
      fetchSystemHealth();
      fetchReportHistory();
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get('/api/ceo/intelligence/health', {
        headers: getAuthHeaders()
      });
      setSystemHealth(response.data.data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const fetchReportHistory = async () => {
    try {
      const response = await axios.get('/api/ceo/intelligence/reports/history?limit=10', {
        headers: getAuthHeaders()
      });
      setReportHistory(response.data.data.reports);
    } catch (error) {
      console.error('Failed to fetch report history:', error);
    }
  };

  const generateComprehensiveReport = async () => {
    try {
      setGeneratingReport(true);
      
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      
      const response = await axios.post('/api/ceo/intelligence/generate-report', {
        start_date: startDate,
        end_date: endDate,
        focus_areas: null // All categories
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setCurrentReport(response.data.data.report);
        await fetchReportHistory(); // Refresh history
        alert('Comprehensive intelligence report generated successfully!');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate intelligence report');
    }
    setGeneratingReport(false);
  };

  const getHealthStatusColor = (status) => {
    const colors = {
      healthy: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      {/* Intelligence Center Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Brain className="w-8 h-8" />
              AI Intelligence Center
            </h1>
            <p className="text-indigo-100">
              Comprehensive business intelligence and strategic analysis powered by AI
            </p>
          </div>
          <div className="text-center">
            <Button 
              onClick={generateComprehensiveReport}
              disabled={generatingReport}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              {generatingReport ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-6 h-6 text-green-600" />
              <span className="font-medium">System Status</span>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              getHealthStatusColor(systemHealth?.overall_status)
            }`}>
              {systemHealth?.overall_status || 'Loading...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Uptime</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {systemHealth?.performance_metrics?.uptime_percentage || 99.8}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <span className="font-medium">Reports (7d)</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {systemHealth?.performance_metrics?.reports_generated_7days || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-6 h-6 text-orange-600" />
              <span className="font-medium">Avg Time</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {systemHealth?.performance_metrics?.average_processing_time_seconds || 15}s
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Models Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            AI Models Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth?.models_status && Object.entries(systemHealth.models_status).map(([model, status]) => (
              <div key={model} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">
                    {model.replace('_', ' ').replace(' model', '')}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'healthy' ? 'bg-green-500' : 
                    status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <Badge className={getHealthStatusColor(status)}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Report Display */}
      {currentReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Latest Intelligence Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Executive Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {currentReport.executive_summary?.business_health_score || 85}%
                    </div>
                    <div className="text-sm text-green-700">Business Health</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {currentReport.insights ? Object.keys(currentReport.insights).length : 0}
                    </div>
                    <div className="text-sm text-green-700">Insights Generated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {currentReport.recommendations?.length || 0}
                    </div>
                    <div className="text-sm text-green-700">Recommendations</div>
                  </div>
                </div>
                <div className="text-sm text-green-800">
                  {currentReport.executive_summary?.ai_summary?.substring(0, 300)}...
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h3 className="font-medium mb-4">Key Intelligence Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentReport.insights && Object.entries(currentReport.insights).map(([category, insight]) => (
                    <div key={category} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium capitalize">
                          {category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {insight.summary?.substring(0, 100)}...
                      </p>
                      <Badge className="bg-blue-100 text-blue-800">
                        {Math.round((insight.confidence_level || 0.85) * 100)}% Confidence
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Recommendations */}
              <div>
                <h3 className="font-medium mb-4">Priority Recommendations</h3>
                <div className="space-y-3">
                  {currentReport.recommendations?.slice(0, 5).map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
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
                          </div>
                          <h4 className="font-medium mb-1">{rec.title}</h4>
                          <p className="text-sm text-gray-600">
                            {rec.description?.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline">
                  <Target className="w-4 h-4 mr-2" />
                  View Full Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            Intelligence Report History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportHistory.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No intelligence reports generated yet</p>
              <p className="text-sm text-gray-500">Generate your first comprehensive report to start tracking intelligence insights</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportHistory.map((report) => (
                <div key={report.report_id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">
                        Intelligence Report
                      </span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {report.business_health_score}% Health
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(report.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Period:</span>
                      <div className="font-medium">
                        {report.period?.start ? new Date(report.period.start).toLocaleDateString() : 'N/A'} - 
                        {report.period?.end ? new Date(report.period.end).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Insights:</span>
                      <div className="font-medium">{report.insights_count}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Recommendations:</span>
                      <div className="font-medium">{report.recommendations_count}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Categories:</span>
                      <div className="font-medium">{report.categories_analyzed?.length || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIIntelligenceCenter;