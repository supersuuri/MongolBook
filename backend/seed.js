require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const { Place, Staff, Service, Booking } = require("./models/index");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB холбогдлоо");

  await Promise.all(
    [User, Place, Staff, Service, Booking].map((M) => M.deleteMany({})),
  );
  console.log("🗑  Цэвэрлэгдлээ");

  const pw = await bcrypt.hash("password123", 12);
  const ap = await bcrypt.hash("admin123", 12);

  const users = await User.insertMany([
    {
      name: "Admin",
      email: "admin@zahialga.mn",
      password: ap,
      phone: "99000000",
      role: "admin",
    },
    {
      name: "Номин",
      email: "owner.barber@zahialga.mn",
      password: pw,
      phone: "99110011",
      role: "owner",
    },
    {
      name: "Сэргэлэн",
      email: "owner.salon@zahialga.mn",
      password: pw,
      phone: "99112211",
      role: "owner",
    },
    {
      name: "Солонго",
      email: "owner.beauty@zahialga.mn",
      password: pw,
      phone: "99220022",
      role: "owner",
    },
    {
      name: "Тэмүүлэн",
      email: "owner.billiard@zahialga.mn",
      password: pw,
      phone: "99330033",
      role: "owner",
    },
    {
      name: "Эрдэнэ",
      email: "owner.restaurant@zahialga.mn",
      password: pw,
      phone: "99440044",
      role: "owner",
    },
    {
      name: "Оюун",
      email: "owner.resort@zahialga.mn",
      password: pw,
      phone: "99550055",
      role: "owner",
    },
    {
      name: "П. Батсуурь",
      email: "batsuurii@gmail.com",
      password: pw,
      phone: "99001122",
      role: "user",
    },
    {
      name: "Д. Болормаа",
      email: "bolormaa@gmail.com",
      password: pw,
      phone: "99112233",
      role: "user",
    },
  ]);
  const [
    admin,
    ownerBarber,
    ownerSalon,
    ownerBeauty,
    ownerBilliard,
    ownerRestaurant,
    ownerResort,
    u1,
    u2,
  ] = users;

  const placeSpecs = [
    {
      name: "Master Barber 1",
      category: "barber",
      ownerId: ownerBarber._id,
      description: "Давтамжтай эрэгтэй засалт, сахал засалт.",
      address: "СБД, 1-р хороо",
      location: { lat: 47.9188, lng: 106.9172 },
      phone: "7711-2233",
      images: [
        "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200",
      ],
      tables: [], // ширээ байхгүй
      serviceSeed: [
        ["Hair Cut", 45, 28000],
        ["Beard Styling", 30, 18000],
        ["Wash & Finish", 35, 22000],
      ],
      staffSeed: [
        [
          "Batzorig",
          "barber",
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400",
        ],
        [
          "Temka",
          "barber",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        ],
      ],
    },
    {
      name: "North Barber House",
      category: "barber",
      ownerId: ownerBarber._id,
      description: "Сонгодог cut, fade, beard үйлчилгээ.",
      address: "БГД, 6-р хороо",
      location: { lat: 47.9291, lng: 106.8845 },
      phone: "7711-8899",
      images: [
        "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=1200",
      ],
      tables: [], // ширээ байхгүй
      serviceSeed: [
        ["Fade Cut", 40, 30000],
        ["Beard Trim", 25, 15000],
        ["Kids Cut", 30, 20000],
      ],
      staffSeed: [
        [
          "Bold",
          "barber",
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        ],
        [
          "Suren",
          "barber",
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
        ],
      ],
    },
    {
      name: "Prime Salon",
      category: "salon",
      ownerId: ownerSalon._id,
      description: "Үс, будалт, арчилгаа",
      address: "СБД, 8-р хороо",
      location: { lat: 47.9222, lng: 106.9122 },
      phone: "7700-1111",
      images: [
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200",
      ],
      tables: [],
      serviceSeed: [
        ["Wash & Style", 90, 70000],
        ["Hair Coloring", 90, 85000],
        ["Keratin Care", 120, 110000],
      ],
      staffSeed: [
        [
          "Saraa",
          "stylist",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        ],
        [
          "Uugii",
          "stylist",
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        ],
      ],
    },
    {
      name: "City Glow Salon",
      category: "salon",
      ownerId: ownerSalon._id,
      description: "Бүсгүйчүүдийн үс арчилгаа, засалт.",
      address: "БЗД, 13-р хороо",
      location: { lat: 47.9281, lng: 106.9531 },
      phone: "7700-2222",
      images: [
        "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=1200",
      ],
      tables: [],
      serviceSeed: [
        ["Blow Dry", 45, 45000],
        ["Perm", 120, 95000],
        ["Hair Treatment", 60, 55000],
      ],
      staffSeed: [
        [
          "Anu",
          "stylist",
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
        ],
        [
          "Mika",
          "stylist",
          "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400",
        ],
      ],
    },
    {
      name: "Luxe Beauty",
      category: "beauty",
      ownerId: ownerBeauty._id,
      description: "Makeup, skincare, manicure",
      address: "БЗД, 26-р хороо",
      location: { lat: 47.912, lng: 106.943 },
      phone: "7744-5566",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200",
      ],
      tables: [],
      serviceSeed: [
        ["Party Makeup", 90, 85000],
        ["Gel Manicure", 70, 42000],
        ["Facial Care", 60, 50000],
      ],
      staffSeed: [
        [
          "Naraa",
          "artist",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        ],
        [
          "Bolor",
          "artist",
          "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400",
        ],
      ],
    },
    {
      name: "Glow Lab Beauty",
      category: "beauty",
      ownerId: ownerBeauty._id,
      description: "Маникюр, makeup, skincare үйлчилгээ.",
      address: "ЧД, 4-р хороо",
      location: { lat: 47.933, lng: 106.924 },
      phone: "7744-7788",
      images: [
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200",
      ],
      tables: [],
      serviceSeed: [
        ["Express Makeup", 45, 45000],
        ["Classic Manicure", 50, 38000],
        ["Skin Spa", 75, 68000],
      ],
      staffSeed: [
        [
          "Odko",
          "artist",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        ],
        [
          "Tsolmon",
          "artist",
          "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400",
        ],
      ],
    },
    {
      name: "King Billiard",
      category: "billiard",
      ownerId: ownerBilliard._id,
      description: "Бильярдын ширээний онлайн захиалга",
      address: "ЧД, Бага тойруу",
      location: { lat: 47.914, lng: 106.926 },
      phone: "7755-8899",
      images: [
        "https://images.unsplash.com/photo-1571988840298-3b5301d5109b?w=1200",
      ],
      tables: [
        { name: "T1", type: "regular", row: "A", col: 1, capacity: 4 },
        { name: "T2", type: "regular", row: "A", col: 2, capacity: 4 },
        { name: "T3", type: "regular", row: "B", col: 1, capacity: 4 },
        { name: "T4", type: "regular", row: "B", col: 2, capacity: 4 },
      ],
      serviceSeed: [
        ["Pool Table 1 Hour", 60, 12000],
        ["VIP Table 1 Hour", 60, 18000],
        ["Tournament Package", 120, 30000],
      ],
      staffSeed: [
        [
          "Otgon",
          "attendant",
          "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400",
        ],
        [
          "Erkhmee",
          "attendant",
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
        ],
      ],
    },
    {
      name: "Blue Cue Club",
      category: "billiard",
      ownerId: ownerBilliard._id,
      description: "Өргөн танхимтай тоглоомын клуб.",
      address: "БГД, 10-р хороо",
      location: { lat: 47.9069, lng: 106.8796 },
      phone: "7755-9900",
      images: [
        "https://static.where-e.com/United_States/Cue-Club-Of-Wisconsin_e116e4e638ace7aa0c3ebe20f1492acf.jpg",
        "https://images.unsplash.com/photo-1562774058-1cbd9e5b1c8e?w=1200",
      ],
      tables: [
        { name: "C1", type: "regular", row: "A", col: 1, capacity: 4 },
        { name: "C2", type: "regular", row: "A", col: 2, capacity: 4 },
        { name: "C3", type: "regular", row: "B", col: 1, capacity: 4 },
        { name: "C4", type: "vip", row: "B", col: 2, capacity: 6 },
      ],
      serviceSeed: [
        ["Table Booking", 60, 10000],
        ["VIP Table Booking", 60, 16000],
        ["Night Package", 180, 35000],
      ],
      staffSeed: [
        [
          "Sambuu",
          "attendant",
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        ],
        [
          "Ariuka",
          "attendant",
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        ],
      ],
    },
    {
      name: "Urban Grill",
      category: "restaurant",
      ownerId: ownerRestaurant._id,
      description: "VIP болон Hall ширээний захиалга",
      address: "ХУД, 15-р хороо",
      location: { lat: 47.9005, lng: 106.906 },
      phone: "7766-9911",
      images: [
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
      ],
      tables: [
        { name: "VIP-1", type: "vip", row: "V", col: 1, capacity: 6 },
        { name: "VIP-2", type: "vip", row: "V", col: 2, capacity: 6 },
        { name: "H-1", type: "hall", row: "H", col: 1, capacity: 4 },
        { name: "H-2", type: "hall", row: "H", col: 2, capacity: 4 },
        { name: "H-3", type: "hall", row: "H", col: 3, capacity: 4 },
      ],
      serviceSeed: [
        ["Dinner Reservation", 120, 20000],
        ["Family Table", 90, 15000],
        ["Private Room", 120, 40000],
      ],
      staffSeed: [
        [
          "Enkh",
          "host",
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        ],
        [
          "Munguu",
          "waiter",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
        ],
      ],
    },
    {
      name: "Skyline Bistro",
      category: "restaurant",
      ownerId: ownerRestaurant._id,
      description: "Өдрийн хоол, оройн захиалгатай бистро.",
      address: "СБД, 6-р хороо",
      location: { lat: 47.9239, lng: 106.9012 },
      phone: "7766-9922",
      images: [
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200",
      ],
      tables: [
        { name: "B-1", type: "regular", row: "A", col: 1, capacity: 2 },
        { name: "B-2", type: "regular", row: "A", col: 2, capacity: 2 },
        { name: "B-3", type: "hall", row: "B", col: 1, capacity: 4 },
        { name: "B-4", type: "hall", row: "B", col: 2, capacity: 4 },
      ],
      serviceSeed: [
        ["Lunch Table", 60, 10000],
        ["Dinner Table", 120, 18000],
        ["VIP Dinner Room", 120, 30000],
      ],
      staffSeed: [
        [
          "Oyuka",
          "host",
          "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400",
        ],
        [
          "Temuulen",
          "waiter",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
        ],
      ],
    },
    {
      name: "Blue Sky Resort",
      category: "resort",
      ownerId: ownerResort._id,
      description: "Амралт, өрөө болон package захиалга",
      address: "Тэрэлж, УБ-100км",
      location: { lat: 47.886, lng: 107.34 },
      phone: "8899-0001",
      images: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200",
      ],
      tables: [],
      serviceSeed: [
        ["Day Pass", 180, 150000],
        ["Family Package", 240, 280000],
        ["Spa Package", 120, 90000],
      ],
      staffSeed: [
        [
          "Oyu",
          "reception",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        ],
        [
          "Namuun",
          "guide",
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        ],
      ],
    },
  ];

  const places = await Place.insertMany(
    placeSpecs.map((spec) => ({
      name: spec.name,
      category: spec.category,
      description: spec.description,
      address: spec.address,
      location: spec.location,
      phone: spec.phone,
      ownerId: spec.ownerId,
      rating: 4.5,
      reviewCount: 50,
      images: spec.images,
      tables: spec.tables,
    })),
  );
  console.log(`${places.length} газар`);

  const services = [];
  const staffs = [];

  for (let i = 0; i < placeSpecs.length; i += 1) {
    const spec = placeSpecs[i];
    const place = places[i];

    spec.serviceSeed.forEach(([name, duration, price]) => {
      services.push({ placeId: place._id, name, duration, price });
    });

    spec.staffSeed.forEach(([name, role, profileImage]) => {
      staffs.push({ placeId: place._id, name, role, profileImage });
    });
  }

  const createdServices = await Service.insertMany(services);
  const createdStaffs = await Staff.insertMany(staffs);

  const svcByPlace = createdServices.reduce((acc, s) => {
    const key = s.placeId.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const staffByPlace = createdStaffs.reduce((acc, s) => {
    const key = s.placeId.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  console.log(`${createdServices.length} үйлчилгээ`);
  console.log(`${createdStaffs.length} ажилтан`);

  const dt = (dOff, h) => {
    const d = new Date();
    d.setDate(d.getDate() + dOff);
    d.setHours(h, 0, 0, 0);
    return d;
  };

  const bookings = [
    {
      userId: u1._id,
      placeId: places[0]._id,
      serviceId: svcByPlace[places[0]._id.toString()][0]._id,
      staffId: staffByPlace[places[0]._id.toString()][0]._id,
      datetime: dt(1, 11),
      status: "confirmed",
      paymentStatus: "paid",
      totalPrice: 28000,
      confirmedAt: dt(0, 10),
      paidAt: dt(0, 10),
    },
    {
      userId: u2._id,
      placeId: places[1]._id,
      serviceId: svcByPlace[places[1]._id.toString()][0]._id,
      staffId: staffByPlace[places[1]._id.toString()][0]._id,
      datetime: dt(2, 15),
      status: "pending",
      paymentStatus: "pending",
      totalPrice: 30000,
    },
    {
      userId: u1._id,
      placeId: places[2]._id,
      serviceId: svcByPlace[places[2]._id.toString()][0]._id,
      staffId: staffByPlace[places[2]._id.toString()][0]._id,
      datetime: dt(1, 19),
      status: "confirmed",
      paymentStatus: "pending",
      totalPrice: 70000,
    },
    {
      userId: u2._id,
      placeId: places[3]._id,
      serviceId: svcByPlace[places[3]._id.toString()][0]._id,
      staffId: staffByPlace[places[3]._id.toString()][0]._id,
      datetime: dt(3, 20),
      status: "pending",
      paymentStatus: "pending",
      totalPrice: 45000,
    },
    {
      userId: u1._id,
      placeId: places[4]._id,
      serviceId: svcByPlace[places[4]._id.toString()][0]._id,
      staffId: staffByPlace[places[4]._id.toString()][0]._id,
      datetime: dt(4, 17),
      status: "confirmed",
      paymentStatus: "paid",
      totalPrice: 85000,
      confirmedAt: dt(0, 12),
      paidAt: dt(0, 12),
    },
    {
      userId: u2._id,
      placeId: places[5]._id,
      serviceId: svcByPlace[places[5]._id.toString()][1]._id,
      staffId: staffByPlace[places[5]._id.toString()][1]._id,
      datetime: dt(2, 13),
      status: "pending",
      paymentStatus: "pending",
      totalPrice: 38000,
    },
    {
      userId: u1._id,
      placeId: places[6]._id,
      serviceId: svcByPlace[places[6]._id.toString()][0]._id,
      tableId: places[6].tables[0]._id,
      tableType: places[6].tables[0].type,
      datetime: dt(3, 19),
      status: "confirmed",
      paymentStatus: "paid",
      totalPrice: 12000,
      confirmedAt: dt(0, 12),
      paidAt: dt(0, 12),
    },
    {
      userId: u2._id,
      placeId: places[7]._id,
      serviceId: svcByPlace[places[7]._id.toString()][2]._id,
      tableId: places[7].tables[1]._id,
      tableType: places[7].tables[1].type,
      datetime: dt(5, 20),
      status: "pending",
      paymentStatus: "pending",
      totalPrice: 30000,
    },
    {
      userId: u1._id,
      placeId: places[8]._id,
      serviceId: svcByPlace[places[8]._id.toString()][1]._id,
      tableId: places[8].tables[0]._id,
      tableType: places[8].tables[0].type,
      datetime: dt(2, 18),
      status: "pending",
      paymentStatus: "pending",
      totalPrice: 18000,
    },
    {
      userId: u2._id,
      placeId: places[10]._id, // ✅ Blue Sky Resort
      serviceId: svcByPlace[places[10]._id.toString()][0]._id,
      datetime: dt(6, 10),
      status: "pending",
      paymentStatus: "pending",
      totalPrice: 150000,
    },
  ];

  await Booking.insertMany(bookings);
  console.log(`${bookings.length} захиалга`);

  console.log("\n════════════════════════════════════");
  console.log("✅ Seed амжилттай!");
  console.log("════════════════════════════════════");
  console.log("🔑 Нэвтрэх:");
  console.log("   admin:   admin@zahialga.mn / admin123");
  console.log("   barber:  owner.barber@zahialga.mn / password123");
  console.log("   salon:   owner.salon@zahialga.mn / password123");
  console.log("   beauty:  owner.beauty@zahialga.mn / password123");
  console.log("   user:    batsuurii@gmail.com / password123");
  console.log("════════════════════════════════════\n");

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
