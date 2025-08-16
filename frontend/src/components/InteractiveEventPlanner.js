import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Search, Plus, Trash2, X, Save, 
  DollarSign, Users, MapPin, Camera, Music, Utensils, 
  Sparkles, UserCheck, Calendar, ShoppingCart, AlertTriangle,
  CheckCircle, Eye, FastForward, RotateCcw, Wine, Zap, User, Edit3
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InteractiveEventPlanner = ({ eventId, currentEvent, onClose, onPlanSaved }) => {
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
        setEventData(currentEvent);
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

        const response = await axios.get(`${API}/events`, {
          headers
        });
        
        if (response.data.events && response.data.events.length > 0) {
          // Get the most recent event
          const recentEvent = response.data.events[0];
          setEventData(recentEvent);
          setBudgetData({
            set: recentEvent.budget || 0,
            selected: 0,
            remaining: recentEvent.budget || 0
          });
        } else {
          // No events found, set nice default data for demonstration
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
        }
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

  // Define all possible steps
  const allPlannerSteps = [
    {
      id: 'planning',
      title: 'Start Planning',
      subtitle: 'Review your event details and begin the planning process',
      icon: Calendar,
      color: 'bg-purple-500',
      searchable: false,
      required: false
    },
    {
      id: 'venue',
      title: 'Venue',
      subtitle: 'Find the perfect location for your event',
      icon: MapPin,
      color: 'bg-blue-500',
      searchable: true,
      required: true
    },
    {
      id: 'decoration',
      title: 'Decoration',
      subtitle: 'Transform your space with beautiful decorations',
      icon: Sparkles,
      color: 'bg-pink-500',
      searchable: true,
      required: false
    },
    {
      id: 'catering',
      title: 'Catering',
      subtitle: 'Delicious food and beverages for your guests',
      icon: Utensils,
      color: 'bg-green-500',
      searchable: true,
      required: false
    },
    {
      id: 'bar',
      title: 'Bar Service',
      subtitle: 'Professional bartending and drink service',
      icon: Wine,
      color: 'bg-red-500',
      searchable: true,
      required: false
    },
    {
      id: 'planner',
      title: 'Event Planner',
      subtitle: 'Professional coordination and management',
      icon: UserCheck,
      color: 'bg-indigo-500',
      searchable: true,
      required: false
    },
    {
      id: 'photography',
      title: 'Photography',
      subtitle: 'Capture every precious moment',
      icon: Camera,
      color: 'bg-yellow-500',
      searchable: true,
      required: false
    },
    {
      id: 'dj',
      title: 'DJ & Music',
      subtitle: 'Keep the party going with great music',
      icon: Music,
      color: 'bg-purple-500',
      searchable: true,
      required: false
    },
    {
      id: 'staffing',
      title: 'Waitstaff',
      subtitle: 'Professional service staff for your event',
      icon: User,
      color: 'bg-teal-500',
      searchable: true,
      required: false
    },
    {
      id: 'entertainment',
      title: 'Entertainment',
      subtitle: 'Special performances and activities',
      icon: Zap,
      color: 'bg-orange-500',
      searchable: true,
      required: false
    },
    {
      id: 'review',
      title: 'Review',
      subtitle: 'Review and finalize your event plan',
      icon: CheckCircle,
      color: 'bg-green-600',
      searchable: false,
      required: true
    }
  ];

  // Filter steps based on venue type and services needed
  const plannerSteps = allPlannerSteps.filter(step => {
    // Always include planning and review steps
    if (step.id === 'planning' || step.id === 'review') {
      return true;
    }
    
    // Conditionally include venue step
    if (step.id === 'venue') {
      return shouldIncludeVenueStep();
    }
    
    // For service steps, check if they're needed
    return true; // We'll handle filtering in the step content instead
  });

  useEffect(() => {
    // Load saved plan and cart from backend when component mounts
    loadSavedPlan();
    loadCartFromBackend();
  }, [eventId]);

  useEffect(() => {
    // Update budget calculations when cart changes
    updateBudgetCalculations();
  }, [cart]);

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
        // Enhanced venue filtering based on event's preferred venue type
        if (currentEvent?.location) {
          params.append('city', currentEvent.location);
        }
        if (currentEvent?.guest_count) {
          params.append('capacity_min', Math.floor(currentEvent.guest_count * 0.8));
          params.append('capacity_max', Math.ceil(currentEvent.guest_count * 1.2));
        }
        
        // FILTERING: Only show venues matching preferred venue type
        if (currentEvent?.preferred_venue_type) {
          params.append('preferred_venue_type', currentEvent.preferred_venue_type);
        }
        
        response = await axios.get(`${API}/venues/search?${params}`);
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
        [stepId]: response.data?.vendors || response.data || []
      }));
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
      
      // Use the new Interactive Event Planner finalize endpoint
      const response = await axios.post(`${API}/events/${eventId}/planner/finalize`, {}, getAuthHeaders());

      if (response.data) {
        const bookings = response.data.bookings_created || [];
        
        // Notify parent component
        if (onPlanSaved) {
          onPlanSaved(bookings);
        }
        
        // Clear local state
        setCart([]);
        setSelectedServices({});
        
        alert(`Event plan finalized successfully! Created ${bookings.length} vendor bookings with total cost of ${formatCurrency(response.data.total_cost || 0)}.`);
        
        onClose();
      }
    } catch (err) {
      console.error('Error finalizing event plan:', err);
      alert('Failed to finalize event plan. Please try again.');
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
                    Based on your {formatCurrency(eventData.budget)} budget, we recommend allocating approximately:
                  </p>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <span>• Venue: {formatCurrency(eventData.budget * 0.4)} (40%)</span>
                    <span>• Catering: {formatCurrency(eventData.budget * 0.3)} (30%)</span>
                    <span>• Decoration: {formatCurrency(eventData.budget * 0.15)} (15%)</span>
                    <span>• Entertainment: {formatCurrency(eventData.budget * 0.1)} (10%)</span>
                    <span>• Other: {formatCurrency(eventData.budget * 0.05)} (5%)</span>
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

        {/* Vendor Grid */}
        {stepVendors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stepVendors.map((vendor) => renderVendorCard(vendor, step.id))}
          </div>
        )}

        {/* No Results / Extra Services Suggestion */}
        {!loading && stepVendors.length === 0 && vendors[step.id] !== undefined && (
          <div className="text-center py-8">
            {checkIfServiceNeeded(step.id, currentEvent?.services_needed || []) ? (
              // Standard no results message for needed services
              <div className="text-gray-500">
                <Search className="mx-auto h-8 w-8 mb-2" />
                <p>No {step.title.toLowerCase()} found matching your criteria</p>
                <button
                  onClick={() => searchVendors(step.id, '')}
                  className="mt-2 text-purple-600 hover:text-purple-800"
                >
                  View all options
                </button>
              </div>
            ) : (
              // "Sparkle Your Event" suggestion for extra services
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-xl border border-purple-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">✨</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-purple-900 mb-2">
                  ✨ Sparkle Your Event with {step.title}!
                </h3>
                
                <p className="text-purple-700 mb-6 max-w-md mx-auto">
                  You didn't originally select {step.title.toLowerCase()}, but adding this service could make your event even more special! 
                  Discover amazing {step.title.toLowerCase()} options that could enhance your celebration.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      // Add this service to the event's needed services and search
                      const updatedServices = [...(currentEvent?.services_needed || [])];
                      if (!updatedServices.includes(step.title)) {
                        updatedServices.push(step.title);
                      }
                      // Update the event data via API call (we don't modify state directly since this is a prop)
                      // For now, just search for vendors as if the service was needed
                      searchVendors(step.id, '');
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Explore {step.title} Options
                  </button>
                  
                  <button
                    onClick={() => nextStep()}
                    className="inline-flex items-center px-6 py-3 border border-purple-300 text-purple-700 font-medium rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    Skip This Service
                  </button>
                </div>
                
                <div className="mt-4 text-sm text-purple-600">
                  <p>💡 <strong>Tip:</strong> Adding extra services often creates a more memorable and seamless experience for your guests!</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-0 border w-full max-w-7xl shadow-lg rounded-lg bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Interactive Event Planner</h2>
            <p className="text-sm text-gray-600">{eventData?.name || 'My Event'}</p>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Close planner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {plannerSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = selectedServices[step.id] || index < currentStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <button
                      onClick={() => goToStep(index)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isActive
                          ? `${step.color} text-white`
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                    <span className={`text-xs text-center ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {plannerSteps[currentStep].title}
                </h3>
                <p className="text-gray-600 mt-1">
                  {plannerSteps[currentStep].subtitle}
                </p>
              </div>
              
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => savePlan()}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </button>

                {currentStep < plannerSteps.length - 1 && (
                  <button
                    onClick={skipStep}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <FastForward className="h-4 w-4 mr-2" />
                    Skip
                  </button>
                )}

                <button
                  onClick={nextStep}
                  disabled={currentStep >= plannerSteps.length - 1}
                  className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Shopping Cart Panel */}
          <div className="w-80 border-l bg-gray-50 p-6">
            <div className="sticky top-0">
              {/* Budget Tracker */}
              <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budget Tracker
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget Set:</span>
                    <span className="font-medium">{formatCurrency(budgetData.set)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Selected:</span>
                    <span className="font-medium text-purple-600">{formatCurrency(budgetData.selected)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-600">Remaining:</span>
                    <span className={`font-bold ${budgetData.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budgetData.remaining)}
                    </span>
                  </div>
                </div>

                {budgetData.remaining < 0 && (
                  <div className="mt-3 p-2 bg-red-50 rounded-md flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-xs text-red-700">Over budget!</span>
                  </div>
                )}
              </div>

              {/* Shopping Cart */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Selected Services ({cart.length})
                  </h4>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No services selected</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h5>
                            <p className="text-xs text-gray-600">{item.serviceType}</p>
                            <p className="text-sm font-medium text-purple-600 mt-1">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-purple-600">{formatCurrency(budgetData.selected)}</span>
                    </div>
                    {currentEvent?.guest_count && (
                      <div className="text-xs text-gray-600 text-center mt-1">
                        Estimated total for {currentEvent.guest_count} guests: {formatCurrency(budgetData.selected * currentEvent.guest_count)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Event Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(editingField === 'all' || editingField === 'event_type') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    name="event_type"
                    value={editFormData.event_type}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select event type</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Quinceañera">Quinceañera</option>
                    <option value="Sweet 16">Sweet 16</option>
                    <option value="Bar/Bat Mitzvah">Bar/Bat Mitzvah</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Baby Shower">Baby Shower</option>
                    <option value="Retirement">Retirement</option>
                  </select>
                </div>
              )}

              {(editingField === 'all' || editingField === 'guest_count') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest Count
                  </label>
                  <input
                    type="number"
                    name="guest_count"
                    value={editFormData.guest_count}
                    onChange={handleEditInputChange}
                    placeholder="Number of guests"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {(editingField === 'all' || editingField === 'budget') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={editFormData.budget}
                    onChange={handleEditInputChange}
                    placeholder="Total budget"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {(editingField === 'all' || editingField === 'location') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location/City
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleEditInputChange}
                      placeholder="City or area"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zipcode
                    </label>
                    <input
                      type="text"
                      name="zipcode"
                      value={editFormData.zipcode}
                      onChange={handleEditInputChange}
                      placeholder="12345"
                      maxLength="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEventData}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveEventPlanner;