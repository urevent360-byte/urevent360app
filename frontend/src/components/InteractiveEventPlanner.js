import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { 
  ChevronLeft, ChevronRight, Search, Plus, Trash2, X, Save, 
  DollarSign, Users, MapPin, Camera, Music, Utensils, 
  Sparkles, UserCheck, Calendar, ShoppingCart, AlertTriangle,
  CheckCircle, Eye, FastForward, RotateCcw, Wine, Zap, User
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InteractiveEventPlanner = ({ eventId, currentEvent, onClose, onPlanSaved }) => {
  const { token } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerms, setSearchTerms] = useState({});
  const [vendors, setVendors] = useState({});
  const [selectedServices, setSelectedServices] = useState({});
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [budgetData, setBudgetData] = useState({
    set: currentEvent?.budget || 0,
    selected: 0,
    remaining: currentEvent?.budget || 0
  });
  const [expandedCard, setExpandedCard] = useState(null);

  const plannerSteps = [
    {
      id: 'venue',
      title: 'Select Venue',
      subtitle: 'Choose the perfect location for your event',
      icon: MapPin,
      color: 'bg-blue-500',
      searchable: true,
      required: false
    },
    {
      id: 'decoration',
      title: 'Event Decoration',
      subtitle: 'Transform your space with beautiful decorations',
      icon: Sparkles,
      color: 'bg-purple-500',
      searchable: true,
      required: false
    },
    {
      id: 'catering',
      title: 'Catering Services',
      subtitle: 'Delight your guests with amazing food',
      icon: Utensils,
      color: 'bg-green-500',
      searchable: true,
      required: false
    },
    {
      id: 'bar',
      title: 'Bar Services',
      subtitle: 'Professional bar and beverage service',
      icon: Wine,
      color: 'bg-amber-500',
      searchable: true,
      required: false
    },
    {
      id: 'planner',
      title: 'Event Planner',
      subtitle: 'Professional event planning and coordination',
      icon: Calendar,
      color: 'bg-teal-500',
      searchable: true,
      required: false
    },
    {
      id: 'photography',
      title: 'Photography & Video',
      subtitle: 'Capture every precious moment',
      icon: Camera,
      color: 'bg-indigo-500',
      searchable: true,
      required: false
    },
    {
      id: 'dj',
      title: 'DJ & Music',
      subtitle: 'Set the perfect mood with music',
      icon: Music,
      color: 'bg-red-500',
      searchable: true,
      required: false
    },
    {
      id: 'staffing',
      title: 'Waitstaff Service',
      subtitle: 'Professional staff for seamless service',
      icon: UserCheck,
      color: 'bg-orange-500',
      searchable: true,
      required: false
    },
    {
      id: 'entertainment',
      title: 'Entertainment',
      subtitle: 'Additional entertainment for your guests',
      icon: Zap,
      color: 'bg-pink-500',
      searchable: true,
      required: false
    },
    {
      id: 'review',
      title: 'Review & Confirm',
      subtitle: 'Review your selections and finalize your event plan',
      icon: CheckCircle,
      color: 'bg-emerald-500',
      searchable: false,
      required: false
    }
  ];

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
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
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
        // Use venue search API
        if (currentEvent?.location) {
          params.append('city', currentEvent.location);
        }
        if (currentEvent?.guest_count) {
          params.append('capacity_min', Math.floor(currentEvent.guest_count * 0.8));
          params.append('capacity_max', Math.ceil(currentEvent.guest_count * 1.2));
        }
        response = await axios.get(`${API}/venues/search?${params}`);
      } else {
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
      await axios.delete(`${API}/events/${eventId}/cart/remove/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Refresh cart
      await loadCartFromBackend();
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
      const response = await axios.post(`${API}/events/${eventId}/cart/add`, cartRequest, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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
      await axios.post(`${API}/events/${eventId}/cart/clear`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
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
      const response = await axios.post(`${API}/events/${eventId}/planner/finalize`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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

        {/* No Results */}
        {!loading && stepVendors.length === 0 && vendors[step.id] !== undefined && (
          <div className="text-center py-8 text-gray-500">
            <Search className="mx-auto h-8 w-8 mb-2" />
            <p>No {step.title.toLowerCase()} found matching your criteria</p>
            <button
              onClick={() => searchVendors(step.id, '')}
              className="mt-2 text-purple-600 hover:text-purple-800"
            >
              View all options
            </button>
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
            <p className="text-sm text-gray-600">{currentEvent?.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
    </div>
  );
};

export default InteractiveEventPlanner;