/**
 * Official Indian States & Union Territories Master Geographic & Reference Dataset
 * 
 * Contains all 28 States and 8 Union Territories with verified representative
 * reference coordinates, administrative capitals, regions, and major tourist hubs.
 * 
 * Note: Weather fetched using these coordinates is explicitly labeled as
 * "Representative regional weather for [State/UT]" and does NOT represent
 * localized microclimates across every city in the region.
 */

export const INDIAN_STATES = [
  {
    name: 'Andhra Pradesh',
    code: 'AP',
    type: 'State',
    capital: 'Amaravati',
    region: 'South India',
    coordinates: { lat: 16.5417, lng: 80.5158 },
    emoji: '🛕',
    themeColor: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300',
    popularCities: ['Visakhapatnam', 'Tirupati', 'Vijayawada', 'Araku Valley'],
    description: 'Home of the sacred Tirumala Venkateswara Temple, pristine coastal Visakhapatnam, and lush Araku Valley.'
  },
  {
    name: 'Arunachal Pradesh',
    code: 'AR',
    type: 'State',
    capital: 'Itanagar',
    region: 'Northeast India',
    coordinates: { lat: 27.0844, lng: 93.6053 },
    emoji: '🏔️',
    themeColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    popularCities: ['Tawang', 'Ziro Valley', 'Itanagar', 'Bomdila'],
    description: 'The "Land of Dawn-Lit Mountains", featuring ancient Buddhist monasteries, pristine Himalayan valleys, and Ziro music heritage.'
  },
  {
    name: 'Assam',
    code: 'AS',
    type: 'State',
    capital: 'Dispur',
    region: 'Northeast India',
    coordinates: { lat: 26.1445, lng: 91.7362 },
    emoji: '🦏',
    themeColor: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-800 dark:text-green-300',
    popularCities: ['Guwahati', 'Kaziranga', 'Majuli', 'Manas National Park', 'Tezpur'],
    description: 'Famous for the world-renowned Kaziranga one-horned rhinos, Brahmaputra river islands, and expansive aromatic tea gardens.'
  },
  {
    name: 'Bihar',
    code: 'BR',
    type: 'State',
    capital: 'Patna',
    region: 'East India',
    coordinates: { lat: 25.5941, lng: 85.1376 },
    emoji: '☸️',
    themeColor: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-800 dark:text-yellow-300',
    popularCities: ['Bodh Gaya', 'Nalanda', 'Rajgir', 'Patna', 'Vaishali'],
    description: 'The ancient cradle of Buddhism and Jainism, home to the Mahabodhi Temple and ruins of ancient Nalanda University.'
  },
  {
    name: 'Chhattisgarh',
    code: 'CG',
    type: 'State',
    capital: 'Raipur',
    region: 'Central India',
    coordinates: { lat: 21.2514, lng: 81.6296 },
    emoji: '🌊',
    themeColor: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-800 dark:text-teal-300',
    popularCities: ['Jagdalpur', 'Chitrakote Falls', 'Raipur', 'Barnawapara'],
    description: 'Heartland of magnificent waterfalls including the wide Chitrakote Falls ("Niagara of India") and rich tribal heritage.'
  },
  {
    name: 'Goa',
    code: 'GA',
    type: 'State',
    capital: 'Panaji',
    region: 'West India',
    coordinates: { lat: 15.4909, lng: 73.8278 },
    emoji: '🏖️',
    themeColor: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
    popularCities: ['Calangute', 'Panaji', 'Old Goa', 'Palolem', 'Anjuna', 'Dudhsagar'],
    description: 'India\'s premier beach paradise, featuring Portuguese colonial heritage, Dudhsagar waterfalls, and vibrant coastal culture.'
  },
  {
    name: 'Gujarat',
    code: 'GJ',
    type: 'State',
    capital: 'Gandhinagar',
    region: 'West India',
    coordinates: { lat: 23.2156, lng: 72.6369 },
    emoji: '🦁',
    themeColor: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300',
    popularCities: ['Ahmedabad', 'Rann of Kutch', 'Gir National Park', 'Statue of Unity', 'Dwarka', 'Somnath'],
    description: 'Home of the Asiatic lions in Gir, the white desert of Rann of Kutch, Statue of Unity, and the Sabarmati Ashram.'
  },
  {
    name: 'Haryana',
    code: 'HR',
    type: 'State',
    capital: 'Chandigarh',
    region: 'North India',
    coordinates: { lat: 29.0588, lng: 76.0856 },
    emoji: '🌾',
    themeColor: 'from-lime-500/20 to-green-500/20 border-lime-500/30 text-lime-800 dark:text-lime-300',
    popularCities: ['Gurugram', 'Kurukshetra', 'Sultanpur Bird Sanctuary', 'Pinjore Gardens'],
    description: 'Historic battleground of the Mahabharata at Kurukshetra, birding at Sultanpur, and the royal Pinjore Mughal gardens.'
  },
  {
    name: 'Himachal Pradesh',
    code: 'HP',
    type: 'State',
    capital: 'Shimla',
    region: 'North India',
    coordinates: { lat: 31.1048, lng: 77.1734 },
    emoji: '🏔️',
    themeColor: 'from-indigo-500/20 to-sky-500/20 border-indigo-500/30 text-indigo-800 dark:text-indigo-300',
    popularCities: ['Shimla', 'Manali', 'Dharamshala', 'Spiti Valley', 'Kasol', 'Dalhousie'],
    description: 'Dramatic Himalayan landscapes, snow-covered mountain passes, Tibetan monasteries, and the UNESCO Kalka-Shimla Toy Train.'
  },
  {
    name: 'Jharkhand',
    code: 'JH',
    type: 'State',
    capital: 'Ranchi',
    region: 'East India',
    coordinates: { lat: 23.3441, lng: 85.3096 },
    emoji: '🌲',
    themeColor: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    popularCities: ['Ranchi', 'Jamshedpur', 'Deoghar', 'Betla National Park', 'Hundru Falls'],
    description: 'The "Land of Forests" famous for picturesque Hundru waterfalls, sacred Baidyanath Dham temple, and Betla National Park.'
  },
  {
    name: 'Karnataka',
    code: 'KA',
    type: 'State',
    capital: 'Bengaluru',
    region: 'South India',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    emoji: '🏯',
    themeColor: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-800 dark:text-purple-300',
    popularCities: ['Bengaluru', 'Mysuru', 'Hampi', 'Coorg', 'Gokarna', 'Chikmagalur'],
    description: 'UNESCO World Heritage ruins of Hampi, the opulent Mysore Palace, misty coffee hills of Coorg, and Gokarna\'s serene beaches.'
  },
  {
    name: 'Kerala',
    code: 'KL',
    type: 'State',
    capital: 'Thiruvananthapuram',
    region: 'South India',
    coordinates: { lat: 8.5241, lng: 76.9366 },
    emoji: '🌴',
    themeColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    popularCities: ['Munnar', 'Wayanad', 'Alleppey (Alappuzha)', 'Kochi', 'Varkala', 'Thekkady', 'Kovalam'],
    description: '"God\'s Own Country", celebrated for backwater houseboats in Alleppey, emerald tea gardens of Munnar, and cliff beaches of Varkala.'
  },
  {
    name: 'Madhya Pradesh',
    code: 'MP',
    type: 'State',
    capital: 'Bhopal',
    region: 'Central India',
    coordinates: { lat: 23.2599, lng: 77.4126 },
    emoji: '🐅',
    themeColor: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-800 dark:text-orange-300',
    popularCities: ['Khajuraho', 'Kanha Tiger Reserve', 'Bhopal', 'Gwalior', 'Ujjain', 'Pachmarhi'],
    description: 'The "Tiger State" of India, featuring Khajuraho erotic temples, Sanchi Buddhist stupa, and dense Kanha/Bandhavgarh jungles.'
  },
  {
    name: 'Maharashtra',
    code: 'MH',
    type: 'State',
    capital: 'Mumbai',
    region: 'West India',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    emoji: '🌆',
    themeColor: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-800 dark:text-blue-300',
    popularCities: ['Mumbai', 'Pune', 'Lonavala', 'Ajanta & Ellora', 'Mahabaleshwar', 'Shirdi', 'Alibaug'],
    description: 'Dynamic metropolis of Mumbai, ancient UNESCO Ajanta & Ellora rock-cut caves, and the Sahyadri Western Ghat hill stations.'
  },
  {
    name: 'Manipur',
    code: 'MN',
    type: 'State',
    capital: 'Imphal',
    region: 'Northeast India',
    coordinates: { lat: 24.8170, lng: 93.9368 },
    emoji: '🌺',
    themeColor: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-800 dark:text-rose-300',
    popularCities: ['Imphal', 'Loktak Lake', 'Keibul Lamjao', 'Ukhrul'],
    description: 'World\'s only floating national park on Loktak Lake, home to the endangered Sangai deer and pristine Dzukou Valley access.'
  },
  {
    name: 'Meghalaya',
    code: 'ML',
    type: 'State',
    capital: 'Shillong',
    region: 'Northeast India',
    coordinates: { lat: 25.5788, lng: 91.8933 },
    emoji: '🌧️',
    themeColor: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
    popularCities: ['Shillong', 'Cherrapunji (Sohra)', 'Mawlynnong', 'Dawki (Umngot River)'],
    description: 'The "Abode of Clouds", world-record rainfalls at Cherrapunji, living root bridges, and crystal-clear waters of Dawki.'
  },
  {
    name: 'Mizoram',
    code: 'MZ',
    type: 'State',
    capital: 'Aizawl',
    region: 'Northeast India',
    coordinates: { lat: 23.7271, lng: 92.7176 },
    emoji: '🎋',
    themeColor: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-800 dark:text-teal-300',
    popularCities: ['Aizawl', 'Champhai', 'Vantawng Falls', 'Reiek'],
    description: 'Rolling bamboo-clad hills, picturesque cliffside Aizawl, and spectacular high waterfalls like Vantawng Falls.'
  },
  {
    name: 'Nagaland',
    code: 'NL',
    type: 'State',
    capital: 'Kohima',
    region: 'Northeast India',
    coordinates: { lat: 25.6751, lng: 94.1086 },
    emoji: '🪶',
    themeColor: 'from-amber-500/20 to-red-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300',
    popularCities: ['Kohima', 'Dimapur', 'Dzukou Valley', 'Mokokchung', 'Khonoma'],
    description: 'World-famous Hornbill Festival, pristine Dzukou Valley trek, and Khonoma green village conservation models.'
  },
  {
    name: 'Odisha',
    code: 'OD',
    type: 'State',
    capital: 'Bhubaneswar',
    region: 'East India',
    coordinates: { lat: 20.2961, lng: 85.8245 },
    emoji: '🛕',
    themeColor: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-800 dark:text-yellow-300',
    popularCities: ['Puri', 'Konark Sun Temple', 'Bhubaneswar', 'Chilika Lake', 'Simlipal'],
    description: 'The UNESCO Sun Temple of Konark, sacred Jagannath Puri temple, and Chilika Lake dolphin sanctuary.'
  },
  {
    name: 'Punjab',
    code: 'PB',
    type: 'State',
    capital: 'Chandigarh',
    region: 'North India',
    coordinates: { lat: 31.1471, lng: 75.3412 },
    emoji: '🕌',
    themeColor: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300',
    popularCities: ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Wagah Border'],
    description: 'The spiritual heart of Sikhism at the Golden Temple (Harmandir Sahib), Wagah Border ceremony, and rich culinary culture.'
  },
  {
    name: 'Rajasthan',
    code: 'RJ',
    type: 'State',
    capital: 'Jaipur',
    region: 'North India',
    coordinates: { lat: 26.9124, lng: 75.7873 },
    emoji: '🏰',
    themeColor: 'from-amber-500/20 to-rose-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300',
    popularCities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar', 'Ranthambore'],
    description: 'The "Land of Kings", magnificent forts of Amer and Mehrangarh, Lake Palace Udaipur, Thar Desert dunes, and tiger safaris.'
  },
  {
    name: 'Sikkim',
    code: 'SK',
    type: 'State',
    capital: 'Gangtok',
    region: 'Northeast India',
    coordinates: { lat: 27.3314, lng: 88.6138 },
    emoji: '🏔️',
    themeColor: 'from-sky-500/20 to-teal-500/20 border-sky-500/30 text-sky-800 dark:text-sky-300',
    popularCities: ['Gangtok', 'Pelling', 'Nathula Pass', 'Gurudongmar Lake', 'Yuksom'],
    description: 'India\'s 100% organic state nestled in the shadow of Mount Kangchenjunga, glacial lakes, and ancient Tibetan monasteries.'
  },
  {
    name: 'Tamil Nadu',
    code: 'TN',
    type: 'State',
    capital: 'Chennai',
    region: 'South India',
    coordinates: { lat: 13.0827, lng: 80.2707 },
    emoji: '🏛️',
    themeColor: 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-800 dark:text-orange-300',
    popularCities: ['Chennai', 'Ooty', 'Kodaikanal', 'Madurai', 'Kanyakumari', 'Courtallam (Kuttalam)', 'Mahabalipuram', 'Coimbatore', 'Rameswaram', 'Thanjavur'],
    description: 'UNESCO Dravidian temple capitals, Nilgiri hill stations (Ooty, Kodaikanal), Mahabalipuram shore temples, and Courtallam waterfalls.'
  },
  {
    name: 'Telangana',
    code: 'TS',
    type: 'State',
    capital: 'Hyderabad',
    region: 'South India',
    coordinates: { lat: 17.3850, lng: 78.4867 },
    emoji: '💎',
    themeColor: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
    popularCities: ['Hyderabad', 'Warangal', 'Ramoji Film City', 'Nagarjuna Sagar'],
    description: 'The historic "City of Pearls", iconic Charminar, Golconda Fort, Ramappa UNESCO temple, and world-renowned Hyderabadi biryani.'
  },
  {
    name: 'Tripura',
    code: 'TR',
    type: 'State',
    capital: 'Agartala',
    region: 'Northeast India',
    coordinates: { lat: 23.8315, lng: 91.2868 },
    emoji: '👑',
    themeColor: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-800 dark:text-violet-300',
    popularCities: ['Agartala', 'Ujjayanta Palace', 'Neermahal', 'Unakoti'],
    description: 'Rock-carved sculptures of Unakoti, the water palace of Neermahal, and the grand white Ujjayanta Palace.'
  },
  {
    name: 'Uttar Pradesh',
    code: 'UP',
    type: 'State',
    capital: 'Lucknow',
    region: 'North India',
    coordinates: { lat: 26.8467, lng: 80.9462 },
    emoji: '🕌',
    themeColor: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-800 dark:text-purple-300',
    popularCities: ['Agra', 'Varanasi', 'Lucknow', 'Ayodhya', 'Mathura & Vrindavan', 'Prayagraj'],
    description: 'The world wonder Taj Mahal in Agra, eternal spiritual Ghats of Varanasi along the Ganga, and Awadhi Nawabi architecture.'
  },
  {
    name: 'Uttarakhand',
    code: 'UK',
    type: 'State',
    capital: 'Dehradun',
    region: 'North India',
    coordinates: { lat: 30.3165, lng: 78.0322 },
    emoji: '⛰️',
    themeColor: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-800 dark:text-teal-300',
    popularCities: ['Rishikesh', 'Haridwar', 'Mussoorie', 'Nainital', 'Jim Corbett', 'Auli', 'Badrinath & Kedarnath'],
    description: '"Devbhoomi" (Land of the Gods), Yoga capital Rishikesh, tiger safaris at Jim Corbett, and high-altitude ski slopes of Auli.'
  },
  {
    name: 'West Bengal',
    code: 'WB',
    type: 'State',
    capital: 'Kolkata',
    region: 'East India',
    coordinates: { lat: 22.5726, lng: 88.3639 },
    emoji: '🎭',
    themeColor: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-800 dark:text-pink-300',
    popularCities: ['Kolkata', 'Darjeeling', 'Sundarbans', 'Kalimpong', 'Digha', 'Santiniketan'],
    description: 'The "City of Joy" Kolkata, Himalayan tea hills of Darjeeling with toy train, and the UNESCO mangrove Sundarbans Royal Bengal Tigers.'
  }
];

export const INDIAN_UNION_TERRITORIES = [
  {
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    type: 'Union Territory',
    capital: 'Port Blair',
    region: 'Island Territory',
    coordinates: { lat: 11.6234, lng: 92.7265 },
    emoji: '🏝️',
    themeColor: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-800 dark:text-sky-300',
    popularCities: ['Havelock Island (Swaraj Dweep)', 'Neil Island', 'Port Blair', 'Radhanagar Beach'],
    description: 'Turquoise waters, world-famous Radhanagar Beach, scuba coral reefs, and the historic Cellular Jail.'
  },
  {
    name: 'Chandigarh',
    code: 'CH',
    type: 'Union Territory',
    capital: 'Chandigarh',
    region: 'North India',
    coordinates: { lat: 30.7333, lng: 76.7794 },
    emoji: '⛲',
    themeColor: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-800 dark:text-teal-300',
    popularCities: ['Rock Garden', 'Sukhna Lake', 'Rose Garden', 'Capitol Complex'],
    description: 'India\'s masterpiece planned city designed by Le Corbusier, featuring the whimsical Nek Chand Rock Garden.'
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DH',
    type: 'Union Territory',
    capital: 'Daman',
    region: 'West India',
    coordinates: { lat: 20.4283, lng: 72.8397 },
    emoji: '🏰',
    themeColor: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-800 dark:text-amber-300',
    popularCities: ['Daman', 'Diu', 'Silvassa', 'Nagoa Beach'],
    description: 'Portuguese fortresses, peaceful Arabian Sea beaches, and scenic lush gardens of Silvassa.'
  },
  {
    name: 'Delhi',
    code: 'DL',
    type: 'Union Territory',
    capital: 'New Delhi',
    region: 'North India',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    emoji: '🏛️',
    themeColor: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-800 dark:text-red-300',
    popularCities: ['New Delhi', 'Old Delhi', 'Qutub Minar', 'Red Fort', 'India Gate', 'Lotus Temple'],
    description: 'India\'s historic capital city, blending Mughal UNESCO monuments (Red Fort, Qutub Minar) with modern grand avenues.'
  },
  {
    name: 'Jammu and Kashmir',
    code: 'JK',
    type: 'Union Territory',
    capital: 'Srinagar (Summer) / Jammu (Winter)',
    region: 'North India',
    coordinates: { lat: 34.0837, lng: 74.7973 },
    emoji: '🏔️',
    themeColor: 'from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-800 dark:text-sky-300',
    popularCities: ['Srinagar (Dal Lake)', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Vaishno Devi', 'Patnitop'],
    description: '"Paradise on Earth", shikaras on Dal Lake, world-class skiing at Gulmarg Gondola, and scenic valleys of Pahalgam.'
  },
  {
    name: 'Ladakh',
    code: 'LA',
    type: 'Union Territory',
    capital: 'Leh',
    region: 'North India',
    coordinates: { lat: 34.1526, lng: 77.5771 },
    emoji: '❄️',
    themeColor: 'from-cyan-500/20 to-slate-500/20 border-cyan-500/30 text-cyan-800 dark:text-cyan-300',
    popularCities: ['Leh', 'Pangong Tso Lake', 'Nubra Valley', 'Khardung La Pass', 'Zanskar Valley'],
    description: 'The "Land of High Passes", dramatic cold desert landscapes, azure Pangong Lake, and centuries-old Gompas.'
  },
  {
    name: 'Lakshadweep',
    code: 'LD',
    type: 'Union Territory',
    capital: 'Kavaratti',
    region: 'Island Territory',
    coordinates: { lat: 10.5667, lng: 72.6417 },
    emoji: '🪸',
    themeColor: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-800 dark:text-teal-300',
    popularCities: ['Agatti Island', 'Bangaram Island', 'Kavaratti', 'Minicoy'],
    description: 'Untouched coral atolls, crystal lagoon waters, and vibrant marine life in the Arabian Sea.'
  },
  {
    name: 'Puducherry',
    code: 'PY',
    type: 'Union Territory',
    capital: 'Puducherry',
    region: 'South India',
    coordinates: { lat: 11.9416, lng: 79.8083 },
    emoji: '🥐',
    themeColor: 'from-rose-500/20 to-amber-500/20 border-rose-500/30 text-rose-800 dark:text-rose-300',
    popularCities: ['White Town (French Quarter)', 'Auroville', 'Promenade Beach', 'Paradise Beach'],
    description: 'French colonial quarter with mustard villas, tranquil Promenade Beach, and the universal township of Auroville.'
  }
];

export const ALL_INDIAN_REGIONS = [...INDIAN_STATES, ...INDIAN_UNION_TERRITORIES];

export const getIndianRegionByName = (name) => {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  return ALL_INDIAN_REGIONS.find(r => 
    r.name.toLowerCase() === clean || 
    r.code.toLowerCase() === clean ||
    clean.includes(r.name.toLowerCase())
  ) || null;
};
