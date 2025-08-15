import React, { useState } from 'react';
import { 
  HelpCircle, MessageCircle, Phone, Mail, Clock, Search, 
  BookOpen, Video, FileText, ExternalLink, CheckCircle,
  AlertCircle, Users, Zap, ChevronRight
} from 'lucide-react';

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const supportOptions = [
    {
      id: 'live-chat',
      title: '24/7 Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      status: 'Available now',
      color: 'bg-green-500',
      action: 'Start Chat'
    },
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Speak directly with our experts',
      icon: Phone,
      status: 'Mon-Fri 8AM-8PM EST',
      color: 'bg-blue-500',
      action: 'Call (555) 123-4567'
    },
    {
      id: 'email',
      title: 'Email Support',
      description: 'Send us detailed questions',
      icon: Mail,
      status: 'Response within 4 hours',
      color: 'bg-purple-500',
      action: 'Send Email'
    }
  ];

  const faqs = [
    {
      category: 'events',
      question: 'How do I create my first event?',
      answer: 'Click on "Create New Event" from your dashboard, then follow our step-by-step wizard to set up your event details, select vendors, and manage your budget.'
    },
    {
      category: 'vendors',
      question: 'How do I find vendors for my event?',
      answer: 'Use our Interactive Event Planner to browse vendors by category, or visit the Vendor Marketplace to search by location, rating, and cultural specialization.'
    },
    {
      category: 'payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, bank transfers, and digital payments. You can manage your payment methods in the Billing & Payments section.'
    },
    {
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to Profile Settings from the user menu, then click "Edit Profile" to update your personal information, preferences, and notification settings.'
    },
    {
      category: 'events',
      question: 'Can I delete an event?',
      answer: 'Yes, you can delete events from your dashboard by clicking the delete button (trash icon) next to the event. This action cannot be undone.'
    },
    {
      category: 'vendors',
      question: 'What are Preferred Vendors?',
      answer: 'Preferred Vendors are professionals you\'ve previously hired and rated highly. They appear in your profile for easy re-hiring and are prioritized in recommendations.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'events', name: 'Event Management', icon: Calendar },
    { id: 'vendors', name: 'Vendors & Services', icon: Users },
    { id: 'payments', name: 'Payments & Billing', icon: CreditCard },
    { id: 'account', name: 'Account Settings', icon: User }
  ];

  const resources = [
    {
      title: 'Getting Started Guide',
      description: 'Complete walkthrough for new users',
      icon: BookOpen,
      type: 'Guide',
      url: '/help/getting-started'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video instructions',
      icon: Video,
      type: 'Videos',
      url: '/help/videos'
    },
    {
      title: 'Event Planning Checklist',
      description: 'Comprehensive planning checklist',
      icon: FileText,
      type: 'Checklist',
      url: '/help/checklist'
    },
    {
      title: 'Vendor Guidelines',
      description: 'How to work with vendors effectively',
      icon: Users,
      type: 'Guide',
      url: '/help/vendors'
    }
  ];

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs.filter(faq => faq.question.toLowerCase().includes(searchQuery.toLowerCase()))
    : faqs.filter(faq => 
        faq.category === selectedCategory && 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="mt-1 text-sm text-gray-500">
          Get the help you need to plan amazing events
        </p>
      </div>

      {/* Quick Support Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {supportOptions.map((option) => (
          <div key={option.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className={`${option.color} rounded-lg p-2 mr-3`}>
                <option.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{option.title}</h3>
                <p className="text-sm text-gray-500">{option.status}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">{option.description}</p>
            <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors">
              {option.action}
            </button>
          </div>
        ))}
      </div>

      {/* Search and Categories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </button>
            ))}
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  {faq.question}
                </h3>
                <p className="text-sm text-gray-600 pl-6">{faq.answer}</p>
              </div>
            ))}
            
            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500">Try adjusting your search or selecting a different category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Helpful Resources</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="bg-gray-100 rounded-lg p-3 mr-4">
                  <resource.icon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">{resource.title}</h3>
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {resource.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Zap className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-bold">Still need help?</h2>
          </div>
          <p className="mb-4 opacity-90">
            Our support team is here to help you succeed with your events.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span className="text-sm">24/7 Live Chat Support</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              <span className="text-sm">Phone: (555) 123-4567</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              <span className="text-sm">support@urevent360.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;