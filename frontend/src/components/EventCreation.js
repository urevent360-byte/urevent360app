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
    { id: 'wedding', name: 'Wedding', desc: 'Celebrate your special day' },
    { id: 'corporate', name: 'Corporate Event', desc: 'Business meetings and conferences' },
    { id: 'birthday', name: 'Birthday Party', desc: 'Celebrate another year of life' },
    { id: 'anniversary', name: 'Anniversary', desc: 'Commemorate special milestones' },
    { id: 'graduation', name: 'Graduation', desc: 'Academic achievement celebrations' },
    { id: 'baby_shower', name: 'Baby Shower', desc: 'Welcome the new arrival' },
    { id: 'retirement', name: 'Retirement Party', desc: 'Celebrate career achievements' },
    { id: 'other', name: 'Other', desc: 'Custom event type' }
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
    { id: 3, name: 'Requirements', desc: 'Your needs' },
    { id: 4, name: 'Budget', desc: 'Financial planning' }
  ];

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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return eventData.name.trim() !== '';
      case 2:
        return eventData.event_type !== '' && eventData.date !== '';
      case 3:
        return eventData.requirements.venue_type !== '';
      case 4:
        return eventData.guest_count !== '';
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
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
    if (!validateStep(4)) {
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
                    onClick={() => handleInputChange({ target: { name: 'event_type', value: type.id } })}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      eventData.event_type === type.id
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{type.desc}</p>
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

      case 4:
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

          {currentStep < 4 ? (
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