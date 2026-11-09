/**
 * Основная клиентская логика приложения AERA Bishkek (app.js)
 * Объединяет:
 * 1. Умный конфигуратор (площадь + ползунок + приоритет + быстрый заказ из конфигуратора)
 * 2. Каталог из 3 реальных моделей (AERA Compact AR-6614, AERA Sense AR-6662, AERA Pro X AR-669)
 * 3. Модальное окно / Drawer детальной карточки товара (выбор Базовый / Плюс +450 сом, заказ в 1 клик)
 * 4. Выезжающую корзину (Drawer) с апсейлом фильтра за +450 сом и выбором оплаты (MBank, Optima Pay, Элкарт / QR, Наличными)
 * 5. Отправку лидов: Meta Pixel fbq('track', 'Lead'), Telegram Bot API Webhook, WhatsApp Redirect.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    const config = require('./siteConfig.js');
    module.exports = factory(config);
  } else {
    root.AeraApp = factory(root.siteConfig || root.SITE_CONFIG);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (config) {
  'use strict';

  const siteConfig = config || (typeof window !== 'undefined' ? window.siteConfig : {});

  // --- Экранирование HTML для Telegram parse_mode: 'HTML' и безопасной вставки в DOM ---
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Форматирование чисел и цен ---
  function formatPrice(num) {
    const n = Number(num) || 0;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ' + (siteConfig.currencySymbol || 'сом');
  }

  function formatNumberOnly(num) {
    const n = Number(num) || 0;
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  // --- Расчет времени полной очистки помещения (в минутах) ---
  // Стандартная формула воздухообмена: (площадь * высота_потолка_2.7м) / CADR * 60,
  // с калибровкой под экспресс-цикл циркуляции AERA (от 5 минут)
  function calculateCleaningMinutes(areaSqm, cadr) {
    const sqm = Math.max(8, Number(areaSqm) || 20);
    const cadrVal = Math.max(100, Number(cadr) || 240);
    const rawMinutes = (sqm * 2.7 * 60) / cadrVal / 3;
    return Math.max(4, Math.round(rawMinutes));
  }

  // --- Извлечение 9 цифр абонентского номера Кыргызстана (после +996 или 0) ---
  function extractKyrgyzSubscriberDigits(rawInput) {
    if (!rawInput) return '';
    let digits = String(rawInput).replace(/\D/g, '');
    if (digits.startsWith('996')) {
      digits = digits.slice(3);
    }
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 9);
  }

  // --- Определение мобильного оператора Кыргызстана по коду (Mega, O!, Beeline, Бишкек) ---
  function detectKyrgyzOperator(phoneStr) {
    const digits = extractKyrgyzSubscriberDigits(phoneStr);
    const code = digits.slice(0, 3);
    const operators = siteConfig.kyrgyzOperators || [];
    const matched =
      code.length === 3
        ? operators.find((op) => (op.codes || op.prefixes || []).includes(code))
        : null;
    return {
      code,
      operatorId: matched ? matched.id || matched.name.toLowerCase() : null,
      operatorName: matched ? matched.name : null,
      isKnownOperator: Boolean(matched),
      isValidLength: digits.length === 9
    };
  }

  // --- Маска телефона Кыргызстана +996 (___) __-__-__ ---
  function formatKyrgyzPhone(rawInput) {
    if (!rawInput) return '';
    const digits = extractKyrgyzSubscriberDigits(rawInput);
    if (digits.length === 0) return '';

    let result = '+996 (' + digits.slice(0, 3);
    if (digits.length > 3) {
      result += ') ' + digits.slice(3, 5);
    }
    if (digits.length > 5) {
      result += '-' + digits.slice(5, 7);
    }
    if (digits.length > 7) {
      result += '-' + digits.slice(7, 9);
    }
    return result;
  }

  function isValidKyrgyzPhone(phoneStr) {
    if (!phoneStr) return false;
    const subscriberDigits = extractKyrgyzSubscriberDigits(phoneStr);
    return subscriberDigits.length === 9;
  }

  // --- Расчет суточного объема очищенного воздуха в литрах (CADR м³/ч -> л/сутки) ---
  function calculateDailyLiters(cadr) {
    const cadrVal = Math.max(0, Number(cadr) || 0);
    return Math.round(cadrVal * 1000 * 24);
  }

  // --- Расчет стоимости электроэнергии по тарифу Бишкека (1.11 сом/кВт·ч) ---
  function calculateElectricityCost(
    hoursPerDay = 24,
    powerW = siteConfig.economyCalculator?.powerWatts || 35,
    tariff = siteConfig.economyCalculator?.tariffSomPerKwh || 1.11
  ) {
    const hours = Math.max(1, Math.min(24, Number(hoursPerDay) || 24));
    const watts = Math.max(1, Number(powerW) || 35);
    const rate = Math.max(0.1, Number(tariff) || 1.11);
    const dailyKwh = (watts * hours) / 1000;
    const dailyCostSom = Number((dailyKwh * rate).toFixed(2));
    const monthlyCostSom = Math.round(dailyKwh * 30 * rate);
    return {
      hoursPerDay: hours,
      powerW: watts,
      tariff: rate,
      dailyKwh: Number(dailyKwh.toFixed(3)),
      dailyCostSom,
      monthlyCostSom
    };
  }

  // --- Поиск модели по ID ---
  function getModelById(modelId) {
    const models = siteConfig.models || [];
    return models.find((m) => m.id === modelId) || models[1] || models[0];
  }

  // --- Логика Умного конфигуратора ---
  // Поддерживает выбор по площади ('compact' | 'sense' | 'prox'), ползунку м² (10..60) и приоритету ('bedroom' | 'smog_auto' | 'max_360')
  function getRecommendedModel({ areaId, priorityId, sqm, lastChanged }) {
    const models = siteConfig.models || [];
    if (!models.length) return null;

    if (lastChanged === 'priority' && priorityId) {
      const byPriority = models.find((m) => m.priorityId === priorityId);
      if (byPriority) return byPriority;
    }

    if (lastChanged === 'slider' && typeof sqm === 'number') {
      if (sqm <= 25) return getModelById('compact');
      if (sqm <= 30) return getModelById('sense');
      return getModelById('prox');
    }

    if (lastChanged === 'area' && areaId) {
      const byArea = getModelById(areaId);
      if (byArea) return byArea;
    }

    // Комбинированное правило по умолчанию: выбираем модель, покрывающую максимум из требований площади и приоритета
    const rank = { compact: 1, sense: 2, prox: 3 };
    const priorityToModel = {
      bedroom: 'compact',
      smog_auto: 'sense',
      max_360: 'prox'
    };

    const areaModelId = areaId && rank[areaId] ? areaId : 'sense';
    const prioModelId = priorityToModel[priorityId] || areaModelId;
    const bestId = rank[prioModelId] > rank[areaModelId] ? prioModelId : areaModelId;
    return getModelById(bestId);
  }

  // --- Извлечение UTM-меток из URL ---
  function extractUtmParams(searchStr) {
    const query =
      typeof searchStr === 'string'
        ? searchStr
        : typeof window !== 'undefined' && window.location
        ? window.location.search
        : '';
    const params = new URLSearchParams(query || '');
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const utm = {};
    utmKeys.forEach((key) => {
      const val = params.get(key);
      if (val) utm[key] = val;
    });
    return utm;
  }

  // --- Генерация текста и ссылки WhatsApp (Шаг 4, п. 3) ---
  function buildWhatsAppOrderText({ modelAndPackage, totalAmount, paymentMethod, phone }) {
    const cleanModelPkg = (modelAndPackage || 'AERA Sense (Комплект «Базовый»)').trim();
    const cleanAmount = Number(totalAmount) || 0;
    const cleanPayment = (paymentMethod || 'При получении').trim();
    const cleanPhone = (phone || '').trim();

    return `Здравствуйте, AERA! Хочу заказать: ${cleanModelPkg} на сумму ${cleanAmount} сом. Способ оплаты: ${cleanPayment}. Мой номер: ${cleanPhone}.`;
  }

  function buildWhatsAppUrl(orderData) {
    const waNumber = String(
      siteConfig.contacts?.whatsappNumber || siteConfig.WHATSAPP_NUMBER || '996555909090'
    ).replace(/\D/g, '');
    const text = buildWhatsAppOrderText(orderData);
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  }

  // --- Генерация ссылки быстрого чата консультации в WhatsApp ---
  function buildQuickWhatsAppChatUrl(customText) {
    if (!customText && siteConfig.contacts?.whatsappHref) {
      return siteConfig.contacts.whatsappHref;
    }
    const waNumber = String(
      siteConfig.contacts?.whatsappNumber || siteConfig.WHATSAPP_NUMBER || '996555909090'
    ).replace(/\D/g, '');
    const message = (
      customText ||
      siteConfig.quickWhatsAppMessage ||
      'Здравствуйте! Помогите, пожалуйста, подобрать очиститель AERA для квартиры'
    ).trim();
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
  }

  // --- Генерация полезной нагрузки для Telegram Bot API (Шаг 4, п. 2) ---
  function buildTelegramPayload(orderData) {
    const {
      source = 'Сайт AERA Bishkek',
      name = 'Клиент',
      phone = '',
      district = '',
      modelName = 'AERA Sense',
      packageName = 'Базовый',
      modelAndPackage = '',
      paymentMethod = 'MBank',
      totalAmount = 0,
      utm = {}
    } = orderData;

    const utmEntries = Object.entries(utm || {});
    const utmString =
      utmEntries.length > 0
        ? utmEntries.map(([k, v]) => `${escapeHtml(k)}=${escapeHtml(v)}`).join(', ')
        : 'Прямой заход (без UTM)';

    const composedModelPkg = modelAndPackage || `${modelName} (${packageName})`;

    const lines = [
      '🏔 <b>Новый заказ AERA Bishkek!</b>',
      `📍 <b>Источник формы:</b> ${escapeHtml(source)}`,
      `👤 <b>Имя:</b> ${escapeHtml(name || 'Не указано')}`,
      `📞 <b>Телефон:</b> ${escapeHtml(phone)}`
    ];
    if (district) {
      lines.push(`🏘 <b>Район доставки:</b> ${escapeHtml(district)}`);
    }
    lines.push(
      `💨 <b>Модель:</b> ${escapeHtml(modelName)}`,
      `📦 <b>Комплект:</b> ${escapeHtml(packageName)}`,
      `🧾 <b>Состав заказа:</b> ${escapeHtml(composedModelPkg)}`,
      `💳 <b>Способ оплаты:</b> ${escapeHtml(paymentMethod)}`,
      `💰 <b>Сумма к оплате:</b> ${escapeHtml(formatPrice(totalAmount))} (${Number(totalAmount) || 0} KGS)`,
      `📊 <b>UTM-метки:</b> ${utmString}`
    );

    return {
      chat_id: siteConfig.TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      meta: {
        name: name || 'Не указано',
        phone,
        district: district || 'Бишкек',
        modelName,
        packageName,
        modelAndPackage: composedModelPkg,
        paymentMethod,
        totalAmount: Number(totalAmount) || 0,
        currency: 'KGS',
        utm
      }
    };
  }

  // --- Отправка заказа: Meta Pixel + Telegram Webhook + WhatsApp Redirect (Шаг 4) ---
  async function submitOrder(orderInput, options = {}) {
    const utm = orderInput.utm || extractUtmParams();
    const totalAmount = Number(orderInput.totalAmount) || 0;
    const modelName = orderInput.modelName || 'AERA Sense';
    const packageName = orderInput.packageName || 'Базовый';
    const modelAndPackage =
      orderInput.modelAndPackage || `${modelName} (Комплект «${packageName}»)`;
    const paymentMethod = orderInput.paymentMethod || 'MBank';
    const phone = String(orderInput.phone || '').trim();
    const name = String(orderInput.name || 'Клиент').trim();
    const rawDistrict = orderInput.district;
    const district =
      typeof rawDistrict === 'string'
        ? rawDistrict.trim()
        : rawDistrict && typeof rawDistrict.label === 'string'
        ? rawDistrict.label.trim()
        : '';
    const source = orderInput.source || 'Быстрый заказ';

    const normalizedOrder = {
      source,
      name,
      phone,
      district,
      modelName,
      packageName,
      modelAndPackage,
      paymentMethod,
      totalAmount,
      utm
    };

    // 1. Meta Pixel Lead Event: fbq('track', 'Lead', { value: totalAmount, currency: 'KGS' })
    const fbqPayload = { value: totalAmount, currency: 'KGS' };
    if (typeof window !== 'undefined') {
      window.__aeraLastFbqEvent = ['track', 'Lead', fbqPayload];
      if (typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'Lead', fbqPayload);
        } catch (_err) {
          // Игнорируем ошибки блокировщиков рекламы
        }
      }
    }

    // 2. Подготовка POST-запроса в Telegram Bot API и ссылки WhatsApp
    const telegramPayload = buildTelegramPayload(normalizedOrder);
    const botToken = siteConfig.TELEGRAM_BOT_TOKEN;
    const telegramEndpoint =
      siteConfig.ORDER_ENDPOINT || `https://api.telegram.org/bot${botToken}/sendMessage`;
    const whatsappUrl = buildWhatsAppUrl(normalizedOrder);
    const whatsappText = buildWhatsAppOrderText(normalizedOrder);

    let telegramResponseOk = false;
    const fetchFn =
      options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);

    if (typeof window !== 'undefined') {
      window.__aeraLastTelegramRequest = {
        url: telegramEndpoint,
        payload: telegramPayload
      };
      window.__aeraLastWhatsAppUrl = whatsappUrl;
      window.__aeraLastOrder = {
        ...normalizedOrder,
        whatsappUrl,
        whatsappText,
        telegramEndpoint,
        telegramPayload
      };
    }

    // Запускаем отправку в Telegram и синхронно открываем WhatsApp в рамках пользовательского жеста (защита от блокировщиков всплывающих окон)
    const telegramPromise =
      fetchFn && (siteConfig.ORDER_ENDPOINT || botToken)
        ? Promise.resolve()
            .then(() =>
              fetchFn(telegramEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                  chat_id: telegramPayload.chat_id,
                  text: telegramPayload.text,
                  parse_mode: telegramPayload.parse_mode,
                  customer_name: name,
                  phone,
                  district,
                  model: modelName,
                  package: packageName,
                  payment_method: paymentMethod,
                  total_amount: totalAmount,
                  currency: 'KGS',
                  utm
                })
              })
            )
            .then((res) => Boolean(res && res.ok))
            .catch(() => false)
        : Promise.resolve(false);

    // 3. Синхронное открытие WhatsApp до await сетевого запроса, чтобы сохранить user activation
    if (typeof window !== 'undefined' && options.openWhatsApp !== false && typeof window.open === 'function') {
      try {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch (_err) {
        // Fallback ссылка доступна в UI подтверждения
      }
    }

    telegramResponseOk = await telegramPromise;

    return {
      ok: true,
      telegramResponseOk,
      fbqPayload,
      telegramEndpoint,
      telegramPayload,
      whatsappUrl,
      whatsappText,
      order: normalizedOrder
    };
  }

  // --- Хранилище корзины (CartStore) ---
  function createCartStore(initialItems) {
    let items = Array.isArray(initialItems) ? [...initialItems] : [];
    let selectedPayment = (siteConfig.paymentMethods && siteConfig.paymentMethods[0]?.id) || 'MBank';
    const listeners = new Set();

    function notify() {
      const snapshot = getState();
      listeners.forEach((fn) => fn(snapshot));
    }

    function hasPurifier() {
      return items.some((item) => item.type === 'purifier' && item.qty > 0);
    }

    function getFilterUnitPrice() {
      const fc = siteConfig.filterCartridge || { standalonePrice: 950, bundlePrice: 450 };
      return hasPurifier() ? fc.bundlePrice : fc.standalonePrice;
    }

    function getState() {
      const purifierPresent = hasPurifier();
      const filterUnitPrice = getFilterUnitPrice();
      const fc = siteConfig.filterCartridge || { standalonePrice: 950, bundlePrice: 450 };

      const enrichedItems = items.map((item) => {
        if (item.type === 'addon-filter') {
          const unitPrice = filterUnitPrice;
          const oldUnitPrice = fc.standalonePrice;
          return {
            ...item,
            unitPrice,
            oldUnitPrice,
            lineTotal: unitPrice * item.qty,
            lineOldTotal: oldUnitPrice * item.qty,
            isBundleDiscounted: purifierPresent
          };
        }
        return {
          ...item,
          lineTotal: item.unitPrice * item.qty,
          lineOldTotal: (item.oldUnitPrice || item.unitPrice) * item.qty
        };
      });

      const totalCount = enrichedItems.reduce((sum, i) => sum + i.qty, 0);
      const totalAmount = enrichedItems.reduce((sum, i) => sum + i.lineTotal, 0);
      const totalOldAmount = enrichedItems.reduce((sum, i) => sum + i.lineOldTotal, 0);
      const totalSavings = Math.max(0, totalOldAmount - totalAmount);

      return {
        items: enrichedItems,
        totalCount,
        totalAmount,
        totalOldAmount,
        totalSavings,
        hasPurifier: purifierPresent,
        filterUnitPrice,
        selectedPayment
      };
    }

    function addPurifier(modelId, packageId = 'base', qty = 1) {
      const model = getModelById(modelId);
      if (!model) return getState();
      const pkg = model.packages?.[packageId] || model.packages?.base;
      const key = `${model.id}__${pkg.id}`;

      const existing = items.find((i) => i.key === key);
      if (existing) {
        existing.qty = Math.min(10, existing.qty + qty);
      } else {
        items.push({
          key,
          type: 'purifier',
          modelId: model.id,
          sku: model.sku,
          name: model.name,
          packageId: pkg.id,
          packageTitle: pkg.title,
          packageShortTitle: pkg.shortTitle,
          unitPrice: pkg.price,
          oldUnitPrice: pkg.oldPrice,
          image: model.image,
          badge: model.shortBadge || model.badge,
          qty: Math.max(1, qty)
        });
      }
      notify();
      return getState();
    }

    function addFilterAddon(qty = 1) {
      const fc = siteConfig.filterCartridge;
      const key = 'addon__filter-hepa-h13';
      const existing = items.find((i) => i.key === key);
      if (existing) {
        existing.qty = Math.min(10, existing.qty + qty);
      } else {
        items.push({
          key,
          type: 'addon-filter',
          modelId: fc.id,
          sku: 'HEPA-H13-CARBON',
          name: fc.shortName,
          packageId: 'addon',
          packageTitle: 'Спеццена к заказу',
          packageShortTitle: 'Доп. фильтр HEPA H13 + Carbon',
          unitPrice: getFilterUnitPrice(),
          oldUnitPrice: fc.standalonePrice,
          image: fc.image,
          badge: 'HEPA H13 + Carbon',
          qty: Math.max(1, qty)
        });
      }
      notify();
      return getState();
    }

    function updateQty(key, delta) {
      const idx = items.findIndex((i) => i.key === key);
      if (idx === -1) return getState();
      const nextQty = items[idx].qty + delta;
      if (nextQty <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx].qty = Math.min(10, nextQty);
      }
      notify();
      return getState();
    }

    function removeItem(key) {
      items = items.filter((i) => i.key !== key);
      notify();
      return getState();
    }

    function clear() {
      items = [];
      notify();
      return getState();
    }

    function setPaymentMethod(paymentId) {
      selectedPayment = paymentId;
      notify();
      return getState();
    }

    function getOrderSummaryStrings() {
      const state = getState();
      if (state.items.length === 0) {
        return {
          modelName: 'Не выбрано',
          packageName: 'Не выбрано',
          modelAndPackage: 'Корзина пуста'
        };
      }

      const parts = state.items.map((item) => {
        if (item.type === 'addon-filter') {
          return `${item.name} × ${item.qty} шт.`;
        }
        return `${item.name} (${item.packageShortTitle}) × ${item.qty} шт.`;
      });

      const primaryPurifiers = state.items
        .filter((i) => i.type === 'purifier')
        .map((i) => i.name);
      const primaryPackages = state.items
        .filter((i) => i.type === 'purifier')
        .map((i) => i.packageShortTitle);

      const hasExtraCartAddon = state.items.some((i) => i.type === 'addon-filter');
      const packageLabel =
        primaryPackages.length > 0
          ? primaryPackages.join(', ') + (hasExtraCartAddon ? ' + Запасной картридж HEPA H13' : '')
          : 'Сменный картридж HEPA H13 + Active Carbon';

      return {
        modelName: primaryPurifiers.length > 0 ? primaryPurifiers.join(', ') : state.items[0].name,
        packageName: packageLabel,
        modelAndPackage: parts.join(' + ')
      };
    }

    function subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }

    return {
      getState,
      addPurifier,
      addFilterAddon,
      updateQty,
      removeItem,
      clear,
      setPaymentMethod,
      getOrderSummaryStrings,
      subscribe
    };
  }

  // --- Полифилл Light Dismiss для <dialog closedby="any"> (modern-web-guidance: light-dismiss-a-dialog) ---
  function attachDialogLightDismissFallback(dialog) {
    if (!dialog || typeof HTMLDialogElement === 'undefined') return;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    }
  }

  function openDialogModal(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch (_err) {
          dialog.setAttribute('open', '');
        }
      }
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeDialogModal(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  // --- Безопасная работа с localStorage (корзина и профиль клиента) ---
  const STORAGE_KEYS = {
    CART: 'aera_cart_state_v1',
    PROFILE: 'aera_customer_profile_v1'
  };

  function loadStorageJson(key) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_err) {
      return null;
    }
  }

  function saveStorageJson(key, value) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_err) {
      return false;
    }
  }

  // --- Инициализация DOM-интерфейса ---
  function initApp(doc = typeof document !== 'undefined' ? document : null) {
    if (!doc) return null;

    // Инициализируем Meta Pixel stub, если не подключен внешний скрипт
    if (typeof window !== 'undefined') {
      window.__fbqEvents = window.__fbqEvents || [];
      if (typeof window.fbq !== 'function') {
        window.fbq = function (...args) {
          window.__fbqEvents.push(args);
        };
      }
    }

    // Синхронизация всех ссылок телефона и WhatsApp в шапке и футере из единой переменной siteConfig.contacts (защита от about:invalid)
    function renderContactLinks() {
      const contacts = siteConfig.contacts || {};
      const phoneHref = contacts.phoneHref || siteConfig.PHONE_HREF || 'tel:+996555909090';
      const phoneDisplay =
        contacts.phoneDisplay || siteConfig.PHONE_DISPLAY || '+996 (555) 90-90-90';
      const whatsappHref =
        contacts.whatsappHref || siteConfig.WHATSAPP_HREF || buildQuickWhatsAppChatUrl();

      doc.querySelectorAll('[data-contact-phone], a[href^="tel:"]').forEach((el) => {
        el.setAttribute('href', phoneHref);
        if (el.textContent && el.textContent.includes('996') && el.children.length === 0) {
          el.textContent = phoneDisplay;
        }
      });

      doc.querySelectorAll('[data-contact-whatsapp], a[href*="wa.me"]').forEach((el) => {
        el.setAttribute('href', whatsappHref);
      });

      doc.querySelectorAll('a[href*="about:invalid"], a[href=""]').forEach((el) => {
        el.setAttribute(
          'href',
          el.hasAttribute('data-contact-phone') ? phoneHref : whatsappHref
        );
      });
    }

    // Проверяем сохраненное состояние корзины в localStorage; если нет — кладем хит продаж AERA Sense (AR-6662)
    const senseModel = getModelById('sense') || {};
    const defaultCartItems = [
      {
        key: 'sense__base',
        type: 'purifier',
        modelId: 'sense',
        sku: senseModel.sku || 'AR-6662',
        name: senseModel.name || 'AERA Sense',
        packageId: 'base',
        packageTitle: 'Комплект «Базовый»',
        packageShortTitle: 'Базовый',
        unitPrice: senseModel.price || 4990,
        oldUnitPrice: senseModel.oldPrice || 6500,
        image: senseModel.image,
        badge: senseModel.shortBadge || '★ Хит продаж • До 30 м²',
        qty: 1
      }
    ];

    const savedCartState = loadStorageJson(STORAGE_KEYS.CART);
    const initialCartItems =
      savedCartState && Array.isArray(savedCartState.items)
        ? savedCartState.items.map((item) => {
            if (item && item.type === 'purifier' && item.modelId) {
              const latestModel = getModelById(item.modelId);
              if (latestModel) {
                const pkg =
                  latestModel.packages?.[item.packageId] ||
                  latestModel.packages?.base ||
                  {};
                return {
                  ...item,
                  sku: latestModel.sku,
                  name: latestModel.name,
                  unitPrice: pkg.price || latestModel.price || item.unitPrice,
                  oldUnitPrice: pkg.oldPrice || latestModel.oldPrice || item.oldUnitPrice,
                  badge: latestModel.shortBadge || item.badge
                };
              }
            }
            return item;
          })
        : defaultCartItems;

    const cartStore = createCartStore(initialCartItems);
    if (savedCartState && savedCartState.selectedPayment) {
      cartStore.setPaymentMethod(savedCartState.selectedPayment);
    }

    function persistCartState(state) {
      const current = state || cartStore.getState();
      saveStorageJson(STORAGE_KEYS.CART, {
        items: current.items.map((item) => ({
          key: item.key,
          type: item.type,
          modelId: item.modelId,
          sku: item.sku,
          name: item.name,
          packageId: item.packageId,
          packageTitle: item.packageTitle,
          packageShortTitle: item.packageShortTitle,
          unitPrice: item.unitPrice,
          oldUnitPrice: item.oldUnitPrice,
          image: item.image,
          badge: item.badge,
          qty: item.qty
        })),
        selectedPayment: current.selectedPayment
      });
    }

    // Профиль клиента в localStorage (имя, телефон, район Бишкека)
    const savedProfile = loadStorageJson(STORAGE_KEYS.PROFILE) || {};
    const customerProfile = {
      name: typeof savedProfile.name === 'string' ? savedProfile.name : '',
      phone: typeof savedProfile.phone === 'string' ? savedProfile.phone : '',
      district: typeof savedProfile.district === 'string' ? savedProfile.district : ''
    };

    function syncProfileInputsToDom() {
      const nameIds = ['config-order-name', 'modal-order-name', 'cart-order-name'];
      const phoneIds = ['config-order-phone', 'modal-order-phone', 'cart-order-phone'];
      nameIds.forEach((id) => {
        const el = doc.getElementById(id);
        if (el && customerProfile.name && !el.value) {
          el.value = customerProfile.name;
        }
      });
      phoneIds.forEach((id) => {
        const el = doc.getElementById(id);
        if (el && customerProfile.phone && !el.value) {
          el.value = customerProfile.phone;
          updatePhoneOperatorHint(el);
        }
      });
      const districtSelect = doc.getElementById('config-order-district');
      if (districtSelect && customerProfile.district) {
        districtSelect.value = customerProfile.district;
      }
    }

    function saveCustomerProfile(partial = {}) {
      if (typeof partial.name === 'string') customerProfile.name = partial.name;
      if (typeof partial.phone === 'string') customerProfile.phone = partial.phone;
      if (typeof partial.district === 'string') {
        customerProfile.district = partial.district;
      }
      saveStorageJson(STORAGE_KEYS.PROFILE, customerProfile);
      syncProfileInputsToDom();
    }

    // Состояние Умного конфигуратора
    const configuratorState = {
      areaId: 'sense',
      priorityId: 'smog_auto',
      sqm: 26,
      packageId: 'base',
      recommendedModelId: 'sense',
      paymentMethod: 'MBank'
    };

    // Состояние Модального окна детальной карточки товара
    const modalState = {
      modelId: 'sense',
      packageId: 'base',
      galleryIndex: 0,
      sqm: 26,
      paymentMethod: 'MBank'
    };

    // Состояние виджета смога, блока До/После, калькулятора экономии и отзывов
    const smogWidgetState = {
      districtId: 'center',
      updatedTimeText: ''
    };

    const beforeAfterState = {
      sliderPercent: 50,
      litersModelId: 'sense',
      econHours: 24
    };

    const reviewsState = {
      filterModelId: 'all'
    };

    // Уведомления (Toast)
    function showToast(message) {
      const toast = doc.getElementById('toast-notification');
      const toastText = doc.getElementById('toast-text');
      if (!toast || !toastText) return;
      toastText.textContent = message;
      toast.classList.remove('-translate-y-8', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('-translate-y-8', 'opacity-0');
      }, 2800);
    }

    // Обновление бейджа оператора рядом с полем телефона
    function updatePhoneOperatorHint(input) {
      if (!input) return;
      const hintEl =
        (input.id && doc.querySelector(`[data-phone-hint="${input.id}"]`)) ||
        input.parentElement?.querySelector('[data-phone-hint]');
      if (!hintEl) return;
      const info = detectKyrgyzOperator(input.value);
      if (!info.code) {
        hintEl.textContent = 'Коды КР';
        return;
      }
      if (info.isKnownOperator) {
        hintEl.textContent = `${info.operatorName} (${info.code})${info.isValidLength ? ' ✓' : ''}`;
      } else if (info.code.length === 3) {
        hintEl.textContent = `Код ${info.code}`;
      } else {
        hintEl.textContent = 'Коды КР';
      }
    }

    // Привязка маски телефона ко всем полям input[type="tel"] + сохранение в localStorage
    function bindPhoneMasks() {
      const inputs = doc.querySelectorAll('input[type="tel"]');
      inputs.forEach((input) => {
        if (input.dataset.maskBound === 'true') return;
        input.dataset.maskBound = 'true';
        input.addEventListener('focus', () => {
          if (!input.value.trim()) {
            input.value = '+996 (';
          }
        });
        input.addEventListener('input', (e) => {
          const formatted = formatKyrgyzPhone(e.target.value);
          e.target.value = formatted;
          updatePhoneOperatorHint(e.target);
          saveCustomerProfile({ phone: formatted });
        });
      });

      const nameInputs = ['config-order-name', 'modal-order-name', 'cart-order-name'];
      nameInputs.forEach((id) => {
        const el = doc.getElementById(id);
        if (!el || el.dataset.profileBound === 'true') return;
        el.dataset.profileBound = 'true';
        el.addEventListener('input', (e) => {
          saveCustomerProfile({ name: e.target.value });
        });
      });

      const districtSelect = doc.getElementById('config-order-district');
      if (districtSelect && districtSelect.dataset.profileBound !== 'true') {
        districtSelect.dataset.profileBound = 'true';
        districtSelect.addEventListener('change', (e) => {
          saveCustomerProfile({ district: e.target.value });
        });
      }
    }

    // Привязка локальных SVG-заглушек (/assets/*.svg) при ошибке загрузки внешних изображений
    function bindImageFallbacks(rootEl = doc) {
      if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return;
      rootEl.querySelectorAll('img').forEach((img) => {
        const applyFallback = () => {
          const fallback =
            img.getAttribute('data-fallback-src') ||
            siteConfig.fallbackAssets?.sense ||
            '/assets/purifier-sense.svg';
          if (img.getAttribute('src') !== fallback) {
            img.setAttribute('src', fallback);
          }
        };
        if (img.dataset.fallbackBound !== 'true') {
          img.dataset.fallbackBound = 'true';
          img.addEventListener('error', applyFallback);
        }
        if (img.complete && typeof img.naturalWidth === 'number' && img.naturalWidth === 0) {
          applyFallback();
        }
      });
    }

    // --- 0. Живой виджет смога в Бишкеке (#live-smog-widget) ---
    function formatCurrentTimeHHMM() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    function renderLiveSmogWidget() {
      const districts = siteConfig.smogDistricts || [];
      const current =
        districts.find((d) => d.id === smogWidgetState.districtId) ||
        districts[0] || {
          id: 'center',
          label: 'Центр / Филармония',
          shortLabel: 'Центр',
          outdoorPm25: 198,
          indoorPm25: '005',
          aqi: '215+',
          status: 'Опасно для дыхания'
        };

      if (!smogWidgetState.updatedTimeText) {
        smogWidgetState.updatedTimeText = `Обновлено сегодня в ${formatCurrentTimeHHMM()}`;
      }

      const setElText = (id, text) => {
        const el = doc.getElementById(id);
        if (el) el.textContent = text;
      };

      const cleanAqi = String(current.aqi || '215').replace(/\+$/, '');
      const cleanIndoor = String(current.indoorPm25 || '005').padStart(3, '0');

      setElText('smog-updated-time', smogWidgetState.updatedTimeText);
      setElText('smog-district-name', current.label);
      setElText('smog-district-status', `AQI ${cleanAqi}+ • ${current.status}`);
      setElText('smog-outdoor-pm25', `${current.outdoorPm25} мкг/м³`);
      setElText('smog-indoor-pm25', `${cleanIndoor} мкг/м³`);
      setElText('hero-indoor-pm25', cleanIndoor);

      const headerSmogText =
        current.id === 'center'
          ? `Бишкек сейчас: AQI ${cleanAqi}+ • ${current.status}`
          : `Бишкек (${current.shortLabel}): AQI ${cleanAqi}+ • ${current.status}`;
      const headerIndicatorTextEl =
        doc.getElementById('bishkek-smog-indicator-text') ||
        doc.getElementById('bishkek-smog-indicator');
      if (headerIndicatorTextEl) {
        headerIndicatorTextEl.textContent = headerSmogText;
      }

      doc.querySelectorAll('[data-smog-district]').forEach((btn) => {
        const isSelected = btn.getAttribute('data-smog-district') === current.id;
        btn.classList.toggle('bg-[#0F172A]', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('bg-surface-container-low', !isSelected);
        btn.classList.toggle('text-slate-700', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });
    }

    // --- 1. Рендер Умного конфигуратора ---
    function renderConfigurator() {
      const model = getModelById(configuratorState.recommendedModelId);
      if (!model) return;

      const pkg = model.packages[configuratorState.packageId] || model.packages.base;
      const cleanMins = calculateCleaningMinutes(configuratorState.sqm, model.cadr);

      // Кнопки площади
      doc.querySelectorAll('[data-config-area]').forEach((btn) => {
        const isSelected = btn.getAttribute('data-config-area') === configuratorState.areaId;
        btn.classList.toggle('bg-[#0F172A]', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('shadow-md', isSelected);
        btn.classList.toggle('ring-2', isSelected);
        btn.classList.toggle('ring-[#0D9488]', isSelected);
        btn.classList.toggle('bg-surface-container', !isSelected);
        btn.classList.toggle('text-on-surface', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });

      // Ползунок площади
      const slider = doc.getElementById('config-area-slider');
      const sqmLabel = doc.getElementById('config-sqm-display');
      const cleanTimeLabel = doc.getElementById('config-clean-time');
      if (slider) {
        if (Number(slider.value) !== configuratorState.sqm) {
          slider.value = String(configuratorState.sqm);
        }
        slider.setAttribute(
          'aria-valuetext',
          `${configuratorState.sqm} м², очистка за ~${cleanMins} мин`
        );
      }
      if (sqmLabel) sqmLabel.textContent = `${configuratorState.sqm} м²`;
      if (cleanTimeLabel) cleanTimeLabel.textContent = `~ ${cleanMins} мин`;

      // Кнопки приоритета
      doc.querySelectorAll('[data-config-priority]').forEach((btn) => {
        const isSelected = btn.getAttribute('data-config-priority') === configuratorState.priorityId;
        btn.classList.toggle('bg-surface-container-lowest', isSelected);
        btn.classList.toggle('ring-2', isSelected);
        btn.classList.toggle('ring-[#0D9488]', isSelected);
        btn.classList.toggle('shadow-md', isSelected);
        btn.classList.toggle('bg-surface-container', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });

      // Переключатель комплекта внутри конфигуратора
      doc.querySelectorAll('[data-config-package]').forEach((btn) => {
        const isSelected = btn.getAttribute('data-config-package') === configuratorState.packageId;
        btn.classList.toggle('bg-[#0F172A]', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('bg-surface-container-lowest', !isSelected);
        btn.classList.toggle('text-on-surface', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });

      // Карточка рекомендации справа
      const setElText = (id, text) => {
        const el = doc.getElementById(id);
        if (el) el.textContent = text;
      };

      const imgEl = doc.getElementById('calc-result-img');
      if (imgEl) {
        imgEl.setAttribute(
          'data-fallback-src',
          model.fallbackImage || siteConfig.fallbackAssets?.[model.id] || '/assets/purifier-sense.svg'
        );
        imgEl.src = model.image;
        imgEl.alt = model.fullName;
      }

      setElText('calc-result-badge', model.badge);
      setElText('calc-result-sku', `Индекс: ${model.sku}`);
      setElText('calc-result-stock', model.stockLabel || '');
      setElText('calc-result-title', model.name);
      setElText('calc-result-desc', model.configuratorReason);
      setElText('calc-result-price', formatPrice(pkg.price));
      setElText('calc-result-old-price', formatPrice(pkg.oldPrice));
      setElText('calc-result-cadr', `CADR ${model.cadr} м³/ч • Очистка ${configuratorState.sqm} м² за ~${cleanMins} мин`);
      setElText(
        'calc-result-dimensions',
        `Высота ${model.heightCm} см (${model.dimensions}), вес ${model.weight || model.specs?.weight || ''}, мощность ${model.powerW} Вт`
      );
      setElText('calc-result-noise', `Ночной режим ${model.noiseDb} дБ • ${model.specs.display}`);
      setElText('calc-submit-btn-text', `Забронировать ${model.name} • ${formatPrice(pkg.price)}`);
    }

    // --- 2. Рендер сетки 3 моделей каталога ---
    function renderCatalogGrid() {
      const container = doc.getElementById('models-grid');
      if (!container) return;

      container.innerHTML = (siteConfig.models || [])
        .map((model) => {
          const isFeatured = model.isHit;
          const cardRing = isFeatured
            ? 'ring-2 ring-[#0D9488] shadow-xl relative'
            : 'ring-1 ring-slate-900/5 shadow-md hover:shadow-xl relative';

          const highlightsHtml = (model.highlights || [])
            .map(
              (hl) =>
                `<li class="flex items-start gap-1.5 text-[11px] sm:text-[12px] text-slate-600 leading-snug"><span class="text-[#0D9488] font-bold">✓</span><span>${escapeHtml(hl)}</span></li>`
            )
            .join('');

          const fallbackImg =
            model.fallbackImage ||
            siteConfig.fallbackAssets?.[model.id] ||
            '/assets/purifier-sense.svg';

          return `
          <article
            class="model-card flex flex-col justify-between p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white transition-all duration-300 ${cardRing} cursor-pointer group"
            data-model-card="${model.id}"
          >
            ${
              model.isHit
                ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 sm:py-1 rounded-full bg-[#0D9488] text-white font-label-sm text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap z-10">
                    ${escapeHtml(model.badge)}
                  </div>`
                : ''
            }
            <div class="flex flex-col ${model.isHit ? 'pt-1 sm:pt-2' : ''}">
              <div class="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-surface-container-low mb-2.5 sm:mb-5">
                <img
                  src="${escapeHtml(model.image)}"
                  data-fallback-src="${escapeHtml(fallbackImg)}"
                  alt="${escapeHtml(model.fullName)}"
                  class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                />
                <div class="absolute top-2 left-2 px-2.5 py-0.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-md font-label-sm text-[10px] sm:text-[11px] text-[#0F172A] font-bold uppercase tracking-wider shadow-sm">
                  ${escapeHtml(model.badge)}
                </div>
                <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-amber-100/95 backdrop-blur-md font-label-sm text-[10px] sm:text-[11px] text-amber-900 font-extrabold shadow-xs" data-model-stock="${escapeHtml(model.id)}">
                  ${escapeHtml(model.stockLabel || '')}
                </div>
                <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-[#0F172A]/85 backdrop-blur-md font-label-sm text-[10px] sm:text-[11px] text-white font-semibold">
                  ${escapeHtml(model.sku)}
                </div>
              </div>

              <div class="flex items-baseline justify-between gap-2 mb-1">
                <h3 class="font-headline-sm text-[18px] sm:text-[22px] font-bold text-[#0F172A] group-hover:text-[#0D9488] transition-colors">
                  ${escapeHtml(model.name)}
                </h3>
                <span class="font-label-sm text-[11px] text-[#0D9488] font-bold uppercase tracking-wider whitespace-nowrap">
                  CADR ${model.cadr} м³/ч
                </span>
              </div>

              <p class="font-body-sm text-[12px] sm:text-body-sm text-slate-600 mb-2.5 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                ${escapeHtml(model.summary)}
              </p>

              <!-- Ключевые характеристики модели -->
              <div class="flex flex-col gap-1.5 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 mb-2.5 sm:mb-5 text-[12px] sm:text-[13px]">
                <div class="hidden sm:flex items-center justify-between gap-2">
                  <span class="text-slate-500">Мощность / CADR</span>
                  <span class="font-semibold text-[#0F172A]">${model.powerW} Вт • ${model.cadr} м³/ч</span>
                </div>
                <div class="hidden sm:flex items-center justify-between gap-2">
                  <span class="text-slate-500">Габариты и вес</span>
                  <span class="font-semibold text-[#0F172A]">${model.heightCm} см (${escapeHtml(model.dimensions)}) • ${escapeHtml(model.weight || '')}</span>
                </div>
                <div class="hidden sm:flex items-center justify-between gap-2">
                  <span class="text-slate-500">Ночной режим</span>
                  <span class="font-semibold text-[#0D9488]">${model.noiseDb} дБ + Пульт ДУ</span>
                </div>
                <div class="hidden sm:block pt-1.5 border-t border-slate-200/70 text-[12px] text-slate-600">
                  <strong class="text-[#0F172A]">Оснащение:</strong> ${escapeHtml(model.specs.display)}
                </div>
                ${
                  highlightsHtml
                    ? `<ul class="sm:pt-1.5 sm:border-t sm:border-slate-200/70 flex flex-col gap-1" data-model-highlights="${model.id}">
                        ${highlightsHtml}
                      </ul>`
                    : ''
                }
              </div>
            </div>

            <div class="flex flex-col gap-2 sm:gap-3 pt-2 border-t border-slate-100">
              <div class="flex items-baseline justify-between">
                <div>
                  <div class="flex items-baseline gap-2">
                    <span class="font-headline-md text-[20px] sm:text-[26px] font-bold text-[#0F172A] whitespace-nowrap">${formatPrice(model.price)}</span>
                    <span class="text-[12px] sm:text-body-sm text-slate-400 line-through whitespace-nowrap">${formatPrice(model.oldPrice)}</span>
                  </div>
                  <span class="block text-[11px] sm:text-[12px] text-[#0D9488] font-semibold">
                    Комплект «Плюс» (+запасной фильтр): ${formatPrice(model.plusPrice)}
                  </span>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl bg-[#0F172A] text-white hover:bg-slate-800 font-label-md text-[13px] sm:text-label-md font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
                  data-open-model="${model.id}"
                >
                  <span class="material-symbols-outlined text-[18px] text-[#0D9488]">bolt</span>
                  <span>Выбрать комплект</span>
                </button>
                <button
                  type="button"
                  aria-label="Добавить ${escapeHtml(model.name)} в корзину"
                  class="py-2.5 sm:py-3 px-3 sm:px-3.5 rounded-xl bg-surface-container text-[#0F172A] hover:bg-[#0D9488] hover:text-white font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-1 shrink-0"
                  data-quick-cart="${model.id}"
                >
                  <span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </article>
        `;
        })
        .join('');

      bindImageFallbacks(container);
    }

    // --- 2.1. Рендер наглядной таблицы сравнения 3 моделей (#models-comparison-table) ---
    function renderComparisonTable() {
      const tbody = doc.getElementById('comparison-table-body');
      if (!tbody) return;

      tbody.innerHTML = (siteConfig.models || [])
        .map((model) => {
          const dailyLiters = formatNumberOnly(calculateDailyLiters(model.cadr)) + ' л/сутки';
          const noiseLabel = `${model.noiseDb || 28} дБ`;
          const autoModeLabel =
            model.id === 'compact'
              ? `Ручной (3 скорости) + Ночной ${noiseLabel}`
              : model.id === 'sense'
              ? `Умный Авто-режим по датчику PM2.5 + ${noiseLabel}`
              : `Двойной Авто-турбо 360° + Ночной ${noiseLabel}`;

          const rowHighlight = model.isHit ? 'bg-[#0D9488]/[0.05]' : '';

          return `
            <tr data-comparison-row="${escapeHtml(model.id)}" class="${rowHighlight}">
              <td data-label="Модель и индекс" class="sticky left-0 z-20 bg-white/95 backdrop-blur border-r border-slate-200/80 shadow-[2px_0_8px_rgba(15,23,42,0.04)] font-headline-sm font-bold text-[#0F172A]">
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[14px] sm:text-[15px] font-bold text-[#0F172A] whitespace-nowrap">${escapeHtml(model.name)}</span>
                    ${
                      model.isHit
                        ? `<span class="px-2 py-0.5 rounded-full bg-[#0D9488] text-white text-[10px] font-bold uppercase tracking-wider">Хит</span>`
                        : ''
                    }
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[11px] text-slate-500 font-medium whitespace-nowrap">Индекс ${escapeHtml(model.sku)}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold whitespace-nowrap">${escapeHtml(model.stockLabel || '')}</span>
                  </div>
                </div>
              </td>
              <td data-label="Площадь" class="whitespace-nowrap font-semibold text-[#0F172A]">${escapeHtml(model.specs.area)}</td>
              <td data-label="CADR / Объем в сутки">
                <div class="flex flex-col">
                  <strong class="text-[#0F172A] whitespace-nowrap">${model.cadr} м³/ч</strong>
                  <span class="text-[11px] text-[#0D9488] font-semibold whitespace-nowrap">${dailyLiters}</span>
                </div>
              </td>
              <td data-label="Датчик PM2.5 и экран" class="text-[12px] text-slate-700">${escapeHtml(model.specs.display)}</td>
              <td data-label="Авто-режим и шум" class="text-[12px] text-slate-700">${escapeHtml(autoModeLabel)}</td>
              <td data-label="Габариты и мощность" class="text-[12px] text-slate-700">${model.heightCm} см (${escapeHtml(model.dimensions)}) • Вес ${escapeHtml(model.weight || '')} • ${model.powerW} Вт</td>
              <td data-label="Комплект «Базовый»">
                <div class="flex flex-col">
                  <strong class="text-[15px] font-bold text-[#0F172A] whitespace-nowrap">${formatPrice(model.price)}</strong>
                  <span class="text-[11px] text-slate-400 line-through whitespace-nowrap">${formatPrice(model.oldPrice)}</span>
                </div>
              </td>
              <td data-label="Комплект «Плюс» (+фильтр)">
                <div class="flex flex-col">
                  <strong class="text-[15px] font-bold text-[#0D9488] whitespace-nowrap">${formatPrice(model.plusPrice)}</strong>
                  <span class="text-[10px] text-slate-500 whitespace-nowrap">Прибор + 2 фильтра</span>
                </div>
              </td>
              <td data-label="Заказ">
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-open-model="${escapeHtml(model.id)}"
                    class="py-2 px-3 rounded-xl bg-[#0F172A] text-white hover:bg-slate-800 font-label-sm text-[11px] font-bold transition-all whitespace-nowrap"
                  >
                    Выбрать
                  </button>
                  <button
                    type="button"
                    data-quick-cart="${escapeHtml(model.id)}"
                    aria-label="В корзину ${escapeHtml(model.name)}"
                    class="p-2 rounded-xl bg-surface-container text-[#0F172A] hover:bg-[#0D9488] hover:text-white transition-all"
                  >
                    <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    }

    // --- 2.2. Рендер блока «До и После» + Счетчик литров в сутки + Калькулятор экономии ---
    function renderBeforeAfterAndEconomy() {
      const pct = Math.max(0, Math.min(100, Number(beforeAfterState.sliderPercent) || 50));
      const overlay = doc.getElementById('before-after-overlay');
      const divider = doc.getElementById('before-after-divider');
      const slider = doc.getElementById('before-after-slider');
      const pctLabel = doc.getElementById('before-after-percent-label');
      const formattedLabel = `${pct}% До (PM2.5 500 мкг/м³) / ${100 - pct}% После (PM2.5 005 мкг/м³)`;

      if (overlay) overlay.style.width = `${pct}%`;
      if (divider) divider.style.left = `${pct}%`;
      if (slider) {
        if (Number(slider.value) !== pct) slider.value = String(pct);
        slider.setAttribute('aria-valuetext', formattedLabel);
      }
      if (pctLabel) {
        pctLabel.textContent = formattedLabel;
      }

      doc.querySelectorAll('[data-compare-preset]').forEach((btn) => {
        const isSelected = Number(btn.getAttribute('data-compare-preset')) === pct;
        btn.classList.toggle('bg-[#0F172A]', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('bg-white', !isSelected);
        btn.classList.toggle('text-slate-700', !isSelected);
        btn.classList.toggle('border', !isSelected);
        btn.classList.toggle('border-slate-200', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });

      // Счетчик литров очищенного воздуха за сутки
      const litersModel = getModelById(beforeAfterState.litersModelId);
      if (litersModel) {
        const dailyLiters = calculateDailyLiters(litersModel.cadr);
        const counterEl = doc.getElementById('daily-liters-counter');
        const descEl = doc.getElementById('daily-liters-desc');
        if (counterEl) {
          counterEl.textContent = `${formatNumberOnly(dailyLiters)} л`;
        }
        if (descEl) {
          descEl.textContent = `${litersModel.name} (${litersModel.sku}, CADR ${litersModel.cadr} м³/ч) пропускает через HEPA H13 фильтр ${(dailyLiters / 1000000).toFixed(2).replace('.', ',')} млн литров воздуха каждые 24 часа.`;
        }
      }

      doc.querySelectorAll('[data-liters-model]').forEach((btn) => {
        const isSelected = btn.getAttribute('data-liters-model') === beforeAfterState.litersModelId;
        btn.classList.toggle('bg-[#0D9488]', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('bg-white/10', !isSelected);
        btn.classList.toggle('text-slate-300', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });

      // Калькулятор экономии электроэнергии
      const econ = calculateElectricityCost(beforeAfterState.econHours);
      const monthlyEl = doc.getElementById('econ-monthly-kwh-cost');
      const dailyEl = doc.getElementById('econ-daily-kwh-cost');
      if (monthlyEl) {
        monthlyEl.textContent = `~ ${econ.monthlyCostSom} сом / мес`;
      }
      if (dailyEl) {
        dailyEl.textContent = `При работе ${econ.hoursPerDay} ч/сутки (~${String(econ.dailyCostSom).replace('.', ',')} сом/день)`;
      }

      doc.querySelectorAll('[data-econ-hours]').forEach((btn) => {
        const isSelected = Number(btn.getAttribute('data-econ-hours')) === Number(beforeAfterState.econHours);
        btn.classList.toggle('bg-[#0F172A]', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('bg-white', !isSelected);
        btn.classList.toggle('text-slate-700', !isSelected);
        btn.classList.toggle('border', !isSelected);
        btn.classList.toggle('border-slate-200', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });
    }

    // --- 3. Рендер секции «4 ступени очистки воздуха» ---
    function renderFiltrationStages() {
      const grid = doc.getElementById('filtration-stages-grid');
      if (!grid) return;

      grid.innerHTML = (siteConfig.filtrationStages || [])
        .map(
          (stage, idx) => `
          <div
            class="filter-stage-card flex flex-col justify-between p-3.5 sm:p-6 rounded-2xl bg-white/85 backdrop-blur-md border ${
              idx === 1 || idx === 2 ? 'border-[#0D9488]/40 ring-1 ring-[#0D9488]/20' : 'border-slate-200/80'
            } shadow-sm hover:shadow-lg transition-all cursor-pointer"
            data-filter-stage="${stage.step}"
          >
            <div>
              <div class="flex items-center justify-between mb-1.5 sm:mb-4">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl ${
                    idx === 1 ? 'bg-[#0D9488] text-white' : 'bg-surface-container text-[#0F172A]'
                  } flex items-center justify-center font-label-md text-[12px] sm:text-[13px] font-bold shrink-0">
                    ${stage.step}
                  </span>
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="material-symbols-outlined text-[#0D9488] text-[18px] sm:text-[18px] shrink-0">${escapeHtml(stage.icon)}</span>
                    <h3 class="font-headline-sm text-[15px] sm:text-[19px] font-bold text-[#0F172A] truncate">${escapeHtml(stage.title)}</h3>
                  </div>
                </div>
                <span class="px-2 py-0.5 sm:py-1 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-label-sm text-[9px] sm:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                  ${escapeHtml(stage.badge)}
                </span>
              </div>
              <p class="font-label-sm text-[10px] sm:text-[11px] text-[#0D9488] font-bold uppercase tracking-wider mb-1 sm:mb-2">
                ${escapeHtml(stage.subtitle)}
              </p>
              <p class="font-body-sm text-[12px] sm:text-body-sm text-slate-600 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                ${escapeHtml(stage.description)}
              </p>
            </div>
          </div>
        `
        )
        .join('');
    }

    // --- 3.1. Рендер секции Отзывов покупателей по районам Бишкека (#reviews-grid) ---
    function renderReviews() {
      const grid = doc.getElementById('reviews-grid');
      if (!grid) return;

      const allReviews = siteConfig.reviews || [];
      const filtered =
        reviewsState.filterModelId === 'all'
          ? allReviews
          : allReviews.filter((r) => r.modelId === reviewsState.filterModelId);

      doc.querySelectorAll('[data-review-filter]').forEach((btn) => {
        const isSelected = btn.getAttribute('data-review-filter') === reviewsState.filterModelId;
        btn.classList.toggle('bg-[#0F172A]', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('bg-white', !isSelected);
        btn.classList.toggle('text-slate-700', !isSelected);
        btn.classList.toggle('border', !isSelected);
        btn.classList.toggle('border-slate-200', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });

      grid.innerHTML = filtered
        .map((review) => {
          const packageOrRole = review.packageLabel || review.role || 'Комплект «Плюс»';
          const dateStr = review.dateLabel || review.date || '2026';
          return `
          <article
            class="review-card flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-slate-200/80 shadow-xs hover:shadow-md transition-all"
            data-review-card="${escapeHtml(review.id)}"
            data-review-model="${escapeHtml(review.modelId)}"
          >
            <div>
              <div class="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-headline-sm text-[15px] font-bold text-[#0F172A]">${escapeHtml(review.author)}</h3>
                    <span class="text-amber-500 text-[12px]" aria-label="Рейтинг 5 из 5">★★★★★</span>
                  </div>
                  <p class="text-[11px] text-slate-500" data-review-meta="${escapeHtml(review.id)}">${escapeHtml(packageOrRole)} • ${escapeHtml(dateStr)}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-[#0F172A] text-white font-label-sm text-[10px] font-bold whitespace-nowrap">
                  📍 ${escapeHtml(review.district)}
                </span>
              </div>

              <p class="font-body-sm text-[12px] sm:text-[13px] text-slate-700 leading-relaxed mb-3.5">
                «${escapeHtml(review.text)}»
              </p>
            </div>

            <div class="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-[11px]">
                <span class="text-slate-500">Замер PM2.5:</span>
                <strong class="text-red-600">${review.pmBefore}</strong>
                <span class="text-slate-400">→</span>
                <strong class="text-[#0D9488]">${review.pmAfter} мкг/м³</strong>
              </div>
              <button
                type="button"
                data-open-model="${escapeHtml(review.modelId)}"
                class="text-[11px] font-bold text-[#0D9488] hover:underline flex items-center gap-0.5"
              >
                <span>${escapeHtml(review.modelName)}</span>
                <span class="material-symbols-outlined text-[14px]">arrow_outward</span>
              </button>
            </div>
          </article>
        `;
        })
        .join('');
    }

    // --- 3.2. Рендер секции FAQ с нативным <details name="aera-faq-accordion"> (modern-web-guidance: search-hidden-content) ---
    function renderFaqAccordion() {
      const container = doc.getElementById('faq-accordion');
      if (!container) return;

      container.innerHTML = (siteConfig.faqItems || [])
        .map(
          (item, idx) => `
          <details
            class="faq-disclosure group rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden transition-all"
            name="aera-faq-accordion"
            data-faq-id="${escapeHtml(item.id)}"
            ${idx === 0 ? 'open' : ''}
          >
            <summary class="flex items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer select-none font-headline-sm text-[14px] sm:text-[16px] font-bold text-[#0F172A] hover:text-[#0D9488] transition-colors">
              <span>${escapeHtml(item.question)}</span>
              <span class="faq-chevron material-symbols-outlined text-[20px] text-[#0D9488] shrink-0">expand_more</span>
            </summary>
            <div class="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 font-body-sm text-[12px] sm:text-[14px] text-slate-600 leading-relaxed border-t border-slate-100">
              ${escapeHtml(item.answer)}
            </div>
          </details>
        `
        )
        .join('');
    }

    // --- 4. Рендер Модального окна детальной карточки товара (#product-modal) ---
    function renderProductModal() {
      const model = getModelById(modalState.modelId);
      if (!model) return;

      const pkg = model.packages[modalState.packageId] || model.packages.base;
      const basePkg = model.packages.base;
      const plusPkg = model.packages.plus;
      const gallery = model.gallery || [{ label: '1. Общий вид', src: model.image, alt: model.fullName }];
      const activeSlide = gallery[modalState.galleryIndex] || gallery[0];
      const cleanMins = calculateCleaningMinutes(modalState.sqm, model.cadr);
      const discountPercent = Math.round(((pkg.oldPrice - pkg.price) / pkg.oldPrice) * 100);

      const setElText = (id, text) => {
        const el = doc.getElementById(id);
        if (el) el.textContent = text;
      };

      setElText('modal-model-badge', model.badge);
      setElText('modal-model-sku', `ЗАВОДСКОЙ ИНДЕКС: ${model.sku}`);
      setElText('modal-model-stock', model.stockLabel || '');
      setElText('modal-model-title', model.name);
      setElText('modal-model-summary', model.summary);

      const mainImg = doc.getElementById('modal-main-image');
      if (mainImg) {
        mainImg.setAttribute(
          'data-fallback-src',
          model.fallbackImage || siteConfig.fallbackAssets?.[model.id] || '/assets/purifier-sense.svg'
        );
        mainImg.src = activeSlide.src;
        mainImg.alt = activeSlide.alt || model.fullName;
      }

      setElText('modal-hud-noise', `${model.noiseDb} дБ`);
      setElText('modal-hud-cadr', `CADR ${model.cadr} м³/ч`);

      // Галерея миниатюр
      const thumbsContainer = doc.getElementById('modal-gallery-thumbs');
      if (thumbsContainer) {
        thumbsContainer.innerHTML = gallery
          .map(
            (item, idx) => `
            <button
              type="button"
              class="py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl font-label-sm text-[10px] sm:text-[11px] transition-all text-center truncate ${
                idx === modalState.galleryIndex
                  ? 'bg-[#0F172A] text-white font-bold shadow-sm'
                  : 'bg-surface-container-low text-slate-600 hover:bg-surface-container'
              }"
              data-modal-thumb="${idx}"
            >
              ${escapeHtml(item.label)}
            </button>
          `
          )
          .join('');
      }

      // Цены
      setElText('modal-price-current', formatPrice(pkg.price));
      setElText('modal-price-old', formatPrice(pkg.oldPrice));
      setElText('modal-price-discount', `-${discountPercent}% ВЫГОДА`);

      // Комплектации Базовый / Плюс (2 сезона)
      setElText('modal-bundle-base-price', formatPrice(basePkg.price));
      setElText('modal-bundle-base-desc', basePkg.description);
      setElText('modal-bundle-plus-price', formatPrice(plusPkg.price));
      setElText('modal-bundle-plus-desc', plusPkg.description);

      const baseCard = doc.getElementById('modal-bundle-base');
      const plusCard = doc.getElementById('modal-bundle-plus');
      const radioBase = doc.getElementById('modal-radio-base');
      const radioPlus = doc.getElementById('modal-radio-plus');

      const isBase = modalState.packageId === 'base';
      if (baseCard && plusCard) {
        baseCard.className = `p-3 sm:p-4 rounded-2xl cursor-pointer transition-all border-2 ${
          isBase
            ? 'bg-[#eff4ff] border-[#0D9488] shadow-md'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`;
        plusCard.className = `p-3 sm:p-4 rounded-2xl cursor-pointer transition-all relative overflow-hidden border-2 ${
          !isBase
            ? 'bg-[#eff4ff] border-[#0D9488] shadow-md'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`;
        baseCard.setAttribute('aria-checked', String(isBase));
        plusCard.setAttribute('aria-checked', String(!isBase));
      }
      if (radioBase && radioPlus) {
        radioBase.className = `w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${
          isBase ? 'bg-[#0D9488]' : 'bg-slate-200 text-transparent'
        }`;
        radioPlus.className = `w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${
          !isBase ? 'bg-[#0D9488]' : 'bg-slate-200 text-transparent'
        }`;
      }

      // Характеристики в модалке
      setElText('modal-spec-cadr', `${model.cadr} м³/ч`);
      setElText('modal-spec-area', model.specs.area);
      setElText('modal-spec-height', `${model.heightCm} см`);
      setElText(
        'modal-spec-dimensions',
        model.weight ? `${model.dimensions} • Вес ${model.weight}` : model.dimensions
      );
      setElText('modal-spec-noise', `${model.noiseDb} дБ`);
      setElText('modal-spec-power', `Мощность ${model.powerW} Вт • Пульт ДУ`);
      setElText('modal-spec-display', model.specs.display);

      const modalHighlightsList = doc.getElementById('modal-highlights-list');
      if (modalHighlightsList) {
        const items = [
          ...(model.highlights || []),
          model.specs?.controls ? `Управление: ${model.specs.controls}` : '',
          model.specs?.filtration ? `Фильтрация: ${model.specs.filtration}` : ''
        ].filter(Boolean);
        modalHighlightsList.innerHTML = items
          .map(
            (text) =>
              `<li class="flex items-start gap-2 text-[12px] text-slate-600"><span class="text-[#0D9488] font-bold">✓</span><span>${escapeHtml(text)}</span></li>`
          )
          .join('');
      }

      // Ползунок площади внутри модалки
      const modalSlider = doc.getElementById('modal-area-slider');
      if (modalSlider) {
        if (Number(modalSlider.value) !== modalState.sqm) {
          modalSlider.value = String(modalState.sqm);
        }
        modalSlider.setAttribute(
          'aria-valuetext',
          `${modalState.sqm} м², очистка за ~${cleanMins} мин`
        );
      }
      setElText('modal-room-area-val', `${modalState.sqm} м²`);
      setElText('modal-calc-time-result', `~ ${cleanMins} мин`);

      // Кнопки заказа в модалке
      setElText('modal-oneclick-btn-text', `Купить в 1 клик • ${formatPrice(pkg.price)}`);
      setElText('modal-bottom-price', formatPrice(pkg.price));
      setElText(
        'modal-bottom-pkg-label',
        modalState.packageId === 'plus'
          ? 'Комплект «Плюс» (+запасной фильтр HEPA H13)'
          : 'Комплект «Базовый» (прибор + фильтр + пульт)'
      );
    }

    function hideOrderConfirmationBanner(containerId) {
      const box = doc.getElementById(containerId);
      if (box) {
        box.classList.add('hidden');
      }
    }

    function openProductModal(modelId, initialPackageId = 'base') {
      const model = getModelById(modelId);
      if (!model) return;
      modalState.modelId = model.id;
      modalState.packageId = initialPackageId;
      modalState.galleryIndex = 0;
      modalState.sqm = model.areaSliderDefault || 25;
      hideOrderConfirmationBanner('modal-order-success');
      renderProductModal();
      const dialog = doc.getElementById('product-modal');
      openDialogModal(dialog);
    }

    // --- 5. Рендер Корзины и Оформления заказа (#cart-drawer + плавающий бар + позиционирование кнопки WhatsApp) ---
    function renderCart(state) {
      const cartState = state || cartStore.getState();

      // Бейдж в шапке
      const headerBadge = doc.getElementById('header-cart-badge');
      if (headerBadge) {
        headerBadge.textContent = String(cartState.totalCount);
        headerBadge.classList.toggle('hidden', cartState.totalCount === 0);
      }

      // Плавающий бар внизу страницы
      const floatingBar = doc.getElementById('floating-cart-bar');
      const floatingCount = doc.getElementById('floating-cart-count');
      const floatingLabel = doc.getElementById('floating-cart-label');
      const isFloatingCartVisible = cartState.totalCount > 0;
      if (floatingBar && floatingCount && floatingLabel) {
        floatingCount.textContent = String(cartState.totalCount);
        const word =
          cartState.totalCount === 1
            ? 'позиция'
            : cartState.totalCount >= 2 && cartState.totalCount <= 4
            ? 'позиции'
            : 'позиций';
        floatingLabel.textContent = `${cartState.totalCount} ${word} • ${formatPrice(cartState.totalAmount)}`;
        floatingBar.classList.toggle('hidden', !isFloatingCartVisible);
      }

      // Плавающая кнопка консультации в WhatsApp поднимается над плавающей корзиной, чтобы никогда не перекрывать её на мобильном
      const floatingWaBtn = doc.getElementById('floating-whatsapp-btn');
      if (floatingWaBtn) {
        floatingWaBtn.href = buildQuickWhatsAppChatUrl();
        floatingWaBtn.classList.toggle('bottom-[76px]', isFloatingCartVisible);
        floatingWaBtn.classList.toggle('bottom-4', !isFloatingCartVisible);
      }

      // Счетчик внутри корзины
      const cartCountPill = doc.getElementById('cart-items-count-pill');
      if (cartCountPill) {
        cartCountPill.textContent = `${cartState.totalCount} шт.`;
      }

      // Список товаров в корзине
      const listEl = doc.getElementById('cart-items-list');
      if (listEl) {
        if (cartState.items.length === 0) {
          listEl.innerHTML = `
            <div class="p-6 rounded-2xl bg-white text-center border border-slate-200/70">
              <span class="material-symbols-outlined text-[34px] text-slate-400 mb-1.5">shopping_bag</span>
              <p class="font-headline-sm text-[16px] font-bold text-[#0F172A] mb-1">Ваша корзина пока пуста</p>
              <p class="font-body-sm text-[12px] text-slate-500">Выберите подходящий очиститель AERA или добавьте сменный фильтр HEPA H13.</p>
            </div>
          `;
        } else {
          listEl.innerHTML = cartState.items
            .map(
              (item) => `
              <div class="w-full bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-200/70 relative transition-all" data-cart-item="${escapeHtml(item.key)}">
                <div class="flex gap-3">
                  <div class="relative w-14 h-16 sm:w-18 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden bg-surface-container-low shrink-0">
                    <img
                      src="${escapeHtml(item.image)}"
                      data-fallback-src="${escapeHtml(item.type === 'addon-filter' ? '/assets/filter-hepa.svg' : '/assets/purifier-sense.svg')}"
                      alt="${escapeHtml(item.name)}"
                      class="w-full h-full object-cover"
                    />
                    <span class="absolute top-0.5 left-0.5 bg-[#0F172A]/85 text-white font-label-sm text-[8px] px-1 py-0.5 rounded">
                      ${escapeHtml(item.sku)}
                    </span>
                  </div>
                  <div class="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div class="flex items-start justify-between gap-1">
                        <h4 class="font-headline-sm text-[14px] sm:text-[15px] leading-tight text-[#0F172A] font-bold truncate">
                          ${escapeHtml(item.name)}
                        </h4>
                        <button
                          type="button"
                          aria-label="Удалить ${escapeHtml(item.name)}"
                          class="text-slate-400 hover:text-red-600 p-0.5 -mr-1 -mt-0.5 transition-colors shrink-0"
                          data-cart-remove="${escapeHtml(item.key)}"
                        >
                          <span class="material-symbols-outlined text-[17px]">close</span>
                        </button>
                      </div>
                      <p class="font-body-sm text-[11px] sm:text-[12px] text-[#0D9488] font-semibold mt-0.5 truncate">
                        ${escapeHtml(item.packageTitle)}
                      </p>
                      ${
                        item.type === 'addon-filter'
                          ? `<span class="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[#0D9488]/10 text-[#0D9488] font-semibold">
                              ${
                                item.isBundleDiscounted
                                  ? 'Спеццена к прибору: 450 сом'
                                  : 'Цена без прибора: 950 сом'
                              }
                            </span>`
                          : ''
                      }
                    </div>

                    <div class="flex items-center justify-between pt-1.5">
                      <div class="inline-flex items-center bg-surface-container rounded-lg p-0.5">
                        <button
                          type="button"
                          aria-label="Уменьшить количество"
                          class="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-white text-[#0F172A] shadow-xs active:scale-90 transition-transform"
                          data-cart-dec="${escapeHtml(item.key)}"
                        >
                          <span class="material-symbols-outlined text-[14px]">remove</span>
                        </button>
                        <span class="font-label-md text-[12px] sm:text-[13px] px-2.5 font-bold text-[#0F172A]" data-cart-qty="${escapeHtml(item.key)}">
                          ${item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Увеличить количество"
                          class="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-white text-[#0F172A] shadow-xs active:scale-90 transition-transform"
                          data-cart-inc="${escapeHtml(item.key)}"
                        >
                          <span class="material-symbols-outlined text-[14px]">add</span>
                        </button>
                      </div>

                      <div class="text-right">
                        <span class="font-headline-sm text-[14px] sm:text-[16px] font-bold text-[#0F172A] block whitespace-nowrap">
                          ${formatPrice(item.lineTotal)}
                        </span>
                        ${
                          item.lineOldTotal > item.lineTotal
                            ? `<span class="text-[10px] sm:text-[11px] text-slate-400 line-through block whitespace-nowrap">${formatPrice(item.lineOldTotal)}</span>`
                            : ''
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `
            )
            .join('');

          bindImageFallbacks(listEl);
        }
      }

      // Способы оплаты в корзине
      doc.querySelectorAll('[data-cart-payment]').forEach((btn) => {
        const isSelected = btn.getAttribute('data-cart-payment') === cartState.selectedPayment;
        btn.classList.toggle('ring-2', isSelected);
        btn.classList.toggle('ring-[#0D9488]', isSelected);
        btn.classList.toggle('bg-[#eff4ff]', isSelected);
        btn.classList.toggle('bg-white', !isSelected);
        btn.setAttribute('aria-pressed', String(isSelected));
      });

      // Итоговые цифры в корзине
      const setElText = (id, text) => {
        const el = doc.getElementById(id);
        if (el) el.textContent = text;
      };
      setElText('cart-subtotal-price', formatPrice(cartState.totalOldAmount));
      setElText('cart-savings-price', `- ${formatPrice(cartState.totalSavings)}`);
      setElText('cart-final-total', formatPrice(cartState.totalAmount));
      setElText('cart-checkout-btn-price', formatPrice(cartState.totalAmount));
    }

    // --- Показ блока успешного заказа со ссылкой на WhatsApp (с защитой от XSS) ---
    function showOrderConfirmationBanner(containerId, result) {
      const box = doc.getElementById(containerId);
      if (!box || !result) return;
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="flex flex-col gap-2 text-left">
          <div class="flex items-center gap-2 font-bold text-[#005049]">
            <span class="material-symbols-outlined text-[20px]">check_circle</span>
            <span>Заявка отправлена! Открываем WhatsApp для подтверждения доставки.</span>
          </div>
          <p class="text-[12px] text-slate-700">
            Заказ: <strong>${escapeHtml(result.order.modelAndPackage)}</strong> • Сумма: <strong>${escapeHtml(formatPrice(result.order.totalAmount))}</strong> • Оплата: <strong>${escapeHtml(result.order.paymentMethod)}</strong>
          </p>
          <a
            href="${escapeHtml(result.whatsappUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#0D9488] text-white font-label-sm text-[12px] font-bold hover:bg-teal-700 transition-colors w-fit"
          >
            <span>Открыть заказ в WhatsApp вручную</span>
            <span class="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
        </div>
      `;
    }

    // --- Обработчики событий ---
    function bindEvents() {
      // 0. Переключение районов в Живом виджете смога (#live-smog-widget)
      doc.querySelectorAll('[data-smog-district]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const districtId = btn.getAttribute('data-smog-district');
          if (!districtId) return;
          smogWidgetState.districtId = districtId;
          smogWidgetState.updatedTimeText = `Обновлено сегодня в ${formatCurrentTimeHHMM()}`;
          renderLiveSmogWidget();
        });
      });

      const smogRefreshBtn = doc.getElementById('smog-refresh-btn');
      if (smogRefreshBtn) {
        smogRefreshBtn.addEventListener('click', () => {
          smogWidgetState.updatedTimeText = `Обновлено сегодня в ${formatCurrentTimeHHMM()}`;
          renderLiveSmogWidget();
          showToast('Данные мониторинга PM2.5 по Бишкеку обновлены');
        });
      }

      // 1. Клики по площади в Конфигураторе
      doc.querySelectorAll('[data-config-area]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const areaId = btn.getAttribute('data-config-area');
          const areaObj = (siteConfig.configurator?.areas || []).find((a) => a.id === areaId);
          configuratorState.areaId = areaId;
          if (areaObj) {
            configuratorState.sqm = areaObj.defaultSqm;
          }
          const rec = getRecommendedModel({
            areaId: configuratorState.areaId,
            priorityId: configuratorState.priorityId,
            sqm: configuratorState.sqm,
            lastChanged: 'area'
          });
          if (rec) {
            configuratorState.recommendedModelId = rec.id;
            configuratorState.priorityId = rec.priorityId;
          }
          hideOrderConfirmationBanner('config-order-success');
          renderConfigurator();
        });
      });

      // 2. Ползунок площади в Конфигураторе
      const configSlider = doc.getElementById('config-area-slider');
      if (configSlider) {
        configSlider.addEventListener('input', (e) => {
          const sqm = Number(e.target.value) || 25;
          configuratorState.sqm = sqm;
          if (sqm <= 25) configuratorState.areaId = 'compact';
          else if (sqm <= 30) configuratorState.areaId = 'sense';
          else configuratorState.areaId = 'prox';

          const rec = getRecommendedModel({
            areaId: configuratorState.areaId,
            priorityId: configuratorState.priorityId,
            sqm,
            lastChanged: 'slider'
          });
          if (rec) {
            configuratorState.recommendedModelId = rec.id;
            configuratorState.priorityId = rec.priorityId;
          }
          hideOrderConfirmationBanner('config-order-success');
          renderConfigurator();
        });
      }

      // 3. Клики по приоритету в Конфигураторе
      doc.querySelectorAll('[data-config-priority]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const priorityId = btn.getAttribute('data-config-priority');
          configuratorState.priorityId = priorityId;
          const rec = getRecommendedModel({
            areaId: configuratorState.areaId,
            priorityId,
            sqm: configuratorState.sqm,
            lastChanged: 'priority'
          });
          if (rec) {
            configuratorState.recommendedModelId = rec.id;
          }
          hideOrderConfirmationBanner('config-order-success');
          renderConfigurator();
        });
      });

      // 4. Переключение комплекта Базовый / Плюс в Конфигураторе
      doc.querySelectorAll('[data-config-package]').forEach((btn) => {
        btn.addEventListener('click', () => {
          configuratorState.packageId = btn.getAttribute('data-config-package') || 'base';
          hideOrderConfirmationBanner('config-order-success');
          renderConfigurator();
        });
      });

      // 5. Кнопка «Подробнее о модели» из Конфигуратора
      const configOpenDetailBtn = doc.getElementById('config-open-detail-btn');
      if (configOpenDetailBtn) {
        configOpenDetailBtn.addEventListener('click', () => {
          openProductModal(configuratorState.recommendedModelId, configuratorState.packageId);
        });
      }

      // 6. Форма «Забронировать из конфигуратора»
      const configOrderForm = doc.getElementById('configurator-order-form');
      if (configOrderForm) {
        configOrderForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const model = getModelById(configuratorState.recommendedModelId);
          const pkg = model.packages[configuratorState.packageId] || model.packages.base;
          const nameInput = doc.getElementById('config-order-name');
          const phoneInput = doc.getElementById('config-order-phone');
          const paymentSelect = doc.getElementById('config-order-payment');
          const districtSelect = doc.getElementById('config-order-district');

          const phone = phoneInput ? phoneInput.value.trim() : '';
          if (!isValidKyrgyzPhone(phone)) {
            if (phoneInput) phoneInput.focus();
            showToast('Введите корректный номер телефона +996');
            return;
          }

          const customerName = nameInput?.value || 'Клиент';
          const district = districtSelect?.value || customerProfile.district || '';
          saveCustomerProfile({ name: customerName, phone, district });

          const result = await submitOrder({
            source: 'Забронировать из конфигуратора',
            name: customerName,
            phone,
            district,
            modelName: model.name,
            packageName: pkg.shortTitle,
            modelAndPackage: `${model.name} (${pkg.title})`,
            paymentMethod: paymentSelect?.value || 'MBank',
            totalAmount: pkg.price
          });

          showOrderConfirmationBanner('config-order-success', result);
          showToast(`Заказ на ${model.name} отправлен!`);
        });
      }

      // 7. Делегирование кликов по карточкам моделей в каталоге
      const modelsGrid = doc.getElementById('models-grid');
      if (modelsGrid) {
        modelsGrid.addEventListener('click', (e) => {
          const quickCartBtn = e.target.closest('[data-quick-cart]');
          if (quickCartBtn) {
            e.stopPropagation();
            const modelId = quickCartBtn.getAttribute('data-quick-cart');
            const model = getModelById(modelId);
            cartStore.addPurifier(modelId, 'base', 1);
            showToast(`${model.name} добавлен в корзину`);
            return;
          }

          const openBtn = e.target.closest('[data-open-model]');
          if (openBtn) {
            e.stopPropagation();
            openProductModal(openBtn.getAttribute('data-open-model'), 'base');
            return;
          }

          const card = e.target.closest('[data-model-card]');
          if (card) {
            openProductModal(card.getAttribute('data-model-card'), 'base');
          }
        });
      }

      // 7.1. Делегирование кликов в таблице сравнения (#models-comparison-table)
      const comparisonTable = doc.getElementById('models-comparison-table');
      if (comparisonTable) {
        comparisonTable.addEventListener('click', (e) => {
          const quickCartBtn = e.target.closest('[data-quick-cart]');
          if (quickCartBtn) {
            const modelId = quickCartBtn.getAttribute('data-quick-cart');
            const model = getModelById(modelId);
            cartStore.addPurifier(modelId, 'base', 1);
            showToast(`${model.name} добавлен в корзину`);
            return;
          }

          const openBtn = e.target.closest('[data-open-model]');
          if (openBtn) {
            openProductModal(openBtn.getAttribute('data-open-model'), 'base');
          }
        });
      }

      // 7.2. Ползунок и кнопки блока «До и После», счетчика литров и калькулятора экономии
      const beforeAfterSlider = doc.getElementById('before-after-slider');
      if (beforeAfterSlider) {
        beforeAfterSlider.addEventListener('input', (e) => {
          beforeAfterState.sliderPercent = Number(e.target.value) || 0;
          renderBeforeAfterAndEconomy();
        });
      }

      doc.querySelectorAll('[data-compare-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          beforeAfterState.sliderPercent = Number(btn.getAttribute('data-compare-preset')) || 0;
          renderBeforeAfterAndEconomy();
        });
      });

      doc.querySelectorAll('[data-liters-model]').forEach((btn) => {
        btn.addEventListener('click', () => {
          beforeAfterState.litersModelId = btn.getAttribute('data-liters-model') || 'sense';
          renderBeforeAfterAndEconomy();
        });
      });

      doc.querySelectorAll('[data-econ-hours]').forEach((btn) => {
        btn.addEventListener('click', () => {
          beforeAfterState.econHours = Number(btn.getAttribute('data-econ-hours')) || 24;
          renderBeforeAfterAndEconomy();
        });
      });

      // Кнопка «Добавить запасной фильтр за +450 сом» в секции #before-after
      doc.querySelectorAll('[data-add-filter-addon]').forEach((btn) => {
        btn.addEventListener('click', () => {
          hideOrderConfirmationBanner('cart-order-success');
          const nextState = cartStore.addFilterAddon(1);
          showToast(
            nextState.hasPurifier
              ? 'Запасной фильтр за +450 сом добавлен в корзину'
              : 'Запасной фильтр добавлен в корзину (450 сом с прибором, отдельно 950 сом)'
          );
        });
      });

      // 7.3. Фильтрация отзывов по модели и клики по модели внутри отзыва
      doc.querySelectorAll('[data-review-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          reviewsState.filterModelId = btn.getAttribute('data-review-filter') || 'all';
          renderReviews();
        });
      });

      const reviewsGrid = doc.getElementById('reviews-grid');
      if (reviewsGrid) {
        reviewsGrid.addEventListener('click', (e) => {
          const openBtn = e.target.closest('[data-open-model]');
          if (openBtn) {
            openProductModal(openBtn.getAttribute('data-open-model'), 'base');
          }
        });
      }

      // 8. Кнопка Hero «Купить в 1 клик»
      const heroQuickBuyBtn = doc.getElementById('hero-quick-buy-btn');
      if (heroQuickBuyBtn) {
        heroQuickBuyBtn.addEventListener('click', () => {
          openProductModal('sense', 'plus');
        });
      }

      // 9. События внутри Модального окна товара (#product-modal)
      const productModal = doc.getElementById('product-modal');
      if (productModal) {
        attachDialogLightDismissFallback(productModal);

        doc.getElementById('modal-close-btn')?.addEventListener('click', () => {
          closeDialogModal(productModal);
        });

        const selectModalBundle = (pkgId) => {
          modalState.packageId = pkgId;
          hideOrderConfirmationBanner('modal-order-success');
          renderProductModal();
        };

        const modalBundleBase = doc.getElementById('modal-bundle-base');
        const modalBundlePlus = doc.getElementById('modal-bundle-plus');

        modalBundleBase?.addEventListener('click', () => selectModalBundle('base'));
        modalBundleBase?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectModalBundle('base');
          }
        });

        modalBundlePlus?.addEventListener('click', () => selectModalBundle('plus'));
        modalBundlePlus?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectModalBundle('plus');
          }
        });

        doc.getElementById('modal-gallery-thumbs')?.addEventListener('click', (e) => {
          const thumb = e.target.closest('[data-modal-thumb]');
          if (!thumb) return;
          modalState.galleryIndex = Number(thumb.getAttribute('data-modal-thumb')) || 0;
          renderProductModal();
        });

        doc.getElementById('modal-area-slider')?.addEventListener('input', (e) => {
          modalState.sqm = Number(e.target.value) || 25;
          renderProductModal();
        });

        const handleAddModalToCart = () => {
          const model = getModelById(modalState.modelId);
          cartStore.addPurifier(modalState.modelId, modalState.packageId, 1);
          showToast(`${model.name} добавлен в корзину`);
          closeDialogModal(productModal);
          openDialogModal(doc.getElementById('cart-drawer'));
        };

        doc.getElementById('modal-add-to-cart-btn')?.addEventListener('click', handleAddModalToCart);
        doc.getElementById('modal-bottom-cart-btn')?.addEventListener('click', handleAddModalToCart);

        doc.getElementById('modal-bottom-order-btn')?.addEventListener('click', () => {
          const phoneInput = doc.getElementById('modal-order-phone');
          const form = doc.getElementById('modal-oneclick-form');
          if (phoneInput && isValidKyrgyzPhone(phoneInput.value)) {
            form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          } else if (phoneInput) {
            phoneInput.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            phoneInput.focus();
            showToast('Укажите телефон для быстрого заказа в 1 клик');
          }
        });

        // Форма «Быстрый заказ в 1 клик» в модалке товара
        doc.getElementById('modal-oneclick-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const model = getModelById(modalState.modelId);
          const pkg = model.packages[modalState.packageId] || model.packages.base;
          const nameInput = doc.getElementById('modal-order-name');
          const phoneInput = doc.getElementById('modal-order-phone');
          const paymentSelect = doc.getElementById('modal-order-payment');

          const phone = phoneInput ? phoneInput.value.trim() : '';
          if (!isValidKyrgyzPhone(phone)) {
            if (phoneInput) phoneInput.focus();
            showToast('Введите номер телефона +996');
            return;
          }

          const customerName = nameInput?.value || 'Клиент';
          saveCustomerProfile({ name: customerName, phone });

          const result = await submitOrder({
            source: 'Купить в 1 клик (Карточка товара)',
            name: customerName,
            phone,
            district: customerProfile.district,
            modelName: model.name,
            packageName: pkg.shortTitle,
            modelAndPackage: `${model.name} (${pkg.title})`,
            paymentMethod: paymentSelect?.value || 'MBank',
            totalAmount: pkg.price
          });

          showOrderConfirmationBanner('modal-order-success', result);
          showToast(`Заказ на ${model.name} оформлен!`);
        });
      }

      // 10. События Корзины и Оформления заказа (#cart-drawer)
      const cartDrawer = doc.getElementById('cart-drawer');
      if (cartDrawer) {
        attachDialogLightDismissFallback(cartDrawer);

        doc.querySelectorAll('[data-open-cart]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            openDialogModal(cartDrawer);
          });
        });

        doc.getElementById('cart-close-btn')?.addEventListener('click', () => {
          closeDialogModal(cartDrawer);
        });

        doc.getElementById('clear-cart-btn')?.addEventListener('click', () => {
          hideOrderConfirmationBanner('cart-order-success');
          cartStore.clear();
          showToast('Корзина очищена');
        });

        // Делегирование кнопок +/- и удаления внутри списка корзины
        doc.getElementById('cart-items-list')?.addEventListener('click', (e) => {
          const incBtn = e.target.closest('[data-cart-inc]');
          if (incBtn) {
            hideOrderConfirmationBanner('cart-order-success');
            cartStore.updateQty(incBtn.getAttribute('data-cart-inc'), 1);
            return;
          }
          const decBtn = e.target.closest('[data-cart-dec]');
          if (decBtn) {
            hideOrderConfirmationBanner('cart-order-success');
            cartStore.updateQty(decBtn.getAttribute('data-cart-dec'), -1);
            return;
          }
          const rmBtn = e.target.closest('[data-cart-remove]');
          if (rmBtn) {
            hideOrderConfirmationBanner('cart-order-success');
            cartStore.removeItem(rmBtn.getAttribute('data-cart-remove'));
          }
        });

        // Кнопка «+» добавления запасного фильтра HEPA H13 + Carbon за +450 сом
        doc.getElementById('add-upsell-filter-btn')?.addEventListener('click', () => {
          hideOrderConfirmationBanner('cart-order-success');
          cartStore.addFilterAddon(1);
          showToast('Запасной картридж HEPA H13 + Carbon добавлен к заказу');
        });

        // Выбор способа оплаты при получении в Бишкеке
        doc.querySelectorAll('[data-cart-payment]').forEach((btn) => {
          btn.addEventListener('click', () => {
            hideOrderConfirmationBanner('cart-order-success');
            const method = btn.getAttribute('data-cart-payment');
            cartStore.setPaymentMethod(method);
          });
        });

        // Отправка формы «Оформить заказ из корзины»
        doc.getElementById('cart-checkout-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const state = cartStore.getState();
          if (state.items.length === 0) {
            showToast('Добавьте хотя бы один товар в корзину');
            return;
          }

          const nameInput = doc.getElementById('cart-order-name');
          const phoneInput = doc.getElementById('cart-order-phone');
          const phone = phoneInput ? phoneInput.value.trim() : '';
          if (!isValidKyrgyzPhone(phone)) {
            if (phoneInput) phoneInput.focus();
            showToast('Введите номер телефона +996');
            return;
          }

          const customerName = nameInput?.value || 'Клиент';
          saveCustomerProfile({ name: customerName, phone });

          const summary = cartStore.getOrderSummaryStrings();
          const result = await submitOrder({
            source: 'Оформить заказ из корзины',
            name: customerName,
            phone,
            district: customerProfile.district,
            modelName: summary.modelName,
            packageName: summary.packageName,
            modelAndPackage: summary.modelAndPackage,
            paymentMethod: state.selectedPayment,
            totalAmount: state.totalAmount
          });

          showOrderConfirmationBanner('cart-order-success', result);
          showToast('Заказ из корзины успешно отправлен!');
        });
      }
    }

    // Первичный рендер всех секций
    renderContactLinks();
    renderLiveSmogWidget();
    renderCatalogGrid();
    renderComparisonTable();
    renderBeforeAfterAndEconomy();
    renderFiltrationStages();
    renderReviews();
    renderFaqAccordion();
    renderConfigurator();
    renderProductModal();
    renderCart(cartStore.getState());
    cartStore.subscribe((state) => {
      renderCart(state);
      persistCartState(state);
    });
    bindEvents();
    bindPhoneMasks();
    syncProfileInputsToDom();
    bindImageFallbacks(doc);

    const api = {
      siteConfig,
      cartStore,
      configuratorState,
      modalState,
      smogWidgetState,
      beforeAfterState,
      reviewsState,
      customerProfile,
      openProductModal,
      renderContactLinks,
      renderLiveSmogWidget,
      renderConfigurator,
      renderComparisonTable,
      renderBeforeAfterAndEconomy,
      renderReviews,
      renderFaqAccordion,
      renderProductModal,
      renderCart,
      submitOrder,
      escapeHtml,
      extractKyrgyzSubscriberDigits,
      detectKyrgyzOperator,
      formatPrice,
      formatNumberOnly,
      formatKyrgyzPhone,
      isValidKyrgyzPhone,
      calculateCleaningMinutes,
      calculateDailyLiters,
      calculateElectricityCost,
      getRecommendedModel,
      buildWhatsAppOrderText,
      buildWhatsAppUrl,
      buildQuickWhatsAppChatUrl,
      buildTelegramPayload,
      extractUtmParams
    };

    if (typeof window !== 'undefined') {
      window.__aeraApp = api;
    }

    return api;
  }

  // Автозапуск в браузере при готовности DOM
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initApp(document));
    } else {
      initApp(document);
    }
  }

  return {
    siteConfig,
    initApp,
    createCartStore,
    escapeHtml,
    extractKyrgyzSubscriberDigits,
    detectKyrgyzOperator,
    formatPrice,
    formatNumberOnly,
    formatKyrgyzPhone,
    isValidKyrgyzPhone,
    calculateCleaningMinutes,
    calculateDailyLiters,
    calculateElectricityCost,
    getModelById,
    getRecommendedModel,
    extractUtmParams,
    buildWhatsAppOrderText,
    buildWhatsAppUrl,
    buildQuickWhatsAppChatUrl,
    buildTelegramPayload,
    submitOrder
  };
});
