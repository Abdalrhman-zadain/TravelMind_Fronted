const STORY_DESTINATIONS = [
  { id: "petra", name: "Petra" },
  { id: "amman", name: "Amman" },
  { id: "wadi-rum", name: "Wadi Rum" },
  { id: "aqaba", name: "Aqaba" },
  { id: "dead-sea", name: "Dead Sea" },
  { id: "jerash", name: "Jerash" },
];

const TRAVELER_STORIES = [
  {
    id: 1001,
    userId: 21,
    title: "Sunrise paths through Petra",
    destination: "Petra",
    destinationSlug: "petra",
    description: "A two-day Petra story with sunrise entry, family-friendly pacing, and a final candlelit walk through the Siq.",
    storyText: "We arrived before sunrise, took the Siq at a relaxed pace, and built the trip around short walks, local storytelling, and one unforgettable Petra by Night session.",
    userName: "Sofia Bennett",
    sponsorCompanyName: "Jordan Trails Co.",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "image/city/petra-world-heritage-jordan_16x9.avif",
    coverImage: "image/city/petra-world-heritage-jordan_16x9.avif",
    createdAt: "2026-05-18T10:15:00.000Z",
    updatedAt: "2026-05-18T10:15:00.000Z",
    viewsCount: 184,
    isActive: true,
    mediaType: "video",
  },
  {
    id: 1002,
    userId: 22,
    title: "Wadi Rum campfire nights",
    destination: "Wadi Rum",
    destinationSlug: "wadi-rum",
    description: "Jeep trails, sunset tea, and a quiet desert camp that felt cinematic without going over budget.",
    storyText: "We booked a sunset jeep route, shared tea on the sand, and ended the night under one of the clearest skies we have seen anywhere.",
    userName: "Omar Nasser",
    sponsorCompanyName: "",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "image/city/wadi-rum-bedouin-camp-travel.webp",
    coverImage: "image/city/wadi-rum-bedouin-camp-travel.webp",
    createdAt: "2026-05-22T16:40:00.000Z",
    updatedAt: "2026-05-22T16:40:00.000Z",
    viewsCount: 246,
    isActive: true,
    mediaType: "video",
  },
  {
    id: 1003,
    userId: 23,
    title: "Dead Sea reset weekend",
    destination: "Dead Sea",
    destinationSlug: "dead-sea",
    description: "A gentle wellness weekend with sunrise floating, spa time, and slow evenings by the water.",
    storyText: "This trip was all about recovery after a busy work month. We kept the agenda light and focused on one spa session, two sea floats, and sunset dinners.",
    userName: "Camila Ortega",
    sponsorCompanyName: "Salt & Sun Retreats",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    thumbnailUrl: "image/city/deadsea.jpg",
    coverImage: "image/city/deadsea.jpg",
    createdAt: "2026-05-26T08:05:00.000Z",
    updatedAt: "2026-05-26T08:05:00.000Z",
    viewsCount: 132,
    isActive: true,
    mediaType: "video",
  },
  {
    id: 1004,
    userId: 24,
    title: "Amman food crawl in 48 hours",
    destination: "Amman",
    destinationSlug: "amman",
    description: "Rooftops, old downtown, and a long weekend built almost entirely around food and culture.",
    storyText: "We centered the weekend on downtown Amman, the Citadel, Rainbow Street, and a half-day local food crawl that completely changed how we saw the city.",
    userName: "Noah Fischer",
    sponsorCompanyName: "",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: "image/city/New_Abdali_2024.png",
    coverImage: "image/city/New_Abdali_2024.png",
    createdAt: "2026-05-28T13:20:00.000Z",
    updatedAt: "2026-05-28T13:20:00.000Z",
    viewsCount: 95,
    isActive: true,
    mediaType: "video",
  },
];

function findStoriesByDestination(destination) {
  const normalized = String(destination || "").trim().toLowerCase();
  return TRAVELER_STORIES.filter((story) => {
    return String(story.destinationSlug || "").toLowerCase() === normalized
      || String(story.destination || "").toLowerCase() === normalized;
  });
}

window.TRAVELER_STORIES = TRAVELER_STORIES;
window.TRAVEL_STORY_DESTINATIONS = STORY_DESTINATIONS;
window.findStoriesByDestination = findStoriesByDestination;
