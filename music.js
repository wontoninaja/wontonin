// music.js - PASTI JALAN DI HP (TANPA ALERT ERROR)

(function () {
    // NAMA FILE ASLI LO
    const MUSIC_SRC = 'Wontonin_Makin_Enak.mp3';
    const STORAGE_KEY = 'wontonin_music_time';
    const PLAYING_KEY = 'wontonin_music_playing';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const savedTime = parseFloat(sessionStorage.getItem(STORAGE_KEY) || '0');
    const wasPlaying = sessionStorage.getItem(PLAYING_KEY) !== 'false';

    const audio = new Audio();
    audio.src = MUSIC_SRC;
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';

    if (savedTime > 0 && !isNaN(savedTime) && savedTime < 3600) {
        audio.currentTime = savedTime;
    }

    console.log('Music file:', MUSIC_SRC);
    console.log('Device:', isMobile ? 'MOBILE' : 'LAPTOP');

    // Debug error - TAPI TIDAK TAMPILKAN ALERT
    audio.addEventListener('error', (e) => {
        console.error('Audio error - file tidak ditemukan atau corrupt');
        console.error('Pastikan file "Wontonin_Makin_Enak.mp3" ada di folder yang sama');
    });

    audio.addEventListener('canplaythrough', () => {
        console.log('Audio siap diputar');
    });

    // Simpan posisi
    let saveInterval = setInterval(() => {
        if (!audio.paused && !isNaN(audio.currentTime)) {
            sessionStorage.setItem(STORAGE_KEY, audio.currentTime);
            sessionStorage.setItem(PLAYING_KEY, 'true');
        }
    }, 1000);

    window.addEventListener('beforeunload', () => {
        if (!audio.paused && !isNaN(audio.currentTime)) {
            sessionStorage.setItem(STORAGE_KEY, audio.currentTime);
        }
        sessionStorage.setItem(PLAYING_KEY, !audio.paused ? 'true' : 'false');
        clearInterval(saveInterval);
    });

    // ========== TOMBOL MUSIK ==========
    const btn = document.createElement('div');
    btn.id = 'music-btn';
    btn.innerHTML = '🔇';
    
    const btnSize = isMobile ? '60px' : '48px';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: ${btnSize};
        height: ${btnSize};
        border-radius: 50%;
        background: #ff6600;
        color: white;
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 0 15px rgba(0,0,0,0.3);
        transition: all 0.2s;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        #music-btn.playing {
            animation: spin 3s linear infinite;
        }
        #music-btn.pulse {
            animation: bounce 0.6s ease infinite;
            background: #ff4400;
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
            if (isMobile) btn.classList.add('pulse');
        }
    }

    function playMusic() {
        return audio.play();
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            playMusic().then(() => {
                updateBtn(true);
                sessionStorage.setItem(PLAYING_KEY, 'true');
                console.log('Music started by user click');
                // Hapus overlay jika ada
                const overlay = document.getElementById('music-start-overlay');
                if (overlay) overlay.remove();
            }).catch((err) => {
                console.error('Play failed:', err);
                // TIDAK ADA ALERT - hanya log ke console
            });
        } else {
            audio.pause();
            updateBtn(false);
            sessionStorage.setItem(PLAYING_KEY, 'false');
        }
    });

    document.body.appendChild(btn);

    // ========== OVERLAY UNTUK HP ==========
    let overlayAdded = false;
    
    function showOverlay() {
        if (overlayAdded) return;
        if (document.getElementById('music-start-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'music-start-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-family: sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 80px; margin-bottom: 20px;">🎵</div>
                <h2 style="color: #ff8844; margin-bottom: 15px;">WONTONIN</h2>
                <p style="color: white; margin-bottom: 10px; font-size: 18px;">Klik di mana saja untuk memutar musik</p>
                <p style="color: #ffaa66; font-size: 14px; margin-top: 30px;">⬇️ Tekan layar ⬇️</p>
            </div>
        `;
        
        const startMusicAndRemoveOverlay = () => {
            playMusic().then(() => {
                updateBtn(true);
                sessionStorage.setItem(PLAYING_KEY, 'true');
                console.log('Music started via overlay');
                overlay.remove();
            }).catch((err) => {
                console.error('Play failed:', err);
                // Coba lagi dengan delay
                setTimeout(() => {
                    playMusic().catch(e => console.log('Retry failed'));
                }, 100);
            });
        };
        
        overlay.addEventListener('click', startMusicAndRemoveOverlay);
        overlay.addEventListener('touchstart', startMusicAndRemoveOverlay);
        
        document.body.appendChild(overlay);
        overlayAdded = true;
    }
    
    // DI HP: TAMPILKAN OVERLAY
    if (isMobile && !sessionStorage.getItem('music_started_before')) {
        showOverlay();
    }
    
    // DI LAPTOP: coba autoplay (tanpa alert error)
    if (!isMobile && wasPlaying) {
        playMusic().then(() => {
            updateBtn(true);
        }).catch(() => {
            updateBtn(false);
            // Tidak ada alert - user tinggal klik tombol manual
        });
    } else if (!isMobile) {
        updateBtn(false);
    }
    
    // Tandai sudah pernah mulai musik
    audio.addEventListener('play', () => {
        sessionStorage.setItem('music_started_before', 'true');
    });
})();