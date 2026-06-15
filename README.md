# Захиалга — Газрын зурагт суурилсан онлайн захиалгын систем

П. Батсуурь | ШМТК | 2026

---

## 🚀 Ажиллуулах заавар

### 1. MongoDB .env тохируулах

```bash
cd backend
cp .env.example .env
```

`.env` файлд байгаа MONGODB_URI аль хэдийн чиний Atlas-тай холбогдсон байна:

```
MONGODB_URI=mongodb+srv://batsuuri:7okXm8EovrqLBKFE@cluster0.mgsb1ee.mongodb.net/zahialga?retryWrites=true&w=majority
```

### 2. Backend суулгах, seed хийх

```bash
cd backend
npm install
node seed.js        # өгөгдөл оруулах
npm run dev         # http://localhost:5000
```

### 3. Frontend суулгах

```bash
cd frontend
npm install
npm start           # http://localhost:3000
```

---

## 🔑 Нэвтрэх мэдээлэл

| Хэрэглэгч | Имэйл               | Нууц үг     |
| --------- | ------------------- | ----------- |
| Admin     | admin@zahialga.mn   | admin123    |
| User 1    | batsuurii@gmail.com | password123 |
| User 2    | bolormaa@gmail.com  | password123 |

---

## 🌐 Хуудсууд

| URL             | Тайлбар                                      |
| --------------- | -------------------------------------------- |
| `/`             | Нүүр — газрын зураг + байгууллагын жагсаалт  |
| `/business/:id` | Байгууллагын дэлгэрэнгүй, үйлчилгээ, хуваарь |
| `/book/:id`     | 3 алхамт захиалгын урсгал + 2D суудал        |
| `/my-bookings`  | Миний захиалгууд                             |
| `/admin`        | Admin хянах самбар                           |
| `/login`        | Нэвтрэх                                      |
| `/register`     | Бүртгүүлэх                                   |

---

## 🏗 Технологийн стек

**Frontend:** React.js 18, React Router 6, Axios, Leaflet (OpenStreetMap)

**Backend:** Node.js 20, Express.js 4, JWT, bcryptjs

**Database:** MongoDB Atlas, Mongoose ODM

**Maps:** Leaflet + OpenStreetMap (үнэгүй, Google Maps биш)

---

## 📊 ERD — Collection-уудын бүтэц

```
users       → businesses (1:N — өмчилнө)
users       → bookings   (1:N — захиалдаг)
businesses  → services   (1:N)
businesses  → seats      (1:N)
businesses  → schedules  (1:N)
businesses  → bookings   (1:N)
services    → bookings   (1:N)
seats       → bookings   (1:N)
```

---

## 📡 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile

GET    /api/businesses
GET    /api/businesses/nearby?lat=&lng=&radius=
GET    /api/businesses/:id
POST   /api/businesses          (admin)

GET    /api/bookings/my
GET    /api/bookings/admin      (admin)
GET    /api/bookings/availability
GET    /api/bookings/booked-seats
POST   /api/bookings
PUT    /api/bookings/:id/confirm (admin)
PUT    /api/bookings/:id/cancel

GET    /api/seats/:businessId
GET    /api/schedules/:businessId
GET    /api/services/:businessId
GET    /api/admin/stats          (admin)
```
