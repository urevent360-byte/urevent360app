// Service Mapping Configuration - Single Source of Truth
// Maps wizard service selections to Step-by-Step Mode vendor categories and budget buckets

export const SERVICE_MAPPING = {
  // Reception Services (Core Vendors)
  'Catering': {
    stepByStepCategory: 'Catering',
    budgetBucket: 'Food & Beverage',
    section: 'core-vendors',
    vendorTypes: ['catering', 'caterer'],
    context: 'reception'
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
  
  'Reception Lighting': {
    stepByStepCategory: 'Lighting',
    budgetBucket: 'Production / Lighting',
    section: 'core-vendors', 
    vendorTypes: ['lighting', 'uplighting'],
    context: 'reception'
  },
  
  'Dance Floor': {
    stepByStepCategory: 'Dance Floor Rental',
    budgetBucket: 'Rentals / Production',
    section: 'core-vendors',
    vendorTypes: ['dance_floor', 'flooring', 'rentals'],
    context: 'reception'
  },
  
  'Photography/Videography': {
    stepByStepCategory: 'Photographer / Videographer',
    budgetBucket: 'Photo/Video',
    section: 'core-vendors',
    vendorTypes: ['photography', 'videography', 'photo', 'video'],
    context: 'both'
  },
  
  'Reception Décor': {
    stepByStepCategory: 'Decor / Floral / Rentals', 
    budgetBucket: 'Decor & Design',
    section: 'core-vendors',
    vendorTypes: ['decor', 'floral', 'design'],
    context: 'reception'
  },
  
  'Wedding Cake': {
    stepByStepCategory: 'Bakery / Cake',
    budgetBucket: 'Food & Beverage',
    section: 'core-vendors',
    vendorTypes: ['bakery', 'cake', 'dessert'],
    context: 'reception'
  },
  
  'Day-of Coordination': {
    stepByStepCategory: 'Coordinator / Planner (Day-Of)',
    budgetBucket: 'Planning / Coordination',
    section: 'core-vendors', 
    vendorTypes: ['coordinator', 'planner', 'day_of'],
    context: 'both'
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
  'Photo Booth': {
    stepByStepCategory: 'Photo Booth',
    budgetBucket: 'Photo/Video (Extras)',
    section: 'add-ons',
    vendorTypes: ['photo_booth'],
    context: 'reception'
  },
  
  'Live Entertainment': {
    stepByStepCategory: 'Specialty Acts / Performers',
    budgetBucket: 'Entertainment (Extras)',
    section: 'add-ons',
    vendorTypes: ['performers', 'acts', 'entertainment'],
    context: 'reception'
  },
  
  'Special Lighting Effects': {
    stepByStepCategory: 'FX (Cold Sparks, Dancing on Clouds, Spotlights)', 
    budgetBucket: 'Production / Lighting (Extras)',
    section: 'add-ons',
    vendorTypes: ['fx', 'cold_sparks', 'clouds', 'special_effects'],
    context: 'reception'
  },
  
  'Lounge Areas': {
    stepByStepCategory: 'Lounge Furniture Rental',
    budgetBucket: 'Rentals (Extras)', 
    section: 'add-ons',
    vendorTypes: ['lounge', 'furniture', 'seating'],
    context: 'reception'
  },
  
  'Dessert Station': {
    stepByStepCategory: 'Dessert Station / Catering Add-On',
    budgetBucket: 'Food & Beverage (Extras)',
    section: 'add-ons',
    vendorTypes: ['dessert_station', 'dessert'],
    context: 'reception'
  },
  
  'Late Night Snacks': {
    stepByStepCategory: 'Catering Late Night',
    budgetBucket: 'Food & Beverage (Extras)',
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