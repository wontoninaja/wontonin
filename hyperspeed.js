import * as THREE from 'three';

export default function initHyperspeed(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    container.innerHTML = '';
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.005);
    
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Garis tengah jalan
    const centerLines = [];
    for (let i = 0; i < 80; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 1.8), new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 }));
        line.position.set(0, 0.05, -i * 6);
        scene.add(line);
        centerLines.push(line);
    }
    
    // Mobil
    const cars = [];
    for (let i = 0; i < 35; i++) {
        const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 1.2), new THREE.MeshStandardMaterial({ color: [0xff3366, 0xff6633, 0xff9933][i % 3], metalness: 0.7 }));
        carBody.position.set((Math.random() - 0.5) * 6, 0.1, -Math.random() * 500);
        scene.add(carBody);
        
        const carLight = new THREE.PointLight(0xff4422, 0.8, 20);
        carLight.position.set(carBody.position.x, 0.2, carBody.position.z);
        scene.add(carLight);
        
        cars.push({ body: carBody, light: carLight, speed: 1 + Math.random() * 2 });
    }
    
    // Partikel
    const particleCount = 2000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = [];
    for (let i = 0; i < particleCount; i++) {
        particlePositions.push((Math.random() - 0.5) * 25, (Math.random() - 0.5) * 12, -Math.random() * 500);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particlePositions), 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: 0xff8844, size: 0.08, blending: THREE.AdditiveBlending }));
    scene.add(particles);
    
    // Lighting
    scene.add(new THREE.AmbientLight(0x222222));
    const mainLight = new THREE.DirectionalLight(0xffaa77, 0.8);
    mainLight.position.set(2, 5, 3);
    scene.add(mainLight);
    
    let speed = 2.5;
    let time = 0;
    let isHolding = false;
    let holdStart = 0;
    
    container.style.cursor = 'pointer';
    container.addEventListener('mousedown', () => { isHolding = true; holdStart = Date.now(); });
    container.addEventListener('mouseup', () => { isHolding = false; speed = 2.5; });
    container.addEventListener('mouseleave', () => { isHolding = false; speed = 2.5; });
    
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;
        
        if (isHolding) {
            const duration = (Date.now() - holdStart) / 1000;
            speed = Math.min(2.5 + duration * 5, 18);
        } else {
            speed += (2.5 - speed) * 0.05;
        }
        
        centerLines.forEach(line => {
            line.position.z += speed * 1.2;
            if (line.position.z > 10) line.position.z = -480;
        });
        
        cars.forEach(car => {
            car.body.position.z += speed * car.speed;
            car.light.position.z = car.body.position.z;
            if (car.body.position.z > 15) {
                car.body.position.z = -500;
                car.body.position.x = (Math.random() - 0.5) * 6;
                car.speed = 1 + Math.random() * 2.5;
            }
            car.light.intensity = 0.5 + Math.random() * 0.8;
        });
        
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i*3 + 2] += speed * 1.5;
            if (positions[i*3 + 2] > 15) {
                positions[i*3 + 2] = -480;
                positions[i*3] = (Math.random() - 0.5) * 30;
                positions[i*3 + 1] = (Math.random() - 0.5) * 18;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        const targetFOV = isHolding ? 75 + (speed - 2.5) * 2 : 75;
        camera.fov += (targetFOV - camera.fov) * 0.1;
        camera.updateProjectionMatrix();
        
        camera.position.x = isHolding ? Math.sin(time * 30) * 0.02 : 0;
        camera.lookAt(0, 0, -10);
        
        mainLight.intensity = 0.6 + Math.sin(time * 10) * 0.3;
        renderer.render(scene, camera);
    }
    animate();
    
    const resizeObserver = new ResizeObserver(() => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);
    
    return { dispose: () => { resizeObserver.disconnect(); renderer.dispose(); } };
}