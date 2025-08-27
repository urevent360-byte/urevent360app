import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Search, Plus, Trash2, X, Save, 
  DollarSign, Users, MapPin, Camera, Music, Utensils, 
  Sparkles, UserCheck, Calendar, ShoppingCart, AlertTriangle,
  CheckCircle, Eye, FastForward, RotateCcw, Wine, Zap, User, Edit3, Play,
  Phone, Mail, Wand2
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
    const coreServices = wizardAnswers?.needed_core_services || event.needed_core_services || [];
    const extraServices = wizardAnswers?.needed_extras || event.needed_extras || [];
    
    // Debug logging
    console.log('🔍 Event data received:', event);
    console.log('🔍 Wizard answers:', wizardAnswers);
    console.log('🔍 Core services:', coreServices);
    console.log('🔍 Extra services:', extraServices);
    
    const filters = {
      preferred_venue_type: wizardAnswers?.preferred_venue_types?.[0] || event.preferred_venue_type || '',
      services_needed: [...coreServices, ...extraServices],
      guest_count: wizardAnswers?.guest_count || event.guest_count || 0,
      event_type: wizardAnswers?.event_type || event.event_type || '',
      cultural_style: wizardAnswers?.cultural_style?.[0] || event.cultural_style || '',
      budget: wizardAnswers?.budget_target || event.budget_preferences?.target || event.budget || 0,
      location: wizardAnswers?.location_city || event.location || '',
      date: wizardAnswers?.date || event.date || '',
      
      // Additional wizard data for enhanced matching
      venue_types: wizardAnswers?.preferred_venue_types || [],
      core_services: coreServices,
      extras: extraServices,
      service_subcategories: wizardAnswers?.service_subcategories || {},
      theme_format: wizardAnswers?.theme_or_format || [],
      mitzvah_type: wizardAnswers?.mitzvah_type || null
    };
    
    console.log('🎯 Final questionnaire filters:', filters);
    console.log('📋 Total services to display:', filters.services_needed.length);
    
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
          budget_per_service: Math.floor((questionnaireFilters.budget || 0) / Math.max(plannerSteps.length - 2, 1)),
          
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
        headers: { Authorization: `Bearer ${token}` }
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
        const response = await axios.get(`${API}/events/${eventId}`, {
          headers
        });
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
        const response = await axios.get(`${API}/events`, {
          headers
        });
        
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
    const steps = [];
    
    // Always include planning step
    steps.push({
      id: 'planning',
      title: 'Start Planning',
      subtitle: 'Review your event details and begin the planning process',
      icon: Calendar,
      color: 'bg-purple-500',
      searchable: false,
      required: false
    });

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
    }

    // Add service steps based on questionnaire selections
    const serviceMapping = {
      'Catering': {
        id: 'catering',
        title: 'Catering',
        subtitle: 'Food and beverage services',
        icon: Utensils,
        color: 'bg-green-500'
      },
      'Decoration': {
        id: 'decoration',
        title: 'Decoration',
        subtitle: 'Transform your space with beautiful decorations',
        icon: Sparkles,
        color: 'bg-pink-500'
      },
      'Photography': {
        id: 'photography',
        title: 'Photography',
        subtitle: 'Capture every moment professionally',
        icon: Camera,
        color: 'bg-indigo-500'
      },
      'Videography': {
        id: 'videography',
        title: 'Videography',
        subtitle: 'Professional video recording',
        icon: Camera,
        color: 'bg-purple-500'
      },
      'Music/DJ': {
        id: 'music_dj',
        title: 'DJ/Music',
        subtitle: 'Keep the party going with great music',
        icon: Music,
        color: 'bg-red-500'
      },
      'Lighting': {
        id: 'lighting',
        title: 'Lighting',
        subtitle: 'Create the perfect ambiance',
        icon: Zap,
        color: 'bg-yellow-500'
      },
      'Security': {
        id: 'security',
        title: 'Security',
        subtitle: 'Professional security services',
        icon: UserCheck,
        color: 'bg-gray-500'
      },
      'Cleaning': {
        id: 'cleaning',
        title: 'Cleaning',
        subtitle: 'Post-event cleanup services',
        icon: Sparkles,
        color: 'bg-teal-500'
      },
      'Transportation': {
        id: 'transportation',
        title: 'Transportation',
        subtitle: 'Reliable transport services',
        icon: MapPin,
        color: 'bg-blue-600'
      }
    };

    // Add services from questionnaire
    const allServices = [...(questionnaireFilters.core_services || []), ...(questionnaireFilters.extras || [])];
    allServices.forEach(serviceName => {
      const mapping = serviceMapping[serviceName];
      if (mapping) {
        steps.push({
          ...mapping,
          searchable: true,
          required: false,
          autoFilters: formatAutoFilters(questionnaireFilters, mapping.id)
        });
      }
    });

    // Add-on services (extras) with special mapping
    const addonMapping = {
      'Photo Booths': {
        id: 'photo_booth',
        title: 'Photo Booths',
        subtitle: 'Interactive photo experiences',
        icon: Camera,
        color: 'bg-purple-600'
      },
      'Cold Spark Machines': {
        id: 'cold_sparks',
        title: 'Cold Spark Machines',
        subtitle: 'Spectacular visual effects',
        icon: Sparkles,
        color: 'bg-blue-400'
      },
      'LED Dance Floor': {
        id: 'led_floor',
        title: 'LED Dance Floor',
        subtitle: 'Interactive illuminated dance floor',
        icon: Zap,
        color: 'bg-purple-400'
      },
      'LED Screens': {
        id: 'led_screens',
        title: 'LED Screens',
        subtitle: 'Large format displays',
        icon: Eye,
        color: 'bg-indigo-400'
      },
      'Live Shows': {
        id: 'live_shows',
        title: 'Live Shows',
        subtitle: 'Professional entertainment acts',
        icon: User,
        color: 'bg-orange-500'
      },
      'Dance in the Clouds': {
        id: 'dance_clouds',
        title: 'Dance in the Clouds',
        subtitle: 'Low-lying fog effects for dancing',
        icon: Sparkles,
        color: 'bg-cyan-500'
      }
    };

    // Add addon services
    const extras = questionnaireFilters.extras || [];
    extras.forEach(extraName => {
      const mapping = addonMapping[extraName];
      if (mapping) {
        steps.push({
          ...mapping,
          searchable: true,
          required: false,
          autoFilters: formatAutoFilters(questionnaireFilters, mapping.id)
        });
      }
    });

    // Always include review step
    steps.push({
      id: 'review',
      title: 'Review',
      subtitle: 'Review and finalize your event plan',
      icon: CheckCircle,
      color: 'bg-green-600',
      searchable: false,
      required: true
    });

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

  // Use dynamic steps based on questionnaire
  const plannerSteps = generateDynamicPlannerSteps(questionnaireFilters);

  useEffect(() => {
    // Load saved plan and cart from backend when component mounts
    loadSavedPlan();
    loadCartFromBackend();
    
    // If in continue mode, load planning progress
    if (currentMode === 'continue') {
      loadPlanningProgress();
    }
  }, [eventId, currentMode]);

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
          response = await axios.get(`${API}/match/venues/event/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
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
          response = await axios.get(`${API}/venues/search?${params}`);
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
        response = await axios.get(`${API}/events/${eventId}/planner/vendors/${stepId}?${params}`);
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

  // Render different interfaces based on current mode
  if (currentMode === 'continue') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-4 mx-auto p-0 border w-full max-w-7xl shadow-lg rounded-lg bg-white mb-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center space-x-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Play className="h-6 w-6 text-green-600 mr-2" />
                  Continue Event Planning
                </h2>
                <p className="text-sm text-gray-600">{eventData?.name || 'My Event'}</p>
              </div>
              
              {/* Step-by-Step Mode Button - Moved to Header */}
              <button
                onClick={() => {
                  // Switch to step-by-step mode for detailed planning with shopping cart
                  setCurrentMode('new');
                  setCurrentStep(planningProgress.completedSteps || 0);
                  // Load vendors for the current step
                  const stepToLoad = plannerSteps[planningProgress.completedSteps || 0];
                  if (stepToLoad && stepToLoad.id !== 'review') {
                    searchVendors(stepToLoad.id);
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                title="Switch to detailed step-by-step planning with shopping cart"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Step-by-Step Mode
              </button>
            </div>
            
            <button 
              onClick={handleClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              title="Close planner"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Continue Planning Content */}
          <div className="p-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Progress Summary */}
              <div className="lg:col-span-1">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                  
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Completed Services</span>
                        <span>{planningProgress.completedSteps}/{planningProgress.totalServices || 9}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300" 
                          style={{width: `${((planningProgress.completedSteps || 0) / (planningProgress.totalServices || 9)) * 100}%`}}
                        ></div>
                      </div>
                    </div>

                    {/* Detailed Budget Overview - Moved from Step-by-Step Mode */}
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                        Budget Overview
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Budget Summary */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-sm text-gray-600">Target Budget</p>
                              <p className="text-lg font-semibold text-gray-900">${eventData?.budget?.toLocaleString() || '0'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Committed</p>
                              <p className="text-lg font-semibold text-green-600">${budgetData.selected?.toLocaleString() || '0'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Remaining</p>
                              <p className={`text-lg font-semibold ${budgetData.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${budgetData.remaining?.toLocaleString() || '0'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300" 
                              style={{width: `${budgetData.set > 0 ? Math.min((budgetData.selected / budgetData.set) * 100, 100) : 0}%`}}
                            ></div>
                          </div>
                        </div>

                        {/* Category Breakdown */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-3">Category Breakdown</h5>
                          <div className="space-y-2">
                            {[
                              { name: 'Venue', committed: planningProgress.selectedVendors?.find(v => v.service_type === 'venue')?.price || 0, color: 'bg-blue-500' },
                              { name: 'Catering', committed: planningProgress.selectedVendors?.find(v => v.service_type === 'catering')?.price || 0, color: 'bg-green-500' },
                              { name: 'Photography', committed: planningProgress.selectedVendors?.find(v => v.service_type === 'photography')?.price || 0, color: 'bg-purple-500' },
                              { name: 'Decoration', committed: planningProgress.selectedVendors?.find(v => v.service_type === 'decoration')?.price || 0, color: 'bg-pink-500' },
                              { name: 'DJ/Music', committed: planningProgress.selectedVendors?.find(v => v.service_type === 'dj')?.price || 0, color: 'bg-indigo-500' },
                              { name: 'Bar Service', committed: planningProgress.selectedVendors?.find(v => v.service_type === 'bar')?.price || 0, color: 'bg-red-500' }
                            ].map(category => (
                              <div key={category.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded ${category.color} mr-2`}></div>
                                  <span className="text-gray-700">{category.name}</span>
                                </div>
                                <span className="font-medium text-gray-900">${category.committed.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Edit Budget Settings Button */}
                        <button className="w-full px-4 py-2 border-2 border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium">
                          Edit Budget Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Vendors */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Selected Vendors</h3>
                  </div>
                  <div className="p-4">
                    {planningProgress.selectedVendors && planningProgress.selectedVendors.length > 0 ? (
                      <div className="space-y-3">
                        {planningProgress.selectedVendors.map((vendor, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {vendor.service_type === 'venue' && '🏛️'}
                                  {vendor.service_type === 'catering' && '🍽️'}
                                  {vendor.service_type === 'photography' && '📸'}
                                  {vendor.service_type === 'decoration' && '🎨'}
                                  {vendor.service_type === 'dj' && '🎵'}
                                  {vendor.service_type === 'bar' && '🍸'}
                                  {vendor.service_type === 'planner' && '📋'}
                                  {vendor.service_type === 'staffing' && '👥'}
                                  {vendor.service_type === 'entertainment' && '🎭'}
                                  {!['venue', 'catering', 'photography', 'decoration', 'dj', 'bar', 'planner', 'staffing', 'entertainment'].includes(vendor.service_type) && '🔧'}
                                  {' '}{vendor.vendor_name}
                                </p>
                                <p className="text-sm text-gray-600 capitalize">{vendor.service_type}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-green-600">${vendor.price?.toLocaleString()}</span>
                              <button 
                                onClick={() => removeFromCart(vendor.id || index)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remove vendor"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <Users className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-gray-600">No vendors selected yet</p>
                        <p className="text-sm text-gray-500">Start by selecting services below</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Service Selection Icons */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-2" />
                  Vendor Selection Status
                </h3>
                <p className="text-sm text-gray-600 mt-1">Track your progress and select vendors for each service category</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[
                    { id: 'venue', name: 'Venue', icon: '🏛️', category: 'venue' },
                    { id: 'decoration', name: 'Decoration', icon: '🎨', category: 'decoration' },
                    { id: 'catering', name: 'Catering', icon: '🍽️', category: 'catering' },
                    { id: 'bar', name: 'Bar Service', icon: '🍸', category: 'bar' },
                    { id: 'planner', name: 'Coordinator', icon: '📋', category: 'planner' },
                    { id: 'photography', name: 'Photography', icon: '📸', category: 'photography' },
                    { id: 'dj', name: 'DJ/Music', icon: '🎵', category: 'dj' },
                    { id: 'staffing', name: 'Staff', icon: '👥', category: 'staffing' },
                    { id: 'entertainment', name: 'Entertainment', icon: '🎭', category: 'entertainment' }
                  ].map((service) => {
                    // Find if this service has a selected vendor
                    const selectedVendor = planningProgress.selectedVendors?.find(
                      vendor => vendor.service_type === service.category
                    );
                    
                    const isSelected = !!selectedVendor;
                    const isPending = planningProgress.pendingServices?.some(
                      pending => pending.id === service.id
                    );
                    
                    return (
                      <div 
                        key={service.id} 
                        className={`relative border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                          isSelected 
                            ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' 
                            : isPending 
                              ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 hover:border-purple-400' 
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            // Show vendor details modal
                            setSelectedVendorForDetails(selectedVendor);
                          } else {
                            // Navigate to vendor selection for this category
                            const stepIndex = plannerSteps.findIndex(step => step.id === service.id);
                            if (stepIndex !== -1) {
                              setCurrentStep(stepIndex);
                              setCurrentMode('new'); // Switch to step-by-step mode
                              searchVendors(service.category);
                            }
                          }
                        }}
                      >
                        {/* Status Badge */}
                        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected 
                            ? 'bg-green-500 text-white' 
                            : isPending 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isSelected ? '✓' : isPending ? '!' : '○'}
                        </div>
                        
                        {/* Vendor Image or Icon */}
                        <div className="text-center mb-3">
                          {isSelected && selectedVendor.image ? (
                            <div className="relative">
                              <img 
                                src={selectedVendor.image} 
                                alt={selectedVendor.vendor_name}
                                className="w-12 h-12 rounded-full mx-auto object-cover border-2 border-green-300"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div className="text-3xl hidden">{service.icon}</div>
                            </div>
                          ) : (
                            <div className="text-3xl">{service.icon}</div>
                          )}
                        </div>
                        
                        {/* Service Name */}
                        <h4 className={`font-medium text-center mb-2 ${
                          isSelected ? 'text-green-900' : isPending ? 'text-purple-900' : 'text-gray-700'
                        }`}>
                          {service.name}
                        </h4>
                        
                        {/* Status/Action */}
                        <div className="text-center">
                          {isSelected ? (
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-1">
                                {selectedVendor.vendor_name}
                              </p>
                              <p className="text-xs text-green-600 mb-2">
                                ${selectedVendor.price?.toLocaleString()}
                              </p>
                              <div className="flex space-x-1">
                                <button className="flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                                  View
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Navigate to vendor selection to replace
                                    const stepIndex = plannerSteps.findIndex(step => step.id === service.id);
                                    if (stepIndex !== -1) {
                                      setCurrentStep(stepIndex);
                                      setCurrentMode('new');
                                      searchVendors(service.category);
                                    }
                                  }}
                                  className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          ) : isPending ? (
                            <button className="w-full px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors">
                              Select Now
                            </button>
                          ) : (
                            <button className="w-full px-3 py-2 bg-gray-400 text-white text-xs font-medium rounded-lg cursor-not-allowed">
                              Complete Previous
                            </button>
                          )}
                        </div>
                        
                        {/* Priority Indicator for Next Step */}
                        {isPending && planningProgress.pendingServices?.findIndex(pending => pending.id === service.id) === 0 && (
                          <div className="absolute -top-1 -left-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                            NEXT
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Indicator */}
                <div className="mt-6 bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Vendor Selection Progress</span>
                    <span className="text-sm text-gray-600">
                      {planningProgress.selectedVendors?.length || 0} of 9 selected
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{width: `${((planningProgress.selectedVendors?.length || 0) / 9) * 100}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Just Started</span>
                    <span>Ready to Book</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <div className="space-x-3">
                {planningProgress.selectedVendors && planningProgress.selectedVendors.length > 0 && (
                  <button
                    onClick={finalizeEventPlan}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Finalizing...' : 'Finalize Plan'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default mode (new planning) - original interface
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      {/* Debug Component */}
      {process.env.REACT_APP_DEBUG_MATCHING === 'true' && <DebugPlanner event={eventData} />}
      
      <div className="relative top-4 mx-auto p-0 border w-full max-w-7xl shadow-lg rounded-lg bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Interactive Event Planner</h2>
              <p className="text-sm text-gray-600">{eventData?.name || 'My Event'}</p>
            </div>
            
            {/* Back to Progress View Button - Only show if we started from continue mode */}
            {mode === 'continue' && (
              <button
                onClick={() => {
                  setCurrentMode('continue');
                  loadPlanningProgress();
                }}
                className="inline-flex items-center px-3 py-2 text-sm border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                title="Back to progress overview"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Progress View
              </button>
            )}
          </div>
          
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Close planner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step-by-Step Mode: Vendor Selection Focus */}
        <div className="flex h-full">
          {/* Main Content - Vendor Selection */}
          <div className="flex-1 p-6 pr-3">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                <Wand2 className="h-6 w-6 text-purple-600 mr-2" />
                Questionnaire-Synced Vendor Selection
              </h3>
              <p className="text-gray-600">Services from your questionnaire. Click to select vendors with auto-applied filters.</p>
              
              {/* At-Home Event Banner */}
              {isAtHome && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center">
                  <div className="text-amber-600 mr-3">🏠</div>
                  <div>
                    <p className="text-amber-800 font-medium">At-home event selected — venue disabled</p>
                    <p className="text-amber-700 text-sm">Your event will be hosted at your own location</p>
                  </div>
                </div>
              )}
              
              {/* Progress Indicator - Dynamic based on questionnaire */}
              <div className="mt-4 bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700 font-medium">
                    Progress: {cart.length} of {plannerSteps.length - 2} services selected
                  </span>
                  <span className="text-purple-600">
                    ${cart.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()} committed
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{width: `${Math.max(0, (cart.length / Math.max(1, plannerSteps.length - 2)) * 100)}%`}}
                  ></div>
                </div>
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

            {/* Sparkle Your Event - Optional Upsells */}
            {(() => {
              // Define services NOT selected in questionnaire
              const allOptionalServices = [
                { id: 'flowers', name: 'Floral Arrangements', icon: '💐', category: 'flowers', color: 'from-rose-400 to-pink-500' },
                { id: 'lighting', name: 'Special Lighting', icon: '💡', category: 'lighting', color: 'from-yellow-400 to-amber-500' },
                { id: 'photo_booth', name: 'Photo Booth', icon: '📷', category: 'photo_booth', color: 'from-blue-400 to-indigo-500' },
                { id: 'live_music', name: 'Live Music', icon: '🎼', category: 'live_music', color: 'from-purple-400 to-violet-500' },
                { id: 'dessert_bar', name: 'Dessert Bar', icon: '🍰', category: 'dessert_bar', color: 'from-pink-400 to-rose-500' },
                { id: 'cocktail_hour', name: 'Cocktail Hour', icon: '🍸', category: 'cocktail_hour', color: 'from-emerald-400 to-teal-500' }
              ];

              // Filter out services already selected in questionnaire
              const upsellServices = allOptionalServices.filter(service => 
                !availableServices.includes(service.category) && 
                !availableServices.includes(service.id) &&
                !cart.some(item => item.service_type === service.category)
              );

              if (upsellServices.length === 0) return null;

              return (
                <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
                      ✨ Sparkle Your Event
                    </h3>
                    <p className="text-gray-600">Popular add-ons to make your event extra special</p>
                    <div className="text-xs text-purple-700 bg-purple-100 rounded-full px-3 py-1 inline-block mt-2">
                      Optional Enhancements
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {upsellServices.slice(0, 6).map((service) => (
                      <div 
                        key={service.id} 
                        className={`relative rounded-lg p-4 transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br ${service.color} text-white shadow-md hover:shadow-lg border-2 border-transparent hover:border-white`}
                        onClick={() => {
                          // Add this service to available services and search vendors
                          setAvailableServices(prev => [...prev, service.category]);
                          searchVendorsWithFilters(service.category);
                        }}
                      >
                        {/* Popular Badge */}
                        <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1 py-0.5 rounded-full shadow-sm">
                          HOT
                        </div>
                        
                        {/* Service Icon */}
                        <div className="text-center mb-2">
                          <div className="text-2xl mb-1">{service.icon}</div>
                        </div>
                        
                        {/* Service Name */}
                        <h5 className="font-medium text-center text-xs text-white leading-tight">
                          {service.name}
                        </h5>
                        
                        {/* Add Button */}
                        <button className="w-full mt-2 px-2 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded hover:bg-opacity-30 transition-colors backdrop-blur-sm">
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Sparkle Footer */}
                  <div className="text-center mt-4">
                    <p className="text-xs text-purple-600">
                      💫 These suggestions are based on popular trends and similar events
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Progress Indicator */}
            <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Selection Progress</h4>
                <span className="text-sm text-gray-600">
                  {cart.length} of 9 services selected
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-green-500 h-3 rounded-full transition-all duration-300" 
                  style={{width: `${(cart.length / 9) * 100}%`}}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Getting Started</span>
                <span>Ready to Book</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t mt-8">
              <button
                onClick={() => setCurrentMode('continue')}
                className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Back to Progress View
              </button>
              
              <div className="flex space-x-3">
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Export Summary
                </button>
                <button 
                  onClick={handleClose}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Close Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Right Side Panel - Live Shopping Cart */}
          <div className="w-80 bg-gradient-to-b from-purple-50 to-indigo-50 border-l-2 border-purple-200 p-6">
            <div className="sticky top-0">
              {/* Cart Header with Progress */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <ShoppingCart className="h-5 w-5 text-purple-600 mr-2" />
                  Live Shopping Cart
                  <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {cart.length}/9
                  </span>
                </h4>
                
                {/* Real-time Progress Bar */}
                <div className="bg-white rounded-lg p-3 border border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Selection Progress</span>
                    <span className="font-medium text-purple-600">
                      {Math.round((cart.length / 9) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{width: `${(cart.length / 9) * 100}%`}}
                    ></div>
                  </div>
                </div>
              </div>
              
              {cart.length === 0 ? (
                /* Enhanced Empty State */
                <div className="text-center py-8 bg-white rounded-lg border border-purple-200 shadow-sm">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-purple-400" />
                  <p className="text-gray-700 font-medium mb-1">Ready to Start</p>
                  <p className="text-sm text-gray-500 mb-4">Click on service categories to add vendors</p>
                  <div className="text-xs text-purple-600 bg-purple-100 px-3 py-1 rounded-full inline-block">
                    ✨ Real-time updates
                  </div>
                </div>
              ) : (
                /* Enhanced Cart Items */
                <div className="space-y-3">
                  <div className="max-h-80 overflow-y-auto space-y-3">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {/* Service Icon */}
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm">
                              {item.service_type === 'venue' && '🏛️'}
                              {item.service_type === 'catering' && '🍽️'}
                              {item.service_type === 'photography' && '📸'}
                              {item.service_type === 'decoration' && '🎨'}
                              {item.service_type === 'dj' && '🎵'}
                              {item.service_type === 'bar' && '🍸'}
                              {item.service_type === 'planner' && '📋'}
                              {item.service_type === 'staffing' && '👥'}
                              {item.service_type === 'entertainment' && '🎭'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm leading-tight truncate">{item.vendor_name}</p>
                              <p className="text-xs text-gray-600 capitalize mt-1">{item.service_type}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              removeFromCart(item.id || index);
                              // Show feedback
                              const serviceName = item.service_type.charAt(0).toUpperCase() + item.service_type.slice(1);
                              // You could add a toast notification here
                            }}
                            className="text-red-500 hover:text-red-700 p-1 ml-2 hover:bg-red-50 rounded transition-colors"
                            title="Remove vendor"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-600">${item.price?.toLocaleString()}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              ✓ Added
                            </span>
                            <button 
                              onClick={() => setSelectedVendorForDetails(item)}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Enhanced Cart Summary */}
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      Budget Impact
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal ({cart.length} items):</span>
                        <span className="font-medium">${cart.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax & Fees (10%):</span>
                        <span className="font-medium">${Math.round(cart.reduce((sum, item) => sum + (item.price || 0), 0) * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Total:</span>
                          <span className="font-bold text-lg text-purple-600">
                            ${Math.round(cart.reduce((sum, item) => sum + (item.price || 0), 0) * 1.1).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Budget Status */}
                      {eventData?.budget && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Budget Remaining:</span>
                            <span className={`font-medium ${
                              (eventData.budget - Math.round(cart.reduce((sum, item) => sum + (item.price || 0), 0) * 1.1)) >= 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              ${(eventData.budget - Math.round(cart.reduce((sum, item) => sum + (item.price || 0), 0) * 1.1)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Cart Actions */}
                    <div className="space-y-2 mt-4">
                      {cart.length < 9 && (
                        <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-700 font-medium">
                            {9 - cart.length} more services to complete your event
                          </p>
                        </div>
                      )}
                      
                      <button 
                        onClick={finalizeEventPlan}
                        disabled={saving || cart.length === 0}
                        className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                          cart.length === 9 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform hover:scale-105' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        {saving 
                          ? 'Processing...' 
                          : cart.length === 9 
                            ? '🎉 Complete & Book All Services' 
                            : `Book ${cart.length} Selected Services`
                        }
                      </button>
                      
                      {cart.length > 0 && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Clear all selected vendors from cart?')) {
                              setCart([]);
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                        >
                          Clear Cart ({cart.length} items)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Appointments & Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                Upcoming Appointments
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Venue Walkthrough</p>
                    <p className="text-sm text-gray-600">Grand Palace Hall</p>
                    <p className="text-xs text-blue-600 mt-1">Aug 20, 2025 - 3:00 PM</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">Confirmed</span>
                </div>
                
                <div className="text-center py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    View Full Calendar
                  </button>
                </div>
              </div>
            </div>

            {/* Critical Tasks & Alerts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                Tasks & Alerts
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Insurance Certificate Required</p>
                    <p className="text-sm text-gray-600">Upload COI for venue booking</p>
                    <p className="text-xs text-amber-600 mt-1">Due: Aug 25, 2025</p>
                  </div>
                </div>
                
                <div className="text-center py-4">
                  <button className="text-amber-600 hover:text-amber-800 text-sm">
                    View All Tasks
                  </button>
                </div>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={() => setCurrentMode('continue')}
              className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Back to Progress View
            </button>
            
            <div className="flex space-x-3">
              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Export Summary
              </button>
              <button 
                onClick={handleClose}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveEventPlanner;
