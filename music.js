// music.js - SIMPLE WORKING VERSION
(function() {
    // Buat tombol
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

    // Buat audio
    var audio = new Audio('Wontonin_Makin_Enak.mp3');
    audio.loop = true;
    audio.volume = 0.5;

    var isPlaying = false;

    // Event klik tombol
    btn.onclick = function() {
        if (isPlaying) {
            audio.pause();
            btn.innerHTML = '🔇';
            isPlaying = false;
        } else {
            audio.play().then(function() {
                btn.innerHTML = '🎵';
                isPlaying = true;
            }).catch(function(error) {
                console.log('Play error:', error);
                alert('Klik tombol lagi untuk memutar musik');
            });
        }
    };

    // Coba autoplay (kalau gagal, tombol akan berkedip)
    audio.play().then(function() {
        btn.innerHTML = '🎵';
        isPlaying = true;
    }).catch(function() {
        // Autoplay gagal, buat tombol berkedip
        var blinkCount = 0;
        var blinkInterval = setInterval(function() {
            btn.style.backgroundColor = blinkCount % 2 === 0 ? '#ff4400' : '#ff6600';
            blinkCount++;
            if (blinkCount > 6) clearInterval(blinkInterval);
        }, 300);
    });
})();