import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Globe, Check, ChevronDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LanguageSettings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
    { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
    { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
    { code: 'it', name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹', native: 'Português' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', native: '中文' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', native: '한국어' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺', native: 'Русский' }
  ];

  useEffect(() => {
    fetchLanguagePreference();
  }, []);

  const fetchLanguagePreference = async () => {
    try {
      const response = await axios.get(`${API}/users/language-preference`);
      setSelectedLanguage(response.data.language || 'en');
    } catch (error) {
      console.error('Failed to fetch language preference:', error);
    }
  };

  const handleLanguageChange = async (languageCode) => {
    setLoading(true);
    setMessage('');
    
    try {
      await axios.put(`${API}/users/language-preference`, { language: languageCode });
      setSelectedLanguage(languageCode);
      setIsDropdownOpen(false);
      setMessage('Language preference updated successfully!');
      
      // Update document language attribute
      document.documentElement.lang = languageCode;
      
    } catch (error) {
      console.error('Failed to update language preference:', error);
      setMessage('Failed to update language preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedLanguage = () => {
    return languages.find(lang => lang.code === selectedLanguage) || languages[0];
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Globe className="h-6 w-6 mr-3" />
            Language Settings
          </h1>
          <p className="text-blue-100 mt-1">Choose your preferred language for the application</p>
        </div>

        <div className="p-6">
          {/* Current Language Display */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Language</h3>
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSelectedLanguage().flag}</span>
                  <div>
                    <p className="font-medium text-gray-900">{getSelectedLanguage().name}</p>
                    <p className="text-sm text-gray-600">{getSelectedLanguage().native}</p>
                  </div>
                </div>
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Language</h3>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full md:w-80 px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getSelectedLanguage().flag}</span>
                  <span className="font-medium">{getSelectedLanguage().name}</span>
                  <span className="text-gray-500">({getSelectedLanguage().native})</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full md:w-80 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center space-x-3 ${
                        selectedLanguage === language.code ? 'bg-purple-50 text-purple-700' : 'text-gray-900'
                      }`}
                      disabled={loading}
                    >
                      <span className="text-xl">{language.flag}</span>
                      <div className="flex-1">
                        <span className="font-medium">{language.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({language.native})</span>
                      </div>
                      {selectedLanguage === language.code && (
                        <Check className="h-5 w-5 text-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Language Features */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Interface Translation</h4>
                <p className="text-sm text-blue-700">All buttons, menus, and labels will display in your selected language.</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Date & Time Formats</h4>
                <p className="text-sm text-green-700">Dates and times will be formatted according to your language's conventions.</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Email Notifications</h4>
                <p className="text-sm text-purple-700">System emails will be sent in your preferred language.</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">Currency Display</h4>
                <p className="text-sm text-orange-700">Prices will be displayed using your region's currency format.</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <div className="flex items-center">
                {message.includes('success') ? (
                  <Check className="h-5 w-5 mr-2" />
                ) : (
                  <X className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Some translations may not be available for all languages. 
                  We're continuously working to improve language support. If you encounter any untranslated text, 
                  please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;