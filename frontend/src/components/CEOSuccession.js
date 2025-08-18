import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  Key, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  UserCheck,
  Lock,
  History,
  Users
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const CEOSuccession = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [mfaSession, setMfaSession] = useState(null);
  const [step, setStep] = useState('overview');
  
  // Form states
  const [handoverForm, setHandoverForm] = useState({
    next_ceo_id: '',
    effective_delay_hours: 24,
    reason: ''
  });
  
  const [totpCode, setTotpCode] = useState('');
  const [users, setUsers] = useState([]);
  const [handoverHistory, setHandoverHistory] = useState([]);
  const [trustees, setTrustees] = useState([]);

  useEffect(() => {
    if (user && user.role === 'ROLE_CEO') {
      fetchSuccessionStatus();
      fetchUsers();
      fetchHandoverHistory();
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchSuccessionStatus = async () => {
    try {
      const response = await axios.get('/api/ceo/succession/status', {
        headers: getAuthHeaders()
      });
      setStatus(response.data.data);
    } catch (error) {
      console.error('Failed to fetch succession status:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch all users who could potentially be CEO
      const response = await axios.get('/api/users', {
        headers: getAuthHeaders()
      });
      setUsers(response.data.filter(u => u.id !== user.id && u.role === 'ROLE_ADMIN'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchHandoverHistory = async () => {
    try {
      const response = await axios.get('/api/ceo/succession/history', {
        headers: getAuthHeaders()
      });
      setHandoverHistory(response.data.data.handover_transactions);
    } catch (error) {
      console.error('Failed to fetch handover history:', error);
    }
  };

  // WebAuthn Registration
  const registerWebAuthn = async () => {
    setLoading(true);
    try {
      // Step 1: Begin registration
      const beginResponse = await axios.post('/api/ceo/succession/webauthn/register/begin', {
        device_name: `${navigator.userAgent.includes('Mac') ? 'Mac' : 'PC'} - ${new Date().toLocaleDateString()}`
      }, { headers: getAuthHeaders() });

      const options = beginResponse.data.options;

      // Step 2: Create credential using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: new Uint8Array(Object.values(options.challenge)),
          user: {
            ...options.user,
            id: new Uint8Array(Object.values(options.user.id))
          },
          excludeCredentials: options.excludeCredentials?.map(cred => ({
            ...cred,
            id: new Uint8Array(Object.values(cred.id))
          }))
        }
      });

      // Step 3: Complete registration
      await axios.post('/api/ceo/succession/webauthn/register/complete', {
        credential: {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
          },
          type: credential.type
        }
      }, { headers: getAuthHeaders() });

      alert('WebAuthn credential registered successfully!');
      fetchSuccessionStatus();
    } catch (error) {
      console.error('WebAuthn registration failed:', error);
      alert('WebAuthn registration failed. Please try again.');
    }
    setLoading(false);
  };

  // MFA Authentication Flow
  const authenticateWebAuthn = async () => {
    setLoading(true);
    try {
      // Step 1: Begin authentication
      const beginResponse = await axios.post('/api/ceo/succession/webauthn/authenticate/begin', {}, {
        headers: getAuthHeaders()
      });

      const options = beginResponse.data.options;

      // Step 2: Get assertion using WebAuthn API
      const assertion = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: new Uint8Array(Object.values(options.challenge)),
          allowCredentials: options.allowCredentials?.map(cred => ({
            ...cred,
            id: new Uint8Array(Object.values(cred.id))
          }))
        }
      });

      // Step 3: Complete authentication
      const completeResponse = await axios.post('/api/ceo/succession/webauthn/authenticate/complete', {
        credential: {
          id: assertion.id,
          rawId: Array.from(new Uint8Array(assertion.rawId)),
          response: {
            authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
            clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
            signature: Array.from(new Uint8Array(assertion.response.signature)),
            userHandle: assertion.response.userHandle ? Array.from(new Uint8Array(assertion.response.userHandle)) : null
          },
          type: assertion.type
        }
      }, { headers: getAuthHeaders() });

      setMfaSession(completeResponse.data);
      setStep('totp-verification');
    } catch (error) {
      console.error('WebAuthn authentication failed:', error);
      alert('WebAuthn authentication failed. Please try again.');
    }
    setLoading(false);
  };

  const verifyTOTP = async () => {
    if (!mfaSession || !totpCode) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/ceo/succession/mfa/verify-totp', {
        totp_code: totpCode
      }, { 
        headers: getAuthHeaders(),
        params: { mfa_session_id: mfaSession.mfa_session_id }
      });

      if (response.data.mfa_complete) {
        setMfaSession(prev => ({ ...prev, totp_verified: true, mfa_complete: true }));
        setStep('handover-form');
      }
    } catch (error) {
      console.error('TOTP verification failed:', error);
      alert('Invalid TOTP code. Please try again.');
    }
    setLoading(false);
  };

  const initiateHandover = async () => {
    if (!mfaSession || !mfaSession.mfa_complete) {
      alert('Complete MFA verification first');
      return;
    }

    if (!handoverForm.next_ceo_id || !handoverForm.reason.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/ceo/succession/handover/initiate', handoverForm, {
        headers: getAuthHeaders(),
        params: { mfa_session_id: mfaSession.mfa_session_id }
      });

      alert('CEO handover initiated successfully!');
      setStep('overview');
      setMfaSession(null);
      setHandoverForm({ next_ceo_id: '', effective_delay_hours: 24, reason: '' });
      fetchSuccessionStatus();
      fetchHandoverHistory();
    } catch (error) {
      console.error('Handover initiation failed:', error);
      alert('Failed to initiate handover: ' + (error.response?.data?.detail || 'Unknown error'));
    }
    setLoading(false);
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      PENDING_NEW_CEO_SIGN: 'bg-yellow-500',
      SCHEDULED: 'bg-blue-500',
      EXECUTED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
      EXPIRED: 'bg-gray-500'
    };

    return (
      <Badge className={`${colors[status] || 'bg-gray-500'} text-white`}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (!user || user.role !== 'ROLE_CEO') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">Only the CEO can access succession management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          CEO Succession Management
        </h1>
        <p className="text-gray-600">
          Secure handover system with WebAuthn + TOTP multi-factor authentication
        </p>
      </div>

      <Tabs value={step} onValueChange={setStep}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webauthn-setup">Security Setup</TabsTrigger>
          <TabsTrigger value="handover">Initiate Handover</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Current CEO</p>
                    <p className="font-semibold">{status?.current_ceo?.name || 'Loading...'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Key className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">WebAuthn Credentials</p>
                    <p className="font-semibold">{status?.webauthn_credentials || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Active Handovers</p>
                    <p className="font-semibold">{status?.active_handovers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Emergency Trustees</p>
                    <p className="font-semibold">{status?.emergency_trustees || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Succession Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-blue-600" />
                    <span>WebAuthn Credentials Registered</span>
                  </div>
                  {status?.webauthn_credentials > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-green-600" />
                    <span>Two-Factor Authentication</span>
                  </div>
                  {status?.succession_ready ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div className="mt-4">
                  {!status?.succession_ready && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Setup Required</span>
                      </div>
                      <p className="text-yellow-700 text-sm">
                        Complete WebAuthn and 2FA setup to enable CEO succession functionality.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webauthn-setup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  WebAuthn Security Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Enhanced Security Required</h3>
                    <p className="text-blue-700 text-sm">
                      CEO succession requires WebAuthn (FIDO2) authentication using hardware security keys, 
                      TouchID, FaceID, or Windows Hello for maximum security.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Current Credentials</h4>
                    {status?.webauthn_credentials > 0 ? (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">
                          {status.webauthn_credentials} WebAuthn credential(s) registered
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800">No WebAuthn credentials registered</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={registerWebAuthn}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Registering...' : 'Register New WebAuthn Credential'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="handover">
          {!status?.succession_ready ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-xl font-bold mb-2">Security Setup Required</h2>
                <p className="text-gray-600 mb-4">
                  Complete WebAuthn and 2FA setup before initiating handovers.
                </p>
                <Button onClick={() => setStep('webauthn-setup')}>
                  Complete Setup
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {step === 'handover' && !mfaSession && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Multi-Factor Authentication Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        CEO handover requires WebAuthn + TOTP verification for security.
                      </p>
                      <Button onClick={authenticateWebAuthn} disabled={loading} className="w-full">
                        {loading ? 'Authenticating...' : 'Begin WebAuthn Authentication'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 'totp-verification' && mfaSession && !mfaSession.totp_verified && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Enter TOTP Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">WebAuthn authentication successful</span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">TOTP Code</label>
                        <Input
                          type="text"
                          placeholder="Enter 6-digit code from your authenticator app"
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                      
                      <Button onClick={verifyTOTP} disabled={loading || totpCode.length !== 6} className="w-full">
                        {loading ? 'Verifying...' : 'Verify TOTP Code'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 'handover-form' && mfaSession?.mfa_complete && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Initiate CEO Handover
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">Multi-factor authentication complete</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Next CEO *</label>
                        <select 
                          className="w-full p-2 border rounded-md"
                          value={handoverForm.next_ceo_id}
                          onChange={(e) => setHandoverForm(prev => ({...prev, next_ceo_id: e.target.value}))}
                        >
                          <option value="">Select next CEO...</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Effective Delay (Hours) *</label>
                        <Input
                          type="number"
                          min="24"
                          max="168"
                          value={handoverForm.effective_delay_hours}
                          onChange={(e) => setHandoverForm(prev => ({...prev, effective_delay_hours: parseInt(e.target.value)}))}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 24 hours, maximum 168 hours (7 days)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Reason for Handover *</label>
                        <Textarea
                          placeholder="Provide a detailed reason for the CEO handover (minimum 10 characters)"
                          value={handoverForm.reason}
                          onChange={(e) => setHandoverForm(prev => ({...prev, reason: e.target.value}))}
                          rows={4}
                        />
                      </div>

                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-yellow-800">Important</span>
                        </div>
                        <p className="text-yellow-700 text-sm">
                          This action will transfer CEO privileges to another user after the specified delay. 
                          The handover can be cancelled before the effective time.
                        </p>
                      </div>

                      <Button onClick={initiateHandover} disabled={loading} className="w-full">
                        {loading ? 'Initiating...' : 'Initiate CEO Handover'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Handover History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {handoverHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No handover transactions found</p>
              ) : (
                <div className="space-y-4">
                  {handoverHistory.map((handover) => (
                    <div key={handover.tx_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={handover.status} />
                          <span className="font-medium">Transaction: {handover.tx_id.slice(0, 8)}...</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(handover.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">From:</span>
                          <p className="font-medium">{handover.metadata?.prev_ceo_name || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">To:</span>
                          <p className="font-medium">{handover.metadata?.next_ceo_name || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Effective At:</span>
                          <p className="font-medium">
                            {new Date(handover.effective_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-gray-600 text-sm">Reason:</span>
                        <p className="text-sm">{handover.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CEOSuccession;