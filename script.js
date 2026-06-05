const API = "https://script.google.com/macros/s/AKfycbzUGNUzl_-oalCHrvkl4IOawJO61o84eU79fwnAyVv9kycPDvq4Mwd4OLI6yPqir2yB/exec";
const MAX_ORDER_PER_DAY = 70;
const API_LOG = "[MiniWonton API]";

/** Aturan tanggal bisnis (dropdown & validasi order web) */
const TANGGAL_MULAI_BISNIS = "2026-05-25";
const TANGGAL_LIBUR = new Set([
  "2026-05-28", "2026-05-31", "2026-06-01", "2026-06-07", "2026-06-14",
  "2026-06-21", "2026-06-28", "2026-07-05", "2026-07-12", "2026-07-19",
  "2026-07-26", "2026-08-02", "2026-08-09",
]);
const TANGGAL_KUNCI_SOLD_OUT = new Set([
  "2026-05-25", "2026-05-26", "2026-05-27", "2026-05-29", "2026-05-30", "2026-06-02",
  "2026-06-03",
]);
const JENDELA_HARI_TAMPIL = 14;

/** Data produk (id, nama, harga) */
const MAIN_ORDER_IDS = ["bangkok", "hot-lava", "keju", "saus-bangkok", "saus-hot-lava", "chili-oil", "kuah-original", "kuah-seblak", "kuah-keju-creamy"];
const MAIN_ORDER_NAMES = [
  "Goreng Saus Bangkok", "Goreng Saus Hot Lava", "Goreng Saus Keju",
  "Rebus Saus Bangkok", "Rebus Saus Hot Lava", "Rebus Chili Oil",
  "Rebus Kuah Original", "Rebus Kuah Seblak", "Rebus Kuah Keju Creamy"
];
const MAIN_ORDER_PRICES = [8000, 8000, 8000, 7000, 7000, 7000, 10000, 10000, 10000];

// Data add-on
const ADDON_IDS = ["sambal-bangkok", "lava", "chili", "original", "seblak"];
const ADDON_NAMES = ["Sambal Bangkok", "Sambal Hot Lava", "Chili Oil", "Kuah Original", "Kuah Seblak"];
const ADDON_PRICES = [1500, 1500, 1500, 2500, 2500];

/** Nomor admin */
const WA_ADMIN = "628132524282";

/** Helper functions */
function pad2(n) { return String(n).padStart(2, "0"); }

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
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
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
  if (!trimmed) throw new Error(`Respons kosong dari Apps Script (action: ${action})`);
  if (trimmed.startsWith("<")) {
    throw new Error(`Apps Script mengembalikan HTML, bukan JSON. Cek deployment Web App.`);
  }
  try {
    return JSON.parse(trimmed);
  } catch (parseErr) {
    throw new Error(`JSON tidak valid (action: ${action}): ${parseErr.message}`);
  }
}

function apiRequestJsonp(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `gasCb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const url = buildApiUrl(action, { ...params, callback: callbackName });
    const timeoutMs = 20000;
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`JSONP timeout setelah ${timeoutMs}ms (action: ${action})`));
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
    const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const rawText = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${rawText.slice(0, 200)}`);
    const json = parseApiJson(rawText, action);
    if (json.error) throw new Error(String(json.error));
    return json;
  } catch (fetchErr) {
    console.warn(API_LOG, "Fetch gagal, mencoba JSONP:", fetchErr.message);
    return apiRequestJsonp(action, params);
  }
}

function buildDetailPesanan() {
  const lines = [];
  
  // Proses produk utama (Mini Wonton)
  for (let i = 0; i < MAIN_ORDER_IDS.length; i++) {
    const qty = parseInt(document.getElementById(MAIN_ORDER_IDS[i])?.value, 10) || 0;
    if (qty > 0) lines.push(`Mini Wonton ${MAIN_ORDER_NAMES[i]} (${qty})`);
  }
  
  // Proses add-on
  for (let i = 0; i < ADDON_IDS.length; i++) {
    const qty = parseInt(document.getElementById(ADDON_IDS[i])?.value, 10) || 0;
    if (qty > 0) lines.push(`Add On ${ADDON_NAMES[i]} (${qty})`);
  }
  
  return lines.join("\n").trim();
}

function hitungTotalOrder() {
  let total = 0, totalItem = 0;
  
  // Hitung produk utama
  for (let i = 0; i < MAIN_ORDER_IDS.length; i++) {
    const val = parseInt(document.getElementById(MAIN_ORDER_IDS[i])?.value, 10) || 0;
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

function getOpsiLabelTanggal(dateYMD, count) {
  const penuh = isTanggalKunciSoldOut(dateYMD) || count >= MAX_ORDER_PER_DAY;
  return { label: penuh ? `${dateYMD} [SOLD OUT]` : dateYMD, disabled: penuh };
}

async function cekKuotaTanggal(tanggal) {
  const dateYMD = normalizeDateYMD(tanggal);
  if (!dateYMD) throw new Error(`Format tanggal tidak valid: "${tanggal}"`);
  if (!bolehTampilDiDropdown(dateYMD)) {
    return { date: dateYMD, count: MAX_ORDER_PER_DAY, max: MAX_ORDER_PER_DAY, available: false, full: true };
  }
  try {
    const json = await apiRequest("checkQuota", { date: dateYMD });
    const count = Number.parseInt(json.count, 10) || 0;
    const max = Number.parseInt(json.max, 10) || MAX_ORDER_PER_DAY;
    const available = json.available === true || (json.full !== true && count < max);
    return { date: dateYMD, count, max, available, full: json.full === true || count >= max };
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
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowYMD = formatLocalYMD(tomorrow);

    dates.forEach(({ date, count }) => {
      const dateYMD = normalizeDateYMD(date);
      if (!dateYMD || !bolehTampilDiDropdown(dateYMD)) return;
      let { label, disabled } = getOpsiLabelTanggal(dateYMD, count);
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

function buildPesanWhatsApp({ nama, detailPesanan, total, tanggal, shift, antarKe }) {
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
    Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Mohon isi Nama Anda!", confirmButtonColor: "#3085d6" });
    return;
  }
  // Validasi: No WA
  if (!wa) {
    Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Mohon isi Nomor WhatsApp Anda!", confirmButtonColor: "#3085d6" });
    return;
  }
  // Validasi: Minimal 1 produk
  if (totalItem === 0) {
    Swal.fire({ icon: "warning", title: "Pesanan Kosong", text: "Silakan pilih minimal 1 produk!", confirmButtonColor: "#3085d6" });
    return;
  }
  // Validasi: Tanggal
  if (!selectedDate) {
    Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Silakan pilih Tanggal Pengambilan!", confirmButtonColor: "#3085d6" });
    return;
  }
  // Validasi: Shift
  if (!selectedShift) {
    Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Silakan pilih Shift Pengambilan!", confirmButtonColor: "#3085d6" });
    return;
  }
  // Validasi: Antar Ke
  if (!selectedAntarKe) {
    Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Silakan pilih Lokasi Antar!", confirmButtonColor: "#3085d6" });
    return;
  }
  // Validasi khusus: Jika Custom dipilih tapi input custom kosong
  if (antarKeSelect && antarKeSelect.value === "Custom" && (!customAntarKeInput || !customAntarKeInput.value.trim())) {
    Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Silakan isi lokasi custom Anda!", confirmButtonColor: "#3085d6" });
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
        .then(kuota => {
          if (!kuota.available || kuota.full || kuota.count >= MAX_ORDER_PER_DAY) {
            Swal.fire({ icon: "error", title: "Kuota Penuh", text: "Maaf kuota penuh, silakan pilih tanggal lain!", confirmButtonColor: "#3085d6" });
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
            antar_ke: selectedAntarKe,  // Kolom K
          };

          const pesanWA = buildPesanWhatsApp({
            nama, detailPesanan, total, tanggal: selectedDate, shift: selectedShift, antarKe: selectedAntarKe,
          });

          kirimKeSheets(payload)
            .then(() => {
              window.location.href = buildWhatsAppUrl(pesanWA);
            })
            .catch((err) => {
              sedangKirimPesanan = false;
              console.error(API_LOG, "Gagal kirim ke Sheets:", err);
              Swal.fire({ icon: "error", title: "Gagal", text: "Gagal menyimpan pesanan. Silakan coba lagi.", confirmButtonColor: "#3085d6" });
              if (orderBtn) {
                orderBtn.disabled = false;
                orderBtn.textContent = "Pesan Sekarang";
              }
            });
        })
        .catch(err => {
          console.error(API_LOG, "cek kuota gagal:", err);
          Swal.fire({ icon: "error", title: "Error", text: `Gagal memeriksa kuota: ${err.message}`, confirmButtonColor: "#3085d6" });
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
    antarKeSelect.addEventListener("change", function() {
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

  const btnPesan = document.getElementById("btn-pesan");
  if (btnPesan) btnPesan.addEventListener("click", (e) => { e.preventDefault(); kirimPesanan(); });

  const dateSelect = document.getElementById("delivery-date-select");
  const dateWarning = document.getElementById("date-warning");

  // Initial check for date section visibility
  const { totalItem } = hitungTotalOrder();
  const dateSection = document.getElementById("date-section");
  if (dateSection) {
    if (totalItem > 0) {
      dateSection.style.display = "block";
    } else {
      dateSection.style.display = "none";
    }
  }

  // Load available dates and then initialize Flatpickr
  loadAvailableDatesData().then(({ disabledDates, noDatesAvailable }) => {
    if (noDatesAvailable) {
      if (dateSelect) {
        dateSelect.value = "-- Tidak ada tanggal tersedia --";
        dateSelect.disabled = true;
      }
      return;
    }

    flatpickr("#delivery-date-select", {
      dateFormat: "Y-m-d",
      minDate: "today",
      allowInput: true,
      clickOpens: true,
      disable: disabledDates, // Use the dynamically determined disabled dates
      onChange: function(selectedDates, dateStr, instance) {
        if (!dateStr) { dateWarning.style.display = "none"; return; }
        cekKuotaTanggal(dateStr)
          .then(kuota => {
            if (!kuota.available || kuota.full || kuota.count >= MAX_ORDER_PER_DAY) {
              dateWarning.textContent = "⚠️ Kuota tanggal ini sudah penuh. Pilih tanggal lain.";
              dateWarning.style.display = "block";
            } else {
              dateWarning.style.display = "none";
            }
          })
          .catch(err => {
            console.error(API_LOG, "change tanggal gagal:", err);
            dateWarning.textContent = `⚠️ Gagal cek kuota: ${err.message}`;
            dateWarning.style.display = "block";
          });
      }
    });
  });

  apiRequest("debug").then((data) => console.log(API_LOG, "Health check:", data)).catch((err) => console.error(API_LOG, "Health check gagal:", err.message));
});