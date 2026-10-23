const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const siteConfig = require('./siteConfig.js');
const app = require('./app.js');

test('Шаг 2: siteConfig.js содержит точные реальные данные 3 моделей и сменного картриджа', () => {
  assert.equal(siteConfig.brand, 'AERA');
  assert.equal(siteConfig.currency, 'KGS');
  assert.equal(siteConfig.models.length, 3);

  const [compact, sense, prox] = siteConfig.models;

  // 1. AERA Compact (AR-6614)
  assert.equal(compact.name, 'AERA Compact');
  assert.equal(compact.sku, 'AR-6614');
  assert.equal(compact.badge, 'ДЛЯ СПАЛЬНИ И ДЕТСКОЙ • ДО 25 М²');
  assert.equal(compact.price, 3990);
  assert.equal(compact.oldPrice, 5200);
  assert.equal(compact.plusPrice, 4440);
  assert.equal(compact.powerW, 35);
  assert.equal(compact.cadr, 180);
  assert.equal(compact.heightCm, 48);
  assert.equal(compact.dimensions, '256×128×480 мм');
  assert.equal(compact.noiseDb, 28);
  assert.equal(compact.packages.base.price, 3990);
  assert.equal(compact.packages.plus.price, 4440);
  assert.equal(compact.packages.plus.badge, 'ВЫБОР 82%');
  assert.equal(compact.packages.plus.extraFilterPrice, 450);

  // 2. AERA Sense (AR-920 — ХИТ ПРОДАЖ)
  assert.equal(sense.name, 'AERA Sense');
  assert.equal(sense.sku, 'AR-920');
  assert.equal(sense.isHit, true);
  assert.equal(sense.badge, '★ ВЫБОР 70% В БИШКЕКЕ • ДО 30 М²');
  assert.equal(sense.price, 4990);
  assert.equal(sense.oldPrice, 6500);
  assert.equal(sense.plusPrice, 5440);
  assert.equal(sense.powerW, 35);
  assert.equal(sense.cadr, 240);
  assert.equal(sense.heightCm, 51);
  assert.equal(sense.dimensions, '300×155×510 мм');
  assert.equal(sense.noiseDb, 28);
  assert.match(sense.specs.display, /LCD-дисплей/i);
  assert.match(sense.specs.display, /PM2\.5/i);
  assert.match(sense.specs.display, /TVOC/i);
  assert.equal(sense.packages.base.price, 4990);
  assert.equal(sense.packages.plus.price, 5440);

  // 3. AERA Pro X (AR-921 — ФЛАГМАН 360°)
  assert.equal(prox.name, 'AERA Pro X');
  assert.equal(prox.sku, 'AR-921');
  assert.equal(prox.isFlagship, true);
  assert.equal(prox.badge, 'ФЛАГМАН 360° • ДЛЯ ЗАЛА И СТУДИИ 40–60 М²');
  assert.equal(prox.price, 7290);
  assert.equal(prox.oldPrice, 9800);
  assert.equal(prox.plusPrice, 7740);
  assert.equal(prox.powerW, 35);
  assert.equal(prox.cadr, 320);
  assert.equal(prox.heightCm, 60);
  assert.equal(prox.dimensions, '252×252×600 мм');
  assert.equal(prox.noiseDb, 28);
  assert.match(prox.specs.display, /OLED/i);
  assert.match(prox.specs.filtration, /360°/);
  assert.equal(prox.packages.base.price, 7290);
  assert.equal(prox.packages.plus.price, 7740);

  // 4. Сменный картридж AERA HEPA H13 + Active Carbon
  assert.equal(siteConfig.filterCartridge.standalonePrice, 950);
  assert.equal(siteConfig.filterCartridge.bundlePrice, 450);
  assert.equal(siteConfig.filterCartridge.savings, 500);

  // 5. 4 ступени очистки воздуха
  assert.equal(siteConfig.filtrationStages.length, 4);
  assert.equal(siteConfig.filtrationStages[0].title, 'Pre-Filter');
  assert.equal(siteConfig.filtrationStages[1].title, 'HEPA H13');
  assert.match(siteConfig.filtrationStages[2].title, /Сотовый активированный уголь/i);
  assert.match(siteConfig.filtrationStages[3].title, /Ионизатор 20 млн ионов/i);
});

test('Шаг 3: В коде приложения удалены запрещенные демо-тексты Stitch и добавлены реальные условия Бишкека', () => {
  const filesToCheck = ['index.html', 'siteConfig.js', 'app.js'];
  const forbiddenPatterns = [
    /Швейцар/i,
    /5\s*лет/i,
    /7\s*дней/i,
    /тест-драйв/i,
    /5\s*408/,
    /Орион/i,
    /Orion/i,
    /38\s*900/,
    /64\s*900/,
    /98\s*000/,
    /₽/
  ];

  for (const file of filesToCheck) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    for (const pattern of forbiddenPatterns) {
      assert.equal(
        pattern.test(content),
        false,
        `Файл ${file} не должен содержать запрещенный паттерн ${pattern}`
      );
    }
  }

  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  assert.match(indexHtml, /AQI 215\+\s*•\s*Опасно для дыхания/);
  assert.match(indexHtml, /Чистый горный воздух в вашем доме за 5 минут —/);
  assert.match(indexHtml, /от 3 990 сом/);
  assert.match(indexHtml, /Официальная гарантия 12 месяцев в г\. Бишкек/);
  assert.match(indexHtml, /Бесплатная экспресс-доставка по Бишкеку в день заказа/);
  assert.match(
    indexHtml,
    /Без предоплаты! Оплата курьеру \(MBank, Optima, QR или наличными\) только после распаковки и проверки прибора при вас/
  );
});

test('Шаг 1: Умный конфигуратор динамически меняет рекомендуемую модель по площади, ползунку и приоритету', () => {
  // Выбор по кнопкам площади: До 20 м², 20–30 м², 40–60 м²
  assert.equal(
    app.getRecommendedModel({ areaId: 'compact', lastChanged: 'area' }).name,
    'AERA Compact'
  );
  assert.equal(
    app.getRecommendedModel({ areaId: 'sense', lastChanged: 'area' }).name,
    'AERA Sense'
  );
  assert.equal(
    app.getRecommendedModel({ areaId: 'prox', lastChanged: 'area' }).name,
    'AERA Pro X'
  );

  // Выбор по приоритету
  assert.equal(
    app.getRecommendedModel({ priorityId: 'bedroom', lastChanged: 'priority' }).name,
    'AERA Compact'
  );
  assert.equal(
    app.getRecommendedModel({ priorityId: 'smog_auto', lastChanged: 'priority' }).name,
    'AERA Sense'
  );
  assert.equal(
    app.getRecommendedModel({ priorityId: 'max_360', lastChanged: 'priority' }).name,
    'AERA Pro X'
  );

  // Выбор по ползунку площади (граничные значения)
  assert.equal(app.getRecommendedModel({ sqm: 10, lastChanged: 'slider' }).id, 'compact');
  assert.equal(app.getRecommendedModel({ sqm: 20, lastChanged: 'slider' }).id, 'compact');
  assert.equal(app.getRecommendedModel({ sqm: 21, lastChanged: 'slider' }).id, 'sense');
  assert.equal(app.getRecommendedModel({ sqm: 30, lastChanged: 'slider' }).id, 'sense');
  assert.equal(app.getRecommendedModel({ sqm: 40, lastChanged: 'slider' }).id, 'prox');
  assert.equal(app.getRecommendedModel({ sqm: 60, lastChanged: 'slider' }).id, 'prox');

  // Расчет времени очистки (включая некорректные и граничные входы)
  assert.equal(typeof app.calculateCleaningMinutes(20, 180), 'number');
  assert.ok(app.calculateCleaningMinutes(20, 180) >= 4);
  assert.ok(app.calculateCleaningMinutes(0, 0) >= 4);
  assert.ok(app.calculateCleaningMinutes(-10, null) >= 4);
});

test('Шаг 1 и Шаг 2: Корзина считает приборы, комплекты «Базовый» / «Плюс» и апсейл фильтра (+450 сом с прибором / 950 сом отдельно)', () => {
  const store = app.createCartStore([]);
  assert.equal(store.getState().totalCount, 0);
  assert.equal(store.getState().totalAmount, 0);

  // Добавляем AERA Compact Базовый (3 990 сом)
  store.addPurifier('compact', 'base', 1);
  assert.equal(store.getState().totalCount, 1);
  assert.equal(store.getState().totalAmount, 3990);

  // Добавляем запасной картридж по акции к заказу (+450 сом)
  store.addFilterAddon(1);
  assert.equal(store.getState().totalCount, 2);
  assert.equal(store.getState().filterUnitPrice, 450);
  assert.equal(store.getState().totalAmount, 3990 + 450);

  // Если удалить прибор из корзины, фильтр отдельно стоит 950 сом
  store.removeItem('compact__base');
  assert.equal(store.getState().hasPurifier, false);
  assert.equal(store.getState().filterUnitPrice, 950);
  assert.equal(store.getState().totalAmount, 950);

  // Добавляем AERA Pro X в комплекте «Плюс» (7 740 сом) — фильтр снова по спеццене 450 сом
  store.addPurifier('prox', 'plus', 1);
  assert.equal(store.getState().hasPurifier, true);
  assert.equal(store.getState().filterUnitPrice, 450);
  assert.equal(store.getState().totalAmount, 7740 + 450);

  // Проверка выбора способа оплаты
  store.setPaymentMethod('Optima Pay');
  assert.equal(store.getState().selectedPayment, 'Optima Pay');
});

test('Форматирование и строгая валидация кыргызстанского номера +996 (___) __-__-__', () => {
  assert.equal(app.formatKyrgyzPhone(''), '');
  assert.equal(app.formatKyrgyzPhone('+996'), '');
  assert.equal(app.formatKyrgyzPhone('+996 ('), '');
  assert.equal(app.formatKyrgyzPhone('0555123456'), '+996 (555) 12-34-56');
  assert.equal(app.formatKyrgyzPhone('+996 (0555123456'), '+996 (555) 12-34-56');
  assert.equal(app.formatKyrgyzPhone('996700998877'), '+996 (700) 99-88-77');
  assert.equal(app.formatKyrgyzPhone('555909090'), '+996 (555) 90-90-90');
  // 3 цифры оператора не должны замыкать скобку до ввода 4-й цифры, чтобы Backspace не застревал
  assert.equal(app.formatKyrgyzPhone('+996 (555'), '+996 (555');

  // Строгая проверка ровно 9 абонентских цифр (без учета кода страны 996)
  assert.equal(app.isValidKyrgyzPhone('+996 (555) 90-90-90'), true);
  assert.equal(app.isValidKyrgyzPhone('0555909090'), true);
  assert.equal(app.isValidKyrgyzPhone('+996 (55'), false);
  assert.equal(app.isValidKyrgyzPhone('+996 (555) 12-3'), false);
  assert.equal(app.isValidKyrgyzPhone('+996 (555) 12-34-5'), false);
});

test('Шаг 4: Отправка заказа вызывает fbq Lead (KGS), синхронно открывает WhatsApp до завершения fetch, экранирует HTML для Telegram и передает UTM', async () => {
  const callOrder = [];
  const fbqCalls = [];
  globalThis.window = {
    location: {
      search: '?utm_source=instagram&utm_medium=cpc&utm_campaign=bishkek_<smog>&utm_content=a%26b'
    },
    fbq: (...args) => {
      callOrder.push('fbq');
      fbqCalls.push(args);
    },
    open: (url) => {
      callOrder.push('window.open');
      globalThis.window.__openedUrl = url;
    }
  };

  let capturedFetchUrl = null;
  let capturedFetchOptions = null;
  const mockFetch = async (url, options) => {
    await new Promise((r) => setTimeout(r, 20));
    callOrder.push('fetch.resolved');
    capturedFetchUrl = url;
    capturedFetchOptions = options;
    return { ok: true, status: 200 };
  };

  const result = await app.submitOrder(
    {
      source: 'Купить в 1 клик',
      name: 'Азамат & Айгуль <VIP>',
      phone: '+996 (555) 12-34-56',
      modelName: 'AERA Sense',
      packageName: 'Плюс с запасным фильтром',
      modelAndPackage: 'AERA Sense (Комплект «Плюс (2 сезона)»)',
      paymentMethod: 'MBank',
      totalAmount: 5440
    },
    { fetchImpl: mockFetch }
  );

  // window.open обязан вызываться синхронно ДО завершения сетевого запроса fetch (защита от блокировщика попапов)
  assert.deepEqual(callOrder, ['fbq', 'window.open', 'fetch.resolved']);

  // 1. Проверка fbq('track', 'Lead', { value: totalAmount, currency: 'KGS' })
  assert.equal(fbqCalls.length, 1);
  assert.deepEqual(fbqCalls[0], ['track', 'Lead', { value: 5440, currency: 'KGS' }]);

  // 2. Проверка POST-запроса в Telegram Bot API и HTML-экранирования
  assert.ok(capturedFetchUrl.includes(`https://api.telegram.org/bot${siteConfig.TELEGRAM_BOT_TOKEN}/sendMessage`));
  assert.equal(capturedFetchOptions.method, 'POST');
  assert.equal(capturedFetchOptions.keepalive, true);
  const parsedBody = JSON.parse(capturedFetchOptions.body);
  assert.equal(parsedBody.chat_id, siteConfig.TELEGRAM_CHAT_ID);
  assert.equal(parsedBody.customer_name, 'Азамат & Айгуль <VIP>');
  assert.match(parsedBody.text, /Азамат &amp; Айгуль &lt;VIP&gt;/);
  assert.match(parsedBody.text, /bishkek_&lt;smog&gt;/);
  assert.match(parsedBody.text, /a&amp;b/);
  assert.equal(parsedBody.phone, '+996 (555) 12-34-56');
  assert.equal(parsedBody.model, 'AERA Sense');
  assert.equal(parsedBody.package, 'Плюс с запасным фильтром');
  assert.equal(parsedBody.payment_method, 'MBank');
  assert.equal(parsedBody.total_amount, 5440);
  assert.equal(parsedBody.currency, 'KGS');
  assert.equal(parsedBody.utm.utm_source, 'instagram');
  assert.equal(parsedBody.utm.utm_campaign, 'bishkek_<smog>');

  // 3. Проверка текста и URL WhatsApp
  const expectedText =
    'Здравствуйте, AERA! Хочу заказать: AERA Sense (Комплект «Плюс (2 сезона)») на сумму 5440 сом. Способ оплаты: MBank. Мой номер: +996 (555) 12-34-56.';
  assert.equal(result.whatsappText, expectedText);
  assert.equal(
    result.whatsappUrl,
    `https://wa.me/${siteConfig.WHATSAPP_NUMBER}?text=${encodeURIComponent(expectedText)}`
  );
  assert.equal(globalThis.window.__openedUrl, result.whatsappUrl);
});

test('E2E в реальном браузере Chrome: DOM-рендер, конфигуратор, модалка товара, корзина и все 3 формы заказа', async (t) => {
  const http = require('node:http');
  const { spawn } = require('node:child_process');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    t.skip('Chrome не найден');
    return;
  }

  // Запускаем локальный статический сервер
  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    const relPath = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
    const filePath = path.join(__dirname, relPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const mime =
      ext === '.html'
        ? 'text/html; charset=utf-8'
        : ext === '.js'
        ? 'application/javascript; charset=utf-8'
        : 'text/plain; charset=utf-8';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const pageUrl = `http://127.0.0.1:${port}/index.html?utm_source=meta_ads&utm_campaign=bishkek_air`;

  // Запускаем Chrome в headless-режиме на about:blank и переходим на страницу через CDP
  const userDataDir = path.join(require('node:os').tmpdir(), `aera-chrome-test-${Date.now()}`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=0',
    'about:blank'
  ]);

  let wsEndpoint = null;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Таймаут запуска Chrome DevTools')), 8000);
    chromeProc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        wsEndpoint = match[1];
        clearTimeout(timer);
        resolve();
      }
    });
    chromeProc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  try {
    const debugPort = new URL(wsEndpoint).port;
    const targetsRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((tg) => tg.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let msgId = 0;
    const sendCdp = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++msgId;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(new Error(data.error.message));
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Page.navigate', { url: pageUrl });
    await new Promise((r) => setTimeout(r, 400));

    // Ждем полной инициализации window.__aeraApp в браузере
    const evalResult = await sendCdp('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        for (let i = 0; i < 40; i++) {
          if (window.__aeraApp && document.querySelectorAll('[data-model-card]').length === 3) break;
          await new Promise(r => setTimeout(r, 50));
        }

        // Перехватываем fetch и window.open для проверки отправки заказов
        const telegramRequests = [];
        window.fetch = async (url, opts) => {
          telegramRequests.push({ url, body: JSON.parse(opts.body) });
          return { ok: true, status: 200 };
        };
        const openedUrls = [];
        window.open = (url) => { openedUrls.push(url); };
        const fbqEvents = [];
        window.fbq = (...args) => { fbqEvents.push(args); };

        // 1. Проверяем рендер 3 карточек моделей, их highlights и 4 ступеней фильтрации
        const modelCardsCount = document.querySelectorAll('[data-model-card]').length;
        const modelHighlightsCount = document.querySelectorAll('[data-model-highlights]').length;
        const filtrationCardsCount = document.querySelectorAll('[data-filter-stage]').length;

        // 2. Проверяем Умный конфигуратор: клик "До 20 м²" -> AERA Compact (3 990 сом, 18 м²)
        document.querySelector('[data-config-area="compact"]').click();
        const titleAfterCompact = document.getElementById('calc-result-title').textContent.trim();
        const priceAfterCompact = document.getElementById('calc-result-price').textContent.trim();
        const sqmAfterCompact = document.getElementById('config-sqm-display').textContent.trim();

        // Клик приоритета "Максимальная мощность 360° для зала" -> AERA Pro X (7 290 сом), но площадь пользователя 18 м² сохраняется!
        document.querySelector('[data-config-priority="max_360"]').click();
        const titleAfterProX = document.getElementById('calc-result-title').textContent.trim();
        const priceAfterProX = document.getElementById('calc-result-price').textContent.trim();
        const sqmPreservedAfterPriority = document.getElementById('config-sqm-display').textContent.trim();

        // Переключаем в конфигураторе комплект на "Плюс" -> 7 740 сом
        document.querySelector('[data-config-package="plus"]').click();
        const priceAfterProXPlus = document.getElementById('calc-result-price').textContent.trim();

        // Проверяем отклонение неполного номера +996 (555) 12-3 (6 абонентских цифр)
        const cfgPhone = document.getElementById('config-order-phone');
        cfgPhone.value = '+996 (555) 12-3';
        document.getElementById('configurator-order-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 30));
        const requestsAfterInvalidPhone = telegramRequests.length;

        // Теперь вводим полный номер после автоподстановки "+996 (" + "0555112233"
        cfgPhone.value = '';
        cfgPhone.dispatchEvent(new Event('focus'));
        cfgPhone.value = cfgPhone.value + '0555112233';
        cfgPhone.dispatchEvent(new Event('input', { bubbles: true }));
        const formattedCfgPhone = cfgPhone.value;
        document.getElementById('configurator-order-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 50));

        // 3. Открываем модальное окно карточки товара AERA Compact
        document.querySelector('[data-model-card="compact"]').click();
        const isModalOpen = document.getElementById('product-modal').open;
        const modalTitle = document.getElementById('modal-model-title').textContent.trim();
        const modalBasePrice = document.getElementById('modal-price-current').textContent.trim();
        const modalBottomBasePrice = document.getElementById('modal-bottom-price').textContent.trim();
        const modalHighlightsItems = document.querySelectorAll('#modal-highlights-list li').length;

        // Выбираем в модалке Комплект «Плюс (2 сезона)» с помощью клавиатуры (Enter) -> 4 440 сом
        const plusBundleEl = document.getElementById('modal-bundle-plus');
        plusBundleEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        const modalPlusPrice = document.getElementById('modal-price-current').textContent.trim();
        const modalBottomPlusPrice = document.getElementById('modal-bottom-price').textContent.trim();
        const plusAriaChecked = plusBundleEl.getAttribute('aria-checked');

        // Отправляем форму "Быстрый заказ в 1 клик" из модалки
        const modalPhone = document.getElementById('modal-order-phone');
        modalPhone.value = '0700445566';
        modalPhone.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('modal-oneclick-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 50));
        const modalBannerVisibleAfterOrder = !document.getElementById('modal-order-success').classList.contains('hidden');

        // При переключении комплекта устаревший баннер подтверждения скрывается
        document.getElementById('modal-bundle-base').click();
        const modalBannerHiddenAfterBundleSwitch = document.getElementById('modal-order-success').classList.contains('hidden');

        // 4. Проверяем корзину: по умолчанию лежит AERA Sense (4 990 сом), нажимаем "+" на запасном картридже (+450 сом) -> 5 440 сом
        document.getElementById('add-upsell-filter-btn').click();
        const cartTotalAfterUpsell = document.getElementById('cart-final-total').textContent.trim();

        // Выбираем способ оплаты Optima Pay и отправляем заказ из корзины
        document.querySelector('[data-cart-payment="Optima Pay"]').click();
        const cartPhone = document.getElementById('cart-order-phone');
        cartPhone.value = '0500778899';
        cartPhone.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('cart-checkout-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await new Promise(r => setTimeout(r, 50));

        return {
          modelCardsCount,
          modelHighlightsCount,
          filtrationCardsCount,
          titleAfterCompact,
          priceAfterCompact,
          sqmAfterCompact,
          titleAfterProX,
          priceAfterProX,
          sqmPreservedAfterPriority,
          priceAfterProXPlus,
          requestsAfterInvalidPhone,
          formattedCfgPhone,
          isModalOpen,
          modalTitle,
          modalBasePrice,
          modalBottomBasePrice,
          modalHighlightsItems,
          modalPlusPrice,
          modalBottomPlusPrice,
          plusAriaChecked,
          modalBannerVisibleAfterOrder,
          modalBannerHiddenAfterBundleSwitch,
          cartTotalAfterUpsell,
          fbqEvents,
          telegramRequests,
          openedUrls
        };
      })()`
    });

    const data = evalResult.result.value;
    assert.equal(data.modelCardsCount, 3);
    assert.equal(data.modelHighlightsCount, 3);
    assert.equal(data.filtrationCardsCount, 4);
    assert.equal(data.titleAfterCompact, 'AERA Compact');
    assert.equal(data.priceAfterCompact, '3 990 сом');
    assert.equal(data.sqmAfterCompact, '18 м²');
    assert.equal(data.titleAfterProX, 'AERA Pro X');
    assert.equal(data.priceAfterProX, '7 290 сом');
    assert.equal(data.sqmPreservedAfterPriority, '18 м²');
    assert.equal(data.priceAfterProXPlus, '7 740 сом');
    assert.equal(data.requestsAfterInvalidPhone, 0);
    assert.equal(data.formattedCfgPhone, '+996 (555) 11-22-33');
    assert.equal(data.isModalOpen, true);
    assert.equal(data.modalTitle, 'AERA Compact');
    assert.equal(data.modalBasePrice, '3 990 сом');
    assert.equal(data.modalBottomBasePrice, '3 990 сом');
    assert.ok(data.modalHighlightsItems >= 4);
    assert.equal(data.modalPlusPrice, '4 440 сом');
    assert.equal(data.modalBottomPlusPrice, '4 440 сом');
    assert.equal(data.plusAriaChecked, 'true');
    assert.equal(data.modalBannerVisibleAfterOrder, true);
    assert.equal(data.modalBannerHiddenAfterBundleSwitch, true);
    assert.equal(data.cartTotalAfterUpsell, '5 440 сом');

    // Все 3 формы заказа отправили fbq Lead, Telegram POST и открыли WhatsApp
    assert.equal(data.fbqEvents.length, 3);
    assert.deepEqual(data.fbqEvents[0], ['track', 'Lead', { value: 7740, currency: 'KGS' }]);
    assert.deepEqual(data.fbqEvents[1], ['track', 'Lead', { value: 4440, currency: 'KGS' }]);
    assert.deepEqual(data.fbqEvents[2], ['track', 'Lead', { value: 5440, currency: 'KGS' }]);

    assert.equal(data.telegramRequests.length, 3);
    assert.equal(data.telegramRequests[0].body.utm.utm_source, 'meta_ads');
    assert.equal(data.telegramRequests[2].body.payment_method, 'Optima Pay');
    assert.equal(data.openedUrls.length, 3);
    assert.ok(data.openedUrls[0].startsWith('https://wa.me/996555909090?text='));

    // 5. Проверка мобильной верстки (360x640): отсутствие горизонтального скролла и полное размещение корзины
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 640,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise((r) => setTimeout(r, 250));

    const mobileEval = await sendCdp('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => {
        const modal = document.getElementById('product-modal');
        if (modal && modal.open) modal.close();
        const cartDrawer = document.getElementById('cart-drawer');
        if (cartDrawer && cartDrawer.open) cartDrawer.close();

        // Оставляем 1 прибор в корзине для проверки компактности на экране 360x640
        document.getElementById('clear-cart-btn').click();
        window.__aeraApp.cartStore.addPurifier('sense', 'base', 1);
        await new Promise(r => setTimeout(r, 150));

        const docClientW = document.documentElement.clientWidth;
        const docScrollW = document.documentElement.scrollWidth;
        const headerCartRect = document.querySelector('[data-open-cart]').getBoundingClientRect();
        const floatingRect = document.getElementById('floating-cart-bar').getBoundingClientRect();
        const floatingLbl = document.getElementById('floating-cart-label');
        const floatingClientW = floatingLbl.clientWidth;
        const floatingScrollW = floatingLbl.scrollWidth;
        const floatingTruncated = floatingScrollW > floatingClientW + 1;

        // Открываем корзину на мобильном экране 360x640
        document.querySelector('[data-open-cart]').click();
        await new Promise(r => setTimeout(r, 150));
        const cartRect = cartDrawer.getBoundingClientRect();
        const cartClientW = cartDrawer.clientWidth;
        const cartScrollW = cartDrawer.scrollWidth;
        const submitBtnRect = document.getElementById('cart-checkout-submit-btn').getBoundingClientRect();

        // Закрываем корзину и открываем модалку товара на мобильном экране 360x640
        document.getElementById('cart-close-btn').click();
        document.querySelector('[data-open-model="sense"]').click();
        await new Promise(r => setTimeout(r, 150));
        const modalClientW = modal.clientWidth;
        const modalScrollW = modal.scrollWidth;

        return {
          docClientW,
          docScrollW,
          headerCartLeft: Math.round(headerCartRect.left),
          headerCartRight: Math.round(headerCartRect.right),
          floatingLeft: Math.round(floatingRect.left),
          floatingRight: Math.round(floatingRect.right),
          floatingClientW,
          floatingScrollW,
          floatingTruncated,
          cartLeft: Math.round(cartRect.left),
          cartRight: Math.round(cartRect.right),
          cartClientW,
          cartScrollW,
          submitBtnBottom: Math.round(submitBtnRect.bottom),
          modalClientW,
          modalScrollW
        };
      })()`
    });

    const m = mobileEval.result.value;
    assert.equal(m.docScrollW, m.docClientW, `На мобильном 360px не должно быть горизонтального скролла страницы: ${JSON.stringify(m)}`);
    assert.ok(m.headerCartLeft >= 0 && m.headerCartRight <= 360, `Кнопка корзины в шапке должна полностью помещаться в 360px: ${JSON.stringify(m)}`);
    assert.ok(m.floatingLeft >= 0 && m.floatingRight <= 360, `Плавающая панель корзины должна помещаться в 360px: ${JSON.stringify(m)}`);
    assert.equal(m.floatingTruncated, false, `Текст в плавающей панели корзины не должен обрезаться: ${JSON.stringify(m)}`);
    assert.ok(m.cartLeft >= 0 && m.cartRight <= 360, `Модальное окно корзины должно помещаться по ширине 360px: ${JSON.stringify(m)}`);
    assert.equal(m.cartScrollW, m.cartClientW, `Внутри корзины не должно быть горизонтального переполнения: ${JSON.stringify(m)}`);
    assert.ok(m.submitBtnBottom <= 640, `Кнопка оформления заказа в корзине с 1 товаром должна помещаться в первый экран 360x640: ${JSON.stringify(m)}`);
    assert.equal(m.modalScrollW, m.modalClientW, `Внутри модалки товара не должно быть горизонтального переполнения: ${JSON.stringify(m)}`);

    ws.close();
  } finally {
    chromeProc.kill();
    server.close();
  }
});

