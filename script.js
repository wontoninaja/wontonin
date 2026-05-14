const scriptURL = "https://script.google.com/macros/s/AKfycbzGHeia4YvS_nn2ID9ZPiMX18qOFacUZUiXVvu8QFH7wiCMtMC7yVN_9stkfI-di0iU/exec";

function getAffiliate() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  
  if (ref) {
    sessionStorage.setItem("affiliate", ref);
  }
  
  return sessionStorage.getItem("affiliate") || "-";
}

function hitungTotal() {

  const bangkok = document.getElementById("bangkok").value;
  const hotLava = document.getElementById("hot-lava").value;
  const keju = document.getElementById("keju").value;
  const chiliOil = document.getElementById("chili-oil").value;
  const kuahOriginal = document.getElementById("kuah-original").value;
  const kuahSeblak = document.getElementById("kuah-seblak").value;
  const kuahKejuCreamy = document.getElementById("kuah-keju-creamy").value;

  let total = 0;

  total += bangkok * 9000;
  total += hotLava * 9000;
  total += keju * 9000;
  total += chiliOil * 7000;
  total += kuahOriginal * 10000;
  total += kuahSeblak * 10000;
  total += kuahKejuCreamy * 10000;

  document.getElementById("total").innerText =
    total.toLocaleString("id-ID");
}

function tambah(id){

  let input =
  document.getElementById(id);

  input.value =
  parseInt(input.value) + 1;

  hitungTotal();

}

function kurang(id){

  let input =
  document.getElementById(id);

  if(input.value > 0){

    input.value =
    parseInt(input.value) - 1;

  }

  hitungTotal();

}

function kirimPesanan() {

  const nama = document.getElementById("nama").value.trim();
  const wa = document.getElementById("wa").value.trim();

  const bangkok = parseInt(document.getElementById("bangkok").value) || 0;
  const hotLava = parseInt(document.getElementById("hot-lava").value) || 0;
  const keju = parseInt(document.getElementById("keju").value) || 0;
  const chiliOil = parseInt(document.getElementById("chili-oil").value) || 0;
  const kuahOriginal = parseInt(document.getElementById("kuah-original").value) || 0;
  const kuahSeblak = parseInt(document.getElementById("kuah-seblak").value) || 0;
  const kuahKejuCreamy = parseInt(document.getElementById("kuah-keju-creamy").value) || 0;

  // VALIDASI: nama & wa wajib diisi
  if (!nama || !wa) {
    alert("Nama dan No WhatsApp wajib diisi!");
    return;
  }

  // VALIDASI: minimal 1 item dipesan
  const totalItem = bangkok + hotLava + keju + chiliOil + kuahOriginal + kuahSeblak + kuahKejuCreamy;
  if (totalItem === 0) {
    alert("Pilih minimal 1 produk dulu!");
    return;
  }

  let detail = "";
  let total = 0;

  if (bangkok > 0) {
    detail += `Mini Wonton Goreng Saus Bangkok (${bangkok})\n`;
    total += bangkok * 9000;
  }

  if (hotLava > 0) {
    detail += `Mini Wonton Goreng Saus Hot Lava (${hotLava})\n`;
    total += hotLava * 9000;
  }

  if (keju > 0) {
    detail += `Mini Wonton Goreng Saus Keju (${keju})\n`;
    total += keju * 9000;
  }

  if (chiliOil > 0) {
    detail += `Mini Wonton Rebus Chili Oil (${chiliOil})\n`;
    total += chiliOil * 7000;
  }

  if (kuahOriginal > 0) {
    detail += `Mini Wonton Rebus Kuah Original (${kuahOriginal})\n`;
    total += kuahOriginal * 10000;
  }

  if (kuahSeblak > 0) {
    detail += `Mini Wonton Rebus Kuah Seblak (${kuahSeblak})\n`;
    total += kuahSeblak * 10000;
  }

  if (kuahKejuCreamy > 0) {
    detail += `Mini Wonton Rebus Kuah Keju Creamy (${kuahKejuCreamy})\n`;
    total += kuahKejuCreamy * 10000;
  }

  const affiliate = getAffiliate();

  fetch(scriptURL, {
    method: "POST",
    body: JSON.stringify({
      nama,
      wa,
      detail,
      total,
      affiliate
    })
  });

  const pesanWA =
`Halo Admin,
Nama Saya ${nama}

Saya ingin memesan:
${detail}

Total: Rp ${total.toLocaleString("id-ID")}

Saya ingin melakukan pembayaran. Tolong kirimkan Qris-nya ya`;

  window.open(
    "https://wa.me/628889976983?text=" +
    encodeURIComponent(pesanWA)
  );

}