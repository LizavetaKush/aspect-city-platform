export const demoUsers = [
  {
    id: "u-admin",
    role: "ADMIN",
    name: "Марина Ковалева",
    email: "admin@aspect.local",
    password: "demo123",
    phone: "+375 29 611-40-10",
    avatar: "МК",
    status: "ACTIVE",
    blockReason: "",
    registeredAt: "2026-02-03",
    lastActiveAt: "2026-05-20 11:36"
  },
  {
    id: "u-realtor-1",
    role: "REALTOR",
    name: "Илья Орлов",
    email: "realtor@aspect.local",
    password: "demo123",
    phone: "+375 44 730-12-80",
    avatar: "ИО",
    status: "ACTIVE",
    licensePhoto: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
    registeredAt: "2026-02-12",
    lastActiveAt: "2026-05-20 10:58"
  },
  {
    id: "u-realtor-2",
    role: "REALTOR",
    name: "Анна Соколова",
    email: "sokolova@aspect.local",
    password: "demo123",
    phone: "+375 29 512-64-32",
    avatar: "АС",
    status: "ACTIVE",
    licensePhoto: "",
    registeredAt: "2026-03-04",
    lastActiveAt: "2026-05-19 18:20"
  },
  {
    id: "u-client-1",
    role: "CLIENT",
    name: "Денис Павлов",
    email: "client@aspect.local",
    password: "demo123",
    phone: "+375 33 902-18-45",
    avatar: "ДП",
    status: "ACTIVE",
    registeredAt: "2026-04-01",
    lastActiveAt: "2026-05-20 09:18"
  },
  {
    id: "u-client-2",
    role: "CLIENT",
    name: "Елена Романова",
    email: "romanova@aspect.local",
    password: "demo123",
    phone: "+375 29 854-21-11",
    avatar: "ЕР",
    status: "ACTIVE",
    registeredAt: "2026-04-07",
    lastActiveAt: "2026-05-19 21:04"
  },
  {
    id: "u-client-3",
    role: "CLIENT",
    name: "Павел Литвин",
    email: "litvin@aspect.local",
    password: "demo123",
    phone: "+375 25 790-18-09",
    avatar: "ПЛ",
    status: "BLOCKED",
    blockReason: "Повторные ложные заявки на показы",
    registeredAt: "2026-03-29",
    lastActiveAt: "2026-05-12 13:44"
  }
];

const photos = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=82"
];

export const districts = ["Центр", "Заднепровье", "Октябрьский", "Юбилейный", "Казимировка", "Спутник"];
export const propertyTypes = ["Квартира", "Дом", "Коммерция"];
export const statuses = ["Активно", "Продано", "Арендовано"];

export const demoProperties = [
  {
    id: "p-1",
    title: "Квартира у площади Звезд",
    type: "Квартира",
    dealType: "Продажа",
    status: "Активно",
    rooms: 2,
    price: 95000,
    area: 58.4,
    district: "Центр",
    address: "Могилев, ул. Ленинская, 10",
    description: "Светлая квартира с ремонтом, закрытым двором и пешей доступностью к набережной Днепра.",
    realtorId: "u-realtor-1",
    views: 438,
    createdAt: "2026-05-12",
    coordinates: [53.9007, 30.3314],
    photos: [photos[0], photos[1], photos[2]],
    priceHistory: [
      { date: "2026-03-10", price: 99000 },
      { date: "2026-04-08", price: 97000 },
      { date: "2026-05-12", price: 95000 }
    ],
    notes: {
      internalComment: "Собственник готов к торгу после повторного показа.",
      ownerConversation: "15.05: согласовал показ на вечер. Просит предупреждать за 2 часа.",
      personalRating: 5,
      reminderAt: "2026-05-24T18:00",
      fileLinks: ["Договор оценки", "План БТИ"],
      checklist: [
        { id: "c-1", title: "Проверить счетчики", done: true },
        { id: "c-2", title: "Подготовить ключи от парковки", done: false }
      ]
    }
  },
  {
    id: "p-2",
    title: "Дом с террасой в Спутнике",
    type: "Дом",
    dealType: "Продажа",
    status: "Активно",
    rooms: 5,
    price: 182000,
    area: 146,
    district: "Спутник",
    address: "Могилев, ул. Славгородская, 24",
    description: "Современный коттедж с участком, гаражом и энергоэффективным отоплением.",
    realtorId: "u-realtor-2",
    views: 287,
    createdAt: "2026-05-06",
    coordinates: [53.8721, 30.4112],
    photos: [photos[4], photos[5], photos[6]],
    priceHistory: [
      { date: "2026-04-02", price: 190000 },
      { date: "2026-05-06", price: 182000 }
    ],
    notes: {
      internalComment: "Собственник рассматривает рассрочку.",
      ownerConversation: "10.05: запросил оценку по соседним домам.",
      personalRating: 4,
      reminderAt: "2026-05-23T12:00",
      fileLinks: ["Кадастровая схема"],
      checklist: [{ id: "c-3", title: "Показать котельную", done: false }]
    }
  },
  {
    id: "p-3",
    title: "Студия рядом с БРУ",
    type: "Квартира",
    dealType: "Аренда",
    status: "Активно",
    rooms: 1,
    price: 360,
    area: 31,
    district: "Центр",
    address: "Могилев, пр-т Мира, 43",
    description: "Компактная студия для студента или молодого специалиста, быстрый интернет включен.",
    realtorId: "u-realtor-1",
    views: 521,
    createdAt: "2026-05-16",
    coordinates: [53.9094, 30.3412],
    photos: [photos[1], photos[3], photos[2]],
    priceHistory: [
      { date: "2026-05-01", price: 380 },
      { date: "2026-05-16", price: 360 }
    ],
    notes: {
      internalComment: "Высокий спрос, лучше подтверждать показы сразу.",
      ownerConversation: "16.05: согласована аренда минимум на 6 месяцев.",
      personalRating: 5,
      reminderAt: "2026-05-21T15:30",
      fileLinks: [],
      checklist: [{ id: "c-4", title: "Уточнить дату освобождения", done: true }]
    }
  },
  {
    id: "p-4",
    title: "Офис на Первомайской",
    type: "Коммерция",
    dealType: "Аренда",
    status: "Активно",
    rooms: 4,
    price: 1200,
    area: 92,
    district: "Центр",
    address: "Могилев, ул. Первомайская, 44",
    description: "Офисный блок с отдельным входом, переговорной и витринными окнами.",
    realtorId: "u-realtor-2",
    views: 198,
    createdAt: "2026-04-29",
    coordinates: [53.9085, 30.337],
    photos: [photos[7], photos[0], photos[5]],
    priceHistory: [
      { date: "2026-04-29", price: 1300 },
      { date: "2026-05-15", price: 1200 }
    ],
    notes: {
      internalComment: "Подходит под салон или шоурум.",
      ownerConversation: "30.04: собственник просит не снижать ниже 1100.",
      personalRating: 3,
      reminderAt: "2026-05-26T11:00",
      fileLinks: ["План помещений"],
      checklist: [{ id: "c-5", title: "Проверить вывеску", done: false }]
    }
  },
  {
    id: "p-5",
    title: "Трехкомнатная на Юбилейном",
    type: "Квартира",
    dealType: "Продажа",
    status: "Продано",
    rooms: 3,
    price: 112000,
    area: 76.2,
    district: "Юбилейный",
    address: "Могилев, ул. Симонова, 67",
    description: "Семейная квартира с большой кухней, лоджией и школой во дворе.",
    realtorId: "u-realtor-1",
    views: 365,
    createdAt: "2026-03-17",
    coordinates: [53.9256, 30.2879],
    photos: [photos[2], photos[3], photos[1]],
    priceHistory: [
      { date: "2026-03-17", price: 118000 },
      { date: "2026-04-04", price: 112000 }
    ],
    notes: {
      internalComment: "Сделка закрыта, оставить в аналитике.",
      ownerConversation: "20.04: документы переданы.",
      personalRating: 4,
      reminderAt: "",
      fileLinks: [],
      checklist: []
    }
  },
  {
    id: "p-6",
    title: "Апартаменты возле Днепра",
    type: "Квартира",
    dealType: "Продажа",
    status: "Активно",
    rooms: 2,
    price: 104000,
    area: 61,
    district: "Заднепровье",
    address: "Могилев, ул. Челюскинцев, 18",
    description: "Видовая квартира, подземный паркинг, панорамные окна и готовая кухня.",
    realtorId: "u-realtor-2",
    views: 476,
    createdAt: "2026-05-03",
    coordinates: [53.8877, 30.3562],
    photos: [photos[3], photos[6], photos[0]],
    priceHistory: [
      { date: "2026-04-12", price: 108000 },
      { date: "2026-05-03", price: 104000 }
    ],
    notes: {
      internalComment: "Покупатели часто спрашивают про паркинг.",
      ownerConversation: "05.05: есть второй комплект ключей.",
      personalRating: 5,
      reminderAt: "2026-05-22T17:00",
      fileLinks: ["Планировка"],
      checklist: [{ id: "c-6", title: "Показать кладовую", done: false }]
    }
  },
  {
    id: "p-7",
    title: "Таунхаус в Казимировке",
    type: "Дом",
    dealType: "Продажа",
    status: "Активно",
    rooms: 4,
    price: 139000,
    area: 118,
    district: "Казимировка",
    address: "Могилев, ул. Крупской, 102",
    description: "Двухуровневый таунхаус с небольшим садом и готовым ремонтом.",
    realtorId: "u-realtor-1",
    views: 244,
    createdAt: "2026-04-25",
    coordinates: [53.9454, 30.331],
    photos: [photos[5], photos[4], photos[7]],
    priceHistory: [
      { date: "2026-04-25", price: 145000 },
      { date: "2026-05-14", price: 139000 }
    ],
    notes: {
      internalComment: "Лучшие показы после 17:00.",
      ownerConversation: "12.05: готов оставить мебель.",
      personalRating: 4,
      reminderAt: "2026-05-25T18:30",
      fileLinks: [],
      checklist: [{ id: "c-7", title: "Проверить ворота", done: false }]
    }
  },
  {
    id: "p-8",
    title: "Помещение под кофейню",
    type: "Коммерция",
    dealType: "Аренда",
    status: "Арендовано",
    rooms: 2,
    price: 780,
    area: 54,
    district: "Октябрьский",
    address: "Могилев, ул. Гагарина, 29",
    description: "Первый этаж, высокий пешеходный поток, есть мокрая точка и место под летник.",
    realtorId: "u-realtor-2",
    views: 159,
    createdAt: "2026-03-30",
    coordinates: [53.8909, 30.3224],
    photos: [photos[7], photos[2], photos[6]],
    priceHistory: [
      { date: "2026-03-30", price: 820 },
      { date: "2026-04-18", price: 780 }
    ],
    notes: {
      internalComment: "Арендовано, оставить для отчетности.",
      ownerConversation: "19.04: договор подписан.",
      personalRating: 3,
      reminderAt: "",
      fileLinks: [],
      checklist: []
    }
  },
  {
    id: "p-9",
    title: "Квартира с новым ремонтом",
    type: "Квартира",
    dealType: "Продажа",
    status: "Активно",
    rooms: 1,
    price: 68000,
    area: 42,
    district: "Октябрьский",
    address: "Могилев, ул. Терехина, 6",
    description: "Новый ремонт, бытовая техника, тихий двор и быстрый выезд к центру.",
    realtorId: "u-realtor-1",
    views: 334,
    createdAt: "2026-05-10",
    coordinates: [53.876, 30.318],
    photos: [photos[1], photos[0], photos[6]],
    priceHistory: [
      { date: "2026-05-10", price: 70000 },
      { date: "2026-05-18", price: 68000 }
    ],
    notes: {
      internalComment: "Проверить документы по перепланировке.",
      ownerConversation: "18.05: обещал прислать техпаспорт.",
      personalRating: 4,
      reminderAt: "2026-05-22T10:00",
      fileLinks: ["Фото техпаспорта"],
      checklist: [{ id: "c-8", title: "Спросить про мебель", done: true }]
    }
  },
  {
    id: "p-10",
    title: "Склад с рампой",
    type: "Коммерция",
    dealType: "Аренда",
    status: "Активно",
    rooms: 1,
    price: 2100,
    area: 340,
    district: "Заднепровье",
    address: "Могилев, ул. Строителей, 8",
    description: "Теплый склад, рампа, высота потолка 6 м, отдельная зона офиса.",
    realtorId: "u-realtor-2",
    views: 126,
    createdAt: "2026-04-22",
    coordinates: [53.881, 30.372],
    photos: [photos[6], photos[4], photos[7]],
    priceHistory: [
      { date: "2026-04-22", price: 2300 },
      { date: "2026-05-08", price: 2100 }
    ],
    notes: {
      internalComment: "Проверить график доступа для грузового транспорта.",
      ownerConversation: "09.05: готов обсудить каникулы на ремонт.",
      personalRating: 4,
      reminderAt: "2026-05-27T09:00",
      fileLinks: ["Схема склада"],
      checklist: [{ id: "c-9", title: "Измерить ворота", done: false }]
    }
  }
];

export const demoRequests = [
  {
    id: "r-1",
    propertyId: "p-1",
    clientId: "u-client-1",
    realtorId: "u-realtor-1",
    scheduledAt: "2026-05-22T18:00",
    status: "Ожидает",
    comment: "Хочу посмотреть после работы",
    createdAt: "2026-05-18"
  },
  {
    id: "r-2",
    propertyId: "p-3",
    clientId: "u-client-2",
    realtorId: "u-realtor-1",
    scheduledAt: "2026-05-21T12:30",
    status: "Подтвержден",
    comment: "Интересует аренда на год",
    createdAt: "2026-05-17"
  },
  {
    id: "r-3",
    propertyId: "p-6",
    clientId: "u-client-1",
    realtorId: "u-realtor-2",
    scheduledAt: "2026-05-23T16:00",
    status: "Ожидает",
    comment: "Нужен паркинг",
    createdAt: "2026-05-18"
  },
  {
    id: "r-4",
    propertyId: "p-7",
    clientId: "u-client-2",
    realtorId: "u-realtor-1",
    scheduledAt: "2026-05-24T10:00",
    status: "Отклонен",
    comment: "Просили утренний показ",
    createdAt: "2026-05-16"
  }
];

export const demoFavorites = [
  { userId: "u-client-1", propertyId: "p-1" },
  { userId: "u-client-1", propertyId: "p-6" },
  { userId: "u-client-2", propertyId: "p-3" }
];

export const demoMessages = [
  {
    id: "m-1",
    clientId: "u-client-1",
    realtorId: "u-realtor-1",
    propertyId: "p-1",
    senderId: "u-client-1",
    text: "Здравствуйте! Хочу уточнить, можно ли посмотреть квартиру на Ленинской вечером?",
    createdAt: "2026-05-20 10:41",
    readAt: "2026-05-20 10:44"
  },
  {
    id: "m-2",
    clientId: "u-client-1",
    realtorId: "u-realtor-1",
    propertyId: "p-1",
    senderId: "u-realtor-1",
    text: "Добрый день. Да, свободно 22 мая в 18:00. Подтвердить этот слот?",
    createdAt: "2026-05-20 10:44",
    readAt: "2026-05-20 10:45"
  },
  {
    id: "m-3",
    clientId: "u-client-2",
    realtorId: "u-realtor-1",
    propertyId: "p-3",
    senderId: "u-client-2",
    text: "Интересует студия рядом с БРУ. Можно арендовать на год?",
    createdAt: "2026-05-20 11:08",
    readAt: ""
  },
  {
    id: "m-4",
    clientId: "u-client-1",
    realtorId: "u-realtor-2",
    propertyId: "p-6",
    senderId: "u-client-1",
    text: "Добрый день. У апартаментов возле Днепра есть место в паркинге?",
    createdAt: "2026-05-20 11:20",
    readAt: ""
  }
];

export const cityZones = [
  { id: "z-1", name: "Центр", label: "Высокий спрос", tone: "hot", top: "31%", left: "45%" },
  { id: "z-2", name: "Октябрьский", label: "Низкие цены", tone: "low", top: "57%", left: "43%" },
  { id: "z-3", name: "Спутник", label: "Новостройки", tone: "new", top: "48%", left: "68%" },
  { id: "z-4", name: "Казимировка", label: "Большие скидки", tone: "deal", top: "20%", left: "56%" },
  { id: "z-5", name: "Заднепровье", label: "Коммерция", tone: "biz", top: "51%", left: "30%" }
];

export const defaultFilters = {
  query: "",
  type: "Все",
  rooms: "Все",
  district: "Все",
  status: "Все",
  priceMin: 0,
  priceMax: 200000,
  sort: "dateDesc"
};
