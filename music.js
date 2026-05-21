// music.js - SOLUSI FINAL UNTUK VERCEL (mengatasi CORS)
(function() {
    // URL file audio yang sudah dipastikan bisa diakses
    const AUDIO_URL = 'https://wontoninaja.vercel.app/Wontonin_Makin_Enak.mp3';
    
    // Buat tombol musik
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
    
    var audio = null;
    var isPlaying = false;
    var isLoading = false;
    
    // Fungsi untuk fetch audio dan ubah ke Blob (mengatasi CORS)
    function loadAndPlayAudio() {
        if (isLoading) return;
        isLoading = true;
        
        btn.innerHTML = '⏳';
        console.log('Mengambil file audio...');
        
        fetch(AUDIO_URL)
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.blob();
            })
            .then(blob => {
                // Buat URL lokal dari Blob
                const blobUrl = URL.createObjectURL(blob);
                console.log('Audio berhasil di-load, membuat player lokal...');
                
                // Buat audio element dengan URL lokal
                audio = new Audio(blobUrl);
                audio.loop = true;
                audio.volume = 0.5;
                
                audio.addEventListener('canplaythrough', () => {
                    console.log('Audio siap diputar');
                    btn.style.backgroundColor = '#ff6600';
                    if (isPlaying) {
                        audio.play().catch(e => console.log('Play error:', e));
                    } else {
                        btn.innerHTML = '🎵';
                        isPlaying = true;
                        audio.play().catch(e => console.log('Play error:', e));
                    }
                    isLoading = false;
                });
                
                audio.addEventListener('error', (e) => {
                    console.error('Audio error:', e);
                    btn.style.backgroundColor = '#ff0000';
                    btn.innerHTML = '❌';
                    isLoading = false;
                });
            })
            .catch(error => {
                console.error('Gagal fetch audio:', error);
                btn.style.backgroundColor = '#ff0000';
                btn.innerHTML = '⚠️';
                isLoading = false;
            });
    }
    
    // Event klik tombol
    btn.onclick = function() {
        if (audio && !audio.paused) {
            // Jika sudah ada audio dan sedang diputar -> pause
            audio.pause();
            btn.innerHTML = '🔇';
            isPlaying = false;
        } else if (audio && audio.paused) {
            // Jika sudah ada audio tapi di-pause -> lanjutkan
            audio.play().then(() => {
                btn.innerHTML = '🎵';
                isPlaying = true;
            }).catch(e => console.log('Play error:', e));
        } else {
            // Jika belum ada audio (pertama kali klik) -> load dan play
            loadAndPlayAudio();
        }
    };
    
    // Coba autoplay (kalau gagal, tombol akan berkedip)
    loadAndPlayAudio().catch(() => {
        var blinkCount = 0;
        var blinkInterval = setInterval(function() {
            btn.style.backgroundColor = blinkCount % 2 === 0 ? '#ff4400' : '#ff6600';
            blinkCount++;
            if (blinkCount > 6) clearInterval(blinkInterval);
        }, 300);
    });
})();