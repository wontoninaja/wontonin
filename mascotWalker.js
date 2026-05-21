// Mascot Walker - NAIK KE TENGAH, MEMBESAR SAMPAI NYENTUH KANAN-KIRI (DENGAN BATASAN)

export function initMascotWalker(containerId, imageUrl, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return null;
    }
    
    container.innerHTML = '';
    
    // Ukuran awal maskot
    const baseSize = 100;
    
    const config = {
        width: baseSize,
        height: baseSize,
        moveDuration: 2500,
        swayAmount: 8,
        swaySpeed: 1.5,
        bounceAmount: 4,
        opacityMin: 0.6,        // transparan minimal 60%
        opacityMax: 1,
        // BATASAN SCALE - biar konsisten di semua device
        minScale: 5.0,          // minimal scale (untuk HP)
        maxScaleLimit: 5.5,     // maksimal scale (untuk laptop)
        ...options
    };
    
    // Hitung scale berdasarkan lebar layar, tapi dibatasi
    function getMaxScale() {
        const containerWidth = container.clientWidth;
        // Hitung scale ideal berdasarkan lebar layar
        let scale = (containerWidth / baseSize) * 0.7;
        // Batasi antara minScale dan maxScaleLimit
        scale = Math.min(config.maxScaleLimit, Math.max(config.minScale, scale));
        return scale;
    }
    
    // Buat wrapper
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.width = config.width + 'px';
    wrapper.style.height = config.height + 'px';
    wrapper.style.zIndex = '25';
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.cursor = 'pointer';
    wrapper.style.filter = 'drop-shadow(0 0 15px rgba(255,102,0,0.5))';
    
    // Gambar maskot
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.alt = 'Mascot';
    
    img.onerror = () => {
        console.error('Mascot image not found:', imageUrl);
        img.style.display = 'none';
        wrapper.style.backgroundColor = '#ff6600';
        wrapper.style.borderRadius = '50%';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.fontSize = '50px';
        wrapper.style.color = 'white';
        wrapper.innerText = '🥟';
    };
    
    wrapper.appendChild(img);
    container.appendChild(wrapper);
    
    // Posisi awal (BAWAH LAYAR)
    let centerX = (container.clientWidth / 2) - (config.width / 2);
    let posY = container.clientHeight - config.height - 10;
    let maxScale = getMaxScale();
    
    wrapper.style.left = centerX + 'px';
    wrapper.style.top = posY + 'px';
    
    console.log('MaxScale:', maxScale, 'ContainerWidth:', container.clientWidth);
    
    // State
    let phase = 'movingUp';
    let startTime = performance.now();
    let isMoving = true;
    let currentScale = 1;
    let swayTime = 0;
    
    const targetY = (container.clientHeight / 2) - (config.height / 2);
    
    function getOpacity(scale) {
        const progress = (scale - 1) / (maxScale - 1);
        let opacity = config.opacityMax - (progress * (config.opacityMax - config.opacityMin));
        return Math.min(config.opacityMax, Math.max(config.opacityMin, opacity));
    }
    
    function updateMaxScale() {
        maxScale = getMaxScale();
    }
    
    function animate() {
        if (!isMoving) return;
        
        const now = performance.now();
        let elapsed = now - startTime;
        
        centerX = (container.clientWidth / 2) - (config.width / 2);
        updateMaxScale();
        
        const currentTargetY = (container.clientHeight / 2) - (config.height / 2);
        
        switch (phase) {
            case 'movingUp':
                let progress = Math.min(1, elapsed / config.moveDuration);
                
                const startY = container.clientHeight - config.height - 10;
                posY = startY - (startY - currentTargetY) * progress;
                
                currentScale = 1 + (maxScale - 1) * progress;
                
                img.style.opacity = getOpacity(currentScale);
                wrapper.style.left = centerX + 'px';
                wrapper.style.top = posY + 'px';
                img.style.transform = `scale(${currentScale})`;
                
                if (progress >= 1) {
                    phase = 'idlingAtMiddle';
                    startTime = now;
                    swayTime = 0;
                    currentScale = maxScale;
                    img.style.transform = `scale(${currentScale})`;
                }
                break;
                
            case 'idlingAtMiddle':
                swayTime += 0.02;
                
                const swayX = Math.sin(swayTime * config.swaySpeed) * config.swayAmount;
                const bounceY = Math.sin(swayTime * config.swaySpeed * 1.2) * config.bounceAmount;
                const rotateZ = Math.sin(swayTime * config.swaySpeed) * 5;
                const stretchX = 1 + Math.abs(Math.sin(swayTime * 2)) * 0.05;
                const stretchY = 1 - Math.abs(Math.sin(swayTime * 2)) * 0.03;
                
                wrapper.style.left = (centerX + swayX) + 'px';
                wrapper.style.top = (currentTargetY + bounceY) + 'px';
                img.style.transform = `rotate(${rotateZ}deg) scaleX(${stretchX * currentScale}) scaleY(${stretchY * currentScale})`;
                img.style.opacity = getOpacity(currentScale);
                break;
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        centerX = (container.clientWidth / 2) - (config.width / 2);
        const newTargetY = (container.clientHeight / 2) - (config.height / 2);
        
        if (phase === 'movingUp') {
            posY = container.clientHeight - config.height - 10;
        } else {
            posY = newTargetY;
        }
        
        wrapper.style.left = centerX + 'px';
        wrapper.style.top = posY + 'px';
        updateMaxScale();
        
        if (phase === 'idlingAtMiddle') {
            currentScale = maxScale;
            img.style.transform = `scale(${currentScale})`;
            img.style.opacity = getOpacity(currentScale);
        }
    });
    
    wrapper.addEventListener('mouseenter', () => {
        wrapper.style.filter = 'drop-shadow(0 0 30px rgba(255,102,0,0.9))';
    });
    
    wrapper.addEventListener('mouseleave', () => {
        wrapper.style.filter = 'drop-shadow(0 0 15px rgba(255,102,0,0.5))';
    });
    
    return {
        destroy: () => {
            isMoving = false;
            if (container.contains(wrapper)) container.removeChild(wrapper);
        }
    };
}