import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Calendar, MapPin, Users, DollarSign, ChevronRight, ChevronLeft } from 'lucide-react';
import { 
  EVENT_FLOW_CONFIG, 
  CORE_SERVICES, 
  ADD_ON_EXTRAS, 
  PREFERRED_VENUE_TYPES,
  CULTURAL_STYLES,
  EVENT_FORMATS,
  THEME_OPTIONS,
  shouldShowCulturalStyles,
  getReplaceWith
} from '../config/eventFlowConfig';
import VenueSearchControls from './wizard/VenueSearchControls';
import BudgetStep from './wizard/BudgetStep';
import LocationSection from './wizard/LocationSection';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateEventWizard = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [eventData, setEventData] = useState({
    name: '',
    type: '',
    date: '',
    time: '',
    city: '',
    guestCount: '',
    
    // Extended location preferences
    location: {
      city: '',
      zipcode: '',
      zipOnly: false,
      radiusMiles: 25
    },
    
    // Budget preferences  
    budget: {
      target: undefined,
      currency: 'USD'
    },
    
    // Preferences captured in wizard to seed Step-by-Step Mode
    preferredVenueTypes: [],
    categorySpecific: {
      culturalStyle: [],
      themeOrFormat: []
    },
    neededCoreServices: [],
    neededExtras: []
  });

  const eventTypes = [
    { id: 'wedding', name: 'Wedding', desc: 'Celebrate your special day', icon: '💍' },
    { id: 'quinceanera', name: 'Quinceañera', desc: 'Celebrate the transition to womanhood', icon: '👑' },
    { id: 'sweet_16', name: 'Sweet 16', desc: 'Celebrate the milestone birthday', icon: '🎂' },
    { id: 'bar_mitzvah', name: 'Bar Mitzvah', desc: 'Celebrate the coming of age ceremony', icon: '🕯️' },
    { id: 'bat_mitzvah', name: 'Bat Mitzvah', desc: 'Celebrate the coming of age ceremony', icon: '🕯️' },
    { id: 'corporate', name: 'Corporate Event', desc: 'Business meetings and conferences', icon: '🏢' },
    { id: 'birthday', name: 'Birthday Party', desc: 'Celebrate another year of life', icon: '🎉' },
    { id: 'anniversary', name: 'Anniversary', desc: 'Commemorate special milestones', icon: '💕' },
    { id: 'graduation', name: 'Graduation', desc: 'Academic achievement celebrations', icon: '🎓' },
    { id: 'baby_shower', name: 'Baby Shower', desc: 'Welcome the new arrival', icon: '👶' },
    { id: 'retirement', name: 'Retirement Party', desc: 'Celebrate career achievements', icon: '🏖️' },
    { id: 'other', name: 'Other', desc: 'Custom event type', icon: '🎭' }
  ];

  const baseSteps = [
    { id: 1, name: 'Basic Info', desc: 'Event details' },
    { id: 2, name: 'Event Type', desc: 'What kind of event' },
    { 
      id: 3, 
      name: getCategoryStepName(),
      desc: getCategoryStepDesc(),
      condition: () => shouldShowCategoryStep()
    },
    { id: 4, name: 'Venue Preferences', desc: 'Where you want to host' },
    { id: 5, name: 'Services Needed', desc: 'What help you need' },
    { id: 6, name: 'Guest Count', desc: 'Event size' }
  ];

  // Add budget step conditionally
  const budgetStepEnabled = process.env.REACT_APP_FEATURE_WIZARD_BUDGET === 'true';
  const budgetStep = { id: 7, name: 'Budget', desc: 'Target budget' };
  
  const steps = budgetStepEnabled 
    ? [...baseSteps, budgetStep].filter(step => !step.condition || step.condition())
    : baseSteps.filter(step => !step.condition || step.condition());

  function getCategoryStepName() {
    if (!eventData.type) return 'Category Style';
    if (shouldShowCulturalStyles(eventData.type)) return 'Cultural Style';
    const replaceWith = getReplaceWith(eventData.type);
    return replaceWith || 'Category Style';
  }

  function getCategoryStepDesc() {
    if (!eventData.type) return 'Style preferences';
    if (shouldShowCulturalStyles(eventData.type)) return 'Cultural preferences';
    return 'Theme and format';
  }

  function shouldShowCategoryStep() {
    return eventData.type !== '';
  }

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
      
      // Sync city with location.city for backward compatibility
      if (name === 'city') {
        setEventData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            city: value
          }
        }));
      }
    }
    setError('');
  };

  const handleLocationChange = (locationData) => {
    setEventData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        ...locationData
      }
    }));
    setError('');
  };

  const handleBudgetChange = (budgetData) => {
    setEventData(prev => ({
      ...prev,
      budget: budgetData
    }));
    setError('');
  };

  const handleArrayToggle = (arrayName, value) => {
    setEventData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].includes(value)
        ? prev[arrayName].filter(item => item !== value)
        : [...prev[arrayName], value]
    }));
  };

  const handleCategorySpecificToggle = (type, value) => {
    setEventData(prev => ({
      ...prev,
      categorySpecific: {
        ...prev.categorySpecific,
        [type]: prev.categorySpecific[type].includes(value)
          ? prev.categorySpecific[type].filter(item => item !== value)
          : [...prev.categorySpecific[type], value]
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return eventData.name.trim() !== '' && eventData.city.trim() !== '';
      case 2:
        return eventData.type !== '' && eventData.date !== '';
      case 3:
        // Category step is optional
        return true;
      case 4:
        return eventData.preferredVenueTypes.length > 0;
      case 5:
        return eventData.neededCoreServices.length > 0;
      case 6:
        return eventData.guestCount !== '' && parseInt(eventData.guestCount) > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(steps.length)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const eventDateTime = new Date(`${eventData.date}T${eventData.time || '12:00'}`);
      
      const submitData = {
        name: eventData.name,
        event_type: eventData.type,
        date: eventDateTime.toISOString(),
        location: eventData.city, // Keep backward compatibility
        guest_count: parseInt(eventData.guestCount),
        status: 'planning',
        
        // Extended location preferences
        location_preferences: {
          city: eventData.location.city || eventData.city,
          zipcode: eventData.location.zipcode,
          zip_only: !!eventData.location.zipOnly,
          radius_miles: eventData.location.radiusMiles || 25
        },
        
        // Budget preferences
        budget_preferences: {
          target: eventData.budget?.target || null,
          currency: eventData.budget?.currency || 'USD'
        },
        
        // Preferences for Step-by-Step Mode matching
        preferred_venue_types: eventData.preferredVenueTypes,
        needed_core_services: eventData.neededCoreServices,
        needed_extras: eventData.neededExtras,
        category_specific: eventData.categorySpecific
      };

      const response = await axios.post(`${API}/events`, submitData, {
        headers: getAuthHeaders()
      });
      
      // Redirect to Step-by-Step Mode (planning workspace)
      navigate(`/events/${response.data.id}/plan`);
      
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
                placeholder="What would you like to call your event?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="city"
                  value={eventData.city}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="City or location"
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
                {eventTypes.map((type) => {
                  const config = EVENT_FLOW_CONFIG[type.id];
                  const showCultural = config?.showCulturalStyles;
                  
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleInputChange({ target: { name: 'type', value: type.id } })}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        eventData.type === type.id
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{type.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{type.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{type.desc}</p>
                          {showCultural && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Cultural styles
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
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
                  Time (Optional)
                </label>
                <input
                  type="time"
                  name="time"
                  value={eventData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return renderCategoryStep();

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Preferred Venue Types * (Select all that interest you)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                We'll use these preferences to find the best venues for you in the next step.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PREFERRED_VENUE_TYPES.map((venue) => (
                  <label key={venue} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventData.preferredVenueTypes.includes(venue)}
                      onChange={() => handleArrayToggle('preferredVenueTypes', venue)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">{venue}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Search Controls - Feature Flagged */}
            {process.env.REACT_APP_FEATURE_WIZARD_LOCATION_FILTERS === 'true' && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Location Search Preferences</h4>
                <VenueSearchControls
                  value={eventData.location}
                  onChange={handleLocationChange}
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Core Services Needed * (What main services do you need?)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CORE_SERVICES.map((service) => (
                  <label key={service} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventData.neededCoreServices.includes(service)}
                      onChange={() => handleArrayToggle('neededCoreServices', service)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Add-Ons (Extras) - Optional
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Special entertainment and enhancement options to make your event memorable.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADD_ON_EXTRAS.map((extra) => (
                  <label key={extra} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventData.neededExtras.includes(extra)}
                      onChange={() => handleArrayToggle('neededExtras', extra)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">{extra}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
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
                  name="guestCount"
                  value={eventData.guestCount}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Number of guests"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This helps us recommend appropriate venue sizes and catering options.
              </p>
            </div>
          </div>
        );

      case 7:
        // Budget step - conditionally rendered based on feature flag
        if (process.env.REACT_APP_FEATURE_WIZARD_BUDGET === 'true') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Budget Planning</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Set a target budget to help us recommend vendors and services within your range.
                  This is optional but helps provide better matches.
                </p>
              </div>
              <BudgetStep
                value={eventData.budget}
                onChange={handleBudgetChange}
              />
            </div>
          );
        }
        
        // If budget step is disabled, fall through to summary
        return renderEventSummary();

      default:
        // Final step - summary (either step 7 if budget disabled, or step 8 if budget enabled)
        return renderEventSummary();
    }
  };

  const renderEventSummary = () => {
    const locationFiltersEnabled = process.env.REACT_APP_FEATURE_WIZARD_LOCATION_FILTERS === 'true';
    const budgetEnabled = process.env.REACT_APP_FEATURE_WIZARD_BUDGET === 'true';
    
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-4">Event Summary</h4>
          <div className="space-y-2 text-sm text-purple-700">
            <p><strong>Event:</strong> {eventData.name}</p>
            <p><strong>Type:</strong> {eventTypes.find(t => t.id === eventData.type)?.name}</p>
            <p><strong>Date:</strong> {eventData.date} {eventData.time && `at ${eventData.time}`}</p>
            <p><strong>Location:</strong> {eventData.city}</p>
            <p><strong>Guests:</strong> {eventData.guestCount}</p>
            
            {/* Location search area - feature flagged */}
            {locationFiltersEnabled && eventData.location?.zipcode && (
              <p><strong>Search Area:</strong>{' '}
                {eventData.location.zipOnly
                  ? `ZIP code ${eventData.location.zipcode} only`
                  : `${eventData.location.radiusMiles} miles around ZIP ${eventData.location.zipcode}`}
              </p>
            )}
            
            <p><strong>Venue Types:</strong> {eventData.preferredVenueTypes.join(', ')}</p>
            <p><strong>Core Services:</strong> {eventData.neededCoreServices.join(', ')}</p>
            {eventData.neededExtras.length > 0 && (
              <p><strong>Add-Ons:</strong> {eventData.neededExtras.join(', ')}</p>
            )}
            
            {/* Budget summary - feature flagged */}
            {budgetEnabled && eventData.budget?.target && (
              <p><strong>Target Budget:</strong> ${eventData.budget.target.toLocaleString()} {eventData.budget.currency}</p>
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">What's Next?</h5>
          <p className="text-sm text-blue-700">
            We'll create your event and take you to the Step-by-Step planning workspace where you can:
          </p>
          <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
            <li>Find and compare venues based on your preferences</li>
            <li>Match with specialized vendors for your services</li>
            <li>Track your budget and manage expenses</li>
            <li>Plan your timeline and coordinate details</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCategoryStep = () => {
    if (!eventData.type) return null;

    if (shouldShowCulturalStyles(eventData.type)) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Cultural Style (Optional)
            </label>
            <p className="text-sm text-gray-600 mb-6">
              Select cultural styles that match your event. We'll use this to find specialized vendors.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CULTURAL_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => handleCategorySpecificToggle('culturalStyle', style.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    eventData.categorySpecific.culturalStyle.includes(style.id)
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : `border-gray-300 hover:border-gray-400 ${style.color}`
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{style.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{style.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{style.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const replaceWith = getReplaceWith(eventData.type);
    
    if (replaceWith === 'Event Format') {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Event Format (Optional)
            </label>
            <p className="text-sm text-gray-600 mb-6">
              What type of corporate event are you planning?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EVENT_FORMATS.map((format) => (
                <div
                  key={format.id}
                  onClick={() => handleCategorySpecificToggle('themeOrFormat', format.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    eventData.categorySpecific.themeOrFormat.includes(format.id)
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : `border-gray-300 hover:border-gray-400 ${format.color}`
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{format.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{format.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{format.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (replaceWith === 'Theme') {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Theme (Optional)
            </label>
            <p className="text-sm text-gray-600 mb-6">
              Choose a theme that reflects your event's style and atmosphere.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEME_OPTIONS.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => handleCategorySpecificToggle('themeOrFormat', theme.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    eventData.categorySpecific.themeOrFormat.includes(theme.id)
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : `border-gray-300 hover:border-gray-400 ${theme.color}`
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{theme.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{theme.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{theme.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (replaceWith === 'Describe') {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Event (Optional)
            </label>
            <textarea
              value={eventData.categorySpecific.themeOrFormat.join(', ')}
              onChange={(e) => setEventData(prev => ({
                ...prev,
                categorySpecific: {
                  ...prev.categorySpecific,
                  themeOrFormat: e.target.value ? [e.target.value] : []
                }
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Tell us more about your event style and what makes it special..."
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-1 text-sm text-gray-600">
            Let's gather your event preferences to help you plan the perfect event
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

          {currentStep < steps.length ? (
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
              Create Event & Start Planning
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEventWizard;