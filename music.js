// music.js - VERSION FINAL DEPLOYMENT
(function() {
    console.log('Music script started');

    // Buat tombol
    var btn = document.createElement('button');
    btn.id = 'musicToggleBtn';
    btn.innerHTML = '🔇';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 55px;
        height: 55px;
        border-radius: 50%;
        background: #ff6600;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: all 0.2s;
    `;
    btn.onmouseenter = function() { this.style.transform = 'scale(1.05)'; };
    btn.onmouseleave = function() { this.style.transform = 'scale(1)'; };
    document.body.appendChild(btn);

    // Buat audio - coba beberapa kemungkinan path
    var audio = new Audio();
    
    // Daftar path yang mungkin (sesuaikan dengan nama file lo)
    var possiblePaths = [
        'Wontonin_Makin_Enak.mp3',
        './Wontonin_Makin_Enak.mp3',
        '/Wontonin_Makin_Enak.mp3',
        'music.mp3',
        './music.mp3',
        '/music.mp3'
    ];
    
    var currentPathIndex = 0;
    var isPlaying = false;
    
    function tryNextPath() {
        if (currentPathIndex >= possiblePaths.length) {
            console.error('All paths failed');
            btn.style.backgroundColor = '#ff0000';
            return false;
        }
        
        var path = possiblePaths[currentPathIndex];
        console.log('Trying path:', path);
        audio.src = path;
        return true;
    }
    
    audio.oncanplaythrough = function() {
        console.log('Audio loaded successfully with path:', audio.src);
        btn.style.backgroundColor = '#ff6600';
    };
    
    audio.onerror = function() {
        console.error('Failed with path:', audio.src);
        currentPathIndex++;
        tryNextPath();
    };
    
    tryNextPath();
    
    audio.loop = true;
    audio.volume = 0.5;
    
    // Fungsi play/pause
    function toggleMusic() {
        if (isPlaying) {
            audio.pause();
            btn.innerHTML = '🔇';
            isPlaying = false;
            console.log('Music paused');
        } else {
            audio.play().then(function() {
                btn.innerHTML = '🎵';
                isPlaying = true;
                console.log('Music playing');
            }).catch(function(err) {
                console.error('Play failed:', err);
                btn.innerHTML = '⚠️';
                alert('Klik untuk memutar musik. Browser membutuhkan interaksi user.');
            });
        }
    }
    
    btn.onclick = toggleMusic;
    
    // Coba autoplay (hanya sekali, kalau gagal ya sudah)
    setTimeout(function() {
        if (!isPlaying) {
            audio.play().then(function() {
                btn.innerHTML = '🎵';
                isPlaying = true;
                console.log('Autoplay success');
            }).catch(function(err) {
                console.log('Autoplay blocked, waiting for user click');
                // Tambahkan efek kedip biar user tahu harus klik
                btn.style.animation = 'pulse 1s ease-in-out 3';
            });
        }
    }, 500);
    
    // Tambahkan animasi kedip ke CSS
    var style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); background: #ff6600; }
            50% { transform: scale(1.1); background: #ff4400; }
            100% { transform: scale(1); background: #ff6600; }
        }
    `;
    document.head.appendChild(style);
})();