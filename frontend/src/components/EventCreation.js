import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Users, DollarSign, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventCreation = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    event_type: '',
    sub_event_type: '',
    cultural_style: '',
    date: '',
    time: '',
    location: '',
    guest_count: '',
    budget: '',
    requirements: {
      venue_type: '',
      services: [],
      special_requirements: ''
    }
  });

  const eventTypes = [
    { id: 'wedding', name: 'Wedding', desc: 'Celebrate your special day', hasSubTypes: true },
    { id: 'quinceanera', name: 'Quinceañera', desc: 'Celebrate the transition to womanhood' },
    { id: 'sweet_16', name: 'Sweet 16', desc: 'Celebrate the milestone birthday' },
    { id: 'bat_mitzvah', name: 'Bat Mitzvah', desc: 'Celebrate the coming of age ceremony' },
    { id: 'corporate', name: 'Corporate Event', desc: 'Business meetings and conferences' },
    { id: 'birthday', name: 'Birthday Party', desc: 'Celebrate another year of life' },
    { id: 'anniversary', name: 'Anniversary', desc: 'Commemorate special milestones' },
    { id: 'graduation', name: 'Graduation', desc: 'Academic achievement celebrations' },
    { id: 'baby_shower', name: 'Baby Shower', desc: 'Welcome the new arrival' },
    { id: 'retirement', name: 'Retirement Party', desc: 'Celebrate career achievements' },
    { id: 'other', name: 'Other', desc: 'Custom event type' }
  ];

  const weddingSubTypes = [
    { 
      id: 'reception_only', 
      name: 'Reception Only', 
      desc: 'Celebrate with family and friends after the ceremony',
      icon: '🥂'
    },
    { 
      id: 'reception_with_ceremony', 
      name: 'Reception with Ceremony at the Same Location', 
      desc: 'Full wedding ceremony and reception at one venue',
      icon: '💒'
    }
  ];

  const culturalStyles = [
    {
      id: 'american',
      name: 'American',
      desc: 'Traditional American wedding style with classic elegance',
      icon: '🗽',
      color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
    },
    {
      id: 'indian',
      name: 'Indian',
      desc: 'Rich traditions with vibrant colors, ceremonies, and celebrations',
      icon: '🕉️',
      color: 'bg-orange-50 border-orange-200 hover:border-orange-300'
    },
    {
      id: 'hispanic',
      name: 'Hispanic/Latino',
      desc: 'Warm family traditions with lively music and cultural rituals',
      icon: '🌺',
      color: 'bg-red-50 border-red-200 hover:border-red-300'
    },
    {
      id: 'african',
      name: 'African',
      desc: 'Beautiful cultural ceremonies with traditional music and attire',
      icon: '🌍',
      color: 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
    },
    {
      id: 'asian',
      name: 'Asian',
      desc: 'Elegant traditions including Chinese, Japanese, Korean styles',
      icon: '🏮',
      color: 'bg-pink-50 border-pink-200 hover:border-pink-300'
    },
    {
      id: 'middle_eastern',
      name: 'Middle Eastern',
      desc: 'Luxurious celebrations with rich cultural traditions',
      icon: '🕌',
      color: 'bg-purple-50 border-purple-200 hover:border-purple-300'
    },
    {
      id: 'jewish',
      name: 'Jewish',
      desc: 'Traditional Jewish wedding with meaningful ceremonies',
      icon: '✡️',
      color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-300'
    },
    {
      id: 'other',
      name: 'Other/Mixed',
      desc: 'Custom blend of cultures or unique cultural background',
      icon: '🌐',
      color: 'bg-gray-50 border-gray-200 hover:border-gray-300'
    }
  ];

  const venueTypes = [
    'Hotel/Banquet Hall',
    'Restaurant',
    'Outdoor/Garden',
    'Community Center',
    'Beach/Waterfront',
    'Private Residence',
    'Church/Religious Venue',
    'Other'
  ];

  const services = [
    'Catering',
    'Decoration',
    'Photography',
    'Videography',
    'Music/DJ',
    'Entertainment',
    'Transportation',
    'Security',
    'Cleaning',
    'Lighting'
  ];

  const steps = [
    { id: 1, name: 'Basic Info', desc: 'Event details' },
    { id: 2, name: 'Type & Date', desc: 'When and what' },
    { id: 3, name: 'Wedding Details', desc: 'Ceremony preferences', condition: () => eventData.event_type === 'wedding' },
    { id: 4, name: 'Cultural Style', desc: 'Wedding traditions', condition: () => eventData.event_type === 'wedding' && eventData.sub_event_type },
    { id: 5, name: 'Requirements', desc: 'Your needs' },
    { id: 6, name: 'Budget', desc: 'Financial planning' }
  ].filter(step => !step.condition || step.condition());

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEventData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEventData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleServiceToggle = (service) => {
    setEventData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        services: prev.requirements.services.includes(service)
          ? prev.requirements.services.filter(s => s !== service)
          : [...prev.requirements.services, service]
      }
    }));
  };

  const getStepNumber = (stepName) => {
    const dynamicSteps = steps.map((step, index) => ({ ...step, dynamicId: index + 1 }));
    return dynamicSteps.find(step => step.name === stepName)?.dynamicId || null;
  };

  const getMaxSteps = () => steps.length;

  const validateStep = (step) => {
    const culturalStyleStepNumber = getStepNumber('Cultural Style');
    const requirementsStepNumber = getStepNumber('Requirements');
    const budgetStepNumber = getStepNumber('Budget');
    
    switch (step) {
      case 1:
        return eventData.name.trim() !== '';
      case 2:
        return eventData.event_type !== '' && eventData.date !== '';
      case 3:
        if (eventData.event_type === 'wedding') {
          return eventData.sub_event_type !== '';
        }
        // If step 3 is Requirements (when not wedding)
        if (step === requirementsStepNumber) {
          return eventData.requirements.venue_type !== '';
        }
        return true;
      case culturalStyleStepNumber:
        if (eventData.event_type === 'wedding' && culturalStyleStepNumber) {
          return eventData.cultural_style !== '';
        }
        return true;
      case requirementsStepNumber:
        return eventData.requirements.venue_type !== '';
      case budgetStepNumber:
        return eventData.guest_count !== '';
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, getMaxSteps()));
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const calculateEstimatedBudget = async () => {
    try {
      const requirements = {
        guest_count: parseInt(eventData.guest_count),
        venue_type: eventData.requirements.venue_type.toLowerCase(),
        services: eventData.requirements.services.map(s => s.toLowerCase())
      };

      const response = await axios.post(`${API}/events/temp/calculate-budget`, requirements);
      return response.data.estimated_budget;
    } catch (error) {
      console.error('Failed to calculate budget:', error);
      return 0;
    }
  };

  const handleSubmit = async () => {
    const budgetStepNumber = getStepNumber('Budget');
    if (!validateStep(budgetStepNumber)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Combine date and time
      const eventDateTime = new Date(`${eventData.date}T${eventData.time || '12:00'}`);
      
      // Calculate estimated budget
      const estimated_budget = await calculateEstimatedBudget();

      const submitData = {
        name: eventData.name,
        description: eventData.description,
        event_type: eventData.event_type,
        sub_event_type: eventData.sub_event_type || null,
        cultural_style: eventData.cultural_style || null,
        date: eventDateTime.toISOString(),
        location: eventData.location,
        guest_count: parseInt(eventData.guest_count),
        budget: parseFloat(eventData.budget) || null,
        estimated_budget: estimated_budget,
        status: 'planning'
      };

      const response = await axios.post(`${API}/events`, submitData);
      navigate(`/events/${response.data.id}/planning`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const requirementsStepNumber = getStepNumber('Requirements');
    const budgetStepNumber = getStepNumber('Budget');
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={eventData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Sarah & John's Wedding"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={eventData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell us about your event..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="location"
                  value={eventData.location}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="City or specific venue"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Event Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => {
                      handleInputChange({ target: { name: 'event_type', value: type.id } });
                      // Reset sub_event_type when changing event type
                      if (eventData.event_type !== type.id) {
                        setEventData(prev => ({ ...prev, sub_event_type: '' }));
                      }
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      eventData.event_type === type.id
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{type.desc}</p>
                    {type.hasSubTypes && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                        Additional options available
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="date"
                    name="date"
                    value={eventData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="time"
                    name="time"
                    value={eventData.time}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        // Wedding Details Step (only shown for weddings)
        if (eventData.event_type === 'wedding') {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Wedding Type *
                </label>
                <p className="text-sm text-gray-600 mb-6">
                  Please select the type of wedding celebration you're planning:
                </p>
                <div className="grid grid-cols-1 gap-4">
                  {weddingSubTypes.map((subType) => (
                    <div
                      key={subType.id}
                      onClick={() => handleInputChange({ target: { name: 'sub_event_type', value: subType.id } })}
                      className={`p-6 border rounded-lg cursor-pointer transition-all ${
                        eventData.sub_event_type === subType.id
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{subType.icon}</div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-lg">{subType.name}</h3>
                          <p className="text-sm text-gray-600 mt-2">{subType.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        // If not wedding, fall through to requirements
        
      case requirementsStepNumber:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Preferred Venue Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {venueTypes.map((venue) => (
                  <label key={venue} className="flex items-center">
                    <input
                      type="radio"
                      name="requirements.venue_type"
                      value={venue}
                      checked={eventData.requirements.venue_type === venue}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm text-gray-700">{venue}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Services Needed
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map((service) => (
                  <label key={service} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventData.requirements.services.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                name="requirements.special_requirements"
                value={eventData.requirements.special_requirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Any specific needs or preferences..."
              />
            </div>
          </div>
        );

      case budgetStepNumber:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Guest Count *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="guest_count"
                  value={eventData.guest_count}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Number of guests"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (Optional)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="budget"
                  value={eventData.budget}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your total budget"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Don't worry if you're not sure - we'll help you estimate costs based on your requirements.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Event Summary</h4>
              <div className="space-y-1 text-sm text-purple-700">
                <p><strong>Event:</strong> {eventData.name}</p>
                <p><strong>Type:</strong> {eventTypes.find(t => t.id === eventData.event_type)?.name}</p>
                {eventData.sub_event_type && (
                  <p><strong>Wedding Type:</strong> {weddingSubTypes.find(st => st.id === eventData.sub_event_type)?.name}</p>
                )}
                <p><strong>Date:</strong> {eventData.date}</p>
                <p><strong>Guests:</strong> {eventData.guest_count}</p>
                <p><strong>Venue Type:</strong> {eventData.requirements.venue_type}</p>
                {eventData.requirements.services.length > 0 && (
                  <p><strong>Services:</strong> {eventData.requirements.services.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-1 text-sm text-gray-600">
            Let's gather some information about your event
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                  <div className="flex items-center">
                    <div className={`
                      relative flex h-8 w-8 items-center justify-center rounded-full
                      ${currentStep >= step.id
                        ? 'bg-purple-600 text-white'
                        : 'border-2 border-gray-300 bg-white text-gray-500'
                      }
                    `}>
                      <span className="text-sm font-medium">{step.id}</span>
                    </div>
                    <div className="ml-4 min-w-0 flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{step.name}</span>
                      <span className="text-sm text-gray-500">{step.desc}</span>
                    </div>
                  </div>
                  {stepIdx !== steps.length - 1 && (
                    <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </button>

          {currentStep < getMaxSteps() ? (
            <button
              onClick={nextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Create Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCreation;