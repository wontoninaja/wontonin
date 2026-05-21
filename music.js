// music.js - Lagu continues antar halaman (TIDAK NGULANG)

(function () {
    const MUSIC_SRC = 'Wontonin_Makin_Enak.mp3';
    const STORAGE_KEY = 'wontonin_music_time';
    const PLAYING_KEY = 'wontonin_music_playing';

    // Ambil posisi terakhir sebelum membuat audio baru
    const savedTime = parseFloat(sessionStorage.getItem(STORAGE_KEY) || '0');
    const wasPlaying = sessionStorage.getItem(PLAYING_KEY) !== 'false';

    // Buat audio element
    const audio = new Audio();
    audio.src = MUSIC_SRC;
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';

    // SET POSISI LAGU KE POSISI TERAKHIR (PENTING!)
    audio.currentTime = savedTime;

    console.log('Music loaded, starting at:', savedTime, 'seconds');

    audio.addEventListener('canplaythrough', () => {
        console.log('Music file loaded successfully!');
    });
    
    audio.addEventListener('error', (e) => {
        console.error('ERROR loading music file:', e);
    });

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
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(0,0,0,0.7);
        border: 2px solid #ff6600;
        color: white;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        transition: all 0.3s;
        box-shadow: 0 0 10px rgba(255,102,0,0.4);
        user-select: none;
        backdrop-filter: blur(4px);
    `;

    // Animasi berputar saat play
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        #music-btn.playing {
            animation: spin 3s linear infinite;
            border-color: #ff6600;
            box-shadow: 0 0 20px rgba(255,102,0,0.7);
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
        } else {
            btn.classList.remove('playing');
        }
    }

    btn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                updateBtn(true);
                sessionStorage.setItem(PLAYING_KEY, 'true');
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

    // Autoplay dan set posisi lagu
    function tryPlay() {
        if (wasPlaying && savedTime > 0) {
            // Langsung set posisi dan play
            audio.currentTime = savedTime;
            audio.play().then(() => {
                updateBtn(true);
                console.log('Music playing from position:', savedTime);
            }).catch((err) => {
                console.log('Autoplay blocked, waiting for user interaction');
                updateBtn(false);
                const playOnInteract = () => {
                    audio.currentTime = savedTime;
                    audio.play().then(() => {
                        updateBtn(true);
                        console.log('Music started after user interaction');
                    }).catch(e => console.log('Still blocked:', e));
                    document.removeEventListener('click', playOnInteract);
                    document.removeEventListener('touchstart', playOnInteract);
                };
                document.addEventListener('click', playOnInteract);
                document.addEventListener('touchstart', playOnInteract);
            });
        } else if (wasPlaying) {
            // Play dari awal
            audio.play().then(() => {
                updateBtn(true);
                console.log('Music playing from start');
            }).catch(() => {
                updateBtn(false);
            });
        } else {
            updateBtn(false);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryPlay);
    } else {
        tryPlay();
    }
})();