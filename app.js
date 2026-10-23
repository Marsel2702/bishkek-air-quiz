/**
 * Основная клиентская логика приложения AERA Bishkek (app.js)
 * Объединяет:
 * 1. Умный конфигуратор (площадь + ползунок + приоритет + быстрый заказ из конфигуратора)
 * 2. Каталог из 3 реальных моделей (AERA Compact AR-6614, AERA Sense AR-920, AERA Pro X AR-921)
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
      if (sqm <= 20) return getModelById('compact');
      if (sqm <= 34) return getModelById('sense');
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
    const waNumber = String(siteConfig.WHATSAPP_NUMBER || '996555909090').replace(/\D/g, '');
    const text = buildWhatsAppOrderText(orderData);
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  }

  // --- Генерация полезной нагрузки для Telegram Bot API (Шаг 4, п. 2) ---
  function buildTelegramPayload(orderData) {
    const {
      source = 'Сайт AERA Bishkek',
      name = 'Клиент',
      phone = '',
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
      `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
      `💨 <b>Модель:</b> ${escapeHtml(modelName)}`,
      `📦 <b>Комплект:</b> ${escapeHtml(packageName)}`,
      `🧾 <b>Состав заказа:</b> ${escapeHtml(composedModelPkg)}`,
      `💳 <b>Способ оплаты:</b> ${escapeHtml(paymentMethod)}`,
      `💰 <b>Сумма к оплате:</b> ${escapeHtml(formatPrice(totalAmount))} (${Number(totalAmount) || 0} KGS)`,
      `📊 <b>UTM-метки:</b> ${utmString}`
    ];

    return {
      chat_id: siteConfig.TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      meta: {
        name: name || 'Не указано',
        phone,
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
    const phone = (orderInput.phone || '').trim();
    const name = (orderInput.name || 'Клиент').trim();
    const source = orderInput.source || 'Быстрый заказ';

    const normalizedOrder = {
      source,
      name,
      phone,
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
    const telegramEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
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
      fetchFn && botToken
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

    // По умолчанию в корзине лежит хит продаж AERA Sense (AR-920), чтобы пользователь сразу видел живую корзину
    const cartStore = createCartStore([
      {
        key: 'sense__base',
        type: 'purifier',
        modelId: 'sense',
        sku: 'AR-920',
        name: 'AERA Sense',
        packageId: 'base',
        packageTitle: 'Комплект «Базовый»',
        packageShortTitle: 'Базовый',
        unitPrice: 4990,
        oldUnitPrice: 6500,
        image: getModelById('sense').image,
        badge: '★ Хит продаж • До 30 м²',
        qty: 1
      }
    ]);

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

    // Привязка маски телефона ко всем полям input[type="tel"]
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
        });
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
      if (slider && Number(slider.value) !== configuratorState.sqm) {
        slider.value = String(configuratorState.sqm);
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
        imgEl.src = model.image;
        imgEl.alt = model.fullName;
      }

      setElText('calc-result-badge', model.badge);
      setElText('calc-result-sku', `Индекс: ${model.sku}`);
      setElText('calc-result-title', model.name);
      setElText('calc-result-desc', model.configuratorReason);
      setElText('calc-result-price', formatPrice(pkg.price));
      setElText('calc-result-old-price', formatPrice(pkg.oldPrice));
      setElText('calc-result-cadr', `CADR ${model.cadr} м³/ч • Очистка ${configuratorState.sqm} м² за ~${cleanMins} мин`);
      setElText('calc-result-dimensions', `Высота ${model.heightCm} см (${model.dimensions}), мощность ${model.powerW} Вт`);
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
                `<li class="flex items-start gap-1.5 text-[11px] sm:text-[12px] text-slate-600"><span class="text-[#0D9488] font-bold">✓</span><span>${escapeHtml(hl)}</span></li>`
            )
            .join('');

          return `
          <article
            class="model-card flex flex-col justify-between p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white transition-all duration-300 ${cardRing} cursor-pointer group"
            data-model-card="${model.id}"
          >
            ${
              model.isHit
                ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 sm:py-1 rounded-full bg-[#0D9488] text-white font-label-sm text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap z-10">
                    ${escapeHtml(model.badge)}
                  </div>`
                : ''
            }
            <div class="flex flex-col ${model.isHit ? 'pt-1.5 sm:pt-2' : ''}">
              <div class="relative w-full aspect-[16/11] sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-surface-container-low mb-3.5 sm:mb-5">
                <img
                  src="${escapeHtml(model.image)}"
                  alt="${escapeHtml(model.fullName)}"
                  class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                />
                <div class="absolute top-2.5 left-2.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-md font-label-sm text-[10px] sm:text-[11px] text-[#0F172A] font-bold uppercase tracking-wider shadow-sm">
                  ${escapeHtml(model.badge)}
                </div>
                <div class="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-[#0F172A]/85 backdrop-blur-md font-label-sm text-[10px] sm:text-[11px] text-white font-semibold">
                  ${escapeHtml(model.sku)}
                </div>
              </div>

              <div class="flex items-baseline justify-between gap-2 mb-1">
                <h3 class="font-headline-sm text-[19px] sm:text-[22px] font-bold text-[#0F172A] group-hover:text-[#0D9488] transition-colors">
                  ${escapeHtml(model.name)}
                </h3>
                <span class="font-label-sm text-[11px] text-[#0D9488] font-bold uppercase tracking-wider whitespace-nowrap">
                  CADR ${model.cadr} м³/ч
                </span>
              </div>

              <p class="font-body-sm text-[13px] sm:text-body-sm text-slate-600 mb-3 sm:mb-4">
                ${escapeHtml(model.summary)}
              </p>

              <!-- Ключевые характеристики модели -->
              <div class="flex flex-col gap-1.5 py-2.5 px-3 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 mb-3.5 sm:mb-5 text-[12px] sm:text-[13px]">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-slate-500">Мощность / CADR</span>
                  <span class="font-semibold text-[#0F172A]">${model.powerW} Вт • ${model.cadr} м³/ч</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-slate-500">Габариты (В×Ш×Г)</span>
                  <span class="font-semibold text-[#0F172A]">${model.heightCm} см (${escapeHtml(model.dimensions)})</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-slate-500">Ночной режим</span>
                  <span class="font-semibold text-[#0D9488]">${model.noiseDb} дБ + Пульт ДУ</span>
                </div>
                <div class="hidden sm:block pt-1.5 border-t border-slate-200/70 text-[12px] text-slate-600">
                  <strong class="text-[#0F172A]">Оснащение:</strong> ${escapeHtml(model.specs.display)}
                </div>
                ${
                  highlightsHtml
                    ? `<ul class="pt-1.5 border-t border-slate-200/70 flex flex-col gap-1" data-model-highlights="${model.id}">
                        ${highlightsHtml}
                      </ul>`
                    : ''
                }
              </div>
            </div>

            <div class="flex flex-col gap-2.5 sm:gap-3 pt-2 border-t border-slate-100">
              <div class="flex items-baseline justify-between">
                <div>
                  <div class="flex items-baseline gap-2">
                    <span class="font-headline-md text-[22px] sm:text-[26px] font-bold text-[#0F172A] whitespace-nowrap">${formatPrice(model.price)}</span>
                    <span class="text-[13px] sm:text-body-sm text-slate-400 line-through whitespace-nowrap">${formatPrice(model.oldPrice)}</span>
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
    }

    // --- 3. Рендер секции «4 ступени очистки воздуха» ---
    function renderFiltrationStages() {
      const grid = doc.getElementById('filtration-stages-grid');
      if (!grid) return;

      grid.innerHTML = (siteConfig.filtrationStages || [])
        .map(
          (stage, idx) => `
          <div
            class="filter-stage-card flex flex-col justify-between p-4 sm:p-6 rounded-2xl bg-white/85 backdrop-blur-md border ${
              idx === 1 || idx === 2 ? 'border-[#0D9488]/40 ring-1 ring-[#0D9488]/20' : 'border-slate-200/80'
            } shadow-sm hover:shadow-lg transition-all cursor-pointer"
            data-filter-stage="${stage.step}"
          >
            <div>
              <div class="flex items-center justify-between mb-2.5 sm:mb-4">
                <span class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${
                  idx === 1 ? 'bg-[#0D9488] text-white' : 'bg-surface-container text-[#0F172A]'
                } flex items-center justify-center font-label-md text-[13px] font-bold">
                  ${stage.step}
                </span>
                <span class="px-2.5 py-0.5 sm:py-1 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-label-sm text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  ${escapeHtml(stage.badge)}
                </span>
              </div>
              <div class="flex items-center gap-2 mb-1">
                <span class="material-symbols-outlined text-[#0D9488] text-[20px] sm:text-[22px]">${escapeHtml(stage.icon)}</span>
                <h3 class="font-headline-sm text-[17px] sm:text-[19px] font-bold text-[#0F172A]">${escapeHtml(stage.title)}</h3>
              </div>
              <p class="font-label-sm text-[10px] sm:text-[11px] text-[#0D9488] font-bold uppercase tracking-wider mb-1.5 sm:mb-2.5">
                ${escapeHtml(stage.subtitle)}
              </p>
              <p class="font-body-sm text-[13px] sm:text-body-sm text-slate-600 leading-relaxed">
                ${escapeHtml(stage.description)}
              </p>
            </div>
          </div>
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
      setElText('modal-model-title', model.name);
      setElText('modal-model-summary', model.summary);

      const mainImg = doc.getElementById('modal-main-image');
      if (mainImg) {
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
      setElText('modal-spec-dimensions', model.dimensions);
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
      if (modalSlider && Number(modalSlider.value) !== modalState.sqm) {
        modalSlider.value = String(modalState.sqm);
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

    // --- 5. Рендер Корзины и Оформления заказа (#cart-drawer + плавающий бар) ---
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
      if (floatingBar && floatingCount && floatingLabel) {
        floatingCount.textContent = String(cartState.totalCount);
        const word =
          cartState.totalCount === 1
            ? 'позиция'
            : cartState.totalCount >= 2 && cartState.totalCount <= 4
            ? 'позиции'
            : 'позиций';
        floatingLabel.textContent = `${cartState.totalCount} ${word} • ${formatPrice(cartState.totalAmount)}`;
        floatingBar.classList.toggle('hidden', cartState.totalCount === 0);
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
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover" />
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
          if (sqm <= 20) configuratorState.areaId = 'compact';
          else if (sqm <= 34) configuratorState.areaId = 'sense';
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

      // 3. Клики по приоритету в Конфигураторе (сохраняем выбранную пользователем площадь sqm для честного расчета минут очистки)
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

          const phone = phoneInput ? phoneInput.value.trim() : '';
          if (!isValidKyrgyzPhone(phone)) {
            if (phoneInput) phoneInput.focus();
            showToast('Введите корректный номер телефона +996');
            return;
          }

          const result = await submitOrder({
            source: 'Забронировать из конфигуратора',
            name: nameInput?.value || 'Клиент',
            phone,
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

          const result = await submitOrder({
            source: 'Купить в 1 клик (Карточка товара)',
            name: nameInput?.value || 'Клиент',
            phone,
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

          const summary = cartStore.getOrderSummaryStrings();
          const result = await submitOrder({
            source: 'Оформить заказ из корзины',
            name: nameInput?.value || 'Клиент',
            phone,
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
    renderCatalogGrid();
    renderFiltrationStages();
    renderConfigurator();
    renderProductModal();
    renderCart(cartStore.getState());
    cartStore.subscribe(renderCart);
    bindEvents();
    bindPhoneMasks();

    const api = {
      siteConfig,
      cartStore,
      configuratorState,
      modalState,
      openProductModal,
      renderConfigurator,
      renderProductModal,
      renderCart,
      submitOrder,
      escapeHtml,
      extractKyrgyzSubscriberDigits,
      formatPrice,
      formatKyrgyzPhone,
      isValidKyrgyzPhone,
      calculateCleaningMinutes,
      getRecommendedModel,
      buildWhatsAppOrderText,
      buildWhatsAppUrl,
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
    formatPrice,
    formatNumberOnly,
    formatKyrgyzPhone,
    isValidKyrgyzPhone,
    calculateCleaningMinutes,
    getModelById,
    getRecommendedModel,
    extractUtmParams,
    buildWhatsAppOrderText,
    buildWhatsAppUrl,
    buildTelegramPayload,
    submitOrder
  };
});
