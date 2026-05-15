// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRAVELMIND â€” SHARED APP LOGIC
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ TRANSLATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const translations = {
  en: {
    'nav.home': 'Home',
    'nav.attractions': 'Attractions',
    'nav.hotels': 'Hotels',
    'nav.restaurants': 'Restaurants',
    'nav.gallery': 'Gallery',
    'nav.tripPlanner': 'Trip Planner',
    'nav.chatbot': 'AI Chatbot',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.account': 'Account',
    'hero.tag': 'ðŸ‡¯ðŸ‡´ Discover Jordan',
    'hero.title': 'Explore the<br /><em>Wonders</em> of<br />Jordan',
    'hero.desc': 'From the rose-red city of Petra to the stunning Wadi Rum desert â€” plan your perfect Jordan adventure with TravelMind.',
    'hero.explore': 'Explore Now',
    'hero.planTrip': 'Plan a Trip',
    'hero.statAttractions': 'Attractions',
    'hero.statHotels': 'Hotels',
    'hero.statRestaurants': 'Restaurants',
    'events.tag': "What's Coming",
    'events.title': 'Upcoming <em>Events</em>',
    'events.desc': "Don't miss Jordan's most exciting cultural festivals and gatherings.",
    'attractions.tag': 'Must Visit',
    'attractions.title': 'Top <em>Attractions</em>',
    'attractions.desc': "Discover Jordan's most iconic landmarks and hidden gems.",
    'cities.tag': 'Explore By City',
    'cities.title': 'Popular <em>Destinations</em>',
    'gallery.tag': 'Visual Journey',
    'gallery.title': 'Jordan in <em>Photos</em>',
    'hotels.homeTag': 'Stay in Comfort',
    'hotels.homeTitle': 'Top <em>Hotels</em>',
    'hotels.homeDesc': 'Find the perfect accommodation for your Jordan adventure.',
    'restaurants.homeTag': 'Taste Jordan',
    'restaurants.homeTitle': 'Top <em>Restaurants</em>',
    'restaurants.homeDesc': 'Savor the best Jordanian cuisine â€” from mansaf to knafeh.',
    'testimonials.tag': 'Traveler Stories',
    'testimonials.title': 'What People <em>Say</em>',
    'why.tag': 'Why TravelMind',
    'why.title': 'Everything You Need to<br /><em>Explore Jordan</em>',
    'tips.tag': 'Travel Smart',
    'tips.title': 'Essential <em>Travel Tips</em>',
    'cta.title': 'Ready to Explore <em>Jordan</em>?',
    'cta.desc': 'Build your perfect itinerary with our smart trip planner. Add attractions, hotels, and restaurants â€” all in one place.',
    'cta.start': 'Start Planning â†’',
    'cta.askAI': 'Ask AI Assistant',
    'newsletter.title': 'Stay in the Loop ðŸ‡¯ðŸ‡´',
    'newsletter.desc': 'Get the latest travel tips, hidden gems, and exclusive deals for Jordan delivered to your inbox.',
    'newsletter.placeholder': 'Enter your email address',
    'newsletter.btn': 'Subscribe',
    'footer.explore': 'Explore',
    'footer.plan': 'Plan',
    'footer.account': 'Account',
    'footer.desc': 'Your ultimate guide to exploring the beautiful Kingdom of Jordan. Discover, plan, and experience Jordan like never before.',
    'footer.rights': 'Â© 2025 TravelMind Jordan. All rights reserved.',
    'footer.made': 'Made with â¤ï¸ for Jordan ðŸ‡¯ðŸ‡´',
    'common.viewAll': 'View All â†’',
    'common.loading': 'Loading...',
    // Page headers
    'hotels.pageTag': 'ðŸ¨ Accommodations',
    'hotels.pageTitle': 'Find Your Perfect <em>Hotel</em>',
    'hotels.pageDesc': 'From luxury resorts by the Dead Sea to budget-friendly stays in Amman â€” discover the best places to stay in Jordan.',
    'attractions.pageTag': 'ðŸ›ï¸ Explore Jordan',
    'attractions.pageTitle': 'Discover <em>Attractions</em>',
    'attractions.pageDesc': "From ancient Petra to the stunning Wadi Rum â€” explore Jordan's top attractions and hidden gems.",
    'restaurants.pageTag': 'ðŸ½ï¸ Dining',
    'restaurants.pageTitle': 'Discover <em>Restaurants</em>',
    'restaurants.pageDesc': 'From traditional Jordanian mansaf to international cuisine â€” find the best dining in Jordan.',
    'tripPlanner.pageTag': 'ðŸ“‹ Plan Your Trip',
    'tripPlanner.pageTitle': 'Your Jordan <em>Trip Planner</em>',
    'tripPlanner.pageDesc': 'Create, manage and track your Jordan trips â€” all in one place.',
    'chatbot.sidebarTitle': 'Quick Questions',
    'chatbot.clearBtn': 'ðŸ—‘ï¸ Clear Chat',
    'chatbot.inputPlaceholder': 'Ask me anything about Jordan...',
    'chatbot.inputHint': 'Press Enter to send â€¢ Shift+Enter for new line',
  },
  ar: {
    'nav.home': '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    'nav.attractions': '\u0627\u0644\u0645\u0639\u0627\u0644\u0645 \u0627\u0644\u0633\u064a\u0627\u062d\u064a\u0629',
    'nav.hotels': '\u0627\u0644\u0641\u0646\u0627\u062f\u0642',
    'nav.restaurants': '\u0627\u0644\u0645\u0637\u0627\u0639\u0645',
    'nav.gallery': '\u0627\u0644\u0645\u0639\u0631\u0636',
    'nav.tripPlanner': '\u0645\u062e\u0637\u0637 \u0627\u0644\u0631\u062d\u0644\u0627\u062a',
    'nav.chatbot': '\u0627\u0644\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0630\u0643\u064a',
    'nav.login': '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644',
    'nav.register': '\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628',
    'nav.logout': '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c',
    'nav.account': '\u0627\u0644\u062d\u0633\u0627\u0628',
    'hero.tag': 'ðŸ‡¯ðŸ‡´ Ø§ÙƒØªØ´Ù Ø§Ù„Ø£Ø±Ø¯Ù†',
    'hero.title': 'Ø§Ø³ØªÙƒØ´Ù<br /><em>Ø¹Ø¬Ø§Ø¦Ø¨</em><br />Ø§Ù„Ø£Ø±Ø¯Ù†',
    'hero.desc': 'Ù…Ù† Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„Ø¨ØªØ±Ø§Ø¡ Ø§Ù„ÙˆØ±Ø¯ÙŠØ© Ø¥Ù„Ù‰ ØµØ­Ø±Ø§Ø¡ ÙˆØ§Ø¯ÙŠ Ø±Ù… Ø§Ù„Ø³Ø§Ø­Ø±Ø© â€” Ø®Ø·Ø· Ù„Ù…ØºØ§Ù…Ø±ØªÙƒ Ø§Ù„Ù…Ø«Ø§Ù„ÙŠØ© ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù† Ù…Ø¹ TravelMind.',
    'hero.explore': 'Ø§Ø³ØªÙƒØ´Ù Ø§Ù„Ø¢Ù†',
    'hero.planTrip': 'Ø®Ø·Ø· Ù„Ø±Ø­Ù„ØªÙƒ',
    'hero.statAttractions': 'Ù…Ø¹Ø§Ù„Ù… Ø³ÙŠØ§Ø­ÙŠØ©',
    'hero.statHotels': 'ÙÙ†Ø§Ø¯Ù‚',
    'hero.statRestaurants': 'Ù…Ø·Ø§Ø¹Ù…',
    'events.tag': 'Ù‚Ø§Ø¯Ù… Ù‚Ø±ÙŠØ¨Ø§Ù‹',
    'events.title': 'Ø§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª <em>Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©</em>',
    'events.desc': 'Ù„Ø§ ØªÙÙˆØª Ø£Ù‡Ù… Ø§Ù„Ù…Ù‡Ø±Ø¬Ø§Ù†Ø§Øª ÙˆØ§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª Ø§Ù„Ø«Ù‚Ø§ÙÙŠØ© ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù†.',
    'attractions.tag': 'ÙŠØ¬Ø¨ Ø²ÙŠØ§Ø±ØªÙ‡Ø§',
    'attractions.title': 'Ø£ÙØ¶Ù„ <em>Ø§Ù„Ù…Ø¹Ø§Ù„Ù… Ø§Ù„Ø³ÙŠØ§Ø­ÙŠØ©</em>',
    'attractions.desc': 'Ø§ÙƒØªØ´Ù Ø£Ø´Ù‡Ø± Ù…Ø¹Ø§Ù„Ù… Ø§Ù„Ø£Ø±Ø¯Ù† ÙˆØ§Ù„Ø¬ÙˆØ§Ù‡Ø± Ø§Ù„Ø®ÙÙŠØ©.',
    'cities.tag': 'Ø§Ø³ØªÙƒØ´Ù Ø­Ø³Ø¨ Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©',
    'cities.title': 'Ø§Ù„ÙˆØ¬Ù‡Ø§Øª <em>Ø§Ù„Ø´Ø§Ø¦Ø¹Ø©</em>',
    'gallery.tag': 'Ø±Ø­Ù„Ø© Ø¨ØµØ±ÙŠØ©',
    'gallery.title': 'Ø§Ù„Ø£Ø±Ø¯Ù† ÙÙŠ <em>ØµÙˆØ±</em>',
    'hotels.homeTag': 'Ø¥Ù‚Ø§Ù…Ø© Ù…Ø±ÙŠØ­Ø©',
    'hotels.homeTitle': 'Ø£ÙØ¶Ù„ <em>Ø§Ù„ÙÙ†Ø§Ø¯Ù‚</em>',
    'hotels.homeDesc': 'Ø§Ø¹Ø«Ø± Ø¹Ù„Ù‰ Ø§Ù„Ø¥Ù‚Ø§Ù…Ø© Ø§Ù„Ù…Ø«Ø§Ù„ÙŠØ© Ù„Ù…ØºØ§Ù…Ø±ØªÙƒ ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù†.',
    'restaurants.homeTag': 'ØªØ°ÙˆÙ‚ Ø§Ù„Ø£Ø±Ø¯Ù†',
    'restaurants.homeTitle': 'Ø£ÙØ¶Ù„ <em>Ø§Ù„Ù…Ø·Ø§Ø¹Ù…</em>',
    'restaurants.homeDesc': 'Ø§Ø³ØªÙ…ØªØ¹ Ø¨Ø£ÙØ¶Ù„ Ø§Ù„Ù…Ø£ÙƒÙˆÙ„Ø§Øª Ø§Ù„Ø£Ø±Ø¯Ù†ÙŠØ© â€” Ù…Ù† Ø§Ù„Ù…Ù†Ø³Ù Ø¥Ù„Ù‰ Ø§Ù„ÙƒÙ†Ø§ÙØ©.',
    'testimonials.tag': 'Ù‚ØµØµ Ø§Ù„Ù…Ø³Ø§ÙØ±ÙŠÙ†',
    'testimonials.title': 'Ù…Ø§Ø°Ø§ ÙŠÙ‚ÙˆÙ„ <em>Ø§Ù„Ù†Ø§Ø³</em>',
    'why.tag': 'Ù„Ù…Ø§Ø°Ø§ TravelMind',
    'why.title': 'ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡<br /><em>Ù„Ø§Ø³ØªÙƒØ´Ø§Ù Ø§Ù„Ø£Ø±Ø¯Ù†</em>',
    'tips.tag': 'Ø³Ø§ÙØ± Ø¨Ø°ÙƒØ§Ø¡',
    'tips.title': 'Ù†ØµØ§Ø¦Ø­ <em>Ø³ÙØ± Ø£Ø³Ø§Ø³ÙŠØ©</em>',
    'cta.title': 'Ù…Ø³ØªØ¹Ø¯ Ù„Ø§Ø³ØªÙƒØ´Ø§Ù <em>Ø§Ù„Ø£Ø±Ø¯Ù†</em>ØŸ',
    'cta.desc': 'Ø£Ù†Ø´Ø¦ Ø®Ø· Ø³ÙŠØ± Ø±Ø­Ù„ØªÙƒ Ø§Ù„Ù…Ø«Ø§Ù„ÙŠ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù…Ø®Ø·Ø· Ø§Ù„Ø±Ø­Ù„Ø§Øª Ø§Ù„Ø°ÙƒÙŠ. Ø£Ø¶Ù Ø§Ù„Ù…Ø¹Ø§Ù„Ù… Ø§Ù„Ø³ÙŠØ§Ø­ÙŠØ© ÙˆØ§Ù„ÙÙ†Ø§Ø¯Ù‚ ÙˆØ§Ù„Ù…Ø·Ø§Ø¹Ù… â€” ÙƒÙ„ Ø°Ù„Ùƒ ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯.',
    'cta.start': 'â† Ø§Ø¨Ø¯Ø£ Ø§Ù„ØªØ®Ø·ÙŠØ·',
    'cta.askAI': 'Ø§Ø³Ø£Ù„ Ø§Ù„Ù…Ø³Ø§Ø¹Ø¯ Ø§Ù„Ø°ÙƒÙŠ',
    'newsletter.title': 'Ø§Ø¨Ù‚ÙŽ Ø¹Ù„Ù‰ Ø§Ø·Ù„Ø§Ø¹ ðŸ‡¯ðŸ‡´',
    'newsletter.desc': 'Ø§Ø­ØµÙ„ Ø¹Ù„Ù‰ Ø£Ø­Ø¯Ø« Ù†ØµØ§Ø¦Ø­ Ø§Ù„Ø³ÙØ± ÙˆØ§Ù„Ø¬ÙˆØ§Ù‡Ø± Ø§Ù„Ø®ÙÙŠØ© ÙˆØ§Ù„Ø¹Ø±ÙˆØ¶ Ø§Ù„Ø­ØµØ±ÙŠØ© Ù„Ù„Ø£Ø±Ø¯Ù†.',
    'newsletter.placeholder': 'Ø£Ø¯Ø®Ù„ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ',
    'newsletter.btn': 'Ø§Ø´ØªØ±Ùƒ',
    'footer.explore': 'Ø§Ø³ØªÙƒØ´Ù',
    'footer.plan': 'ØªØ®Ø·ÙŠØ·',
    'footer.account': 'Ø§Ù„Ø­Ø³Ø§Ø¨',
    'footer.desc': 'Ø¯Ù„ÙŠÙ„Ùƒ Ø§Ù„Ø´Ø§Ù…Ù„ Ù„Ø§Ø³ØªÙƒØ´Ø§Ù Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø£Ø±Ø¯Ù†ÙŠØ© Ø§Ù„Ù‡Ø§Ø´Ù…ÙŠØ© Ø§Ù„Ø¬Ù…ÙŠÙ„Ø©. Ø§ÙƒØªØ´ÙØŒ Ø®Ø·Ø·ØŒ ÙˆØ¹Ø´ Ø§Ù„ØªØ¬Ø±Ø¨Ø©.',
    'footer.rights': 'Â© 2025 TravelMind Ø§Ù„Ø£Ø±Ø¯Ù†. Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ‚ Ù…Ø­ÙÙˆØ¸Ø©.',
    'footer.made': 'ØµÙ†Ø¹ Ø¨Ù€ â¤ï¸ Ù„Ù„Ø£Ø±Ø¯Ù† ðŸ‡¯ðŸ‡´',
    'common.viewAll': 'â† Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„',
    'common.loading': 'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„...',
    'hotels.pageTag': 'ðŸ¨ Ø£Ù…Ø§ÙƒÙ† Ø§Ù„Ø¥Ù‚Ø§Ù…Ø©',
    'hotels.pageTitle': 'Ø§Ø¹Ø«Ø± Ø¹Ù„Ù‰ <em>ÙÙ†Ø¯Ù‚Ùƒ</em> Ø§Ù„Ù…Ø«Ø§Ù„ÙŠ',
    'hotels.pageDesc': 'Ù…Ù† Ø§Ù„Ù…Ù†ØªØ¬Ø¹Ø§Øª Ø§Ù„ÙØ§Ø®Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ù…ÙŠØª Ø¥Ù„Ù‰ Ø§Ù„Ø¥Ù‚Ø§Ù…Ø© Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯ÙŠØ© ÙÙŠ Ø¹Ù…Ø§Ù† â€” Ø§ÙƒØªØ´Ù Ø£ÙØ¶Ù„ Ø£Ù…Ø§ÙƒÙ† Ø§Ù„Ø¥Ù‚Ø§Ù…Ø© ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù†.',
    'attractions.pageTag': 'ðŸ›ï¸ Ø§Ø³ØªÙƒØ´Ù Ø§Ù„Ø£Ø±Ø¯Ù†',
    'attractions.pageTitle': 'Ø§ÙƒØªØ´Ù <em>Ø§Ù„Ù…Ø¹Ø§Ù„Ù… Ø§Ù„Ø³ÙŠØ§Ø­ÙŠØ©</em>',
    'attractions.pageDesc': 'Ù…Ù† Ø§Ù„Ø¨ØªØ±Ø§Ø¡ Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ø¥Ù„Ù‰ ÙˆØ§Ø¯ÙŠ Ø±Ù… Ø§Ù„Ø³Ø§Ø­Ø± â€” Ø§Ø³ØªÙƒØ´Ù Ø£ÙØ¶Ù„ Ø§Ù„Ù…Ø¹Ø§Ù„Ù… Ø§Ù„Ø³ÙŠØ§Ø­ÙŠØ© ÙˆØ§Ù„Ø¬ÙˆØ§Ù‡Ø± Ø§Ù„Ø®ÙÙŠØ© ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù†.',
    'restaurants.pageTag': 'ðŸ½ï¸ ØªÙ†Ø§ÙˆÙ„ Ø§Ù„Ø·Ø¹Ø§Ù…',
    'restaurants.pageTitle': 'Ø§ÙƒØªØ´Ù <em>Ø§Ù„Ù…Ø·Ø§Ø¹Ù…</em>',
    'restaurants.pageDesc': 'Ù…Ù† Ø§Ù„Ù…Ù†Ø³Ù Ø§Ù„Ø£Ø±Ø¯Ù†ÙŠ Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠ Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø£ÙƒÙˆÙ„Ø§Øª Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© â€” Ø§Ø¹Ø«Ø± Ø¹Ù„Ù‰ Ø£ÙØ¶Ù„ Ø§Ù„Ù…Ø·Ø§Ø¹Ù… ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù†.',
    'tripPlanner.pageTag': 'ðŸ“‹ Ø®Ø·Ø· Ù„Ø±Ø­Ù„ØªÙƒ',
    'tripPlanner.pageTitle': 'Ù…Ø®Ø·Ø· <em>Ø±Ø­Ù„Ø§ØªÙƒ</em> ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù†',
    'tripPlanner.pageDesc': 'Ø£Ù†Ø´Ø¦ ÙˆØ£Ø¯Ø± ÙˆØªØ§Ø¨Ø¹ Ø±Ø­Ù„Ø§ØªÙƒ ÙÙŠ Ø§Ù„Ø£Ø±Ø¯Ù† â€” ÙƒÙ„ Ø°Ù„Ùƒ ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯.',
    'chatbot.sidebarTitle': 'Ø£Ø³Ø¦Ù„Ø© Ø³Ø±ÙŠØ¹Ø©',
    'chatbot.clearBtn': 'ðŸ—‘ï¸ Ù…Ø³Ø­ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©',
    'chatbot.inputPlaceholder': 'Ø§Ø³Ø£Ù„Ù†ÙŠ Ø£ÙŠ Ø´ÙŠØ¡ Ø¹Ù† Ø§Ù„Ø£Ø±Ø¯Ù†...',
    'chatbot.inputHint': 'Ø§Ø¶ØºØ· Enter Ù„Ù„Ø¥Ø±Ø³Ø§Ù„ â€¢ Shift+Enter Ù„Ø³Ø·Ø± Ø¬Ø¯ÙŠØ¯',
  }
};

// â”€â”€ LANGUAGE TOGGLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getCurrentLang() {
  return localStorage.getItem('tm_lang') || 'en';
}

function toggleLanguage() {
  const current = getCurrentLang();
  const newLang = current === 'en' ? 'ar' : 'en';
  localStorage.setItem('tm_lang', newLang);
  applyLanguage(newLang);
}

function applyLanguage(lang) {
  const t = translations[lang];

  // Update lang button label
  const langLabel = document.getElementById('lang-label');
  if (langLabel) {
    langLabel.textContent = lang === 'en' ? '\u0639\u0631\u0628\u064a' : 'EN';
  }

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.innerHTML = t[key];
    }
  });

  // Update data-i18n-placeholder elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });

  // Update direction and lang attribute
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';
}

let lastScrollY = 0;
let scrollThreshold = 50;

window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const currentScrollY = window.scrollY;

  navbar.classList.toggle('scrolled', currentScrollY > 20);

  if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
    navbar.classList.add('navbar-hidden');
  } else {
    navbar.classList.remove('navbar-hidden');
  }

  lastScrollY = currentScrollY;
});

function getUser() {
  const user = localStorage.getItem('tm_user');
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!localStorage.getItem('tm_token');
}

function logout() {
  localStorage.removeItem('tm_token');
  localStorage.removeItem('tm_user');
  location.href = 'index.html';
}

function updateNavbar() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = getUser();
  if (user) {
    const lang = getCurrentLang();
    const t = translations[lang];
    navActions.innerHTML = `
      <button class="btn-lang" onclick="toggleLanguage()" title="Switch Language">
        <span id="lang-label">${lang === 'en' ? '\u0639\u0631\u0628\u064a' : 'EN'}</span>
      </button>
      <span class="nav-user-name">${user.name}</span>
      <button class="btn btn-outline btn-sm" onclick="location.href='account.html'">${t['nav.account'] || 'Account'}</button>
      <button class="btn btn-ghost btn-sm" onclick="logout()" data-i18n="nav.logout">${t['nav.logout']}</button>
    `;
  }
}

// â”€â”€ TOAST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '[OK]', error: '[X]', info: '[i]' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// â”€â”€ STAR RATING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderStars(rating) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return 'â˜…'.repeat(full) + 'â˜†'.repeat(empty);
}

// â”€â”€ RENDER ATTRACTION CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderAttractionCard(a) {
  return `
    <div class="card" onclick="location.href='attractions.html?id=${a.id}'">
      <div class="card-image-placeholder">ðŸ›ï¸</div>
      <div class="card-body">
        <span class="card-tag">Attraction</span>
        <div class="card-title">${a.nameEn}</div>
        <div class="card-desc">${a.city} â€¢ ${a.descriptionEn ? a.descriptionEn.substring(0, 80) + '...' : 'Discover this amazing place'}</div>
      </div>
      <div class="card-footer">
        <div class="card-rating">
          <span class="star">${renderStars(a.rating || 0)}</span>
          ${a.rating || '0.0'}
        </div>
        <div class="card-price">${a.entryFee > 0 ? a.entryFee + ' JOD' : 'Free'}</div>
      </div>
    </div>
  `;
}

// â”€â”€ RENDER HOTEL CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderHotelCard(h) {
  const stars = 'â­'.repeat(h.stars || 3);
  return `
    <div class="card" onclick="location.href='hotels.html?id=${h.id}'">
      <div class="card-image-placeholder">ðŸ¨</div>
      <div class="card-body">
        <span class="card-tag">${stars}</span>
        <div class="card-title">${h.nameEn}</div>
        <div class="card-desc">${h.city} â€¢ ${h.descriptionEn ? h.descriptionEn.substring(0, 80) + '...' : 'Comfortable stay awaits'}</div>
      </div>
      <div class="card-footer">
        <div class="card-rating">
          <span class="star">${renderStars(h.rating || 0)}</span>
          ${h.rating || '0.0'}
        </div>
        <div class="card-price">${h.pricePerNight} JOD/night</div>
      </div>
    </div>
  `;
}

// â”€â”€ RENDER RESTAURANT CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderRestaurantCard(r) {
  return `
    <div class="card" onclick="location.href='restaurants.html?id=${r.id}'">
      <div class="card-image-placeholder">ðŸ½ï¸</div>
      <div class="card-body">
        <span class="card-tag">${r.cuisine || 'Restaurant'}</span>
        <div class="card-title">${r.nameEn}</div>
        <div class="card-desc">${r.city} â€¢ ${r.descriptionEn ? r.descriptionEn.substring(0, 80) + '...' : 'Great food awaits'}</div>
      </div>
      <div class="card-footer">
        <div class="card-rating">
          <span class="star">${renderStars(r.rating || 0)}</span>
          ${r.rating || '0.0'}
        </div>
        <div class="card-price">${r.priceRange || '$$'}</div>
      </div>
    </div>
  `;
}

// â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  applyLanguage(getCurrentLang());
});
