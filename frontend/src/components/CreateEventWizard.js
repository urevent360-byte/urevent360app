import React, { useState, useMemo, useCallback } from 'react';
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

// Move constant arrays outside component to prevent re-creation on every render
const EVENT_TYPES = [
  { id: 'wedding', name: 'Wedding', desc: 'Celebrate your special day', icon: '💍' },
  { id: 'quinceanera', name: 'Quinceañera', desc: 'Celebrate the transition to womanhood', icon: '👑' },
  { id: 'sweet_16', name: 'Sweet 16', desc: 'Celebrate the milestone birthday', icon: '🎂' },
  { id: 'mitzvah', name: 'Bar/Bat Mitzvah', desc: 'Jewish coming of age ceremony', icon: '🕯️' },
  { id: 'corporate', name: 'Corporate Event', desc: 'Business meetings and conferences', icon: '🏢' },
  { id: 'birthday', name: 'Birthday Party', desc: 'Celebrate another year of life', icon: '🎉' },
  { id: 'anniversary', name: 'Anniversary', desc: 'Commemorate special milestones', icon: '💕' },
  { id: 'graduation', name: 'Graduation', desc: 'Academic achievement celebrations', icon: '🎓' },
  { id: 'baby_shower', name: 'Baby Shower', desc: 'Welcome the new arrival', icon: '👶' },
  { id: 'retirement', name: 'Retirement Party', desc: 'Celebrate career achievements', icon: '🏖️' },
  { id: 'other', name: 'Other', desc: 'Custom event type', icon: '🎭' }
];

// Wedding-specific service groupings
const CEREMONY_SERVICES = [
  'Officiant',
  'Ceremony Music/Sound',
  'Ceremony Arch/Altar',
  'Ceremony Seating/Chairs', 
  'Ceremony Décor',
  'Aisle Runner',
  'Sound System for Vows'
];

const RECEPTION_SERVICES = [
  'Catering', // Now with subcategories: Full-Service, Appetizers only, Specialty Stations
  'Bar Service',
  'DJ/Band',
  'Photography/Videography',
  'Reception Lighting',
  'Day-of Coordination',
  'Cakes' // Generalized for all event types (Wedding/Birthday/Quince)
];

const CEREMONY_EXTRAS = [
  'Flower Petals/Confetti',
  'Unity Candle/Sand',
  'Guest Book Station',
  'Ring Bearer Pillow',
  'Ceremony Programs'
];

const RECEPTION_EXTRAS = [
  'Dessert Stations & Sweets', // New comprehensive sweets category
  'Dance Floor', // Moved from Reception Services to Extras
  'Special Lighting Effects',
  'Photo Booth',
  'Lounge Areas',
  'Late Night Snacks'
];

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
    // Service subcategories (for Catering, Cakes, etc.)
    serviceSubcategories: {
      catering: [], // Will store: Full-Service, Appetizers, or Specialty Stations
      cateringStations: [], // Will store specific stations if Specialty Stations selected
      cakes: [] // Will store: Wedding Cake, Birthday Cake, etc.
    },
    
    // Extended location preferences (legacy)
    location: {
      city: '',
      zipcode: '',
      zipOnly: false,
      radiusMiles: 25
    },
    
    // Unified location preferences (new)
    location_preferences: {
      city: '',
      zipcode: '',
      zipOnly: false,
      radiusMiles: 25
    },
    
    // Wedding-specific: Ceremony location (optional)
    ceremonyLocation: {
      city: '',
      zipcode: '',
      address: '',
      sameAsReception: true // Default toggle ON
    },
    
    // Wedding-specific: Space preferences
    spacePreferences: {
      needCeremonySpace: false,
      needReceptionSpace: true, // Default ON for weddings
      preferOneVenue: false // Prefer one venue for both
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
      themeOrFormat: [],
      mitzvahType: '' // For Bar/Bat Mitzvah selection
    },
    neededCoreServices: [],
    neededExtras: []
  });

  // Memoize computed values (not functions) to prevent circular dependencies
  const categoryStepName = useMemo(() => {
    if (!eventData.type) return 'Category Style';
    if (shouldShowCulturalStyles(eventData.type)) return 'Cultural Style';
    const replaceWith = getReplaceWith(eventData.type);
    return replaceWith || 'Category Style';
  }, [eventData.type]);

  const categoryStepDesc = useMemo(() => {
    if (!eventData.type) return 'Style preferences';
    if (shouldShowCulturalStyles(eventData.type)) return 'Cultural preferences';
    return 'Theme and format';
  }, [eventData.type]);

  const shouldShowCategory = useMemo(() => {
    return eventData.type !== '';
  }, [eventData.type]);

  // Memoize the steps array using computed values (not function calls) to prevent infinite re-renders
  const steps = useMemo(() => {
    const baseSteps = [
      { id: 1, name: 'Basic Info', desc: 'Event details' },
      { id: 2, name: 'Event Type', desc: 'What kind of event' },
      { 
        id: 3, 
        name: categoryStepName,
        desc: categoryStepDesc,
        condition: shouldShowCategory
      },
      { id: 4, name: 'Venue Preferences', desc: 'Where you want to host' },
      { id: 5, name: 'Services Needed', desc: 'What help you need' },
      { id: 6, name: 'Guest Count', desc: 'Event size' }
    ];

    // Add budget step conditionally
    const budgetStepEnabled = process.env.REACT_APP_FEATURE_WIZARD_BUDGET === 'true';
    const budgetStep = { id: 7, name: 'Budget', desc: 'Target budget' };
    
    const allSteps = budgetStepEnabled 
      ? [...baseSteps, budgetStep]
      : baseSteps;
    
    return allSteps.filter(step => !step.condition || step.condition);
  }, [categoryStepName, categoryStepDesc, shouldShowCategory]); // Use computed values as dependencies

  // Memoize all event handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback((e) => {
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
      // Handle city synchronization in a single state update
      if (name === 'city') {
        setEventData(prev => ({
          ...prev,
          [name]: value,
          location: {
            ...prev.location,
            city: value
          }
        }));
      } else {
        setEventData(prev => ({ ...prev, [name]: value }));
      }
    }
    setError('');
  }, []);

  const handleLocationChange = useCallback((locationData) => {
    setEventData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        ...locationData
      }
    }));
    setError('');
  }, []);

  const handleBudgetChange = useCallback((budgetData) => {
    setEventData(prev => ({
      ...prev,
      budget: budgetData
    }));
    setError('');
  }, []);

  const handleArrayToggle = useCallback((arrayName, value) => {
    setEventData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].includes(value)
        ? prev[arrayName].filter(item => item !== value)
        : [...prev[arrayName], value]
    }));
  }, []);
  // Memoize specific handlers for complex nested structures
  const handleSpacePreferenceChange = useCallback((field) => (e) => {
    setEventData(prev => ({
      ...prev,
      spacePreferences: {
        ...prev.spacePreferences,
        [field]: e.target.checked
      }
    }));
  }, []);

  const handleCeremonyLocationChange = useCallback((field) => (e) => {
    setEventData(prev => ({
      ...prev,
      ceremonyLocation: {
        ...prev.ceremonyLocation,
        [field]: e.target.value
      }
    }));
  }, []);

  const handleSameAsReceptionChange = useCallback((e) => {
    setEventData(prev => ({
      ...prev,
      ceremonyLocation: {
        ...prev.ceremonyLocation,
        sameAsReception: e.target.checked,
        // Clear ceremony location if toggling back to same
        city: e.target.checked ? '' : prev.ceremonyLocation.city,
        zipcode: e.target.checked ? '' : prev.ceremonyLocation.zipcode,
        address: e.target.checked ? '' : prev.ceremonyLocation.address
      }
    }));
  }, []);

  const handleServiceSubcategoryToggle = useCallback((category, item) => {
    setEventData(prev => ({
      ...prev,
      serviceSubcategories: {
        ...prev.serviceSubcategories,
        [category]: prev.serviceSubcategories[category].includes(item)
          ? prev.serviceSubcategories[category].filter(i => i !== item)
          : [...prev.serviceSubcategories[category], item]
      }
    }));
  }, []);

  const handleThemeOrFormatChange = useCallback((e) => {
    setEventData(prev => ({
      ...prev,
      categorySpecific: {
        ...prev.categorySpecific,
        themeOrFormat: e.target.value ? [e.target.value] : []
      }
    }));
  }, []);

  const handleCategorySpecificToggle = useCallback((type, value) => {
    setEventData(prev => ({
      ...prev,
      categorySpecific: {
        ...prev.categorySpecific,
        [type]: prev.categorySpecific[type].includes(value)
          ? prev.categorySpecific[type].filter(item => item !== value)
          : [...prev.categorySpecific[type], value]
      }
    }));
  }, []);

  // Memoized handler for unified location changes
  const handleUnifiedLocationChange = useCallback((locationData) => {
    // Update both city (for backward compatibility) and location_preferences (unified)
    setEventData(prev => ({
      ...prev,
      city: locationData.city || prev.city,
      location_preferences: {
        ...prev.location_preferences,
        ...locationData
      }
    }));
    setError('');
  }, []);

  // Memoized handlers for specific array toggles to avoid inline functions
  const handlePreferredVenueTypeToggle = useCallback((venue) => {
    handleArrayToggle('preferredVenueTypes', venue);
  }, [handleArrayToggle]);

  const handleCoreServiceToggle = useCallback((service) => {
    handleArrayToggle('neededCoreServices', service);
  }, [handleArrayToggle]);

  const handleExtraToggle = useCallback((extra) => {
    handleArrayToggle('neededExtras', extra);
  }, [handleArrayToggle]);

  // Memoized handlers for service subcategory toggles
  const handleCateringToggle = useCallback((type) => {
    handleServiceSubcategoryToggle('catering', type);
  }, [handleServiceSubcategoryToggle]);

  const handleCateringStationToggle = useCallback((station) => {
    handleServiceSubcategoryToggle('cateringStations', station);
  }, [handleServiceSubcategoryToggle]);

  const handleCakeToggle = useCallback((cakeType) => {
    handleServiceSubcategoryToggle('cakes', cakeType);
  }, [handleServiceSubcategoryToggle]);

  // Memoized handlers for step navigation
  const handleGoToStep1 = useCallback(() => {
    setCurrentStep(1);
  }, []);

  const handleGoToStep4 = useCallback(() => {
    setCurrentStep(4);
  }, []);

  // Memoized handlers for event type selection
  const handleEventTypeChange = useCallback((typeId) => {
    handleInputChange({ target: { name: 'type', value: typeId } });
  }, [handleInputChange]);

  // Memoized handlers for Mitzvah type selection
  const handleBarMitzvahSelect = useCallback(() => {
    setEventData(prev => ({
      ...prev,
      mitzvahType: 'bar_mitzvah',
      categorySpecific: {
        ...prev.categorySpecific,
        mitzvahType: 'bar_mitzvah'
      }
    }));
  }, []);

  const handleBatMitzvahSelect = useCallback(() => {
    setEventData(prev => ({
      ...prev,
      mitzvahType: 'bat_mitzvah',
      categorySpecific: {
        ...prev.categorySpecific,
        mitzvahType: 'bat_mitzvah'
      }
    }));
  }, []);

  // Memoized handlers for category specific toggles
  const handleCulturalStyleToggle = useCallback((styleId) => {
    handleCategorySpecificToggle('culturalStyle', styleId);
  }, [handleCategorySpecificToggle]);

  const handleThemeOrFormatToggle = useCallback((formatId) => {
    handleCategorySpecificToggle('themeOrFormat', formatId);
  }, [handleCategorySpecificToggle]);

  const validateStep = (step) => {
    switch (step) {
      case 1:
        // Check event name is filled
        if (!eventData.name.trim()) return false;
        
        // Check location based on feature flag
        if (process.env.REACT_APP_WIZARD_LOCATION_UNIFIED === 'true') {
          // For unified location: require either city or zipcode
          return (eventData.location_preferences?.city?.trim() || eventData.location_preferences?.zipcode?.trim() || eventData.city?.trim()) !== '';
        } else {
          // Legacy: require city
          return eventData.city.trim() !== '';
        }
      case 2:
        return eventData.type !== '' && eventData.date !== '';
      case 3:
        // Category step - require Mitzvah type for Mitzvah ceremonies
        if (eventData.type === 'mitzvah') {
          return eventData.mitzvahType !== '' || eventData.categorySpecific?.mitzvahType !== '';
        }
        // Other event types - category is optional
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
      
      // Generate idempotency key based on wizard session to prevent duplicates
      const idempotencyKey = `wizard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const submitData = {
        name: eventData.name,
        event_type: eventData.type,
        date: eventDateTime.toISOString(),
        location: eventData.city, // Keep backward compatibility
        guest_count: parseInt(eventData.guestCount),
        status: 'planning',
        
        // Mitzvah type (for Bar/Bat Mitzvah)
        mitzvah_type: eventData.mitzvahType || eventData.categorySpecific?.mitzvahType || null,
        
        // Wedding-specific: Ceremony location
        ceremony_location: eventData.type === 'wedding' && !eventData.ceremonyLocation?.sameAsReception ? {
          city: eventData.ceremonyLocation?.city || null,
          zipcode: eventData.ceremonyLocation?.zipcode || null,
          address: eventData.ceremonyLocation?.address || null
        } : null,
        
        // Wedding-specific: Space preferences  
        space_preferences: eventData.type === 'wedding' ? {
          need_ceremony_space: !!eventData.spacePreferences?.needCeremonySpace,
          need_reception_space: !!eventData.spacePreferences?.needReceptionSpace,
          prefer_one_venue: !!eventData.spacePreferences?.preferOneVenue
        } : null,
        
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
        
        // Service subcategories for enhanced vendor matching
        service_subcategories: eventData.serviceSubcategories,
        
        category_specific: eventData.categorySpecific,
        
        // Complete wizard answers for Event Summary Card (single source of truth)
        wizard_answers: {
          // Basic Info (Step 1)
          event_name: eventData.name,
          location_city: eventData.city,
          location_preferences: {
            city: eventData.location.city || eventData.city,
            zipcode: eventData.location.zipcode,
            zip_only: !!eventData.location.zipOnly,
            radius_miles: eventData.location.radiusMiles || 25
          },
          
          // Event Type & Category (Steps 2-3)
          event_type: eventData.type,
          date: eventData.date,
          time: eventData.time,
          mitzvah_type: eventData.mitzvahType || eventData.categorySpecific?.mitzvahType,
          cultural_style: eventData.categorySpecific?.culturalStyle || [],
          theme_or_format: eventData.categorySpecific?.themeOrFormat || [],
          
          // Venue Preferences (Step 4)
          preferred_venue_types: eventData.preferredVenueTypes,
          ceremony_location: eventData.ceremonyLocation,
          space_preferences: eventData.spacePreferences,
          
          // Services (Step 5)
          needed_core_services: eventData.neededCoreServices,
          needed_extras: eventData.neededExtras,
          service_subcategories: eventData.serviceSubcategories,
          
          // Guest Count (Step 6)
          guest_count: parseInt(eventData.guestCount),
          
          // Budget (Step 7)
          budget_target: eventData.budget?.target,
          budget_currency: eventData.budget?.currency || 'USD',
          
          // Wizard completion metadata
          wizard_completed_at: new Date().toISOString(),
          wizard_version: '2.0'
        }
      };

      // Set up timeout warning for long requests
      const timeoutWarning = setTimeout(() => {
        if (loading) {
          setError('Still working… this can take a moment.');
        }
      }, 8000);

      const response = await axios.post(`${API}/events`, submitData, {
        headers: {
          ...getAuthHeaders(),
          'Idempotency-Key': idempotencyKey
        },
        timeout: 30000 // 30 second timeout
      });
      
      // Clear the timeout warning if request completes
      clearTimeout(timeoutWarning);
      
      console.log('🎯 Event creation successful, preparing redirect...');
      console.log('📊 Response data:', response.data);
      
      // Log successful event creation telemetry
      console.log('📊 event_created:', {
        id: response.data.id,
        date: eventData.date,
        city: eventData.city || eventData.location?.city,
        guests: eventData.guestCount,
        targetBudget: eventData.budget?.target,
        eventType: eventData.type,
        timestamp: new Date().toISOString()
      });
      
      // Show success message during navigation
      setError(''); // Clear any existing errors
      
      console.log('🎯 Initiating navigation to Event Profile...');
      alert('🎯 API call successful! Attempting redirect...');
      
      // Redirect to Event Profile (Overview) - this is the EventDashboard at /planning route
      // Add optional query parameter to auto-open Step-by-Step mode on first visit
      const redirectUrl = `/events/${response.data.id}/planning?openPlanner=1`;
      
      console.log('🎯 Redirect URL:', redirectUrl);
      alert(`🎯 Redirecting to: ${redirectUrl}`);
      
      try {
        navigate(redirectUrl, { 
          state: { 
            fromWizard: true, 
            showMessage: 'Event created. Taking you to the planner…',
            eventData: response.data
          } 
        });
        
        console.log('🎯 Navigate function called successfully');
        alert('🎯 Navigate function called!');
      } catch (navError) {
        console.error('❌ Navigation error:', navError);
        alert(`❌ Navigation error: ${navError.message}`);
        // Fallback to window.location if navigate fails
        console.log('🔄 Trying fallback navigation...');
        alert('🔄 Trying fallback navigation...');
        window.location.href = redirectUrl;
      }
      
      // Log redirect telemetry
      console.log('📊 redirect_to_event_overview:', {
        eventId: response.data.id,
        targetUrl: redirectUrl,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.log('📊 event_create_failed:', {
        status: err.response?.status || 'network_error',
        reason: err.response?.data?.detail || err.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      // Handle authentication errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Session expired. Please sign in again.');
        // Could redirect to login here, but keeping user in wizard for now
        return;
      }
      
      // Handle timeout errors
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your connection and try again.');
        return;
      }
      
      // Handle other errors
      if (err.response?.status >= 500) {
        setError('Server error. Please try again in a moment.');
      } else if (err.response?.status >= 400) {
        setError(err.response?.data?.detail || 'Could not create the event. Please try again.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
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

            {/* Unified Location Controls - Feature Flagged */}
            {process.env.REACT_APP_WIZARD_LOCATION_UNIFIED === 'true' ? (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Location & Search Preferences</h4>
                <LocationSection
                  value={{
                    city: eventData.city || eventData.location_preferences?.city,
                    zipcode: eventData.location_preferences?.zipcode,
                    zipOnly: eventData.location_preferences?.zipOnly,
                    radiusMiles: eventData.location_preferences?.radiusMiles,
                  }}
                  onChange={handleUnifiedLocationChange}
                />
              </div>
            ) : (
              /* Legacy City Input */
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
            )}
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
                {EVENT_TYPES.map((type) => {
                  const config = EVENT_FLOW_CONFIG[type.id];
                  const showCultural = config?.showCulturalStyles;
                  
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleEventTypeChange(type.id)}
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
            {/* Wedding-Specific: Space Preferences (only for weddings) */}
            {eventData.type === 'wedding' && (
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💒</span>
                  Wedding Space Preferences
                </h4>
                
                <div className="space-y-4">
                  {/* Space needs checkboxes */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Which spaces do you need?</p>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={eventData.spacePreferences.needCeremonySpace}
                          onChange={handleSpacePreferenceChange('needCeremonySpace')}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">Need ceremony space</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={eventData.spacePreferences.needReceptionSpace}
                          onChange={handleSpacePreferenceChange('needReceptionSpace')}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-700">Need reception space</span>
                      </label>
                    </div>
                  </div>

                  {/* Prefer one venue toggle */}
                  {(eventData.spacePreferences.needCeremonySpace && eventData.spacePreferences.needReceptionSpace) && (
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={eventData.spacePreferences.preferOneVenue}
                          onChange={handleSpacePreferenceChange('preferOneVenue')}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Prefer one venue for both</span>
                      </label>
                      
                      {eventData.spacePreferences.preferOneVenue && (
                        <div className="mt-2 ml-6 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-700">
                            📍 <strong>Note:</strong> We'll only show venues that offer both ceremony + reception spaces.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Preferred Venue Types * (Select all that interest you)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                We'll use these preferences to find the best venues for you in the next step.
              </p>
              
              {/* Helper text for Restaurant selection */}
              {eventData.preferredVenueTypes.includes('Restaurant') && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Restaurant selected:</strong> This option is for intimate celebrations and private rooms. 
                    We'll show per-person pricing and live availability.
                  </p>
                </div>
              )}
              
              {/* Helper text for Short-Term Rental selection */}
              {eventData.preferredVenueTypes.includes('Short-Term Rental (Airbnb/VRBO)') && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Short-Term Rental selected:</strong> We'll show homes and condos that explicitly allow events or gatherings.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {PREFERRED_VENUE_TYPES.map((venue) => {
                  // Add tooltips for specific venue types
                  const getVenueTooltip = (venueType) => {
                    switch(venueType) {
                      case 'Restaurant':
                        return 'For intimate celebrations and private dining rooms';
                      case 'Short-Term Rental (Airbnb/VRBO)':
                        return 'Homes/condos that explicitly allow small events or gatherings';
                      default:
                        return null;
                    }
                  };
                  
                  const tooltip = getVenueTooltip(venue);
                  
                  return (
                    <label 
                      key={venue} 
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer relative group"
                      title={tooltip}
                    >
                      <input
                        type="checkbox"
                        checked={eventData.preferredVenueTypes.includes(venue)}
                        onChange={() => handlePreferredVenueTypeToggle(venue)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">{venue}</span>
                      
                      {/* Tooltip for specific venue types */}
                      {tooltip && (
                        <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
                          {tooltip}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Location Search Controls - Only show if unified flag is OFF */}
            {process.env.REACT_APP_WIZARD_LOCATION_UNIFIED === 'true' ? (
              /* Show read-only location preview when unified flag is enabled */
              eventData.location_preferences && (eventData.location_preferences.city || eventData.location_preferences.zipcode) ? (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Search Area</h5>
                      <p className="text-sm text-gray-600">
                        {eventData.location_preferences.zipOnly
                          ? `ZIP-only ${eventData.location_preferences.zipcode || '—'}`
                          : `${eventData.location_preferences.radiusMiles || 25} miles around ${eventData.location_preferences.zipcode || eventData.location_preferences.city || 'selected location'}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoToStep1}
                      className="text-purple-600 hover:text-purple-700 text-sm underline"
                    >
                      Edit in Step 1
                    </button>
                  </div>
                </div>
              ) : null
            ) : (
              /* Legacy Location Search Controls */
              process.env.REACT_APP_FEATURE_WIZARD_LOCATION_FILTERS === 'true' && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Location Search Preferences</h4>
                  <VenueSearchControls
                    value={eventData.location}
                    onChange={handleLocationChange}
                  />
                </div>
              )
            )}

            {/* Wedding-Specific: Ceremony Location (only show for weddings) */}
            {eventData.type === 'wedding' && (
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💒</span>
                  Ceremony Location (Optional)
                </h4>
                
                {/* Same location toggle */}
                <div className="mb-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={eventData.ceremonyLocation.sameAsReception}
                      onChange={handleSameAsReceptionChange}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Same location as reception
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Turn off to set a different ceremony location
                  </p>
                </div>

                {/* Ceremony location fields (only when toggle is OFF) */}
                {!eventData.ceremonyLocation.sameAsReception && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ceremony City/Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          value={eventData.ceremonyLocation.city}
                          onChange={handleCeremonyLocationChange('city')}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Ceremony city or location"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ceremony ZIP Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={eventData.ceremonyLocation.zipcode}
                          onChange={handleCeremonyLocationChange('zipcode')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="ZIP code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ceremony Address (Optional)
                        </label>
                        <input
                          type="text"
                          value={eventData.ceremonyLocation.address}
                          onChange={handleCeremonyLocationChange('address')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Street address or venue name"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">💡 Tip:</span> Setting a ceremony location helps us find venues and vendors near both your ceremony and reception locations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {eventData.type === 'wedding' ? (
              /* Wedding-specific grouped services */
              <div className="space-y-6">
                {/* Show ceremony services if ceremony space is needed */}
                {eventData.spacePreferences?.needCeremonySpace && (
                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">💒</span>
                      Ceremony Services
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Services needed for your wedding ceremony
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CEREMONY_SERVICES.map((service) => (
                        <label key={service} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={eventData.neededCoreServices.includes(service)}
                            onChange={() => handleCoreServiceToggle(service)}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 rounded"
                          />
                          <span className="ml-3 text-sm text-gray-700">{service}</span>
                        </label>
                      ))}
                    </div>

                    {/* Ceremony extras */}
                    <div className="mt-6">
                      <h5 className="text-md font-medium text-gray-900 mb-3">Ceremony Extras (Optional)</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CEREMONY_EXTRAS.map((extra) => (
                          <label key={extra} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={eventData.neededExtras.includes(extra)}
                              onChange={() => handleExtraToggle(extra)}
                              className="h-4 w-4 text-pink-600 focus:ring-pink-500 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-700">{extra}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show reception services if reception space is needed */}
                {eventData.spacePreferences?.needReceptionSpace && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🎉</span>
                      Reception Services
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Services needed for your wedding reception
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {RECEPTION_SERVICES.map((service) => (
                        <div key={service}>
                          <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={eventData.neededCoreServices.includes(service)}
                              onChange={() => handleCoreServiceToggle(service)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                            />
                            <div className="ml-3">
                              <span className="text-sm text-gray-700 font-medium">{service}</span>
                              {/* Service help text */}
                              {service === 'Catering' && (
                                <p className="text-xs text-gray-500 mt-1">Full-Service, Appetizers only, or Specialty Food Stations</p>
                              )}
                              {service === 'Cakes' && (
                                <p className="text-xs text-gray-500 mt-1">Wedding, Birthday, Quinceañera, or Custom designs</p>
                              )}
                              {service === 'Bar Service' && (
                                <p className="text-xs text-gray-500 mt-1">Full bar, beer & wine, or signature cocktails</p>
                              )}
                              {service === 'DJ/Band' && (
                                <p className="text-xs text-gray-500 mt-1">Music and entertainment for your reception</p>
                              )}
                              {service === 'Photography/Videography' && (
                                <p className="text-xs text-gray-500 mt-1">Professional photo and video services</p>
                              )}
                              {service === 'Reception Lighting' && (
                                <p className="text-xs text-gray-500 mt-1">Uplighting, wash lighting, and ambiance</p>
                              )}
                              {service === 'Day-of Coordination' && (
                                <p className="text-xs text-gray-500 mt-1">Professional coordination on your event day</p>
                              )}
                            </div>
                          </label>

                          {/* Catering Subcategories */}
                          {service === 'Catering' && eventData.neededCoreServices.includes('Catering') && (
                            <div className="mt-3 ml-6 p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-sm font-medium text-gray-900 mb-2">Catering Type:</p>
                              <div className="space-y-2">
                                {['Full-Service Catering', 'Appetizers / Small Bites only', 'Specialty Food Stations'].map((type) => (
                                  <label key={type} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={eventData.serviceSubcategories.catering.includes(type)}
                                      onChange={() => handleCateringToggle(type)}
                                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                                  </label>
                                ))}
                              </div>

                              {/* Specialty Stations Sub-selection */}
                              {eventData.serviceSubcategories.catering.includes('Specialty Food Stations') && (
                                <div className="mt-3 p-2 bg-white border border-gray-200 rounded">
                                  <p className="text-xs font-medium text-gray-900 mb-2">Select Stations:</p>
                                  <div className="grid grid-cols-2 gap-1">
                                    {['Sushi', 'Charcuterie/Cheese', 'Fruit', 'Taco', 'Pasta', 'Carving', 'Seafood/Raw Bar', 'Ceviche'].map((station) => (
                                      <label key={station} className="flex items-center">
                                        <input
                                          type="checkbox"
                                          checked={eventData.serviceSubcategories.cateringStations.includes(station)}
                                          onChange={() => handleCateringStationToggle(station)}
                                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 rounded"
                                        />
                                        <span className="ml-1 text-xs text-gray-600">{station}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cakes Subcategories */}
                          {service === 'Cakes' && eventData.neededCoreServices.includes('Cakes') && (
                            <div className="mt-3 ml-6 p-3 bg-pink-50 border border-pink-200 rounded">
                              <p className="text-sm font-medium text-gray-900 mb-2">Cake Type:</p>
                              <div className="space-y-2">
                                {(eventData.type === 'wedding' ? ['Wedding Cake', 'Custom Designs', 'Cupcakes', 'Macarons'] :
                                 eventData.type === 'birthday' ? ['Birthday Cake', 'Custom Designs', 'Cupcakes'] :
                                 eventData.type === 'quinceanera' ? ['Quinceañera Cake', 'Custom Designs', 'Cupcakes'] :
                                 ['Custom Cake', 'Cupcakes', 'Macarons']
                                ).map((cakeType) => (
                                  <label key={cakeType} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={eventData.serviceSubcategories.cakes.includes(cakeType)}
                                      onChange={() => handleCakeToggle(cakeType)}
                                      className="h-3 w-3 text-pink-600 focus:ring-pink-500 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{cakeType}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Reception extras */}
                    <div className="mt-6">
                      <h5 className="text-md font-medium text-gray-900 mb-3">Reception Extras (Optional)</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {RECEPTION_EXTRAS.map((extra) => (
                          <label key={extra} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={eventData.neededExtras.includes(extra)}
                              onChange={() => handleExtraToggle(extra)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                            />
                            <div className="ml-3">
                              <span className="text-sm text-gray-700 font-medium">{extra}</span>
                              {/* Extras help text */}
                              {extra === 'Dessert Stations & Sweets' && (
                                <p className="text-xs text-gray-500 mt-1">Dessert table, candy bar, donut wall, ice-cream cart, chocolate fountain</p>
                              )}
                              {extra === 'Dance Floor' && (
                                <p className="text-xs text-gray-500 mt-1">Professional dance flooring rental</p>
                              )}
                              {extra === 'Special Lighting Effects' && (
                                <p className="text-xs text-gray-500 mt-1">Cold sparks, dancing on clouds, spotlights, and FX</p>
                              )}
                              {extra === 'Photo Booth' && (
                                <p className="text-xs text-gray-500 mt-1">Interactive photo booth with props and prints</p>
                              )}
                              {extra === 'Lounge Areas' && (
                                <p className="text-xs text-gray-500 mt-1">Comfortable seating and lounge furniture rental</p>
                              )}
                              {extra === 'Late Night Snacks' && (
                                <p className="text-xs text-gray-500 mt-1">Light bites and snacks for later in the evening</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* If neither ceremony nor reception space is selected, show general message */}
                {!eventData.spacePreferences?.needCeremonySpace && !eventData.spacePreferences?.needReceptionSpace && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Please select ceremony or reception spaces in Step 4 to see relevant services.
                    </p>
                    <button
                      type="button"
                      onClick={handleGoToStep4}
                      className="mt-2 text-purple-600 hover:text-purple-700 underline"
                    >
                      Go back to Step 4
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Default services for non-wedding events */
              <div>
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
                          onChange={() => handleCoreServiceToggle(service)}
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
                          onChange={() => handleExtraToggle(extra)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">{extra}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
            <p><strong>Type:</strong> {EVENT_TYPES.find(t => t.id === eventData.type)?.name}
              {eventData.type === 'mitzvah' && (eventData.mitzvahType || eventData.categorySpecific?.mitzvahType) && (
                <span className="text-sm ml-1">
                  ({(eventData.mitzvahType || eventData.categorySpecific?.mitzvahType) === 'bar_mitzvah' ? 'Bar Mitzvah - Boy' : 'Bat Mitzvah - Girl'})
                </span>
              )}
            </p>
            <p><strong>Date:</strong> {eventData.date} {eventData.time && `at ${eventData.time}`}</p>
            <p><strong>Location:</strong> {
              process.env.REACT_APP_WIZARD_LOCATION_UNIFIED === 'true' 
                ? (eventData.location_preferences?.city || eventData.city || eventData.location_preferences?.zipcode || 'Not specified')
                : eventData.city
            } <span className="text-xs">(Reception)</span></p>
            
            {/* Wedding-specific: Show ceremony location if different */}
            {eventData.type === 'wedding' && !eventData.ceremonyLocation?.sameAsReception && (
              eventData.ceremonyLocation?.city || eventData.ceremonyLocation?.zipcode || eventData.ceremonyLocation?.address
            ) && (
              <p><strong>Ceremony Location:</strong> {
                eventData.ceremonyLocation.address 
                  ? eventData.ceremonyLocation.address 
                  : (eventData.ceremonyLocation.city || eventData.ceremonyLocation.zipcode)
              }</p>
            )}
            
            {/* Wedding-specific: Show space needs */}
            {eventData.type === 'wedding' && (eventData.spacePreferences?.needCeremonySpace || eventData.spacePreferences?.needReceptionSpace) && (
              <p><strong>Spaces Needed:</strong>{' '}
                {[
                  eventData.spacePreferences.needCeremonySpace && 'Ceremony',
                  eventData.spacePreferences.needReceptionSpace && 'Reception'
                ].filter(Boolean).join(' + ')}
                {eventData.spacePreferences.preferOneVenue && (
                  <span className="text-xs ml-1">(Prefer one venue for both)</span>
                )}
              </p>
            )}

            <p><strong>Guests:</strong> {eventData.guestCount}</p>
            
            {/* Unified Location Search Area */}
            {process.env.REACT_APP_WIZARD_LOCATION_UNIFIED === 'true' && (eventData.location_preferences?.zipcode || eventData.location_preferences?.city) && (
              <p><strong>Search Area:</strong>{' '}
                {eventData.location_preferences.zipOnly && eventData.location_preferences.zipcode
                  ? `ZIP-only ${eventData.location_preferences.zipcode}`
                  : eventData.location_preferences.zipcode
                    ? `${eventData.location_preferences.radiusMiles || 25} miles around ZIP ${eventData.location_preferences.zipcode}`
                    : `${eventData.location_preferences.radiusMiles || 25} miles around ${eventData.location_preferences.city}`}
              </p>
            )}
            
            {/* Legacy Location search area - feature flagged */}
            {process.env.REACT_APP_WIZARD_LOCATION_UNIFIED !== 'true' && locationFiltersEnabled && eventData.location?.zipcode && (
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

    // Special case for Mitzvah ceremonies - show boy/girl selection
    if (eventData.type === 'mitzvah') {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Mitzvah Type <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-6">
              Please specify if this is for a boy or girl to help us find the right vendors and traditions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={handleBarMitzvahSelect}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  eventData.mitzvahType === 'bar_mitzvah' || eventData.categorySpecific?.mitzvahType === 'bar_mitzvah'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">👦</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bar Mitzvah</h3>
                    <p className="text-sm text-gray-600 mt-1">For boys (age 13)</p>
                    <p className="text-xs text-gray-500 mt-1">Traditional coming of age ceremony</p>
                  </div>
                </div>
              </div>
              
              <div
                onClick={handleBatMitzvahSelect}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  eventData.mitzvahType === 'bat_mitzvah' || eventData.categorySpecific?.mitzvahType === 'bat_mitzvah'
                    ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-500'
                    : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">👧</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bat Mitzvah</h3>
                    <p className="text-sm text-gray-600 mt-1">For girls (age 12-13)</p>
                    <p className="text-xs text-gray-500 mt-1">Traditional coming of age ceremony</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Display current selection */}
            {(eventData.mitzvahType || eventData.categorySpecific?.mitzvahType) && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ Selected: <strong>
                    {(eventData.mitzvahType || eventData.categorySpecific?.mitzvahType) === 'bar_mitzvah' 
                      ? 'Bar Mitzvah (for boys)' 
                      : 'Bat Mitzvah (for girls)'}
                  </strong>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

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
                  onClick={() => handleCulturalStyleToggle(style.id)}
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
                  onClick={() => handleThemeOrFormatToggle(format.id)}
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
                  onClick={() => handleThemeOrFormatToggle(theme.id)}
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
              onChange={handleThemeOrFormatChange}
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
            <div className="text-center">
              {/* Microcopy helper text */}
              <p className="text-sm text-gray-600 mb-3">
                We'll create your event and take you to your planning workspace.
              </p>
              
              {/* Working purple button - keep exactly as is */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Event → Go to Planner
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEventWizard;