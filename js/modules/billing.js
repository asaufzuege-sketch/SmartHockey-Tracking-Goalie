// SmartHockey Billing Module (Digital Goods API + Payment Request API + Lizenzcode-System)
// Works inside a TWA (Trusted Web Activity) built via PWABuilder – no Capacitor needed.

const BILLING_GRACE_PERIOD_DAYS = 7;    // Offline-Toleranzzeitraum bevor erneute Prüfung nötig ist
const BILLING_PLAY_METHOD = 'https://play.google.com/billing';
const BILLING_PLAY_SERVICE = 'https://play.google.com/billing';
const LICENSE_DURATION_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const LICENSE_TYPE_YEARLY = 'yearly';
const LICENSE_TYPE_LIFETIME = 'lifetime';
const LICENSE_STORAGE_KEYS = {
  activeCode: 'sPro_active_license_code',
  expiry: 'sPro_license_expiry',
  type: 'sPro_license_type'
};

/*
 * Lizenzcodes für kostenlose Pro-Freischaltungen
 *
 * 1-Year Codes (50)
 * PRO-CLUB-YEAR-JLDG
 * PRO-CLUB-YEAR-BGDA
 * PRO-CLUB-YEAR-6FL3
 * PRO-CLUB-YEAR-VA2K
 * PRO-CLUB-YEAR-B7JW
 * PRO-CLUB-YEAR-VAJQ
 * PRO-CLUB-YEAR-GZVR
 * PRO-CLUB-YEAR-VN9Q
 * PRO-CLUB-YEAR-JWAW
 * PRO-CLUB-YEAR-WDLE
 * PRO-CLUB-YEAR-DQJR
 * PRO-CLUB-YEAR-XJKT
 * PRO-CLUB-YEAR-AZHH
 * PRO-CLUB-YEAR-ERA6
 * PRO-CLUB-YEAR-VXS2
 * PRO-CLUB-YEAR-V4GB
 * PRO-CLUB-YEAR-ZWJC
 * PRO-CLUB-YEAR-UJQE
 * PRO-CLUB-YEAR-RAHZ
 * PRO-CLUB-YEAR-F44Q
 * PRO-CLUB-YEAR-PDLE
 * PRO-CLUB-YEAR-C9GC
 * PRO-CLUB-YEAR-6V4W
 * PRO-CLUB-YEAR-P72A
 * PRO-CLUB-YEAR-M9UM
 * PRO-CLUB-YEAR-K6YR
 * PRO-CLUB-YEAR-42NP
 * PRO-CLUB-YEAR-BZYG
 * PRO-CLUB-YEAR-FL4S
 * PRO-CLUB-YEAR-CBJV
 * PRO-CLUB-YEAR-FJVH
 * PRO-CLUB-YEAR-QHLV
 * PRO-CLUB-YEAR-FQV4
 * PRO-CLUB-YEAR-NTX7
 * PRO-CLUB-YEAR-642M
 * PRO-CLUB-YEAR-EWYS
 * PRO-CLUB-YEAR-P5LV
 * PRO-CLUB-YEAR-AB59
 * PRO-CLUB-YEAR-RCFM
 * PRO-CLUB-YEAR-MSL4
 * PRO-CLUB-YEAR-QA8R
 * PRO-CLUB-YEAR-ZWV4
 * PRO-CLUB-YEAR-QLA5
 * PRO-CLUB-YEAR-NCA2
 * PRO-CLUB-YEAR-HB7Y
 * PRO-CLUB-YEAR-R6QJ
 * PRO-CLUB-YEAR-F5HH
 * PRO-CLUB-YEAR-WET5
 * PRO-CLUB-YEAR-59AR
 * PRO-CLUB-YEAR-TMBM
 *
 * Lifetime Codes (10)
 * PRO-LIFE-J7R5
 * PRO-LIFE-3C28
 * PRO-LIFE-K7PV
 * PRO-LIFE-CL49
 * PRO-LIFE-8MTS
 * PRO-LIFE-YSKB
 * PRO-LIFE-BWM2
 * PRO-LIFE-3JKP
 * PRO-LIFE-GHRU
 * PRO-LIFE-CYUJ
 */
const LICENSE_CODES_YEARLY = [
  'PRO-CLUB-YEAR-JLDG',
  'PRO-CLUB-YEAR-BGDA',
  'PRO-CLUB-YEAR-6FL3',
  'PRO-CLUB-YEAR-VA2K',
  'PRO-CLUB-YEAR-B7JW',
  'PRO-CLUB-YEAR-VAJQ',
  'PRO-CLUB-YEAR-GZVR',
  'PRO-CLUB-YEAR-VN9Q',
  'PRO-CLUB-YEAR-JWAW',
  'PRO-CLUB-YEAR-WDLE',
  'PRO-CLUB-YEAR-DQJR',
  'PRO-CLUB-YEAR-XJKT',
  'PRO-CLUB-YEAR-AZHH',
  'PRO-CLUB-YEAR-ERA6',
  'PRO-CLUB-YEAR-VXS2',
  'PRO-CLUB-YEAR-V4GB',
  'PRO-CLUB-YEAR-ZWJC',
  'PRO-CLUB-YEAR-UJQE',
  'PRO-CLUB-YEAR-RAHZ',
  'PRO-CLUB-YEAR-F44Q',
  'PRO-CLUB-YEAR-PDLE',
  'PRO-CLUB-YEAR-C9GC',
  'PRO-CLUB-YEAR-6V4W',
  'PRO-CLUB-YEAR-P72A',
  'PRO-CLUB-YEAR-M9UM',
  'PRO-CLUB-YEAR-K6YR',
  'PRO-CLUB-YEAR-42NP',
  'PRO-CLUB-YEAR-BZYG',
  'PRO-CLUB-YEAR-FL4S',
  'PRO-CLUB-YEAR-CBJV',
  'PRO-CLUB-YEAR-FJVH',
  'PRO-CLUB-YEAR-QHLV',
  'PRO-CLUB-YEAR-FQV4',
  'PRO-CLUB-YEAR-NTX7',
  'PRO-CLUB-YEAR-642M',
  'PRO-CLUB-YEAR-EWYS',
  'PRO-CLUB-YEAR-P5LV',
  'PRO-CLUB-YEAR-AB59',
  'PRO-CLUB-YEAR-RCFM',
  'PRO-CLUB-YEAR-MSL4',
  'PRO-CLUB-YEAR-QA8R',
  'PRO-CLUB-YEAR-ZWV4',
  'PRO-CLUB-YEAR-QLA5',
  'PRO-CLUB-YEAR-NCA2',
  'PRO-CLUB-YEAR-HB7Y',
  'PRO-CLUB-YEAR-R6QJ',
  'PRO-CLUB-YEAR-F5HH',
  'PRO-CLUB-YEAR-WET5',
  'PRO-CLUB-YEAR-59AR',
  'PRO-CLUB-YEAR-TMBM'
];

const LICENSE_CODES_LIFETIME = [
  'PRO-LIFE-J7R5',
  'PRO-LIFE-3C28',
  'PRO-LIFE-K7PV',
  'PRO-LIFE-CL49',
  'PRO-LIFE-8MTS',
  'PRO-LIFE-YSKB',
  'PRO-LIFE-BWM2',
  'PRO-LIFE-3JKP',
  'PRO-LIFE-GHRU',
  'PRO-LIFE-CYUJ'
];

const LICENSE_CODES_YEARLY_SET = new Set(LICENSE_CODES_YEARLY);
const LICENSE_CODES_LIFETIME_SET = new Set(LICENSE_CODES_LIFETIME);

function getLicenseType(code) {
  if (LICENSE_CODES_LIFETIME_SET.has(code)) return LICENSE_TYPE_LIFETIME;
  if (LICENSE_CODES_YEARLY_SET.has(code)) return LICENSE_TYPE_YEARLY;
  return null;
}

App.billing = {
  PRODUCT_ID: 'pro_yearly_subscription',
  isSubscribed: false,
  isTWA: false,
  _service: null,

  async init() {
    // 1. Zuerst prüfen, ob ein gültiger Lizenzcode hinterlegt ist
    if (this._checkLicenseCode()) {
      return;
    }

    // TWA-Kontext über Digital Goods API erkennen
    this.isTWA = (typeof window.getDigitalGoodsService === 'function');

    if (!this.isTWA) {
      // Browser / PWA: Zugriff ohne Paywall gewähren
      console.log('[Billing] Ausführung im Browser → Zugriff gewährt');
      this.isSubscribed = true;
      this._updateUI();
      return;
    }

    // TWA-Kontext: Verbindung zu Google Play Billing herstellen
    try {
      this._service = await window.getDigitalGoodsService(BILLING_PLAY_SERVICE);
      console.log('[Billing] Digital Goods Service verbunden');
    } catch (err) {
      console.warn('[Billing] Konnte nicht mit dem Digital Goods Service verbinden:', err);
      this._checkLocalCache();
      return;
    }

    await this._loadProductDetails();
    await this._checkEntitlements();
  },

  // -- LIZENZCODE-METHODEN --

  _checkLicenseCode() {
    const activeCode = localStorage.getItem(LICENSE_STORAGE_KEYS.activeCode);
    const normalizedCode = activeCode ? activeCode.trim().toUpperCase() : '';
    const licenseType = getLicenseType(normalizedCode);

    if (!normalizedCode || !licenseType) {
      if (activeCode) this._clearStoredLicense();
      return false;
    }

    if (licenseType === LICENSE_TYPE_LIFETIME) {
      localStorage.setItem(LICENSE_STORAGE_KEYS.activeCode, normalizedCode);
      localStorage.setItem(LICENSE_STORAGE_KEYS.type, LICENSE_TYPE_LIFETIME);
      localStorage.removeItem(LICENSE_STORAGE_KEYS.expiry);
      console.log('[Billing] Gültiger Lifetime-Lizenzcode gefunden → Zugriff gewährt');
      this.isSubscribed = true;
      this._updateUI();
      return true;
    }

    const expiry = parseInt(localStorage.getItem(LICENSE_STORAGE_KEYS.expiry), 10);
    if (Number.isFinite(expiry) && Date.now() < expiry) {
      localStorage.setItem(LICENSE_STORAGE_KEYS.activeCode, normalizedCode);
      localStorage.setItem(LICENSE_STORAGE_KEYS.type, LICENSE_TYPE_YEARLY);
      console.log('[Billing] Gültiger 1-Jahres-Lizenzcode gefunden → Zugriff gewährt');
      this.isSubscribed = true;
      this._updateUI();
      return true;
    }

    console.log('[Billing] Jahres-Lizenzcode abgelaufen oder unvollständig → Lizenz wird entfernt');
    this._clearStoredLicense();
    return false;
  },

  applyLicenseCode() {
    const input = document.getElementById('licenseCodeInput');
    const code = input ? input.value.trim().toUpperCase() : '';

    if (!code) {
      alert('Bitte gib einen Lizenzcode ein.');
      return;
    }

    const licenseType = getLicenseType(code);

    if (!licenseType) {
      alert('Ungültiger Lizenzcode. Bitte überprüfe deine Eingabe und versuche es erneut.');
      return;
    }

    localStorage.setItem(LICENSE_STORAGE_KEYS.activeCode, code);
    localStorage.setItem(LICENSE_STORAGE_KEYS.type, licenseType);

    if (licenseType === LICENSE_TYPE_LIFETIME) {
      localStorage.removeItem(LICENSE_STORAGE_KEYS.expiry);
      this.isSubscribed = true;
      if (input) input.value = '';
      this._updateUI();
      alert('Lizenzcode erfolgreich eingelöst! Dein Zugang zu SmartHockey Pro ist dauerhaft aktiviert.');
      return;
    }

    localStorage.setItem(LICENSE_STORAGE_KEYS.expiry, String(Date.now() + LICENSE_DURATION_YEAR_MS));
    this.isSubscribed = true;
    if (input) input.value = '';
    this._updateUI();
    alert('Lizenzcode erfolgreich eingelöst! Dein Zugang zu SmartHockey Pro ist für 1 Jahr aktiviert.');
  },

  // -- ENDE LIZENZCODE-METHODEN --

  _clearStoredLicense() {
    localStorage.removeItem(LICENSE_STORAGE_KEYS.activeCode);
    localStorage.removeItem(LICENSE_STORAGE_KEYS.expiry);
    localStorage.removeItem(LICENSE_STORAGE_KEYS.type);
  },

  async _loadProductDetails() {
    if (!this._service) return;
    try {
      const details = await this._service.getDetails([this.PRODUCT_ID]);
      if (details && details.length > 0) {
        const product = details[0];
        console.log('[Billing] Produktdetails geladen:', product.title, product.price);

        if (product.price && product.price.value && product.price.currency) {
          const amount = parseFloat(product.price.value);
          const currency = product.price.currency;
          const locale = navigator.language || 'en-US';
          let formatted;
          try {
            formatted = new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: currency
            }).format(amount);
          } catch (fmtErr) {
            // Fallback falls Intl.NumberFormat mit currency-Code fehlschlägt
            formatted = `${amount.toFixed(2)} ${currency}`;
          }

          // Header-Preis
          const priceEl = document.querySelector('.price-amount');
          if (priceEl) priceEl.textContent = formatted;

          // CTA-Button-Text (deutsch: „Jetzt abonnieren – <preis>/Jahr")
          const btn = document.getElementById('subscribeBtn');
          if (btn) btn.textContent = `Jetzt abonnieren – ${formatted}/Jahr`;
        }
      }
    } catch (err) {
      console.warn('[Billing] Produktdetails konnten nicht geladen werden:', err);
    }
  },

  async _checkEntitlements() {
    if (!this._service) {
      this._checkLocalCache();
      return;
    }
    try {
      const entitlements = await this._service.listPurchases();
      const active = entitlements && entitlements.some(
        (e) => e.itemId === this.PRODUCT_ID
      );
      if (active) {
        console.log('[Billing] ✅ Aktives Abonnement gefunden');
        this.isSubscribed = true;
        this._saveSubscriptionState(true);
        this._updateUI();
      } else {
        console.log('[Billing] ❌ Kein aktives Abonnement');
        this.isSubscribed = false;
        this._saveSubscriptionState(false);
        this._updateUI();
      }
    } catch (err) {
      console.warn('[Billing] Abo-Prüfung fehlgeschlagen:', err);
      this._checkLocalCache();
    }
  },

  _checkLocalCache() {
    const active = localStorage.getItem('subscription_active');
    const checkDate = localStorage.getItem('subscription_check_date');

    if (active === 'true' && checkDate) {
      const daysSinceCheck = (Date.now() - parseInt(checkDate, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceCheck <= BILLING_GRACE_PERIOD_DAYS) {
        console.log('[Billing] Offline-Toleranzzeitraum – Zugriff gewährt');
        this.isSubscribed = true;
        this._updateUI();
        return;
      }
    }

    this.isSubscribed = false;
    this._updateUI();
  },

  _saveSubscriptionState(active) {
    localStorage.setItem('subscription_active', active ? 'true' : 'false');
    localStorage.setItem('subscription_check_date', String(Date.now()));
  },

  async purchase() {
    if (!this.isTWA) return;

    const paymentMethods = [{
      supportedMethods: BILLING_PLAY_METHOD,
      data: { sku: this.PRODUCT_ID }
    }];
    // Der Betrag hier ist ein Platzhalter, der von der PaymentRequest API benötigt wird.
    // Der tatsächliche Preis wird in der Google Play Console festgelegt und im Play Store Kaufdialog angezeigt.
    const paymentDetails = { total: { label: 'SmartHockey Pro', amount: { currency: 'USD', value: '0' } } };

    try {
      const request = new PaymentRequest(paymentMethods, paymentDetails);
      const canPay = await request.canMakePayment();
      if (!canPay) {
        alert('Google Play Billing ist nicht verfügbar. Bitte versuche es erneut.');
        return;
      }
      const response = await request.show();
      await response.complete('success');

      console.log('[Billing] ✅ Kauf erfolgreich');
      this.isSubscribed = true;
      this._saveSubscriptionState(true);
      this._updateUI();
    } catch (err) {
      if (err && err.name === 'AbortError') {
        console.log('[Billing] Kauf durch Benutzer abgebrochen');
      } else {
        console.error('[Billing] Fehler beim Kauf:', err);
        alert('Kauf fehlgeschlagen. Bitte versuche es erneut.');
      }
    }
  },

  async restorePurchases() {
    if (!this.isTWA) return;
    await this._checkEntitlements();
    if (this.isSubscribed) {
      alert('Käufe erfolgreich wiederhergestellt!');
    } else {
      alert('Kein aktives Abonnement gefunden. Wenn du glaubst, dass du ein aktives Abonnement hast, überprüfe bitte deine Internetverbindung und versuche es erneut.');
    }
  },

  _updateUI() {
    const paywall = document.getElementById('subscriptionPaywall');
    const content = document.getElementById('appContent');

    if (this.isSubscribed) {
      if (paywall) paywall.style.display = 'none';
      if (content) content.style.display = 'flex';
      document.body.classList.remove('locked');
      document.body.classList.add('subscribed');
    } else {
      if (paywall) paywall.style.display = 'flex';
      if (content) content.style.display = 'none';
      document.body.classList.remove('subscribed');
      document.body.classList.add('locked');
    }
  }
};
