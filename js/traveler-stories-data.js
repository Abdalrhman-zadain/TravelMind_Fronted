const TRAVELER_STORIES = [
  {
    id: "story-petra-family",
    title: "Two unforgettable days through Petra with kids",
    destination: "Petra",
    destinationSlug: "petra",
    userName: "Sofia Bennett",
    userCountry: "United Kingdom",
    rating: 5,
    mediaType: "image",
    coverImage: "image/city/petra-world-heritage-jordan_16x9.avif",
    estimatedCost: 420,
    durationDays: 2,
    travelers: 4,
    travelInterests: ["Family", "Culture", "History"],
    tags: ["Family", "Culture", "History"],
    description:
      "We slowed the pace down, booked a licensed local guide, and built the trip around short scenic walks, storytelling stops, and one magical candlelit evening.",
    fullExperience:
      "Our family focused on the Siq, the Treasury, a short horseback segment, and one relaxed evening in Wadi Musa. The guide adapted the pace beautifully for children and kept the history engaging without making it feel like a lecture.",
    activities: ["Guided Siq walk", "Treasury viewpoint stop", "Petra by Night", "Local dinner in Wadi Musa"],
    tips: ["Start at sunrise to avoid the midday heat.", "Bring refillable water bottles.", "Choose a family-friendly guide who can pace the route."],
    guide: {
      id: "guide-petra-maya",
      name: "Maya Al-Hadid",
      languages: ["English", "Arabic"],
      rating: 4.9,
      hourlyRate: 28,
      yearsExperience: 8,
    },
  },
  {
    id: "story-wadi-rum-adventure",
    title: "Wadi Rum under the stars on a budget-friendly adventure",
    destination: "Wadi Rum",
    destinationSlug: "wadi-rum",
    userName: "Omar Nasser",
    userCountry: "UAE",
    rating: 5,
    mediaType: "video",
    coverImage: "image/city/wadi-rum-bedouin-camp-travel.webp",
    estimatedCost: 260,
    durationDays: 2,
    travelers: 2,
    travelInterests: ["Adventure", "Nature", "Budget"],
    tags: ["Adventure", "Nature", "Budget"],
    description:
      "A desert trip with jeep rides, sunset tea, and a simple camp stay that felt far more premium than the price suggested.",
    fullExperience:
      "We booked a sunset jeep route, followed it with a campfire dinner, and spent the night in a dome tent. The next morning we added a short camel ride and rock bridge stop before heading back toward Aqaba.",
    activities: ["Jeep safari", "Sunset viewpoint", "Desert camp stay", "Camel ride"],
    tips: ["Pack a layer for the evening.", "Bring cash for small camp extras.", "Book a camp that includes dinner and breakfast."],
    guide: {
      id: "guide-wadi-rum-yousef",
      name: "Yousef Zalabieh",
      languages: ["English", "Arabic", "French"],
      rating: 4.8,
      hourlyRate: 24,
      yearsExperience: 10,
    },
  },
  {
    id: "story-dead-sea-luxury",
    title: "A luxury Dead Sea reset with spa rituals and sunrise swims",
    destination: "Dead Sea",
    destinationSlug: "dead-sea",
    userName: "Camila Ortega",
    userCountry: "Spain",
    rating: 4.8,
    mediaType: "image",
    coverImage: "image/city/deadsea.jpg",
    estimatedCost: 510,
    durationDays: 2,
    travelers: 2,
    travelInterests: ["Luxury", "Relaxation", "Nature"],
    tags: ["Luxury", "Relaxation", "Nature"],
    description:
      "A soft, slow itinerary built around wellness, sea views, and just enough structure to keep everything easy.",
    fullExperience:
      "We paired a premium resort stay with a private transfer, spa access, and a guided sunrise float session. It was ideal after several more active days in Amman and Petra.",
    activities: ["Private transfer", "Spa session", "Sunrise float", "Cliffside dinner"],
    tips: ["Do not shave right before floating.", "Bring sandals for the salt crystals.", "Schedule spa treatments after the float, not before."],
    guide: null,
  },
  {
    id: "story-amman-food-culture",
    title: "A culture and food-focused long weekend in Amman",
    destination: "Amman",
    destinationSlug: "amman",
    userName: "Noah Fischer",
    userCountry: "Germany",
    rating: 4.7,
    mediaType: "image",
    coverImage: "image/city/New_Abdali_2024.png",
    estimatedCost: 340,
    durationDays: 3,
    travelers: 2,
    travelInterests: ["Food", "Culture", "Budget"],
    tags: ["Food", "Culture", "Budget"],
    description:
      "Street food, Roman ruins, café hopping, and just enough downtime to enjoy the rhythm of the city.",
    fullExperience:
      "We centered the itinerary on downtown Amman, the Citadel, Rainbow Street, and a half-day local food crawl with tastings at family-run spots.",
    activities: ["Citadel visit", "Roman Theater", "Food tour", "Rainbow Street evening"],
    tips: ["Reserve your food tour early.", "Use taxis for quick cross-city hops.", "Downtown is best explored on foot in the morning."],
    guide: {
      id: "guide-amman-lina",
      name: "Lina Khoury",
      languages: ["English", "Arabic", "German"],
      rating: 4.9,
      hourlyRate: 26,
      yearsExperience: 7,
    },
  },
];

function findStoriesByDestination(destination) {
  const normalized = String(destination || "").trim().toLowerCase();
  return TRAVELER_STORIES.filter((story) => String(story.destination || "").toLowerCase() === normalized);
}

window.TRAVELER_STORIES = TRAVELER_STORIES;
window.findStoriesByDestination = findStoriesByDestination;
