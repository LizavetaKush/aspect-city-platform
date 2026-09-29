import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpDown,
  Ban,
  BarChart3,
  Building2,
  CalendarClock,
  Camera,
  Check,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  GripVertical,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Unlock,
  User,
  Users,
  X
} from "lucide-react";
import "./styles.css";
import {
  cityZones,
  defaultFilters,
  demoFavorites,
  demoMessages,
  demoProperties,
  demoRequests,
  demoUsers,
  districts,
  propertyTypes,
  statuses
} from "./data";

const STORAGE_KEY = "aspect-city-app-state-v1";
const ROLE_LABELS = { CLIENT: "Клиент", REALTOR: "Риелтор", ADMIN: "Администратор" };
const STATUS_CLASS = { Активно: "success", Продано: "neutral", Арендовано: "warning" };
const REQUEST_CLASS = { Ожидает: "warning", Подтвержден: "success", Отклонен: "danger" };

function createInitialState() {
  return {
    users: demoUsers,
    properties: demoProperties,
    requests: demoRequests,
    favorites: demoFavorites,
    messages: demoMessages,
    adminReports: [],
    filters: defaultFilters,
    sessionUserId: ""
  };
}

function readSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();
    const parsed = JSON.parse(saved);
    return {
      ...createInitialState(),
      ...parsed,
      filters: { ...defaultFilters, ...(parsed.filters || {}) },
      messages: parsed.messages || demoMessages,
      adminReports: parsed.adminReports || []
    };
  } catch {
    return createInitialState();
  }
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function formatMoney(value, dealType = "Продажа") {
  const suffix = dealType === "Аренда" ? " / мес." : "";
  return `${new Intl.NumberFormat("ru-RU").format(Number(value || 0))} $${suffix}`;
}

function formatDate(date) {
  if (!date) return "Не задано";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));
}

function formatDateTime(date) {
  if (!date) return "Не задано";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function getRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "") || "landing";
  const [name, idValue] = raw.split("/");
  return { name: name || "landing", id: idValue || "" };
}

function go(path) {
  window.location.hash = `#/${path}`;
}

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function filterProperties(properties, filters) {
  const q = normalize(filters.query);
  const min = Number(filters.priceMin || 0);
  const max = Number(filters.priceMax || 999999);
  const list = properties.filter((property) => {
    const matchesQuery =
      !q ||
      normalize(property.address).includes(q) ||
      normalize(property.description).includes(q) ||
      normalize(property.title).includes(q);
    const matchesType = filters.type === "Все" || property.type === filters.type;
    const matchesRooms = filters.rooms === "Все" || Number(property.rooms) === Number(filters.rooms);
    const matchesDistrict = filters.district === "Все" || property.district === filters.district;
    const matchesStatus = filters.status === "Все" || property.status === filters.status;
    const matchesPrice = Number(property.price) >= min && Number(property.price) <= max;
    return matchesQuery && matchesType && matchesRooms && matchesDistrict && matchesStatus && matchesPrice;
  });

  return list.sort((a, b) => {
    if (filters.sort === "priceAsc") return a.price - b.price;
    if (filters.sort === "priceDesc") return b.price - a.price;
    if (filters.sort === "areaDesc") return b.area - a.area;
    if (filters.sort === "viewsDesc") return b.views - a.views;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function App() {
  const [state, setState] = useState(readSavedState);
  const [route, setRoute] = useState(getRoute);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) go("landing");
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentUser = state.users.find((user) => user.id === state.sessionUserId);

  const mutate = (updater) => {
    setState((previous) => {
      const next = structuredClone(previous);
      updater(next);
      return next;
    });
  };

  const context = {
    state,
    currentUser,
    route,
    mutate,
    showToast: setToast
  };

  if (!currentUser) {
    return (
      <>
        {route.name === "auth" ? (
          <AuthScreen state={state} mutate={mutate} showToast={setToast} initialMode={route.id === "register" ? "register" : "login"} />
        ) : (
          <LandingPage context={context} publicView />
        )}
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  return (
    <>
      <Shell context={context} />
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function AuthScreen({ state, mutate, showToast, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    name: "",
    email: "client@aspect.local",
    password: "demo123",
    phone: "",
    role: "CLIENT"
  });

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const submit = (event) => {
    event.preventDefault();

    if (mode === "login") {
      const user = state.users.find((item) => item.email === form.email && item.password === form.password);
      if (!user) {
        showToast("Проверьте email и пароль");
        return;
      }
      if (user.status === "BLOCKED") {
        showToast(`Пользователь заблокирован: ${user.blockReason || "причина не указана"}`);
        return;
      }
      mutate((draft) => {
        draft.sessionUserId = user.id;
        const current = draft.users.find((item) => item.id === user.id);
        current.lastActiveAt = new Date().toLocaleString("ru-RU");
      });
      go("dashboard");
      return;
    }

    if (!form.name.trim() || !form.email.trim() || form.password.length < 4) {
      showToast("Заполните имя, email и пароль");
      return;
    }
    if (state.users.some((user) => user.email === form.email)) {
      showToast("Пользователь с таким email уже существует");
      return;
    }

    const newUser = {
      id: id("u"),
      role: form.role,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      avatar: form.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      status: "ACTIVE",
      blockReason: "",
      licensePhoto: "",
      registeredAt: new Date().toISOString().slice(0, 10),
      lastActiveAt: new Date().toLocaleString("ru-RU")
    };

    mutate((draft) => {
      draft.users.push(newUser);
      draft.sessionUserId = newUser.id;
    });
    go("dashboard");
  };

  return (
    <main className="auth-layout">
      <section className="auth-media" aria-label="Аспект-сити">
        <div className="brand-mark">
          <Building2 size={32} />
          <span>Аспект-сити</span>
        </div>
        <div className="auth-caption">
          <h1>Платформа сделок и показов недвижимости Могилева</h1>
          <p>Каталог, заявки, аналитика и управление объектами в одном рабочем пространстве.</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-tabs" role="tablist">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Вход
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Регистрация
          </button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Имя
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                Роль
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  <option value="CLIENT">Клиент</option>
                  <option value="REALTOR">Риелтор</option>
                </select>
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          {mode === "register" && (
            <label>
              Телефон
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
          )}
          <button className="primary-action" type="submit">
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
        <div className="demo-logins">
          {[
            ["Клиент", "client@aspect.local"],
            ["Риелтор", "realtor@aspect.local"],
            ["Админ", "admin@aspect.local"]
          ].map(([label, email]) => (
            <button key={email} onClick={() => setForm({ ...form, email, password: "demo123" })}>
              {label}
            </button>
          ))}
        </div>
        <button className="link-button" type="button" onClick={() => go("landing")}>
          Вернуться на главную
        </button>
      </section>
    </main>
  );
}

function LandingPage({ context, publicView = false }) {
  const { state, currentUser } = context;
  const activeProperties = state.properties.filter((property) => property.status === "Активно");
  const featured = [...activeProperties].sort((a, b) => b.views - a.views).slice(0, 3);
  const avgSalePrice = Math.round(
    average(state.properties.filter((property) => property.dealType === "Продажа").map((property) => property.price))
  );
  const stats = [
    ["Объектов в базе", state.properties.length],
    ["Активных предложений", activeProperties.length],
    ["Районов Могилева", districts.length],
    ["Заявок на показы", state.requests.length]
  ];

  return (
    <main className={publicView ? "landing-page public-landing" : "landing-page"}>
      <section className="landing-hero">
        <header className="landing-nav">
          <button className="landing-brand" onClick={() => go("landing")}>
            <Building2 size={28} />
            <span>Аспект-сити</span>
          </button>
          <nav aria-label="Навигация лендинга">
            <button onClick={() => document.getElementById("landing-services")?.scrollIntoView({ behavior: "smooth" })}>Услуги</button>
            <button onClick={() => document.getElementById("landing-objects")?.scrollIntoView({ behavior: "smooth" })}>Объекты</button>
            <button onClick={() => document.getElementById("landing-contact")?.scrollIntoView({ behavior: "smooth" })}>Контакты</button>
          </nav>
          <div className="landing-nav-actions">
            {currentUser ? (
              <button className="landing-outline" onClick={() => go("dashboard")}>В кабинет</button>
            ) : (
              <>
                <button className="landing-outline" onClick={() => go("auth")}>Войти</button>
                <button className="landing-solid" onClick={() => go("auth/register")}>Регистрация</button>
              </>
            )}
          </div>
        </header>

        <div className="landing-hero-content">
          <p className="landing-kicker">Недвижимость в Могилеве</p>
          <h1>Аспект-сити помогает покупать, продавать и арендовать без лишней суеты</h1>
          <p>
            Подбираем квартиры, дома и коммерческие помещения, организуем показы, ведем сделки и держим клиента в курсе каждого шага.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-solid" onClick={() => (currentUser ? go("catalog") : go("auth/register"))}>
              Подобрать объект
            </button>
            <button className="landing-outline light" onClick={() => document.getElementById("landing-objects")?.scrollIntoView({ behavior: "smooth" })}>
              Смотреть предложения
            </button>
          </div>
        </div>
      </section>

      <section className="landing-stats" aria-label="Показатели агентства">
        {stats.map(([label, value]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="landing-section" id="landing-services">
        <div className="landing-section-head">
          <p className="eyebrow">Сервис агентства</p>
          <h2>Все ключевые шаги сделки в одном процессе</h2>
        </div>
        <div className="service-grid">
          {[
            [Search, "Подбор объектов", "Фильтруем предложения по району, бюджету, площади и сценарию жизни."],
            [CalendarClock, "Показы без хаоса", "Согласуем удобное время, фиксируем статусы заявок и напоминания."],
            [MessageSquare, "Связь с риелтором", "Клиент и агент общаются в чате по конкретному объекту."],
            [ShieldCheck, "Контроль сделки", "Проверяем документы, историю цены и сопровождаем до результата."]
          ].map(([Icon, title, text]) => (
            <article className="service-card" key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-band">
        <div>
          <p className="eyebrow">О рынке</p>
          <h2>Средняя цена в базе: {formatMoney(avgSalePrice).replace(" / мес.", "")}</h2>
        </div>
        <div className="district-strip">
          {districts.map((district) => (
            <span key={district}>{district}</span>
          ))}
        </div>
      </section>

      <section className="landing-section" id="landing-objects">
        <div className="landing-section-head">
          <p className="eyebrow">Популярные предложения</p>
          <h2>Объекты, которые чаще всего смотрят клиенты</h2>
        </div>
        <div className="landing-property-grid">
          {featured.map((property) => (
            <article className="landing-property-card" key={property.id}>
              <img src={property.photos[0]} alt={property.title} />
              <div>
                <Badge tone={STATUS_CLASS[property.status]}>{property.status}</Badge>
                <h3>{property.title}</h3>
                <p>{property.address}</p>
                <strong>{formatMoney(property.price, property.dealType)}</strong>
                <button onClick={() => (currentUser ? go(`property/${property.id}`) : go("auth"))}>Подробнее</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-contact" id="landing-contact">
        <div>
          <p className="eyebrow">Контакты</p>
          <h2>Агентство недвижимости Аспект-сити</h2>
          <p>Могилев, пр-т Мира, 43 · +375 29 611-40-10 · aspect-city@realty.local</p>
        </div>
        <button className="landing-solid" onClick={() => (currentUser ? go("catalog") : go("auth/register"))}>
          Начать подбор
        </button>
      </section>
    </main>
  );
}

function Shell({ context }) {
  const { currentUser, route, mutate } = context;
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = [
    { id: "landing", label: "Главная", icon: Building2, roles: ["CLIENT", "REALTOR", "ADMIN"] },
    { id: "dashboard", label: "Дашборд", icon: LayoutDashboard, roles: ["CLIENT", "REALTOR", "ADMIN"] },
    { id: "catalog", label: "Каталог", icon: Home, roles: ["CLIENT", "REALTOR", "ADMIN"] },
    { id: "my", label: "Мои объекты", icon: Heart, roles: ["CLIENT", "REALTOR"] },
    { id: "property-new", label: "Новый объект", icon: Plus, roles: ["REALTOR"] },
    { id: "chat", label: "Чат", icon: MessageSquare, roles: ["CLIENT", "REALTOR"] },
    { id: "admin-analytics", label: "Аналитика", icon: BarChart3, roles: ["ADMIN"] },
    { id: "admin-reports", label: "Отчеты", icon: FileText, roles: ["ADMIN"] },
    { id: "admin", label: "Администрирование", icon: ShieldCheck, roles: ["ADMIN"] },
    { id: "profile", label: "Профиль", icon: User, roles: ["CLIENT", "REALTOR", "ADMIN"] }
  ].filter((item) => item.roles.includes(currentUser.role));

  const logout = () => {
    mutate((draft) => {
      draft.sessionUserId = "";
    });
    go("dashboard");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button className="brand-button" onClick={() => go("dashboard")}>
          <Building2 size={26} />
          <span>Аспект-сити</span>
        </button>
        <nav className="nav-list" aria-label="Основная навигация">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = route.name === item.id || (item.id === "catalog" && route.name === "property");
            return (
              <button
                key={item.id}
                className={active ? "active" : ""}
                onClick={() => {
                  go(item.id);
                  setMenuOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" title="Меню" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={20} />
          </button>
          <div>
            <p className="eyebrow">{ROLE_LABELS[currentUser.role]}</p>
            <h2>{pageTitle(route.name, currentUser.role)}</h2>
          </div>
          <div className="topbar-user">
            <span className="avatar">{currentUser.avatar || currentUser.name.slice(0, 2)}</span>
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.email}</span>
            </div>
            <button className="icon-button" title="Выйти" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content">
          <PageRouter context={context} />
        </main>
      </div>
    </div>
  );
}

function pageTitle(page, role) {
  const titles = {
    landing: "Главная страница",
    dashboard: role === "ADMIN" ? "Пользователи и контроль платформы" : "Рабочий дашборд",
    catalog: "Каталог объектов",
    my: "Мои объекты и заявки",
    "property-new": "Создание объекта",
    "property-edit": "Редактирование объекта",
    property: "Детали объекта",
    profile: "Профиль пользователя",
    chat: "Чат с клиентами и риелторами",
    "admin-analytics": "Аналитика платформы",
    "admin-reports": "Отчеты и экспорт",
    admin: "Администрирование"
  };
  return titles[page] || "Платформа";
}

function PageRouter({ context }) {
  const { route, currentUser } = context;
  if (route.name === "landing") return <LandingPage context={context} />;
  if (route.name === "catalog") return <CatalogPage context={context} />;
  if (route.name === "my") return <MyObjectsPage context={context} />;
  if (route.name === "property-new") return <PropertyEditor context={context} />;
  if (route.name === "property-edit") return <PropertyEditor context={context} propertyId={route.id} />;
  if (route.name === "property") return <PropertyDetails context={context} propertyId={route.id} />;
  if (route.name === "profile") return <ProfilePage context={context} />;
  if (route.name === "chat") return <ChatPage context={context} />;
  if (route.name === "admin-analytics") return <AdminAnalyticsPage context={context} />;
  if (route.name === "admin-reports") return <AdminReportsPage context={context} />;
  if (route.name === "admin") return <AdminPage context={context} />;
  if (currentUser.role === "CLIENT") return <ClientDashboard context={context} />;
  if (currentUser.role === "REALTOR") return <RealtorDashboard context={context} />;
  return <AdminPage context={context} compact />;
}

function Badge({ children, tone = "neutral" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function StatCard({ icon: Icon, label, value, hint, tone = "plain" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <Icon size={21} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}

function ClientDashboard({ context }) {
  const { state, currentUser } = context;
  const myRequests = state.requests.filter((request) => request.clientId === currentUser.id);
  const favoriteIds = state.favorites.filter((item) => item.userId === currentUser.id).map((item) => item.propertyId);
  const recommendations = getRecommendations(state.properties, favoriteIds).slice(0, 3);

  return (
    <div className="stack">
      <section className="stat-grid">
        <StatCard icon={CalendarClock} label="Заявки" value={myRequests.length} hint="активность клиента" />
        <StatCard
          icon={Check}
          label="Подтверждено"
          value={myRequests.filter((item) => item.status === "Подтвержден").length}
          tone="green"
        />
        <StatCard icon={Heart} label="Избранное" value={favoriteIds.length} tone="rose" />
        <StatCard icon={Star} label="Рекомендации" value={recommendations.length} tone="amber" />
      </section>

      <section className="split-layout">
        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Прогресс</p>
              <h3>Заявки на просмотры</h3>
            </div>
            <button className="icon-text" onClick={() => downloadReport("client-requests", state, currentUser)}>
              <Download size={17} />
              Отчет по заявкам
            </button>
          </div>
          <div className="request-list">
            {myRequests.map((request) => {
              const property = state.properties.find((item) => item.id === request.propertyId);
              return (
                <article className="request-row" key={request.id}>
                  <img src={property?.photos[0]} alt={property?.title} />
                  <div>
                    <strong>{property?.title}</strong>
                    <span>{formatDateTime(request.scheduledAt)}</span>
                  </div>
                  <Badge tone={REQUEST_CLASS[request.status]}>{request.status}</Badge>
                </article>
              );
            })}
            {!myRequests.length && <EmptyState text="Пока нет записей на просмотр" />}
          </div>
        </div>
        <HotZones context={context} />
      </section>

      <section>
        <div className="section-header">
          <div>
            <p className="eyebrow">Подбор</p>
            <h3>Рекомендации по просмотрам и избранному</h3>
          </div>
          <button className="icon-text" onClick={() => go("catalog")}>
            <Search size={17} />
            Открыть каталог
          </button>
        </div>
        <div className="property-grid compact">
          {recommendations.map((property) => (
            <PropertyCard key={property.id} property={property} context={context} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function RealtorDashboard({ context }) {
  const { state, currentUser, mutate, showToast } = context;
  const ownProperties = state.properties.filter((property) => property.realtorId === currentUser.id);
  const ownRequests = state.requests.filter((request) => request.realtorId === currentUser.id);
  const active = ownProperties.filter((property) => property.status === "Активно");
  const conversion = ownProperties.length
    ? Math.round((ownRequests.length / Math.max(ownProperties.reduce((sum, item) => sum + item.views, 0), 1)) * 1000) / 10
    : 0;

  const updateRequest = (requestId, status) => {
    mutate((draft) => {
      const request = draft.requests.find((item) => item.id === requestId);
      request.status = status;
    });
    showToast(status === "Подтвержден" ? "Показ подтвержден" : "Заявка отклонена");
  };

  return (
    <div className="stack">
      <section className="stat-grid">
        <StatCard icon={Building2} label="Мои объекты" value={ownProperties.length} />
        <StatCard icon={Eye} label="Просмотры" value={ownProperties.reduce((sum, item) => sum + item.views, 0)} tone="green" />
        <StatCard icon={CalendarClock} label="Заявки" value={ownRequests.length} tone="amber" />
        <StatCard icon={BarChart3} label="Конверсия" value={`${conversion}%`} tone="rose" />
      </section>

      <section className="split-layout">
        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Аналитика</p>
              <h3>Просмотры и заявки</h3>
            </div>
            <button className="icon-text" onClick={() => downloadReport("realtor-objects", state, currentUser)}>
              <Download size={17} />
              Отчет по объектам
            </button>
          </div>
          <div className="bar-chart">
            {ownProperties.slice(0, 6).map((property) => {
              const requests = ownRequests.filter((request) => request.propertyId === property.id).length;
              return (
                <div className="bar-row" key={property.id}>
                  <span>{property.title}</span>
                  <div className="bar-track">
                    <i style={{ width: `${Math.min(property.views / 6, 100)}%` }} />
                    <b style={{ width: `${Math.min(requests * 18, 100)}%` }} />
                  </div>
                  <strong>{requests}</strong>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Заявки</p>
              <h3>Управление показами</h3>
            </div>
            <button className="icon-text" onClick={() => go("property-new")}>
              <Plus size={17} />
              Объект
            </button>
          </div>
          <div className="request-list">
            {ownRequests.map((request) => {
              const property = state.properties.find((item) => item.id === request.propertyId);
              const client = state.users.find((item) => item.id === request.clientId);
              return (
                <article className="request-row wide" key={request.id}>
                  <img src={property?.photos[0]} alt={property?.title} />
                  <div>
                    <strong>{client?.name}</strong>
                    <span>{property?.title} · {formatDateTime(request.scheduledAt)}</span>
                  </div>
                  <Badge tone={REQUEST_CLASS[request.status]}>{request.status}</Badge>
                  <div className="row-actions">
                    <button className="icon-button" title="Подтвердить" onClick={() => updateRequest(request.id, "Подтвержден")}>
                      <Check size={17} />
                    </button>
                    <button className="icon-button danger" title="Отклонить" onClick={() => updateRequest(request.id, "Отклонен")}>
                      <X size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ClientsActivityTable state={state} realtorId={currentUser.id} />
      <section>
        <div className="section-header">
          <div>
            <p className="eyebrow">Активные объекты</p>
            <h3>Быстрый доступ</h3>
          </div>
        </div>
        <div className="property-grid compact">
          {active.slice(0, 3).map((property) => (
            <PropertyCard key={property.id} property={property} context={context} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function ClientsActivityTable({ state, realtorId }) {
  const rows = state.users
    .filter((user) => user.role === "CLIENT")
    .map((client) => {
      const requests = state.requests.filter((request) => request.clientId === client.id && request.realtorId === realtorId);
      const last = requests.map((request) => request.createdAt).sort().at(-1);
      return { client, count: requests.length, last };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || new Date(b.last) - new Date(a.last));

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Клиенты</p>
          <h3>Активность по заявкам</h3>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Телефон</th>
              <th>Заявок</th>
              <th>Последняя активность</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ client, count, last }) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.phone}</td>
                <td>{count}</td>
                <td>{formatDate(last)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CatalogPage({ context }) {
  const { state, mutate, currentUser, showToast } = context;
  const [bookingProperty, setBookingProperty] = useState(null);
  const searchRef = useRef(null);
  const filtered = useMemo(() => filterProperties(state.properties, state.filters), [state.properties, state.filters]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const setFilter = (key, value) => {
    mutate((draft) => {
      draft.filters[key] = value;
      if (key === "priceMin" && Number(value) > Number(draft.filters.priceMax)) {
        draft.filters.priceMax = value;
      }
      if (key === "priceMax" && Number(value) < Number(draft.filters.priceMin)) {
        draft.filters.priceMin = value;
      }
    });
  };

  const resetFilters = () => {
    mutate((draft) => {
      draft.filters = structuredClone(defaultFilters);
    });
    showToast("Фильтры и сортировка сброшены");
  };

  const resetSettings = () => {
    mutate((draft) => {
      draft.filters = structuredClone(defaultFilters);
      draft.favorites = draft.favorites.filter((item) => item.userId !== currentUser.id);
    });
    showToast("Настройки пользователя очищены");
  };

  return (
    <div className="stack">
      <section className="catalog-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            ref={searchRef}
            autoComplete="off"
            placeholder="Адрес, район или описание"
            value={state.filters.query}
            onChange={(event) => setFilter("query", event.target.value)}
          />
          {state.filters.query && (
            <button className="clear-button" title="Очистить" onClick={() => setFilter("query", "")}>
              <X size={16} />
            </button>
          )}
        </label>
        <label>
          <ArrowUpDown size={16} />
          <select value={state.filters.sort} onChange={(event) => setFilter("sort", event.target.value)}>
            <option value="dateDesc">Сначала новые</option>
            <option value="priceAsc">Цена по возрастанию</option>
            <option value="priceDesc">Цена по убыванию</option>
            <option value="areaDesc">Больше площадь</option>
            <option value="viewsDesc">Популярные</option>
          </select>
        </label>
        <button className="icon-text" onClick={resetFilters}>
          <RotateCcw size={17} />
          Сбросить фильтры
        </button>
        <button className="icon-text danger-text" onClick={resetSettings}>
          <Trash2 size={17} />
          Сбросить все настройки
        </button>
      </section>

      <section className="filters-panel">
        <div className="filter-title">
          <Filter size={18} />
          <strong>Фильтрация</strong>
        </div>
        <label>
          Тип
          <select value={state.filters.type} onChange={(event) => setFilter("type", event.target.value)}>
            <option>Все</option>
            {propertyTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Комнаты
          <select value={state.filters.rooms} onChange={(event) => setFilter("rooms", event.target.value)}>
            <option>Все</option>
            {[1, 2, 3, 4, 5].map((room) => (
              <option key={room}>{room}</option>
            ))}
          </select>
        </label>
        <label>
          Район
          <select value={state.filters.district} onChange={(event) => setFilter("district", event.target.value)}>
            <option>Все</option>
            {districts.map((district) => (
              <option key={district}>{district}</option>
            ))}
          </select>
        </label>
        <label>
          Статус
          <select value={state.filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <option>Все</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <div className="range-box">
          <span>Цена от {formatMoney(state.filters.priceMin).replace(" / мес.", "")}</span>
          <input
            type="range"
            min="0"
            max="200000"
            step="500"
            value={state.filters.priceMin}
            onChange={(event) => setFilter("priceMin", event.target.value)}
          />
        </div>
        <div className="range-box">
          <span>до {formatMoney(state.filters.priceMax).replace(" / мес.", "")}</span>
          <input
            type="range"
            min="0"
            max="200000"
            step="500"
            value={state.filters.priceMax}
            onChange={(event) => setFilter("priceMax", event.target.value)}
          />
        </div>
      </section>

      <div className="result-line">
        <strong>{filtered.length}</strong>
        <span>объектов найдено</span>
      </div>

      {filtered.length ? (
        <section className="property-grid">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} context={context} onBook={setBookingProperty} />
          ))}
        </section>
      ) : (
        <EmptyState text="Извините, совпадений не обнаружено" />
      )}

      {bookingProperty && (
        <BookingDialog property={bookingProperty} context={context} onClose={() => setBookingProperty(null)} />
      )}
    </div>
  );
}

function PropertyCard({ property, context, onBook, compact = false }) {
  const { state, currentUser, mutate, showToast } = context;
  const realtor = state.users.find((user) => user.id === property.realtorId);
  const favorite = state.favorites.some((item) => item.userId === currentUser.id && item.propertyId === property.id);

  const toggleFavorite = (event) => {
    event.stopPropagation();
    mutate((draft) => {
      const existing = draft.favorites.findIndex((item) => item.userId === currentUser.id && item.propertyId === property.id);
      if (existing >= 0) draft.favorites.splice(existing, 1);
      else draft.favorites.push({ userId: currentUser.id, propertyId: property.id });
    });
    showToast(favorite ? "Удалено из избранного" : "Добавлено в избранное");
  };

  return (
    <article className={`property-card ${compact ? "compact" : ""}`}>
      <button className="media-button" onClick={() => go(`property/${property.id}`)}>
        <img src={property.photos[0]} alt={property.title} />
        <Badge tone={STATUS_CLASS[property.status]}>{property.status}</Badge>
      </button>
      <div className="property-body">
        <div className="property-heading">
          <button onClick={() => go(`property/${property.id}`)}>{property.title}</button>
          <button className={`icon-button ${favorite ? "filled" : ""}`} title="Избранное" onClick={toggleFavorite}>
            <Heart size={18} />
          </button>
        </div>
        <p>{property.address}</p>
        <div className="property-meta">
          <span>{property.rooms} комн.</span>
          <span>{property.area} м²</span>
          <span>{property.district}</span>
        </div>
        <div className="property-footer">
          <strong>{formatMoney(property.price, property.dealType)}</strong>
          <span>{realtor?.name}</span>
        </div>
        <div className="card-actions">
          <button className="icon-text" onClick={() => go(`property/${property.id}`)}>
            <Eye size={17} />
            Детали
          </button>
          {currentUser.role === "CLIENT" && property.status === "Активно" && (
            <button className="icon-text accent" onClick={() => onBook?.(property)}>
              <CalendarClock size={17} />
              Записаться
            </button>
          )}
          {currentUser.role === "CLIENT" && (
            <button className="icon-text" onClick={() => go("chat")}>
              <MessageSquare size={17} />
              Чат
            </button>
          )}
          {currentUser.role === "REALTOR" && property.realtorId === currentUser.id && (
            <button className="icon-text" onClick={() => go(`property-edit/${property.id}`)}>
              <Edit3 size={17} />
              Изменить
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function BookingDialog({ property, context, onClose }) {
  const { currentUser, mutate, showToast } = context;
  const [scheduledAt, setScheduledAt] = useState("2026-05-22T18:00");
  const [comment, setComment] = useState("");

  const submit = (event) => {
    event.preventDefault();
    mutate((draft) => {
      draft.requests.push({
        id: id("r"),
        propertyId: property.id,
        clientId: currentUser.id,
        realtorId: property.realtorId,
        scheduledAt,
        status: "Ожидает",
        comment,
        createdAt: new Date().toISOString().slice(0, 10)
      });
    });
    showToast("Заявка отправлена риелтору");
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal" onSubmit={submit}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Показ</p>
            <h3>{property.title}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <label>
          Удобное время
          <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
        </label>
        <label>
          Комментарий
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} />
        </label>
        <button className="primary-action" type="submit">
          Отправить заявку
        </button>
      </form>
    </div>
  );
}

function PropertyDetails({ context, propertyId }) {
  const { state, currentUser } = context;
  const property = state.properties.find((item) => item.id === propertyId);
  const [photo, setPhoto] = useState(0);
  const realtor = state.users.find((user) => user.id === property?.realtorId);

  if (!property) return <EmptyState text="Объект не найден" />;

  return (
    <div className="detail-layout">
      <section className="detail-main">
        <div className="detail-hero">
          <img src={property.photos[photo]} alt={property.title} />
          <div className="hero-overlay">
            <Badge tone={STATUS_CLASS[property.status]}>{property.status}</Badge>
            <strong>{formatMoney(property.price, property.dealType)}</strong>
          </div>
        </div>
        <div className="thumb-row">
          {property.photos.map((src, index) => (
            <button key={src} className={photo === index ? "active" : ""} onClick={() => setPhoto(index)}>
              <img src={src} alt={`${property.title} фото ${index + 1}`} />
            </button>
          ))}
        </div>
        <section>
          <div className="section-header">
            <div>
              <p className="eyebrow">{property.type} · {property.district}</p>
              <h3>{property.title}</h3>
            </div>
          </div>
          <p className="lead-text">{property.description}</p>
          <div className="fact-grid">
            <span><strong>{property.rooms}</strong> комнат</span>
            <span><strong>{property.area}</strong> м²</span>
            <span><strong>{property.views}</strong> просмотров</span>
            <span><strong>{formatDate(property.createdAt)}</strong> добавлено</span>
          </div>
        </section>

        <section className="virtual-tour">
          <div className="section-header">
            <div>
              <p className="eyebrow">Виртуальный тур</p>
              <h3>Обзор пространства</h3>
            </div>
          </div>
          <div className="tour-stage" style={{ backgroundImage: `url(${property.photos[1] || property.photos[0]})` }}>
            <button style={{ top: "40%", left: "28%" }}>Кухня</button>
            <button style={{ top: "58%", left: "55%" }}>Гостиная</button>
            <button style={{ top: "34%", left: "74%" }}>Окно</button>
          </div>
        </section>
      </section>

      <aside className="detail-side">
        <section className="panel">
          <div className="contact-card">
            <span className="avatar large">{realtor?.avatar}</span>
            <div>
              <p className="eyebrow">Риелтор</p>
              <h3>{realtor?.name}</h3>
              <span>{realtor?.phone}</span>
            </div>
          </div>
          {currentUser.role === "CLIENT" && (
            <button className="primary-action" onClick={() => go("chat")}>
              Написать риелтору
            </button>
          )}
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Карта</p>
              <h3>{property.address}</h3>
            </div>
          </div>
          <div className="mini-map">
            <MapPin size={28} />
          </div>
        </section>

        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">История</p>
              <h3>Изменение цены</h3>
            </div>
          </div>
          <div className="timeline">
            {property.priceHistory.map((item) => (
              <div key={item.date}>
                <span>{formatDate(item.date)}</span>
                <strong>{formatMoney(item.price, property.dealType)}</strong>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function MyObjectsPage({ context }) {
  const { state, currentUser, mutate, showToast } = context;

  if (currentUser.role === "CLIENT") {
    const myRequests = state.requests.filter((request) => request.clientId === currentUser.id);
    const favoriteIds = state.favorites.filter((item) => item.userId === currentUser.id).map((item) => item.propertyId);
    const favorites = state.properties.filter((property) => favoriteIds.includes(property.id));

    return (
      <div className="stack">
        <section className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Мои записи</p>
              <h3>Объекты, на которые отправлены заявки</h3>
            </div>
          </div>
          <div className="request-list">
            {myRequests.map((request) => {
              const property = state.properties.find((item) => item.id === request.propertyId);
              return (
                <article className="request-row wide" key={request.id}>
                  <img src={property?.photos[0]} alt={property?.title} />
                  <div>
                    <strong>{property?.title}</strong>
                    <span>{property?.address} · {formatDateTime(request.scheduledAt)}</span>
                  </div>
                  <Badge tone={REQUEST_CLASS[request.status]}>{request.status}</Badge>
                </article>
              );
            })}
          </div>
        </section>
        <section>
          <div className="section-header">
            <div>
              <p className="eyebrow">Избранное</p>
              <h3>Сохраненные объекты</h3>
            </div>
          </div>
          <div className="property-grid compact">
            {favorites.map((property) => (
              <PropertyCard key={property.id} property={property} context={context} compact />
            ))}
            {!favorites.length && <EmptyState text="В избранном пока пусто" />}
          </div>
        </section>
      </div>
    );
  }

  const ownProperties = state.properties.filter((property) => property.realtorId === currentUser.id);
  const removeProperty = (propertyId) => {
    mutate((draft) => {
      draft.properties = draft.properties.filter((property) => property.id !== propertyId);
      draft.requests = draft.requests.filter((request) => request.propertyId !== propertyId);
      draft.favorites = draft.favorites.filter((favorite) => favorite.propertyId !== propertyId);
    });
    showToast("Объект удален");
  };

  return (
    <div className="stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Риелтор</p>
          <h3>Созданные объекты</h3>
        </div>
        <button className="icon-text accent" onClick={() => go("property-new")}>
          <Plus size={17} />
          Создать объект
        </button>
      </div>
      <div className="property-grid">
        {ownProperties.map((property) => (
          <article className="property-card" key={property.id}>
            <button className="media-button" onClick={() => go(`property/${property.id}`)}>
              <img src={property.photos[0]} alt={property.title} />
              <Badge tone={STATUS_CLASS[property.status]}>{property.status}</Badge>
            </button>
            <div className="property-body">
              <div className="property-heading">
                <button onClick={() => go(`property/${property.id}`)}>{property.title}</button>
              </div>
              <p>{property.address}</p>
              <div className="property-meta">
                <span>{property.views} просмотров</span>
                <span>{state.requests.filter((request) => request.propertyId === property.id).length} заявок</span>
              </div>
              <div className="card-actions">
                <button className="icon-text" onClick={() => go(`property-edit/${property.id}`)}>
                  <Edit3 size={17} />
                  Редактировать
                </button>
                <button className="icon-text danger-text" onClick={() => removeProperty(property.id)}>
                  <Trash2 size={17} />
                  Удалить
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function PropertyEditor({ context, propertyId }) {
  const { state, currentUser, mutate, showToast } = context;
  const existing = state.properties.find((property) => property.id === propertyId);
  const [dragIndex, setDragIndex] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [checkTitle, setCheckTitle] = useState("");
  const [form, setForm] = useState(() =>
    existing
      ? structuredClone(existing)
      : {
          id: "",
          title: "",
          type: "Квартира",
          dealType: "Продажа",
          status: "Активно",
          rooms: 1,
          price: 70000,
          area: 45,
          district: "Центр",
          address: "Могилев, ",
          description: "",
          realtorId: currentUser.id,
          views: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          coordinates: [53.9, 30.33],
          photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82"],
          priceHistory: [{ date: new Date().toISOString().slice(0, 10), price: 70000 }],
          notes: {
            internalComment: "",
            ownerConversation: "",
            personalRating: 3,
            reminderAt: "",
            fileLinks: [],
            checklist: []
          }
        }
  );

  if (currentUser.role !== "REALTOR") return <EmptyState text="Создание и редактирование объектов доступно риелтору" />;
  if (existing && existing.realtorId !== currentUser.id) return <EmptyState text="Этот объект закреплен за другим риелтором" />;

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const updateNote = (key, value) => setForm((previous) => ({ ...previous, notes: { ...previous.notes, [key]: value } }));

  const addPhoto = () => {
    if (!photoUrl.trim()) return;
    setForm((previous) => ({ ...previous, photos: [...previous.photos, photoUrl.trim()] }));
    setPhotoUrl("");
  };

  const dropPhoto = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setForm((previous) => {
      const photos = [...previous.photos];
      const [moved] = photos.splice(dragIndex, 1);
      photos.splice(targetIndex, 0, moved);
      return { ...previous, photos };
    });
    setDragIndex(null);
  };

  const save = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.address.trim() || !form.description.trim()) {
      showToast("Заполните название, адрес и описание");
      return;
    }
    mutate((draft) => {
      if (existing) {
        const index = draft.properties.findIndex((property) => property.id === existing.id);
        draft.properties[index] = form;
      } else {
        draft.properties.unshift({ ...form, id: id("p"), realtorId: currentUser.id });
      }
    });
    showToast(existing ? "Объект обновлен" : "Объект создан");
    go("my");
  };

  const addChecklistItem = () => {
    if (!checkTitle.trim()) return;
    updateNote("checklist", [...form.notes.checklist, { id: id("c"), title: checkTitle.trim(), done: false }]);
    setCheckTitle("");
  };

  return (
    <form className="editor-grid" onSubmit={save}>
      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Объект</p>
            <h3>Основная информация</h3>
          </div>
          <button className="icon-text accent" type="submit">
            <Save size={17} />
            Сохранить
          </button>
        </div>
        <div className="form-grid">
          <label>
            Название
            <input value={form.title} onChange={(event) => update("title", event.target.value)} />
          </label>
          <label>
            Адрес
            <input value={form.address} onChange={(event) => update("address", event.target.value)} />
          </label>
          <label>
            Тип
            <select value={form.type} onChange={(event) => update("type", event.target.value)}>
              {propertyTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Сделка
            <select value={form.dealType} onChange={(event) => update("dealType", event.target.value)}>
              <option>Продажа</option>
              <option>Аренда</option>
            </select>
          </label>
          <label>
            Статус
            <select value={form.status} onChange={(event) => update("status", event.target.value)}>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Район
            <select value={form.district} onChange={(event) => update("district", event.target.value)}>
              {districts.map((district) => (
                <option key={district}>{district}</option>
              ))}
            </select>
          </label>
          <label>
            Комнат
            <input type="number" min="1" value={form.rooms} onChange={(event) => update("rooms", Number(event.target.value))} />
          </label>
          <label>
            Площадь, м²
            <input type="number" min="1" value={form.area} onChange={(event) => update("area", Number(event.target.value))} />
          </label>
          <label>
            Цена, $
            <input type="number" min="0" value={form.price} onChange={(event) => update("price", Number(event.target.value))} />
          </label>
          <label className="wide-field">
            Описание
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Медиа</p>
            <h3>Фотографии</h3>
          </div>
        </div>
        <div className="photo-uploader">
          <input value={photoUrl} placeholder="URL фотографии" onChange={(event) => setPhotoUrl(event.target.value)} />
          <button className="icon-button" type="button" title="Добавить фото" onClick={addPhoto}>
            <Plus size={18} />
          </button>
        </div>
        <div className="photo-list">
          {form.photos.map((src, index) => (
            <div
              className="photo-sort-item"
              key={`${src}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropPhoto(index)}
            >
              <GripVertical size={18} />
              <img src={src} alt={`Фото ${index + 1}`} />
              <button
                className="icon-button danger"
                type="button"
                onClick={() => setForm((previous) => ({ ...previous, photos: previous.photos.filter((_, i) => i !== index) }))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel editor-wide">
        <div className="section-header">
          <div>
            <p className="eyebrow">Блокнот риелтора</p>
            <h3>Углубленные данные</h3>
          </div>
        </div>
        <div className="form-grid">
          <label className="wide-field">
            Внутренний комментарий
            <textarea value={form.notes.internalComment} onChange={(event) => updateNote("internalComment", event.target.value)} />
          </label>
          <label className="wide-field">
            История общения с собственником
            <textarea value={form.notes.ownerConversation} onChange={(event) => updateNote("ownerConversation", event.target.value)} />
          </label>
          <label>
            Личная оценка
            <input
              type="range"
              min="1"
              max="5"
              value={form.notes.personalRating}
              onChange={(event) => updateNote("personalRating", Number(event.target.value))}
            />
          </label>
          <label>
            Напоминание
            <input
              type="datetime-local"
              value={form.notes.reminderAt}
              onChange={(event) => updateNote("reminderAt", event.target.value)}
            />
          </label>
        </div>
        <div className="checklist-editor">
          <div className="photo-uploader">
            <input value={checkTitle} placeholder="Пункт чек-листа" onChange={(event) => setCheckTitle(event.target.value)} />
            <button className="icon-button" type="button" onClick={addChecklistItem}>
              <Plus size={18} />
            </button>
          </div>
          {form.notes.checklist.map((item) => (
            <label className="check-row" key={item.id}>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() =>
                  updateNote(
                    "checklist",
                    form.notes.checklist.map((entry) => (entry.id === item.id ? { ...entry, done: !entry.done } : entry))
                  )
                }
              />
              <span>{item.title}</span>
            </label>
          ))}
        </div>
      </section>
    </form>
  );
}

function ProfilePage({ context }) {
  const { currentUser, mutate, showToast } = context;
  const [form, setForm] = useState(structuredClone(currentUser));

  const save = (event) => {
    event.preventDefault();
    mutate((draft) => {
      const index = draft.users.findIndex((user) => user.id === currentUser.id);
      draft.users[index] = form;
    });
    showToast("Профиль сохранен");
  };

  return (
    <form className="profile-layout" onSubmit={save}>
      <section className="panel">
        <div className="profile-head">
          <span className="avatar huge">{form.avatar || form.name.slice(0, 2)}</span>
          <div>
            <p className="eyebrow">{ROLE_LABELS[form.role]}</p>
            <h3>{form.name}</h3>
            <span>{form.email}</span>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Имя
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Телефон
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            Пароль
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
          <label className="wide-field">
            Аватар или инициалы
            <input value={form.avatar} onChange={(event) => setForm({ ...form, avatar: event.target.value })} />
          </label>
          {form.role === "REALTOR" && (
            <label className="wide-field">
              Фото лицензии
              <input value={form.licensePhoto || ""} onChange={(event) => setForm({ ...form, licensePhoto: event.target.value })} />
            </label>
          )}
        </div>
        <button className="primary-action" type="submit">
          Сохранить профиль
        </button>
      </section>
      {form.role === "REALTOR" && form.licensePhoto && (
        <section className="panel license-preview">
          <div className="section-header">
            <div>
              <p className="eyebrow">Документ</p>
              <h3>Лицензия</h3>
            </div>
            <Camera size={19} />
          </div>
          <img src={form.licensePhoto} alt="Лицензия риелтора" />
        </section>
      )}
    </form>
  );
}

const ADMIN_REPORT_TYPES = [
  { id: "summary", title: "Сводный отчет", description: "KPI платформы, спрос, сделки и коммуникации" },
  { id: "properties", title: "Отчет по объектам", description: "Каталог, статусы, цены, просмотры и риелторы" },
  { id: "users", title: "Отчет по пользователям", description: "Роли, блокировки, регистрации и активность" },
  { id: "requests", title: "Отчет по заявкам", description: "Показы, статусы, клиенты и объекты" },
  { id: "realtors", title: "Отчет по риелторам", description: "Объекты, заявки, сообщения и конверсия" },
  { id: "messages", title: "Отчет по сообщениям", description: "Диалоги клиентов и риелторов по объектам" }
];

function AdminReportsPage({ context }) {
  const { state, mutate, showToast } = context;
  const [type, setType] = useState("summary");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [createdId, setCreatedId] = useState("");
  const report = useMemo(() => buildAdminReport(state, type, { dateFrom, dateTo }), [state, type, dateFrom, dateTo]);
  const selectedType = ADMIN_REPORT_TYPES.find((item) => item.id === type);

  const createReport = () => {
    const storedReport = {
      ...report,
      id: id("report"),
      type,
      createdAt: new Date().toLocaleString("ru-RU"),
      period: report.period
    };
    mutate((draft) => {
      draft.adminReports.unshift(storedReport);
    });
    setCreatedId(storedReport.id);
    showToast("Отчет сформирован");
  };

  return (
    <div className="reports-layout">
      <section className="panel report-builder">
        <div className="section-header">
          <div>
            <p className="eyebrow">Конструктор</p>
            <h3>Создание отчета</h3>
          </div>
          <FileText size={20} />
        </div>

        <div className="report-type-list">
          {ADMIN_REPORT_TYPES.map((item) => (
            <button key={item.id} className={type === item.id ? "active" : ""} onClick={() => setType(item.id)}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>

        <div className="report-period">
          <label>
            Дата от
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label>
            Дата до
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </div>

        <div className="report-actions">
          <button className="primary-action" onClick={createReport}>
            Сформировать отчет
          </button>
          <button className="icon-text" onClick={() => exportReportExcel(report)}>
            <Download size={17} />
            Excel
          </button>
          <button className="icon-text" onClick={() => exportReportPdf(report)}>
            <Download size={17} />
            PDF
          </button>
        </div>

        <div className="report-note">
          <strong>PDF с русским текстом</strong>
          <span>Экспорт выполняется через встроенный шрифт Roboto, поэтому кириллица в PDF отображается нормально.</span>
        </div>
      </section>

      <section className="panel report-preview">
        <div className="section-header">
          <div>
            <p className="eyebrow">{selectedType?.title}</p>
            <h3>{report.title}</h3>
          </div>
          <Badge tone="success">{report.rows.length} строк</Badge>
        </div>
        <div className="report-meta">
          <span>Период: {report.period}</span>
          <span>Создан: {new Date().toLocaleString("ru-RU")}</span>
        </div>
        <ReportTable report={report} limit={12} />
      </section>

      <section className="panel reports-history">
        <div className="section-header">
          <div>
            <p className="eyebrow">История</p>
            <h3>Сформированные отчеты</h3>
          </div>
        </div>
        <div className="report-history-list">
          {state.adminReports.map((item) => (
            <article key={item.id} className={createdId === item.id ? "fresh" : ""}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.createdAt} · {item.period} · {item.rows.length} строк</span>
              </div>
              <div className="row-actions">
                <button className="icon-button" title="Excel" onClick={() => exportReportExcel(item)}>
                  <FileText size={16} />
                </button>
                <button className="icon-button" title="PDF" onClick={() => exportReportPdf(item)}>
                  <Download size={16} />
                </button>
              </div>
            </article>
          ))}
          {!state.adminReports.length && <EmptyState text="Пока нет сформированных отчетов" />}
        </div>
      </section>
    </div>
  );
}

function ReportTable({ report, limit }) {
  const rows = limit ? report.rows.slice(0, limit) : report.rows;
  return (
    <div className="table-wrap report-table">
      <table>
        <thead>
          <tr>
            {report.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.join("-")}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {report.rows.length > rows.length && <p className="report-truncated">В предпросмотре показаны первые {rows.length} строк.</p>}
    </div>
  );
}

function buildAdminReport(state, type, filters) {
  const analytics = buildAdminAnalytics(state);
  const period = getReportPeriodLabel(filters);
  const inRange = (value) => dateInRange(value, filters);
  const usersById = new Map(state.users.map((user) => [user.id, user]));
  const propertiesById = new Map(state.properties.map((property) => [property.id, property]));

  if (type === "properties") {
    return {
      title: "Отчет по объектам недвижимости",
      period,
      columns: ["Объект", "Тип", "Район", "Статус", "Цена", "Площадь", "Просмотры", "Риелтор"],
      rows: state.properties
        .filter((property) => inRange(property.createdAt))
        .map((property) => [
          property.title,
          property.type,
          property.district,
          property.status,
          formatMoney(property.price, property.dealType),
          `${property.area} м²`,
          property.views,
          usersById.get(property.realtorId)?.name || "Не назначен"
        ])
    };
  }

  if (type === "users") {
    return {
      title: "Отчет по пользователям платформы",
      period,
      columns: ["Пользователь", "Роль", "Email", "Телефон", "Статус", "Дата регистрации", "Последняя активность"],
      rows: state.users
        .filter((user) => inRange(user.registeredAt))
        .map((user) => [
          user.name,
          ROLE_LABELS[user.role] || user.role,
          user.email,
          user.phone,
          user.status === "ACTIVE" ? "Активен" : `Заблокирован: ${user.blockReason || "причина не указана"}`,
          formatDate(user.registeredAt),
          user.lastActiveAt || "Нет данных"
        ])
    };
  }

  if (type === "requests") {
    return {
      title: "Отчет по заявкам на показы",
      period,
      columns: ["Объект", "Клиент", "Риелтор", "Дата показа", "Статус", "Комментарий"],
      rows: state.requests
        .filter((request) => inRange(request.createdAt))
        .map((request) => {
          const property = propertiesById.get(request.propertyId);
          return [
            property?.title || "Объект удален",
            usersById.get(request.clientId)?.name || "Клиент удален",
            usersById.get(request.realtorId)?.name || "Риелтор удален",
            formatDateTime(request.scheduledAt),
            request.status,
            request.comment || ""
          ];
        })
    };
  }

  if (type === "realtors") {
    return {
      title: "Отчет по эффективности риелторов",
      period,
      columns: ["Риелтор", "Объекты", "Активные объекты", "Просмотры", "Заявки", "Сообщения", "Конверсия"],
      rows: analytics.realtorRows.map((row) => [
        row.name,
        row.properties,
        row.activeObjects,
        row.views,
        row.requests,
        row.messages,
        `${row.conversion}%`
      ])
    };
  }

  if (type === "messages") {
    return {
      title: "Отчет по сообщениям клиентов и риелторов",
      period,
      columns: ["Дата", "Отправитель", "Клиент", "Риелтор", "Объект", "Сообщение", "Прочитано"],
      rows: (state.messages || [])
        .filter((message) => inRange(message.createdAt))
        .map((message) => [
          message.createdAt,
          usersById.get(message.senderId)?.name || "Неизвестно",
          usersById.get(message.clientId)?.name || "Клиент удален",
          usersById.get(message.realtorId)?.name || "Риелтор удален",
          propertiesById.get(message.propertyId)?.title || "Общий диалог",
          message.text,
          message.readAt ? "Да" : "Нет"
        ])
    };
  }

  return {
    title: "Сводный отчет по платформе",
    period,
    columns: ["Показатель", "Значение", "Комментарий"],
    rows: [
      ["Пользователи", state.users.length, `${analytics.activeUsers} активных`],
      ["Клиенты", analytics.clientCount, "Зарегистрированные покупатели и арендаторы"],
      ["Риелторы", analytics.realtorCount, "Сотрудники агентства"],
      ["Объекты", state.properties.length, `${analytics.activeProperties} активных`],
      ["Заявки", state.requests.length, `${analytics.approvedRequests} подтверждено`],
      ["Избранное", state.favorites.length, "Добавления объектов клиентами"],
      ["Сообщения", analytics.messageCount, `${analytics.unreadMessages} непрочитано`],
      ["Средняя цена по районам", formatMoney(Math.round(average(state.properties.map((property) => property.price)))), "Все типы сделок"],
      ["Самый активный район", [...analytics.districtRows].sort((a, b) => b.count - a.count)[0]?.label || "Нет данных", "По количеству объектов"],
      ["Лучший риелтор", analytics.realtorRows[0]?.name || "Нет данных", "По заявкам и просмотрам"]
    ]
  };
}

function exportReportExcel(report) {
  const rows = [report.columns, ...report.rows];
  const xmlRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(String(cell ?? ""))}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Отчет">
  <Table>${xmlRows}</Table>
 </Worksheet>
</Workbook>`;
  downloadBlob(new Blob(["\ufeff", xml], { type: "application/vnd.ms-excel;charset=utf-8" }), `${safeFileName(report.title)}.xls`);
}

async function exportReportPdf(report) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake.js");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts.js");
  const pdfMakeInstance = pdfMakeModule.default || pdfMakeModule;
  const pdfFontsValue = pdfFontsModule.default || pdfFontsModule;
  pdfMakeInstance.vfs = pdfFontsValue.pdfMake?.vfs || pdfFontsValue.vfs || pdfFontsValue;

  const body = [
    report.columns.map((column) => ({ text: String(column), style: "tableHeader" })),
    ...report.rows.map((row) => row.map((cell) => String(cell ?? "")))
  ];
  const docDefinition = {
    pageSize: "A4",
    pageOrientation: report.columns.length > 5 ? "landscape" : "portrait",
    pageMargins: [28, 34, 28, 34],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9
    },
    content: [
      { text: report.title, style: "title" },
      { text: `Период: ${report.period}`, style: "meta" },
      { text: `Дата формирования: ${new Date().toLocaleString("ru-RU")}`, style: "meta" },
      {
        table: {
          headerRows: 1,
          widths: report.columns.map(() => "*"),
          body
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? "#eef4f1" : rowIndex % 2 === 0 ? "#f8faf9" : null),
          hLineColor: () => "#d8dedb",
          vLineColor: () => "#d8dedb"
        }
      }
    ],
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
      meta: { color: "#69716e", margin: [0, 0, 0, 4] },
      tableHeader: { bold: true, color: "#202322" }
    }
  };
  pdfMakeInstance.createPdf(docDefinition).download(`${safeFileName(report.title)}.pdf`);
}

function getReportPeriodLabel({ dateFrom, dateTo }) {
  if (dateFrom && dateTo) return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
  if (dateFrom) return `с ${formatDate(dateFrom)}`;
  if (dateTo) return `до ${formatDate(dateTo)}`;
  return "Все время";
}

function dateInRange(value, { dateFrom, dateTo }) {
  if (!dateFrom && !dateTo) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  if (dateFrom && date < new Date(`${dateFrom}T00:00:00`)) return false;
  if (dateTo && date > new Date(`${dateTo}T23:59:59`)) return false;
  return true;
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  return clean.length ? clean.reduce((sum, value) => sum + Number(value), 0) / clean.length : 0;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function safeFileName(value) {
  return String(value)
    .toLowerCase()
    .replaceAll(" ", "-")
    .replace(/[\\/:*?"<>|]+/g, "")
    .slice(0, 80);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function AdminAnalyticsPage({ context }) {
  const { state } = context;
  const analytics = useMemo(() => buildAdminAnalytics(state), [state]);

  return (
    <div className="stack">
      <section className="stat-grid">
        <StatCard icon={Users} label="Пользователи" value={state.users.length} hint={`${analytics.activeUsers} активных`} />
        <StatCard icon={Building2} label="Объекты" value={state.properties.length} hint={`${analytics.activeProperties} активных`} tone="green" />
        <StatCard icon={CalendarClock} label="Заявки" value={state.requests.length} hint={`${analytics.approvedRequests} подтверждено`} tone="amber" />
        <StatCard icon={MessageSquare} label="Сообщения" value={state.messages.length} hint={`${analytics.unreadMessages} непрочитано`} tone="rose" />
      </section>

      <section className="analytics-grid">
        <div className="panel analytics-large">
          <div className="section-header">
            <div>
              <p className="eyebrow">Динамика</p>
              <h3>Новые объекты и заявки</h3>
            </div>
            <BarChart3 size={20} />
          </div>
          <LineChart data={analytics.timeline} />
        </div>

        <DonutChart title="Роли пользователей" eyebrow="Структура" segments={analytics.roleSegments} />
        <DonutChart title="Статусы объектов" eyebrow="Портфель" segments={analytics.propertyStatusSegments} />
        <DonutChart title="Статусы заявок" eyebrow="Показы" segments={analytics.requestStatusSegments} />
      </section>

      <section className="analytics-grid two-columns">
        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Районы</p>
              <h3>Объекты и спрос</h3>
            </div>
            <MapPin size={20} />
          </div>
          <HorizontalBars rows={analytics.districtRows} />
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Воронка</p>
              <h3>От просмотра к сделке</h3>
            </div>
            <Eye size={20} />
          </div>
          <Funnel stages={analytics.funnel} />
        </div>
      </section>

      <section className="analytics-grid two-columns">
        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Матрица</p>
              <h3>Типы недвижимости по районам</h3>
            </div>
          </div>
          <HeatMap rows={analytics.heatMap} max={analytics.heatMax} />
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Схема</p>
              <h3>Связи платформы</h3>
            </div>
            <ShieldCheck size={20} />
          </div>
          <PlatformScheme analytics={analytics} />
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Команда</p>
            <h3>Риелторы по активности</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Риелтор</th>
                <th>Объекты</th>
                <th>Просмотры</th>
                <th>Заявки</th>
                <th>Сообщения</th>
                <th>Конверсия</th>
              </tr>
            </thead>
            <tbody>
              {analytics.realtorRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.properties}</td>
                  <td>{row.views}</td>
                  <td>{row.requests}</td>
                  <td>{row.messages}</td>
                  <td>{row.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LineChart({ data }) {
  const width = 520;
  const height = 210;
  const max = Math.max(...data.map((item) => Math.max(item.properties, item.requests)), 1);
  const x = (index) => 36 + index * ((width - 72) / Math.max(data.length - 1, 1));
  const y = (value) => height - 42 - (value / max) * 128;
  const propertyPoints = data.map((item, index) => `${x(index)},${y(item.properties)}`).join(" ");
  const requestPoints = data.map((item, index) => `${x(index)},${y(item.requests)}`).join(" ");

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Динамика объектов и заявок">
        <line x1="36" y1="168" x2="492" y2="168" />
        <line x1="36" y1="40" x2="36" y2="168" />
        <polyline className="line-primary" points={propertyPoints} />
        <polyline className="line-accent" points={requestPoints} />
        {data.map((item, index) => (
          <g key={item.label}>
            <circle className="point-primary" cx={x(index)} cy={y(item.properties)} r="4" />
            <circle className="point-accent" cx={x(index)} cy={y(item.requests)} r="4" />
            <text x={x(index)} y="194" textAnchor="middle">{item.label}</text>
          </g>
        ))}
      </svg>
      <div className="chart-legend">
        <span><i className="legend-primary" />Объекты</span>
        <span><i className="legend-accent" />Заявки</span>
      </div>
    </div>
  );
}

function DonutChart({ title, eyebrow, segments }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;
  const background = segments
    .map((segment) => {
      const start = cursor;
      const size = total ? (segment.value / total) * 100 : 0;
      cursor += size;
      return `${segment.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  return (
    <div className="panel donut-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="donut-wrap">
        <div className="donut" style={{ background: `conic-gradient(${background || "#eef2f0 0% 100%"})` }}>
          <span>{total}</span>
        </div>
        <div className="donut-legend">
          {segments.map((segment) => (
            <span key={segment.label}>
              <i style={{ backgroundColor: segment.color }} />
              {segment.label}: {segment.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HorizontalBars({ rows }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="analytics-bars">
      {rows.map((row) => (
        <div className="analytics-bar-row" key={row.label}>
          <div>
            <strong>{row.label}</strong>
            <span>{row.requests} заявок · {formatMoney(row.avgPrice).replace(" / мес.", "")}</span>
          </div>
          <div className="analytics-bar-track">
            <i style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
          <b>{row.count}</b>
        </div>
      ))}
    </div>
  );
}

function Funnel({ stages }) {
  return (
    <div className="funnel">
      {stages.map((stage, index) => (
        <div className="funnel-step" key={stage.label} style={{ width: `${100 - index * 12}%` }}>
          <span>{stage.label}</span>
          <strong>{stage.value}</strong>
          <small>{stage.note}</small>
        </div>
      ))}
    </div>
  );
}

function HeatMap({ rows, max }) {
  return (
    <div className="heatmap">
      <div className="heatmap-head" />
      {propertyTypes.map((type) => (
        <strong key={type}>{type}</strong>
      ))}
      {rows.map((row) => (
        <React.Fragment key={row.district}>
          <strong>{row.district}</strong>
          {row.values.map((cell) => (
            <span
              key={`${row.district}-${cell.type}`}
              style={{ "--heat": 0.12 + (cell.value / Math.max(max, 1)) * 0.76 }}
            >
              {cell.value}
            </span>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function PlatformScheme({ analytics }) {
  return (
    <div className="platform-scheme">
      {[
        ["Клиенты", analytics.clientCount],
        ["Заявки", analytics.requestCount],
        ["Риелторы", analytics.realtorCount],
        ["Объекты", analytics.propertyCount],
        ["Чат", analytics.messageCount],
        ["Отчеты", analytics.reportCount]
      ].map(([label, value]) => (
        <div className="scheme-node" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function buildAdminAnalytics(state) {
  const messages = state.messages || [];
  const roleColors = { CLIENT: "#0f766e", REALTOR: "#b45309", ADMIN: "#5757b7" };
  const roleLabels = { CLIENT: "Клиенты", REALTOR: "Риелторы", ADMIN: "Админы" };
  const statusColors = { Активно: "#0f766e", Продано: "#6b7280", Арендовано: "#b45309" };
  const requestColors = { Ожидает: "#b45309", Подтвержден: "#0f766e", Отклонен: "#b42318" };

  const roleSegments = ["CLIENT", "REALTOR", "ADMIN"].map((role) => ({
    label: roleLabels[role],
    value: state.users.filter((user) => user.role === role).length,
    color: roleColors[role]
  }));

  const propertyStatusSegments = statuses.map((status) => ({
    label: status,
    value: state.properties.filter((property) => property.status === status).length,
    color: statusColors[status] || "#6b7280"
  }));

  const requestStatusList = ["Ожидает", "Подтвержден", "Отклонен"];
  const requestStatusSegments = requestStatusList.map((status) => ({
    label: status,
    value: state.requests.filter((request) => request.status === status).length,
    color: requestColors[status]
  }));

  const districtRows = districts.map((district) => {
    const properties = state.properties.filter((property) => property.district === district);
    const districtPropertyIds = new Set(properties.map((property) => property.id));
    const requests = state.requests.filter((request) => districtPropertyIds.has(request.propertyId));
    const avgPrice = properties.length ? Math.round(properties.reduce((sum, property) => sum + property.price, 0) / properties.length) : 0;
    return { label: district, count: properties.length, requests: requests.length, avgPrice };
  });

  const monthMap = new Map();
  [...state.properties, ...state.requests].forEach((item) => {
    const rawDate = item.createdAt || item.scheduledAt;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        label: new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(date),
        properties: 0,
        requests: 0
      });
    }
    const entry = monthMap.get(key);
    if ("realtorId" in item && "views" in item) entry.properties += 1;
    else entry.requests += 1;
  });
  const timeline = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, value]) => value);

  const totalViews = state.properties.reduce((sum, property) => sum + property.views, 0);
  const approvedRequests = state.requests.filter((request) => request.status === "Подтвержден").length;
  const closedProperties = state.properties.filter((property) => property.status === "Продано" || property.status === "Арендовано").length;
  const funnel = [
    { label: "Просмотры", value: totalViews, note: "в карточках" },
    { label: "Избранное", value: state.favorites.length, note: `${percent(state.favorites.length, totalViews)}% от просмотров` },
    { label: "Заявки", value: state.requests.length, note: `${percent(state.requests.length, Math.max(state.favorites.length, 1))}% от избранного` },
    { label: "Подтверждено", value: approvedRequests, note: `${percent(approvedRequests, state.requests.length)}% заявок` },
    { label: "Закрыто", value: closedProperties, note: "продано или арендовано" }
  ];

  const heatMap = districts.map((district) => ({
    district,
    values: propertyTypes.map((type) => ({
      type,
      value: state.properties.filter((property) => property.district === district && property.type === type).length
    }))
  }));
  const heatMax = Math.max(...heatMap.flatMap((row) => row.values.map((cell) => cell.value)), 1);

  const realtorRows = state.users
    .filter((user) => user.role === "REALTOR")
    .map((realtor) => {
      const properties = state.properties.filter((property) => property.realtorId === realtor.id);
      const propertyIds = new Set(properties.map((property) => property.id));
      const requests = state.requests.filter((request) => request.realtorId === realtor.id);
      const realtorMessages = messages.filter((message) => message.realtorId === realtor.id);
      const views = properties.reduce((sum, property) => sum + property.views, 0);
      return {
        id: realtor.id,
        name: realtor.name,
        properties: properties.length,
        views,
        requests: requests.length,
        messages: realtorMessages.length,
        conversion: percent(requests.length, Math.max(views, 1)),
        activeObjects: properties.filter((property) => property.status === "Активно").length,
        activeRequests: requests.filter((request) => propertyIds.has(request.propertyId)).length
      };
    })
    .sort((a, b) => b.requests - a.requests || b.views - a.views);

  return {
    activeUsers: state.users.filter((user) => user.status === "ACTIVE").length,
    activeProperties: state.properties.filter((property) => property.status === "Активно").length,
    approvedRequests,
    unreadMessages: messages.filter((message) => !message.readAt).length,
    clientCount: roleSegments.find((segment) => segment.label === "Клиенты")?.value || 0,
    realtorCount: roleSegments.find((segment) => segment.label === "Риелторы")?.value || 0,
    requestCount: state.requests.length,
    propertyCount: state.properties.length,
    messageCount: messages.length,
    reportCount: 2,
    roleSegments,
    propertyStatusSegments,
    requestStatusSegments,
    districtRows,
    timeline: timeline.length ? timeline : [{ label: "нет", properties: 0, requests: 0 }],
    funnel,
    heatMap,
    heatMax,
    realtorRows
  };
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function AdminPage({ context, compact = false }) {
  const { state, mutate, showToast } = context;
  const [tab, setTab] = useState("CLIENT");
  const [status, setStatus] = useState("Все");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [blockTarget, setBlockTarget] = useState(null);

  const users = state.users
    .filter((user) => user.role === tab)
    .filter((user) => status === "Все" || user.status === status)
    .filter((user) => !dateFrom || user.registeredAt >= dateFrom)
    .filter((user) => !dateTo || user.registeredAt <= dateTo);
  const selectedUser = state.users.find((user) => user.id === selectedUserId) || users[0];

  const unblock = (userId) => {
    mutate((draft) => {
      const user = draft.users.find((item) => item.id === userId);
      user.status = "ACTIVE";
      user.blockReason = "";
    });
    showToast("Пользователь разблокирован");
  };

  return (
    <div className="stack">
      <section className="stat-grid">
        <StatCard icon={Users} label="Пользователи" value={state.users.length} />
        <StatCard icon={Building2} label="Объекты" value={state.properties.length} tone="green" />
        <StatCard icon={Ban} label="Заблокированы" value={state.users.filter((user) => user.status === "BLOCKED").length} tone="rose" />
        <StatCard icon={MessageSquare} label="Сообщения" value={state.messages.length} tone="amber" />
      </section>

      <section className="admin-grid">
        <div className="panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Пользователи</p>
              <h3>Клиенты и риелторы</h3>
            </div>
            <div className="segmented">
              <button className={tab === "CLIENT" ? "active" : ""} onClick={() => setTab("CLIENT")}>Клиенты</button>
              <button className={tab === "REALTOR" ? "active" : ""} onClick={() => setTab("REALTOR")}>Риелторы</button>
            </div>
          </div>
          <div className="admin-filters">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Все</option>
              <option value="ACTIVE">Активные</option>
              <option value="BLOCKED">Заблокированные</option>
            </select>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Регистрация</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.registeredAt)}</td>
                    <td>
                      <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>
                        {user.status === "ACTIVE" ? "Активен" : "Заблокирован"}
                      </Badge>
                    </td>
                    <td className="cell-actions">
                      <button className="icon-button" title="Детали" onClick={() => setSelectedUserId(user.id)}>
                        <Eye size={16} />
                      </button>
                      {user.status === "ACTIVE" ? (
                        <button className="icon-button danger" title="Заблокировать" onClick={() => setBlockTarget(user)}>
                          <Ban size={16} />
                        </button>
                      ) : (
                        <button className="icon-button" title="Разблокировать" onClick={() => unblock(user.id)}>
                          <Unlock size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && <UserDetail state={state} user={selectedUser} />}
      </section>

      {!compact && (
        <section className="split-layout">
          <div className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Модерация</p>
                <h3>Все объекты платформы</h3>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Объект</th>
                    <th>Район</th>
                    <th>Статус</th>
                    <th>Риелтор</th>
                  </tr>
                </thead>
                <tbody>
                  {state.properties.map((property) => {
                    const realtor = state.users.find((user) => user.id === property.realtorId);
                    return (
                      <tr key={property.id}>
                        <td>{property.title}</td>
                        <td>{property.district}</td>
                        <td>{property.status}</td>
                        <td>{realtor?.name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Коммуникации</p>
                <h3>Последние сообщения</h3>
              </div>
            </div>
            <div className="message-log">
              {state.messages.slice(0, 8).map((message) => {
                const sender = state.users.find((user) => user.id === message.senderId);
                const property = state.properties.find((item) => item.id === message.propertyId);
                return (
                <article key={message.id}>
                  <span>{message.createdAt}</span>
                  <strong>{sender?.name} · {property?.title || "Общий чат"}</strong>
                  <p>{message.text}</p>
                </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {blockTarget && (
        <BlockDialog
          user={blockTarget}
          onClose={() => setBlockTarget(null)}
          onBlock={(reason) => {
            mutate((draft) => {
              const user = draft.users.find((item) => item.id === blockTarget.id);
              user.status = "BLOCKED";
              user.blockReason = reason;
            });
            setBlockTarget(null);
            showToast("Пользователь заблокирован");
          }}
        />
      )}
    </div>
  );
}

function UserDetail({ state, user }) {
  const requests = state.requests.filter((request) => request.clientId === user.id || request.realtorId === user.id);
  const properties = state.properties.filter((property) => property.realtorId === user.id);
  return (
    <aside className="panel user-detail">
      <div className="profile-head">
        <span className="avatar huge">{user.avatar}</span>
        <div>
          <p className="eyebrow">{ROLE_LABELS[user.role]}</p>
          <h3>{user.name}</h3>
          <span>{user.phone}</span>
        </div>
      </div>
      <dl className="detail-list">
        <div><dt>Дата регистрации</dt><dd>{formatDate(user.registeredAt)}</dd></div>
        <div><dt>Последняя активность</dt><dd>{user.lastActiveAt}</dd></div>
        <div><dt>Статус</dt><dd>{user.status === "ACTIVE" ? "Активен" : user.blockReason}</dd></div>
        <div><dt>Заявки</dt><dd>{requests.length}</dd></div>
        {user.role === "REALTOR" && <div><dt>Объекты</dt><dd>{properties.length}</dd></div>}
      </dl>
    </aside>
  );
}

function BlockDialog({ user, onClose, onBlock }) {
  const [reason, setReason] = useState("");
  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="modal"
        onSubmit={(event) => {
          event.preventDefault();
          if (reason.trim()) onBlock(reason.trim());
        }}
      >
        <div className="section-header">
          <div>
            <p className="eyebrow">Блокировка</p>
            <h3>{user.name}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <label>
          Причина блокировки
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <button className="primary-action danger-action" type="submit" disabled={!reason.trim()}>
          Заблокировать
        </button>
      </form>
    </div>
  );
}

function HotZones({ context }) {
  const { state } = context;
  const [selected, setSelected] = useState(cityZones[0]);
  const objects = state.properties.filter((property) => property.district === selected.name);

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Карта спроса</p>
          <h3>Горячие зоны Могилева</h3>
        </div>
      </div>
      <div className="city-map">
        {cityZones.map((zone) => (
          <button
            key={zone.id}
            className={`zone ${zone.tone} ${selected.id === zone.id ? "active" : ""}`}
            style={{ top: zone.top, left: zone.left }}
            onClick={() => setSelected(zone)}
          >
            {zone.name}
          </button>
        ))}
      </div>
      <div className="zone-result">
        <Badge tone="success">{selected.label}</Badge>
        <strong>{selected.name}</strong>
        <span>{objects.length} объектов в зоне</span>
      </div>
      <div className="mini-list">
        {objects.slice(0, 3).map((property) => (
          <button key={property.id} onClick={() => go(`property/${property.id}`)}>
            <span>{property.title}</span>
            <strong>{formatMoney(property.price, property.dealType)}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function ChatPage({ context }) {
  const { state, currentUser, mutate, showToast } = context;
  const conversations = useMemo(() => getConversations(state, currentUser), [state, currentUser]);
  const [selectedKey, setSelectedKey] = useState(conversations[0]?.key || "");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!conversations.length) return;
    if (!conversations.some((conversation) => conversation.key === selectedKey)) {
      setSelectedKey(conversations[0].key);
    }
  }, [conversations, selectedKey]);

  const selected = conversations.find((conversation) => conversation.key === selectedKey) || conversations[0];
  const thread = selected
    ? state.messages
        .filter(
          (message) =>
            message.clientId === selected.clientId &&
            message.realtorId === selected.realtorId &&
            (message.propertyId || "general") === (selected.propertyId || "general")
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  const send = (event) => {
    event.preventDefault();
    if (!selected || !text.trim()) return;
    mutate((draft) => {
      draft.messages.push({
        id: id("m"),
        clientId: selected.clientId,
        realtorId: selected.realtorId,
        propertyId: selected.propertyId,
        senderId: currentUser.id,
        text: text.trim(),
        createdAt: new Date().toLocaleString("ru-RU"),
        readAt: ""
      });
    });
    setText("");
    showToast("Сообщение отправлено");
  };

  const markRead = (conversation) => {
    setSelectedKey(conversation.key);
    mutate((draft) => {
      draft.messages.forEach((message) => {
        const sameDialog =
          message.clientId === conversation.clientId &&
          message.realtorId === conversation.realtorId &&
          (message.propertyId || "general") === (conversation.propertyId || "general");
        if (sameDialog && message.senderId !== currentUser.id && !message.readAt) {
          message.readAt = new Date().toLocaleString("ru-RU");
        }
      });
    });
  };

  return (
    <div className="chat-layout">
      <section className="panel conversation-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Диалоги</p>
            <h3>{currentUser.role === "CLIENT" ? "Риелторы" : "Клиенты"}</h3>
          </div>
          <MessageSquare size={20} />
        </div>
        <div className="conversation-list">
          {conversations.map((conversation) => (
            <button
              key={conversation.key}
              className={selected?.key === conversation.key ? "active" : ""}
              onClick={() => markRead(conversation)}
            >
              <span className="avatar">{conversation.avatar}</span>
              <div>
                <strong>{conversation.title}</strong>
                <small>{conversation.propertyTitle}</small>
                <p>{conversation.lastText}</p>
              </div>
              {conversation.unread > 0 && <Badge tone="danger">{conversation.unread}</Badge>}
            </button>
          ))}
        </div>
      </section>

      <section className="panel chat-panel">
        {selected ? (
          <>
            <div className="section-header">
              <div>
                <p className="eyebrow">{selected.propertyTitle}</p>
                <h3>{selected.title}</h3>
              </div>
              <button className="icon-text" onClick={() => selected.propertyId && go(`property/${selected.propertyId}`)}>
                <Building2 size={17} />
                Объект
              </button>
            </div>
            <div className="chat-thread">
              {thread.map((message) => {
                const mine = message.senderId === currentUser.id;
                const sender = state.users.find((user) => user.id === message.senderId);
                return (
                  <div key={message.id} className={`chat-message ${mine ? "user-message" : "peer-message"}`}>
                    <strong>{sender?.name}</strong>
                    <p>{message.text}</p>
                    <span>{message.createdAt}</span>
                  </div>
                );
              })}
              {!thread.length && <EmptyState text="Диалог пока пуст" />}
            </div>
            <form className="chat-form" onSubmit={send}>
              <input
                value={text}
                placeholder="Напишите сообщение"
                onChange={(event) => setText(event.target.value)}
              />
              <button className="icon-button accent-fill" type="submit">
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <EmptyState text="Нет доступных диалогов" />
        )}
      </section>
    </div>
  );
}

function getConversations(state, currentUser) {
  const map = new Map();
  const addConversation = ({ clientId, realtorId, propertyId = "", fallbackText = "Начните диалог" }) => {
    if (!clientId || !realtorId) return;
    const key = `${clientId}:${realtorId}:${propertyId || "general"}`;
    const property = state.properties.find((item) => item.id === propertyId);
    const peerId = currentUser.role === "CLIENT" ? realtorId : clientId;
    const peer = state.users.find((user) => user.id === peerId);
    if (!peer) return;
    const messages = state.messages
      .filter(
        (message) =>
          message.clientId === clientId &&
          message.realtorId === realtorId &&
          (message.propertyId || "general") === (propertyId || "general")
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const last = messages.at(-1);
    map.set(key, {
      key,
      clientId,
      realtorId,
      propertyId,
      title: peer.name,
      avatar: peer.avatar || peer.name.slice(0, 2),
      propertyTitle: property?.title || "Общий диалог",
      lastText: last?.text || fallbackText,
      lastAt: last?.createdAt || "2000-01-01",
      unread: messages.filter((message) => message.senderId !== currentUser.id && !message.readAt).length
    });
  };

  state.messages.forEach((message) => {
    if (currentUser.role === "CLIENT" && message.clientId === currentUser.id) addConversation(message);
    if (currentUser.role === "REALTOR" && message.realtorId === currentUser.id) addConversation(message);
  });

  state.requests.forEach((request) => {
    if (currentUser.role === "CLIENT" && request.clientId === currentUser.id) {
      addConversation({
        clientId: request.clientId,
        realtorId: request.realtorId,
        propertyId: request.propertyId,
        fallbackText: "Есть заявка на показ"
      });
    }
    if (currentUser.role === "REALTOR" && request.realtorId === currentUser.id) {
      addConversation({
        clientId: request.clientId,
        realtorId: request.realtorId,
        propertyId: request.propertyId,
        fallbackText: "Клиент оставил заявку"
      });
    }
  });

  if (currentUser.role === "CLIENT") {
    state.properties
      .filter((property) => property.status === "Активно")
      .slice(0, 10)
      .forEach((property) => {
        addConversation({
          clientId: currentUser.id,
          realtorId: property.realtorId,
          propertyId: property.id,
          fallbackText: "Написать риелтору по объекту"
        });
      });
  }

  return [...map.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <FileText size={28} />
      <strong>{text}</strong>
    </div>
  );
}

function getRecommendations(properties, favoriteIds) {
  if (!favoriteIds.length) return [...properties].sort((a, b) => b.views - a.views);
  const favorites = properties.filter((property) => favoriteIds.includes(property.id));
  const districtsSet = new Set(favorites.map((property) => property.district));
  const typeSet = new Set(favorites.map((property) => property.type));
  return properties
    .filter((property) => !favoriteIds.includes(property.id))
    .map((property) => ({
      property,
      score: (districtsSet.has(property.district) ? 2 : 0) + (typeSet.has(property.type) ? 2 : 0) + property.views / 500
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.property);
}

function downloadReport(type, state, user) {
  const rows =
    type === "client-requests"
      ? state.requests
          .filter((request) => request.clientId === user.id)
          .map((request) => {
            const property = state.properties.find((item) => item.id === request.propertyId);
            return `<tr><td>${property?.title}</td><td>${property?.address}</td><td>${formatDateTime(request.scheduledAt)}</td><td>${request.status}</td></tr>`;
          })
          .join("")
      : state.properties
          .filter((property) => property.realtorId === user.id)
          .map((property) => `<tr><td>${property.title}</td><td>${property.status}</td><td>${property.views}</td><td>${property.price}</td></tr>`)
          .join("");
  const heading = type === "client-requests" ? "Отчет по заявкам клиента" : "Отчет по объектам риелтора";
  const html = `
    <html><head><meta charset="utf-8"><title>${heading}</title></head>
    <body>
      <h1>${heading}</h1>
      <p>Пользователь: ${user.name}</p>
      <p>Дата формирования: ${new Date().toLocaleString("ru-RU")}</p>
      <table border="1" cellspacing="0" cellpadding="6">
        <tbody>${rows || "<tr><td>Нет данных</td></tr>"}</tbody>
      </table>
    </body></html>`;
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-${new Date().toISOString().slice(0, 10)}.doc`;
  link.click();
  URL.revokeObjectURL(url);
}

createRoot(document.getElementById("root")).render(<App />);
