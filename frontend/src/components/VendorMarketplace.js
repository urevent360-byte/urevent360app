import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { 
  Users, 
  DollarSign, 
  Star, 
  Filter, 
  Search, 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  ShoppingBag,
  Camera,
  Music,
  Utensils,
  Sparkles,
  Car,
  Shield,
  Lightbulb,
  ChevronRight,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VendorMarketplace = () => {
  const { user } = useContext(AuthContext);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);
  const [filters, setFilters] = useState({
    service_type: '',
    location: '',
    min_budget: '',
    max_budget: '',
    search: '',
    rating: '',
    availability: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [userEvents, setUserEvents] = useState([]);

  const serviceCategories = [
    {
      id: 'all',
      name: 'All Services',
      icon: ShoppingBag,
      color: 'bg-purple-500',
      description: 'Browse all available services'
    },
    {
      id: 'Catering',
      name: 'Catering',
      icon: Utensils,
      color: 'bg-orange-500',
      description: 'Food & beverage services'
    },
    {
      id: 'Decoration',
      name: 'Decoration',
      icon: Sparkles,
      color: 'bg-pink-500',
      description: 'Event styling & decor'
    },
    {
      id: 'Photography',
      name: 'Photography',
      icon: Camera,
      color: 'bg-blue-500',
      description: 'Professional photo services'
    },
    {
      id: 'Videography',
      name: 'Videography',
      icon: Camera,
      color: 'bg-indigo-500',
      description: 'Video recording & editing'
    },
    {
      id: 'Music/DJ',
      name: 'Music & DJ',
      icon: Music,
      color: 'bg-green-500',
      description: 'Music & entertainment'
    },
    {
      id: 'Transportation',
      name: 'Transportation',
      icon: Car,
      color: 'bg-yellow-500',
      description: 'Vehicle & transport services'
    },
    {
      id: 'Security',
      name: 'Security',
      icon: Shield,
      color: 'bg-red-500',
      description: 'Event security services'
    },
    {
      id: 'Lighting',
      name: 'Lighting',
      icon: Lightbulb,
      color: 'bg-amber-500',
      description: 'Professional lighting setup'
    }
  ];

  useEffect(() => {
    fetchVendors();
    fetchUserEvents();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vendors, filters, selectedCategory, currentEvent]);

  const fetchUserEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setUserEvents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch user events:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API}/vendors`);
      setVendors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      // Mock data fallback
      setVendors([
        {
          id: '1',
          name: 'Elite Catering Services',
          service_type: 'Catering',
          description: 'Premium catering with farm-to-table ingredients and personalized menus',
          location: 'New York, NY',
          price_range: { min: 50, max: 200 },
          rating: 4.8,
          reviews_count: 127,
          portfolio: ['https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop'],
          contact_info: {
            phone: '(555) 123-4567',
            email: 'info@elitecatering.com',
            website: 'www.elitecatering.com'
          },
          availability: ['weekdays', 'weekends'],
          specialties: ['Wedding Catering', 'Corporate Events', 'Fine Dining'],
          experience_years: 8,
          verified: true
        },
        {
          id: '2',
          name: 'Elegant Decorations',
          service_type: 'Decoration',
          description: 'Beautiful event decorations that transform any space into magic',
          location: 'Los Angeles, CA',
          price_range: { min: 800, max: 5000 },
          rating: 4.9,
          reviews_count: 89,
          portfolio: ['https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop'],
          contact_info: {
            phone: '(555) 987-6543',
            email: 'hello@elegantdecorations.com',
            website: 'www.elegantdecorations.com'
          },
          availability: ['weekends', 'holidays'],
          specialties: ['Wedding Decor', 'Theme Parties', 'Corporate Styling'],
          experience_years: 6,
          verified: true
        },
        {
          id: '3',
          name: 'Capture Moments Photography',
          service_type: 'Photography',
          description: 'Professional wedding and event photography with artistic vision',
          location: 'Chicago, IL',
          price_range: { min: 1200, max: 3500 },
          rating: 4.7,
          reviews_count: 156,
          portfolio: ['https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop'],
          contact_info: {
            phone: '(555) 456-7890',
            email: 'book@capturemoments.com',
            website: 'www.capturemomentsphoto.com'
          },
          availability: ['weekends', 'weekdays'],
          specialties: ['Wedding Photography', 'Portrait Sessions', 'Event Coverage'],
          experience_years: 10,
          verified: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('vendor_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (vendorId) => {
    const newFavorites = favorites.includes(vendorId)
      ? favorites.filter(id => id !== vendorId)
      : [...favorites, vendorId];
    
    setFavorites(newFavorites);
    localStorage.setItem('vendor_favorites', JSON.stringify(newFavorites));
  };

  const applyFilters = () => {
    let filtered = [...vendors];

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.service_type.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Budget-aware filtering - this is the key enhancement
    if (currentEvent && currentEvent.budget) {
      const eventBudget = parseFloat(currentEvent.budget);
      const budgetPerService = eventBudget * 0.15; // Assume 15% of total budget per service
      
      filtered = filtered.filter(vendor => {
        const vendorMinPrice = vendor.price_range?.min || 0;
        const vendorMaxPrice = vendor.price_range?.max || 999999;
        
        // Only show vendors whose minimum price is within budget
        // and whose price range overlaps with the allocated budget
        return vendorMinPrice <= budgetPerService && 
               (vendorMaxPrice >= budgetPerService * 0.5); // Allow some flexibility
      });

      // Show budget alert if no vendors match
      if (filtered.length === 0 && vendors.length > 0) {
        setShowBudgetAlert(true);
      } else {
        setShowBudgetAlert(false);
      }
    }

    // Manual budget filters
    if (filters.min_budget || filters.max_budget) {
      const minBudget = parseFloat(filters.min_budget) || 0;
      const maxBudget = parseFloat(filters.max_budget) || 999999;
      
      filtered = filtered.filter(vendor => {
        const vendorMin = vendor.price_range?.min || 0;
        const vendorMax = vendor.price_range?.max || 999999;
        return vendorMin <= maxBudget && vendorMax >= minBudget;
      });
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(vendor =>
        vendor.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm) ||
        vendor.description.toLowerCase().includes(searchTerm) ||
        vendor.service_type.toLowerCase().includes(searchTerm)
      );
    }

    // Rating filter
    if (filters.rating) {
      filtered = filtered.filter(vendor => 
        vendor.rating >= parseFloat(filters.rating)
      );
    }

    setFilteredVendors(filtered);
  };

  const selectEvent = (event) => {
    setCurrentEvent(event);
    setShowEventSelector(false);
  };

  const CategoryCard = ({ category, isSelected, onClick }) => {
    const Icon = category.icon;
    return (
      <div
        onClick={onClick}
        className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
          isSelected
            ? 'border-purple-500 bg-purple-50 shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${category.color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>
        </div>
      </div>
    );
  };

  const VendorCard = ({ vendor, isFavorite, onToggleFavorite }) => {
    const budgetMatch = currentEvent && currentEvent.budget ? 
      (parseFloat(currentEvent.budget) * 0.15) >= vendor.price_range?.min : true;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Vendor Image */}
        <div className="relative h-48 bg-gray-200">
          {vendor.portfolio && vendor.portfolio[0] ? (
            <img
              src={vendor.portfolio[0]}
              alt={vendor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Favorite button */}
          <button
            onClick={() => onToggleFavorite(vendor.id)}
            className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Verified badge */}
          {vendor.verified && (
            <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Check className="w-3 h-3 mr-1" />
              Verified
            </div>
          )}

          {/* Budget match indicator */}
          {currentEvent && (
            <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
              budgetMatch ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
            }`}>
              {budgetMatch ? 'Budget Match' : 'Above Budget'}
            </div>
          )}
        </div>

        {/* Vendor Details */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{vendor.name}</h3>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              {vendor.rating} ({vendor.reviews_count || 0})
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{vendor.description}</p>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {vendor.location}
          </div>

          {/* Price Range */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <DollarSign className="w-4 h-4 mr-1" />
            ${vendor.price_range?.min?.toLocaleString()} - ${vendor.price_range?.max?.toLocaleString()}
          </div>

          {/* Specialties */}
          {vendor.specialties && vendor.specialties.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {vendor.specialties.slice(0, 2).map((specialty, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
                {vendor.specialties.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{vendor.specialties.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              View Details
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Phone className="w-4 h-4" />
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Elegant Header Section */}
      <div 
        className="relative -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-8 rounded-b-2xl overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://images.pexels.com/photos/33417234/pexels-photo-33417234.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '200px'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-center">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Premium Vendor Marketplace</h1>
            <p className="text-white/90 drop-shadow">
              Connect with elite service providers for your perfect event
              {currentEvent && ` • "${currentEvent.name}"`}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Find Your Perfect Vendors</h2>
          <p className="text-gray-600">
            Discover premium vendors within your budget range
          </p>
        -------div>
        
        <div className="flex items-center gap-3">
          {/* Event Selector */}
          <div className="relative">
            <button
              onClick={() => setShowEventSelector(!showEventSelector)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <Calendar className="w-4 h-4" />
              {currentEvent ? currentEvent.name : 'Select Event'}
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {showEventSelector && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-700 px-2 py-1">Your Events</div>
                  {userEvents.length > 0 ? (
                    userEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => selectEvent(event)}
                        className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded text-sm"
                      >
                        <div className="font-medium">{event.name}</div>
                        <div className="text-gray-600">
                          Budget: ${parseFloat(event.budget || 0).toLocaleString()}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-gray-500">No events found</div>
                  )}
                  <button
                    onClick={() => {
                      setCurrentEvent(null);
                      setShowEventSelector(false);
                    }}
                    className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded text-sm text-red-600"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Budget Alert */}
      {showBudgetAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Budget Consideration</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Based on your event budget of ${parseFloat(currentEvent?.budget || 0).toLocaleString()}, 
                some vendors may be outside your price range. Consider adjusting your budget or 
                looking at alternative service providers.
              </p>
            </div>
            <button
              onClick={() => setShowBudgetAlert(false)}
              className="text-yellow-500 hover:text-yellow-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Service Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceCategories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(
                selectedCategory === category.id ? '' : category.id
              )}
            />
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="City, State"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
              <input
                type="number"
                placeholder="0"
                value={filters.min_budget}
                onChange={(e) => setFilters({ ...filters, min_budget: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
              <input
                type="number"
                placeholder="10000"
                value={filters.max_budget}
                onChange={(e) => setFilters({ ...filters, max_budget: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
          {selectedCategory && selectedCategory !== 'all' && ` in ${selectedCategory}`}
          {currentEvent && ` for "${currentEvent.name}"`}
        </p>
        
        {currentEvent && currentEvent.budget && (
          <div className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
            Event Budget: ${parseFloat(currentEvent.budget).toLocaleString()}
          </div>
        )}
      </div>

      {/* Vendor Grid */}
      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              isFavorite={favorites.includes(vendor.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search criteria
          </p>
          <button
            onClick={() => {
              setFilters({
                service_type: '',
                location: '',
                min_budget: '',
                max_budget: '',
                search: '',
                rating: '',
                availability: ''
              });
              setSelectedCategory('');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default VendorMarketplace;