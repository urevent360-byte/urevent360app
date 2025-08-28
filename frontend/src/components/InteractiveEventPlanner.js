import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Search, Plus, Trash2, X, Save, 
  DollarSign, Users, MapPin, Camera, Music, Utensils, 
  Sparkles, UserCheck, Calendar, ShoppingCart, AlertTriangle,
  CheckCircle, Eye, FastForward, RotateCcw, Wine, Zap, User, Edit3, Play,
  Phone, Mail, Wand2, ArrowLeft
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Debug component for location matching
const DebugPlanner = ({ event }) => {
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_MATCHING === 'true') {
      console.log('[Planner] event.location_preferences:', event?.location_preferences);
      console.log('[Planner] event.location:', event?.location);
      console.log('[Planner] event.type:', event?.type, 'guestCount:', event?.guestCount);
      console.log('[Planner] event.preferred_venue_types:', event?.preferred_venue_types);
    }
  }, [event]);
  return null;
};

const InteractiveEventPlanner = ({ eventId, currentEvent, onClose, onPlanSaved, mode = 'new' }) => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [eventData, setEventData] = useState(currentEvent || null);
  const [loading, setLoading] = useState(false);
  const [searchTerms, setSearchTerms] = useState({});
  const [vendors, setVendors] = useState({});
  const [selectedServices, setSelectedServices] = useState({});
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);
  const [budgetData, setBudgetData] = useState({
    set: 0,
    selected: 0,
    remaining: 0
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [planningProgress, setPlanningProgress] = useState({
    selectedVendors: [],
    completedSteps: 0,
    pendingServices: []
  });
  const [currentMode, setCurrentMode] = useState(mode);
  const [selectedVendorForDetails, setSelectedVendorForDetails] = useState(null);
  
  // Questionnaire sync and filter state
  const [questionnaireFilters, setQuestionnaireFilters] = useState({
    preferred_venue_type: '',
    services_needed: [],
    guest_count: 0,
    event_type: '',
    cultural_style: '',
    budget: 0,
    location: '',
    date: ''
  });
  const [isAtHome, setIsAtHome] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [activeQuoteId, setActiveQuoteId] = useState(null);

  // Sync questionnaire data from event (enhanced to use wizard_answers)
  const syncQuestionnaireFilters = (event) => {
    if (!event) return;
    
    // Use wizard_answers if available (new format), otherwise fallback to legacy fields
    const wizardAnswers = event.wizard_answers;
    
    // Enhanced service extraction with debugging
    const coreServices = wizardAnswers?.core_services || wizardAnswers?.needed_core_services || event.needed_core_services || [];
    const extraServices = wizardAnswers?.extras || wizardAnswers?.needed_extras || event.needed_extras || [];
    
    // Debug logging
    console.log('🔍 Event data received:', event);
    console.log('🔍 Wizard answers:', wizardAnswers);
    console.log('🔍 Core services:', coreServices);
    console.log('🔍 Extra services:', extraServices);
    
    const filters = {
      preferred_venue_type: wizardAnswers?.preferred_venue_types?.[0] || event.preferred_venue_type || '',
      services_needed: [...coreServices, ...extraServices],
      core_services: coreServices,
      extras: extraServices,
      guest_count: wizardAnswers?.guest_count || event.guest_count || 0,
      event_type: wizardAnswers?.event_type || event.event_type || '',
      cultural_style: wizardAnswers?.cultural_style?.[0] || event.cultural_style || '',
      budget: wizardAnswers?.budget_target || event.budget_preferences?.target || event.budget || 0,
      location: wizardAnswers?.location_city || event.location || '',
      date: wizardAnswers?.date || event.date || '',
      
      // Additional wizard data for enhanced matching
      venue_types: wizardAnswers?.preferred_venue_types || [],
      service_subcategories: wizardAnswers?.service_subcategories || {},
      theme_format: wizardAnswers?.theme_or_format || [],
      mitzvah_type: wizardAnswers?.mitzvah_type || null
    };
    
    console.log('🎯 Final questionnaire filters:', filters);
    console.log('📋 Total services to display:', filters.services_needed.length);
    console.log('📋 Core services array:', filters.core_services);
    console.log('📋 Extras array:', filters.extras);
    
    setQuestionnaireFilters(filters);
    setIsAtHome(filters.preferred_venue_type === 'at_home' || filters.preferred_venue_type === 'my_own_private_space');
    setAvailableServices(filters.services_needed);
    
    // Initialize budget tracker with target budget
    if (filters.budget > 0) {
      setBudgetData(prev => ({
        ...prev,
        set: filters.budget,
        remaining: filters.budget - prev.selected
      }));
    }
    
    console.log('✅ Questionnaire sync complete - Available services:', filters.services_needed);
  };

  // Enhanced search vendors with questionnaire filters and fallback ladder
  const searchVendorsWithFilters = async (serviceCategory, fallbackLevel = 0) => {
    console.log(`🔍 Searching ${serviceCategory} with filters (fallback level: ${fallbackLevel}):`, questionnaireFilters);
    
    try {
      setLoading(true);
      
      // Use different endpoints for venues vs vendors
      let apiEndpoint = `${API}/vendors/search`;
      let filterParams = {};
      
      if (serviceCategory === 'venue') {
        // Use venue-specific search endpoint with venue-specific parameters
        apiEndpoint = `${API}/venues/search`;
        
        // Extract location data from questionnaire
        const locationData = questionnaireFilters.location_preferences || {};
        
        filterParams = {
          // Location parameters for venue search
          zip_code: locationData.zipcode || null,
          city: questionnaireFilters.location || locationData.city,
          radius: fallbackLevel === 0 ? (locationData.radius_miles || 30) : 
                  fallbackLevel === 1 ? 60 : 
                  fallbackLevel === 2 ? 120 : 180,
          
          // Venue-specific parameters
          venue_type: questionnaireFilters.preferred_venue_type,
          preferred_venue_type: questionnaireFilters.preferred_venue_type,
          capacity_min: Math.floor((questionnaireFilters.guest_count || 0) * 0.8), // 80% of guest count as minimum
          capacity_max: Math.ceil((questionnaireFilters.guest_count || 0) * 1.2), // 120% of guest count as maximum
          
          // Event details
          date: questionnaireFilters.date,
          event_type: questionnaireFilters.event_type,
          
          // Budget (venue search uses different budget structure)
          max_price_per_person: questionnaireFilters.budget ? 
            Math.floor(questionnaireFilters.budget / Math.max(questionnaireFilters.guest_count || 1, 1)) : 
            undefined,
            
          // Cultural style (venues might have cultural preferences)
          cultural_style: fallbackLevel === 0 ? questionnaireFilters.cultural_style : 
                         fallbackLevel === 1 ? '' : undefined,
          
          // Sort and limit
          sort: fallbackLevel === 0 ? 'best_match' : 
                fallbackLevel === 1 ? 'rating' : 'popular',
          limit: 20
        };
        
        console.log('🏛️ Using venue search endpoint with params:', filterParams);
        
      } else {
        // Use vendor search endpoint for all other services
        filterParams = {
          service_type: serviceCategory,
          guest_count: questionnaireFilters.guest_count,
          event_type: questionnaireFilters.event_type,
          location: questionnaireFilters.location,
          date: questionnaireFilters.date,
          budget_per_service: Math.floor((questionnaireFilters.budget || 0) / Math.max((plannerSteps?.length || 3) - 2, 1)),
          
          // Apply fallback ladder for cultural style
          cultural_style: fallbackLevel === 0 ? questionnaireFilters.cultural_style : 
                         fallbackLevel === 1 ? '' : undefined,
          
          // Apply fallback ladder for radius
          radius: fallbackLevel === 0 ? 30 : 
                  fallbackLevel === 1 ? 60 : 
                  fallbackLevel === 2 ? 120 : 180,
          
          // Sort by best match with fallbacks
          sort: fallbackLevel === 0 ? 'best_match' : 
                fallbackLevel === 1 ? 'rating' : 'popular',
                
          // Limit results for performance
          limit: 20
        };
        
        console.log('🛍️ Using vendor search endpoint with params:', filterParams);
      }

      // Remove undefined/empty values
      Object.keys(filterParams).forEach(key => {
        if (filterParams[key] === undefined || filterParams[key] === '' || filterParams[key] === null) {
          delete filterParams[key];
        }
      });

      console.log(`🔎 Final API request to ${apiEndpoint} (level ${fallbackLevel}):`, filterParams);

      const response = await axios.get(apiEndpoint, {
        params: filterParams,
        ...getAuthHeaders()
      });

      const vendorResults = response.data || [];
      console.log(`📊 Found ${vendorResults.length} ${serviceCategory} results from ${apiEndpoint}`);

      // Check if we need to apply fallback ladder
      if (vendorResults.length < 3 && fallbackLevel < 3) {
        console.log(`⚠️ Only ${vendorResults.length} results found, trying fallback level ${fallbackLevel + 1}`);
        
        // Store partial results and try fallback
        const fallbackResults = await searchVendorsWithFilters(serviceCategory, fallbackLevel + 1);
        
        // Combine results, prioritizing original matches
        const combinedResults = [...vendorResults, ...fallbackResults].slice(0, 20);
        
        // Add fallback metadata
        if (fallbackLevel === 0 && combinedResults.length > vendorResults.length) {
          combinedResults.fallbackApplied = true;
          combinedResults.originalCount = vendorResults.length;
          combinedResults.fallbackLevel = fallbackLevel + 1;
        }
        
        return combinedResults;
      }

      // Set vendors for this category
      setVendors(prev => ({
        ...prev,
        [serviceCategory]: vendorResults
      }));

      // Navigate to the step for this service
      const stepIndex = plannerSteps.findIndex(step => step.id === serviceCategory);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
        setCurrentMode('new');
      }

      console.log(`✅ Search complete: ${vendorResults.length} ${serviceCategory} results loaded`);
      return vendorResults;
      
    } catch (error) {
      console.error(`❌ Error searching ${serviceCategory}:`, error);
      
      // Fallback to empty state with request vendor option
      const emptyState = [];
      emptyState.showRequestVendor = true;
      emptyState.serviceType = serviceCategory;
      
      setVendors(prev => ({
        ...prev,
        [serviceCategory]: emptyState
      }));
      
      return emptyState;
    } finally {
      setLoading(false);
    }
  };

  // Handle close/exit functionality
  const handleClose = () => {
    if (onClose) {
      // Used as modal - call the provided onClose
      onClose();
    } else {
      // Used as standalone page - navigate back to dashboard
      navigate('/');
    }
  };

  // Edit event functionality
  const openEditModal = (field) => {
    setEditingField(field);
    setEditFormData({
      event_type: eventData?.event_type || '',
      guest_count: eventData?.guest_count || '',
      budget: eventData?.budget || '',
      location: eventData?.location || '',
      zipcode: eventData?.zipcode || '',
      date: eventData?.date || ''
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveEventData = async () => {
    try {
      setLoading(true);
      
      // Update the local eventData state
      const updatedEventData = {
        ...eventData,
        ...editFormData,
        guest_count: parseInt(editFormData.guest_count) || eventData.guest_count,
        budget: parseFloat(editFormData.budget) || eventData.budget
      };
      
      setEventData(updatedEventData);
      
      // Update budget data if budget changed
      if (editFormData.budget) {
        setBudgetData(prev => ({
          ...prev,
          set: parseFloat(editFormData.budget),
          remaining: parseFloat(editFormData.budget) - prev.selected
        }));
      }
      
      // If we have an event ID, update it via API
      if (eventData?.id) {
        await axios.put(`${API}/events/${eventData.id}`, updatedEventData, {
          headers: getAuthHeaders()
        });
      }
      
      setShowEditModal(false);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to save event data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's most recent event or create a default one
  useEffect(() => {
    const fetchEventData = async () => {
      if (currentEvent) {
        // Use the provided currentEvent data (from EventDashboard)
        setEventData(currentEvent);
        syncQuestionnaireFilters(currentEvent); // Sync questionnaire filters
        setBudgetData({
          set: currentEvent.budget || 0,
          selected: 0,
          remaining: currentEvent.budget || 0
        });
        return;
      }

      setLoading(true);
      try {
        const headers = getAuthHeaders();
        
        if (!headers.Authorization) {
          // No authentication token, set default sample data
          setEventData({
            name: 'My Event',
            event_type: 'Wedding',
            guest_count: 150,
            budget: 25000,
            location: 'Los Angeles',
            zipcode: '90210'
          });
          setBudgetData({
            set: 25000,
            selected: 0, 
            remaining: 25000
          });
          setLoading(false);
          return;
        }

      // Determine which event data to use
      let eventToUse = null;
      
      if (event) {
        // Event passed as prop (when opened as modal)
        console.log('📥 Using event data passed as prop:', event);
        eventToUse = event;
        setEventData(event);
        syncQuestionnaireFilters(event);
        setBudgetData({
          set: event.budget_preferences?.target || event.budget || 0,
          selected: 0,
          remaining: event.budget_preferences?.target || event.budget || 0
        });
      } else if (eventId) {
        // Fetch specific event by ID
        console.log('🔍 Fetching event by ID:', eventId);
        const response = await axios.get(`${API}/events/${eventId}`, getAuthHeaders());
        eventToUse = response.data;
        setEventData(response.data);
        syncQuestionnaireFilters(response.data);
        setBudgetData({
          set: response.data.budget || 0,
          selected: 0,
          remaining: response.data.budget || 0
        });
      } else {
        // No specific event, get user's events and use the first one
        console.log('📋 No specific event, fetching user events');
        const response = await axios.get(`${API}/events`, getAuthHeaders());
        
        if (response.data.events && response.data.events.length > 0) {
          const recentEvent = response.data.events[0];
          eventToUse = recentEvent;
          setEventData(recentEvent);
          syncQuestionnaireFilters(recentEvent);
          setBudgetData({
            set: recentEvent.budget || 0,
            selected: 0,
            remaining: recentEvent.budget || 0
          });
        } else {
          // No events found, create sample data with multiple services for demo
          const sampleEvent = {
            name: 'Sample Event',
            event_type: 'Wedding',
            guest_count: 150,
            budget: 25000,
            location: 'Los Angeles',
            zipcode: '90210',
            needed_core_services: ['Catering', 'Photography', 'Music/DJ', 'Decoration'],
            needed_extras: ['Photo Booths', 'Lighting'],
            wizard_answers: {
              needed_core_services: ['Catering', 'Photography', 'Music/DJ', 'Decoration'],
              needed_extras: ['Photo Booths', 'Lighting'],
              preferred_venue_types: ['Hotel/Banquet Hall'],
              guest_count: 150,
              location_city: 'Los Angeles',
              cultural_style: ['American'],
              budget_target: 25000
            }
          };
          
          console.log('📋 Using sample event with multiple services:', sampleEvent);
          eventToUse = sampleEvent;
          setEventData(sampleEvent);
          syncQuestionnaireFilters(sampleEvent);
          setBudgetData({
            set: 25000,
            selected: 0,
            remaining: 25000
          });
        }
      }
      
      console.log('✅ Event initialization complete. Final event data:', eventToUse);
      } catch (error) {
        console.error('Failed to fetch event data:', error);
        // Set attractive sample data even on error
        setEventData({
          name: 'My Event',
          event_type: 'Wedding',
          guest_count: 150,
          budget: 25000,
          location: 'Los Angeles',
          zipcode: '90210'
        });
        setBudgetData({
          set: 25000,
          selected: 0,
          remaining: 25000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [currentEvent]);

  // Check if venue step should be included based on venue type selection
  const shouldIncludeVenueStep = () => {
    const venueType = currentEvent?.preferred_venue_type || eventData?.preferred_venue_type;
    const skipVenueTypes = ['My Own Private Space', 'I Already Have a Venue'];
    return !skipVenueTypes.includes(venueType);
  };

  // Generate dynamic planner steps based on questionnaire answers
  const generateDynamicPlannerSteps = (questionnaireFilters) => {
    console.log('🎯 Generating dynamic planner steps with filters:', questionnaireFilters);
    console.log('🎯 Event wizard_answers:', eventData?.wizard_answers);
    
    const steps = [];

    // Add venue step if needed (unless at home or already have venue)
    const skipVenueTypes = ['My Own Private Space', 'I Already Have a Venue', 'at_home', 'my_own_private_space'];
    if (!skipVenueTypes.includes(questionnaireFilters.preferred_venue_type)) {
      steps.push({
        id: 'venue',
        title: 'Venue',
        subtitle: 'Find the perfect location for your event',
        icon: MapPin,
        color: 'bg-blue-500',
        searchable: true,
        required: true,
        autoFilters: formatAutoFilters(questionnaireFilters, 'venue')
      });
      console.log('✅ Added venue step');
    }

    // Get services from wizard_answers via questionnaireFilters (not eventData)
    const selectedCoreServices = questionnaireFilters?.core_services || [];
    const selectedExtras = questionnaireFilters?.extras || [];
    
    console.log('📋 Selected Core Services from filters:', selectedCoreServices);
    console.log('📋 Selected Extras from filters:', selectedExtras);

    // Core service mapping - only create tiles for selected services
    const serviceMapping = {
      'Catering': { id: 'catering', title: 'Catering', subtitle: 'Food and beverage services', icon: Utensils, color: 'bg-green-500' },
      'Decoration': { id: 'decoration', title: 'Decoration', subtitle: 'Transform your space', icon: Sparkles, color: 'bg-pink-500' },
      'Photography': { id: 'photography', title: 'Photography', subtitle: 'Capture every moment', icon: Camera, color: 'bg-indigo-500' },
      'Videography': { id: 'videography', title: 'Videography', subtitle: 'Professional video recording', icon: Camera, color: 'bg-purple-500' },
      'Music/DJ': { id: 'music_dj', title: 'DJ/Music', subtitle: 'Keep the party going', icon: Music, color: 'bg-red-500' },
      'Lighting': { id: 'lighting', title: 'Lighting', subtitle: 'Create perfect ambiance', icon: Zap, color: 'bg-yellow-500' },
      'Transportation': { id: 'transportation', title: 'Transportation', subtitle: 'Reliable transport services', icon: MapPin, color: 'bg-blue-600' },
      'Cleaning': { id: 'cleaning', title: 'Cleaning', subtitle: 'Post-event cleanup', icon: Sparkles, color: 'bg-teal-500' },
      'Security': { id: 'security', title: 'Security', subtitle: 'Professional security', icon: UserCheck, color: 'bg-gray-500' }
    };

    // Add only the services they actually selected in the wizard
    selectedCoreServices.forEach(serviceName => {
      const mapping = serviceMapping[serviceName];
      if (mapping) {
        steps.push({
          ...mapping,
          searchable: true,
          required: false,
          autoFilters: formatAutoFilters(questionnaireFilters, mapping.id)
        });
        console.log(`✅ Added selected service: ${serviceName}`);
      } else {
        console.log(`❌ No mapping for selected service: ${serviceName}`);
      }
    });

    // Add-on/Extras mapping - show selected extras as additional tiles
    const extrasMapping = {
      'Photo Booths': { id: 'photo_booth', title: 'Photo Booths', subtitle: 'Interactive photo experiences', icon: Camera, color: 'bg-purple-600' },
      'Cold Spark Machines': { id: 'cold_sparks', title: 'Cold Spark Machines', subtitle: 'Spectacular visual effects', icon: Sparkles, color: 'bg-blue-400' },
      'LED Dance Floor': { id: 'led_floor', title: 'LED Dance Floor', subtitle: 'Interactive illuminated floor', icon: Zap, color: 'bg-purple-400' },
      'LED Screens': { id: 'led_screens', title: 'LED Screens', subtitle: 'Large format displays', icon: Eye, color: 'bg-indigo-400' },
      'Live Shows (Salsa, Samba, Hora Loca with dancers)': { id: 'live_shows', title: 'Live Shows', subtitle: 'Professional entertainment', icon: User, color: 'bg-orange-500' },
      'Dance in the Clouds': { id: 'dance_clouds', title: 'Dance in the Clouds', subtitle: 'Low-lying fog effects', icon: Sparkles, color: 'bg-cyan-500' },
      'Specialty Entertainers': { id: 'specialty_entertainers', title: 'Specialty Entertainers', subtitle: 'Unique entertainment acts', icon: User, color: 'bg-rose-500' }
    };

    // Add only the extras/add-ons they selected in the wizard
    selectedExtras.forEach(extraName => {
      const mapping = extrasMapping[extraName];
      if (mapping) {
        steps.push({
          ...mapping,
          searchable: true,
          required: false,
          autoFilters: formatAutoFilters(questionnaireFilters, mapping.id),
          isExtra: true // Mark as extra for styling purposes
        });
        console.log(`✅ Added selected extra: ${extraName}`);
      } else {
        console.log(`❌ No mapping for selected extra: ${extraName}`);
      }
    });

    console.log(`✅ Generated ${steps.length} synchronized planner steps based on questionnaire selections`);
    return steps;
  };

  // Format auto-filters display for each service tile
  const formatAutoFilters = (filters, serviceType) => {
    const parts = [];
    
    // Location info
    if (filters.location) {
      parts.push(`${filters.location} • 30 mi`);
    }
    
    // Date
    if (filters.date) {
      const eventDate = new Date(filters.date);
      parts.push(eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    }
    
    // Guest count
    if (filters.guest_count) {
      parts.push(`${filters.guest_count} guests`);
    }
    
    // Cultural style
    if (filters.cultural_style && filters.cultural_style !== 'American') {
      parts.push(filters.cultural_style);
    }
    
    return parts.join(' • ');
  };

  // Use dynamic steps based on questionnaire - make reactive to questionnaire changes
  const [plannerSteps, setPlannerSteps] = useState([]);
  
  // Update planner steps when questionnaire filters change
  useEffect(() => {
    if (questionnaireFilters && Object.keys(questionnaireFilters).length > 0) {
      console.log('🔄 Regenerating planner steps due to questionnaire filter changes');
      const newSteps = generateDynamicPlannerSteps(questionnaireFilters);
      setPlannerSteps(newSteps);
    } else {
      // Fallback: Generate default steps if no questionnaire data
      console.log('🔄 No questionnaire data, generating default steps');
      const defaultSteps = generateDynamicPlannerSteps({});
      setPlannerSteps(defaultSteps);
    }
  }, [questionnaireFilters]);

  useEffect(() => {
    // Load saved plan and cart from backend when component mounts
    loadSavedPlan();
    loadCartFromBackend();
    
    // If in continue mode, load planning progress
    if (currentMode === 'continue') {
      loadPlanningProgress();
    }
  }, [eventId, currentMode]);

  // For events with wizard_answers, ALWAYS start in vendor selection mode ('new')
  // Skip all overview/continue pages entirely
  useEffect(() => {
    if (eventData && eventData.wizard_answers) {
      console.log('🎯 Event has wizard_answers, forcing vendor selection mode');
      setCurrentMode('new');
    }
  }, [eventData]);

  useEffect(() => {
    // Update budget calculations when cart changes
    updateBudgetCalculations();
  }, [cart]);

  // Listen for event updates from EventDashboard
  useEffect(() => {
    const handleEventUpdate = (event) => {
      console.log('🔄 Received event update in planner:', event.detail);
      syncQuestionnaireFilters(event.detail);
      setEventData(event.detail);
    };

    window.addEventListener('eventUpdated', handleEventUpdate);
    return () => window.removeEventListener('eventUpdated', handleEventUpdate);
  }, []);

  const loadSavedPlan = async () => {
    try {
      // Load planner state from backend
      const response = await axios.get(`${API}/events/${eventId}/planner/state`, getAuthHeaders());

      if (response.data) {
        setCurrentStep(response.data.current_step || 0);
        // Budget tracking is handled by loadCartFromBackend
        
        // Build selected services from cart items
        const services = {};
        (response.data.cart_items || []).forEach(item => {
          services[item.service_type] = item.vendor_id;
        });
        setSelectedServices(services);
      }
    } catch (err) {
      console.error('Error loading saved plan from backend:', err);
      // Fallback to localStorage if backend fails
      try {
        const savedPlan = localStorage.getItem(`event-plan-${eventId}`);
        if (savedPlan) {
          const parsed = JSON.parse(savedPlan);
          setCurrentStep(parsed.currentStep || 0);
          setSelectedServices(parsed.selectedServices || {});
        }
      } catch (localErr) {
        console.error('Error loading local saved plan:', localErr);
      }
    }
  };

  const savePlan = async () => {
    try {
      // Save planner state to backend
      await axios.post(`${API}/events/${eventId}/planner/state`, {
        current_step: currentStep,
        completed_steps: Array.from({ length: currentStep }, (_, i) => i), // Mark previous steps as completed
        step_data: {
          last_saved: new Date().toISOString()
        }
      }, getAuthHeaders());
      
      // Keep localStorage as backup
      const planData = {
        currentStep,
        selectedServices,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`event-plan-${eventId}`, JSON.stringify(planData));
    } catch (err) {
      console.error('Error saving plan to backend:', err);
      // Fallback to localStorage only
      try {
        const planData = {
          currentStep,
          selectedServices,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`event-plan-${eventId}`, JSON.stringify(planData));
      } catch (localErr) {
        console.error('Error saving plan locally:', localErr);
      }
    }
  };

  const updateBudgetCalculations = () => {
    const selectedTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    setBudgetData({
      set: currentEvent?.budget || 0,
      selected: selectedTotal,
      remaining: (currentEvent?.budget || 0) - selectedTotal
    });
  };

  const loadPlanningProgress = async () => {
    try {
      // Get existing cart to show selected vendors
      const cartResponse = await axios.get(`${API}/events/${eventId}/cart`, getAuthHeaders());
      const existingCart = cartResponse.data.cart || [];
      
      // Calculate progress
      const completedSteps = existingCart.length;
      
      // Define all service types
      const allServices = [
        { id: 'venue', name: '🏛️ Venue Selection', icon: '🏛️' },
        { id: 'decoration', name: '🎨 Decoration & Design', icon: '🎨' },
        { id: 'catering', name: '🍽️ Catering Services', icon: '🍽️' },
        { id: 'bar', name: '🍸 Bar & Beverages', icon: '🍸' },
        { id: 'planner', name: '📋 Event Coordinator', icon: '📋' },
        { id: 'photography', name: '📸 Photography', icon: '📸' },
        { id: 'dj', name: '🎵 DJ & Music', icon: '🎵' },
        { id: 'staffing', name: '👥 Event Staffing', icon: '👥' },
        { id: 'entertainment', name: '🎭 Entertainment', icon: '🎭' },
        { id: 'review', name: '📋 Final Review', icon: '📋' }
      ];
      
      // Find pending services
      const selectedServiceTypes = existingCart.map(item => item.service_type);
      const pendingServices = allServices.filter(service => 
        !selectedServiceTypes.includes(service.id) && service.id !== 'review'
      );
      
      setPlanningProgress({
        selectedVendors: existingCart,
        completedSteps,
        pendingServices,
        totalServices: allServices.length - 1 // Exclude review step
      });
      
      // Set the cart state
      setCart(existingCart);
      
    } catch (err) {
      console.error('Error loading planning progress:', err);
      setPlanningProgress({
        selectedVendors: [],
        completedSteps: 0,
        pendingServices: [],
        totalServices: 9
      });
    }
  };

  const searchVendors = async (stepId, searchTerm = '') => {
    try {
      setLoading(true);
      
      // Use the new Interactive Event Planner API endpoint
      const params = new URLSearchParams();
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm);
      }

      // Add budget filtering based on current event
      if (currentEvent?.budget) {
        const serviceBudget = currentEvent.budget * 0.15; // Allocate 15% per service
        params.append('max_price', serviceBudget);
      }

      let response;
      if (stepId === 'venue') {
        // Use enhanced venue matching API with location preferences
        if (eventId) {
          response = await axios.get(`${API}/match/venues/event/${eventId}`, getAuthHeaders());
        } else {
          // Fallback to search API for events without ID
          if (currentEvent?.location) {
            params.append('city', currentEvent.location);
          }
          if (currentEvent?.guest_count) {
            params.append('capacity_min', Math.floor(currentEvent.guest_count * 0.8));
            params.append('capacity_max', Math.ceil(currentEvent.guest_count * 1.2));
          }
          if (currentEvent?.preferred_venue_type) {
            params.append('preferred_venue_type', currentEvent.preferred_venue_type);
          }
          response = await axios.get(`${API}/venues/search?${params}`, getAuthHeaders());
        }
      } else {
        // Enhanced service filtering based on event's services needed
        const isServiceNeeded = checkIfServiceNeeded(stepId, currentEvent?.services_needed || []);
        
        if (!isServiceNeeded) {
          // Service not in original selection - show "sparkle your event" suggestion
          setVendors(prev => ({
            ...prev,
            [stepId]: []
          }));
          return;
        }
        
        // Add services needed parameter for filtering
        if (currentEvent?.services_needed?.length > 0) {
          params.append('services_needed', currentEvent.services_needed.join(','));
        }
        
        // Use the new Interactive Event Planner vendor endpoint
        response = await axios.get(`${API}/events/${eventId}/planner/vendors/${stepId}?${params}`, getAuthHeaders());
      }

      setVendors(prev => ({
        ...prev,
        [stepId]: response.data?.venues || response.data?.vendors || response.data || []
      }));

      // Debug logging for venue matching
      if (process.env.REACT_APP_DEBUG_MATCHING === 'true' && stepId === 'venue' && eventId) {
        console.log('[Planner] Enhanced venue matching response:', response.data);
        console.log('[Planner] Location filter applied:', response.data?.location_filter);
        console.log('[Planner] Total matches:', response.data?.total_matches);
      }
    } catch (err) {
      console.error('Error searching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a service is needed based on event's initial selection
  const checkIfServiceNeeded = (stepId, servicesNeeded) => {
    if (!servicesNeeded || servicesNeeded.length === 0) {
      return true; // If no services specified, show all
    }
    
    // Map planner step IDs to service names
    const serviceMapping = {
      'decoration': ['decoration', 'decor'],
      'catering': ['catering', 'food'],
      'photography': ['photography', 'photo'],
      'music': ['music/dj', 'dj', 'music'],
      'entertainment': ['entertainment', 'performer'],
      'bar': ['bar', 'drinks'],
      'planner': ['planner', 'coordinator'],
      'staffing': ['staffing', 'waitstaff', 'service'],
      'dj': ['music/dj', 'dj', 'music']
    };
    
    const eventServicesLower = servicesNeeded.map(s => s.toLowerCase());
    const stepMatches = serviceMapping[stepId] || [stepId];
    
    // Check if this step's service is in the needed services
    return stepMatches.some(match => 
      eventServicesLower.some(needed => needed.includes(match.toLowerCase()))
    );
  };

  const getAuthHeaders = () => ({
    headers: {
      'Authorization': `Bearer ${token || localStorage.getItem('token')}`
    }
  });

  const loadCartFromBackend = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/cart`, getAuthHeaders());

      if (response.data) {
        const cartItems = response.data.cart_items || [];
        setCart(cartItems);
        
        // Update budget data
        setBudgetData({
          set: response.data.budget_tracking?.set_budget || currentEvent?.budget || 0,
          selected: response.data.budget_tracking?.selected_total || 0,
          remaining: response.data.budget_tracking?.remaining || 0
        });
      }
    } catch (err) {
      console.error('Error loading cart from backend:', err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API}/events/${eventId}/cart/remove/${itemId}`, getAuthHeaders());
      
      // Refresh cart and update selected services
      await loadCartFromBackend();
      
      // Update selected services by removing the item
      const item = cart.find(c => c.id === itemId);
      if (item) {
        setSelectedServices(prev => {
          const updated = { ...prev };
          delete updated[item.service_type];
          return updated;
        });
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const addToCart = async (stepId, vendor) => {
    try {
      const cartRequest = {
        vendor_id: vendor.id,
        service_type: stepId,
        service_name: vendor.name,
        price: vendor.recommended_price || vendor.price_range?.min || vendor.base_price || 1000,
        quantity: 1,
        notes: `Selected from ${plannerSteps.find(s => s.id === stepId)?.title} step`
      };

      // Use the new Interactive Event Planner cart API
      const response = await axios.post(`${API}/events/${eventId}/cart/add`, cartRequest, getAuthHeaders());

      if (response.data) {
        // Refresh cart from backend
        await loadCartFromBackend();
        
        // Update selected services
        setSelectedServices(prev => ({
          ...prev,
          [stepId]: vendor.id
        }));

        // Show budget status
        if (response.data.budget_status === 'over_budget') {
          alert('Warning: This selection puts you over budget!');
        }
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      await axios.post(`${API}/events/${eventId}/cart/clear`, {}, getAuthHeaders());
      
      setCart([]);
      setSelectedServices({});
      setBudgetData({
        set: currentEvent?.budget || 0,
        selected: 0,
        remaining: currentEvent?.budget || 0
      });
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const nextStep = () => {
    if (currentStep < plannerSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      const nextStepId = plannerSteps[currentStep + 1].id;
      if (nextStepId !== 'review' && !vendors[nextStepId]) {
        searchVendors(nextStepId);
      }
      savePlan();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      savePlan();
    }
  };

  const skipStep = () => {
    nextStep();
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    const stepId = plannerSteps[stepIndex].id;
    if (stepId !== 'review' && !vendors[stepId]) {
      searchVendors(stepId);
    }
  };

  const handleSearch = (stepId) => {
    const searchTerm = searchTerms[stepId] || '';
    searchVendors(stepId, searchTerm);
  };

  const finalizeEventPlan = async () => {
    try {
      setSaving(true);
      
      // Create quote from current planning session
      const quoteData = {
        name: `${event?.name || 'Event'} Quote - ${new Date().toLocaleDateString()}`,
        event_type: questionnaireFilters.event_type || event?.event_type || 'general',
        event_date: questionnaireFilters.date || event?.date,
        guest_count: questionnaireFilters.guest_count || event?.guest_count || 0,
        total_budget: budgetData.selected,
        target_budget: budgetData.set,
        vendor_count: Object.keys(selectedServices).length,
        selected_vendors: Object.entries(selectedServices).map(([serviceId, vendorId]) => {
          const vendor = vendors[serviceId]?.find(v => v.id === vendorId);
          return {
            service_id: serviceId,
            vendor_id: vendorId,
            vendor_name: vendor?.name,
            vendor_price: vendor?.price || 0,
            service_name: plannerSteps.find(s => s.id === serviceId)?.title
          };
        }),
        cart_items: cart,
        questionnaire_synced: true,
        wizard_preferences: {
          venue_types: questionnaireFilters.venue_types || [],
          core_services: questionnaireFilters.core_services || [],
          cultural_style: questionnaireFilters.cultural_style || '',
          location: questionnaireFilters.location || '',
          budget: questionnaireFilters.budget || 0
        },
        status: 'completed',
        created_at: new Date().toISOString()
      };

      // Save quote to backend
      console.log('Creating quote with data:', quoteData);
      const quoteResponse = await axios.post(`${API}/events/${eventId}/quotes`, quoteData, getAuthHeaders());
      
      if (quoteResponse.data) {
        console.log('✅ Quote created successfully:', quoteResponse.data.quote);
        
        // Also finalize the event plan (existing functionality)
        const response = await axios.post(`${API}/events/${eventId}/planner/finalize`, {
          quote_id: quoteResponse.data.quote.id
        }, getAuthHeaders());

        if (response.data) {
          const bookings = response.data.bookings_created || [];
          
          // Notify parent component with quote data
          if (onPlanSaved) {
            onPlanSaved({
              ...bookings,
              quote: quoteResponse.data.quote
            });
          }
          
          // Clear local state
          setCart([]);
          setSelectedServices({});
          
          alert(`🎉 Event plan completed successfully!\n\n✅ Quote created: "${quoteData.name}"\n💰 Total budget: ${formatCurrency(quoteData.total_budget)}\n🏢 ${quoteData.vendor_count} vendor${quoteData.vendor_count !== 1 ? 's' : ''} selected\n📋 ${bookings.length} booking${bookings.length !== 1 ? 's' : ''} created\n\nYour quote is now saved in your Event Profile!`);
          
          onClose();
        }
      }
    } catch (err) {
      console.error('Error finalizing event plan:', err);
      
      // Fallback: Create local quote even if backend fails
      const fallbackQuote = {
        id: `quote-${Date.now()}`,
        name: `${event?.name || 'Event'} Quote - ${new Date().toLocaleDateString()}`,
        event_type: questionnaireFilters.event_type || 'general',
        total_budget: budgetData.selected,
        vendor_count: Object.keys(selectedServices).length,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      
      if (onPlanSaved) {
        onPlanSaved({ quote: fallbackQuote });
      }
      
      alert(`✅ Planning completed! Quote saved locally.\n\nTotal: ${formatCurrency(budgetData.selected)}\nVendors: ${Object.keys(selectedServices).length}`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderVendorCard = (vendor, stepId) => {
    const isSelected = selectedServices[stepId] === vendor.id;
    const isExpanded = expandedCard === `${stepId}-${vendor.id}`;
    
    return (
      <div
        key={vendor.id}
        className={`border rounded-lg p-4 transition-all ${
          isSelected
            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{vendor.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{vendor.description}</p>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {vendor.location && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{vendor.location}</span>
                  </div>
                )}
                {vendor.rating && (
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1">{vendor.rating}</span>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-purple-600">
                  {formatCurrency(vendor.price_per_person || vendor.base_price || 0)}
                </div>
                {vendor.price_per_person && (
                  <div className="text-xs text-gray-500">per person</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setExpandedCard(isExpanded ? null : `${stepId}-${vendor.id}`)}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
          >
            <Eye className="h-4 w-4 mr-1" />
            {isExpanded ? 'Hide Details' : 'View Details'}
          </button>
          
          <button
            onClick={() => addToCart(stepId, vendor)}
            disabled={isSelected}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-purple-600 text-white cursor-default'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {isSelected ? (
              <><CheckCircle className="h-4 w-4 mr-1 inline" />Selected</>
            ) : (
              <><Plus className="h-4 w-4 mr-1 inline" />Add to Event</>
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              {vendor.specialties && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Specialties:</h5>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {vendor.specialties.map((specialty, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {vendor.cultural_specializations && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Cultural Specializations:</h5>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {vendor.cultural_specializations.map((culture, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {culture.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {vendor.contact_info && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Contact:</h5>
                  <div className="text-sm text-gray-600">
                    {vendor.contact_info.phone && <div>Phone: {vendor.contact_info.phone}</div>}
                    {vendor.contact_info.email && <div>Email: {vendor.contact_info.email}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    const step = plannerSteps[currentStep];
    
    if (step.id === 'planning') {
      return (
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mb-6">
              <Calendar className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Let's Plan Your Perfect Event!</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome to your personalized event planning journey. We'll guide you through each step to create an unforgettable experience 
              that matches your vision, budget, and style preferences.
            </p>
          </div>

          {/* Event Summary Card */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-purple-900 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Your Event Overview
              </h4>
              <button
                onClick={() => openEditModal('all')}
                className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-100 transition-colors"
                title="Edit event details"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>

            {/* Special message for venue-free planning */}
            {!shouldIncludeVenueStep() && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    {currentEvent?.preferred_venue_type === 'My Own Private Space' 
                      ? "Perfect! We'll focus on services for your private space." 
                      : "Great! Since you already have a venue, we'll focus on the services you need."}
                  </span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-purple-100 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Event Type</p>
                      <p className="font-medium text-gray-900">{eventData?.event_type || 'Not specified'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal('event_type')}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 p-1 rounded transition-all duration-200"
                    title="Edit event type"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-100 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Guest Count</p>
                      <p className="font-medium text-gray-900">{eventData?.guest_count || 'Not specified'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal('guest_count')}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 p-1 rounded transition-all duration-200"
                    title="Edit guest count"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-100 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Budget</p>
                      <p className="font-medium text-gray-900">{eventData?.budget ? formatCurrency(eventData.budget) : 'Not set'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal('budget')}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 p-1 rounded transition-all duration-200"
                    title="Edit budget"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-purple-100 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{eventData?.location || eventData?.zipcode || 'Not specified'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal('location')}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 p-1 rounded transition-all duration-200"
                    title="Edit location"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Planning Steps Preview */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-center">Your Planning Journey</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {plannerSteps.slice(1).map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="text-center p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-200 transition-colors">
                    <div className={`mx-auto h-12 w-12 rounded-full ${step.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h5 className="font-medium text-gray-900 text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">{step.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h4 className="font-semibold text-green-900 mb-2">Ready to Start Planning?</h4>
            <p className="text-green-700 mb-4">
              {shouldIncludeVenueStep() 
                ? "Let's begin with finding the perfect venue for your event. We'll match you with venues that fit your guest count, budget, and location preferences."
                : "Since your venue is all set, let's focus on the services you need to make your event amazing. We'll help you find the perfect vendors for each service."
              }
            </p>
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
            >
              <Zap className="h-5 w-5 mr-2" />
              {shouldIncludeVenueStep() ? "Begin Venue Selection" : "Start Service Selection"}
            </button>
          </div>

          {/* Budget Recommendation */}
          {eventData?.budget && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">Smart Budget Allocation</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    Based on your {formatCurrency(eventData.budget)} budget{!shouldIncludeVenueStep() ? " and existing venue" : ""}, we recommend allocating approximately:
                  </p>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {shouldIncludeVenueStep() ? (
                      <>
                        <span>• Venue: {formatCurrency(eventData.budget * 0.4)} (40%)</span>
                        <span>• Catering: {formatCurrency(eventData.budget * 0.3)} (30%)</span>
                        <span>• Decoration: {formatCurrency(eventData.budget * 0.15)} (15%)</span>
                        <span>• Entertainment: {formatCurrency(eventData.budget * 0.1)} (10%)</span>
                        <span>• Other: {formatCurrency(eventData.budget * 0.05)} (5%)</span>
                      </>
                    ) : (
                      <>
                        <span>• Catering: {formatCurrency(eventData.budget * 0.45)} (45%)</span>
                        <span>• Decoration: {formatCurrency(eventData.budget * 0.25)} (25%)</span>
                        <span>• Photography: {formatCurrency(eventData.budget * 0.15)} (15%)</span>
                        <span>• Entertainment: {formatCurrency(eventData.budget * 0.1)} (10%)</span>
                        <span>• Other Services: {formatCurrency(eventData.budget * 0.05)} (5%)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    if (step.id === 'review') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900">Review Your Event Plan</h3>
            <p className="text-gray-600 mt-2">
              Review all your selections and finalize your event planning
            </p>
          </div>

          {/* Budget Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">Budget Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(budgetData.set)}</div>
                <div className="text-sm text-gray-600">Total Budget</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(budgetData.selected)}</div>
                <div className="text-sm text-gray-600">Selected Services</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${budgetData.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(budgetData.remaining)}
                </div>
                <div className="text-sm text-gray-600">Remaining Budget</div>
              </div>
            </div>
          </div>

          {/* Selected Services */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Selected Services ({cart.length})</h4>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="mx-auto h-8 w-8 mb-2" />
                <p>No services selected yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{item.name}</h5>
                      <p className="text-sm text-gray-600">{item.serviceType}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-purple-600">{formatCurrency(item.price)}</div>
                      {currentEvent?.guest_count && (
                        <div className="text-xs text-gray-500">
                          Total: {formatCurrency(item.price * currentEvent.guest_count)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finalize Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={finalizeEventPlan}
              disabled={saving || cart.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating Bookings...' : 'Confirm Event Plan'}
            </button>
          </div>
        </div>
      );
    }

    const stepVendors = vendors[step.id] || [];
    
    return (
      <div className="space-y-6">
        {/* Location Scope Indicator for Venue Step */}
        {step.id === 'venue' && eventData?.location_preferences && (
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs">
            <MapPin className="h-3 w-3" />
            <span>Search Area:</span>
            <b>
              {eventData.location_preferences.zip_only
                ? `ZIP-only ${eventData.location_preferences.zipcode || '—'}`
                : `${eventData.location_preferences.radius_miles ?? 25} mi around ${eventData.location_preferences.zipcode || eventData.location_preferences.city || eventData.location || 'location'}`}
            </b>
          </div>
        )}

        {/* Search Bar */}
        {step.searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerms[step.id] || ''}
              onChange={(e) => setSearchTerms({...searchTerms, [step.id]: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(step.id)}
              placeholder={`Search ${step.title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={() => handleSearch(step.id)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
            >
              Search
            </button>
          </div>
        )}

        {/* Auto-search on step load */}
        {stepVendors.length === 0 && !loading && (
          <div className="text-center py-8">
            <button
              onClick={() => searchVendors(step.id)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Load {step.title} Options
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Searching for {step.title.toLowerCase()}...</p>
          </div>
        )}

        {/* Applied Filters Display */}
        {step.autoFilters && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                  <Zap className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-900">Auto-applied filters:</span>
              </div>
              <span className="text-sm text-blue-700">{step.autoFilters}</span>
            </div>
          </div>
        )}

        {/* Fallback Message */}
        {stepVendors?.fallbackApplied && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <div>
                <p className="text-amber-800 font-medium">No exact cultural matches found</p>
                <p className="text-amber-700 text-sm">
                  Showing {stepVendors.length - (stepVendors.originalCount || 0)} highly rated alternatives near you
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Grid */}
        {stepVendors.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stepVendors.map((vendor) => renderVendorCard(vendor, step.id))}
            </div>
            
            {/* Request Vendor Option */}
            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  // TODO: Implement request vendor lead form
                  alert(`Request a ${step.title} vendor - This will connect you with our vendor specialists`);
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Don't see what you need? Request a {step.title} vendor
              </button>
            </div>
          </div>
        )}

        {/* No Results / Request Vendor */}
        {!loading && (stepVendors.length === 0 || stepVendors?.showRequestVendor) && vendors[step.id] !== undefined && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-8 rounded-xl border border-gray-200">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {step.title} vendors found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any {step.title.toLowerCase()} vendors matching your specific requirements. 
                Let us help you find the perfect match!
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => searchVendorsWithFilters(step.id, 0)}
                  className="w-full px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Search Again with Expanded Criteria
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement request vendor lead form
                    alert(`Request a ${step.title} vendor - Our specialists will help you find the perfect match for your ${questionnaireFilters.event_type} in ${questionnaireFilters.location}`);
                  }}
                  className="w-full px-6 py-3 bg-white text-purple-600 font-medium border-2 border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Request a {step.title} Vendor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SIMPLIFIED: Always use 'new' mode for direct vendor selection
  // Remove the confusing overview/continue modes entirely
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-0 border w-full max-w-7xl shadow-lg rounded-lg bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Interactive Event Planner</h2>
              <p className="text-sm text-gray-600">{eventData?.name || 'My Event'}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex h-[calc(100vh-200px)]">
          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Questionnaire-Synced Vendor Selection Header */}
            <div className="flex items-center space-x-3 mb-6">
              <Wand2 className="h-6 w-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Questionnaire-Synced Vendor Selection</h2>
                <p className="text-sm text-gray-600">Services from your questionnaire. Click to select vendors with auto-applied filters.</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-purple-700">Progress: {cart.length} of {plannerSteps.filter(s => s.id !== 'planning' && s.id !== 'review').length} services selected</span>
                <span className="text-sm font-medium text-purple-700">${cart.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()} committed</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.max(0, (cart.length / Math.max(1, plannerSteps.length - 2)) * 100)}%`}}
                ></div>
              </div>
            </div>

            {/* Dynamic Service Tiles - Generated from Questionnaire */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {plannerSteps
                .filter(step => step.id !== 'planning' && step.id !== 'review') // Exclude planning and review steps
                .map((step) => {
                  const Icon = step.icon;
                  const isSelected = selectedServices[step.id];
                  const selectedVendor = isSelected ? cart.find(item => item.service_type === step.id) : null;
                  
                  return (
                    <div 
                      key={step.id} 
                      className={`relative border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                        isSelected 
                          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' 
                          : `border-gray-200 bg-gradient-to-br ${step.color.replace('bg-', 'from-').replace('-500', '-50')} to-gray-50 hover:border-gray-300`
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          // Show vendor details modal
                          setSelectedVendorForDetails(selectedVendor);
                        } else {
                          // Start vendor search with questionnaire filters
                          console.log(`🎯 Clicked service tile: ${step.id}`);
                          searchVendorsWithFilters(step.id);
                        }
                      }}
                    >
                      {/* Status Badge */}
                      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isSelected 
                          ? 'bg-green-500 text-white' 
                          : step.color + ' text-white'
                      }`}>
                        {isSelected ? '✓' : '○'}
                      </div>
                      
                      {/* Service Icon */}
                      <div className={`mx-auto h-12 w-12 rounded-full ${step.color} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Service Title */}
                      <h4 className="font-medium text-center text-gray-900 text-sm mb-2">
                        {step.title}
                      </h4>
                      
                      {/* Auto-filters display */}
                      {step.autoFilters && (
                        <div className="text-xs text-gray-600 text-center mb-2 px-1">
                          <div className="bg-white/80 rounded-full px-2 py-1 text-xs">
                            {step.autoFilters}
                          </div>
                        </div>
                      )}
                      
                      {/* Status/Action */}
                      <div className="text-center">
                        {isSelected ? (
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-1">
                              {selectedVendor?.service_name || 'Selected'}
                            </p>
                            <p className="text-xs text-green-600 mb-2">
                              ${selectedVendor?.price?.toLocaleString() || '0'}
                            </p>
                            <div className="flex space-x-1">
                              <button className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                                View
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Re-search to replace current selection
                                  searchVendorsWithFilters(step.id);
                                }}
                                className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors">
                            Select Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Sidebar - Live Shopping Cart */}
          <div className="w-80 bg-gray-50 border-l p-6 flex flex-col">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Live Shopping Cart</h3>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                {cart.length}/{plannerSteps.filter(s => s.id !== 'planning' && s.id !== 'review').length}
              </span>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Ready to Start</p>
                <p className="text-sm text-gray-500 mt-1">Click on service categories to add vendors</p>
                <div className="mt-4 px-4 py-2 bg-yellow-50 rounded border border-yellow-200">
                  <div className="flex items-center text-yellow-700">
                    <Sparkles className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Real-time updates</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm text-gray-900 truncate flex-1 mr-2">
                        {item.service_name}
                      </h4>
                      <button
                        onClick={() => {
                          setCart(prev => prev.filter((_, i) => i !== index));
                          updateBudgetCalculations();
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{item.service_type}</p>
                    <p className="text-sm font-semibold text-green-600">${item.price?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${cart.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Est. Taxes & Fees:</span>
                    <span>${Math.round(cart.reduce((sum, item) => sum + (item.price || 0), 0) * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>${Math.round(cart.reduce((sum, item) => sum + (item.price || 0), 0) * 1.1).toLocaleString()}</span>
                  </div>
                </div>
                
                <button 
                  onClick={finalizeEventPlan}
                  disabled={saving || cart.length === 0}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Processing...' : `Book ${cart.length} Services`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveEventPlanner;
