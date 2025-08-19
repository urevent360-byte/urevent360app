// Service Mapping Configuration - Single Source of Truth
// Maps wizard service selections to Step-by-Step Mode vendor categories and budget buckets

export const SERVICE_MAPPING = {
  // Reception Services (Core Vendors)
  'Catering': {
    stepByStepCategory: 'Catering',
    budgetBucket: 'Food & Beverage',
    section: 'core-vendors',
    vendorTypes: ['catering', 'caterer', 'full_service_catering'],
    context: 'reception',
    subcategories: [
      'Full-Service Catering',
      'Appetizers / Small Bites only', 
      'Specialty Food Stations'
    ],
    specialtyStations: [
      'Sushi Station',
      'Charcuterie/Cheese Station', 
      'Fruit Station',
      'Taco Station',
      'Pasta Station', 
      'Carving Station',
      'Seafood/Raw Bar',
      'Ceviche Station'
    ]
  },
  
  'Bar Service': {
    stepByStepCategory: 'Bar / Bartending', 
    budgetBucket: 'Food & Beverage',
    section: 'core-vendors',
    vendorTypes: ['bar', 'bartending', 'beverage'],
    context: 'reception'
  },
  
  'DJ/Band': {
    stepByStepCategory: 'DJ / Live Band',
    budgetBucket: 'Entertainment / Music', 
    section: 'core-vendors',
    vendorTypes: ['dj', 'band', 'music', 'entertainment'],
    context: 'reception'
  },
  
  'Photography/Videography': {
    stepByStepCategory: 'Photographer / Videographer',
    budgetBucket: 'Photo/Video',
    section: 'core-vendors',
    vendorTypes: ['photography', 'videography', 'photo', 'video'],
    context: 'both'
  },
  
  'Reception Lighting': {
    stepByStepCategory: 'Reception Lighting',
    budgetBucket: 'Production & Rentals',
    section: 'core-vendors', 
    vendorTypes: ['lighting', 'uplighting', 'reception_lighting'],
    context: 'reception'
  },
  
  'Day-of Coordination': {
    stepByStepCategory: 'Coordinator / Planner (Day-Of)',
    budgetBucket: 'Planning / Coordination',
    section: 'core-vendors', 
    vendorTypes: ['coordinator', 'planner', 'day_of'],
    context: 'both'
  },

  'Cakes': {
    stepByStepCategory: 'Cakes & Custom Designs',
    budgetBucket: 'Food & Beverage',
    section: 'core-vendors',
    vendorTypes: ['bakery', 'cake', 'wedding_cake', 'birthday_cake', 'quince_cake'],
    context: 'reception',
    subcategories: [
      'Wedding Cake',
      'Birthday Cake', 
      'Quinceañera Cake',
      'Custom Designs',
      'Cupcakes',
      'Macarons'
    ]
  },

  // Ceremony Services (Core Vendors)
  'Officiant': {
    stepByStepCategory: 'Officiant / Celebrant',
    budgetBucket: 'Ceremony',
    section: 'core-vendors',
    vendorTypes: ['officiant', 'celebrant', 'minister'],
    context: 'ceremony'
  },
  
  'Ceremony Music/Sound': {
    stepByStepCategory: 'Ceremony Musicians / Sound',
    budgetBucket: 'Entertainment / Music',
    section: 'core-vendors',
    vendorTypes: ['ceremony_music', 'musicians', 'sound'],
    context: 'ceremony'
  },
  
  'Ceremony Arch/Altar': {
    stepByStepCategory: 'Ceremony Arch / Backdrop',
    budgetBucket: 'Ceremony',
    section: 'core-vendors',
    vendorTypes: ['arch', 'backdrop', 'ceremony_decor'],
    context: 'ceremony'
  },

  // Reception Extras (Add-Ons)
  'Dessert Stations & Sweets': {
    stepByStepCategory: 'Dessert Stations & Sweets',
    budgetBucket: 'Food & Beverage',
    section: 'add-ons',
    vendorTypes: ['dessert_station', 'sweets', 'candy_bar', 'donut_wall'],
    context: 'reception',
    subcategories: [
      'Dessert Table',
      'Candy Bar',
      'Donut Wall', 
      'Ice-cream Cart',
      'Chocolate Fountain',
      'Fruit Display',
      'Churros Station',
      'Cotton Candy',
      'S\'mores Station'
    ]
  },
  
  'Dance Floor': {
    stepByStepCategory: 'Dance Floor Rental',
    budgetBucket: 'Production & Rentals',
    section: 'add-ons', // Moved from core-vendors to add-ons
    vendorTypes: ['dance_floor', 'flooring', 'rentals'],
    context: 'reception'
  },
  
  'Photo Booth': {
    stepByStepCategory: 'Photo Booth',
    budgetBucket: 'Photo/Video (Extras)',
    section: 'add-ons',
    vendorTypes: ['photo_booth'],
    context: 'reception'
  },
  
  'Special Lighting Effects': {
    stepByStepCategory: 'FX (Cold Sparks, Dancing on Clouds, Spotlights)', 
    budgetBucket: 'Production & Rentals',
    section: 'add-ons',
    vendorTypes: ['fx', 'cold_sparks', 'clouds', 'special_effects'],
    context: 'reception'
  },
  
  'Lounge Areas': {
    stepByStepCategory: 'Lounge Furniture Rental',
    budgetBucket: 'Production & Rentals', 
    section: 'add-ons',
    vendorTypes: ['lounge', 'furniture', 'seating'],
    context: 'reception'
  },
  
  'Late Night Snacks': {
    stepByStepCategory: 'Catering Late Night',
    budgetBucket: 'Food & Beverage',
    section: 'add-ons',
    vendorTypes: ['late_night', 'snacks'],
    context: 'reception'
  }
};

// Helper functions
export const getServicesBySection = (services, section) => {
  if (!services || !Array.isArray(services)) return [];
  
  return services.filter(service => {
    const mapping = SERVICE_MAPPING[service];
    return mapping && mapping.section === section;
  });
};

export const getServicesByContext = (services, context) => {
  if (!services || !Array.isArray(services)) return [];
  
  return services.filter(service => {
    const mapping = SERVICE_MAPPING[service];
    return mapping && (mapping.context === context || mapping.context === 'both');
  });
};

export const getBudgetBuckets = (services) => {
  if (!services || !Array.isArray(services)) return [];
  
  const buckets = new Set();
  services.forEach(service => {
    const mapping = SERVICE_MAPPING[service];
    if (mapping && mapping.budgetBucket) {
      buckets.add(mapping.budgetBucket);
    }
  });
  
  return Array.from(buckets);
};

export const getBudgetBucketsWithMappings = () => {
  return {
    'Food & Beverage': [
      'Catering (Full-Service, Appetizers, Specialty Stations)',
      'Bar Service', 
      'Cakes (Wedding/Birthday/Quince)',
      'Dessert Stations & Sweets',
      'Late Night Snacks'
    ],
    'Production & Rentals': [
      'Reception Lighting',
      'Dance Floor', 
      'Special Lighting Effects',
      'Lounge Areas'
    ],
    'Entertainment / Music': [
      'DJ/Band',
      'Ceremony Musicians'
    ],
    'Photo/Video': [
      'Photography/Videography',
      'Photo Booth'
    ],
    'Planning / Coordination': [
      'Day-of Coordination'
    ],
    'Ceremony': [
      'Officiant',
      'Ceremony Arch/Altar'
    ]
  };
};

export const getVendorTypesForServices = (services) => {
  if (!services || !Array.isArray(services)) return [];
  
  const vendorTypes = new Set();
  services.forEach(service => {
    const mapping = SERVICE_MAPPING[service];
    if (mapping && mapping.vendorTypes) {
      mapping.vendorTypes.forEach(type => vendorTypes.add(type));
    }
  });
  
  return Array.from(vendorTypes);
};