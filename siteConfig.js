/**
 * Конфигурация магазина AERA Bishkek (siteConfig.js)
 * Реальные данные моделей, комплектаций, цен и интеграций (Telegram + WhatsApp + Meta Pixel).
 */

const siteConfig = {
  brand: 'AERA',
  storeName: 'AERA Bishkek',
  city: 'Бишкек',
  currency: 'KGS',
  currencySymbol: 'сом',

  // Контакты и интеграции (Шаг 4)
  // Заказы уходят на серверную функцию /api/order (Vercel), токен бота хранится в переменных окружения
  // TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID на сервере. Не вписывайте реальный токен сюда — он будет виден в браузере.
  ORDER_ENDPOINT: '/api/order',
  TELEGRAM_BOT_TOKEN: '',
  TELEGRAM_CHAT_ID: '',
  WHATSAPP_NUMBER: '996555909090',
  PHONE_DISPLAY: '+996 (555) 90-90-90',
  PHONE_HREF: 'tel:+996555909090',
  WORK_HOURS: 'Ежедневно 09:00 — 21:00',
  META_PIXEL_ID: 'AERA_BISHKEK_PIXEL',

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

  // Линейка приборов AERA (Шаг 2, п. 1–3)
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
      areaLabel: 'До 20 м²',
      areaRecommendedMax: 25,
      areaSliderDefault: 18,
      priorityId: 'bedroom',
      priorityLabel: 'Для детской/спальни',
      powerW: 35,
      cadr: 180,
      heightCm: 48,
      dimensions: '256×128×480 мм',
      noiseDb: 28,
      summary:
        'Компактный и тихий очиститель для спальни и детской комнаты. Ночной режим 28 дБ, 6 сенсорных кнопок, таймер 1–8 ч и пульт ДУ в комплекте.',
      configuratorReason:
        'Идеален для детских и спален до 25 м²: тихий ночной режим 28 дБ не тревожит сон ребенка, а фильтр HEPA H13 + уголь убирает смог и аллергены за 5 минут.',
      specs: {
        power: '35 Вт',
        cadr: '180 м³/ч',
        area: 'До 25 м²',
        height: '48 см (256×128×480 мм)',
        noise: '28 дБ (ночной режим)',
        controls: '6 сенсорных кнопок, таймер 1–8 ч',
        display: 'Сенсорная панель с LED-индикацией режимов',
        remote: 'Пульт ДУ в комплекте',
        filtration: '4 ступени: Pre-Filter + HEPA H13 + Active Carbon + Ионизатор 20 млн'
      },
      highlights: [
        'Мощность 35 Вт, CADR 180 м³/ч',
        'Высота 48 см (256×128×480 мм)',
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
      sku: 'AR-920',
      name: 'AERA Sense',
      fullName: 'AERA Sense (AR-920)',
      badge: '★ ВЫБОР 70% В БИШКЕКЕ • ДО 30 М²',
      shortBadge: 'Хит продаж • До 30 м²',
      isHit: true,
      isFlagship: false,
      price: 4990,
      oldPrice: 6500,
      plusPrice: 5440,
      plusOldPrice: 7450,
      areaLabel: '20–30 м²',
      areaRecommendedMax: 30,
      areaSliderDefault: 26,
      priorityId: 'smog_auto',
      priorityLabel: 'Видеть цифры смога PM2.5 + Авторежим',
      powerW: 35,
      cadr: 240,
      heightCm: 51,
      dimensions: '300×155×510 мм',
      noiseDb: 28,
      summary:
        'Хит продаж в Бишкеке: цветной LCD-дисплей с лазерным датчиком PM2.5 и температурой, датчик запаха гари TVOC и Умный Авторежим.',
      configuratorReason:
        'Выбор 70% семей в Бишкеке: лазерный датчик PM2.5 и датчик гари TVOC выводят точные цифры смога на цветной LCD-экран, а Умный Авторежим сам ускоряет очистку при запахе угля.',
      specs: {
        power: '35 Вт',
        cadr: '240 м³/ч',
        area: 'До 30 м²',
        height: '51 см (300×155×510 мм)',
        noise: '28 дБ (ночной режим)',
        controls: 'Умный Авторежим + сенсорное управление + таймер',
        display: 'Цветной LCD-дисплей с лазерным датчиком PM2.5, TVOC и температурой',
        remote: 'Пульт ДУ в комплекте',
        filtration: '4 ступени: Pre-Filter + HEPA H13 + Active Carbon + Ионизатор 20 млн'
      },
      highlights: [
        'Цветной LCD-дисплей: цифры PM2.5 и температура',
        'Датчик запаха гари TVOC + Умный Авторежим',
        'Мощность 35 Вт, CADR 240 м³/ч, высота 51 см (300×155×510 мм)',
        'Ночной режим 28 дБ, пульт ДУ в комплекте'
      ],
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDNFPl_c9lpLr-LbGTokDdSxn1kOrk3_mLGrFrV_oTyTukpps8g4CdLb-4zEcxh8XACy6X4Tw6bzZ1DrnVVtBVMlPBbtazEt_n1FJDuQv0zTOOCw0saqNpHcz6Gp1jg6tvRKEKlnpEWQb8pTzLgr7WLBm60S7hk_sUS3FE57bUbScopGHI4FKARhEPtRTQZeX_Et5od5AaykYjbW-bVUkmiEGon_cVODZGztV04D1DYqU32p2tRKree',
      gallery: [
        {
          label: '1. Общий вид',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNFPl_c9lpLr-LbGTokDdSxn1kOrk3_mLGrFrV_oTyTukpps8g4CdLb-4zEcxh8XACy6X4Tw6bzZ1DrnVVtBVMlPBbtazEt_n1FJDuQv0zTOOCw0saqNpHcz6Gp1jg6tvRKEKlnpEWQb8pTzLgr7WLBm60S7hk_sUS3FE57bUbScopGHI4FKARhEPtRTQZeX_Et5od5AaykYjbW-bVUkmiEGon_cVODZGztV04D1DYqU32p2tRKree',
          alt: 'AERA Sense AR-920 с цветным LCD-дисплеем PM2.5'
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
      sku: 'AR-921',
      name: 'AERA Pro X',
      fullName: 'AERA Pro X (AR-921)',
      badge: 'ФЛАГМАН 360° • ДЛЯ ЗАЛА И СТУДИИ 40–60 М²',
      shortBadge: 'Флагман 360° • 40–60 м²',
      isHit: false,
      isFlagship: true,
      price: 7290,
      oldPrice: 9800,
      plusPrice: 7740,
      plusOldPrice: 10750,
      areaLabel: '40–60 м²',
      areaRecommendedMax: 60,
      areaSliderDefault: 50,
      priorityId: 'max_360',
      priorityLabel: 'Максимальная мощность 360° для зала',
      powerW: 35,
      cadr: 320,
      heightCm: 60,
      dimensions: '252×252×600 мм',
      noiseDb: 28,
      summary:
        'Флагманская колонна 60 см с цилиндрическим фильтром-бочонком 360°, CADR 320 м³/ч и верхним круглым OLED-дисплеем с трехцветным кольцом качества воздуха.',
      configuratorReason:
        'Максимальная турбо-тяга 360° (CADR 320 м³/ч) для просторных залов и квартир-студий 40–60 м²: цилиндрический фильтр-бочонок забирает смог со всех сторон, а верхний OLED-дисплей светится Зеленым/Желтым/Красным.',
      specs: {
        power: '35 Вт',
        cadr: '320 м³/ч',
        area: '40–60 м² (зал / студия)',
        height: '60 см (252×252×600 мм), корпус ABS-пластик',
        noise: '28 дБ (ночной режим)',
        controls: 'Сенсорный верхний OLED-дисплей + Авторежим',
        display:
          'Верхний круглый OLED-дисплей с трехцветным кольцом (Зеленый/Желтый/Красный), PM2.5 и температурой',
        remote: 'Пульт ДУ в комплекте',
        filtration: 'Цилиндрический фильтр-бочонок 360° (HEPA H13 + уголь) + Ионизатор 20 млн'
      },
      highlights: [
        'Высокая колонна 60 см (252×252×600 мм) из ABS-пластика',
        'Цилиндрический фильтр-бочонок 360°, CADR 320 м³/ч',
        'Верхний круглый OLED-дисплей с 3-цветным кольцом AQI, PM2.5 и °C',
        'Мощность 35 Вт, ночной режим 28 дБ, пульт ДУ в комплекте'
      ],
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA8EstV8GIewqkJf6jwih-_x_HT-R1-LfqCNPVwg6RrdZGgV34MIBqcyhvN3HCJpAy9HBTCPTqTAOrfNFIXjmAjsJEHe-pdgPC24tK9P8i8CtQwprdepLNCSBUVUoY20eOtzyz6SZqaNrQqroPVzrcM3v0uPTZILHC691KDPnaLoIEuUnn4V-JGy9YXElhMyn1lO2Equff62LNZnLSR4yYiogSgrm33lepQ3rB-7DszRzrVneYiX2H5',
      gallery: [
        {
          label: '1. Колонна 60 см',
          src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8EstV8GIewqkJf6jwih-_x_HT-R1-LfqCNPVwg6RrdZGgV34MIBqcyhvN3HCJpAy9HBTCPTqTAOrfNFIXjmAjsJEHe-pdgPC24tK9P8i8CtQwprdepLNCSBUVUoY20eOtzyz6SZqaNrQqroPVzrcM3v0uPTZILHC691KDPnaLoIEuUnn4V-JGy9YXElhMyn1lO2Equff62LNZnLSR4yYiogSgrm33lepQ3rB-7DszRzrVneYiX2H5',
          alt: 'Флагманская колонна AERA Pro X AR-921 высотой 60 см'
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
          alt: 'AERA Pro X в просторном зале 40–60 м²'
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
      { id: 'compact', label: 'До 20 м²', modelId: 'compact', defaultSqm: 18, minSqm: 10, maxSqm: 20 },
      { id: 'sense', label: '20–30 м²', modelId: 'sense', defaultSqm: 26, minSqm: 21, maxSqm: 35 },
      { id: 'prox', label: '40–60 м²', modelId: 'prox', defaultSqm: 50, minSqm: 36, maxSqm: 60 }
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
        subtitle: 'Колонна 60 см, бочонок 360° и круглый OLED'
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
  }
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
  module.exports.TELEGRAM_BOT_TOKEN = siteConfig.TELEGRAM_BOT_TOKEN;
  module.exports.TELEGRAM_CHAT_ID = siteConfig.TELEGRAM_CHAT_ID;
  module.exports.WHATSAPP_NUMBER = siteConfig.WHATSAPP_NUMBER;
}
