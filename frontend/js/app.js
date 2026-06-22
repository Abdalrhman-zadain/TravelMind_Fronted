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
    'nav.chatbot': 'TravelAI',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.account': 'Account',
    'hero.tag': 'Discover Jordan',
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
    'newsletter.title': 'Stay in the Loop',
    'newsletter.desc': 'Get the latest travel tips, hidden gems, and exclusive deals for Jordan delivered to your inbox.',
    'newsletter.placeholder': 'Enter your email address',
    'newsletter.btn': 'Subscribe',
    'footer.explore': 'Explore',
    'footer.plan': 'Plan',
    'footer.account': 'Account',
    'footer.desc': 'Your ultimate guide to exploring the beautiful Kingdom of Jordan. Discover, plan, and experience Jordan like never before.',
    'footer.rights': '© 2025 TravelMind Jordan. All rights reserved.',
    'footer.made': 'Made with love for Jordan',
    'common.viewAll': 'View All ->',
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
    'hero.tag': '\u0627\u0643\u062a\u0634\u0641 \u0627\u0644\u0623\u0631\u062f\u0646',
    'hero.title': '\u0627\u0633\u062a\u0643\u0634\u0641<br /><em>\u0639\u062c\u0627\u0626\u0628</em><br />\u0627\u0644\u0623\u0631\u062f\u0646',
    'hero.desc': '\u0645\u0646 \u0645\u062f\u064a\u0646\u0629 \u0627\u0644\u0628\u062a\u0631\u0627\u0621 \u0627\u0644\u0648\u0631\u062f\u064a\u0629 \u0625\u0644\u0649 \u0635\u062d\u0631\u0627\u0621 \u0648\u0627\u062f\u064a \u0631\u0645 \u0627\u0644\u0633\u0627\u062d\u0631\u0629\u060c \u062e\u0637\u0637 \u0645\u063a\u0627\u0645\u0631\u062a\u0643 \u0627\u0644\u0645\u062b\u0627\u0644\u064a\u0629 \u0641\u064a \u0627\u0644\u0623\u0631\u062f\u0646 \u0645\u0639 TravelMind.',
    'hero.explore': '\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0622\u0646',
    'hero.planTrip': '\u062e\u0637\u0637 \u0644\u0631\u062d\u0644\u062a\u0643',
    'hero.statAttractions': '\u0645\u0639\u0627\u0644\u0645 \u0633\u064a\u0627\u062d\u064a\u0629',
    'hero.statHotels': '\u0641\u0646\u0627\u062f\u0642',
    'hero.statRestaurants': '\u0645\u0637\u0627\u0639\u0645',
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
    'newsletter.title': 'ابقَ على اطلاع',
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
Object.assign(translations.en, {
  'hero.desc': 'From the rose-red city of Petra to the stunning Wadi Rum desert, plan your perfect Jordan adventure with TravelMind.',
  'restaurants.homeDesc': 'Savor the best Jordanian cuisine, from mansaf to knafeh.',
  'cta.desc': 'Build your perfect itinerary with our smart trip planner. Add attractions, hotels, and restaurants all in one place.',
  'cta.start': 'Start Planning ->',
  'footer.rights': 'Copyright 2025 TravelMind Jordan. All rights reserved.',
  'hotels.pageTag': 'Accommodations',
  'hotels.pageDesc': 'From luxury resorts by the Dead Sea to budget-friendly stays in Amman, discover the best places to stay in Jordan.',
  'attractions.pageTag': 'Explore Jordan',
  'attractions.pageDesc': "From ancient Petra to the stunning Wadi Rum, explore Jordan's top attractions and hidden gems.",
  'restaurants.pageTag': 'Dining',
  'restaurants.pageDesc': 'From traditional Jordanian mansaf to international cuisine, find the best dining in Jordan.',
  'tripPlanner.pageTag': 'Plan Your Trip',
  'tripPlanner.pageDesc': 'Create, manage and track your Jordan trips all in one place.',
  'chatbot.clearBtn': 'Clear Chat',
  'chatbot.inputHint': 'Press Enter to send - Shift+Enter for new line',
});

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

const CHECKOUT_DRAFT_KEY = 'tm_checkout_draft_v1';
const STORY_PREFILL_KEY = 'tm_story_trip_prefill_v1';

function readAppJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeAppJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveCheckoutDraft(draft) {
  const payload = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  writeAppJson(CHECKOUT_DRAFT_KEY, payload);
  return payload;
}

function getCheckoutDraft() {
  return readAppJson(CHECKOUT_DRAFT_KEY, null);
}

function clearCheckoutDraft() {
  localStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

function getAuthRedirectTarget(fallback = 'index.html') {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (!redirect) return fallback;
  return redirect;
}

function startCheckoutFlow(draft) {
  saveCheckoutDraft(draft);
  if (isLoggedIn()) {
    location.href = 'checkout.html';
    return;
  }
  location.href = `auth.html?redirect=${encodeURIComponent('checkout.html')}&context=${encodeURIComponent(draft?.itemTitle || 'your booking')}`;
}

function saveStoryTripPrefill(payload) {
  writeAppJson(STORY_PREFILL_KEY, {
    ...payload,
    updatedAt: new Date().toISOString(),
  });
}

function getStoryTripPrefill() {
  return readAppJson(STORY_PREFILL_KEY, null);
}

function clearStoryTripPrefill() {
  localStorage.removeItem(STORY_PREFILL_KEY);
}

function updateNavbar() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = getUser();
  if (user) {
    const lang = getCurrentLang();
    const t = translations[lang];

    // Add Admin link if user is admin
    const adminLink = user.role === 'ADMIN' ? `<a href="admin.html" class="nav-admin-link" style="color: inherit; text-decoration: none;"><button class="btn btn-warning btn-sm">👨‍💼 Admin</button></a>` : '';

    navActions.innerHTML = `
      ${adminLink}
      <span class="nav-user-name">${user.name}</span>
      <button class="btn btn-outline btn-sm" onclick="location.href='account.html'">${t['nav.account'] || 'Account'}</button>
      <button class="btn btn-ghost btn-sm" onclick="logout()" data-i18n="nav.logout">${t['nav.logout']}</button>
    `;
  }
}

function ensureCommunityNavLink() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks || navLinks.querySelector('[data-nav-community]')) return;

  const communityItem = document.createElement('li');
  const communityLink = document.createElement('a');
  const currentPath = window.location.pathname.toLowerCase();
  communityLink.href = 'community.html';
  communityLink.textContent = 'Community';
  communityLink.setAttribute('data-nav-community', 'true');
  if (currentPath.endsWith('/community') || currentPath.endsWith('/community.html')) {
    communityLink.classList.add('active');
  }
  communityItem.appendChild(communityLink);

  const insertionAnchor = [...navLinks.querySelectorAll('a')].find((link) => /trip planner/i.test(link.textContent));
  if (insertionAnchor?.parentElement) {
    navLinks.insertBefore(communityItem, insertionAnchor.parentElement);
    return;
  }
  navLinks.appendChild(communityItem);
}

function ensureStoriesNavLink() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks || navLinks.querySelector('[data-nav-stories]')) return;

  const storyItem = document.createElement('li');
  const storyLink = document.createElement('a');
  const currentPath = window.location.pathname.toLowerCase();
  storyLink.href = 'stories.html';
  storyLink.textContent = 'Stories';
  storyLink.setAttribute('data-nav-stories', 'true');
  if (currentPath.endsWith('/stories') || currentPath.endsWith('/traveler-stories') || currentPath.endsWith('/stories.html') || currentPath.endsWith('/traveler-stories.html')) {
    storyLink.classList.add('active');
  }
  storyItem.appendChild(storyLink);

  const insertionAnchor = [...navLinks.querySelectorAll('a')].find((link) => /trip planner/i.test(link.textContent));
  if (insertionAnchor?.parentElement) {
    navLinks.insertBefore(storyItem, insertionAnchor.parentElement);
    return;
  }
  navLinks.appendChild(storyItem);
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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function attractionCardImage(a) {
  return a.photoUrl || a.photo_url || a.imageUrl || a.image || "";
}

function hotelCardImage(h) {
  const city = String(h?.city || "").toLowerCase();
  let fallback = "image/city/New_Abdali_2024.png";
  if (city.includes("petra") || city.includes("wadi musa")) fallback = "image/city/petra-world-heritage-jordan_16x9.avif";
  else if (city.includes("aqaba")) fallback = "image/city/Aqaba_Red_Sea_Jordan_Canva-1.webp";
  else if (city.includes("dead sea")) fallback = "image/city/deadsea.jpg";
  else if (city.includes("wadi")) fallback = "image/city/wadi-rum-bedouin-camp-travel.webp";
  else if (city.includes("jerash") || city.includes("ajloun") || city.includes("umm qais")) fallback = "image/city/sites-jerash.jpg";
  return h.imageUrl || h.image || h.photoUrl || h.photo_url || fallback;
}

const restaurantFallbackImages = [
  "image/restaurant in jordan/restaurants in jordan/restaurants  (1).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (2).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (3).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (4).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (5).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (6).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (7).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (8).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (9).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (10).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (11).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (12).jpg",
];

function restaurantFallbackImage(seed) {
  const value = String(seed ?? "");
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return restaurantFallbackImages[Math.abs(hash) % restaurantFallbackImages.length];
}

function restaurantCardImage(r) {
  return r.photoUrl || r.photo_url || r.imageUrl || r.image || restaurantFallbackImage(r.id || r.nameEn || r.city || "restaurant");
}

// â”€â”€ STAR RATING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderStars(rating) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return "\u2605".repeat(full) + "\u2606".repeat(empty);
}

// â”€â”€ RENDER ATTRACTION CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderAttractionCard(a) {
  const image = attractionCardImage(a);
  return `
    <div class="card" onclick="location.href='attractions.html?id=${a.id}'">
      ${image
        ? `<img class="card-image" src="${escapeHtml(image)}" alt="${escapeHtml(a.nameEn || 'Attraction')}" loading="lazy" />`
        : `<div class="card-image-placeholder">&#127963;&#65039;</div>`}
      <div class="card-body">
        <span class="card-tag">Attraction</span>
        <div class="card-title">${a.nameEn}</div>
        <div class="card-desc">${a.city} &middot; ${a.descriptionEn ? a.descriptionEn.substring(0, 80) + '...' : 'Discover this amazing place'}</div>
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
function fallbackHotelPricePerNight(h) {
  const stars = Number(h?.stars || 0);
  if (stars >= 5) return 180;
  if (stars >= 4) return 140;
  if (stars >= 3) return 95;
  if (stars >= 2) return 70;
  return 55;
}

function renderHotelCard(h) {
  const stars = "\u2B50".repeat(h.stars || 3);
  const image = hotelCardImage(h);
  const nightlyPrice = Number(h.pricePerNight || 0) > 0 ? Number(h.pricePerNight) : fallbackHotelPricePerNight(h);
  return `
    <div class="card" onclick="location.href='hotels.html?id=${h.id}'">
      ${image
        ? `<img class="card-image" src="${escapeHtml(image)}" alt="${escapeHtml(h.nameEn || 'Hotel')}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(hotelCardImage(h))}'" />`
        : `<div class="card-image-placeholder">&#127970;</div>`}
      <div class="card-body">
        <span class="card-tag">${stars}</span>
        <div class="card-title">${h.nameEn}</div>
        <div class="card-desc">${h.city} &middot; ${h.descriptionEn ? h.descriptionEn.substring(0, 80) + '...' : 'Comfortable stay awaits'}</div>
        ${h.nameAr ? `<div class="card-desc" dir="rtl">${escapeHtml(h.nameAr)}</div>` : ''}
      </div>
      <div class="card-footer">
        <div class="card-rating">
          <span class="star">${renderStars(h.rating || 0)}</span>
          ${h.rating || '0.0'}
        </div>
        <div class="card-price">${nightlyPrice} JOD/night</div>
      </div>
    </div>
  `;
}

// â”€â”€ RENDER RESTAURANT CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderRestaurantCard(r) {
  const image = restaurantCardImage(r);
  return `
    <div class="card" onclick="location.href='restaurants.html?id=${r.id}'">
      ${image
        ? `<img class="card-image" src="${escapeHtml(image)}" alt="${escapeHtml(r.nameEn || 'Restaurant')}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(restaurantFallbackImage(r.id || r.nameEn || r.city || 'restaurant'))}'" />`
        : `<div class="card-image-placeholder">&#127869;&#65039;</div>`}
      <div class="card-body">
        <span class="card-tag">${r.cuisine || 'Restaurant'}</span>
        <div class="card-title">${r.nameEn}</div>
        <div class="card-desc">${r.city} &middot; ${r.descriptionEn ? r.descriptionEn.substring(0, 80) + '...' : 'Great food awaits'}</div>
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

let globalChatbotTypingDiv = null;

function ensureGlobalChatbotStyles() {
  if (document.getElementById('global-chatbot-styles')) return;

  const style = document.createElement('style');
  style.id = 'global-chatbot-styles';
  style.textContent = `
    .global-chatbot {
      position: fixed;
      left: 20px;
      bottom: 20px;
      z-index: 10000;
      display: flex;
      width: 350px;
      max-width: calc(100% - 40px);
      flex-direction: column;
      overflow: hidden;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      font-family: system-ui, "Segoe UI", sans-serif;
      transition: all 0.3s ease;
    }

    .global-chatbot.collapsed {
      width: auto;
      background: transparent;
      box-shadow: none;
    }

    .global-chatbot.collapsed .global-chatbot-body,
    .global-chatbot.collapsed .global-chatbot-input-area {
      display: none;
    }

    .global-chatbot-header {
      display: flex;
      cursor: pointer;
      align-items: center;
      justify-content: space-between;
      border-radius: 20px 20px 0 0;
      background: #1e3c2c;
      padding: 12px 16px;
      color: #fff;
      font-weight: 700;
    }

    .global-chatbot.collapsed .global-chatbot-header {
      border-radius: 40px;
      padding: 10px 18px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .global-chatbot-toggle {
      font-size: 20px;
      font-weight: 700;
    }

    .global-chatbot-body {
      display: flex;
      height: 350px;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      background: #f9fafb;
      padding: 12px;
    }

    .global-chatbot-message {
      max-width: 85%;
      word-wrap: break-word;
      border-radius: 18px;
      padding: 8px 12px;
      font-size: 14px;
      line-height: 1.4;
    }

    .global-chatbot-message.bot {
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      background: #e9ecef;
      color: #1f2937;
    }

    .global-chatbot-message.user {
      align-self: flex-end;
      border-bottom-right-radius: 4px;
      background: #1e3c2c;
      color: #fff;
    }

    .global-chatbot-input-area {
      display: flex;
      gap: 8px;
      border-top: 1px solid #ddd;
      background: #fff;
      padding: 8px;
    }

    .global-chatbot-input-area input {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 30px;
      outline: none;
      padding: 10px;
      font-size: 14px;
    }

    .global-chatbot-input-area button {
      cursor: pointer;
      border: none;
      border-radius: 30px;
      background: #1e3c2c;
      padding: 0 18px;
      color: #fff;
      font-weight: 700;
    }

    .global-chatbot-typing {
      display: flex;
      width: 60px;
      align-items: center;
      gap: 4px;
      margin: 0;
      border-radius: 18px;
      background: #e9ecef;
      padding: 8px 12px;
    }

    .global-chatbot-typing span {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6c757d;
      animation: global-chatbot-blink 1.4s infinite;
    }

    .global-chatbot-typing span:nth-child(2) { animation-delay: 0.2s; }
    .global-chatbot-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes global-chatbot-blink {
      0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
      30% { opacity: 1; transform: translateY(-4px); }
    }
  `;

  document.head.appendChild(style);
}

function toggleGlobalChatbot(forceOpen = null) {
  const chatbot = document.getElementById('globalChatbot');
  if (!chatbot) return;

  const shouldOpen = forceOpen === null
    ? chatbot.classList.contains('collapsed')
    : forceOpen;

  chatbot.classList.toggle('collapsed', !shouldOpen);

  const toggle = chatbot.querySelector('.global-chatbot-toggle');
  if (toggle) toggle.textContent = shouldOpen ? '-' : '+';

  if (shouldOpen) {
    const input = document.getElementById('globalChatbotInput');
    if (input) input.focus();
  }
}

function addGlobalChatbotMessage(text, sender) {
  const container = document.getElementById('globalChatbotMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `global-chatbot-message ${sender}`;
  div.innerText = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showGlobalChatbotTyping() {
  const container = document.getElementById('globalChatbotMessages');
  if (!container) return;

  globalChatbotTypingDiv = document.createElement('div');
  globalChatbotTypingDiv.className = 'global-chatbot-typing';
  globalChatbotTypingDiv.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(globalChatbotTypingDiv);
  container.scrollTop = container.scrollHeight;
}

function hideGlobalChatbotTyping() {
  if (globalChatbotTypingDiv) {
    globalChatbotTypingDiv.remove();
    globalChatbotTypingDiv = null;
  }
}

async function sendGlobalChatbotMessage() {
  const input = document.getElementById('globalChatbotInput');
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  toggleGlobalChatbot(true);
  addGlobalChatbotMessage(message, 'user');
  input.value = '';
  showGlobalChatbotTyping();

  const history = Array.from(document.querySelectorAll('#globalChatbotMessages .global-chatbot-message')).map((node) => ({
    role: node.classList.contains('user') ? 'user' : 'assistant',
    content: node.innerText.trim()
  })).filter((entry) => entry.content);

  let reply = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!";

  try {
    const data = await ChatAPI.reply({ message, history });
    reply = data?.reply || reply;
  } catch (_error) {
    // Keep fallback reply.
  }

  hideGlobalChatbotTyping();
  addGlobalChatbotMessage(reply, 'bot');
}

function initGlobalChatbot() {
  document.querySelectorAll('.chatbot-box').forEach((node) => node.remove());

  const isAdminPage =
    document.body?.classList.contains('admin-page') ||
    /(^|\/)admin(\.html)?$/i.test(window.location.pathname || '');

  if (isAdminPage) {
    document.getElementById('globalChatbot')?.remove();
    return;
  }

  if (document.getElementById('homeChatbot') || document.getElementById('floatingChatbot') || document.getElementById('globalChatbot')) {
    return;
  }

  ensureGlobalChatbotStyles();

  const widget = document.createElement('div');
  widget.className = 'global-chatbot collapsed';
  widget.id = 'globalChatbot';
  widget.innerHTML = `
    <div class="global-chatbot-header">
      <span>TravelAI</span>
      <span class="global-chatbot-toggle">+</span>
    </div>
    <div class="global-chatbot-body" id="globalChatbotMessages">
      <div class="global-chatbot-message bot">Marhaba! Ask me about Jordan, Petra, Wadi Rum, food, weather, visa, or safety.</div>
    </div>
    <div class="global-chatbot-input-area">
      <input type="text" id="globalChatbotInput" placeholder="Type your question..." />
      <button type="button">Send</button>
    </div>
  `;

  const header = widget.querySelector('.global-chatbot-header');
  const input = widget.querySelector('#globalChatbotInput');
  const button = widget.querySelector('button');

  header.addEventListener('click', () => toggleGlobalChatbot());
  input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') sendGlobalChatbotMessage();
  });
  button.addEventListener('click', sendGlobalChatbotMessage);

  document.body.appendChild(widget);
}

// â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener('DOMContentLoaded', () => {
  ensureCommunityNavLink();
  ensureStoriesNavLink();
  updateNavbar();
  applyLanguage(getCurrentLang());
  initGlobalChatbot();
  // expose current user globally for pages that rely on it
  window.currentUser = getUser();
});
