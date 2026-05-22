/**
 * Musik latar — kompatibel Vercel (path case-sensitive, autoplay via interaksi user)
 */
(function () {
  const AUDIO_FILENAME = "Wontonin_Makin_Enak.mp3";
  const BTN_ID = "btn-music-wontonin";

  function resolveAudioSrc() {
    const tag = document.querySelector('script[src*="music.js"]');
    if (tag && tag.getAttribute("src")) {
      try {
        return new URL(AUDIO_FILENAME, tag.src).href;
      } catch (err) {
        console.warn("[Music] resolve URL gagal, fallback ./", err);
      }
    }
    return "./" + AUDIO_FILENAME;
  }

  function initMusicPlayer() {
    if (!document.body) {
      console.error("[Music] document.body belum ada");
      return;
    }

    if (document.getElementById(BTN_ID)) {
      return;
    }

    const audioSrc = resolveAudioSrc();

    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.setAttribute("aria-label", "Musik latar");
    btn.innerHTML = "🔇";
    btn.style.cssText =
      "position:fixed;bottom:20px;right:20px;width:55px;height:55px;" +
      "border-radius:50%;background:#ff6600;border:none;color:#fff;" +
      "font-size:28px;cursor:pointer;z-index:99999;" +
      "box-shadow:0 2px 10px rgba(0,0,0,0.35);pointer-events:auto;";

    document.body.appendChild(btn);
    console.log("[Music] Tombol ditambahkan ke body");

    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";

    let isPlaying = false;
    let userInteracted = false;

    audio.addEventListener("canplaythrough", function () {
      console.log("[Music] File siap:", audioSrc);
    });

    audio.addEventListener("error", function () {
      console.error(
        "[Music] Gagal memuat audio. Pastikan file ada di root deploy:",
        audioSrc,
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
          console.log("[Music] Diputar");
        })
        .catch(function (err) {
          console.warn("[Music] play() ditolak browser:", err.message);
          setPlaying(false);
        });
    }

    function pauseMusic() {
      audio.pause();
      setPlaying(false);
    }

    function onUserActivate() {
      userInteracted = true;
      if (!isPlaying) {
        playMusic();
      }
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      userInteracted = true;
      if (isPlaying) {
        pauseMusic();
      } else {
        playMusic();
      }
    });

    document.addEventListener(
      "pointerdown",
      function () {
        if (!userInteracted) {
          onUserActivate();
        }
      },
      { once: true, passive: true },
    );

    document.addEventListener(
      "touchstart",
      function () {
        if (!userInteracted) {
          onUserActivate();
        }
      },
      { once: true, passive: true },
    );

    document.addEventListener(
      "click",
      function () {
        if (!userInteracted) {
          onUserActivate();
        }
      },
      { once: true, passive: true },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMusicPlayer);
  } else {
    initMusicPlayer();
  }
})();
