require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "aspect-city-dev-secret";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: "7d" });
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) return res.status(401).json({ message: "Authorization token required" });

  try {
    req.auth = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function permit(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth.role)) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}

async function currentUser(req) {
  return prisma.user.findUnique({ where: { id: req.auth.sub } });
}

function parseEnum(value, dictionary) {
  return dictionary[value] || value || undefined;
}

const propertyTypeMap = {
  Квартира: "APARTMENT",
  Дом: "HOUSE",
  Коммерция: "COMMERCIAL"
};

const propertyStatusMap = {
  Активно: "ACTIVE",
  Продано: "SOLD",
  Арендовано: "RENTED"
};

const dealTypeMap = {
  Продажа: "SALE",
  Аренда: "RENT"
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "aspect-city-api" });
});

app.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password || !["CLIENT", "REALTOR"].includes(role)) {
      return res.status(400).json({ message: "Invalid registration payload" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, phone: phone || "", role, passwordHash, lastActiveAt: new Date() }
    });
    return res.status(201).json({ user: publicUser(user), token: createToken(user) });
  })
);

app.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.status === "BLOCKED") {
      return res.status(403).json({ message: user.blockReason || "User blocked" });
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    return res.json({ user: publicUser(updated), token: createToken(updated) });
  })
);

app.get(
  "/api/me",
  auth,
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    res.json(publicUser(user));
  })
);

app.patch(
  "/api/me",
  auth,
  asyncRoute(async (req, res) => {
    const { name, phone, email, avatarUrl, licensePhotoUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.auth.sub },
      data: { name, phone, email, avatarUrl, licensePhotoUrl }
    });
    res.json(publicUser(user));
  })
);

app.get(
  "/api/properties",
  auth,
  asyncRoute(async (req, res) => {
    const { q, type, status, district, rooms, minPrice, maxPrice, sort = "createdAtDesc" } = req.query;
    const where = {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { address: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } }
              ]
            }
          : {},
        type ? { type: parseEnum(type, propertyTypeMap) } : {},
        status ? { status: parseEnum(status, propertyStatusMap) } : {},
        district ? { district } : {},
        rooms ? { rooms: Number(rooms) } : {},
        minPrice ? { price: { gte: Number(minPrice) } } : {},
        maxPrice ? { price: { lte: Number(maxPrice) } } : {}
      ]
    };
    const orderBy =
      sort === "priceAsc"
        ? { price: "asc" }
        : sort === "priceDesc"
          ? { price: "desc" }
          : sort === "areaDesc"
            ? { area: "desc" }
            : sort === "viewsDesc"
              ? { views: "desc" }
              : { createdAt: "desc" };
    const properties = await prisma.property.findMany({
      where,
      orderBy,
      include: { photos: { orderBy: { position: "asc" } }, realtor: true, priceHistory: true }
    });
    res.json(properties);
  })
);

app.get(
  "/api/properties/:id",
  auth,
  asyncRoute(async (req, res) => {
    await prisma.property.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        photos: { orderBy: { position: "asc" } },
        realtor: true,
        priceHistory: { orderBy: { changedAt: "asc" } },
        notes: true,
        checklist: { orderBy: { position: "asc" } }
      }
    });
    res.json(property);
  })
);

app.post(
  "/api/properties",
  auth,
  permit("REALTOR"),
  asyncRoute(async (req, res) => {
    const body = req.body;
    const property = await prisma.property.create({
      data: {
        title: body.title,
        type: parseEnum(body.type, propertyTypeMap),
        dealType: parseEnum(body.dealType, dealTypeMap),
        status: parseEnum(body.status, propertyStatusMap) || "ACTIVE",
        rooms: Number(body.rooms),
        price: Number(body.price),
        area: Number(body.area),
        district: body.district,
        address: body.address,
        description: body.description,
        latitude: Number(body.latitude || 53.9),
        longitude: Number(body.longitude || 30.33),
        realtorId: req.auth.sub,
        photos: { create: (body.photos || []).map((url, position) => ({ url, position })) },
        priceHistory: { create: [{ price: Number(body.price), changedAt: new Date() }] },
        notes: {
          create: {
            internalComment: body.notes?.internalComment || "",
            ownerConversation: body.notes?.ownerConversation || "",
            personalRating: Number(body.notes?.personalRating || 3),
            reminderAt: body.notes?.reminderAt ? new Date(body.notes.reminderAt) : null,
            fileLinks: body.notes?.fileLinks || []
          }
        },
        checklist: {
          create: (body.notes?.checklist || []).map((item, position) => ({
            title: item.title,
            done: Boolean(item.done),
            position
          }))
        }
      },
      include: { photos: true, notes: true, checklist: true }
    });
    res.status(201).json(property);
  })
);

app.put(
  "/api/properties/:id",
  auth,
  permit("REALTOR"),
  asyncRoute(async (req, res) => {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property || property.realtorId !== req.auth.sub) return res.status(404).json({ message: "Property not found" });
    const body = req.body;
    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: {
        title: body.title,
        type: parseEnum(body.type, propertyTypeMap),
        dealType: parseEnum(body.dealType, dealTypeMap),
        status: parseEnum(body.status, propertyStatusMap),
        rooms: Number(body.rooms),
        price: Number(body.price),
        area: Number(body.area),
        district: body.district,
        address: body.address,
        description: body.description
      }
    });
    res.json(updated);
  })
);

app.delete(
  "/api/properties/:id",
  auth,
  permit("REALTOR"),
  asyncRoute(async (req, res) => {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property || property.realtorId !== req.auth.sub) return res.status(404).json({ message: "Property not found" });
    await prisma.property.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

app.post(
  "/api/properties/:id/favorite",
  auth,
  permit("CLIENT"),
  asyncRoute(async (req, res) => {
    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: req.auth.sub, propertyId: req.params.id } }
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorite: false });
    }
    await prisma.favorite.create({ data: { userId: req.auth.sub, propertyId: req.params.id } });
    return res.json({ favorite: true });
  })
);

app.post(
  "/api/properties/:id/viewing-requests",
  auth,
  permit("CLIENT"),
  asyncRoute(async (req, res) => {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property) return res.status(404).json({ message: "Property not found" });
    const request = await prisma.viewingRequest.create({
      data: {
        clientId: req.auth.sub,
        realtorId: property.realtorId,
        propertyId: property.id,
        scheduledAt: new Date(req.body.scheduledAt),
        comment: req.body.comment || ""
      }
    });
    res.status(201).json(request);
  })
);

app.get(
  "/api/viewing-requests",
  auth,
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    const where = user.role === "CLIENT" ? { clientId: user.id } : user.role === "REALTOR" ? { realtorId: user.id } : {};
    const requests = await prisma.viewingRequest.findMany({
      where,
      include: { client: true, realtor: true, property: true },
      orderBy: { scheduledAt: "asc" }
    });
    res.json(requests);
  })
);

app.patch(
  "/api/viewing-requests/:id/status",
  auth,
  permit("REALTOR"),
  asyncRoute(async (req, res) => {
    const request = await prisma.viewingRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.realtorId !== req.auth.sub) return res.status(404).json({ message: "Request not found" });
    const updated = await prisma.viewingRequest.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json(updated);
  })
);

app.get(
  "/api/chats",
  auth,
  permit("CLIENT", "REALTOR", "ADMIN"),
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    const where = user.role === "CLIENT" ? { clientId: user.id } : user.role === "REALTOR" ? { realtorId: user.id } : {};
    const messages = await prisma.chatMessage.findMany({
      where,
      include: { client: true, realtor: true, sender: true, property: true },
      orderBy: { createdAt: "asc" }
    });
    res.json(messages);
  })
);

app.post(
  "/api/chats/messages",
  auth,
  permit("CLIENT", "REALTOR"),
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    const { toUserId, propertyId, text } = req.body;
    if (!text || !toUserId) return res.status(400).json({ message: "Text and recipient are required" });

    const peer = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!peer) return res.status(404).json({ message: "Recipient not found" });

    const clientId = user.role === "CLIENT" ? user.id : peer.id;
    const realtorId = user.role === "REALTOR" ? user.id : peer.id;
    if (user.role === "CLIENT" && peer.role !== "REALTOR") return res.status(400).json({ message: "Client can message a realtor" });
    if (user.role === "REALTOR" && peer.role !== "CLIENT") return res.status(400).json({ message: "Realtor can message a client" });

    const message = await prisma.chatMessage.create({
      data: { clientId, realtorId, propertyId: propertyId || null, senderId: user.id, text },
      include: { client: true, realtor: true, sender: true, property: true }
    });
    res.status(201).json(message);
  })
);

app.patch(
  "/api/chats/read",
  auth,
  permit("CLIENT", "REALTOR"),
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    const { clientId, realtorId, propertyId } = req.body;
    if (user.role === "CLIENT" && clientId !== user.id) return res.status(403).json({ message: "Forbidden" });
    if (user.role === "REALTOR" && realtorId !== user.id) return res.status(403).json({ message: "Forbidden" });

    const result = await prisma.chatMessage.updateMany({
      where: {
        clientId,
        realtorId,
        propertyId: propertyId || null,
        senderId: { not: user.id },
        readAt: null
      },
      data: { readAt: new Date() }
    });
    res.json(result);
  })
);

app.get(
  "/api/users",
  auth,
  permit("ADMIN"),
  asyncRoute(async (req, res) => {
    const { role, status, dateFrom, dateTo } = req.query;
    const users = await prisma.user.findMany({
      where: {
        role: role || undefined,
        status: status || undefined,
        registeredAt: { gte: dateFrom ? new Date(dateFrom) : undefined, lte: dateTo ? new Date(dateTo) : undefined }
      },
      orderBy: { registeredAt: "desc" }
    });
    res.json(users.map(publicUser));
  })
);

app.patch(
  "/api/users/:id/block",
  auth,
  permit("ADMIN"),
  asyncRoute(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: "BLOCKED", blockReason: req.body.reason || "Blocked by administrator" }
    });
    res.json(publicUser(user));
  })
);

app.patch(
  "/api/users/:id/unblock",
  auth,
  permit("ADMIN"),
  asyncRoute(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: "ACTIVE", blockReason: null } });
    res.json(publicUser(user));
  })
);

app.get(
  "/api/dashboard",
  auth,
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    if (user.role === "ADMIN") {
      const [users, properties, blocked, messages] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.user.count({ where: { status: "BLOCKED" } }),
        prisma.chatMessage.count()
      ]);
      return res.json({ users, properties, blocked, messages });
    }
    if (user.role === "REALTOR") {
      const [properties, requests, messages] = await Promise.all([
        prisma.property.findMany({ where: { realtorId: user.id } }),
        prisma.viewingRequest.findMany({ where: { realtorId: user.id } }),
        prisma.chatMessage.findMany({ where: { realtorId: user.id } })
      ]);
      return res.json({ properties, requests, messages });
    }
    const [requests, favorites, messages] = await Promise.all([
      prisma.viewingRequest.findMany({ where: { clientId: user.id }, include: { property: true } }),
      prisma.favorite.findMany({ where: { userId: user.id }, include: { property: true } }),
      prisma.chatMessage.findMany({ where: { clientId: user.id } })
    ]);
    return res.json({ requests, favorites, messages });
  })
);

app.get(
  "/api/reports/:type",
  auth,
  asyncRoute(async (req, res) => {
    const user = await currentUser(req);
    const rows =
      req.params.type === "requests"
        ? await prisma.viewingRequest.findMany({
            where: user.role === "CLIENT" ? { clientId: user.id } : user.role === "REALTOR" ? { realtorId: user.id } : {},
            include: { property: true, client: true, realtor: true }
          })
        : await prisma.property.findMany({
            where: user.role === "REALTOR" ? { realtorId: user.id } : {},
            include: { realtor: true }
          });
    const tableRows = rows
      .map((row) => {
        if (row.property) {
          return `<tr><td>${row.property.title}</td><td>${row.client?.name || ""}</td><td>${row.status}</td><td>${row.scheduledAt}</td></tr>`;
        }
        return `<tr><td>${row.title}</td><td>${row.district}</td><td>${row.status}</td><td>${row.price}</td></tr>`;
      })
      .join("");
    const html = `<html><head><meta charset="utf-8"></head><body><h1>Отчет ${req.params.type}</h1><table border="1" cellspacing="0" cellpadding="6">${tableRows}</table></body></html>`;
    await prisma.report.create({ data: { requestedById: user.id, type: req.params.type, fileName: `${req.params.type}.doc` } });
    res.setHeader("Content-Type", "application/msword; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.type}.doc"`);
    res.send(html);
  })
);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Aspect City API is running on http://localhost:${port}/api`);
});
