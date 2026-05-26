-- Copy categories first (no dependencies)
INSERT INTO categories (id, name, type)
SELECT id, name, type FROM travelmind_backup.public.categories
ON CONFLICT (id) DO NOTHING;

-- Copy attractions
INSERT INTO attractions (id, "nameEn", "nameAr", city, "descriptionEn", "descriptionAr", "entryFee", "openingHours", rating, latitude, longitude, "categoryId", types, description, opening_hours, place_id, name, address, lat, lng, user_ratings_total, category, photo_url, created_at)
SELECT id, "nameEn", "nameAr", city, "descriptionEn", "descriptionAr", "entryFee", "openingHours", rating, latitude, longitude, "categoryId", types, description, opening_hours, place_id, name, address, lat, lng, user_ratings_total, category, photo_url, created_at
FROM travelmind_backup.public.attractions
ON CONFLICT (id) DO NOTHING;

-- Copy hotels
INSERT INTO hotels (id, "nameEn", "nameAr", city, "descriptionEn", "descriptionAr", stars, "pricePerNight", rating, latitude, longitude, external_id, country, amenities, updated_at, "imageUrl")
SELECT id, "nameEn", "nameAr", city, "descriptionEn", "descriptionAr", stars, "pricePerNight", rating, latitude, longitude, external_id, country, amenities, updated_at, "imageUrl"
FROM travelmind_backup.public.hotels
ON CONFLICT (id) DO NOTHING;

-- Copy restaurants  
INSERT INTO restaurants (id, "nameEn", "nameAr", city, cuisine, "priceRange", "descriptionEn", "descriptionAr", phone, rating, photo_url)
SELECT id, "nameEn", "nameAr", city, cuisine, "priceRange", "descriptionEn", "descriptionAr", phone, rating, photo_url
FROM travelmind_backup.public.restaurants
ON CONFLICT (id) DO NOTHING;
