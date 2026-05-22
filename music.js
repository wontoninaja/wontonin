// Musik latar — path relatif (case-sensitive di hosting)
(function () {
  const AUDIO_SRC = "./Wontonin_Makin_Enak.mp3";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Musik latar");
  btn.innerHTML = "🔇";
  btn.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:55px;height:55px;border-radius:50%;" +
    "background:#ff6600;border:none;color:#fff;font-size:28px;cursor:pointer;" +
    "z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.3);";
  document.body.appendChild(btn);

  const audio = new Audio(AUDIO_SRC);
  audio.loop = true;
  audio.volume = 0.5;
  audio.preload = "auto";

  let isPlaying = false;

  audio.addEventListener("canplaythrough", function () {
    console.log("[Music] Audio siap:", AUDIO_SRC);
  });

  audio.addEventListener("error", function () {
    console.error(
      "[Music] Gagal memuat file. Pastikan ada di root proyek:",
      AUDIO_SRC,
    );
    btn.style.backgroundColor = "#cc0000";
    btn.innerHTML = "⚠️";
  });

  function setPlaying(playing) {
    isPlaying = playing;
    btn.innerHTML = playing ? "🎵" : "🔇";
    btn.style.backgroundColor = "#ff6600";
  }

  function playMusic() {
    btn.innerHTML = "⏳";
    return audio
      .play()
      .then(function () {
        setPlaying(true);
        console.log("[Music] Diputar:", AUDIO_SRC);
      })
      .catch(function (err) {
        console.warn("[Music] Autoplay diblokir — klik tombol untuk memutar:", err);
        setPlaying(false);
      });
  }

  function pauseMusic() {
    audio.pause();
    setPlaying(false);
    console.log("[Music] Di-pause");
  }

  btn.addEventListener("click", function () {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  });

  playMusic();
})();
