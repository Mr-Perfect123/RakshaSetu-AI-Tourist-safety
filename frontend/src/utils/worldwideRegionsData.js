/**
 * Worldwide Continents, Countries, Regions & Reference Locations Master Dataset
 * 
 * Provides flexible hierarchy:
 * CONTINENT -> COUNTRY -> STATE/PROVINCE/REGION -> CITY -> DESTINATION
 * 
 * Real coordinates are provided for Open-Meteo live weather retrieval.
 * No fabricated counts are used.
 */

export const WORLDWIDE_CONTINENTS = [
  {
    id: 'asia',
    name: 'Asia',
    emoji: '🌏',
    description: 'Ancient heritage, Himalayan peaks, tropical paradises, and futuristic skylines.',
    countries: [
      {
        name: 'India',
        code: 'IN',
        capital: 'New Delhi',
        coordinates: { lat: 20.5937, lng: 78.9629 },
        popularRegions: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Maharashtra', 'Rajasthan', 'Goa', 'Himachal Pradesh', 'Uttarakhand', 'Delhi', 'Jammu & Kashmir', 'Ladakh'],
        popularCities: [
          { name: 'Munnar', state: 'Kerala', lat: 10.0889, lng: 77.0595, type: 'Tourist Destination' },
          { name: 'Ooty', state: 'Tamil Nadu', lat: 11.4102, lng: 76.6950, type: 'Tourist Destination' },
          { name: 'Kuttalam (Courtallam)', state: 'Tamil Nadu', lat: 8.9300, lng: 77.2686, type: 'Tourist Destination' },
          { name: 'Goa (Calangute)', state: 'Goa', lat: 15.5420, lng: 73.7554, type: 'Tourist Destination' },
          { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, type: 'City' },
          { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, type: 'City' },
          { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, type: 'City' },
          { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, type: 'City' },
          { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, type: 'City' },
          { name: 'Wayanad', state: 'Kerala', lat: 11.6854, lng: 76.1320, type: 'Tourist Destination' },
          { name: 'Manali', state: 'Himachal Pradesh', lat: 32.2432, lng: 77.1892, type: 'Tourist Destination' },
          { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, type: 'Tourist Destination' },
          { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lng: 74.7973, type: 'City' },
          { name: 'Leh', state: 'Ladakh', lat: 34.1526, lng: 77.5771, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Japan',
        code: 'JP',
        capital: 'Tokyo',
        coordinates: { lat: 36.2048, lng: 138.2529 },
        popularRegions: ['Kanto', 'Kansai', 'Hokkaido', 'Kyushu', 'Chubu'],
        popularCities: [
          { name: 'Tokyo', state: 'Tokyo Prefecture', lat: 35.6762, lng: 139.6503, type: 'City' },
          { name: 'Kyoto', state: 'Kansai Region', lat: 35.0116, lng: 135.7681, type: 'City' },
          { name: 'Osaka', state: 'Kansai Region', lat: 34.6937, lng: 135.5023, type: 'City' },
          { name: 'Mount Fuji', state: 'Shizuoka', lat: 35.3606, lng: 138.7274, type: 'Tourist Destination' },
          { name: 'Sapporo', state: 'Hokkaido', lat: 43.0618, lng: 141.3545, type: 'City' }
        ]
      },
      {
        name: 'United Arab Emirates',
        code: 'AE',
        capital: 'Abu Dhabi',
        coordinates: { lat: 23.4241, lng: 53.8478 },
        popularRegions: ['Dubai Emirate', 'Abu Dhabi Emirate', 'Sharjah'],
        popularCities: [
          { name: 'Dubai', state: 'Dubai', lat: 25.2048, lng: 55.2708, type: 'City' },
          { name: 'Burj Khalifa', state: 'Dubai', lat: 25.1972, lng: 55.2744, type: 'Tourist Destination' },
          { name: 'Abu Dhabi', state: 'Abu Dhabi', lat: 24.4539, lng: 54.3773, type: 'City' }
        ]
      },
      {
        name: 'Thailand',
        code: 'TH',
        capital: 'Bangkok',
        coordinates: { lat: 15.8700, lng: 100.9925 },
        popularRegions: ['Central Thailand', 'Northern Thailand', 'Southern Gulf & Andaman'],
        popularCities: [
          { name: 'Bangkok', state: 'Bangkok', lat: 13.7563, lng: 100.5018, type: 'City' },
          { name: 'Phuket', state: 'Phuket', lat: 7.8804, lng: 98.3923, type: 'Tourist Destination' },
          { name: 'Chiang Mai', state: 'Chiang Mai', lat: 18.7883, lng: 98.9853, type: 'City' },
          { name: 'Krabi', state: 'Krabi', lat: 8.0863, lng: 98.9063, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Singapore',
        code: 'SG',
        capital: 'Singapore',
        coordinates: { lat: 1.3521, lng: 103.8198 },
        popularRegions: ['Central Region', 'Marina Bay', 'Sentosa Island'],
        popularCities: [
          { name: 'Marina Bay', state: 'Singapore', lat: 1.2868, lng: 103.8545, type: 'Tourist Destination' },
          { name: 'Sentosa Island', state: 'Singapore', lat: 1.2494, lng: 103.8303, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Indonesia',
        code: 'ID',
        capital: 'Jakarta',
        coordinates: { lat: -0.7893, lng: 113.9213 },
        popularRegions: ['Bali', 'Java', 'Lombok', 'Komodo'],
        popularCities: [
          { name: 'Bali (Ubud)', state: 'Bali', lat: -8.5069, lng: 115.2625, type: 'Tourist Destination' },
          { name: 'Jakarta', state: 'DKI Jakarta', lat: -6.2088, lng: 106.8456, type: 'City' },
          { name: 'Lombok', state: 'West Nusa Tenggara', lat: -8.6509, lng: 116.3249, type: 'Tourist Destination' }
        ]
      }
    ]
  },
  {
    id: 'europe',
    name: 'Europe',
    emoji: '🏰',
    description: 'Iconic architecture, alpine summits, historic art capitals, and Mediterranean coastlines.',
    countries: [
      {
        name: 'France',
        code: 'FR',
        capital: 'Paris',
        coordinates: { lat: 46.2276, lng: 2.2137 },
        popularRegions: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Normandy'],
        popularCities: [
          { name: 'Paris', state: 'Île-de-France', lat: 48.8566, lng: 2.3522, type: 'City' },
          { name: 'Eiffel Tower', state: 'Paris', lat: 48.8584, lng: 2.2945, type: 'Tourist Destination' },
          { name: 'Nice', state: 'French Riviera', lat: 43.7102, lng: 7.2620, type: 'City' },
          { name: 'Chamonix (Mont Blanc)', state: 'Alps', lat: 45.9237, lng: 6.8694, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'United Kingdom',
        code: 'GB',
        capital: 'London',
        coordinates: { lat: 55.3781, lng: -3.4360 },
        popularRegions: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
        popularCities: [
          { name: 'London', state: 'England', lat: 51.5074, lng: -0.1278, type: 'City' },
          { name: 'Edinburgh', state: 'Scotland', lat: 55.9533, lng: -3.1883, type: 'City' },
          { name: 'Highlands & Loch Ness', state: 'Scotland', lat: 57.3229, lng: -4.4244, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Italy',
        code: 'IT',
        capital: 'Rome',
        coordinates: { lat: 41.8719, lng: 12.5674 },
        popularRegions: ['Lazio', 'Tuscany', 'Veneto', 'Lombardy', 'Amalfi Coast'],
        popularCities: [
          { name: 'Rome', state: 'Lazio', lat: 41.9028, lng: 12.4964, type: 'City' },
          { name: 'Venice', state: 'Veneto', lat: 45.4408, lng: 12.3155, type: 'City' },
          { name: 'Florence', state: 'Tuscany', lat: 43.7696, lng: 11.2558, type: 'City' },
          { name: 'Amalfi Coast', state: 'Campania', lat: 40.6340, lng: 14.6027, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Switzerland',
        code: 'CH',
        capital: 'Bern',
        coordinates: { lat: 46.8182, lng: 8.2275 },
        popularRegions: ['Bernese Oberland', 'Valais', 'Lucerne', 'Zurich'],
        popularCities: [
          { name: 'Zermatt (Matterhorn)', state: 'Valais', lat: 45.9763, lng: 7.7491, type: 'Tourist Destination' },
          { name: 'Lucerne', state: 'Lucerne', lat: 47.0502, lng: 8.3093, type: 'City' },
          { name: 'Zurich', state: 'Zurich', lat: 47.3769, lng: 8.5417, type: 'City' },
          { name: 'Interlaken', state: 'Bern', lat: 46.6863, lng: 7.8632, type: 'Tourist Destination' }
        ]
      }
    ]
  },
  {
    id: 'americas',
    name: 'Americas',
    emoji: '🌎',
    description: 'Vast national parks, modern metropolises, Mayan ruins, and Amazonian biodiversity.',
    countries: [
      {
        name: 'United States',
        code: 'US',
        capital: 'Washington, D.C.',
        coordinates: { lat: 37.0902, lng: -95.7129 },
        popularRegions: ['California', 'New York', 'Florida', 'Colorado', 'Hawaii', 'Arizona'],
        popularCities: [
          { name: 'New York City', state: 'New York', lat: 40.7128, lng: -74.0060, type: 'City' },
          { name: 'San Francisco', state: 'California', lat: 37.7749, lng: -122.4194, type: 'City' },
          { name: 'Grand Canyon', state: 'Arizona', lat: 36.1069, lng: -112.1129, type: 'Tourist Destination' },
          { name: 'Honolulu', state: 'Hawaii', lat: 21.3069, lng: -157.8583, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Canada',
        code: 'CA',
        capital: 'Ottawa',
        coordinates: { lat: 56.1304, lng: -106.3468 },
        popularRegions: ['Ontario', 'British Columbia', 'Alberta', 'Quebec'],
        popularCities: [
          { name: 'Banff National Park', state: 'Alberta', lat: 51.4968, lng: -115.9281, type: 'Tourist Destination' },
          { name: 'Vancouver', state: 'British Columbia', lat: 49.2827, lng: -123.1207, type: 'City' },
          { name: 'Toronto', state: 'Ontario', lat: 43.6532, lng: -79.3832, type: 'City' },
          { name: 'Niagara Falls', state: 'Ontario', lat: 43.0896, lng: -79.0849, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Brazil',
        code: 'BR',
        capital: 'Brasilia',
        coordinates: { lat: -14.2350, lng: -51.9253 },
        popularRegions: ['Rio de Janeiro', 'Sao Paulo', 'Amazonas', 'Bahia'],
        popularCities: [
          { name: 'Rio de Janeiro (Christ the Redeemer)', state: 'Rio de Janeiro', lat: -22.9519, lng: -43.2105, type: 'Tourist Destination' },
          { name: 'Iguazu Falls', state: 'Parana', lat: -25.6953, lng: -54.4367, type: 'Tourist Destination' }
        ]
      }
    ]
  },
  {
    id: 'africa',
    name: 'Africa',
    emoji: '🦁',
    description: 'Serengeti wildlife migrations, ancient Sahara dunes, pyramids, and Indian Ocean reefs.',
    countries: [
      {
        name: 'Egypt',
        code: 'EG',
        capital: 'Cairo',
        coordinates: { lat: 26.8206, lng: 30.8025 },
        popularRegions: ['Cairo Governorate', 'Giza', 'Luxor', 'Red Sea Coast'],
        popularCities: [
          { name: 'Pyramids of Giza', state: 'Giza', lat: 29.9792, lng: 31.1342, type: 'Tourist Destination' },
          { name: 'Cairo', state: 'Cairo', lat: 30.0444, lng: 31.2357, type: 'City' },
          { name: 'Luxor (Valley of the Kings)', state: 'Luxor', lat: 25.6872, lng: 32.6396, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'South Africa',
        code: 'ZA',
        capital: 'Pretoria / Cape Town',
        coordinates: { lat: -30.5595, lng: 22.9375 },
        popularRegions: ['Western Cape', 'Gauteng', 'Mpumalanga (Kruger)'],
        popularCities: [
          { name: 'Cape Town (Table Mountain)', state: 'Western Cape', lat: -33.9249, lng: 18.4241, type: 'City' },
          { name: 'Kruger National Park', state: 'Mpumalanga', lat: -23.9884, lng: 31.5547, type: 'Tourist Destination' }
        ]
      },
      {
        name: 'Kenya',
        code: 'KE',
        capital: 'Nairobi',
        coordinates: { lat: -0.0236, lng: 37.9062 },
        popularRegions: ['Maasai Mara', 'Coast (Mombasa)', 'Rift Valley'],
        popularCities: [
          { name: 'Maasai Mara National Reserve', state: 'Narok', lat: -1.5022, lng: 35.1444, type: 'Tourist Destination' },
          { name: 'Nairobi', state: 'Nairobi', lat: -1.2921, lng: 36.8219, type: 'City' }
        ]
      }
    ]
  },
  {
    id: 'oceania',
    name: 'Oceania',
    emoji: '🦘',
    description: 'Great Barrier Reef, dramatic fiords, Polynesian atolls, and Australian outback.',
    countries: [
      {
        name: 'Australia',
        code: 'AU',
        capital: 'Canberra',
        coordinates: { lat: -25.2744, lng: 133.7751 },
        popularRegions: ['New South Wales', 'Queensland', 'Victoria', 'Western Australia', 'Tasmania'],
        popularCities: [
          { name: 'Sydney (Opera House)', state: 'New South Wales', lat: -33.8568, lng: 151.2153, type: 'City' },
          { name: 'Great Barrier Reef (Cairns)', state: 'Queensland', lat: -16.9186, lng: 145.7781, type: 'Tourist Destination' },
          { name: 'Melbourne', state: 'Victoria', lat: -37.8136, lng: 144.9631, type: 'City' }
        ]
      },
      {
        name: 'New Zealand',
        code: 'NZ',
        capital: 'Wellington',
        coordinates: { lat: -40.9006, lng: 174.8860 },
        popularRegions: ['South Island', 'North Island', 'Fiordland', 'Queenstown Lakes'],
        popularCities: [
          { name: 'Queenstown (Milford Sound)', state: 'Otago', lat: -45.0312, lng: 168.6626, type: 'Tourist Destination' },
          { name: 'Auckland', state: 'Auckland', lat: -36.8485, lng: 174.7633, type: 'City' }
        ]
      },
      {
        name: 'Fiji',
        code: 'FJ',
        capital: 'Suva',
        coordinates: { lat: -17.7134, lng: 178.0650 },
        popularRegions: ['Viti Levu', 'Mamanuca Islands', 'Yasawa'],
        popularCities: [
          { name: 'Nadi & Mamanuca Islands', state: 'Western Division', lat: -17.8000, lng: 177.4167, type: 'Tourist Destination' }
        ]
      }
    ]
  }
];

export const getCountryByName = (name) => {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  for (const continent of WORLDWIDE_CONTINENTS) {
    const country = continent.countries.find(c => 
      c.name.toLowerCase() === clean || 
      c.code.toLowerCase() === clean ||
      clean.includes(c.name.toLowerCase())
    );
    if (country) return { ...country, continentName: continent.name };
  }
  return null;
};
