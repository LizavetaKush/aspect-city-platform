const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const districts = ["Центр", "Заднепровье", "Октябрьский", "Юбилейный", "Казимировка", "Спутник"];
const types = ["APARTMENT", "HOUSE", "COMMERCIAL"];
const deals = ["SALE", "RENT"];
const statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "SOLD", "RENTED"];
const photos = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82"
];

function pick(list, index) {
  return list[index % list.length];
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  await prisma.report.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.showChecklistItem.deleteMany();
  await prisma.realtorNote.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.viewingRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.propertyPhoto.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo123", 10);
  const admin = await prisma.user.create({
    data: {
      id: "user-admin",
      role: "ADMIN",
      name: "Марина Ковалева",
      email: "admin@aspect.local",
      phone: "+375 29 611-40-10",
      passwordHash,
      lastActiveAt: new Date()
    }
  });

  const realtors = [];
  for (let i = 1; i <= 4; i += 1) {
    realtors.push(
      await prisma.user.create({
        data: {
          id: `user-realtor-${i}`,
          role: "REALTOR",
          name: ["Илья Орлов", "Анна Соколова", "Олег Мороз", "Вера Климова"][i - 1],
          email: i === 1 ? "realtor@aspect.local" : `realtor${i}@aspect.local`,
          phone: `+375 29 70${i}-12-${80 + i}`,
          passwordHash,
          licensePhotoUrl: photos[i],
          registeredAt: daysAgo(120 - i * 8),
          lastActiveAt: daysAgo(i)
        }
      })
    );
  }

  const clients = [];
  for (let i = 1; i <= 45; i += 1) {
    clients.push(
      await prisma.user.create({
        data: {
          id: `user-client-${i}`,
          role: "CLIENT",
          name: `Клиент ${String(i).padStart(2, "0")}`,
          email: i === 1 ? "client@aspect.local" : `client${i}@aspect.local`,
          phone: `+375 33 ${900 + i}-18-${String(40 + i).padStart(2, "0")}`,
          passwordHash,
          status: i % 17 === 0 ? "BLOCKED" : "ACTIVE",
          blockReason: i % 17 === 0 ? "Нарушение правил записи на показы" : null,
          registeredAt: daysAgo(80 - (i % 30)),
          lastActiveAt: daysAgo(i % 12)
        }
      })
    );
  }

  const properties = [];
  for (let i = 1; i <= 220; i += 1) {
    const type = pick(types, i);
    const dealType = type === "COMMERCIAL" || i % 4 === 0 ? "RENT" : pick(deals, i);
    const basePrice = dealType === "RENT" ? 300 + (i % 18) * 95 : 45000 + (i % 80) * 1750;
    const property = await prisma.property.create({
      data: {
        id: `property-${i}`,
        title: `${type === "APARTMENT" ? "Квартира" : type === "HOUSE" ? "Дом" : "Помещение"} ${i} в Могилеве`,
        type,
        dealType,
        status: pick(statuses, i),
        rooms: type === "COMMERCIAL" ? 1 + (i % 5) : 1 + (i % 5),
        price: basePrice,
        area: type === "HOUSE" ? 90 + (i % 120) : type === "COMMERCIAL" ? 45 + (i % 340) : 28 + (i % 80),
        district: pick(districts, i),
        address: `Могилев, ул. ${["Ленинская", "Первомайская", "Симонова", "Гагарина", "Крупской"][i % 5]}, ${10 + i}`,
        description: "Тестовый объект для проверки каталога, фильтрации, заявок, аналитики и отчетов.",
        latitude: 53.86 + (i % 40) / 1000,
        longitude: 30.25 + (i % 90) / 1000,
        views: 40 + (i % 520),
        realtorId: pick(realtors, i).id,
        createdAt: daysAgo(i % 90),
        photos: {
          create: [
            { url: pick(photos, i), position: 0 },
            { url: pick(photos, i + 1), position: 1 },
            { url: pick(photos, i + 2), position: 2 }
          ]
        },
        priceHistory: {
          create: [
            { price: basePrice + Math.round(basePrice * 0.08), changedAt: daysAgo(35 + (i % 20)) },
            { price: basePrice, changedAt: daysAgo(i % 20) }
          ]
        },
        notes: {
          create: {
            internalComment: "Seed-комментарий риелтора для демонстрации блокнота.",
            ownerConversation: "Собственник готов обсуждать условия после первого показа.",
            personalRating: 1 + (i % 5),
            reminderAt: i % 3 === 0 ? daysAgo(-3 - (i % 7)) : null,
            fileLinks: ["Планировка", "Фото документов"]
          }
        },
        checklist: {
          create: [
            { title: "Проверить документы", done: i % 2 === 0, position: 0 },
            { title: "Подготовить ключи", done: false, position: 1 }
          ]
        }
      }
    });
    properties.push(property);
  }

  for (let i = 0; i < 180; i += 1) {
    await prisma.favorite
      .create({
        data: {
          userId: pick(clients, i).id,
          propertyId: pick(properties, i * 3).id,
          createdAt: daysAgo(i % 30)
        }
      })
      .catch(() => null);
  }

  for (let i = 0; i < 120; i += 1) {
    const property = pick(properties, i * 2);
    await prisma.viewingRequest.create({
      data: {
        clientId: pick(clients, i).id,
        realtorId: property.realtorId,
        propertyId: property.id,
        scheduledAt: daysAgo(-(i % 18)),
        status: pick(["PENDING", "APPROVED", "REJECTED"], i),
        comment: "Seed-заявка на показ объекта",
        createdAt: daysAgo(i % 45)
      }
    });
  }

  for (let i = 0; i < 90; i += 1) {
    await prisma.activityLog.create({
      data: {
        userId: pick([...clients, ...realtors, admin], i).id,
        action: pick(["login", "property_view", "request_created", "report_downloaded"], i),
        createdAt: daysAgo(i % 21)
      }
    });
  }

  for (let i = 0; i < 80; i += 1) {
    const property = pick(properties, i * 2);
    const client = pick(clients, i);
    const senderId = i % 2 === 0 ? client.id : property.realtorId;
    await prisma.chatMessage.create({
      data: {
        clientId: client.id,
        realtorId: property.realtorId,
        propertyId: property.id,
        senderId,
        text:
          senderId === client.id
            ? `Здравствуйте, интересует объект "${property.title}". Когда можно посмотреть?`
            : `Добрый день. По объекту "${property.title}" есть свободный слот завтра после 18:00.`,
        readAt: i % 5 === 0 ? null : daysAgo(i % 4),
        createdAt: daysAgo(i % 10)
      }
    });
  }

  console.log("Seed completed: users, properties, requests, favorites and chat messages created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
