// music.js - MANUAL PATH (ganti dengan URL yang bener)
(function() {
    // 🔥 GANTI URL INI DENGAN URL YANG BENER DARI BROWSER 🔥
    var AUDIO_URL = 'https://wontoninaja.vercel.app/Wontonin_Makin_Enak.mp3';
    
    var btn = document.createElement('button');
    btn.innerHTML = '🔇';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.width = '55px';
    btn.style.height = '55px';
    btn.style.borderRadius = '50%';
    btn.style.backgroundColor = '#ff6600';
    btn.style.border = 'none';
    btn.style.color = 'white';
    btn.style.fontSize = '28px';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '9999';
    btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    document.body.appendChild(btn);
    
    // Test dengan fetch dulu biar keliatan
    fetch(AUDIO_URL).then(function(res) {
        console.log('Fetch result:', res.status, res.statusText);
        if (res.ok) {
            console.log('✅ File ditemukan di path:', AUDIO_URL);
        } else {
            console.error('❌ File TIDAK ditemukan di path:', AUDIO_URL);
        }
    }).catch(function(err) {
        console.error('Fetch error:', err);
    });
    
    var audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.volume = 0.5;
    
    audio.addEventListener('error', function() {
        console.error('❌ Audio error - path salah:', AUDIO_URL);
        btn.style.backgroundColor = '#ff0000';
        btn.innerHTML = '❌';
    });
    
    audio.addEventListener('canplaythrough', function() {
        console.log('✅ Audio siap diputar');
        btn.style.backgroundColor = '#ff6600';
    });
    
    var isPlaying = false;
    
    btn.onclick = function() {
        if (isPlaying) {
            audio.pause();
            btn.innerHTML = '🔇';
            isPlaying = false;
        } else {
            audio.play().then(function() {
                btn.innerHTML = '🎵';
                isPlaying = true;
            }).catch(function(e) {
                console.error('Play error:', e);
            });
        }
    };
})();