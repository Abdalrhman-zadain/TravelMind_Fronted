# Quick Start Guide - Attraction Profile Page

## 🚀 Getting Started

### 1. Start the Backend Server

```powershell
cd backend
npm run dev
```

Server runs on `http://localhost:3000`

### 2. Access the Frontend

```
http://localhost:3000/attractions.html
```

### 3. View an Attraction Profile

1. Open attractions listing page
2. Click "View Details" on any attraction card
3. Opens profile at `company-detail.html?id=1` (or your chosen ID)

---

## 📍 Key URLs

| Page             | URL                           | Purpose                             |
| ---------------- | ----------------------------- | ----------------------------------- |
| Attractions List | `/attractions.html`           | Browse all attractions              |
| Profile Page     | `/company-detail.html?id=:id` | View single attraction              |
| Admin Dashboard  | `/admin.html`                 | Manage attractions (requires login) |
| Auth             | `/auth.html`                  | Login / Register                    |
| Home             | `/index.html`                 | Landing page                        |

---

## 🎯 Main Features

### For Users

✅ View comprehensive attraction information  
✅ Explore related tours and packages  
✅ See transport options  
✅ View interactive map  
✅ Read and add reviews  
✅ Save favorites (wishlist)  
✅ Share attraction  
✅ Book experiences

### For Admins

✅ Create new attractions  
✅ Edit existing attractions  
✅ Delete attractions  
✅ Search & filter attractions  
✅ View all attractions in table  
✅ Manage all attraction fields

---

## 📝 API Endpoints

### Public Endpoints

```
GET  /api/attractions              # All attractions
GET  /api/attractions/:id          # Single attraction
GET  /api/attractions/:id/detail   # Enriched detail data
GET  /api/attractions/:id/tours    # Tours for attraction
GET  /api/attractions/:id/packages # Packages for attraction
GET  /api/attractions/:id/transport# Transport options
GET  /api/attractions/:id/reviews  # Reviews for attraction
```

### Protected Endpoints (Require Auth)

```
POST /api/attractions/:id/reviews         # Create review
POST /api/favorites                       # Toggle favorite
GET  /api/users/:id/favorites             # Get user's favorites
POST /api/attractions                     # Create attraction (admin)
PUT  /api/attractions/:id                 # Update attraction (admin)
DELETE /api/attractions/:id               # Delete attraction (admin)
```

---

## 🔧 Testing Commands

### Test API

```powershell
# Get attraction detail
curl.exe http://localhost:3000/api/attractions/1/detail

# Create review
curl.exe -X POST http://localhost:3000/api/attractions/1/reviews `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"rating":5,"text":"Amazing!"}'

# Toggle favorite
curl.exe -X POST http://localhost:3000/api/favorites `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"attractionId":1,"favorite":true}'
```

---

## 📂 Project Structure

```
requirement/
├── ATTRACTION_PROFILE_PAGE_REQUIREMENTS.md  (Complete requirements)
├── QUICK_START_GUIDE.md                    (This file)
├── API_DOCUMENTATION.md                    (API details)
└── COMPONENT_STRUCTURE.md                  (Component breakdown)
```

---

## 🎨 Design System

### Colors

```css
--primary: #0c2220; /* Dark green */
--accent: #d4534f; /* Warm desert red */
--text-dark: #1a1a1a; /* Dark text */
--text-gray: #666; /* Gray text */
--background: #f9f9f9; /* Light background */
--border: #eee; /* Light border */
```

### Typography

```css
h1: 28px, bold
h2: 24px, bold
h3: 20px, bold
h4: 16px, bold
p: 14px, regular
small: 12px, regular
```

---

## 💾 Database Reset

If you need to restore from backup:

```powershell
# Reset database
psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from backup
pg_restore -U postgres -d travelmind backend/backupfile.sql

# Sync Prisma schema
cd backend
npx prisma db pull
npx prisma generate
```

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

```powershell
Get-Process node | ForEach-Object { Stop-Process -Id $_.Id -Force }
# Then start server again
```

### Prisma Client Error

```powershell
cd backend
npx prisma generate --skip-engine-check
npx prisma db push
```

### Database Connection Error

Check `.env` file in backend folder:

```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/travelmind?schema=public"
```

---

## 📊 Data Sample

### Attraction Object

```json
{
  "id": 1,
  "nameEn": "Petra Treasury",
  "nameAr": "خزنة فرعون",
  "city": "Petra",
  "category": "Historical Site",
  "description": "The iconic rose-red city...",
  "image": "https://...",
  "images": ["https://...", "https://..."],
  "latitude": 30.3285,
  "longitude": 35.4444,
  "rating": 4.9,
  "entryFee": 50,
  "openingHours": "06:00 - 17:00",
  "languages": ["English", "Arabic"],
  "badges": ["Best Price", "Verified"],
  "tours": [...],
  "packages": [...],
  "transport": [...],
  "reviews": [...]
}
```

---

## ✅ Checklist

Before going live:

- [ ] Backend server running (`npm run dev`)
- [ ] Database connected and seeded
- [ ] All API endpoints tested
- [ ] Frontend pages loading
- [ ] Profile page displaying data
- [ ] Admin panel accessible
- [ ] Auth system working
- [ ] Favorites working
- [ ] Reviews working
- [ ] Map rendering
- [ ] Images loading with lazy loading
- [ ] Mobile responsive
- [ ] Share button working
- [ ] All buttons functional

---

## 📞 Support

For issues or questions:

1. Check the requirements document
2. Review API documentation
3. Check component structure
4. Review browser console for errors
5. Check server logs for API issues

---

_Last Updated: May 20, 2026_
