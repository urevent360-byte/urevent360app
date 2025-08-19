// EVENT_FLOW_CONFIG - Controls conditional steps and vendor matching in Two-Flow Architecture
export const EVENT_FLOW_CONFIG = {
  wedding: { 
    showCulturalStyles: true,  
    replaceWith: null,            
    vendorTags: ['wedding'],
    displayName: 'Wedding'
  },
  quinceanera: { 
    showCulturalStyles: true,  
    replaceWith: null,            
    vendorTags: ['quince', 'celebration'],
    displayName: 'Quinceañera'
  },
  sweet_16: { 
    showCulturalStyles: true,  
    replaceWith: null,            
    vendorTags: ['sweet16', 'birthday', 'teen_party'],
    displayName: 'Sweet 16'
  },
  mitzvah: { 
    showCulturalStyles: false,  // Jewish ceremony - no need for cultural style selection
    replaceWith: null,            
    vendorTags: ['jewish', 'mitzvah', 'bar_mitzvah', 'bat_mitzvah'],
    displayName: 'Bar/Bat Mitzvah'
  },
  corporate: { 
    showCulturalStyles: false, 
    replaceWith: 'Event Format',  
    vendorTags: ['corporate', 'business'],
    displayName: 'Corporate Event'
  },
  birthday: { 
    showCulturalStyles: false, 
    replaceWith: 'Theme',         
    vendorTags: ['birthday', 'celebration'],
    displayName: 'Birthday Party'
  },
  anniversary: { 
    showCulturalStyles: false, 
    replaceWith: 'Theme',         
    vendorTags: ['social', 'anniversary'],
    displayName: 'Anniversary'
  },
  graduation: { 
    showCulturalStyles: false, 
    replaceWith: 'Theme',         
    vendorTags: ['graduation', 'academic'],
    displayName: 'Graduation'
  },
  retirement: { 
    showCulturalStyles: false, 
    replaceWith: 'Theme',         
    vendorTags: ['social', 'retirement'],
    displayName: 'Retirement Party'
  },
  baby_shower: { 
    showCulturalStyles: false, 
    replaceWith: 'Theme',         
    vendorTags: ['baby_shower', 'celebration'],
    displayName: 'Baby Shower'
  },
  other: { 
    showCulturalStyles: false, 
    replaceWith: 'Describe',      
    vendorTags: ['general', 'custom'],
    displayName: 'Other Event'
  }
} ;

// Core Services - drives main vendor lists in Step-by-Step Mode
export const CORE_SERVICES = [
  'Catering',
  'Decoration', 
  'Photography',
  'Videography',
  'Music/DJ',
  'Lighting',
  'Security',
  'Cleaning',
  'Transportation'
];

// Add-Ons (Extras) - replaces "Entertainment" 
export const ADD_ON_EXTRAS = [
  'Photo Booths',
  'Dance in the Clouds',
  'Cold Spark Machines', 
  'LED Dance Floor',
  'LED Screens',
  'Live Shows (Salsa, Samba, Hora Loca with dancers)',
  'Specialty Entertainers'
];

// Preferred Venue Types for wizard
export const PREFERRED_VENUE_TYPES = [
  'Hotel/Banquet Hall',
  'Restaurant',
  'Outdoor/Garden',
  'Community Center',
  'Beach/Waterfront',
  'Private Residence',
  'Church/Religious Venue',
  'My Own Private Space',
  'I Already Have a Venue',
  'Other'
];

// Cultural Styles (for applicable event types)
export const CULTURAL_STYLES = [
  {
    id: 'american',
    name: 'American',
    desc: 'Traditional American style with classic elegance and customs',
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
    desc: 'Traditional Jewish celebrations with meaningful ceremonies',
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

// Event Format options for Corporate events
export const EVENT_FORMATS = [
  {
    id: 'conference',
    name: 'Conference',
    desc: 'Professional conferences and seminars',
    icon: '🎤',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
  },
  {
    id: 'gala',
    name: 'Gala Dinner',
    desc: 'Formal galas and award ceremonies',
    icon: '🏆',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-300'
  },
  {
    id: 'networking',
    name: 'Networking Event',
    desc: 'Business mixers and networking sessions',
    icon: '🤝',
    color: 'bg-green-50 border-green-200 hover:border-green-300'
  },
  {
    id: 'training',
    name: 'Training/Workshop',
    desc: 'Educational workshops and training sessions',
    icon: '📚',
    color: 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
  },
  {
    id: 'trade_show',
    name: 'Trade Show',
    desc: 'Industry exhibitions and trade shows',
    icon: '🏢',
    color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-300'
  },
  {
    id: 'product_launch',
    name: 'Product Launch',
    desc: 'Product launches and announcements',
    icon: '🚀',
    color: 'bg-pink-50 border-pink-200 hover:border-pink-300'
  }
];

// Theme options for non-cultural event types  
export const THEME_OPTIONS = [
  {
    id: 'elegant',
    name: 'Elegant',
    desc: 'Sophisticated and refined styling',
    icon: '✨',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-300'
  },
  {
    id: 'rustic',
    name: 'Rustic',
    desc: 'Natural and countryside charm',
    icon: '🌾',
    color: 'bg-amber-50 border-amber-200 hover:border-amber-300'
  },
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Contemporary and sleek design',
    icon: '🔹',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-300'
  },
  {
    id: 'tropical',
    name: 'Tropical',
    desc: 'Vibrant island and beach vibes',
    icon: '🌺',
    color: 'bg-green-50 border-green-200 hover:border-green-300'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    desc: 'Classic retro and nostalgic feel',
    icon: '📻',
    color: 'bg-rose-50 border-rose-200 hover:border-rose-300'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    desc: 'Clean and simple aesthetic',
    icon: '⚪',
    color: 'bg-gray-50 border-gray-200 hover:border-gray-300'
  }
];

// Helper functions
export const getEventConfig = (eventType) => {
  return EVENT_FLOW_CONFIG[eventType] || EVENT_FLOW_CONFIG.other;
};

export const shouldShowCulturalStyles = (eventType) => {
  return getEventConfig(eventType).showCulturalStyles;
};

export const getReplaceWith = (eventType) => {
  return getEventConfig(eventType).replaceWith;
};

export const getVendorTags = (eventType) => {
  return getEventConfig(eventType).vendorTags;
};