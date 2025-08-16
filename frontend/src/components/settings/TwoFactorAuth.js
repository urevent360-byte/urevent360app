import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Smartphone, Check, X, Key, Copy, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TwoFactorAuth = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await axios.get(`${API}/users/two-factor-status`);
      setTwoFactorEnabled(response.data.enabled);
      if (response.data.backup_codes) {
        setBackupCodes(response.data.backup_codes);
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/users/two-factor-generate`);
      setQrCode(response.data.qr_code);
      setBackupCodes(response.data.backup_codes);
      setShowSetup(true);
      setStep(1);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setMessage('Failed to generate setup code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage('Please enter a valid 6-digit code from your authenticator app.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/users/two-factor-verify`, { code: verificationCode });
      setTwoFactorEnabled(true);
      setShowSetup(false);
      setMessage('Two-factor authentication has been successfully enabled!');
      setVerificationCode('');
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      setMessage('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/users/two-factor-disable`);
      setTwoFactorEnabled(false);
      setQrCode('');
      setBackupCodes([]);
      setMessage('Two-factor authentication has been disabled.');
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      setMessage('Failed to disable two-factor authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/users/two-factor-regenerate-backup`);
      setBackupCodes(response.data.backup_codes);
      setMessage('New backup codes have been generated. Please save them in a secure location.');
    } catch (error) {
      console.error('Failed to regenerate backup codes:', error);
      setMessage('Failed to generate new backup codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setMessage('Backup codes copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Shield className="h-6 w-6 mr-3" />
            Security & Two-Factor Authentication
          </h1>
          <p className="text-green-100 mt-1">Secure your account with two-factor authentication</p>
        </div>

        <div className="p-6">
          {/* Current Status */}
          <div className="mb-8">
            <div className={`p-6 rounded-lg border-2 ${twoFactorEnabled ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${twoFactorEnabled ? 'bg-green-100' : 'bg-orange-100'}`}>
                    <Shield className={`h-6 w-6 ${twoFactorEnabled ? 'text-green-600' : 'text-orange-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${twoFactorEnabled ? 'text-green-900' : 'text-orange-900'}`}>
                      Two-Factor Authentication is {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </h3>
                    <p className={`text-sm ${twoFactorEnabled ? 'text-green-700' : 'text-orange-700'}`}>
                      {twoFactorEnabled 
                        ? 'Your account is protected with an additional layer of security.'
                        : 'Enable 2FA to add an extra layer of security to your account.'
                      }
                    </p>
                  </div>
                </div>
                {twoFactorEnabled ? (
                  <Check className="h-8 w-8 text-green-600" />
                ) : (
                  <X className="h-8 w-8 text-orange-600" />
                )}
              </div>
            </div>
          </div>

          {!twoFactorEnabled && !showSetup && (
            /* Enable 2FA Section */
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enable Two-Factor Authentication</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-start space-x-4">
                  <Smartphone className="h-12 w-12 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">Secure Your Account</h4>
                    <p className="text-gray-600 mb-4">
                      Two-factor authentication (2FA) adds an extra layer of security to your account. 
                      You'll need to enter a code from your phone in addition to your password when signing in.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>• Protects against unauthorized access</li>
                      <li>• Works even if your password is compromised</li>
                      <li>• Uses apps like Google Authenticator, Authy, or Microsoft Authenticator</li>
                    </ul>
                    <button
                      onClick={generateQRCode}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      {loading ? 'Setting up...' : 'Set Up Two-Factor Authentication'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSetup && (
            /* Setup Process */
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Up Two-Factor Authentication</h3>
              
              {step === 1 && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="text-center mb-6">
                    <h4 className="font-medium text-blue-900 mb-2">Step 1: Scan QR Code</h4>
                    <p className="text-blue-700 text-sm">
                      Use your authenticator app to scan this QR code
                    </p>
                  </div>
                  
                  {qrCode && (
                    <div className="flex justify-center mb-6">
                      <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <p className="text-sm text-blue-700 mb-2">
                      Don't have an authenticator app? Download one:
                    </p>
                    <div className="flex justify-center space-x-4">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Google Authenticator</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Authy</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Microsoft Authenticator</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => setStep(2)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      I've Scanned the Code
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="text-center mb-6">
                    <h4 className="font-medium text-green-900 mb-2">Step 2: Enter Verification Code</h4>
                    <p className="text-green-700 text-sm">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  
                  <div className="max-w-xs mx-auto mb-6">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={verifyAndEnable}
                      disabled={loading || verificationCode.length !== 6}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {loading ? 'Verifying...' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {twoFactorEnabled && (
            /* Manage 2FA Section */
            <div className="space-y-8">
              {/* Backup Codes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Codes</h3>
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <Key className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Recovery Codes</h4>
                      <p className="text-sm text-yellow-800">
                        Save these codes in a secure place. You can use them to access your account if you lose your phone.
                        Each code can only be used once.
                      </p>
                    </div>
                  </div>
                  
                  {backupCodes.length > 0 && (
                    <div className="bg-white p-4 rounded border border-yellow-300 mb-4">
                      <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={copyBackupCodes}
                      className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Codes
                    </button>
                    <button
                      onClick={regenerateBackupCodes}
                      disabled={loading}
                      className="flex items-center px-4 py-2 border border-yellow-600 text-yellow-700 rounded hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate New Codes
                    </button>
                  </div>
                </div>
              </div>

              {/* Disable 2FA */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Disable Two-Factor Authentication</h3>
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <X className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-1">Remove Extra Security</h4>
                      <p className="text-sm text-red-800">
                        Disabling two-factor authentication will make your account less secure. 
                        Only disable this if you no longer have access to your authenticator device.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={disable2FA}
                    disabled={loading}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mt-6 ${message.includes('success') || message.includes('enabled') || message.includes('copied') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;