# Захиалга — Газрын зурагт суурилсан онлайн захиалгын систем

П. Батсуурь | ШМТК | 2026

---

## 🚀 Ажиллуулах заавар

### 1. MongoDB .env тохируулах

```bash
cd backend
cp .env.example .env
```

`.env` файлд `MONGODB_URI`-г өөрийн MongoDB хаягаар тохируулна. Жишээ (нууц үг болон хэрэглэгчийн мэдээллийг тавихгүй):

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/zahialga?retryWrites=true&w=majority
```

Анхаарах: Нууц үг, API түлхүүр зэргийг репозиторид оруулахгүй; `.env` файл нь `.gitignore`-д орсон байх ёстой.

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

Туршилтын аккаунтууд болон жишээ хэрэглэгчийн нууц үгийг README-д шууд оруулахгүй. Туршилт хийхийн тулд `backend/seed.js` скрипт ашиглан жишээ өгөгдөл үүсгэнэ:

```bash
cd backend
node seed.js
```

## Дараа нь `.env`-д тохирох тестийн тохиргоог оруулна.

## Хуудсууд

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

## Технологийн стек

**Frontend:** React.js 18, React Router 6, Axios, Leaflet (OpenStreetMap)

**Backend:** Node.js 20, Express.js 4, JWT, bcryptjs

**Database:** MongoDB Atlas, Mongoose ODM

**Maps:** Leaflet + OpenStreetMap (үнэгүй, Google Maps биш)

---

## ERD — Collection-уудын бүтэц

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

## API Endpoints

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

---

## СИСТЕМИЙН АРХИТЕКТУР (Desktop / Embedded / Бусад)

Энэ систем нь дараах үндсэн бүрэлдэхүүнээр бүтээгдэнэ:

- Клиент (Frontend): React + Leaflet ашиглан газрын зураг, хэрэглэгчийн интерфэйс харуулна.
- Сервер (Backend): Node.js + Express API, хэрэглэгчийн аутентификаци, бизнесийн логик, REST endpoints.
- Сан (Database): MongoDB (Atlas эсвэл локал), Mongoose ODM.
- Реал-тайм мэдэгдэл: WebSocket (socket.io) эсвэл long-polling ашиглан шууд мэдэгдэл дамжуулна.
- Файлууд / Медиа: Үйлчилгээний зураг, демо видео зэргийг `/docs` хавтасанд байрлуулна.

Архитектурын ерөнхий урсгал:

1. Хэрэглэгч браузer-аас HTTP/HTTPS хүсэлт илгээх (React).
2. Сервер хүсэлтийг боловсруулж, шаардлагатай бол MongoDB-тай харьцана.
3. Хүсэлтийн үр дүнг клиент руу буцаана; real-time мэдэгдэл шаардлагатай бол socket дамжуулна.

---

## ХАРАА ХАЖУУ: Hardware / Software шаардлага

- Hardware (dev): 4 GB RAM / 2 CPU, 10 GB диск, сүлжээний холболт.
- Hardware (prod, жижиг): 1-2 vCPU, 2-4 GB RAM, 20 GB SSD (эсвэл cloud контейнер).
- Software (dev): Node.js >= 18 ( санал болгож байна Node.js 20), npm/yarn, Git.
- Software (DB): MongoDB Atlas эсвэл MongoDB v5+ локал суулгалт.
- Browsers: Chrome/Firefox/Edge шинэ хувилбарууд, Leaflet maps-г дэмжих Javascript.
- Optional: HTTPS (TLS) сертификат, process manager (PM2) эсвэл container runtime (Docker).

---

## ДЕМО, СКРИНОШОТ, ВИДЕО

Демо зураг, видео зэргийг `docs/` хавтасанд байршуулсан. Одоогоор баримт, placeholder файлууд байна:

- `docs/demo_screenshot.svg` — screenshot placeholder
- `docs/README.md` — доторх демо тайлбар
- `docs/demo_video_instructions.md` — видео байрлуулах заавар

Та өөрийн видео (`demo.mp4`) эсвэл өндөр нягтралтай зураг `docs/` хавтас руу хуулаад README-д дурдсанчлан холбож болно.

---

## Аюулгүй байдал, хориглох зүйлс

- Нууц үг, API түлхүүр, токен зэргийг кодын дотор шууд бичихгүй. `.env` ашиглах.
- Гадаад хүний кодыг зөвшөөрөлгүй хуулбарлахгүй.
- Хоосон эсвэл дутуу репозиторийг илгээхгүй.
