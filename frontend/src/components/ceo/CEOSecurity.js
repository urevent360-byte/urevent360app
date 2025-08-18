import React, { useState, useContext, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Shield, 
  Lock, 
  Key,
  Eye,
  AlertTriangle,
  CheckCircle,
  History,
  Settings,
  Smartphone,
  Fingerprint,
  Clock,
  MapPin,
  Monitor
} from 'lucide-react';
import { AuthContext } from '../../App';
import axios from 'axios';

const CEOSecurity = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchSecurityData = async () => {
    try {
      // Fetch succession status for security info
      const successionResponse = await axios.get('/api/ceo/succession/status', {
        headers: getAuthHeaders()
      });

      // Mock additional security data (in production, these would come from security endpoints)
      const mockData = {
        succession: successionResponse.data.data,
        sessions: [
          {
            id: '1',
            device: 'MacBook Pro',
            location: 'New York, NY',
            ip: '192.168.1.100',
            lastActive: '2 minutes ago',
            current: true
          },
          {
            id: '2',
            device: 'iPhone 14 Pro',
            location: 'New York, NY',
            ip: '192.168.1.101',
            lastActive: '1 hour ago',
            current: false
          }
        ],
        auditLogs: [
          {
            id: '1',
            action: 'CEO Dashboard Access',
            timestamp: new Date().toISOString(),
            ip: '192.168.1.100',
            status: 'success'
          },
          {
            id: '2',
            action: 'Security Center Access',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            ip: '192.168.1.100',
            status: 'success'
          },
          {
            id: '3',
            action: 'Succession Status Check',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            ip: '192.168.1.100',
            status: 'success'
          }
        ]
      };

      setSecurityStatus(mockData.succession);
      setSessions(mockData.sessions);
      setAuditLogs(mockData.auditLogs);
      
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    }
    setLoading(false);
  };

  const handleRevokeSession = async (sessionId) => {
    // Mock revoke session
    setSessions(sessions.filter(s => s.id !== sessionId));
    alert('Session revoked successfully');
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
      {/* Security Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">CEO Security Center</h1>
            <p className="text-red-100">Advanced security monitoring and access control</p>
          </div>
          <div className="p-3 bg-white/20 rounded-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Security Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">Account Security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">Fully Secured</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Key className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">WebAuthn Keys</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {securityStatus?.webauthn_credentials || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Monitor className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">Active Sessions</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {sessions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-medium">Security Alerts</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">TOTP Authenticator</span>
                </div>
                <Badge className="bg-green-500 text-white">Active</Badge>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Your account is protected with time-based one-time passwords (TOTP). 
                  This provides an additional layer of security for all CEO operations.
                </p>
              </div>
              
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Manage 2FA Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WebAuthn Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-blue-600" />
              WebAuthn Security Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Hardware Keys</span>
                </div>
                <Badge className="bg-blue-500 text-white">
                  {securityStatus?.webauthn_credentials || 0} Registered
                </Badge>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  WebAuthn provides the highest level of security using hardware keys, 
                  TouchID, FaceID, or Windows Hello for CEO succession operations.
                </p>
              </div>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Key className="h-4 w-4 mr-2" />
                Manage Security Keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-gray-600" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Monitor className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{session.device}</span>
                      {session.current && (
                        <Badge className="bg-green-500 text-white">Current</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.lastActive}
                      </div>
                      <span>IP: {session.ip}</span>
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            Security Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${
                    log.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}></div>
                  </div>
                  <div>
                    <span className="font-medium">{log.action}</span>
                    <div className="text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString()} • IP: {log.ip}
                    </div>
                  </div>
                </div>
                <Badge className={log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CEOSecurity;