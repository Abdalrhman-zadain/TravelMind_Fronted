import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_JSON_PATH = path.join(__dirname, "..", "data", "db.json");

function readJsonSeed() {
  const raw = fs.readFileSync(DB_JSON_PATH, "utf8");
  return JSON.parse(raw);
}

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function normalizePasswordHash(rawValue) {
  const value = String(rawValue || "");
  if (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$")) {
    return value;
  }
  return bcrypt.hash(value, 10);
}

async function resetTableSequence(tableName, idColumn = "id") {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${tableName}"', '${idColumn}'), COALESCE(MAX(${idColumn}), 1), MAX(${idColumn}) IS NOT NULL) FROM "${tableName}";`
  );
}

async function main() {
  const seed = readJsonSeed();

  // attempt to clear existing data where tables exist (skip missing tables)
  // NOTE: We skip deleting attractions, hotels, restaurants to preserve restored backup data
  const clearActions = [
    async () => prisma.companyChatMessage.deleteMany(),
    async () => prisma.paymentTransaction.deleteMany(),
    async () => prisma.checkoutOrder.deleteMany(),
    async () => prisma.guideBooking.deleteMany(),
    async () => prisma.travelerStoryInteraction.deleteMany(),
    async () => prisma.travelerStory.deleteMany(),
    async () => prisma.certifiedGuide.deleteMany(),
    async () => prisma.dashboardNotification.deleteMany(),
    async () => prisma.analyticsRecord.deleteMany(),
    async () => prisma.aiTripPlan.deleteMany(),
    async () => prisma.companyBooking.deleteMany(),
    async () => prisma.favorite.deleteMany(),
    async () => prisma.chatMessage.deleteMany(),
    async () => prisma.review.deleteMany(),
    async () => prisma.transport.deleteMany(),
    async () => prisma.package.deleteMany(),
    async () => prisma.tour.deleteMany(),
    async () => prisma.company.deleteMany(),
    async () => prisma.journal.deleteMany(),
    async () => prisma.expense.deleteMany(),
    async () => prisma.trip.deleteMany(),
    // Intentionally skip: category, restaurant, hotel, attraction (preserve backup data)
    async () => prisma.user.deleteMany()
  ];

  for (const action of clearActions) {
    try {
      await action();
    } catch (err) {
      // ignore missing-table errors (Prisma P2021) and continue seeding
      console.warn('Seed: skipping clear action due to error:', err.message || err);
    }
  }

  if (seed.users?.length) {
    const users = await Promise.all(
      seed.users.map(async (u) => ({
        id: u.id,
        name: u.name,
        email: String(u.email || "").toLowerCase(),
        passwordHash: await normalizePasswordHash(u.passwordHash),
        role: u.role || "TRAVELER",
        preferredLanguage: u.preferredLanguage || "en",
        profileImage: u.profileImage || "",
        createdAt: asDate(u.createdAt) || new Date()
      }))
    );

    await prisma.user.createMany({
      data: users
    });
  }

  // Skip categories, attractions, hotels, restaurants - these are preserved from backup restore
  // if (seed.categories?.length) {
  //   await prisma.category.createMany({ data: seed.categories });
  // }

  // if (seed.attractions?.length) {
  //   await prisma.attraction.createMany({ data: seed.attractions });
  // }

  // if (seed.hotels?.length) {
  //   await prisma.hotel.createMany({ data: seed.hotels });
  // }

  // if (seed.restaurants?.length) {
  //   await prisma.restaurant.createMany({ data: seed.restaurants });
  // }

  if (seed.trips?.length) {
    await prisma.trip.createMany({
      data: seed.trips.map((t) => ({
        ...t,
        travelersCount: t.travelersCount || 1,
        travelInterests: Array.isArray(t.travelInterests) ? t.travelInterests : [],
        generatedItinerary: t.generatedItinerary || null,
        estimatedCost: t.estimatedCost ?? null,
        startDate: asDate(t.startDate),
        endDate: asDate(t.endDate),
        createdAt: asDate(t.createdAt) || new Date(),
        updatedAt: asDate(t.updatedAt) || asDate(t.createdAt) || new Date()
      }))
    });
  }

  if (seed.aiTripPlans?.length) {
    await prisma.aiTripPlan.createMany({
      data: seed.aiTripPlans.map((plan) => ({
        id: plan.id,
        userId: plan.userId,
        destination: plan.destination,
        duration: plan.duration,
        budget: plan.budget ?? null,
        travelersCount: plan.travelersCount || 1,
        travelInterests: Array.isArray(plan.travelInterests) ? plan.travelInterests : [],
        generatedItinerary: plan.generatedItinerary || [],
        estimatedCost: plan.estimatedCost ?? null,
        createdAt: asDate(plan.createdAt) || new Date(),
        updatedAt: asDate(plan.updatedAt) || asDate(plan.createdAt) || new Date()
      }))
    });
  }

  if (seed.expenses?.length) {
    await prisma.expense.createMany({
      data: seed.expenses.map((e) => ({
        ...e,
        date: asDate(e.date),
        createdAt: asDate(e.createdAt) || new Date()
      }))
    });
  }

  if (seed.journals?.length) {
    await prisma.journal.createMany({
      data: seed.journals.map((j) => ({
        ...j,
        date: asDate(j.date),
        createdAt: asDate(j.createdAt) || new Date()
      }))
    });
  }

  if (seed.reviews?.length) {
    await prisma.review.createMany({
      data: seed.reviews.map((r) => ({
        ...r,
        createdAt: asDate(r.createdAt) || new Date()
      }))
    });
  }

  if (seed.companies?.length) {
    await prisma.company.createMany({
      data: seed.companies.map((company) => ({
        id: company.id,
        ownerUserId: company.ownerUserId || null,
        slug: company.slug,
        name: company.name,
        logo: company.logo || null,
        heroImage: company.heroImage || null,
        gallery: Array.isArray(company.gallery) ? company.gallery : [],
        tagline: company.tagline || null,
        description: company.description || null,
        longDescription: company.longDescription || null,
        location: company.location || null,
        city: company.city || null,
        country: company.country || null,
        phone: company.phone || null,
        email: company.email || null,
        whatsapp: company.whatsapp || null,
        website: company.website || null,
        foundedYear: company.foundedYear || null,
        latitude: company.latitude || null,
        longitude: company.longitude || null,
        isVerified: Boolean(company.isVerified),
        isLicensed: Boolean(company.isLicensed),
        supportedLanguages: Array.isArray(company.supportedLanguages) ? company.supportedLanguages : [],
        rating: company.rating ?? null,
        reviewsCount: company.reviewsCount || 0,
        badges: Array.isArray(company.badges) ? company.badges : [],
        servicesOffered: Array.isArray(company.servicesOffered) ? company.servicesOffered : [],
        social: company.social || null,
        stats: company.stats || null,
        specialOffer: company.specialOffer || null,
        seo: company.seo || null
      }))
    });
  }

  const companyTours = (seed.companies || []).flatMap((company) =>
    (company.tours || []).map((tour) => ({
      id: tour.id,
      companyId: company.id,
      title: tour.title,
      slug: tour.slug || null,
      summary: tour.summary || null,
      description: tour.description || null,
      image: tour.image || null,
      gallery: Array.isArray(tour.gallery) ? tour.gallery : [],
      duration: tour.duration || null,
      location: tour.location || null,
      meetingPoint: tour.meetingPoint || null,
      minGroupSize: tour.minGroupSize || null,
      maxGroupSize: tour.maxGroupSize || null,
      languages: Array.isArray(tour.languages) ? tour.languages : [],
      price: tour.price ?? null,
      currency: tour.currency || "USD",
      rating: tour.rating ?? null,
      reviewCount: tour.reviewsCount || 0,
      badge: tour.badge || null,
      includedServices: Array.isArray(tour.includedServices) ? tour.includedServices : [],
      excludedServices: Array.isArray(tour.excludedServices) ? tour.excludedServices : [],
      itinerary: Array.isArray(tour.itinerary) ? tour.itinerary : [],
      cancellationPolicy: tour.cancellationPolicy || null,
      isActive: tour.active !== false
    }))
  );
  if (companyTours.length) {
    await prisma.tour.createMany({ data: companyTours });
  }

  const attractionTours = (seed.tours || []).map((tour) => ({
    id: tour.id,
    attractionId: tour.attractionId,
    title: tour.title,
    slug: tour.slug || null,
    summary: tour.summary || null,
    description: tour.description || tour.summary || null,
    image: tour.image || null,
    gallery: Array.isArray(tour.gallery) ? tour.gallery : [],
    duration: tour.duration || null,
    location: tour.location || null,
    meetingPoint: tour.meetingPoint || null,
    minGroupSize: tour.minGroupSize || null,
    maxGroupSize: tour.maxGroupSize || null,
    languages: Array.isArray(tour.languages) ? tour.languages : [],
    price: tour.price ?? null,
    currency: tour.currency || "USD",
    rating: tour.rating ?? null,
    reviewCount: tour.reviewCount || 0,
    badge: tour.badge || null,
    includedServices: Array.isArray(tour.includedServices) ? tour.includedServices : [],
    excludedServices: Array.isArray(tour.excludedServices) ? tour.excludedServices : [],
    itinerary: Array.isArray(tour.itinerary) ? tour.itinerary : [],
    cancellationPolicy: tour.cancellationPolicy || null,
    isActive: tour.active !== false
  }));
  if (attractionTours.length) {
    await prisma.tour.createMany({ data: attractionTours });
  }

  const companyPackages = (seed.companies || []).flatMap((company) =>
    (company.packages || []).map((pkg) => ({
      id: pkg.id,
      companyId: company.id,
      title: pkg.title,
      description: pkg.description || null,
      image: pkg.image || null,
      durationDays: pkg.durationDays || null,
      minGroupSize: pkg.minGroupSize || null,
      maxGroupSize: pkg.maxGroupSize || null,
      hotelIncluded: Boolean(pkg.hotelIncluded),
      price: pkg.price ?? null,
      currency: pkg.currency || "USD",
      itinerary: Array.isArray(pkg.itinerary) ? pkg.itinerary : [],
      isActive: pkg.active !== false
    }))
  );
  const attractionPackages = (seed.packages || []).map((pkg) => ({
    id: pkg.id,
    attractionId: pkg.attractionId,
    title: pkg.title,
    description: pkg.description || null,
    image: pkg.image || null,
    durationDays: pkg.durationDays || null,
    minGroupSize: pkg.minGroupSize || null,
    maxGroupSize: pkg.maxGroupSize || null,
    hotelIncluded: Boolean(pkg.hotelIncluded),
    price: pkg.price ?? null,
    currency: pkg.currency || "USD",
    itinerary: Array.isArray(pkg.itinerary) ? pkg.itinerary : [],
    isActive: pkg.active !== false
  }));
  if (companyPackages.length || attractionPackages.length) {
    await prisma.package.createMany({ data: [...companyPackages, ...attractionPackages] });
  }

  const companyTransport = (seed.companies || []).flatMap((company) =>
    (company.transportServices || []).map((service) => ({
      id: service.id,
      companyId: company.id,
      title: service.title || null,
      provider: service.provider || null,
      description: service.description || null,
      image: service.image || null,
      serviceType: service.serviceType || null,
      price: service.price ?? null,
      currency: service.currency || "USD",
      pickupLocation: service.pickupLocation || null,
      dropOffLocation: service.dropOffLocation || null,
      contact: service.contact || null,
      isActive: service.active !== false
    }))
  );
  const attractionTransport = (seed.transport || []).map((service) => ({
    id: service.id,
    attractionId: service.attractionId,
    title: service.title || null,
    provider: service.provider || null,
    description: service.description || null,
    image: service.image || null,
    serviceType: service.serviceType || null,
    price: service.price ?? null,
    currency: service.currency || "USD",
    pickupLocation: service.pickupLocation || null,
    dropOffLocation: service.dropOffLocation || null,
    contact: service.contact || null,
    isActive: service.active !== false
  }));
  if (companyTransport.length || attractionTransport.length) {
    await prisma.transport.createMany({ data: [...companyTransport, ...attractionTransport] });
  }

  const companyReviews = (seed.companies || []).flatMap((company) =>
    (company.reviews || []).map((review) => ({
      id: review.id,
      userId: review.userId || 1,
      placeType: "company",
      placeId: company.id,
      rating: Math.round(Number(review.rating || 5)),
      comment: review.comment || "",
      createdAt: asDate(review.reviewDate) || new Date()
    }))
  );
  if (companyReviews.length) {
    await prisma.review.createMany({ data: companyReviews });
  }

  if (seed.bookings?.length) {
    await prisma.companyBooking.createMany({
      data: seed.bookings.map((booking) => ({
        id: booking.id,
        companyId: booking.companyId,
        userId: booking.userId || null,
        serviceType: booking.serviceType || null,
        serviceId: booking.serviceId || null,
        bookingDate: asDate(booking.bookingDate) || new Date(),
        travelersCount: booking.travelersCount || 1,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        specialRequests: booking.specialRequests || null,
        totalPrice: booking.totalPrice ?? null,
        currency: booking.currency || "USD",
        paymentMethod: booking.paymentMethod || null,
        paymentStatus: booking.paymentStatus || "Pending",
        bookingStatus: booking.bookingStatus || "Pending",
        createdAt: asDate(booking.createdAt) || new Date(),
        updatedAt: asDate(booking.updatedAt) || new Date()
      }))
    });
  }

  if (seed.certifiedGuides?.length) {
    await prisma.certifiedGuide.createMany({
      data: seed.certifiedGuides.map((guide) => ({
        id: guide.id,
        companyId: guide.companyId || null,
        attractionId: guide.attractionId || null,
        fullName: guide.fullName,
        profilePhoto: guide.profilePhoto || null,
        languages: Array.isArray(guide.languages) ? guide.languages : [],
        yearsExperience: guide.yearsExperience || 0,
        rating: guide.rating ?? null,
        hourlyRate: guide.hourlyRate ?? null,
        isVerified: guide.isVerified !== false,
        isLicensed: guide.isLicensed !== false,
        availability: guide.availability || null,
        destinations: Array.isArray(guide.destinations) ? guide.destinations : [],
        bio: guide.bio || null,
        services: Array.isArray(guide.services) ? guide.services : [],
        createdAt: asDate(guide.createdAt) || new Date(),
        updatedAt: asDate(guide.updatedAt) || asDate(guide.createdAt) || new Date()
      }))
    });
  }

  if (seed.travelerStories?.length) {
    await prisma.travelerStory.createMany({
      data: seed.travelerStories.map((story) => ({
        id: story.id,
        userId: story.userId,
        guideId: story.guideId || null,
        attractionId: story.attractionId || null,
        title: story.title,
        destination: story.destination,
        destinationSlug: story.destinationSlug || null,
        coverImage: story.coverImage || null,
        mediaType: story.mediaType || "image",
        storyText: story.storyText,
        estimatedCost: story.estimatedCost ?? null,
        durationDays: story.durationDays || 1,
        travelersCount: story.travelersCount || 1,
        rating: story.rating ?? null,
        travelInterests: Array.isArray(story.travelInterests) ? story.travelInterests : [],
        tags: Array.isArray(story.tags) ? story.tags : [],
        activities: Array.isArray(story.activities) ? story.activities : [],
        travelTips: Array.isArray(story.travelTips) ? story.travelTips : [],
        createdAt: asDate(story.createdAt) || new Date(),
        updatedAt: asDate(story.updatedAt) || asDate(story.createdAt) || new Date()
      }))
    });
  }

  if (seed.travelerStoryInteractions?.length) {
    await prisma.travelerStoryInteraction.createMany({
      data: seed.travelerStoryInteractions.map((item) => ({
        id: item.id,
        storyId: item.storyId,
        userId: item.userId,
        interactionType: item.interactionType,
        content: item.content || null,
        createdAt: asDate(item.createdAt) || new Date(),
        updatedAt: asDate(item.updatedAt) || asDate(item.createdAt) || new Date()
      }))
    });
  }

  if (seed.guideBookings?.length) {
    await prisma.guideBooking.createMany({
      data: seed.guideBookings.map((booking) => ({
        id: booking.id,
        guideId: booking.guideId,
        userId: booking.userId || null,
        attractionId: booking.attractionId || null,
        bookingDate: asDate(booking.bookingDate) || new Date(),
        travelersCount: booking.travelersCount || 1,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        specialRequests: booking.specialRequests || null,
        totalPrice: booking.totalPrice ?? null,
        currency: booking.currency || "JOD",
        paymentMethod: booking.paymentMethod || null,
        paymentStatus: booking.paymentStatus || "Pending",
        bookingStatus: booking.bookingStatus || "Pending",
        createdAt: asDate(booking.createdAt) || new Date(),
        updatedAt: asDate(booking.updatedAt) || asDate(booking.createdAt) || new Date()
      }))
    });
  }

  if (seed.checkoutOrders?.length) {
    await prisma.checkoutOrder.createMany({
      data: seed.checkoutOrders.map((order) => ({
        id: order.id,
        userId: order.userId || null,
        companyId: order.companyId || null,
        guideId: order.guideId || null,
        orderType: order.orderType,
        referenceId: order.referenceId || null,
        serviceName: order.serviceName,
        destination: order.destination || null,
        bookingDate: asDate(order.bookingDate),
        startDate: asDate(order.startDate),
        endDate: asDate(order.endDate),
        travelersCount: order.travelersCount || 1,
        addOns: Array.isArray(order.addOns) ? order.addOns : [],
        subtotal: order.subtotal || 0,
        taxes: order.taxes || 0,
        fees: order.fees || 0,
        total: order.total || 0,
        currency: order.currency || "JOD",
        paymentMethod: order.paymentMethod || null,
        orderStatus: order.orderStatus || "Pending",
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        notes: order.notes || null,
        createdAt: asDate(order.createdAt) || new Date(),
        updatedAt: asDate(order.updatedAt) || asDate(order.createdAt) || new Date()
      }))
    });
  }

  if (seed.paymentTransactions?.length) {
    await prisma.paymentTransaction.createMany({
      data: seed.paymentTransactions.map((payment) => ({
        id: payment.id,
        checkoutOrderId: payment.checkoutOrderId,
        provider: payment.provider || null,
        transactionRef: payment.transactionRef || null,
        amount: payment.amount || 0,
        currency: payment.currency || "JOD",
        status: payment.status || "Pending",
        paidAt: asDate(payment.paidAt),
        createdAt: asDate(payment.createdAt) || new Date(),
        updatedAt: asDate(payment.updatedAt) || asDate(payment.createdAt) || new Date()
      }))
    });
  }

  if (seed.companyChatMessages?.length) {
    await prisma.companyChatMessage.createMany({
      data: seed.companyChatMessages.map((message) => ({
        id: message.id,
        companyId: message.companyId,
        userId: message.userId || null,
        senderName: message.senderName,
        message: message.message,
        direction: message.direction || "traveler_to_company",
        isRead: Boolean(message.isRead),
        createdAt: asDate(message.createdAt) || new Date(),
        updatedAt: asDate(message.updatedAt) || asDate(message.createdAt) || new Date()
      }))
    });
  }

  if (seed.analyticsRecords?.length) {
    await prisma.analyticsRecord.createMany({
      data: seed.analyticsRecords.map((record) => ({
        id: record.id,
        companyId: record.companyId,
        totalBookings: record.totalBookings || 0,
        totalRevenue: record.totalRevenue || 0,
        averageRating: record.averageRating ?? null,
        mostPopularTour: record.mostPopularTour || null,
        mostPopularPackage: record.mostPopularPackage || null,
        reportDate: asDate(record.reportDate) || new Date(),
        createdAt: asDate(record.createdAt) || new Date(),
        updatedAt: asDate(record.updatedAt) || asDate(record.createdAt) || new Date()
      }))
    });
  }

  if (seed.dashboardNotifications?.length) {
    await prisma.dashboardNotification.createMany({
      data: seed.dashboardNotifications.map((notification) => ({
        id: notification.id,
        userId: notification.userId || null,
        companyId: notification.companyId || null,
        audienceRole: notification.audienceRole || "owner",
        title: notification.title,
        message: notification.message,
        isRead: Boolean(notification.isRead),
        createdAt: asDate(notification.createdAt) || new Date(),
        updatedAt: asDate(notification.updatedAt) || asDate(notification.createdAt) || new Date()
      }))
    });
  }

  if (seed.favorites?.length) {
    await prisma.favorite.createMany({
      data: seed.favorites.map((favorite) => ({
        id: favorite.id,
        userId: favorite.userId,
        attractionId: favorite.attractionId || null,
        companyId: favorite.companyId || null,
        createdAt: asDate(favorite.createdAt) || new Date()
      }))
    });
  }

  if (seed.chat?.length) {
    try {
      await prisma.chatMessage.createMany({
        data: seed.chat.map((m) => ({
          id: m.id,
          userId: m.userId,
          message: m.message,
          response: m.response || null,
          createdAt: asDate(m.createdAt) || new Date()
        }))
      });
    } catch (err) {
      console.warn('Seed: skipping chat seed (table may be missing):', err.message || err);
    }
  }

  const sequences = [
    'users',
    'companies',
    'categories',
    'attractions',
    'hotels',
    'restaurants',
    'tours',
    'packages',
    'transport',
    'favorites',
    'certified_guides',
    'traveler_stories',
    'traveler_story_interactions',
    'guide_bookings',
    'checkout_orders',
    'payment_transactions',
    'company_chat_messages',
    'company_bookings',
    'dashboard_notifications',
    'analytics_records',
    'ai_trip_plans',
    'trips',
    'expenses',
    'journals',
    'reviews',
    'chat_messages'
  ];

  for (const tbl of sequences) {
    try {
      await resetTableSequence(tbl);
    } catch (err) {
      console.warn(`Seed: failed to reset sequence for ${tbl} (may not exist):`, err.message || err);
    }
  }

  console.log("Database seeded from backend/data/db.json");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
