const API =
  "https://script.google.com/macros/s/AKfycbzUGNUzl_-oalCHrvkl4IOawJO61o84eU79fwnAyVv9kycPDvq4Mwd4OLI6yPqir2yB/exec";
const MAX_ORDER_PER_DAY = 50;
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
]);
const JENDELA_HARI_TAMPIL = 14;

function bolehTampilDiDropdown(dateYMD) {
  if (!dateYMD || dateYMD < TANGGAL_MULAI_BISNIS) return false;
  if (dateYMD === "2026-05-23" || dateYMD === "2026-05-24") return false;
  if (TANGGAL_LIBUR.has(dateYMD)) return false;
  return true;
}

function isTanggalKunciSoldOut(dateYMD) {
  return TANGGAL_KUNCI_SOLD_OUT.has(dateYMD);
}

function isTanggalBolehDipesan(dateYMD) {
  if (!bolehTampilDiDropdown(dateYMD)) return false;
  if (isTanggalKunciSoldOut(dateYMD)) return false;
  return true;
}

function getOpsiLabelTanggal(dateYMD, count) {
  const penuh = isTanggalKunciSoldOut(dateYMD) || count >= MAX_ORDER_PER_DAY;
  return {
    label: penuh ? `${dateYMD} [SOLD OUT]` : dateYMD,
    disabled: penuh,
  };
}
/** Nomor admin: hanya digit, tanpa +, -, atau spasi */
const WA_ADMIN = "628132524282";

const ORDER_IDS = [
  "bangkok",
  "hot-lava",
  "keju",
  "saus-bangkok",
  "saus-hot-lava",
  "chili-oil",
  "kuah-original",
  "kuah-seblak",
  "kuah-keju-creamy",
];
const ORDER_NAMES = [
  "Goreng Saus Bangkok",
  "Goreng Saus Hot Lava",
  "Goreng Saus Keju",
  "Rebus Saus Bangkok",
  "Rebus Saus Hot Lava",
  "Rebus Chili Oil",
  "Rebus Kuah Original",
  "Rebus Kuah Seblak",
  "Rebus Kuah Keju Creamy",
];
const ORDER_PRICES = [8000, 8000, 8000, 7000, 7000, 7000, 10000, 10000, 10000];

function getAffiliate() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) sessionStorage.setItem("affiliate", ref);
  return sessionStorage.getItem("affiliate") || "-";
}

/** Normalisasi tanggal ke string YYYY-MM-DD (timezone lokal browser). */
function normalizeDateYMD(value) {
  if (value == null || value === "") return "";

  const s = String(value).trim();

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const ymd = `${iso[1]}-${iso[2]}-${iso[3]}`;
    if (isValidCalendarDate(ymd)) return ymd;
  }

  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const ymd = `${dmy[3]}-${pad2(dmy[2])}-${pad2(dmy[1])}`;
    if (isValidCalendarDate(ymd)) return ymd;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return formatLocalYMD(parsed);
  }

  console.warn(API_LOG, "normalizeDateYMD gagal parse:", value);
  return "";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatLocalYMD(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isValidCalendarDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
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

  if (!trimmed) {
    throw new Error(`Respons kosong dari Apps Script (action: ${action})`);
  }

  if (trimmed.startsWith("<")) {
    throw new Error(
      `Apps Script mengembalikan HTML, bukan JSON. Cek deployment Web App: Execute as "Me", Who has access "Anyone".`,
    );
  }

  try {
    return JSON.parse(trimmed);
  } catch (parseErr) {
    throw new Error(
      `JSON tidak valid (action: ${action}): ${parseErr.message}. Cuplikan: ${trimmed.slice(0, 180)}`,
    );
  }
}

function apiRequestJsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `gasCb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = buildApiUrl(action, { ...params, callback: callbackName });

    console.log(API_LOG, "JSONP dimulai:", action, url.toString());

    const timeoutMs = 20000;
    const timeoutId = setTimeout(() => {
      cleanup();
      const err = new Error(
        `JSONP timeout setelah ${timeoutMs}ms (action: ${action})`,
      );
      console.error(API_LOG, err.message);
      reject(err);
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = function (data) {
      cleanup();
      console.log(API_LOG, "JSONP respons:", action, data);

      if (!data) {
        reject(new Error(`JSONP respons kosong (action: ${action})`));
        return;
      }
      if (data.error) {
        reject(new Error(String(data.error)));
        return;
      }
      resolve(data);
    };

    const script = document.createElement("script");
    script.src = url.toString();
    script.async = true;
    script.onerror = () => {
      cleanup();
      const err = new Error(
        `JSONP gagal memuat script. URL: ${url.toString()}`,
      );
      console.error(API_LOG, err.message);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

async function apiRequest(action, params = {}) {
  const url = buildApiUrl(action, params);
  console.log(API_LOG, "Fetch dimulai:", action, url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      redirect: "follow",
    });

    const rawText = await response.text();

    console.log(API_LOG, "Fetch respons mentah:", {
      action,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      length: rawText.length,
      preview: rawText.slice(0, 280),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} (action: ${action}): ${rawText.slice(0, 200) || "(tanpa body)"}`,
      );
    }

    const json = parseApiJson(rawText, action);

    if (json.error) {
      console.error(API_LOG, "Server mengembalikan error:", action, json.error);
      throw new Error(String(json.error));
    }

    console.log(API_LOG, "Fetch sukses:", action, json);
    return json;
  } catch (fetchErr) {
    console.warn(
      API_LOG,
      "Fetch gagal, mencoba JSONP:",
      action,
      fetchErr.message,
    );
    return apiRequestJsonp(action, params);
  }
}

function normalizeDateListPayload(json, action) {
  let rows = [];

  if (Array.isArray(json)) {
    rows = json;
  } else if (json && Array.isArray(json.data)) {
    rows = json.data;
  } else if (json && Array.isArray(json.dates)) {
    rows = json.dates;
  } else if (json && typeof json === "object") {
    console.warn(API_LOG, "Struktur tidak dikenal:", action, json);
  }

  return rows
    .map((item) => {
      if (typeof item === "string") {
        return { date: normalizeDateYMD(item), count: 0 };
      }
      if (item && typeof item === "object") {
        const rawDate = item.date || item.tanggal || item.label || "";
        return {
          date: normalizeDateYMD(rawDate),
          count: Number.parseInt(item.count, 10) || 0,
        };
      }
      return { date: "", count: 0 };
    })
    .filter((item) => item.date);
}

async function cekKuotaTanggal(tanggal) {
  const dateYMD = normalizeDateYMD(tanggal);

  if (!dateYMD) {
    const err = new Error(
      `Format tanggal tidak valid: "${tanggal}". Harus YYYY-MM-DD.`,
    );
    console.error(API_LOG, "cekKuotaTanggal:", err.message);
    throw err;
  }

  if (!isTanggalBolehDipesan(dateYMD)) {
    console.log(
      API_LOG,
      "cekKuotaTanggal: tanggal tidak boleh dipesan",
      dateYMD,
    );
    return {
      date: dateYMD,
      count: MAX_ORDER_PER_DAY,
      max: MAX_ORDER_PER_DAY,
      available: false,
      full: true,
    };
  }

  console.log(API_LOG, "cekKuotaTanggal →", dateYMD);

  try {
    const json = await apiRequest("checkQuota", { date: dateYMD });

    const count = Number.parseInt(json.count, 10) || 0;
    const max = Number.parseInt(json.max, 10) || MAX_ORDER_PER_DAY;
    const available =
      json.available === true || (json.full !== true && count < max);

    const result = {
      date: json.date ? normalizeDateYMD(json.date) : dateYMD,
      count,
      max,
      available,
      full: json.full === true || count >= max,
    };

    console.log(API_LOG, "cekKuotaTanggal hasil:", result);
    return result;
  } catch (err) {
    console.error(API_LOG, "cekKuotaTanggal gagal:", {
      input: tanggal,
      normalized: dateYMD,
      message: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

async function loadAvailableDates() {
  const dateSelect = document.getElementById("delivery-date-select");
  if (!dateSelect) {
    console.warn(
      API_LOG,
      "loadAvailableDates: #delivery-date-select tidak ada",
    );
    return;
  }

  dateSelect.options.length = 0;
  dateSelect.add(new Option("⏳ Memuat tanggal...", ""));
  dateSelect.disabled = true;

  try {
    const json = await apiRequest("getAvailableDates");
    const dates = normalizeDateListPayload(json, "getAvailableDates");

    console.log(API_LOG, "loadAvailableDates ternormalisasi:", dates);

    if (dates.length === 0) {
      dateSelect.options.length = 0;
      dateSelect.add(
        new Option("-- Tidak ada tanggal tersedia (data kosong) --", ""),
      );
      dateSelect.disabled = true;
      console.warn(
        API_LOG,
        "loadAvailableDates: array kosong setelah normalisasi",
        json,
      );
      return;
    }

    dateSelect.options.length = 0;
    dateSelect.add(new Option("-- Pilih tanggal pengambilan --", ""));

    dates.forEach(({ date, count }) => {
      const dateYMD = normalizeDateYMD(date);
      if (!dateYMD || !bolehTampilDiDropdown(dateYMD)) return;

      const { label, disabled } = getOpsiLabelTanggal(dateYMD, count);
      const opt = new Option(label, dateYMD);
      if (disabled) opt.disabled = true;
      dateSelect.add(opt);
    });

    dateSelect.disabled = false;
    console.log(API_LOG, "loadAvailableDates sukses:", dates.length, "opsi");
  } catch (err) {
    console.error(API_LOG, "loadAvailableDates gagal:", {
      message: err.message,
      stack: err.stack,
    });
    dateSelect.options.length = 0;
    dateSelect.add(new Option(`-- Gagal memuat: ${err.message} --`, ""));
    dateSelect.disabled = true;
    window.datesLoaded = false;
  }
}

/** Hanya nama produk + jumlah — untuk kolom Detail Pesanan di Sheets. */
function buildDetailPesanan() {
  const lines = [];

  for (let i = 0; i < ORDER_IDS.length; i++) {
    const qty = parseInt(document.getElementById(ORDER_IDS[i])?.value, 10) || 0;
    if (qty > 0) {
      lines.push(`Mini Wonton ${ORDER_NAMES[i]} (${qty})`);
    }
  }

  return lines.join("\n").trim();
}

function hitungTotalOrder() {
  let total = 0;
  let totalItem = 0;

  for (let i = 0; i < ORDER_IDS.length; i++) {
    const val = parseInt(document.getElementById(ORDER_IDS[i])?.value, 10) || 0;
    total += val * ORDER_PRICES[i];
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
      if (!window.datesLoaded) {
        loadAvailableDates();
        window.datesLoaded = true;
      }
    } else {
      dateSection.style.display = "none";
      window.datesLoaded = false;
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

function buildPesanWhatsApp({ nama, detailPesanan, total, tanggal, shift }) {
  return (
    `Halo Minna,\n` +
    `Nama: ${nama}\n\n` +
    `Saya ingin memesan:\n${detailPesanan}\n\n` +
    `Tanggal pengambilan: ${tanggal}\n` +
    `Shift: ${shift}\n` +
    `Total: Rp ${total.toLocaleString("id-ID")}\n\n` +
    `Saya ingin memesan varian produk tersebut. Aku tunggu produknya ya!!`
  );
}

/** Nomor WA internasional — hanya angka (buang +, spasi, strip). */
function getNomorAdminWa() {
  return String(WA_ADMIN).replace(/\D/g, "");
}

/** Link wa.me tanpa pesan — untuk kontak / chat kosong. */
function buildWhatsAppUrlDasar() {
  return "https://wa.me/" + getNomorAdminWa();
}

/**
 * Link wa.me modern — HANYA domain wa.me, tanpa whatsapp.com.
 * Dengan pesan: https://wa.me/NOMOR?text=encodeURIComponent(pesan)
 * Tanpa pesan: https://wa.me/NOMOR
 */
function buildWhatsAppUrl(isiPesan) {
  const dasar = buildWhatsAppUrlDasar();
  const pesan =
    isiPesan == null || isiPesan === undefined ? "" : String(isiPesan).trim();
  if (!pesan) return dasar;
  return dasar + "?text=" + encodeURIComponent(pesan);
}

/** Buka WA di tab yang sama — tidak memicu blokir pop-up Chrome. */
function navigasiKeWhatsApp(url) {
  window.location.href = url;
  return true;
}

function bukaWhatsApp(isiPesan) {
  const urlAman = buildWhatsAppUrl(isiPesan);
  console.log(API_LOG, "WhatsApp:", urlAman.length, "karakter URL");
  if (urlAman.length > 8000) {
    console.warn(
      API_LOG,
      "URL terlalu panjang — pertimbangkan pesan lebih singkat",
    );
  }
  return navigasiKeWhatsApp(urlAman);
}

/** Kirim ke Google Sheets — selesai dulu sebelum pindah ke wa.me */
async function kirimKeSheets(payload) {
  const body = JSON.stringify(payload);
  console.log(API_LOG, "POST pesanan (detail pure):", payload);

  if (navigator.sendBeacon) {
    const terkirim = navigator.sendBeacon(
      API,
      new Blob([body], { type: "text/plain;charset=utf-8" }),
    );
    if (terkirim) {
      console.log(API_LOG, "POST Sheets via sendBeacon OK");
      return;
    }
  }

  await fetch(API, {
    method: "POST",
    mode: "no-cors",
    keepalive: true,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
  });
  console.log(API_LOG, "POST Sheets via fetch (keepalive) selesai");
}

let sedangKirimPesanan = false;

async function kirimPesanan() {
  if (sedangKirimPesanan) {
    console.warn(API_LOG, "Pesanan sedang diproses — abaikan klik ganda");
    return;
  }

  const nama = document.getElementById("nama").value.trim();
  const wa = document.getElementById("wa").value.trim();

  if (!nama || !wa) {
    alert("Nama dan No WhatsApp wajib diisi!");
    return;
  }

  const detailPesanan = buildDetailPesanan();
  const { total, totalItem } = hitungTotalOrder();

  if (totalItem === 0 || !detailPesanan) {
    alert("Pilih minimal 1 produk dulu!");
    return;
  }

  const dateSelect = document.getElementById("delivery-date-select");
  const shiftSelect = document.getElementById("shift-select");
  const selectedDate = normalizeDateYMD(dateSelect?.value);
  const selectedShift = shiftSelect?.value?.trim();
  const orderBtn = document.querySelector(".order-btn");

  if (!selectedDate) {
    alert("Silakan pilih tanggal pengambilan (format YYYY-MM-DD)!");
    console.error(API_LOG, "kirimPesanan: tanggal invalid", dateSelect?.value);
    return;
  }

  if (!isTanggalBolehDipesan(selectedDate)) {
    alert(
      "Tanggal ini tidak tersedia untuk pemesanan online. Silakan pilih tanggal lain atau hubungi admin untuk penjualan langsung.",
    );
    return;
  }

  if (!selectedShift) {
    alert("Silakan pilih shift pengambilan!");
    return;
  }

  if (orderBtn) {
    orderBtn.disabled = true;
    orderBtn.textContent = "Memeriksa kuota...";
  }

  let kuotaLolos = false;

  try {
    const kuota = await cekKuotaTanggal(selectedDate);
    if (!kuota.available || kuota.full || kuota.count >= MAX_ORDER_PER_DAY) {
      alert("Maaf kuota penuh, silakan pilih tanggal lain!");
      window.datesLoaded = false;
      await loadAvailableDates();
      window.datesLoaded = true;
      return;
    }
    kuotaLolos = true;
  } catch (err) {
    console.error(API_LOG, "kirimPesanan cek kuota gagal:", err);
    alert(
      `Gagal memeriksa kuota: ${err.message}\nBuka Console (F12) untuk detail.`,
    );
    return;
  } finally {
    if (!kuotaLolos && orderBtn) {
      orderBtn.disabled = false;
      orderBtn.textContent = "Pesan Sekarang";
    }
  }

  sedangKirimPesanan = true;

  if (orderBtn) {
    orderBtn.disabled = true;
    orderBtn.textContent = "Mengirim pesanan...";
  }

  const payload = {
    nama,
    wa,
    detail: detailPesanan,
    total,
    affiliate: getAffiliate(),
    tanggal_rencana: selectedDate,
    shift: selectedShift,
  };

  const pesanWA = buildPesanWhatsApp({
    nama,
    detailPesanan,
    total,
    tanggal: selectedDate,
    shift: selectedShift,
  });

  try {
    await kirimKeSheets(payload);
    window.location.href = buildWhatsAppUrl(pesanWA);
  } catch (err) {
    sedangKirimPesanan = false;
    console.error(API_LOG, "Gagal kirim ke Sheets:", err);
    alert("Gagal menyimpan pesanan. Silakan coba lagi.");
    if (orderBtn) {
      orderBtn.disabled = false;
      orderBtn.textContent = "Pesan Sekarang";
    }
  }
}

/**
 * Tombol dengan data-wa-pesan (bukan link kontak statis).
 * Link kontak pakai href wa.me langsung di HTML — tanpa ?text=
 */
function initWhatsAppTombol() {
  document.querySelectorAll("[data-wa-pesan]").forEach(function (el) {
    if (el.dataset.waBound === "1") return;
    const isiPesan = (el.getAttribute("data-wa-pesan") || "").trim();
    if (!isiPesan) return;

    el.dataset.waBound = "1";
    el.addEventListener("click", function (e) {
      e.preventDefault();
      bukaWhatsApp(isiPesan);
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  getAffiliate();
  initWhatsAppTombol();

  const btnPesan = document.getElementById("btn-pesan");
  if (btnPesan) {
    btnPesan.addEventListener("click", function (e) {
      e.preventDefault();
      kirimPesanan();
    });
  }

  const dateSelect = document.getElementById("delivery-date-select");
  const dateWarning = document.getElementById("date-warning");

  console.log(API_LOG, "Siap. Endpoint:", API);

  apiRequest("debug")
    .then((data) => console.log(API_LOG, "Health check (debug):", data))
    .catch((err) =>
      console.error(
        API_LOG,
        "Health check gagal — cek URL deploy:",
        err.message,
      ),
    );

  if (dateSelect && dateWarning) {
    dateSelect.addEventListener("change", async function () {
      if (!this.value) {
        dateWarning.style.display = "none";
        return;
      }

      try {
        const kuota = await cekKuotaTanggal(this.value);
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
      } catch (err) {
        console.error(API_LOG, "change tanggal gagal:", err);
        dateWarning.textContent = `⚠️ Gagal cek kuota: ${err.message}`;
        dateWarning.style.display = "block";
      }
    });
  }
});
