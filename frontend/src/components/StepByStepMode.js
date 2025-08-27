import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  MapPin, 
  Users, 
  Calendar, 
  DollarSign, 
  Star,
  FileText,
  MessageSquare,
  CreditCard,
  Filter,
  Search,
  ArrowLeft,
  Sparkles,
  Play,
  ChevronRight
} from 'lucide-react';
import { EVENT_FLOW_CONFIG, shouldShowCulturalStyles, getVendorTags } from '../config/eventFlowConfig';
import { SERVICE_MAPPING, getServicesBySection, getServicesByContext, getBudgetBuckets } from '../config/serviceMapping';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StepByStepMode = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [activeSection, setActiveSection] = useState('venues');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data for each section
  const [venues, setVenues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Enhanced filtering states
  const [contextFilter, setContextFilter] = useState('both'); // ceremony | reception | both
  const [selectedSubcategories, setSelectedSubcategories] = useState({}); // {service: [subcategories]}
  const [selectedSpecialtyStations, setSelectedSpecialtyStations] = useState([]); // for Catering specialty stations
  
  // Cultural matching states
  const [expandCulturalResults, setExpandCulturalResults] = useState(false); // "Find more options" flag
  const [culturalGrouping, setCulturalGrouping] = useState(null); // Cultural grouping info from API

  // Service gating - filter services based on venue types
  const getFilteredServicesForVenues = (services) => {
    if (!event?.preferred_venue_types) return services;
    
    // If Restaurant is selected, hide certain services by default
    if (event.preferred_venue_types.includes('Restaurant')) {
      const restaurantRestrictedServices = [
        'Catering',  // Restaurants provide their own catering
        'DJ/Band',   // Most restaurants don't allow loud entertainment
        'Decor/Florist',  // Limited decor options in restaurants
        'Photography/Videography',  // May be restricted in restaurants
        'Reception Lighting',  // Restaurants have their own lighting
        'Dance Floor'  // Most restaurants don't have dance floors
      ];
      
      const allowedRestaurantServices = [
        'Photo Booth',  // Small, unobtrusive
        'Transportation',  // Always relevant
        'Cakes',  // Often allowed if restaurant doesn't provide
        'Dessert Stations & Sweets',  // Sometimes allowed
        'Live Entertainment'  // Acoustic/small acts might be OK
      ];
      
      // Filter out restricted services unless restaurant "allows outside vendors"
      return services.filter(service => {
        if (restaurantRestrictedServices.includes(service)) {
          // Check if any selected restaurant venues allow outside vendors
          const allowsOutsideVendors = venues.some(venue => 
            venue.venueTypes?.includes('Restaurant') && 
            venue.restaurant_details?.reservation_rules?.allows_outside_vendors === true
          );
          return allowsOutsideVendors;
        }
        return allowedRestaurantServices.includes(service) || !restaurantRestrictedServices.includes(service);
      });
    }
    
    // If Short-Term Rental is selected, all services are typically allowed
    if (event.preferred_venue_types.includes('Short-Term Rental (Airbnb/VRBO)')) {
      return services; // No restrictions for Airbnb/VRBO
    }
    
    return services;
  };

  // Helper functions for enhanced filtering
  const toggleSubcategory = (service, subcategory) => {
    setSelectedSubcategories(prev => ({
      ...prev,
      [service]: prev[service]?.includes(subcategory)
        ? prev[service].filter(s => s !== subcategory)
        : [...(prev[service] || []), subcategory]
    }));
  };

  const toggleSpecialtyStation = (station) => {
    setSelectedSpecialtyStations(prev => 
      prev.includes(station) 
        ? prev.filter(s => s !== station)
        : [...prev, station]
    );
  };

  const getFilteredVendors = (vendors, service, mapping) => {
    if (!vendors || vendors.length === 0) return [];
    
    // First filter by basic service matching
    let filtered = vendors.filter(vendor => 
      vendor.services.some(s => 
        mapping.vendorTypes.some(type => 
          s.toLowerCase().includes(type.replace('_', ' ')) ||
          type.toLowerCase().includes(s.toLowerCase())
        )
      )
    );

    // Enhanced filtering by vendor capabilities (if available)
    const serviceKey = service.toLowerCase().replace(' ', '_').replace('&', 'and');
    if (selectedSubcategories[service]?.length > 0) {
      filtered = filtered.filter(vendor => {
        if (vendor.capabilities && vendor.capabilities[serviceKey]) {
          return selectedSubcategories[service].some(subcategory =>
            vendor.capabilities[serviceKey].some(cap => 
              cap.toLowerCase().includes(subcategory.toLowerCase()) ||
              subcategory.toLowerCase().includes(cap.toLowerCase())
            )
          );
        }
        return true; // Include vendors without capability data for now
      });
    }

    // Filter by specialty stations for catering
    if (service === 'Catering' && selectedSpecialtyStations.length > 0) {
      filtered = filtered.filter(vendor => {
        if (vendor.capabilities && vendor.capabilities.catering_stations) {
          return selectedSpecialtyStations.some(station =>
            vendor.capabilities.catering_stations.some(cap => 
              cap.toLowerCase().includes(station.toLowerCase()) ||
              station.toLowerCase().includes(cap.toLowerCase())
            )
          );
        }
        return true; // Include vendors without station capability data for now
      });
    }

    return filtered;
  };

  const handleGetQuote = (vendor, service) => {
    // TODO: Implement quote request functionality
    console.log('Requesting quote from:', vendor.name, 'for service:', service);
    alert(`Quote request functionality will be implemented. Vendor: ${vendor.name}, Service: ${service}`);
  };

  const handleViewAllVendors = (service, mapping) => {
    // TODO: Navigate to expanded vendor view
    console.log('View all vendors for:', service, mapping);
    alert(`Expanded vendor view will be implemented for: ${service}`);
  };

  const handleSelectVenue = (venue) => {
    // TODO: Implement venue selection functionality
    console.log('Selected venue:', venue.name);
    alert(`Venue selection functionality will be implemented. Venue: ${venue.name}`);
  };

  const handleRestaurantBooking = (venue) => {
    // TODO: Implement restaurant booking flow
    console.log('Restaurant booking for:', venue.name);
    
    // For now, show mock booking interface
    const partySize = prompt('Party size?', '8');
    const date = prompt('Date (YYYY-MM-DD)?', '2025-08-25');
    const occasion = prompt('Occasion (birthday, anniversary, etc.)?', 'birthday');
    
    if (partySize && date) {
      alert(`Mock reservation created for ${venue.name}:
Party Size: ${partySize}
Date: ${date}
Occasion: ${occasion}
Status: Pending restaurant confirmation`);
    }
  };

  const sections = [
    { id: 'venues', name: 'Venue Matching', icon: MapPin, desc: 'Find the perfect venue' },
    { id: 'core-vendors', name: 'Core Vendors', icon: Users, desc: 'Essential services' },
    { id: 'add-ons', name: 'Add-Ons (Extras)', icon: Star, desc: 'Special enhancements' },
    { id: 'timeline', name: 'Timeline', icon: Calendar, desc: 'Schedule & dates' },
    { id: 'budget', name: 'Budget', icon: DollarSign, desc: 'Financial planning' },
    { id: 'files', name: 'Files', icon: FileText, desc: 'Documents & media' },
    { id: 'notes', name: 'Notes', icon: MessageSquare, desc: 'Ideas & reminders' },
    { id: 'contracts', name: 'Contracts/Payments', icon: CreditCard, desc: 'Agreements & billing' }
  ];

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (event) {
      // Auto-sync data when event is loaded
      if (activeSection === 'venues') {
        fetchVenues();
      } else if (activeSection === 'core-vendors' || activeSection === 'add-ons') {
        fetchVendors();
      }
    }
  }, [event, activeSection]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/events/${eventId}`, {
        headers: getAuthHeaders()
      });
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to fetch event:', error);
      setError('Failed to load event details');
      // Redirect to dashboard if event not found
      if (error.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    if (!event) return;
    
    try {
      setLoadingVenues(true);
      const params = new URLSearchParams({
        type: event.event_type,
        city: event.location,
        date: event.date,
        guestCount: event.guest_count.toString()
      });

      if (event.preferred_venue_types?.length > 0) {
        params.append('preferredTypes', event.preferred_venue_types.join(','));
      }

      const response = await axios.get(`${API}/match/venues?${params}`, {
        headers: getAuthHeaders()
      });
      setVenues(response.data.venues || []);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      // Use mock data for development
      setVenues(getMockVenues());
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchVendors = async () => {
    if (!event) return;
    
    try {
      setLoadingVendors(true);
      const config = EVENT_FLOW_CONFIG[event.event_type];
      
      const params = new URLSearchParams();
      params.append('type', event.event_type);
      params.append('city', event.location || '');
      
      if (event.guest_count) {
        params.append('guests', event.guest_count.toString());
      }
      
      if (event.date) {
        params.append('date', event.date);
      }
      
      // Add vendor tags
      if (config?.vendorTags && config.vendorTags.length > 0) {
        params.append('tags', config.vendorTags.join(','));
      }
      
      // Add services
      if (event.needed_core_services && event.needed_core_services.length > 0) {
        params.append('core', event.needed_core_services.join(','));
      }
      
      if (event.needed_extras && event.needed_extras.length > 0) {
        params.append('extras', event.needed_extras.join(','));
      }
      
      // Add cultural specializations
      if (event.category_specific?.culturalStyle?.length > 0) {
        params.append('cultural', event.category_specific.culturalStyle.join(','));
      }
      
      if (event.category_specific?.themeOrFormat?.length > 0) {
        params.append('theme', event.category_specific.themeOrFormat.join(','));
      }

      // Enhanced: Add capability-based parameters for current active service
      const allEventServices = [
        ...(event?.needed_core_services || []),
        ...(event?.needed_extras || [])
      ];
      
      if (activeSection === 'core-vendors' || activeSection === 'add-ons') {
        const sectionServices = getServicesBySection(allEventServices, activeSection);
        
        // If user has selected specific subcategories, add them to the query
        sectionServices.forEach(service => {
          const mapping = SERVICE_MAPPING[service];
          if (mapping && selectedSubcategories[service]?.length > 0) {
            params.append('service', service);
            params.append('subcategories', selectedSubcategories[service].join(','));
            
            // Add specialty stations for catering
            if (service === 'Catering' && selectedSpecialtyStations.length > 0) {
              params.append('specialty_stations', selectedSpecialtyStations.join(','));
            }
          }
        });
      }

      // Enhanced: Add cultural matching parameters
      if (event.category_specific?.culturalStyle?.length > 0) {
        params.append('client_culture', event.category_specific.culturalStyle[0]); // Use first selected culture
      }
      
      if (event.category_specific?.dietaryRestrictions?.length > 0) {
        params.append('client_dietary', event.category_specific.dietaryRestrictions.join(','));
      }
      
      // Add expand cultural results flag
      params.append('expand_cultural_results', expandCulturalResults ? 'true' : 'false');

      const response = await axios.get(`${API}/match/vendors?${params}`, {
        headers: getAuthHeaders()
      });
      
      // Handle both array and object responses
      const vendorData = response.data.vendors || response.data || [];
      setVendors(Array.isArray(vendorData) ? vendorData : []);
      
      // Store cultural grouping information for UI
      if (response.data.cultural_grouping) {
        setCulturalGrouping(response.data.cultural_grouping);
      }
      
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      // Use mock data for development
      setVendors(getMockVendors());
    } finally {
      setLoadingVendors(false);
    }
  };

  const getMockVenues = () => [
    {
      id: 1,
      name: 'Grand Palace Banquet Hall',
      venueTypes: ['Hotel/Banquet Hall'],
      city: 'New York',
      capacity: 200,
      rating: 4.8,
      price_per_person: 85,
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=300',
      available: true,
      // Enhanced space capabilities
      spaceCapabilities: {
        ceremonySpace: true,
        receptionSpace: true,
        combinedSpace: true,
        separateSpaces: false
      },
      amenities: ['Dance Floor', 'Kitchen Facilities', 'Bridal Suite', 'Sound System', 'Lighting'],
      includedServices: ['Dance Floor', 'Basic Lighting', 'Tables & Chairs']
    },
    {
      id: 2,
      name: 'Riverside Garden Venue',
      venueTypes: ['Outdoor/Garden'],
      city: 'New York',
      capacity: 150,
      rating: 4.6,
      price_per_person: 65,
      image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=300',
      available: true,
      spaceCapabilities: {
        ceremonySpace: true,
        receptionSpace: true,
        combinedSpace: false,
        separateSpaces: true
      },
      amenities: ['Outdoor Ceremony Area', 'Reception Pavilion', 'Garden Views', 'Parking'],
      includedServices: ['Ceremony Arch', 'Garden Lighting']
    },
    {
      id: 3,
      name: 'Downtown Loft Studios',
      venueTypes: ['Loft/Industrial'],
      city: 'New York',
      capacity: 120,
      rating: 4.7,
      price_per_person: 75,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      available: true,
      spaceCapabilities: {
        ceremonySpace: false,
        receptionSpace: true,
        combinedSpace: false,
        separateSpaces: false
      },
      amenities: ['Modern Interior', 'City Views', 'Built-in Bar', 'Sound System'],
      includedServices: ['Basic Sound System', 'Uplighting']
    },
    {
      id: 4,
      name: 'Historic Manor Estate',
      venueTypes: ['Historic/Manor'],
      city: 'New York',
      capacity: 180,
      rating: 4.9,
      price_per_person: 120,
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300',
      available: true,
      spaceCapabilities: {
        ceremonySpace: true,
        receptionSpace: true,
        combinedSpace: true,
        separateSpaces: true
      },
      amenities: ['Historic Architecture', 'Gardens', 'Bridal Suite', 'Multiple Rooms', 'Parking'],
      includedServices: ['Dance Floor', 'Basic Ceremony Setup', 'Chandelier Lighting']
    },
    {
      id: 5,
      name: 'Beachfront Resort Pavilion',
      venueTypes: ['Beach/Waterfront'],
      city: 'New York',
      capacity: 100,
      rating: 4.5,
      price_per_person: 95,
      image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=300',
      available: true,
      spaceCapabilities: {
        ceremonySpace: true,
        receptionSpace: true,
        combinedSpace: false,
        separateSpaces: true
      },
      amenities: ['Waterfront Views', 'Beach Access', 'Outdoor Ceremony Area', 'Indoor Reception'],
      includedServices: ['Ceremony Arch', 'Beach Setup', 'Sound System']
    }
  ];

  const getMockVendors = () => [
    {
      id: 1,
      name: 'Elite Catering Co.',
      services: ['Catering', 'Full Service Catering'],
      culturalStyles: ['American', 'Italian'],
      cities: ['New York'],
      rating: 4.9,
      price_range: '$50-$100 per person',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300',
      capabilities: {
        catering: ['Full-Service Catering', 'Appetizers / Small Bites only'],
        catering_stations: ['Charcuterie/Cheese Station', 'Pasta Station', 'Carving Station']
      }
    },
    {
      id: 2,
      name: 'Gourmet Stations & More',
      services: ['Catering', 'Specialty Food Stations'],
      culturalStyles: ['Asian', 'Fusion'],
      cities: ['New York'],
      rating: 4.8,
      price_range: '$40-$80 per person',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300',
      capabilities: {
        catering: ['Specialty Food Stations'],
        catering_stations: ['Sushi Station', 'Taco Station', 'Seafood/Raw Bar', 'Ceviche Station']
      }
    },
    {
      id: 3,
      name: 'Sweet Dreams Bakery',
      services: ['Cakes', 'Wedding Cake', 'Custom Designs'],
      culturalStyles: ['American', 'French'],
      cities: ['New York'],
      rating: 4.9,
      price_range: '$300-$1,500',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300',
      capabilities: {
        cakes: ['Wedding Cake', 'Custom Designs', 'Cupcakes', 'Macarons']
      }
    },
    {
      id: 4,
      name: 'Birthday Bliss Cakes',
      services: ['Cakes', 'Birthday Cake', 'Cupcakes'],
      culturalStyles: ['American', 'Modern'],
      cities: ['New York'],
      rating: 4.7,
      price_range: '$150-$800',
      image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300',
      capabilities: {
        cakes: ['Birthday Cake', 'Custom Designs', 'Cupcakes']
      }
    },
    {
      id: 5,
      name: 'Sugar Rush Dessert Co.',
      services: ['Dessert Stations', 'Candy Bar', 'Donut Wall'],
      culturalStyles: ['American', 'Modern'],
      cities: ['New York'],
      rating: 4.6,
      price_range: '$500-$2,000',
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300',
      capabilities: {
        'dessert_stations_and_sweets': ['Dessert Table', 'Candy Bar', 'Donut Wall', 'Ice-cream Cart', 'Chocolate Fountain']
      }
    },
    {
      id: 6,
      name: 'Professional DJ Services',
      services: ['DJ', 'Music', 'Entertainment'],
      culturalStyles: ['American', 'Latin', 'Caribbean'],
      cities: ['New York'],
      rating: 4.8,
      price_range: '$800-$2,500',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
      capabilities: {
        'dj_band': ['DJ Services', 'MC Services', 'Sound Equipment', 'Lighting']
      }
    },
    {
      id: 7,
      name: 'Elegant Event Photography',
      services: ['Photography', 'Videography'],
      culturalStyles: ['American', 'Modern', 'Traditional'],
      cities: ['New York'],
      rating: 4.9,
      price_range: '$1,500-$5,000',
      image: 'https://images.unsplash.com/photo-1556103255-4443dbae8e5a?w=300',
      capabilities: {
        'photography_videography': ['Wedding Photography', 'Event Photography', 'Videography', 'Photo Albums']
      }
    },
    {
      id: 8,
      name: 'Premium Floor Rentals',
      services: ['Dance Floor', 'Flooring', 'Rentals'],
      culturalStyles: ['American', 'Modern'],
      cities: ['New York'],
      rating: 4.7,
      price_range: '$300-$1,200',
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=300',
      capabilities: {
        dance_floor: ['White Dance Floor', 'Black Dance Floor', 'LED Dance Floor', 'Outdoor Dance Floor']
      }
    },
    {
      id: 9,
      name: 'Elite Bar Services',
      services: ['Bar Service', 'Bartending', 'Beverage'],
      culturalStyles: ['American', 'Cocktail'],
      cities: ['New York'],
      rating: 4.8,
      price_range: '$15-$35 per person',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300',
      capabilities: {
        bar_service: ['Full Bar Service', 'Wine Service', 'Cocktail Specialties', 'Non-Alcoholic Options']
      }
    },
    {
      id: 10,
      name: 'Elegant Decorations',
      services: ['Decoration', 'Reception Lighting', 'Uplighting'],
      culturalStyles: ['American', 'Modern'],
      cities: ['New York'],
      rating: 4.7,
      price_range: '$2,000-$8,000',
      image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=300',
      capabilities: {
        reception_lighting: ['Uplighting', 'String Lights', 'Chandeliers', 'Ambient Lighting']
      }
    }
  ];

  const renderEventHeader = () => (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        <div className="text-right">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Step-by-Step Mode</span>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">{event?.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-white/80">Type:</span>
          <div className="font-semibold">{EVENT_FLOW_CONFIG[event?.event_type]?.displayName || event?.event_type}</div>
        </div>
        <div>
          <span className="text-white/80">Date:</span>
          <div className="font-semibold">{event?.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</div>
        </div>
        <div>
          <span className="text-white/80">Guests:</span>
          <div className="font-semibold">{event?.guest_count || 'TBD'}</div>
        </div>
        <div>
          <span className="text-white/80">Location:</span>
          <div className="font-semibold">{event?.location || 'TBD'}</div>
        </div>
      </div>

      {/* Preferences Summary */}
      {event && (
        <div className="mt-4 bg-white/10 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Your Preferences:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {event.preferred_venue_types?.length > 0 && (
              <div>
                <span className="text-white/80">Venue Types:</span>
                <div>{event.preferred_venue_types.join(', ')}</div>
              </div>
            )}
            {(event.needed_core_services?.length > 0 || event.needed_extras?.length > 0) && (
              <div>
                <span className="text-white/80">Services Selected:</span>
                <div>
                  {[...(event.needed_core_services || []), ...(event.needed_extras || [])]
                    .slice(0, 3)
                    .join(', ')}
                  {([...(event.needed_core_services || []), ...(event.needed_extras || [])].length > 3) && 
                    ` +${[...(event.needed_core_services || []), ...(event.needed_extras || [])].length - 3} more`
                  }
                </div>
              </div>
            )}
            {event.needed_core_services?.length > 0 && (
              <div>
                <span className="text-white/80">Core Services:</span>
                <div>{event.needed_core_services.join(', ')}</div>
              </div>
            )}
            {event.needed_extras?.length > 0 && (
              <div>
                <span className="text-white/80">Add-Ons:</span>
                <div>{event.needed_extras.join(', ')}</div>
              </div>
            )}
            {event.category_specific?.culturalStyle?.length > 0 && (
              <div>
                <span className="text-white/80">Cultural Style:</span>
                <div>{event.category_specific.culturalStyle.join(', ')}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ready to Start Planning Section - Synchronized with Questionnaire */}
      {event && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-violet-600" />
                Ready to Start Planning?
              </h3>
              <p className="text-gray-700 mb-1">
                {event.wizard_answers || (event.needed_core_services?.length > 0) 
                  ? "Continue planning with your saved questionnaire answers - we'll pre-fill everything for you!"
                  : "Find vendors, compare prices, and build your perfect event with our interactive planner"
                }
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-violet-600 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Smart recommendations
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Live budget tracking
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Questionnaire-synced matching
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                // TODO: Open Interactive Event Planner modal with questionnaire sync
                console.log('Opening Interactive Event Planner for event:', eventId);
                // This should open the InteractiveEventPlanner modal with event data
                alert('Interactive Event Planner would open here with your questionnaire data pre-filled!');
              }}
              className="flex items-center gap-3 rounded-2xl px-8 py-5 text-lg font-bold
                         text-white shadow-lg transition-all duration-300 transform
                         bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
                         hover:-translate-y-1 hover:shadow-2xl hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700
                         focus:outline-none focus:ring-4 focus:ring-violet-300 focus:ring-offset-2
                         active:scale-95 group relative overflow-hidden"
              title={event.wizard_answers ? "Creates a draft quote pre-filled from your questionnaire" : "Open interactive event planner"}
            >
              {/* Animated background shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Play icon */}
              <Play className="h-8 w-8 drop-shadow-sm relative z-10" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <span>{event.wizard_answers || (event.needed_core_services?.length > 0) ? "Continue Planning" : "Start Planning"}</span>
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                <div className="text-sm font-medium opacity-90">
                  {event.wizard_answers || (event.needed_core_services?.length > 0) ? "Use Saved Answers" : "Interactive Mode"}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionTabs = () => (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors
                  ${activeSection === section.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                <div className="text-left">
                  <div>{section.name}</div>
                  <div className="text-xs text-gray-400">{section.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  const renderVenuesSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Venue Matching</h2>
        <div className="flex space-x-3">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Search className="h-4 w-4 mr-2" />
            Search More
          </button>
        </div>
      </div>

      {/* Restaurant Booking Flow - Show if Restaurant is selected */}
      {event?.preferred_venue_types?.includes('Restaurant') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            🍽️ Restaurant Booking Flow
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            This is for intimate celebrations and private rooms. Use the filters below to find the perfect restaurant.
          </p>
          
          {/* Restaurant Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
              <input 
                type="number" 
                placeholder="8" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option>Lunch (12-3 PM)</option>
                <option>Dinner (6-9 PM)</option>
                <option>Late Dinner (8-11 PM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Private Room?</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option>Preferred</option>
                <option>Required</option>
                <option>Not needed</option>
              </select>
            </div>
          </div>
          
          {/* Cuisine & Price Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option>Any Cuisine</option>
                <option>American</option>
                <option>Italian</option>
                <option>Asian</option>
                <option>Mexican</option>
                <option>Seafood</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option>Any Price</option>
                <option>$25-$45 per person</option>
                <option>$45-$75 per person</option>
                <option>$75+ per person</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option>Any Rating</option>
                <option>4.5+ stars</option>
                <option>4.0+ stars</option>
                <option>3.5+ stars</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Short-Term Rental Guide - Show if Airbnb/VRBO is selected */}
      {event?.preferred_venue_types?.includes('Short-Term Rental (Airbnb/VRBO)') && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center">
            🏠 Short-Term Rental Guidelines
          </h3>
          <p className="text-sm text-green-700 mb-4">
            These properties explicitly allow events and gatherings. Please review house rules carefully.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <h4 className="font-medium text-yellow-800 mb-2">Important Reminders:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Respect maximum guest capacity and noise rules</li>
              <li>• Confirm event approval with host before booking</li>
              <li>• Review parking limitations and HOA requirements</li>
              <li>• Plan for cleaning fees and security deposits</li>
            </ul>
          </div>
        </div>
      )}

      {/* Wedding Venue Preferences */}
      {event?.event_type === 'wedding' && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            💒 Wedding Venue Preferences
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Ceremony Location:</span>
              <div className="font-medium">
                {event.ceremonyLocation?.sameAsReception ? 'Same as Reception' : 
                 event.ceremonyLocation?.city || 'Not specified'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Reception Location:</span>
              <div className="font-medium">{event.location || 'Not specified'}</div>
            </div>
            <div>
              <span className="text-gray-600">Space Preference:</span>
              <div className="font-medium">
                {event.spacePreferences?.preferOneVenue ? 'One Venue Preferred' : 'Separate OK'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Needs:</span>
              <div className="font-medium">
                {event.spacePreferences?.needCeremonySpace && event.spacePreferences?.needReceptionSpace ? 
                  'Both Spaces' : 
                  event.spacePreferences?.needCeremonySpace ? 'Ceremony Only' : 
                  event.spacePreferences?.needReceptionSpace ? 'Reception Only' : 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      )}

      {loadingVenues ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Finding perfect venues for you...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <img 
                src={venue.image} 
                alt={venue.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{venue.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{venue.venueTypes.join(', ')}</p>
                <p className="text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {venue.city} • Capacity: {venue.capacity}
                </p>

                {/* Enhanced Display for Different Venue Types */}
                {venue.venueTypes.includes('Restaurant') && venue.restaurant_details && (
                  <div className="mb-3">
                    <div className="text-xs text-blue-600 mb-1">🍽️ Restaurant Features:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Cuisine: {venue.restaurant_details.cuisine_types?.join(', ')}</div>
                      {venue.restaurant_details.private_rooms?.length > 0 && (
                        <div>Private Rooms: {venue.restaurant_details.private_rooms.length} available</div>
                      )}
                      <div>Price: ${venue.restaurant_details.price_per_person_range?.min}-${venue.restaurant_details.price_per_person_range?.max}/person</div>
                    </div>
                    {/* Live Availability Button */}
                    <button className="mt-2 w-full bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200 transition-colors">
                      Check Live Availability
                    </button>
                  </div>
                )}

                {venue.venueTypes.includes('Short-Term Rental (Airbnb/VRBO)') && venue.short_term_rental_details && (
                  <div className="mb-3">
                    <div className="text-xs text-green-600 mb-1">🏠 Rental Features:</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Max Guests: {venue.short_term_rental_details.max_event_guests?.standing} standing, {venue.short_term_rental_details.max_event_guests?.seated} seated</div>
                      <div>Parking: {venue.short_term_rental_details.parking_capacity} spaces</div>
                      <div>Events: {venue.short_term_rental_details.allowed_event_types?.join(', ')}</div>
                      {venue.short_term_rental_details.curfew_noise_rules && (
                        <div className="text-orange-600">⚠️ {venue.short_term_rental_details.curfew_noise_rules}</div>
                      )}
                    </div>
                    {/* House Rules Acknowledgment */}
                    <button className="mt-2 w-full bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200 transition-colors">
                      View House Rules
                    </button>
                  </div>
                )}

                {/* Enhanced Space Capabilities for Regular Venues */}
                {venue.spaceCapabilities && !venue.venueTypes.includes('Restaurant') && !venue.venueTypes.includes('Short-Term Rental (Airbnb/VRBO)') && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Space Options:</p>
                    <div className="flex flex-wrap gap-1">
                      {venue.spaceCapabilities.ceremonySpace && (
                        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                          Ceremony
                        </span>
                      )}
                      {venue.spaceCapabilities.receptionSpace && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                          Reception
                        </span>
                      )}
                      {venue.spaceCapabilities.combinedSpace && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          Combined
                        </span>
                      )}
                      {venue.spaceCapabilities.separateSpaces && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          Separate Areas
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Included Services */}
                {venue.includedServices && venue.includedServices.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Included:</p>
                    <div className="text-xs text-green-600">
                      {venue.includedServices.slice(0, 3).join(', ')}
                      {venue.includedServices.length > 3 && ` +${venue.includedServices.length - 3} more`}
                    </div>
                  </div>
                )}

                {/* Venue Match Score for Weddings */}
                {event?.event_type === 'wedding' && !venue.venueTypes.includes('Restaurant') && (
                  <div className="mb-3">
                    {/* Calculate match score based on space preferences */}
                    {(() => {
                      let matchScore = 0;
                      let matchReasons = [];
                      
                      if (event.spacePreferences?.preferOneVenue && venue.spaceCapabilities?.combinedSpace) {
                        matchScore += 2;
                        matchReasons.push('One venue preference');
                      }
                      
                      if (event.spacePreferences?.needCeremonySpace && venue.spaceCapabilities?.ceremonySpace) {
                        matchScore += 1;
                        matchReasons.push('Ceremony space');
                      }
                      
                      if (event.spacePreferences?.needReceptionSpace && venue.spaceCapabilities?.receptionSpace) {
                        matchScore += 1;
                        matchReasons.push('Reception space');
                      }
                      
                      // Check for included services that match selected services
                      const selectedServices = [...(event.needed_core_services || []), ...(event.needed_extras || [])];
                      const matchingServices = venue.includedServices?.filter(service => 
                        selectedServices.some(selected => selected.toLowerCase().includes(service.toLowerCase()))
                      ) || [];
                      
                      if (matchingServices.length > 0) {
                        matchScore += matchingServices.length;
                        matchReasons.push(`${matchingServices.length} services included`);
                      }
                      
                      if (matchScore > 0) {
                        return (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-green-800">Great Match!</span>
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                Score: {matchScore}
                              </span>
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              {matchReasons.slice(0, 2).join(', ')}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-semibold text-green-600">
                    ${venue.price_per_person}/person
                  </span>
                  <button 
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    onClick={() => {
                      if (venue.venueTypes.includes('Restaurant')) {
                        handleRestaurantBooking(venue);
                      } else {
                        handleSelectVenue(venue);
                      }
                    }}
                  >
                    {venue.venueTypes.includes('Restaurant') ? 'Book Table' : 'Select Venue'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVendorsSection = (sectionType) => {
    // Get services based on section type (core-vendors or add-ons)
    const allEventServices = [
      ...(event?.needed_core_services || []),
      ...(event?.needed_extras || [])
    ];
    
    // Apply service filtering based on venue types (Restaurant service gating)
    const filteredEventServices = getFilteredServicesForVenues(allEventServices);
    const sectionServices = getServicesBySection(filteredEventServices, sectionType);
    
    // Show service gating notification for restaurants
    const isRestaurantSelected = event?.preferred_venue_types?.includes('Restaurant');
    const hiddenServices = allEventServices.filter(service => !filteredEventServices.includes(service));
    
    if (sectionServices.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <Users className="h-full w-full" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {sectionType === 'core-vendors' ? 'No Core Services Selected' : 'No Add-Ons Selected'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {sectionType === 'core-vendors' 
              ? 'You haven\'t selected any core services in your event wizard.'
              : 'You haven\'t selected any extras in your event wizard.'
            }
          </p>
          
          {/* Show service gating notification */}
          {isRestaurantSelected && hiddenServices.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Restaurant selected:</strong> Some services are hidden because most restaurants don't allow outside vendors. 
                Services like catering, DJ, and decor are typically provided by the restaurant.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Hidden: {hiddenServices.join(', ')}
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit Event Services
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Wedding Context Filters (if wedding) */}
        {event?.event_type === 'wedding' && sectionType === 'core-vendors' && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              💒 Wedding Planning Context
            </h3>
            <p className="text-sm text-gray-600 mb-3">Filter vendors by ceremony and reception needs:</p>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  contextFilter === 'ceremony' 
                    ? 'bg-pink-200 text-pink-900 border-pink-400' 
                    : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
                }`}
                onClick={() => setContextFilter(contextFilter === 'ceremony' ? 'both' : 'ceremony')}
              >
                Ceremony Only
              </button>
              <button 
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  contextFilter === 'reception' 
                    ? 'bg-purple-200 text-purple-900 border-purple-400' 
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
                onClick={() => setContextFilter(contextFilter === 'reception' ? 'both' : 'reception')}
              >
                Reception Only  
              </button>
              <button 
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  contextFilter === 'both' 
                    ? 'bg-gray-200 text-gray-900 border-gray-400' 
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={() => setContextFilter('both')}
              >
                Both
              </button>
            </div>
          </div>
        )}

        {/* Service-Specific Sections */}
        {sectionServices.map(service => {
          const mapping = SERVICE_MAPPING[service];
          if (!mapping) return null;
          
          // Skip services that don't match wedding context filter
          if (event?.event_type === 'wedding' && contextFilter !== 'both') {
            if (contextFilter === 'ceremony' && mapping.context === 'reception') return null;
            if (contextFilter === 'reception' && mapping.context === 'ceremony') return null;
          }
          
          return (
            <div key={service} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mapping.stepByStepCategory}</h3>
                  <p className="text-sm text-gray-600">
                    Budget: {mapping.budgetBucket} | Context: {mapping.context}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {service}
                </span>
              </div>

              {/* Service Subcategory Filters */}
              {mapping.subcategories && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {service === 'Catering' ? 'Catering Type:' : 
                     service === 'Cakes' ? 'Cake Style:' : 
                     service === 'Dessert Stations & Sweets' ? 'Sweet Options:' : 'Options:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mapping.subcategories.map(subcategory => {
                      const isSelected = selectedSubcategories[service]?.includes(subcategory);
                      return (
                        <button
                          key={subcategory}
                          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                            isSelected 
                              ? 'bg-blue-200 text-blue-900 border-blue-400' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleSubcategory(service, subcategory)}
                        >
                          {subcategory}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Specialty Stations for Catering */}
                  {service === 'Catering' && selectedSubcategories[service]?.includes('Specialty Food Stations') && mapping.specialtyStations && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-2">Specialty Stations:</p>
                      <div className="flex flex-wrap gap-2">
                        {mapping.specialtyStations.map(station => {
                          const isSelected = selectedSpecialtyStations.includes(station);
                          return (
                            <button
                              key={station}
                              className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                                isSelected 
                                  ? 'bg-green-200 text-green-900 border-green-400' 
                                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => toggleSpecialtyStation(station)}
                            >
                              {station}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vendors for this service */}
              {loadingVendors ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Finding {service.toLowerCase()} vendors...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cultural Results Grouping Header */}
                  {event.category_specific?.culturalStyle?.length > 0 && culturalGrouping && !expandCulturalResults && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">
                            Best matches for {culturalGrouping.client_cultural_preference} events
                          </h4>
                          <p className="text-sm text-blue-700">
                            {culturalGrouping.exact_cultural_matches} specialist vendors • {culturalGrouping.all_cultures_matches} all-cultures vendors
                          </p>
                        </div>
                        <button 
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          onClick={() => {
                            setExpandCulturalResults(true);
                            fetchVendors(); // Refresh with expanded results
                          }}
                        >
                          Find more options
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded Results Header */}
                  {expandCulturalResults && culturalGrouping && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">All available options</h4>
                          <p className="text-sm text-gray-600">
                            Showing all {getFilteredVendors(vendors, service, mapping).length} vendors for {service.toLowerCase()}
                          </p>
                        </div>
                        <button 
                          className="text-blue-600 hover:text-blue-700 text-sm underline"
                          onClick={() => {
                            setExpandCulturalResults(false);
                            fetchVendors(); // Return to cultural matching
                          }}
                        >
                          Back to best matches
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Venue-Included Options */}
                  {(service === 'Dance Floor' || service === 'Cakes') && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">Included by Venue</h4>
                          <p className="text-sm text-green-700">
                            Your venue may include {service.toLowerCase()}. Check with venue first.
                          </p>
                        </div>
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                          Mark as Included
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Vendor Grid with Cultural Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredVendors(vendors, service, mapping)
                      .slice(0, 6) // Show top 6 per service
                      .map((vendor) => (
                      <div key={`${service}-${vendor.id}`} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <img 
                          src={vendor.image} 
                          alt={vendor.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{vendor.name}</h4>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600 ml-1">{vendor.rating}</span>
                            </div>
                          </div>

                          {/* Cultural Match Indicator */}
                          {vendor.cultural_match_details && (
                            <div className="mb-2">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                vendor.cultural_match_type === 'exact_match' ? 'bg-green-100 text-green-800' :
                                vendor.cultural_match_type === 'all_cultures' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {vendor.cultural_match_type === 'all_cultures' && '🌐 '}
                                {vendor.cultural_match_details.match_type}
                              </div>
                            </div>
                          )}

                          {/* Cultural & Dietary Badges */}
                          <div className="mb-2 flex flex-wrap gap-1">
                            {/* Cultural Expertise Badges */}
                            {vendor.cultural_expertise?.cultures_served?.slice(0, 2).map(culture => (
                              <span key={culture} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                                {culture === 'Hispanic/Latino' ? 'Hispanic' : culture}
                              </span>
                            ))}
                            
                            {/* All Cultures Badge */}
                            {vendor.cultural_expertise?.all_cultures_welcomed && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center">
                                🌐 All Cultures
                              </span>
                            )}

                            {/* Dietary Badges */}
                            {vendor.dietary_matches?.map(dietary => (
                              <span key={dietary} className={`px-2 py-1 rounded-full text-xs ${
                                dietary === 'Halal' ? 'bg-green-100 text-green-700' :
                                dietary === 'Kosher' ? 'bg-blue-100 text-blue-700' :
                                dietary === 'Vegetarian/Vegan' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {dietary}
                              </span>
                            ))}
                          </div>
                          
                          {/* Service Capabilities */}
                          {vendor.capabilities && vendor.capabilities[service.toLowerCase().replace(' ', '_')] && (
                            <div className="mb-2">
                              <div className="flex flex-wrap gap-1">
                                {vendor.capabilities[service.toLowerCase().replace(' ', '_')].slice(0, 2).map(cap => (
                                  <span key={cap} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {cap}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cuisine/Service Types */}
                          <div className="mb-2">
                            <p className="text-xs text-gray-600">
                              {service === 'Catering' && vendor.service_specializations?.catering?.cuisine_types?.length > 0 ? 
                                vendor.service_specializations.catering.cuisine_types.slice(0, 3).join(', ') :
                                vendor.services.join(', ')
                              }
                            </p>
                          </div>

                          {/* Cultural Match Score (if available) */}
                          {vendor.cultural_boost > 0 && (
                            <div className="mb-2 text-xs text-green-600">
                              ✨ Great cultural match (Score: {vendor.match_score})
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-green-600">
                              {vendor.price_range}
                            </span>
                            <button 
                              className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                              onClick={() => handleGetQuote(vendor, service)}
                            >
                              Get Quote
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* "View All" link */}
                  <div className="text-center">
                    <button 
                      className="text-purple-600 hover:text-purple-700 text-sm underline"
                      onClick={() => handleViewAllVendors(service, mapping)}
                    >
                      View all {mapping.stepByStepCategory.toLowerCase()} vendors ({getFilteredVendors(vendors, service, mapping).length} available)
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* General vendor grid if no service mapping */}
        {sectionServices.length === 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {sectionType === 'core-vendors' ? 'All Core Vendors' : 'All Add-On Services'}
            </h3>
            {loadingVendors ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Finding specialized vendors...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <img 
                      src={vendor.image} 
                      alt={vendor.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{vendor.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{vendor.services.join(', ')}</p>
                      {vendor.culturalStyles && (
                        <p className="text-xs text-blue-600 mb-2">
                          Specializes in: {vendor.culturalStyles.join(', ')}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-sm font-medium text-green-600">
                          {vendor.price_range}
                        </span>
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                          Get Quote
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBudgetSection = () => {
    if (!event) return null;
    
    // Get all selected services
    const allEventServices = [
      ...(event?.needed_core_services || []),
      ...(event?.needed_extras || [])
    ];
    
    // Calculate budget buckets
    const budgetBuckets = getBudgetBuckets(allEventServices);
    const serviceBuckets = {};
    
    // Group services by budget bucket
    allEventServices.forEach(service => {
      const mapping = SERVICE_MAPPING[service];
      if (mapping && mapping.budgetBucket) {
        if (!serviceBuckets[mapping.budgetBucket]) {
          serviceBuckets[mapping.budgetBucket] = [];
        }
        serviceBuckets[mapping.budgetBucket].push(service);
      }
    });
    
    // Split ceremony vs reception for weddings
    const ceremonyServices = event?.event_type === 'wedding' ? 
      getServicesByContext(allEventServices, 'ceremony') : [];
    const receptionServices = event?.event_type === 'wedding' ? 
      getServicesByContext(allEventServices, 'reception') : [];
    const bothServices = event?.event_type === 'wedding' ? 
      getServicesByContext(allEventServices, 'both') : [];
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Budget Planning</h2>
          <div className="flex space-x-3">
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <DollarSign className="h-4 w-4 mr-2" />
              Set Budget
            </button>
            <button className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Export Budget
            </button>
          </div>
        </div>

        {/* Wedding Split Budget View */}
        {event?.event_type === 'wedding' && (ceremonyServices.length > 0 || receptionServices.length > 0) && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-lg border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              💒 Wedding Budget Split
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ceremony Budget */}
              {ceremonyServices.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-pink-200">
                  <h4 className="font-medium text-pink-900 mb-3">Ceremony Budget</h4>
                  <div className="space-y-2">
                    {ceremonyServices.map(service => {
                      const mapping = SERVICE_MAPPING[service];
                      return (
                        <div key={`ceremony-${service}`} className="flex justify-between text-sm">
                          <span className="text-gray-700">{service}</span>
                          <span className="text-gray-500">{mapping?.budgetBucket}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-pink-200">
                    <div className="flex justify-between font-medium text-pink-900">
                      <span>Ceremony Subtotal</span>
                      <span>Est. $0 - $0</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reception Budget */}
              {receptionServices.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-3">Reception Budget</h4>
                  <div className="space-y-2">
                    {receptionServices.map(service => {
                      const mapping = SERVICE_MAPPING[service];
                      return (
                        <div key={`reception-${service}`} className="flex justify-between text-sm">
                          <span className="text-gray-700">{service}</span>
                          <span className="text-gray-500">{mapping?.budgetBucket}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="flex justify-between font-medium text-purple-900">
                      <span>Reception Subtotal</span>
                      <span>Est. $0 - $0</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shared Services */}
            {bothServices.length > 0 && (
              <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Shared Services (Both)</h4>
                <div className="grid grid-cols-2 gap-4">
                  {bothServices.map(service => {
                    const mapping = SERVICE_MAPPING[service];
                    return (
                      <div key={`both-${service}`} className="flex justify-between text-sm">
                        <span className="text-gray-700">{service}</span>
                        <span className="text-gray-500">{mapping?.budgetBucket}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total Budget */}
            <div className="mt-4 bg-gray-900 text-white p-4 rounded-lg">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Wedding Budget</span>
                <span>Est. $0 - $0</span>
              </div>
            </div>
          </div>
        )}

        {/* Service-Specific Budget Buckets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(serviceBuckets).map(([bucket, services]) => (
            <div key={bucket} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{bucket}</h3>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              
              <div className="space-y-3">
                {services.map(service => (
                  <div key={service} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{service}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Bucket Total</span>
                  <span className="font-semibold text-green-600">$0 - $0</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Allocated: $0</span>
                    <span>Available: $0</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Budget Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Budget Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">$0</div>
              <div className="text-sm text-gray-500">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$0</div>
              <div className="text-sm text-gray-500">Allocated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">$0</div>
              <div className="text-sm text-gray-500">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{allEventServices.length}</div>
              <div className="text-sm text-gray-500">Services</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4">Budget Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              💰 Set Budget Limits
            </button>
            <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              📊 Get Budget Estimates
            </button>
            <button className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              🔔 Set Budget Alerts
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaceholderSection = (title, description) => (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-gray-400">
        <Calendar className="h-full w-full" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <div className="mt-6">
        <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Coming Soon
        </button>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'venues':
        return renderVenuesSection();
      case 'core-vendors':
        return renderVendorsSection('core-vendors');
      case 'add-ons':
        return renderVendorsSection('add-ons');
      case 'timeline':
        return renderPlaceholderSection('Timeline Management', 'Schedule and coordinate all your event activities');
      case 'budget':
        return renderBudgetSection(); // Enhanced budget section
      case 'files':
        return renderPlaceholderSection('File Management', 'Store contracts, photos, and important documents');
      case 'notes':
        return renderPlaceholderSection('Notes & Ideas', 'Keep track of ideas and important reminders');
      case 'contracts':
        return renderPlaceholderSection('Contracts & Payments', 'Manage agreements and payment schedules');
      default:
        return renderVenuesSection();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'The event you are looking for does not exist.'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {renderEventHeader()}
      
      {/* Simple message about using the planning tools */}
      <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200 text-center">
        <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Set to Plan!</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your event details are ready. Use the "Ready to Start Planning?" section above to begin your interactive planning experience, 
          or return to your Event Profile to access budget tracking, timelines, vendor management, and more planning tools.
        </p>
        <div className="mt-4 space-x-4">
          <button
            onClick={() => navigate(`/events/${eventId}/planning`)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Event Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepByStepMode;