/**
 * Конфигурация магазина AERA Bishkek (siteConfig.js)
 * Реальные данные моделей, комплектаций, цен и интеграций (Telegram + WhatsApp + Meta Pixel).
 */

const CONTACTS = {
  phoneDisplay: '+996 (555) 90-90-90',
  phoneRaw: '+996555909090',
  phoneHref: 'tel:+996555909090',
  whatsappNumber: '996555909090',
  whatsappDisplay: '+996 (555) 90-90-90',
  whatsappHref:
    'https://wa.me/996555909090?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%9F%D0%BE%D0%BC%D0%BE%D0%B3%D0%B8%D1%82%D0%B5%2C%20%D0%BF%D0%BE%D0%B6%D0%B0%D0%BB%D1%83%D0%B9%D1%81%D1%82%D0%B0%2C%20%D0%BF%D0%BE%D0%B4%D0%BE%D0%B1%D1%80%D0%B0%D1%82%D1%8C%20%D0%BE%D1%87%D0%B8%D1%81%D1%82%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%20AERA%20%D0%B4%D0%BB%D1%8F%20%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B',
  workHours: 'Ежедневно 09:00 — 21:00'
};

const siteConfig = {
  brand: 'AERA',
  storeName: 'AERA Bishkek',
  city: 'Бишкек',
  currency: 'KGS',
  currencySymbol: 'сом',

  // Контакты и интеграции (Шаг 4): единая переменная контактов для шапки, футера и виджетов
  // Заказы уходят на серверную функцию /api/order (Vercel), токен бота хранится в переменных окружения
  // TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID на сервере. Не вписывайте реальный токен сюда — он будет виден в браузере.
  ORDER_ENDPOINT: '/api/order',
  TELEGRAM_BOT_TOKEN: '',
  TELEGRAM_CHAT_ID: '',
  WHATSAPP_NUMBER: CONTACTS.whatsappNumber,
  PHONE_DISPLAY: CONTACTS.phoneDisplay,
  PHONE_HREF: CONTACTS.phoneHref,
  WHATSAPP_HREF: CONTACTS.whatsappHref,
  WORK_HOURS: CONTACTS.workHours,
  META_PIXEL_ID: 'AERA_BISHKEK_PIXEL',

  contacts: CONTACTS,

  // Индикатор смога в шапке и Hero-блок (Шаг 1)
  smogIndicator: {
    aqi: '215+',
    status: 'Опасно для дыхания',
    badgeText: 'AQI 215+ • Опасно для дыхания',
    cityLabel: 'Смог в Бишкеке сейчас'
  },

  hero: {
    badge: 'Защита от смога и печного дыма в Бишкеке',
    headline: 'Чистый горный воздух в вашем доме за 5 минут — от 3 990 сом',
    subheadline:
      'Очистители воздуха AERA с медицинским фильтром HEPA H13, сотовым активированным углем против запаха гари и ионизатором 20 млн ионов. Без предоплаты — оплата курьеру после проверки прибора при вас.',
    minPrice: 3990,
    cleanMinutes: 5
  },

  // Сменный картридж (Шаг 2, п. 4)
  filterCartridge: {
    id: 'filter-hepa-h13',
    name: 'Сменный картридж AERA HEPA H13 + Active Carbon',
    shortName: 'Запасной картридж AERA HEPA H13 + Carbon',
    standalonePrice: 950,
    bundlePrice: 450,
    savings: 500,
    badge: 'СПЕЦЦЕНА К ЗАКАЗУ -53%',
    description:
      'Комбинированный блок: Pre-Filter + медицинский HEPA H13 + сотовый активированный уголь против зимнего смога и запаха печного угля.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBo2obxvR-EM-hMfuZrsFr22EIinLDhA0r6RBnqs4M2_eGEqLOe_0tQsP_xJeJp27pduJci3CAHovWQpUFZLvvPt7lRDfiEvWzGdZ_NEzL7wXIjU_5Ess3ObXXr7SbeLMDlpRtfv4pCV7Fq1tYn5ZpOpfOQL2Jf_tcYSDNrwGWYFS2mNuluaEi5SLRP1WHBxnIq4voDCDrsWVZYhOUjvPy48rXPgbH6Ve1Ye_dhFRcR11EgpZaB_wxp'
  },

  // Линейка приборов AERA (Фактическая партия со склада в г. Бишкек)
  models: [
    {
      id: 'compact',
      sku: 'AR-6614',
      name: 'AERA Compact',
      fullName: 'AERA Compact (AR-6614)',
      badge: 'ДЛЯ СПАЛЬНИ И ДЕТСКОЙ • ДО 25 М²',
      shortBadge: 'До 25 м² • Спальня и детская',
      isHit: false,
      isFlagship: false,
      price: 3990,
      oldPrice: 5200,
      plusPrice: 4440,
      plusOldPrice: 6150,
      areaLabel: 'До 25 м²',
      areaRecommendedMax: 25,
      areaSliderDefault: 18,
      priorityId: 'bedroom',
      priorityLabel: 'Для детской/спальни',
      powerW: 35,
      cadr: 180,
      heightCm: 48,
      dimensions: '256×128×480 мм',
      weightKg: 1.75,
      weight: '1.75 кг',
      stockCount: 4,
      stockLabel: 'Осталось 4 шт',
      noiseDb: 28,
      summary:
        'Компактный и тихий очиститель для спальни и детской комнаты до 25 м². Ночной режим 28 дБ, 6 сенсорных кнопок, таймер 1–8 ч и пульт ДУ в комплекте.',
      configuratorReason:
        'Идеален для детских и спален до 25 м²: тихий ночной режим 28 дБ не тревожит сон ребенка, а фильтр HEPA H13 + уголь убирает смог и аллергены за 5 минут.',
      specs: {
        power: '35 Вт',
        cadr: '180 м³/ч',
        area: 'До 25 м²',
        height: '48 см (256×128×480 мм)',
        weight: '1.75 кг',
        stock: 'Осталось 4 шт',
        noise: '28 дБ (ночной режим)',
        controls: '6 сенсорных кнопок, таймер 1–8 ч',
        display: 'Сенсорная панель с LED-индикацией режимов',
        remote: 'Пульт ДУ в комплекте',
        filtration: '4 ступени: Pre-Filter + HEPA H13 + Active Carbon + Ионизатор 20 млн'
      },
      highlights: [
        'Мощность 35 Вт, CADR 180 м³/ч, площадь до 25 м²',
        'Высота 48 см (256×128×480 мм), вес 1.75 кг',
        'Ночной режим 28 дБ — тихий сон без бликов',
        '6 сенсорных кнопок, таймер 1–8 ч, пульт ДУ в комплекте'
      ],
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDNMucX_F921ktjIp0O-aG-Khzo5tX1LhvWeSMp1CddFEChhFBM64Mm58CpmvVGEOBFbu6YQ9McCrabnIQcdjrzd8XbxEboEz4UiJ0MOtPoCzNDWUvxyjlqsDbCrPbSBm4lx6F2EqqbWWZUrcfHKsBS2xjvdTe3kOhIw4GpE6rXyM1d5ZN4TZLvxbaBl95q8K2fcz95FHrXnPso6SoIbAvDQUqqeA9czMUc_80Ms7kHMxvA0mLvIbLI',
      gallery: [
        {
          label: '1. Общий вид',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNMucX_F921ktjIp0O-aG-Khzo5tX1LhvWeSMp1CddFEChhFBM64Mm58CpmvVGEOBFbu6YQ9McCrabnIQcdjrzd8XbxEboEz4UiJ0MOtPoCzNDWUvxyjlqsDbCrPbSBm4lx6F2EqqbWWZUrcfHKsBS2xjvdTe3kOhIw4GpE6rXyM1d5ZN4TZLvxbaBl95q8K2fcz95FHrXnPso6SoIbAvDQUqqeA9czMUc_80Ms7kHMxvA0mLvIbLI',
          alt: 'AERA Compact AR-6614 в интерьере спальни'
        },
        {
          label: '2. Панель 6 кнопок',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpKex85AwQkIZvLZyj1wi8sP951KLQuU52TRmIUctszcsG3qEWDMalEvEuhu7d6uxtbu9XqJf3qwh_z9TgCelPr9KPWV8NQFj72rPo9UxSVstKMEcvZFUb41dVVCjlodjtIMipfv4hQmEUZsprYifJ16yWTi1bcg355CERS1FdzNRewg4gXXqy91tZJonHGNEsevCC9rZIJR-44bPQhrWRxr-GTCGVlflcOly-j8knR0zM51Trq1QZ',
          alt: 'Сенсорное управление AERA Compact и ночной режим 28 дБ'
        },
        {
          label: '3. Блок HEPA H13',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF3YJgRj7QzXsa8wOl5ym3uN2md8JEzMtgcb4QhWSF2_oiMks0lrxiCk8waLUAosEGsO5_HY2_6_q1c4A5U3xSmCM-FSvVt6xvEvFX5_-DmqRl8XtVwipxaSWY-myfMdh6aVP0oHnuKURljrT7mD4WrUg8pHasN_Nk-HTdS0AwGE43DZLm1wWr7j1JOzZ4t5Rf4BrYt97BDirCHxVqKdDq_rkW9cVajP9RIbkjsrVIgAG_tc_ru8WS',
          alt: 'Многослойный фильтр HEPA H13 + сотовый активированный уголь'
        },
        {
          label: '4. В интерьере',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlH8q4RhxnFakJCSL0gtid_mYo2MQVK8WaqFp7A3J95BPHwCfFRvY22BBf0BRdKp9PN66WGK4Q4iVWjx-hoDFVsHuj_JxbfgYUfzK1lV3oyodGYv5_OPFIenLYGAeDn2mUoR16Xo5rKlEXN-AxyU3r15LIwBHFEUIKX4NOSN4wtL3OyyIbgEqUsxE4L6KaYt8UXSTxRJfpp8S00oMtvLpNSasiXQTg-85XlYbDWgubAYX8oncPtEGm',
          alt: 'AERA Compact рядом с кроватью в спальне'
        }
      ],
      packages: {
        base: {
          id: 'base',
          title: 'Комплект «Базовый»',
          shortTitle: 'Базовый',
          price: 3990,
          oldPrice: 5200,
          description: 'Прибор AERA Compact + предустановленный фильтр HEPA H13 + пульт ДУ'
        },
        plus: {
          id: 'plus',
          title: 'Комплект «Плюс (2 сезона)»',
          shortTitle: 'Плюс с запасным фильтром',
          badge: 'ВЫБОР 82%',
          price: 4440,
          oldPrice: 6150,
          extraFilterPrice: 450,
          extraFilterOldPrice: 950,
          savings: 500,
          description:
            'Базовый комплект + дополнительный сменный фильтр HEPA H13 со скидкой 50% за +450 сом вместо 950 сом'
        }
      }
    },
    {
      id: 'sense',
      sku: 'AR-6662',
      name: 'AERA Sense',
      fullName: 'AERA Sense (AR-6662)',
      badge: '★ ВЫБОР 70% В БИШКЕКЕ • ДО 30 М²',
      shortBadge: 'Хит продаж • До 30 м²',
      isHit: true,
      isFlagship: false,
      price: 4990,
      oldPrice: 6500,
      plusPrice: 5440,
      plusOldPrice: 7450,
      areaLabel: 'До 30 м²',
      areaRecommendedMax: 30,
      areaSliderDefault: 26,
      priorityId: 'smog_auto',
      priorityLabel: 'Видеть цифры смога PM2.5 + Авторежим',
      powerW: 35,
      cadr: 240,
      heightCm: 57,
      dimensions: '320×165×570 мм',
      weightKg: 2.85,
      weight: '2.85 кг',
      stockCount: 12,
      stockLabel: 'Осталось 12 шт',
      noiseDb: 28,
      summary:
        'Хит продаж в Бишкеке: цветной LCD-дисплей с лазерным датчиком PM2.5 и температурой, датчик запаха гари TVOC и Умный Авторежим.',
      configuratorReason:
        'Выбор 70% семей в Бишкеке: лазерный датчик PM2.5 и датчик гари TVOC выводят точные цифры смога на цветной LCD-экран, а Умный Авторежим сам ускоряет очистку при запахе угля.',
      specs: {
        power: '35 Вт',
        cadr: '240 м³/ч',
        area: 'До 30 м²',
        height: '57 см (320×165×570 мм)',
        weight: '2.85 кг',
        stock: 'Осталось 12 шт',
        noise: '28 дБ (ночной режим)',
        controls: 'Умный Авторежим + сенсорное управление + таймер',
        display: 'Цветной LCD-дисплей с лазерным датчиком PM2.5, TVOC и температурой',
        remote: 'Пульт ДУ в комплекте',
        filtration: '4 ступени: Pre-Filter + HEPA H13 + Active Carbon + Ионизатор 20 млн'
      },
      highlights: [
        'Цветной LCD-дисплей: цифры PM2.5 и температура',
        'Датчик запаха гари TVOC + Умный Авторежим',
        'Мощность 35 Вт, CADR 240 м³/ч, высота 57 см (320×165×570 мм), вес 2.85 кг',
        'Ночной режим 28 дБ, пульт ДУ в комплекте'
      ],
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDNFPl_c9lpLr-LbGTokDdSxn1kOrk3_mLGrFrV_oTyTukpps8g4CdLb-4zEcxh8XACy6X4Tw6bzZ1DrnVVtBVMlPBbtazEt_n1FJDuQv0zTOOCw0saqNpHcz6Gp1jg6tvRKEKlnpEWQb8pTzLgr7WLBm60S7hk_sUS3FE57bUbScopGHI4FKARhEPtRTQZeX_Et5od5AaykYjbW-bVUkmiEGon_cVODZGztV04D1DYqU32p2tRKree',
      gallery: [
        {
          label: '1. Общий вид',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNFPl_c9lpLr-LbGTokDdSxn1kOrk3_mLGrFrV_oTyTukpps8g4CdLb-4zEcxh8XACy6X4Tw6bzZ1DrnVVtBVMlPBbtazEt_n1FJDuQv0zTOOCw0saqNpHcz6Gp1jg6tvRKEKlnpEWQb8pTzLgr7WLBm60S7hk_sUS3FE57bUbScopGHI4FKARhEPtRTQZeX_Et5od5AaykYjbW-bVUkmiEGon_cVODZGztV04D1DYqU32p2tRKree',
          alt: 'AERA Sense AR-6662 с цветным LCD-дисплеем PM2.5'
        },
        {
          label: '2. LCD-дисплей PM2.5',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuOMqC6KTN3AT2FJB4Xp5Q_Fz65Aj0r6Vj36cezF_5O_RaGqOA4ZfAMhkKH0n3RP9RJlt22lQ0Iu_TE791kRxWB0hwaZKWUkrw5FMXYHj72PZgDTrLQZbalEs86xx5_ZdQWtxh1AJ_6rb6FwZN8crPg-jBE8JHl601H6ElufmLzH4Vs8oBZJsxYlvlFY37jveTTGaDCC2BM-DKBKFK-F52s5_wnvlgZ9cpaqCUGMhdbbm3SNsRF_-B',
          alt: 'Цветной LCD-дисплей с датчиком PM2.5 и температурой'
        },
        {
          label: '3. Блок HEPA H13',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF3YJgRj7QzXsa8wOl5ym3uN2md8JEzMtgcb4QhWSF2_oiMks0lrxiCk8waLUAosEGsO5_HY2_6_q1c4A5U3xSmCM-FSvVt6xvEvFX5_-DmqRl8XtVwipxaSWY-myfMdh6aVP0oHnuKURljrT7mD4WrUg8pHasN_Nk-HTdS0AwGE43DZLm1wWr7j1JOzZ4t5Rf4BrYt97BDirCHxVqKdDq_rkW9cVajP9RIbkjsrVIgAG_tc_ru8WS',
          alt: 'Фильтр HEPA H13 + сотовый уголь против запаха гари'
        },
        {
          label: '4. В интерьере',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxTfoD84q-VtnqhM9fCyh8cbyh7MPC4BazDDLG5kQGwWBcw4hqI2UFkQTtxt9YIwXmA2DomcbTQLPy7knmoRRNcphUbybH3QRFEXVIyz4w9kNPuRkEv2b6LXU0iWuNpBXYTWKzpb9zLhenL3H9uk2xsw4lPEEns3_md7YPyh71g80j6fOlESb95yGlhGKME7cZYGyHTTqbOOG7Zhrcms7uYA8NuVbiO4ab4INGDHXuJJT28acUvSAg',
          alt: 'AERA Sense в современной квартире в Бишкеке'
        }
      ],
      packages: {
        base: {
          id: 'base',
          title: 'Комплект «Базовый»',
          shortTitle: 'Базовый',
          price: 4990,
          oldPrice: 6500,
          description: 'Прибор AERA Sense + предустановленный фильтр HEPA H13 + пульт ДУ'
        },
        plus: {
          id: 'plus',
          title: 'Комплект «Плюс (2 сезона)»',
          shortTitle: 'Плюс с запасным фильтром',
          badge: 'ВЫБОР 82%',
          price: 5440,
          oldPrice: 7450,
          extraFilterPrice: 450,
          extraFilterOldPrice: 950,
          savings: 500,
          description:
            'Базовый комплект + дополнительный сменный фильтр HEPA H13 со скидкой 50% за +450 сом вместо 950 сом'
        }
      }
    },
    {
      id: 'prox',
      sku: 'AR-669',
      name: 'AERA Pro X',
      fullName: 'AERA Pro X (AR-669)',
      badge: 'ФЛАГМАН 360° • ДЛЯ ЗАЛА И СТУДИИ 30–50 М²',
      shortBadge: 'Флагман 360° • 30–50 м²',
      isHit: false,
      isFlagship: true,
      price: 7290,
      oldPrice: 9800,
      plusPrice: 7740,
      plusOldPrice: 10750,
      areaLabel: '30–50 м²',
      areaRecommendedMax: 50,
      areaSliderDefault: 45,
      priorityId: 'max_360',
      priorityLabel: 'Максимальная мощность 360° для зала',
      powerW: 35,
      cadr: 320,
      heightCm: 63,
      dimensions: '260×260×630 мм',
      weightKg: 3.5,
      weight: '3.5 кг',
      stockCount: 3,
      stockLabel: 'Осталось 3 шт',
      noiseDb: 28,
      summary:
        'Флагманская круглая башня 63 см с цилиндрическим фильтром-бочонком 360°, CADR 320 м³/ч и верхним круглым OLED-дисплеем с трехцветным кольцом качества воздуха.',
      configuratorReason:
        'Максимальная турбо-тяга 360° (CADR 320 м³/ч) для просторных залов и квартир-студий 30–50 м²: цилиндрический фильтр-бочонок забирает смог со всех сторон, а верхний OLED-дисплей светится Зеленым/Желтым/Красным.',
      specs: {
        power: '35 Вт',
        cadr: '320 м³/ч',
        area: '30–50 м²',
        height: '63 см (260×260×630 мм), корпус ABS-пластик',
        weight: '3.5 кг',
        stock: 'Осталось 3 шт',
        noise: '28 дБ (ночной режим)',
        controls: 'Сенсорный верхний OLED-дисплей + Авторежим',
        display:
          'Верхний круглый OLED-дисплей с трехцветным кольцом (Зеленый/Желтый/Красный), PM2.5 и температурой',
        remote: 'Пульт ДУ в комплекте',
        filtration: 'Цилиндрический фильтр-бочонок 360° (HEPA H13 + уголь) + Ионизатор 20 млн'
      },
      highlights: [
        'Круглая башня 63 см (260×260×630 мм), вес 3.5 кг, корпус ABS-пластик',
        'Цилиндрический фильтр-бочонок 360°, CADR 320 м³/ч, площадь 30–50 м²',
        'Верхний круглый OLED-дисплей с 3-цветным кольцом AQI, PM2.5 и °C',
        'Мощность 35 Вт, ночной режим 28 дБ, пульт ДУ в комплекте'
      ],
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA8EstV8GIewqkJf6jwih-_x_HT-R1-LfqCNPVwg6RrdZGgV34MIBqcyhvN3HCJpAy9HBTCPTqTAOrfNFIXjmAjsJEHe-pdgPC24tK9P8i8CtQwprdepLNCSBUVUoY20eOtzyz6SZqaNrQqroPVzrcM3v0uPTZILHC691KDPnaLoIEuUnn4V-JGy9YXElhMyn1lO2Equff62LNZnLSR4yYiogSgrm33lepQ3rB-7DszRzrVneYiX2H5',
      gallery: [
        {
          label: '1. Башня 63 см',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8EstV8GIewqkJf6jwih-_x_HT-R1-LfqCNPVwg6RrdZGgV34MIBqcyhvN3HCJpAy9HBTCPTqTAOrfNFIXjmAjsJEHe-pdgPC24tK9P8i8CtQwprdepLNCSBUVUoY20eOtzyz6SZqaNrQqroPVzrcM3v0uPTZILHC691KDPnaLoIEuUnn4V-JGy9YXElhMyn1lO2Equff62LNZnLSR4yYiogSgrm33lepQ3rB-7DszRzrVneYiX2H5',
          alt: 'Флагманская круглая башня AERA Pro X AR-669 высотой 63 см'
        },
        {
          label: '2. Круглый OLED',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuOMqC6KTN3AT2FJB4Xp5Q_Fz65Aj0r6Vj36cezF_5O_RaGqOA4ZfAMhkKH0n3RP9RJlt22lQ0Iu_TE791kRxWB0hwaZKWUkrw5FMXYHj72PZgDTrLQZbalEs86xx5_ZdQWtxh1AJ_6rb6FwZN8crPg-jBE8JHl601H6ElufmLzH4Vs8oBZJsxYlvlFY37jveTTGaDCC2BM-DKBKFK-F52s5_wnvlgZ9cpaqCUGMhdbbm3SNsRF_-B',
          alt: 'Верхний круглый OLED-дисплей с трехцветным кольцом качества воздуха, PM2.5 и температурой'
        },
        {
          label: '3. Бочонок 360°',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF3YJgRj7QzXsa8wOl5ym3uN2md8JEzMtgcb4QhWSF2_oiMks0lrxiCk8waLUAosEGsO5_HY2_6_q1c4A5U3xSmCM-FSvVt6xvEvFX5_-DmqRl8XtVwipxaSWY-myfMdh6aVP0oHnuKURljrT7mD4WrUg8pHasN_Nk-HTdS0AwGE43DZLm1wWr7j1JOzZ4t5Rf4BrYt97BDirCHxVqKdDq_rkW9cVajP9RIbkjsrVIgAG_tc_ru8WS',
          alt: 'Цилиндрический фильтр-бочонок 360° HEPA H13 + активный уголь'
        },
        {
          label: '4. В интерьере',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBefvM1_Io5tWiqVVvOXKo8l_Gj7AhsCMU52RudWkh8u7PUCP58AWsGQKj3ELbFa-mmoNV6sfCGvl36kAWt9miA5WMH0Yo_jG0AF5wiXluvP96vqlSbAa7KUnr1IdbJexn4gdvPOYFfBWGk7_eX4bQXutpkCk5XnpNEg1CwwfQElfOPtXT0GuPXrBm8RDFNbivAnyBtbXSiu0aRca2QHcXbNtC3dkkbNs49y_3XldKCYQO8iIFDVB5H',
          alt: 'AERA Pro X в просторном зале 30–50 м²'
        }
      ],
      packages: {
        base: {
          id: 'base',
          title: 'Комплект «Базовый»',
          shortTitle: 'Базовый',
          price: 7290,
          oldPrice: 9800,
          description: 'Прибор AERA Pro X + предустановленный цилиндрический фильтр 360° HEPA H13 + пульт ДУ'
        },
        plus: {
          id: 'plus',
          title: 'Комплект «Плюс (2 сезона)»',
          shortTitle: 'Плюс с запасным фильтром',
          badge: 'ВЫБОР 82%',
          price: 7740,
          oldPrice: 10750,
          extraFilterPrice: 450,
          extraFilterOldPrice: 950,
          savings: 500,
          description:
            'Базовый комплект + дополнительный сменный фильтр HEPA H13 со скидкой 50% за +450 сом вместо 950 сом'
        }
      }
    }
  ],

  // Опции умного конфигуратора (Шаг 1, п. 1)
  configurator: {
    areas: [
      { id: 'compact', label: 'До 25 м²', modelId: 'compact', defaultSqm: 18, minSqm: 10, maxSqm: 25 },
      { id: 'sense', label: 'До 30 м²', modelId: 'sense', defaultSqm: 26, minSqm: 26, maxSqm: 30 },
      { id: 'prox', label: '30–50 м²', modelId: 'prox', defaultSqm: 45, minSqm: 31, maxSqm: 50 }
    ],
    priorities: [
      {
        id: 'bedroom',
        label: 'Для детской/спальни',
        icon: 'child_care',
        modelId: 'compact',
        subtitle: 'Тихий сон 28 дБ и защита ребенка'
      },
      {
        id: 'smog_auto',
        label: 'Видеть цифры смога PM2.5 + Авторежим',
        icon: 'sensors',
        modelId: 'sense',
        subtitle: 'Цветной LCD-экран PM2.5 + датчик гари TVOC'
      },
      {
        id: 'max_360',
        label: 'Максимальная мощность 360° для зала',
        icon: 'cyclone',
        modelId: 'prox',
        subtitle: 'Круглая башня 63 см, бочонок 360° и круглый OLED'
      }
    ]
  },

  // 4 ступени очистки воздуха (Шаг 1, п. 1)
  filtrationStages: [
    {
      step: '01',
      title: 'Pre-Filter',
      subtitle: 'Предварительный микросетчатый барьер',
      icon: 'pets',
      badge: 'Крупные частицы',
      description:
        'Задерживает крупную бытовую пыль, шерсть домашних животных, волосы и тополиный пух, защищая и продлевая ресурс основного HEPA-картриджа.'
    },
    {
      step: '02',
      title: 'HEPA H13',
      subtitle: 'Медицинский класс фильтрации 99.97%',
      icon: 'coronavirus',
      badge: '99.97% до 0.1 мкм',
      description:
        'Плотно сложенное микроволокно удерживает 99.97% опасной зимней взвеси PM2.5, угольной сажи, пыльцы растений, спор плесени и бактерий.'
    },
    {
      step: '03',
      title: 'Сотовый активированный уголь',
      subtitle: 'Против запаха печного угля и гари',
      icon: 'cloud_off',
      badge: 'Анти-смог & TVOC',
      description:
        'Ячеистая матрица с гранулами активированного угля впитывает едкий запах печного угля, дыма от частного сектора, выхлопных газов и табака.'
    },
    {
      step: '04',
      title: 'Ионизатор 20 млн ионов',
      subtitle: 'Генератор отрицательных аэроионов',
      icon: 'air',
      badge: '20 000 000 ионов/см³',
      description:
        'Насыщает воздух 20 млн отрицательных ионов, связывает мельчайшую летающую пыль и дарит ощущение свежести горного ущелья после дождя.'
    }
  ],

  // Способы оплаты при получении в Бишкеке (Шаг 1, п. 3)
  paymentMethods: [
    {
      id: 'MBank',
      label: 'MBank',
      subtitle: 'Перевод / QR курьеру',
      icon: 'account_balance_wallet'
    },
    {
      id: 'Optima Pay',
      label: 'Optima Pay',
      subtitle: 'Оплата при получении',
      icon: 'payments'
    },
    {
      id: 'Элкарт / QR',
      label: 'Элкарт / QR',
      subtitle: 'Любой банк КР по QR',
      icon: 'qr_code_scanner'
    },
    {
      id: 'Наличными при получении',
      label: 'Наличными при получении',
      subtitle: 'Курьеру в сомах',
      icon: 'local_atm'
    }
  ],

  // Реальные условия сервиса в г. Бишкек (Шаг 3)
  bishkekService: {
    warrantyTitle: 'Официальная гарантия 12 месяцев',
    warrantyText: 'Официальная гарантия 12 месяцев в г. Бишкек.',
    deliveryTitle: 'Бесплатная экспресс-доставка в день заказа',
    deliveryText: 'Бесплатная экспресс-доставка по Бишкеку в день заказа.',
    safeBuyTitle: 'Без предоплаты — оплата после проверки',
    safeBuyText:
      'Без предоплаты! Оплата курьеру (MBank, Optima, QR или наличными) только после распаковки и проверки прибора при вас.'
  },

  // Быстрая консультация в WhatsApp (Приоритет 1.1)
  quickWhatsAppMessage:
    'Здравствуйте! Помогите, пожалуйста, подобрать очиститель AERA для квартиры',

  // Локальные резервные иллюстрации (Приоритет 3.4)
  fallbackAssets: {
    compact: '/assets/purifier-compact.svg',
    sense: '/assets/purifier-sense.svg',
    prox: '/assets/purifier-prox.svg',
    filter: '/assets/filter-hepa.svg',
    default: '/assets/purifier-sense.svg'
  },

  // Живой мониторинг смога по районам Бишкека (Приоритет 3.1)
  smogDistricts: [
    {
      id: 'center',
      label: 'Центр / Филармония',
      shortLabel: 'Центр',
      aqi: '215+',
      outdoorPm25: 165,
      indoorPm25: '005',
      status: 'Опасно для дыхания',
      badgeText: 'AQI 215+ • Опасно для дыхания',
      note: 'Плотный городской трафик и инверсия смога в центральной части Бишкека',
      recommendedModelId: 'sense'
    },
    {
      id: 'south',
      label: 'Южные мкр / Асанбай',
      shortLabel: 'Южные мкр',
      aqi: '175+',
      outdoorPm25: 118,
      indoorPm25: '004',
      status: 'Вредно для здоровья',
      badgeText: 'AQI 175+ • Вредно для здоровья',
      note: 'Вечерний спуск городского смога и мелкодисперсной пыли PM2.5 в спальные микрорайоны',
      recommendedModelId: 'sense'
    },
    {
      id: 'lower',
      label: 'Нижняя зона / Частный сектор',
      shortLabel: 'Нижняя зона',
      aqi: '285+',
      outdoorPm25: 238,
      indoorPm25: '006',
      status: 'Критический смог и гарь',
      badgeText: 'AQI 285+ • Критический смог и гарь',
      note: 'Максимальная концентрация угольной сажи и едкого печного дыма от частного сектора',
      recommendedModelId: 'prox'
    }
  ],

  // Быстрый выбор района бесплатной экспресс-доставки в Бишкеке (Приоритет 3.3)
  deliveryDistricts: [
    {
      id: 'south_mkr',
      label: 'Южные мкр (Асанбай, Джал, Кок-Жар)',
      shortLabel: 'Южные мкр / Асанбай / Джал',
      eta: '45–60 мин'
    },
    {
      id: 'center_square',
      label: 'Центр / Золотой квадрат / Филармония',
      shortLabel: 'Центр / Филармония',
      eta: '40–55 мин'
    },
    {
      id: 'east_alamedin',
      label: 'Восток-5 / Аламедин / Тунгуч',
      shortLabel: 'Восток-5 / Аламедин',
      eta: '50–70 мин'
    },
    {
      id: 'west_kyzyl_asker',
      label: 'Запад / Кызыл-Аскер / Ак-Орго',
      shortLabel: 'Кызыл-Аскер / Ак-Орго',
      eta: '55–75 мин'
    },
    {
      id: 'lower_zone',
      label: 'Нижняя зона / Жилмассивы',
      shortLabel: 'Нижняя зона / Жилмассивы',
      eta: '60–80 мин'
    }
  ],

  // Коды сотовых операторов Кыргызстана для умной валидации и подсказки (Приоритет 3.2)
  kyrgyzOperators: [
    {
      id: 'mega',
      name: 'Mega',
      codes: ['550', '551', '552', '553', '554', '555', '556', '557', '558', '559', '990', '995', '997', '998', '999', '755'],
      prefixes: ['550', '551', '552', '553', '554', '555', '556', '557', '558', '559', '990', '995', '997', '998', '999', '755']
    },
    {
      id: 'o',
      name: 'O!',
      codes: ['700', '701', '702', '703', '704', '705', '706', '707', '708', '709', '500', '501', '502', '503', '504', '505', '507', '508', '509'],
      prefixes: ['700', '701', '702', '703', '704', '705', '706', '707', '708', '709', '500', '501', '502', '503', '504', '505', '507', '508', '509']
    },
    {
      id: 'beeline',
      name: 'Beeline',
      codes: ['770', '771', '772', '773', '774', '775', '776', '777', '778', '779', '220', '221', '222', '223', '224', '225', '227'],
      prefixes: ['770', '771', '772', '773', '774', '775', '776', '777', '778', '779', '220', '221', '222', '223', '224', '225', '227']
    },
    {
      id: 'salam',
      name: 'Salam',
      codes: ['880', '888'],
      prefixes: ['880', '888']
    },
    {
      id: 'kt',
      name: 'Бишкек (гор.)',
      codes: ['312'],
      prefixes: ['312']
    }
  ],

  // Калькулятор экономии электроэнергии и фильтра в Бишкеке (Приоритет 3.3)
  economyCalculator: {
    tariffKgsPerKwh: 1.11,
    tariffSomPerKwh: 1.11,
    powerW: 35,
    powerWatts: 35,
    nightPowerW: 18,
    filterBundlePrice: 450,
    filterSeasonDays: 180
  },

  // Секция #before-after (До / После: Дымовой тест за 5 секунд, фильтр за 1 зиму и плашка экономичности 35 Вт)
  beforeAfter: {
    title: 'Дымовой тест за 5 секунд',
    smokeTestTitle: 'Дымовой тест за 5 секунд',
    beforeLabel: 'До: густой смог PM2.5 500 мкг/м³',
    afterLabel: 'После: чистый воздух PM2.5 005 мкг/м³',
    beforePm25: 500,
    afterPm25: '005',
    winterFilterTitle: 'Что задерживает фильтр AERA за 1 зиму в Бишкеке',
    newFilterLabel: 'Новый белый HEPA H13 картридж',
    usedFilterLabel: 'Черный от угольной сажи фильтр после сезона смога',
    addFilterBtnText: 'Добавить запасной фильтр за +450 сом',
    addFilterPrice: 450,
    winterFilterPrice: 450,
    economyBadgeText:
      'Потребление всего 35 Вт — около 25 сом в месяц за электричество при ежедневной работе'
  },

  // Реальные отзывы жителей районов Бишкека (Приоритет 1.5)
  reviews: [
    {
      id: 'rev-asanbay',
      author: 'Айжан К.',
      district: 'мкр. Асанбай',
      modelId: 'sense',
      modelName: 'AERA Sense (AR-6662)',
      packageLabel: 'Комплект «Плюс»',
      role: 'Комплект «Плюс»',
      pmBefore: 168,
      pmAfter: 6,
      rating: 5,
      dateLabel: 'Январь 2026',
      date: 'Январь 2026',
      text: 'Взяли AERA Sense в детскую и спальню в Асанбае. Вечером когда открываешь окно проветрить, датчик PM2.5 сразу показывает 160–170 и включает турбо, а через 6 минут уже 006 и тишина! Запах гари с улицы уходит полностью, ребенок перестал кашлять по ночам.'
    },
    {
      id: 'rev-philharmonic',
      author: 'Бакыт и Мээрим',
      district: 'район Филармонии',
      modelId: 'sense',
      modelName: 'AERA Sense (AR-6662)',
      packageLabel: 'Комплект «Плюс»',
      role: 'Комплект «Плюс»',
      pmBefore: 194,
      pmAfter: 5,
      rating: 5,
      dateLabel: 'Февраль 2026',
      date: 'Февраль 2026',
      text: 'Живем в центре возле Филармонии. Очень удобно, что на цветном экране видны реальные цифры смога PM2.5 и температура. Курьер привез через час после заявки, при нас распаковал, проверили лазерный датчик и только потом оплатили по MBank QR.'
    },
    {
      id: 'rev-south-gates',
      author: 'Тимур А.',
      district: 'Южные ворота',
      modelId: 'prox',
      modelName: 'AERA Pro X (AR-669)',
      packageLabel: 'Комплект «Плюс»',
      role: 'Комплект «Плюс»',
      pmBefore: 152,
      pmAfter: 4,
      rating: 5,
      dateLabel: 'Январь 2026',
      date: 'Январь 2026',
      text: 'У нас квартира-студия 48 м² выше Южных ворот. Взяли флагманскую круглую башню AERA Pro X с цилиндрическим фильтром-бочонком 360°. Выглядит очень солидно, верхний круглый OLED-экран светится зеленым когда воздух чистый, тяга мощная и при этом ночью вообще не слышно.'
    },
    {
      id: 'rev-jal',
      author: 'Нургуль С.',
      district: 'мкр. Джал',
      modelId: 'compact',
      modelName: 'AERA Compact (AR-6614)',
      packageLabel: 'Комплект «Базовый»',
      role: 'Комплект «Базовый»',
      pmBefore: 145,
      pmAfter: 7,
      rating: 5,
      dateLabel: 'Февраль 2026',
      date: 'Февраль 2026',
      text: 'Искали недорогой, но настоящий HEPA H13 очиститель для спальни 18 м² в Джале. За 3 990 сом AERA Compact — просто находка! Места занимает минимум, пульт ДУ в комплекте, ночной режим 28 дБ не мешает спать, утром в комнате свежо как в горах.'
    },
    {
      id: 'rev-kyzyl-asker',
      author: 'Эрмек Т.',
      district: 'Кызыл-Аскер / частный сектор',
      modelId: 'sense',
      modelName: 'AERA Sense (AR-6662)',
      packageLabel: 'Комплект «Плюс»',
      role: 'Комплект «Плюс»',
      pmBefore: 245,
      pmAfter: 8,
      rating: 5,
      dateLabel: 'Декабрь 2025',
      date: 'Декабрь 2025',
      text: 'В нашем районе зимой соседи топят углем так, что дышать невозможно — едкий запах печной гари проникал даже через закрытые окна. Сотовый угольный фильтр в AERA Sense реально спасает: за 5–7 минут убирает запах дыма. Сразу взяли второй фильтр за 450 сом.'
    }
  ],

  // Часто задаваемые вопросы покупателей в Бишкеке (Приоритет 1.4)
  faqItems: [
    {
      id: 'faq-lifespan',
      question: 'На сколько хватает одного фильтра в сезон бишкекского смога?',
      answer:
        'Одного комбинированного картриджа AERA (Pre-Filter + медицинский HEPA H13 + сотовый активированный уголь) хватает на 4–6 месяцев ежедневной работы, то есть на один полный отопительный сезон в Бишкеке. Чтобы продлить ресурс HEPA-блока, достаточно раз в 2–3 недели аккуратно собирать крупную пыль с внешнего предварительного фильтра пылесосом. Именно поэтому 82% покупателей сразу выбирают Комплект «Плюс», где второй запасной фильтр идет за 450 сом вместо 950 сом.'
    },
    {
      id: 'faq-coal-smell',
      question: 'Убирает ли очиститель едкий запах печного угля и гари из частного сектора?',
      answer:
        'Да! В отличие от обычных бумажных фильтров, в каждом картридже AERA установлена третья ступень — ячеистая сотовая матрица с гранулами активированного угля (Active Carbon). Уголь абсорбирует летучие органические соединения (TVOC), запах печного угля, угарный дым, выхлопные газы и табачный дым, а слой HEPA H13 задерживает 99.97% черной сажи PM2.5.'
    },
    {
      id: 'faq-electricity',
      question: 'Сколько электроэнергии расходует прибор в месяц (в сомах)?',
      answer:
        'Все модели линейки AERA оснащены энергоэффективным двигателем мощностью всего 35 Вт (а в ночном режиме 28 дБ потребление снижается до 15–18 Вт). По тарифу электроэнергии в Бишкеке (1,11 сом за кВт·ч) даже при круглосуточной работе 24/7 очиститель расходует около 0,7–0,9 сом в сутки — это всего 22–28 сом за целый месяц непрерывной защиты семьи!'
    },
    {
      id: 'faq-ionizer-safe',
      question: 'Безопасен ли ионизатор 20 млн ионов для грудных детей и аллергиков?',
      answer:
        'Абсолютно безопасен. Генератор AERA вырабатывает мягкие отрицательные аэроионы (20 млн ионов/см³) без выделения вредного озона. Ионы утяжеляют мельчайшую взвешенную пыль и аллергены, помогая фильтру быстрее затягивать их внутрь, и создают ощущение свежего воздуха как в ущелье Ала-Арча после дождя. При желании ионизацию можно включать и выключать одной кнопкой.'
    },
    {
      id: 'faq-filters-stock',
      question: 'Всегда ли есть сменные фильтры в наличии в Бишкеке?',
      answer:
        'Да, сменные картриджи AERA HEPA H13 + Active Carbon постоянно в наличии на нашем складе в г. Бишкек. Отдельная стоимость картриджа — 950 сом, а при заказе вместе с очистителем (или в Комплекте «Плюс») действует спеццена 450 сом (-53% выгоды).'
    },
    {
      id: 'faq-delivery-payment',
      question: 'Как проходит бесплатная доставка по Бишкеку и проверка перед оплатой?',
      answer:
        'Вы оставляете заявку на сайте без какой-либо предоплаты. Наш курьер бесплатно доставляет прибор по Бишкеку в день заказа (обычно за 45–80 минут). При вас курьер распаковывает очиститель, показывает установленный фильтр HEPA H13, включает прибор в розетку и проверяет все режимы. Только после полной проверки вы оплачиваете заказ удобным способом: MBank, Optima Pay, Элкарт / QR или наличными.'
    }
  ]
};

if (typeof window !== 'undefined') {
  window.siteConfig = siteConfig;
  window.SITE_CONFIG = siteConfig;
}

if (typeof globalThis !== 'undefined') {
  globalThis.siteConfig = siteConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = siteConfig;
  module.exports.siteConfig = siteConfig;
  module.exports.default = siteConfig;
  module.exports.MODELS = siteConfig.models;
  module.exports.CONTACTS = siteConfig.contacts;
  module.exports.TELEGRAM_BOT_TOKEN = siteConfig.TELEGRAM_BOT_TOKEN;
  module.exports.TELEGRAM_CHAT_ID = siteConfig.TELEGRAM_CHAT_ID;
  module.exports.WHATSAPP_NUMBER = siteConfig.WHATSAPP_NUMBER;
  module.exports.PHONE_DISPLAY = siteConfig.PHONE_DISPLAY;
  module.exports.PHONE_HREF = siteConfig.PHONE_HREF;
  module.exports.WHATSAPP_HREF = siteConfig.WHATSAPP_HREF;
}
