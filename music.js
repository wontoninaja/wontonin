// music.js - Lagu continues antar halaman (FIX HP)

(function () {
    const MUSIC_SRC = 'Wontonin_Makin_Enak.mp3';
    const STORAGE_KEY = 'wontonin_music_time';
    const PLAYING_KEY = 'wontonin_music_playing';

    // Deteksi apakah di mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Ambil posisi terakhir
    const savedTime = parseFloat(sessionStorage.getItem(STORAGE_KEY) || '0');
    const wasPlaying = sessionStorage.getItem(PLAYING_KEY) !== 'false';

    // Buat audio element
    const audio = new Audio();
    audio.src = MUSIC_SRC;
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';

    if (savedTime > 0 && !isNaN(savedTime)) {
        audio.currentTime = savedTime;
    }

    console.log('Music loaded, isMobile:', isMobile);

    // Simpan posisi setiap detik
    let saveInterval = setInterval(() => {
        if (!audio.paused && !isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
            sessionStorage.setItem(STORAGE_KEY, audio.currentTime);
            sessionStorage.setItem(PLAYING_KEY, 'true');
        }
    }, 1000);

    // Simpan posisi sebelum pindah halaman
    window.addEventListener('beforeunload', () => {
        if (!audio.paused && !isNaN(audio.currentTime)) {
            sessionStorage.setItem(STORAGE_KEY, audio.currentTime);
        }
        sessionStorage.setItem(PLAYING_KEY, !audio.paused ? 'true' : 'false');
        clearInterval(saveInterval);
    });

    // Buat tombol musik (pojok kanan bawah)
    const btn = document.createElement('div');
    btn.id = 'music-btn';
    btn.innerHTML = '🎵';
    
    // Tombol lebih besar di HP
    const btnSize = isMobile ? '56px' : '48px';
    const fontSize = isMobile ? '24px' : '20px';
    
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: ${btnSize};
        height: ${btnSize};
        border-radius: 50%;
        background: rgba(0,0,0,0.8);
        border: 2px solid #ff6600;
        color: white;
        font-size: ${fontSize};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        transition: all 0.3s;
        box-shadow: 0 0 15px rgba(255,102,0,0.5);
        user-select: none;
        backdrop-filter: blur(4px);
    `;

    // Animasi berkedip untuk HP (biar user tahu harus diklik)
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 15px rgba(255,102,0,0.5); }
            50% { transform: scale(1.1); box-shadow: 0 0 25px rgba(255,102,0,0.9); }
            100% { transform: scale(1); box-shadow: 0 0 15px rgba(255,102,0,0.5); }
        }
        #music-btn.playing {
            animation: spin 3s linear infinite;
            border-color: #ff6600;
            box-shadow: 0 0 20px rgba(255,102,0,0.7);
        }
        #music-btn.pulse {
            animation: pulse 1s ease infinite;
        }
        #music-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 0 25px rgba(255,102,0,0.8);
        }
        #music-btn.playing:hover {
            animation: spin 3s linear infinite;
            transform: scale(1.1);
        }
    `;
    document.head.appendChild(style);

    function updateBtn(playing) {
        btn.innerHTML = playing ? '🎵' : '🔇';
        if (playing) {
            btn.classList.add('playing');
            btn.classList.remove('pulse');
        } else {
            btn.classList.remove('playing');
            // Di HP, tambahkan animasi berkedip biar user tahu harus klik
            if (isMobile && !playing) {
                btn.classList.add('pulse');
            }
        }
    }

    // Fungsi untuk memutar musik
    function startMusic() {
        if (savedTime > 0 && !isNaN(savedTime) && savedTime < audio.duration) {
            audio.currentTime = savedTime;
        }
        return audio.play();
    }

    // Tombol musik
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            startMusic().then(() => {
                updateBtn(true);
                sessionStorage.setItem(PLAYING_KEY, 'true');
                console.log('Music started by button');
            }).catch((err) => {
                console.error('Play failed:', err);
            });
        } else {
            audio.pause();
            updateBtn(false);
            sessionStorage.setItem(PLAYING_KEY, 'false');
        }
    });

    document.body.appendChild(btn);

    // Coba autoplay (hanya berhasil di laptop)
    if (wasPlaying) {
        startMusic().then(() => {
            updateBtn(true);
            console.log('Autoplay success');
        }).catch(() => {
            console.log('Autoplay blocked, waiting for button click');
            updateBtn(false);
        });
    } else {
        updateBtn(false);
    }
    
    // TAMPILKAN PESAN SINGKAT DI HP (hanya sekali)
    if (isMobile && !sessionStorage.getItem('music_tip_shown')) {
        setTimeout(() => {
            const tip = document.createElement('div');
            tip.innerHTML = '🔊 Klik tombol musik di pojok kanan bawah untuk memutar lagu';
            tip.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 20px;
                background: rgba(0,0,0,0.8);
                color: #ffaa66;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 12px;
                z-index: 9998;
                border: 1px solid #ff6600;
                pointer-events: none;
                white-space: nowrap;
                font-family: sans-serif;
            `;
            document.body.appendChild(tip);
            setTimeout(() => tip.remove(), 4000);
            sessionStorage.setItem('music_tip_shown', 'true');
        }, 1000);
    }
})();