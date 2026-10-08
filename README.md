ins# Aspect City Real Estate Platform

Веб-приложение для агентства недвижимости "Аспект-сити" в Могилеве.

Проект сделан под требования курсовой работы: React-клиент, роли клиента/риелтора/администратора, каталог объектов, заявки на показы, избранное, отчеты, профиль, административная панель, чат клиентов и риелторов и backend-структура под REST API с локальным PostgreSQL.

## Быстрый запуск клиента

```bash
npm.cmd install
npm.cmd run dev:client
```

После запуска откройте адрес, который покажет Vite. Демо-аккаунты:

| Роль | Email | Пароль |
| --- | --- | --- |
| Клиент | `client@aspect.local` | `demo123` |
| Риелтор | `realtor@aspect.local` | `demo123` |
| Администратор | `admin@aspect.local` | `demo123` |

При первом открытии приложение показывает публичную лендинг-страницу агентства. Клиентская часть сохраняет сессию, фильтры, сортировку, избранное, заявки и изменения профиля в `localStorage`.

## Backend и локальный PostgreSQL

Docker из проекта убран. Backend подключается к обычному PostgreSQL, установленному локально на компьютере.

1. Установите и запустите PostgreSQL локально.
2. Создайте базу данных `aspect_city`.
3. Проверьте строку подключения в `server/.env`.

По умолчанию используется:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aspect_city?schema=public"
```

Если у вашего локального PostgreSQL другой пользователь или пароль, поменяйте их в `server/.env`.

Запуск backend:

```bash
npm.cmd install
npm.cmd --workspace server run prisma:generate
npm.cmd --workspace server run db:migrate
npm.cmd --workspace server run db:seed
npm.cmd run dev:server
```

REST API будет доступен на `http://localhost:4000/api`.

## Что реализовано

- 3 роли с разными сценариями: клиент, риелтор, администратор.
- Авторизация и регистрация с выбором роли.
- 7+ экранов приложения: лендинг-визитка фирмы, дашборд, каталог, мои объекты, форма объекта, детали/виртуальный тур, профиль, админ-панель, аналитика, чат.
- 15+ функций: фильтрация, сортировка, поиск, избранное, заявки на показ, статусы заявок, рекомендации, карта зон, отчеты, графики, диаграммы, CRUD объектов, блокировка пользователей, чат клиента и риелтора, профиль, заметки риелтора, drag-and-drop фото.
- Администратор может формировать отчеты, смотреть предпросмотр, хранить историю и экспортировать данные в Excel `.xls` и PDF.
- PDF-экспорт использует `pdfmake` со встроенным шрифтом Roboto, поэтому русский текст отображается корректно.
- Адаптивная верстка для десктопа, планшета и мобильного экрана.
- Prisma-схема с 10 связанными таблицами и seed-скриптом на 200+ записей.

Подробная выжимка требований из документов лежит в [docs/requirements.md](docs/requirements.md).

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## License

This software is distributed as **Shareware (Trial Version)** —
free to evaluate for 30 days with limited functionality.

After the trial period, a paid license is required for continued use.

See [LICENSE.txt](LICENSE.txt) for full terms.
