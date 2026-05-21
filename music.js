// music.js - FINAL SOLUTION UNTUK VERCEL
(function() {
    const AUDIO_URL = 'https://wontoninaja.vercel.app/Wontonin_Makin_Enak.mp3';
    
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
    
    var audioElement = null;
    var isPlaying = false;
    var audioContext = null;
    var sourceNode = null;
    
    // Fungsi untuk play menggunakan Web Audio API
    function playWithWebAudio(arrayBuffer) {
        if (audioContext === null) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (sourceNode) {
            sourceNode.stop();
        }
        
        audioContext.decodeAudioData(arrayBuffer, function(buffer) {
            sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = buffer;
            sourceNode.loop = true;
            sourceNode.connect(audioContext.destination);
            sourceNode.start();
            isPlaying = true;
            btn.innerHTML = '🎵';
            console.log('✅ Web Audio API: Musik diputar');
        }, function(e) {
            console.error('Decode error:', e);
            fallbackPlay();
        });
    }
    
    // Fallback ke audio element biasa
    function fallbackPlay() {
        if (audioElement === null) {
            audioElement = new Audio();
            audioElement.src = AUDIO_URL;
            audioElement.loop = true;
            audioElement.volume = 0.5;
        }
        
        audioElement.play().then(function() {
            isPlaying = true;
            btn.innerHTML = '🎵';
            console.log('✅ Fallback: Musik diputar');
        }).catch(function(e) {
            console.error('Fallback error:', e);
            btn.style.backgroundColor = '#ff0000';
            btn.innerHTML = '⚠️';
            setTimeout(function() {
                btn.style.backgroundColor = '#ff6600';
                btn.innerHTML = '🔇';
            }, 2000);
        });
    }
    
    // Main function: fetch dan play
    function loadAndPlay() {
        btn.innerHTML = '⏳';
        console.log('Mengambil audio dari:', AUDIO_URL);
        
        fetch(AUDIO_URL)
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.arrayBuffer();
            })
            .then(function(arrayBuffer) {
                console.log('Audio berhasil di-fetch, ukuran:', arrayBuffer.byteLength);
                // Coba Web Audio API dulu
                playWithWebAudio(arrayBuffer);
            })
            .catch(function(error) {
                console.error('Fetch error:', error);
                fallbackPlay();
            });
    }
    
    // Klik tombol
    btn.onclick = function() {
        if (isPlaying) {
            // Pause
            if (sourceNode) {
                sourceNode.stop();
                sourceNode = null;
            }
            if (audioElement) {
                audioElement.pause();
            }
            isPlaying = false;
            btn.innerHTML = '🔇';
            console.log('Musik di-pause');
        } else {
            // Play
            if (sourceNode === null && audioElement === null) {
                loadAndPlay();
            } else if (sourceNode) {
                // Resume Web Audio
                playWithWebAudio(arrayBufferCache);
            } else if (audioElement) {
                audioElement.play().then(function() {
                    isPlaying = true;
                    btn.innerHTML = '🎵';
                }).catch(function(e) {
                    console.error('Resume error:', e);
                    loadAndPlay();
                });
            }
        }
    };
    
    var arrayBufferCache = null;
    // Preload audio saat halaman load
    fetch(AUDIO_URL)
        .then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.arrayBuffer();
        })
        .then(function(arrayBuffer) {
            arrayBufferCache = arrayBuffer;
            console.log('✅ Audio preloaded, siap diputar');
            btn.style.backgroundColor = '#ff6600';
        })
        .catch(function(error) {
            console.error('Preload error:', error);
        });
    
    // Coba autoplay (dibrowser modern biasanya gagal)
    setTimeout(function() {
        if (!isPlaying) {
            var blinkCount = 0;
            var blinkInterval = setInterval(function() {
                btn.style.backgroundColor = blinkCount % 2 === 0 ? '#ff4400' : '#ff6600';
                blinkCount++;
                if (blinkCount > 6) clearInterval(blinkInterval);
            }, 300);
        }
    }, 500);
})();