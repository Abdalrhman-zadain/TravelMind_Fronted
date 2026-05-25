CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TRAVELER',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "profileImage" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attractions" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "city" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "entryFee" DOUBLE PRECISION,
    "openingHours" TEXT,
    "rating" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "categoryId" INTEGER,
    "types" TEXT[],
    "description" TEXT,
    "opening_hours" JSONB,
    "place_id" TEXT,
    "name" TEXT,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "user_ratings_total" INTEGER,
    "category" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "city" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "stars" INTEGER,
    "pricePerNight" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "external_id" TEXT,
    "country" TEXT,
    "amenities" JSONB,
    "updated_at" TIMESTAMP(3),
    "imageUrl" TEXT,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" SERIAL NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "city" TEXT NOT NULL,
    "cuisine" TEXT,
    "priceRange" TEXT,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "phone" TEXT,
    "rating" DOUBLE PRECISION,
    "photo_url" TEXT,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "travelersCount" INTEGER NOT NULL DEFAULT 1,
    "travelInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generatedItinerary" JSONB,
    "estimatedCost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tripId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tripId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "placeType" TEXT NOT NULL,
    "placeId" INTEGER NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "ownerUserId" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "heroImage" TEXT,
    "gallery" TEXT[],
    "tagline" TEXT,
    "description" TEXT,
    "longDescription" TEXT,
    "location" TEXT,
    "city" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "foundedYear" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isLicensed" BOOLEAN NOT NULL DEFAULT false,
    "supportedLanguages" TEXT[],
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT[],
    "servicesOffered" TEXT[],
    "social" JSONB,
    "stats" JSONB,
    "specialOffer" JSONB,
    "seo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tours" (
    "id" SERIAL NOT NULL,
    "attractionId" INTEGER,
    "companyId" INTEGER,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "image" TEXT,
    "gallery" TEXT[],
    "duration" TEXT,
    "location" TEXT,
    "meetingPoint" TEXT,
    "minGroupSize" INTEGER,
    "maxGroupSize" INTEGER,
    "languages" TEXT[],
    "price" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER DEFAULT 0,
    "badge" TEXT,
    "includedServices" TEXT[],
    "excludedServices" TEXT[],
    "itinerary" TEXT[],
    "cancellationPolicy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" SERIAL NOT NULL,
    "attractionId" INTEGER,
    "companyId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "durationDays" INTEGER,
    "minGroupSize" INTEGER,
    "maxGroupSize" INTEGER,
    "hotelIncluded" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "itinerary" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport" (
    "id" SERIAL NOT NULL,
    "attractionId" INTEGER,
    "companyId" INTEGER,
    "title" TEXT,
    "provider" TEXT,
    "description" TEXT,
    "image" TEXT,
    "serviceType" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "pickupLocation" TEXT,
    "dropOffLocation" TEXT,
    "contact" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "attractionId" INTEGER,
    "companyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_bookings" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "serviceType" TEXT,
    "serviceId" INTEGER,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "travelersCount" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "specialRequests" TEXT,
    "totalPrice" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
    "bookingStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_trip_plans" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "destination" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "budget" DOUBLE PRECISION,
    "travelersCount" INTEGER NOT NULL DEFAULT 1,
    "travelInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generatedItinerary" JSONB NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_trip_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_records" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "mostPopularTour" TEXT,
    "mostPopularPackage" TEXT,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "companyId" INTEGER,
    "audienceRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_stories" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "guideId" INTEGER,
    "attractionId" INTEGER,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "destinationSlug" TEXT,
    "coverImage" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "storyText" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "travelersCount" INTEGER NOT NULL DEFAULT 1,
    "rating" DOUBLE PRECISION,
    "travelInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "travelTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveler_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_story_interactions" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "interactionType" TEXT NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveler_story_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certified_guides" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER,
    "attractionId" INTEGER,
    "fullName" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "hourlyRate" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "isLicensed" BOOLEAN NOT NULL DEFAULT true,
    "availability" TEXT,
    "destinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certified_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_bookings" (
    "id" SERIAL NOT NULL,
    "guideId" INTEGER NOT NULL,
    "userId" INTEGER,
    "attractionId" INTEGER,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "travelersCount" INTEGER NOT NULL DEFAULT 1,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "specialRequests" TEXT,
    "totalPrice" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'JOD',
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
    "bookingStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_orders" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "companyId" INTEGER,
    "guideId" INTEGER,
    "orderType" TEXT NOT NULL,
    "referenceId" INTEGER,
    "serviceName" TEXT NOT NULL,
    "destination" TEXT,
    "bookingDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "travelersCount" INTEGER NOT NULL DEFAULT 1,
    "addOns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "paymentMethod" TEXT,
    "orderStatus" TEXT NOT NULL DEFAULT 'Pending',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" SERIAL NOT NULL,
    "checkoutOrderId" INTEGER NOT NULL,
    "provider" TEXT,
    "transactionRef" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_chat_messages" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'traveler_to_company',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" BIGSERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "location" TEXT,
    "category" TEXT,
    "source" TEXT NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "attractions_city_idx" ON "attractions"("city");

-- CreateIndex
CREATE INDEX "attractions_categoryId_idx" ON "attractions"("categoryId");

-- CreateIndex
CREATE INDEX "idx_attractions_city" ON "attractions"("city");

-- CreateIndex
CREATE UNIQUE INDEX "hotels_external_id_key" ON "hotels"("external_id");

-- CreateIndex
CREATE INDEX "hotels_city_idx" ON "hotels"("city");

-- CreateIndex
CREATE INDEX "hotels_stars_idx" ON "hotels"("stars");

-- CreateIndex
CREATE INDEX "restaurants_city_idx" ON "restaurants"("city");

-- CreateIndex
CREATE INDEX "restaurants_cuisine_idx" ON "restaurants"("cuisine");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "trips_userId_idx" ON "trips"("userId");

-- CreateIndex
CREATE INDEX "trips_updatedAt_idx" ON "trips"("updatedAt");

-- CreateIndex
CREATE INDEX "expenses_userId_idx" ON "expenses"("userId");

-- CreateIndex
CREATE INDEX "expenses_tripId_idx" ON "expenses"("tripId");

-- CreateIndex
CREATE INDEX "journals_userId_idx" ON "journals"("userId");

-- CreateIndex
CREATE INDEX "journals_tripId_idx" ON "journals"("tripId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_placeType_placeId_idx" ON "reviews"("placeType", "placeId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_ownerUserId_idx" ON "companies"("ownerUserId");

-- CreateIndex
CREATE INDEX "companies_city_idx" ON "companies"("city");

-- CreateIndex
CREATE INDEX "companies_rating_idx" ON "companies"("rating");

-- CreateIndex
CREATE INDEX "tours_attractionId_idx" ON "tours"("attractionId");

-- CreateIndex
CREATE INDEX "tours_companyId_idx" ON "tours"("companyId");

-- CreateIndex
CREATE INDEX "packages_attractionId_idx" ON "packages"("attractionId");

-- CreateIndex
CREATE INDEX "packages_companyId_idx" ON "packages"("companyId");

-- CreateIndex
CREATE INDEX "transport_attractionId_idx" ON "transport"("attractionId");

-- CreateIndex
CREATE INDEX "transport_companyId_idx" ON "transport"("companyId");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_attractionId_idx" ON "favorites"("attractionId");

-- CreateIndex
CREATE INDEX "favorites_companyId_idx" ON "favorites"("companyId");

-- CreateIndex
CREATE INDEX "company_bookings_companyId_idx" ON "company_bookings"("companyId");

-- CreateIndex
CREATE INDEX "company_bookings_userId_idx" ON "company_bookings"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_userId_idx" ON "chat_messages"("userId");

-- CreateIndex
CREATE INDEX "ai_trip_plans_userId_idx" ON "ai_trip_plans"("userId");

-- CreateIndex
CREATE INDEX "ai_trip_plans_destination_idx" ON "ai_trip_plans"("destination");

-- CreateIndex
CREATE INDEX "analytics_records_companyId_idx" ON "analytics_records"("companyId");

-- CreateIndex
CREATE INDEX "analytics_records_reportDate_idx" ON "analytics_records"("reportDate");

-- CreateIndex
CREATE INDEX "dashboard_notifications_userId_idx" ON "dashboard_notifications"("userId");

-- CreateIndex
CREATE INDEX "dashboard_notifications_companyId_idx" ON "dashboard_notifications"("companyId");

-- CreateIndex
CREATE INDEX "dashboard_notifications_audienceRole_idx" ON "dashboard_notifications"("audienceRole");

-- CreateIndex
CREATE INDEX "dashboard_notifications_isRead_idx" ON "dashboard_notifications"("isRead");

-- CreateIndex
CREATE INDEX "traveler_stories_userId_idx" ON "traveler_stories"("userId");

-- CreateIndex
CREATE INDEX "traveler_stories_guideId_idx" ON "traveler_stories"("guideId");

-- CreateIndex
CREATE INDEX "traveler_stories_attractionId_idx" ON "traveler_stories"("attractionId");

-- CreateIndex
CREATE INDEX "traveler_stories_destination_idx" ON "traveler_stories"("destination");

-- CreateIndex
CREATE INDEX "traveler_story_interactions_storyId_idx" ON "traveler_story_interactions"("storyId");

-- CreateIndex
CREATE INDEX "traveler_story_interactions_userId_idx" ON "traveler_story_interactions"("userId");

-- CreateIndex
CREATE INDEX "traveler_story_interactions_interactionType_idx" ON "traveler_story_interactions"("interactionType");

-- CreateIndex
CREATE INDEX "certified_guides_companyId_idx" ON "certified_guides"("companyId");

-- CreateIndex
CREATE INDEX "certified_guides_attractionId_idx" ON "certified_guides"("attractionId");

-- CreateIndex
CREATE INDEX "certified_guides_rating_idx" ON "certified_guides"("rating");

-- CreateIndex
CREATE INDEX "guide_bookings_guideId_idx" ON "guide_bookings"("guideId");

-- CreateIndex
CREATE INDEX "guide_bookings_userId_idx" ON "guide_bookings"("userId");

-- CreateIndex
CREATE INDEX "guide_bookings_attractionId_idx" ON "guide_bookings"("attractionId");

-- CreateIndex
CREATE INDEX "checkout_orders_userId_idx" ON "checkout_orders"("userId");

-- CreateIndex
CREATE INDEX "checkout_orders_companyId_idx" ON "checkout_orders"("companyId");

-- CreateIndex
CREATE INDEX "checkout_orders_guideId_idx" ON "checkout_orders"("guideId");

-- CreateIndex
CREATE INDEX "checkout_orders_orderType_idx" ON "checkout_orders"("orderType");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_transactionRef_key" ON "payment_transactions"("transactionRef");

-- CreateIndex
CREATE INDEX "payment_transactions_checkoutOrderId_idx" ON "payment_transactions"("checkoutOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "company_chat_messages_companyId_idx" ON "company_chat_messages"("companyId");

-- CreateIndex
CREATE INDEX "company_chat_messages_userId_idx" ON "company_chat_messages"("userId");

-- CreateIndex
CREATE INDEX "company_chat_messages_isRead_idx" ON "company_chat_messages"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "photos_url_unique_idx" ON "photos"("url");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "attractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "attractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport" ADD CONSTRAINT "transport_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "attractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport" ADD CONSTRAINT "transport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "attractions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_bookings" ADD CONSTRAINT "company_bookings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_bookings" ADD CONSTRAINT "company_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_trip_plans" ADD CONSTRAINT "ai_trip_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_records" ADD CONSTRAINT "analytics_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_notifications" ADD CONSTRAINT "dashboard_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_notifications" ADD CONSTRAINT "dashboard_notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_stories" ADD CONSTRAINT "traveler_stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_stories" ADD CONSTRAINT "traveler_stories_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "certified_guides"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_stories" ADD CONSTRAINT "traveler_stories_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "attractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_story_interactions" ADD CONSTRAINT "traveler_story_interactions_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "traveler_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_story_interactions" ADD CONSTRAINT "traveler_story_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certified_guides" ADD CONSTRAINT "certified_guides_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certified_guides" ADD CONSTRAINT "certified_guides_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "attractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_bookings" ADD CONSTRAINT "guide_bookings_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "certified_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_bookings" ADD CONSTRAINT "guide_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_bookings" ADD CONSTRAINT "guide_bookings_attractionId_fkey" FOREIGN KEY ("attractionId") REFERENCES "attractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_orders" ADD CONSTRAINT "checkout_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_orders" ADD CONSTRAINT "checkout_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_orders" ADD CONSTRAINT "checkout_orders_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "certified_guides"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_checkoutOrderId_fkey" FOREIGN KEY ("checkoutOrderId") REFERENCES "checkout_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_chat_messages" ADD CONSTRAINT "company_chat_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_chat_messages" ADD CONSTRAINT "company_chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

