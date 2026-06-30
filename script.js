const API =
  "https://script.google.com/macros/s/AKfycbzUGNUzl_-oalCHrvkl4IOawJO61o84eU79fwnAyVv9kycPDvq4Mwd4OLI6yPqir2yB/exec";
const MAX_ORDER_PER_DAY = 70;
const API_LOG = "[MiniWonton API]";

/** Aturan tanggal bisnis (dropdown & validasi order web) */
const TANGGAL_MULAI_BISNIS = "2026-05-25";
const TANGGAL_LIBUR = new Set([
  "2026-05-28",
  "2026-05-31",
  "2026-06-01",
  "2026-06-07",
  "2026-06-14",
  "2026-06-21",
  "2026-06-28",
  "2026-07-05",
  "2026-07-12",
  "2026-07-19",
  "2026-07-26",
  "2026-08-02",
  "2026-08-09",
]);
const TANGGAL_KUNCI_SOLD_OUT = new Set([
  "2026-05-25",
  "2026-05-26",
  "2026-05-27",
  "2026-05-29",
  "2026-05-30",
  "2026-06-02",
  "2026-06-03",
]);
const JENDELA_HARI_TAMPIL = 14;

/** Data produk (id, nama, harga) */
const MAIN_ORDER_IDS = [
  "bangkok",
  "hot-lava",
  "keju",
  "saus-bangkok",
  "saus-hot-lava",
  "chili-oil",
  "goreng-kuah-original",
  "rebus-kuah-original",
  "mix-kuah-original",
  "goreng-kuah-seblak",
  "rebus-kuah-seblak",
  "mix-kuah-seblak",
  "goreng-kuah-keju-creamy",
  "rebus-kuah-keju-creamy",
  "mix-kuah-keju-creamy",
  "goreng-frozen",
  "rebus-frozen-bangkok",
  "rebus-frozen-hot-lava",
  "rebus-frozen-chili-oil",
];
const MAIN_ORDER_NAMES = [
  "Goreng Saus Bangkok",
  "Goreng Saus Hot Lava",
  "Goreng Saus Keju",
  "Rebus Saus Bangkok",
  "Rebus Saus Hot Lava",
  "Rebus Chili Oil",
  "Goreng Kuah Original",
  "Rebus Kuah Original",
  "Mix Kuah Original",
  "Goreng Kuah Seblak",
  "Rebus Kuah Seblak",
  "Mix Kuah Seblak",
  "Goreng Kuah Keju Creamy",
  "Rebus Kuah Keju Creamy",
  "Mix Kuah Keju Creamy",
  "Goreng Frozen",
  "Rebus Frozen Bangkok",
  "Rebus Frozen Hot Lava",
  "Rebus Frozen Chili Oil",
];
const MAIN_ORDER_PRICES = [
  8000, 8000, 8000, 7000, 7000, 7000, 10000, 10000, 10000, 10000, 10000, 10000,
  11000, 11000, 11000, 30000, 30000, 30000, 30000,
];

// Data add-on
const ADDON_IDS = ["sambal-bangkok", "lava", "chili", "original", "seblak"];
const ADDON_NAMES = [
  "Saus Bangkok",
  "Saus Hot Lava",
  "Chili Oil",
  "Kuah Original",
  "Kuah Seblak",
];
const ADDON_PRICES = [1500, 1500, 1500, 2500, 2500];

/** Nomor admin */
const WA_ADMIN = "628132524282";

/** Helper functions */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatLocalYMD(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function normalizeDateYMD(value) {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${pad2(dmy[2])}-${pad2(dmy[1])}`;
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return formatLocalYMD(parsed);
  return "";
}

function isValidCalendarDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

function bolehTampilDiDropdown(dateYMD) {
  if (!dateYMD || dateYMD < TANGGAL_MULAI_BISNIS) return false;
  if (dateYMD === "2026-05-23" || dateYMD === "2026-05-24") return false;
  if (TANGGAL_LIBUR.has(dateYMD)) return false;
  return true;
}

function isTanggalKunciSoldOut(dateYMD) {
  return TANGGAL_KUNCI_SOLD_OUT.has(dateYMD);
}

function getAffiliate() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) sessionStorage.setItem("affiliate", ref);
  return sessionStorage.getItem("affiliate") || "-";
}

function buildApiUrl(action, params = {}) {
  const url = new URL(API);
  url.searchParams.set("action", action);
  url.searchParams.set("t", String(Date.now()));
  for (const [key, val] of Object.entries(params)) {
    if (val != null && String(val).trim() !== "") {
      url.searchParams.set(key, String(val).trim());
    }
  }
  return url;
}

function parseApiJson(rawText, action) {
  const trimmed = (rawText || "").trim();
  if (!trimmed)
    throw new Error(`Respons kosong dari Apps Script (action: ${action})`);
  if (trimmed.startsWith("<")) {
    throw new Error(
      `Apps Script mengembalikan HTML, bukan JSON. Cek deployment Web App.`,
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch (parseErr) {
    throw new Error(
      `JSON tidak valid (action: ${action}): ${parseErr.message}`,
    );
  }
}

function apiRequestJsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `gasCb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = buildApiUrl(action, { ...params, callback: callbackName });
    const timeoutMs = 20000;
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new Error(`JSONP timeout setelah ${timeoutMs}ms (action: ${action})`),
      );
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = function (data) {
      cleanup();
      if (!data) reject(new Error(`JSONP respons kosong (action: ${action})`));
      else if (data.error) reject(new Error(String(data.error)));
      else resolve(data);
    };

    const script = document.createElement("script");
    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error(`JSONP gagal memuat script. URL: ${url.toString()}`));
    };
    document.head.appendChild(script);
  });
}

async function apiRequest(action, params = {}) {
  const url = buildApiUrl(action, params);
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });
    const rawText = await response.text();
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 200)}`);
    const json = parseApiJson(rawText, action);
    if (json.error) throw new Error(String(json.error));
    return json;
  } catch (fetchErr) {
    console.warn(API_LOG, "Fetch gagal, mencoba JSONP:", fetchErr.message);
    return apiRequestJsonp(action, params);
  }
}

/** Format satu baris produk: "Nama Produk (Jumlah)" */
function formatDetailProdukLine(namaProduk, quantity) {
  const qty = Number(quantity) || 0;
  if (!namaProduk || qty <= 0) return "";
  return `${namaProduk} (${qty})`;
}

function buildDetailPesanan() {
  const lines = [];

  for (let i = 0; i < MAIN_ORDER_IDS.length; i++) {
    const qty =
      parseInt(document.getElementById(MAIN_ORDER_IDS[i])?.value, 10) || 0;
    if (qty > 0) {
      lines.push(
        formatDetailProdukLine(`Mini Wonton ${MAIN_ORDER_NAMES[i]}`, qty),
      );
    }
  }

  for (let i = 0; i < ADDON_IDS.length; i++) {
    const qty = parseInt(document.getElementById(ADDON_IDS[i])?.value, 10) || 0;
    if (qty > 0) {
      lines.push(formatDetailProdukLine(`Add On ${ADDON_NAMES[i]}`, qty));
    }
  }

  return lines.join("\n");
}

function hitungTotalOrder() {
  let total = 0,
    totalItem = 0;

  // Hitung produk utama
  for (let i = 0; i < MAIN_ORDER_IDS.length; i++) {
    const val =
      parseInt(document.getElementById(MAIN_ORDER_IDS[i])?.value, 10) || 0;
    total += val * MAIN_ORDER_PRICES[i];
    totalItem += val;
  }

  // Hitung add-on
  for (let i = 0; i < ADDON_IDS.length; i++) {
    const val = parseInt(document.getElementById(ADDON_IDS[i])?.value, 10) || 0;
    total += val * ADDON_PRICES[i];
    totalItem += val;
  }

  return { total, totalItem };
}

function hitungTotal() {
  const { total, totalItem } = hitungTotalOrder();
  document.getElementById("total").innerText = total.toLocaleString("id-ID");
  const dateSection = document.getElementById("date-section");
  if (dateSection) {
    if (totalItem > 0 || total > 0) {
      dateSection.style.display = "block";
      dateSection.style.display = "block";
    } else {
      dateSection.style.display = "none";
    }
  }
}

function tambah(id) {
  const input = document.getElementById(id);
  input.value = parseInt(input.value, 10) + 1;
  hitungTotal();
}

function kurang(id) {
  const input = document.getElementById(id);
  if (input.value > 0) input.value = parseInt(input.value, 10) - 1;
  hitungTotal();
}

function initProductQuantityControls() {
  const qtyContainers = document.querySelectorAll(".item .qty");
  if (!qtyContainers.length) return;

  qtyContainers.forEach((qtyBox) => {
    if (qtyBox.dataset.qtyBound === "1") return;
    qtyBox.dataset.qtyBound = "1";

    const input = qtyBox.querySelector('input[type="number"]');
    const minusBtn = qtyBox.querySelector(".qty-minus");
    const plusBtn = qtyBox.querySelector(".qty-plus");

    if (!input) return;

    const syncInputValue = () => {
      const val = parseInt(input.value, 10);
      input.value = Number.isNaN(val) || val < 0 ? 0 : val;
      hitungTotal();
    };

    if (minusBtn && !minusBtn.disabled) {
      minusBtn.type = "button";
      minusBtn.addEventListener("click", () => {
        const current = parseInt(input.value, 10) || 0;
        input.value = Math.max(0, current - 1);
        hitungTotal();
      });
    }

    if (plusBtn && !plusBtn.disabled) {
      plusBtn.type = "button";
      plusBtn.addEventListener("click", () => {
        const current = parseInt(input.value, 10) || 0;
        input.value = current + 1;
        hitungTotal();
      });
    }

    input.addEventListener("input", syncInputValue);
    input.addEventListener("change", syncInputValue);
  });
}

function getOpsiLabelTanggal(dateYMD, count) {
  const penuh = isTanggalKunciSoldOut(dateYMD) || count >= MAX_ORDER_PER_DAY;
  return { label: penuh ? `${dateYMD} [SOLD OUT]` : dateYMD, disabled: penuh };
}

async function cekKuotaTanggal(tanggal) {
  const dateYMD = normalizeDateYMD(tanggal);
  if (!dateYMD) throw new Error(`Format tanggal tidak valid: "${tanggal}"`);
  if (!bolehTampilDiDropdown(dateYMD)) {
    return {
      date: dateYMD,
      count: MAX_ORDER_PER_DAY,
      max: MAX_ORDER_PER_DAY,
      available: false,
      full: true,
    };
  }
  try {
    const json = await apiRequest("checkQuota", { date: dateYMD });
    const count = Number.parseInt(json.count, 10) || 0;
    const max = Number.parseInt(json.max, 10) || MAX_ORDER_PER_DAY;
    const available =
      json.available === true || (json.full !== true && count < max);
    return {
      date: dateYMD,
      count,
      max,
      available,
      full: json.full === true || count >= max,
    };
  } catch (err) {
    console.error(API_LOG, "cekKuotaTanggal gagal:", err);
    throw err;
  }
}

async function loadAvailableDatesData() {
  let disabledDates = [];
  let noDatesAvailable = false;
  try {
    const json = await apiRequest("getAvailableDates");
    let dates = [];
    if (Array.isArray(json)) dates = json;
    else if (json && Array.isArray(json.data)) dates = json.data;

    if (dates.length === 0) {
      noDatesAvailable = true;
      return { disabledDates, noDatesAvailable };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const todayYMD = formatLocalYMD(now); // Today's date
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowYMD = formatLocalYMD(tomorrow);

    dates.forEach(({ date, count }) => {
      const dateYMD = normalizeDateYMD(date);
      if (!dateYMD || !bolehTampilDiDropdown(dateYMD)) return;

      let { label, disabled } = getOpsiLabelTanggal(dateYMD, count);
      // Disable today's date
      if (dateYMD === todayYMD) {
        disabled = true;
      }
      // Cut-Off Close Order logic
      if (dateYMD === tomorrowYMD && currentHour >= 21) {
        label = `${dateYMD} [CLOSED / SOLD OUT]`;
        disabled = true;
      }
      if (disabled) {
        disabledDates.push(dateYMD);
      }
    });
  } catch (err) {
    console.error(API_LOG, "loadAvailableDatesData gagal:", err);
    noDatesAvailable = true;
  }
  return { disabledDates, noDatesAvailable };
}

function buildWhatsAppUrl(isiPesan) {
  const nomor = String(WA_ADMIN).replace(/\D/g, "");
  const dasar = `https://wa.me/${nomor}`;
  const pesan = isiPesan == null ? "" : String(isiPesan).trim();
  if (!pesan) return dasar;
  return dasar + "?text=" + encodeURIComponent(pesan);
}

function buildPesanWhatsApp({
  nama,
  detailPesanan,
  total,
  tanggal,
  shift,
  antarKe,
}) {
  let pesan = `Halo Minna,\nNama: ${nama}\n\nSaya ingin memesan:\n${detailPesanan}\n\nTanggal pengambilan: ${tanggal}\nShift: ${shift}\n`;
  if (antarKe) pesan += `Lokasi Antar: ${antarKe}\n`;
  pesan += `Total: Rp ${total.toLocaleString("id-ID")}\n\nSaya ingin memesan varian produk tersebut. Aku tunggu produknya ya!!`;
  return pesan;
}

function kirimKeSheets(payload) {
  return fetch(API, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error(API_LOG, "POST Sheets gagal:", error);
    throw error;
  });
}

/** ===== Keranjang Belanja (LocalStorage) ===== */
const CART_STORAGE_KEY = "mini_wonton_cart_v1";
const MAIN_ORDER_INDEX_BY_ID = Object.fromEntries(
  MAIN_ORDER_IDS.map((id, idx) => [id, idx]),
);
const ADDON_INDEX_BY_ID = Object.fromEntries(
  ADDON_IDS.map((id, idx) => [id, idx]),
);

function cartLoadItems() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((it) => it && it.id)
      .map((it) => ({
        id: String(it.id),
        nama: String(it.nama || ""),
        harga: Number(it.harga) || 0,
        quantity: Number(it.quantity) || 0,
        gambar: String(it.gambar || ""),
      }))
      .filter((it) => it.quantity > 0);
  } catch (err) {
    console.warn(API_LOG, "Gagal load cart:", err.message);
    return [];
  }
}

function cartSaveItems(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function cartGetTotalQty(items) {
  return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
}

function cartGetTotalPrice(items) {
  return items.reduce(
    (sum, it) => sum + (Number(it.harga) || 0) * (Number(it.quantity) || 0),
    0,
  );
}

function cartSortItems(items) {
  const byId = new Map(items.map((it) => [it.id, it]));
  const included = new Set();
  const result = [];

  for (const id of MAIN_ORDER_IDS) {
    if (byId.has(id)) {
      result.push(byId.get(id));
      included.add(id);
    }
  }
  for (const id of ADDON_IDS) {
    if (byId.has(id)) {
      result.push(byId.get(id));
      included.add(id);
    }
  }

  // Append unknown ids (rare, but safe)
  for (const it of items) {
    if (!included.has(it.id)) result.push(it);
  }

  return result;
}

function cartUpsertItems(itemsToAdd) {
  const cart = cartLoadItems();
  for (const newItem of itemsToAdd) {
    const qty = Number(newItem.quantity) || 0;
    if (!newItem.id || qty <= 0) continue;

    const existing = cart.find((it) => it.id === newItem.id);
    if (existing) {
      existing.quantity = (Number(existing.quantity) || 0) + qty;
    } else {
      cart.push({
        id: newItem.id,
        nama: String(newItem.nama || ""),
        harga: Number(newItem.harga) || 0,
        quantity: qty,
        gambar: String(newItem.gambar || ""),
      });
    }
  }

  cartSaveItems(cart);
  return cart;
}

function formatRupiah(n) {
  return (Number(n) || 0).toLocaleString("id-ID");
}

function ensureFloatingCartExists() {
  let cartLink = document.querySelector(".floating-cart");
  if (cartLink) return cartLink;

  cartLink = document.createElement("a");
  cartLink.href = "cart.html";
  cartLink.className = "floating-cart";
  cartLink.setAttribute("aria-label", "Keranjang Belanja");
  cartLink.innerHTML = `
    <span class="floating-cart-icon">🛒</span>
    <span class="floating-cart-badge" id="floating-cart-badge">0</span>
  `;

  document.body.appendChild(cartLink);
  return cartLink;
}

function cartSyncFloatingCartBadge() {
  ensureFloatingCartExists();

  const badge = document.getElementById("floating-cart-badge");
  if (!badge) return;

  const totalQty = cartGetTotalQty(cartLoadItems());
  badge.textContent = String(totalQty);
  badge.style.display = "flex";
}

function getImageSrcFromInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return "";

  const wrapper = input.closest(".item");
  const img = wrapper ? wrapper.querySelector("img.product-img") : null;
  return img && img.getAttribute("src") ? img.getAttribute("src") : "";
}

function extractCartItemsFromProductPage() {
  const items = [];

  for (let i = 0; i < MAIN_ORDER_IDS.length; i++) {
    const id = MAIN_ORDER_IDS[i];
    const input = document.getElementById(id);
    if (!input) continue;

    const qty = parseInt(input.value, 10) || 0;
    if (qty <= 0) continue;

    items.push({
      id,
      nama: `Mini Wonton ${MAIN_ORDER_NAMES[i]}`,
      harga: MAIN_ORDER_PRICES[i],
      quantity: qty,
      gambar: getImageSrcFromInput(id),
    });
  }

  for (let i = 0; i < ADDON_IDS.length; i++) {
    const id = ADDON_IDS[i];
    const input = document.getElementById(id);
    if (!input) continue;

    const qty = parseInt(input.value, 10) || 0;
    if (qty <= 0) continue;

    items.push({
      id,
      nama: `Add On ${ADDON_NAMES[i]}`,
      harga: ADDON_PRICES[i],
      quantity: qty,
      gambar: getImageSrcFromInput(id),
    });
  }

  return items;
}

function buildDetailPesananFromCartItem(cartItem) {
  if (!cartItem || !cartItem.id) return "";

  const qty = Number(cartItem.quantity) || 0;
  if (qty <= 0) return "";

  const mainIdx = MAIN_ORDER_INDEX_BY_ID[cartItem.id];
  if (Number.isInteger(mainIdx)) {
    return formatDetailProdukLine(
      `Mini Wonton ${MAIN_ORDER_NAMES[mainIdx]}`,
      qty,
    );
  }

  const addonIdx = ADDON_INDEX_BY_ID[cartItem.id];
  if (Number.isInteger(addonIdx)) {
    return formatDetailProdukLine(`Add On ${ADDON_NAMES[addonIdx]}`, qty);
  }

  return formatDetailProdukLine(cartItem.nama, qty);
}

/** Gabungkan seluruh item keranjang jadi satu string dengan pemisah baris baru (\n) */
function buildDetailPesananFromCartItems(cartItems) {
  const itemsSorted = cartSortItems(cartItems);
  const lines = itemsSorted
    .map((it) => buildDetailPesananFromCartItem(it))
    .filter((line) => line.length > 0);

  return lines.join("\n");
}

function cartRenderPage() {
  const listEl = document.getElementById("cart-list");
  if (!listEl) return;

  const emptyEl = document.getElementById("cart-empty");
  const addMoreEl = document.getElementById("cart-add-more");
  const checkoutEl = document.getElementById("cart-checkout-section");
  const totalEl = document.getElementById("cart-total");

  const cartItems = cartSortItems(cartLoadItems());
  const isEmpty = cartItems.length === 0;
  listEl.innerHTML = "";

  if (emptyEl) emptyEl.style.display = isEmpty ? "block" : "none";
  if (addMoreEl) addMoreEl.style.display = isEmpty ? "none" : "block";
  if (checkoutEl) checkoutEl.style.display = isEmpty ? "none" : "block";

  if (isEmpty) {
    if (totalEl) totalEl.textContent = "0";
    cartCloseAddMenuDropdown();
    return;
  }

  if (totalEl) {
    totalEl.textContent = formatRupiah(cartGetTotalPrice(cartItems));
  }

  for (const item of cartItems) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.itemId = item.id;

    const img = document.createElement("img");
    if (item.gambar) img.src = item.gambar;
    img.alt = item.nama || "-";
    row.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "cart-meta";

    const name = document.createElement("div");
    name.className = "cart-name";
    name.textContent = item.nama;
    meta.appendChild(name);

    const price = document.createElement("div");
    price.className = "cart-price";
    price.textContent = `Rp ${formatRupiah(item.harga)} x ${item.quantity} = Rp ${formatRupiah(
      item.harga * item.quantity,
    )}`;
    meta.appendChild(price);

    row.appendChild(meta);

    const controls = document.createElement("div");
    controls.className = "cart-controls";

    const btnMinus = document.createElement("button");
    btnMinus.type = "button";
    btnMinus.className = "cart-qty-minus";
    btnMinus.dataset.id = item.id;
    btnMinus.textContent = "-";
    controls.appendChild(btnMinus);

    const qtyValue = document.createElement("div");
    qtyValue.className = "cart-qty-value";
    qtyValue.textContent = String(item.quantity);
    controls.appendChild(qtyValue);

    const btnPlus = document.createElement("button");
    btnPlus.type = "button";
    btnPlus.className = "cart-qty-plus";
    btnPlus.dataset.id = item.id;
    btnPlus.textContent = "+";
    controls.appendChild(btnPlus);

    row.appendChild(controls);

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "cart-item-delete";
    btnDel.dataset.id = item.id;
    btnDel.textContent = "🗑️";
    row.appendChild(btnDel);

    listEl.appendChild(row);
  }
}

function cartUpdateQuantity(itemId, delta) {
  const items = cartLoadItems();
  const target = items.find((it) => it.id === itemId);
  if (!target) return;

  target.quantity = (Number(target.quantity) || 0) + delta;

  if (target.quantity <= 0) {
    cartSaveItems(items.filter((it) => it.id !== itemId));
  } else {
    cartSaveItems(items);
  }

  cartRenderPage();
  cartSyncFloatingCartBadge();
}

function cartRemoveItem(itemId) {
  const items = cartLoadItems();
  cartSaveItems(items.filter((it) => it.id !== itemId));
  cartRenderPage();
  cartSyncFloatingCartBadge();
}

function cartCloseAddMenuDropdown() {
  const dropdown = document.getElementById("cart-add-menu-dropdown");
  const toggleBtn = document.getElementById("btn-tambah-menu");
  if (!dropdown || !toggleBtn) return;

  dropdown.hidden = true;
  toggleBtn.setAttribute("aria-expanded", "false");
}

function initCartAddMoreMenu() {
  const toggleBtn = document.getElementById("btn-tambah-menu");
  const dropdown = document.getElementById("cart-add-menu-dropdown");
  const addMoreEl = document.getElementById("cart-add-more");
  if (!toggleBtn || !dropdown || !addMoreEl) return;
  if (addMoreEl.dataset.addMenuBound === "1") return;
  addMoreEl.dataset.addMenuBound = "1";

  toggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = dropdown.hidden;
    dropdown.hidden = !willOpen;
    toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (!addMoreEl.contains(e.target)) {
      cartCloseAddMenuDropdown();
    }
  });
}

function initCartPage() {
  cartRenderPage();
  initCartAddMoreMenu();

  const listEl = document.getElementById("cart-list");
  if (listEl && !listEl.dataset.cartBound) {
    listEl.dataset.cartBound = "1";

    listEl.addEventListener("click", (e) => {
      const minusBtn = e.target.closest(".cart-qty-minus");
      if (minusBtn) {
        cartUpdateQuantity(minusBtn.dataset.id, -1);
        return;
      }

      const plusBtn = e.target.closest(".cart-qty-plus");
      if (plusBtn) {
        cartUpdateQuantity(plusBtn.dataset.id, +1);
        return;
      }

      const delBtn = e.target.closest(".cart-item-delete");
      if (delBtn) {
        cartRemoveItem(delBtn.dataset.id);
      }
    });
  }

  const btnKonfirmasi = document.getElementById("btn-konfirmasi");
  if (btnKonfirmasi) {
    btnKonfirmasi.addEventListener("click", (e) => {
      e.preventDefault();
      kirimKeranjang();
    });
  }
}

function initProductPageAddToCart() {
  const btnAdd = document.getElementById("btn-add-to-cart");
  if (!btnAdd) return;

  btnAdd.addEventListener("click", (e) => {
    e.preventDefault();
    tambahKeKeranjangDariHalamanProduk();
  });
}

function tambahKeKeranjangDariHalamanProduk() {
  const itemsToAdd = extractCartItemsFromProductPage();
  if (itemsToAdd.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Pesanan Kosong",
      text: "Pilih minimal 1 produk terlebih dulu.",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  const updatedCart = cartUpsertItems(itemsToAdd);
  cartSyncFloatingCartBadge();

  Swal.fire({
    icon: "success",
    title: "Ditambahkan ke Keranjang",
    text: `Keranjang kamu sekarang berisi ${cartGetTotalQty(updatedCart)} item.`,
    confirmButtonColor: "#3085d6",
  });
}

async function kirimKeranjang() {
  if (sedangKirimPesanan) {
    console.warn(API_LOG, "Pesanan sedang diproses");
    return;
  }

  const nama = document.getElementById("nama")?.value.trim() || "";
  const wa = document.getElementById("wa")?.value.trim() || "";
  const dateSelect = document.getElementById("delivery-date-select");
  const shiftSelect = document.getElementById("shift-select");
  const antarKeSelect = document.getElementById("antarKe");
  const customAntarKeInput = document.getElementById("customAntarKe");

  const selectedDate = dateSelect ? normalizeDateYMD(dateSelect.value) : "";
  const selectedShift = shiftSelect ? shiftSelect.value.trim() : "";
  let selectedAntarKe = antarKeSelect ? antarKeSelect.value.trim() : "";

  if (selectedAntarKe === "Custom" && customAntarKeInput) {
    selectedAntarKe = customAntarKeInput.value.trim();
  }

  const cartItems = cartLoadItems();
  if (cartItems.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Keranjang Kosong",
      text: "Silakan tambahkan produk dulu sebelum konfirmasi.",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  const detailPesananAll = buildDetailPesananFromCartItems(cartItems);
  const totalAll = cartGetTotalPrice(cartItems);

  // Validasi: Nama
  if (!nama) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Mohon isi Nama Anda!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: No WA
  if (!wa) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Mohon isi Nomor WhatsApp Anda!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: Tanggal
  if (!selectedDate) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan pilih Tanggal Pengambilan!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: Shift
  if (!selectedShift) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan pilih Shift Pengambilan!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: Antar Ke
  if (!selectedAntarKe) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan pilih Lokasi Antar!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  if (
    antarKeSelect &&
    antarKeSelect.value === "Custom" &&
    (!customAntarKeInput || !customAntarKeInput.value.trim())
  ) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan isi lokasi custom Anda!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  Swal.fire({
    title: "Konfirmasi Pesanan",
    text: "Satu langkah lagi! Klik 'Konfirmasi' untuk menyimpan item keranjang dan lanjut ke WhatsApp.",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Konfirmasi",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    sedangKirimPesanan = true;

    const btnKonfirmasi = document.getElementById("btn-konfirmasi");
    if (btnKonfirmasi) {
      btnKonfirmasi.disabled = true;
      btnKonfirmasi.textContent = "Memeriksa kuota...";
    }

    try {
      const kuota = await cekKuotaTanggal(selectedDate);
      if (!kuota.available || kuota.full || kuota.count >= MAX_ORDER_PER_DAY) {
        Swal.fire({
          icon: "error",
          title: "Kuota Penuh",
          text: "Maaf kuota penuh, silakan pilih tanggal lain!",
          confirmButtonColor: "#3085d6",
        });
        if (btnKonfirmasi) {
          btnKonfirmasi.disabled = false;
          btnKonfirmasi.textContent = "Konfirmasi Pesan Sekarang";
        }
        sedangKirimPesanan = false;
        return;
      }

      if (btnKonfirmasi) btnKonfirmasi.textContent = "Mengirim pesanan...";

      const payload = {
        nama: nama,
        wa: wa,
        detail: detailPesananAll,
        total: totalAll,
        affiliate: getAffiliate(),
        tanggal_rencana: selectedDate,
        shift: selectedShift,
        antar_ke: selectedAntarKe,
      };

      await kirimKeSheets(payload);

      cartSaveItems([]);
      cartSyncFloatingCartBadge();

      const pesanWA = buildPesanWhatsApp({
        nama,
        detailPesanan: detailPesananAll,
        total: totalAll,
        tanggal: selectedDate,
        shift: selectedShift,
        antarKe: selectedAntarKe,
      });

      window.location.href = buildWhatsAppUrl(pesanWA);
    } catch (err) {
      console.error(API_LOG, "Gagal kirim keranjang:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal menyimpan pesanan. Silakan coba lagi.",
        confirmButtonColor: "#3085d6",
      });

      const btnKonfirmasi = document.getElementById("btn-konfirmasi");
      if (btnKonfirmasi) {
        btnKonfirmasi.disabled = false;
        btnKonfirmasi.textContent = "Konfirmasi Pesan Sekarang";
      }

      sedangKirimPesanan = false;
    }
  });
}

let sedangKirimPesanan = false;

function kirimPesanan() {
  if (sedangKirimPesanan) {
    console.warn(API_LOG, "Pesanan sedang diproses");
    return;
  }

  // === VALIDASI KETAT ===
  const nama = document.getElementById("nama")?.value.trim() || "";
  const wa = document.getElementById("wa")?.value.trim() || "";
  const dateSelect = document.getElementById("delivery-date-select");
  const shiftSelect = document.getElementById("shift-select");
  const antarKeSelect = document.getElementById("antarKe");
  const customAntarKeInput = document.getElementById("customAntarKe");

  const selectedDate = dateSelect ? normalizeDateYMD(dateSelect.value) : "";
  const selectedShift = shiftSelect ? shiftSelect.value.trim() : "";
  let selectedAntarKe = antarKeSelect ? antarKeSelect.value.trim() : "";

  if (selectedAntarKe === "Custom" && customAntarKeInput) {
    selectedAntarKe = customAntarKeInput.value.trim();
  }

  const { total, totalItem } = hitungTotalOrder();
  const detailPesanan = buildDetailPesanan();

  // Validasi: Nama
  if (!nama) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Mohon isi Nama Anda!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: No WA
  if (!wa) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Mohon isi Nomor WhatsApp Anda!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: Minimal 1 produk
  if (totalItem === 0) {
    Swal.fire({
      icon: "warning",
      title: "Pesanan Kosong",
      text: "Silakan pilih minimal 1 produk!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: Tanggal
  if (!selectedDate) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan pilih Tanggal Pengambilan!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: Shift
  if (!selectedShift) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan pilih Shift Pengambilan!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi: Antar Ke
  if (!selectedAntarKe) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan pilih Lokasi Antar!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // Validasi khusus: Jika Custom dipilih tapi input custom kosong
  if (
    antarKeSelect &&
    antarKeSelect.value === "Custom" &&
    (!customAntarKeInput || !customAntarKeInput.value.trim())
  ) {
    Swal.fire({
      icon: "warning",
      title: "Data Belum Lengkap",
      text: "Silakan isi lokasi custom Anda!",
      confirmButtonColor: "#3085d6",
    });
    return;
  }
  // ========================

  Swal.fire({
    title: "Konfirmasi Pesanan",
    text: "Satu langkah lagi! Klik 'Kirim Pesanan' untuk beralih ke WhatsApp dan mencatat pesanan Anda secara resmi.",
    icon: "info",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Kirim Pesanan",
    cancelButtonText: "Batal",
  }).then((result) => {
    if (result.isConfirmed) {
      sedangKirimPesanan = true;
      const orderBtn = document.getElementById("btn-pesan");
      if (orderBtn) {
        orderBtn.disabled = true;
        orderBtn.textContent = "Memeriksa kuota...";
      }

      cekKuotaTanggal(selectedDate)
        .then((kuota) => {
          if (
            !kuota.available ||
            kuota.full ||
            kuota.count >= MAX_ORDER_PER_DAY
          ) {
            Swal.fire({
              icon: "error",
              title: "Kuota Penuh",
              text: "Maaf kuota penuh, silakan pilih tanggal lain!",
              confirmButtonColor: "#3085d6",
            });
            window.datesLoaded = false;
            loadAvailableDates();
            window.datesLoaded = true;
            sedangKirimPesanan = false;
            if (orderBtn) {
              orderBtn.disabled = false;
              orderBtn.textContent = "Pesan Sekarang";
            }
            return;
          }

          if (orderBtn) orderBtn.textContent = "Mengirim pesanan...";

          const payload = {
            nama: nama,
            wa: wa,
            detail: detailPesanan,
            total: total,
            affiliate: getAffiliate(),
            tanggal_rencana: selectedDate,
            shift: selectedShift,
            antar_ke: selectedAntarKe, // Kolom K
          };

          const pesanWA = buildPesanWhatsApp({
            nama,
            detailPesanan,
            total,
            tanggal: selectedDate,
            shift: selectedShift,
            antarKe: selectedAntarKe,
          });

          kirimKeSheets(payload)
            .then(() => {
              window.location.href = buildWhatsAppUrl(pesanWA);
            })
            .catch((err) => {
              sedangKirimPesanan = false;
              console.error(API_LOG, "Gagal kirim ke Sheets:", err);
              Swal.fire({
                icon: "error",
                title: "Gagal",
                text: "Gagal menyimpan pesanan. Silakan coba lagi.",
                confirmButtonColor: "#3085d6",
              });
              if (orderBtn) {
                orderBtn.disabled = false;
                orderBtn.textContent = "Pesan Sekarang";
              }
            });
        })
        .catch((err) => {
          console.error(API_LOG, "cek kuota gagal:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `Gagal memeriksa kuota: ${err.message}`,
            confirmButtonColor: "#3085d6",
          });
          sedangKirimPesanan = false;
          if (orderBtn) {
            orderBtn.disabled = false;
            orderBtn.textContent = "Pesan Sekarang";
          }
        });
    }
  });
}

function initAntarKeListener() {
  const antarKeSelect = document.getElementById("antarKe");
  const boxCustom = document.getElementById("boxCustom");
  const customInput = document.getElementById("customAntarKe");

  if (antarKeSelect) {
    antarKeSelect.addEventListener("change", function () {
      if (this.value === "Custom") {
        if (boxCustom) boxCustom.style.display = "block";
        if (customInput) customInput.setAttribute("required", "true");
      } else {
        if (boxCustom) boxCustom.style.display = "none";
        if (customInput) {
          customInput.removeAttribute("required");
          customInput.value = "";
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  getAffiliate();
  initAntarKeListener();

  ensureFloatingCartExists();
  cartSyncFloatingCartBadge();

  const isCartPage = !!document.getElementById("cart-list");
  if (isCartPage) initCartPage();
  else {
    initProductQuantityControls();
    initProductPageAddToCart();
  }

  const dateSelect = document.getElementById("delivery-date-select");
  const dateWarning = document.getElementById("date-warning");
  const dateSection = document.getElementById("date-section");

  // Initial check for date section visibility
  if (dateSection) {
    if (isCartPage) {
      dateSection.style.display = "block";
    } else {
      const { totalItem } = hitungTotalOrder();
      dateSection.style.display = totalItem > 0 ? "block" : "none";
    }
  }

  // Load available dates and then initialize Flatpickr (only if date input exists)
  if (dateSelect) {
    loadAvailableDatesData().then(({ disabledDates, noDatesAvailable }) => {
      if (noDatesAvailable) {
        if (dateSelect) {
          dateSelect.value = "-- Tidak ada tanggal tersedia --";
          dateSelect.disabled = true;
        }
        return;
      }

      const sekarang = new Date();
      const jamSekarang = sekarang.getHours();

      // Secara default minimal pemesanan adalah besok (H+1)
      let tanggalMinimal = new Date(sekarang.getTime() + 24 * 60 * 60 * 1000);

      // Jika sudah lewat jam 21:00, maka minimal pemesanan adalah lusa (H+2)
      if (jamSekarang >= 21) {
          tanggalMinimal = new Date(sekarang.getTime() + 2 * 24 * 60 * 60 * 1000);
      }

      // Inisialisasi Flatpickr dengan tanggal minimal yang sudah dikalkulasi dengan aman
      flatpickr("#delivery-date-select", {
          dateFormat: "Y-m-d",
          minDate: tanggalMinimal,
          defaultDate: tanggalMinimal,
          allowInput: false,
          clickOpens: true,
          disable: disabledDates,
          onChange: function (selectedDates, dateStr, instance) {
            if (!dateWarning) return;
            if (!dateStr) {
              dateWarning.style.display = "none";
              return;
            }

            cekKuotaTanggal(dateStr)
              .then((kuota) => {
                if (
                  !kuota.available ||
                  kuota.full ||
                  kuota.count >= MAX_ORDER_PER_DAY
                ) {
                  dateWarning.textContent =
                    "⚠️ Kuota tanggal ini sudah penuh. Pilih tanggal lain.";
                  dateWarning.style.display = "block";
                } else {
                  dateWarning.style.display = "none";
                }
              })
              .catch((err) => {
                console.error(API_LOG, "change tanggal gagal:", err);
                dateWarning.textContent = `⚠️ Gagal cek kuota: ${err.message}`;
                dateWarning.style.display = "block";
              });
          }
      });
    });
  }

  apiRequest("debug")
    .then((data) => console.log(API_LOG, "Health check:", data))
    .catch((err) => console.error(API_LOG, "Health check gagal:", err.message));
});
