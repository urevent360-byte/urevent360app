import React, { useState } from 'react';
import axios from 'axios';
import { 
  HelpCircle, MessageCircle, Mail, Phone, Search, Book, 
  ChevronRight, ChevronDown, Send, Clock, Check, ExternalLink,
  Users, Zap, Shield, CreditCard, Calendar, Settings
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('faq');

  const faqCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      questions: [
        {
          id: 1,
          question: 'How do I create my first event?',
          answer: 'To create your first event, click on "Create Event" from your dashboard or sidebar. Follow the 5-step process: Basic Information, Event Type & Date, Cultural Style (if applicable), Requirements, and Budget. Our system will guide you through each step.'
        },
        {
          id: 2,
          question: 'What types of events can I plan?',
          answer: 'We support 10+ event types including Weddings (with sub-types like Reception Only), Corporate Events, Birthday Parties, Quinceañeras, Sweet 16s, Bat Mitzvahs, and more. Each event type has specific customization options.'
        },
        {
          id: 3,
          question: 'How does the Interactive Event Planner work?',
          answer: 'The Interactive Event Planner is a 10-step wizard that helps you select vendors for each service (Venue, Decoration, Catering, Bar, Event Planner, Photography, DJ, Waitstaff, Entertainment). You can add vendors to your cart, compare scenarios, and finalize your selections.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: Users,
      questions: [
        {
          id: 4,
          question: 'How do I update my profile information?',
          answer: 'Go to your profile settings by clicking your avatar in the top right and selecting "View Profile" or "Edit Profile". You can update your name, email, phone, bio, location, and profile picture.'
        },
        {
          id: 5,
          question: 'Can I change my email address?',
          answer: 'Yes, you can change your email address in Account Settings. For security reasons, you\'ll need to verify the new email address before the change takes effect.'
        },
        {
          id: 6,
          question: 'How do I enable two-factor authentication?',
          answer: 'Go to Security Settings and click "Set Up Two-Factor Authentication". You\'ll need an authenticator app like Google Authenticator. Follow the setup wizard to scan the QR code and verify with a code from your app.'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Billing',
      icon: CreditCard,
      questions: [
        {
          id: 7,
          question: 'What payment methods do you accept?',
          answer: 'We accept major credit cards (Visa, Mastercard, American Express), bank transfers, and digital payments. You can manage your payment methods in Billing Settings.'
        },
        {
          id: 8,
          question: 'How does the budget tracker work?',
          answer: 'The budget tracker shows your total event budget, amount paid to vendors, and remaining balance in real-time. It updates automatically as you make payments and book services.'
        },
        {
          id: 9,
          question: 'Can I get refunds for cancelled bookings?',
          answer: 'Refund policies vary by vendor. Check the specific vendor\'s cancellation policy in your booking details. Most vendors have different refund rates based on how far in advance you cancel.'
        }
      ]
    },
    {
      id: 'vendors',
      title: 'Vendors & Services',
      icon: Users,
      questions: [
        {
          id: 10,
          question: 'How are vendors filtered by my budget?',
          answer: 'Our smart filtering system only shows vendors whose services fit within your event budget range. This ensures you don\'t waste time browsing services you can\'t afford.'
        },
        {
          id: 11,
          question: 'What is the Preferred Vendors list?',
          answer: 'When you rate a vendor 4+ stars after an event, they\'re automatically added to your Preferred Vendors list. This gives you quick access to trusted professionals for future events.'
        },
        {
          id: 12,
          question: 'How do I book multiple vendors at once?',
          answer: 'Use the Interactive Event Planner to add multiple vendors to your cart, then finalize all bookings together. This creates vendor bookings and invoices automatically.'
        }
      ]
    }
  ];

  const contactCategories = [
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'vendor', label: 'Vendor Issues' },
    { value: 'event', label: 'Event Planning Help' },
    { value: 'account', label: 'Account Issues' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${API}/support/contact`, contactForm);
      setMessage('Your message has been sent successfully! We\'ll get back to you within 24 hours.');
      setContactForm({
        subject: '',
        category: '',
        message: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to send contact form:', error);
      setMessage('Failed to send your message. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (questionId) => {
    setExpandedFAQ(expandedFAQ === questionId ? null : questionId);
  };

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-8">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <HelpCircle className="h-6 w-6 mr-3" />
            Help & Support Center
          </h1>
          <p className="text-blue-100 mt-1">Find answers to your questions or get in touch with our support team</p>
        </div>

        <div className="p-6">
          {/* Contact Methods - Quick Access */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-3">Available 24/7 for instant help</p>
              <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors">
                Start Chat
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Email Support</h3>
              <p className="text-sm text-gray-600 mb-3">Response within 24 hours</p>
              <button 
                onClick={() => setActiveTab('contact')}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Send Email
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Phone Support</h3>
              <p className="text-sm text-gray-600 mb-3">Call us for urgent issues</p>
              <a href="tel:+1-555-UREVENT" className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors inline-block">
                Call Now
              </a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('faq')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'faq'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Book className="w-4 h-4 inline mr-2" />
                FAQ
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Contact Us
              </button>
            </nav>
          </div>

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search frequently asked questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* FAQ Categories */}
              <div className="space-y-6">
                {filteredFAQs.map((category) => (
                  <div key={category.id}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <category.icon className="h-5 w-5 mr-2 text-blue-600" />
                      {category.title}
                    </h3>
                    <div className="space-y-3">
                      {category.questions.map((faq) => (
                        <div key={faq.id} className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => toggleFAQ(faq.id)}
                            className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                          >
                            <span className="font-medium text-gray-900">{faq.question}</span>
                            {expandedFAQ === faq.id ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                          {expandedFAQ === faq.id && (
                            <div className="px-4 pb-4 pt-0">
                              <p className="text-gray-600">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* No Results */}
              {searchQuery && filteredFAQs.length === 0 && (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try different keywords or contact our support team for personalized help.
                  </p>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div>
              <form onSubmit={handleSubmitContact} className="max-w-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={contactForm.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {contactCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={contactForm.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low - General inquiry</option>
                      <option value="medium">Medium - Standard support</option>
                      <option value="high">High - Urgent issue</option>
                      <option value="critical">Critical - Service down</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Brief description of your issue or question"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    placeholder="Please provide as much detail as possible about your issue or question. Include any error messages, steps you took, and what you expected to happen."
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm">
                      <p className="text-blue-800 font-medium">Response Times:</p>
                      <ul className="text-blue-700 mt-1 space-y-1">
                        <li>• Critical: Within 1 hour</li>
                        <li>• High: Within 4 hours</li>
                        <li>• Medium: Within 24 hours</li>
                        <li>• Low: Within 48 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          )}

          {/* Additional Resources */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <Book className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">User Guide</h4>
                <p className="text-sm text-gray-600">Complete platform documentation</p>
                <ExternalLink className="h-4 w-4 text-gray-400 mt-2" />
              </a>
              
              <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <MessageCircle className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Community Forum</h4>
                <p className="text-sm text-gray-600">Connect with other users</p>
                <ExternalLink className="h-4 w-4 text-gray-400 mt-2" />
              </a>
              
              <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Webinars</h4>
                <p className="text-sm text-gray-600">Live training sessions</p>
                <ExternalLink className="h-4 w-4 text-gray-400 mt-2" />
              </a>
              
              <a href="#" className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <Settings className="h-8 w-8 text-orange-600 mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">API Docs</h4>
                <p className="text-sm text-gray-600">Developer documentation</p>
                <ExternalLink className="h-4 w-4 text-gray-400 mt-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;