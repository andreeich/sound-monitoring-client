# Sound Monitoring Client

Це клієнтська частина системи моніторингу звукового забруднення, розроблена як веб-додаток для первинних пристроїв (телефонів). Додаток записує звук, порівнює його з еталонними сигналами, відправляє дані через MQTT та відображає результати на мапі.

## Особливості
- Запис звуку через Web Audio API.
- Аналіз звуку з використанням FFT для порівняння з еталонами.
- Передача сповіщень через MQTT (QoS 1).
- Інтерфейс для налаштування (інтервал, тривалість, поріг подібності).
- Відображення результатів у таблиці та на мапі (Leaflet).
- Сучасний UI з shadcn/ui та Tailwind CSS.

## Технології
- **React.js**: Для створення UI.
- **TypeScript**: Для типізації.
- **Vite**: Для швидкої розробки.
- **shadcn/ui**: UI-компоненти на основі Tailwind CSS.
- **Tailwind CSS**: Для стилізації.
- **mqtt.js**: Для роботи з MQTT.
- **Leaflet**: Для відображення мапи.
- **fft-js**: Для аналізу звуку.

## Вимоги
- Node.js (>= 18)
- MQTT-брокер (напр., Mosquitto на `ws://localhost:9001`)
- Серверна частина (API на `http://localhost:8000`)

## Структура проєкту

```
sound-monitoring-client/
├── public/
│   └── reference_sounds/         # Еталонні звуки (наприклад, drone.mp3)
├── src/
│   ├── components/
│   │   ├── ui/                  # Компоненти shadcn/ui
│   │   ├── AudioRecorder.tsx    # Запис звуку
│   │   ├── SettingsPanel.tsx    # Налаштування
│   │   ├── ResultsDisplay.tsx   # Результати
│   │   └── MapDisplay.tsx       # Мапа
│   ├── utils/
│   │   ├── audioAnalysis.ts     # Аналіз звуку
│   │   └── mqttClient.ts        # MQTT-клієнт
│   ├── App.tsx                  # Головний компонент
│   ├── main.tsx                 # Точка входу
│   ├── index.css                # Глобальні стилі
│   └── types.ts                 # Типи
├── tailwind.config.js           # Конфігурація Tailwind
├── vite.config.ts               # Конфігурація Vite
├── tsconfig.json                # Конфігурація TypeScript
├── package.json                 # Залежності
├── .env                         # Змінні оточення
└── README.md                    # Документація
```

## Встановлення

1. **Клонуйте репозиторій**:
   ```bash
   git clone <repository-url>
   cd sound-monitoring-client
   ```
2. Встановіть залежності:
```bash
npm install
```
3. Створіть файл .env:
```env
VITE_MQTT_BROKER=ws://localhost:9001
VITE_API_URL=http://localhost:8000
```

## Запуск
- Запустіть у режимі розробки:
```bash
npm run dev
```
Додаток буде доступний за адресою (http://localhost:3000)[http://localhost:3000].
- Збірка для продакшену:
```bash
npm run build
```

## Використання
- Налаштування: Вкажіть інтервал запису, тривалість та поріг подібності.
- Запис звуку: Натисніть "Почати запис" для періодичного запису.
- Результати: Переглядайте виявлені звуки у вкладці "Результати".
- Мапа: Переглядайте локації виявлень на мапі.

## Тестування
- Перевірка запису:
  - Увімкніть мікрофон і почніть запис.
  - Переконайтеся, що звук аналізується та відображається в результатах.
- Перевірка MQTT:
  - Відправте тестове повідомлення через сервер (див. документацію серверної частини).
  - Перевірте, чи отримується підтвердження (ACK).
- Перевірка мапи:
  - Додайте кілька сповіщень із різними координатами та перевірте їх відображення.

## Вирішення проблем
- Мікрофон не працює:
  - Перевірте дозволи для браузера.
  - Використовуйте HTTPS для Web Audio API.
- MQTT не підключається:
  - Переконайтеся, що Mosquitto працює на ws://localhost:9001.
  - Перегляньте консоль браузера для помилок.
- Мапа не відображається:
  - Перевірте підключення до інтернету (Leaflet використовує OpenStreetMap).

## Розробка та внесок
- Дотримуйтесь стилю коду (ESLint, Prettier).
- Створюйте pull requests із чітким описом змін.

## Ліцензія
MIT License.
