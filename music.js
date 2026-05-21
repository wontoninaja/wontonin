// music.js - VERSION PALING SEDERHANA (PASTI MUNCUL TOMBOL)

(function () {
    alert('Music script started'); // DEBUG: cek apakah file ter-load

    const MUSIC_SRC = 'Wontonin_Makin_Enak.mp3';
    const STORAGE_KEY = 'wontonin_music_time';
    const PLAYING_KEY = 'wontonin_music_playing';

    // Buat tombol musik
    const btn = document.createElement('div');
    btn.id = 'music-btn';
    btn.innerHTML = '🔇';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 55px;
        height: 55px;
        border-radius: 50%;
        background: #ff6600;
        color: white;
        font-size: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(btn);

    alert('Button added to page'); // DEBUG: cek apakah tombol sudah ditambahkan

    // Buat audio
    const audio = new Audio();
    audio.src = MUSIC_SRC;
    audio.loop = true;
    audio.volume = 0.4;

    // Cek apakah file bisa di-load
    audio.addEventListener('canplaythrough', () => {
        console.log('Audio ready');
        alert('Audio file loaded successfully!');
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio error');
        alert('Error loading audio file: ' + MUSIC_SRC);
    });

    // Fungsi play/pause
    let isPlaying = false;
    
    btn.onclick = function() {
        if (isPlaying) {
            audio.pause();
            btn.innerHTML = '🔇';
            isPlaying = false;
        } else {
            audio.play().then(() => {
                btn.innerHTML = '🎵';
                isPlaying = true;
                alert('Music is now playing!');
            }).catch((err) => {
                alert('Play failed: ' + err.message);
            });
        }
    };
})();