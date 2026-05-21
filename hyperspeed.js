import * as THREE from 'three';

export default function initHyperspeed(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.innerHTML = '';

    // Deteksi HP atau laptop
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);

    // Setting berdasarkan device
    const PARTICLE_COUNT = isMobile ? 600 : 2000;
    const CAR_COUNT = isMobile ? 12 : 35;
    const LINE_COUNT = isMobile ? 40 : 80;
    const PIXEL_RATIO = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.005);

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 5);

    const renderer = new THREE.WebGLRenderer({
        antialias: !isMobile, // matikan antialias di HP
        powerPreference: isMobile ? 'low-power' : 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(PIXEL_RATIO);
    container.appendChild(renderer.domElement);

    // Garis tengah jalan
    const centerLines = [];
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });
    const lineGeo = new THREE.BoxGeometry(0.4, 0.1, 1.8);
    for (let i = 0; i < LINE_COUNT; i++) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(0, 0.05, -i * 6);
        scene.add(line);
        centerLines.push(line);
    }

    // Mobil - pakai shared geometry & material
    const cars = [];
    const carColors = [0xff3366, 0xff6633, 0xff9933];
    const carGeo = new THREE.BoxGeometry(0.7, 0.25, 1.2);

    for (let i = 0; i < CAR_COUNT; i++) {
        const carMat = new THREE.MeshStandardMaterial({
            color: carColors[i % 3],
            metalness: isMobile ? 0 : 0.7 // matikan metalness di HP
        });
        const carBody = new THREE.Mesh(carGeo, carMat);
        carBody.position.set((Math.random() - 0.5) * 6, 0.1, -Math.random() * 500);
        scene.add(carBody);

        // HP: skip point light (berat)
        let carLight = null;
        if (!isMobile) {
            carLight = new THREE.PointLight(0xff4422, 0.8, 20);
            carLight.position.set(carBody.position.x, 0.2, carBody.position.z);
            scene.add(carLight);
        }

        cars.push({ body: carBody, light: carLight, speed: 1 + Math.random() * 2 });
    }

    // Partikel
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlePositions.push(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 12,
            -Math.random() * 500
        );
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particlePositions), 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
        color: 0xff8844,
        size: isMobile ? 0.12 : 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    }));
    scene.add(particles);

    // Lighting - lebih simpel di HP
    scene.add(new THREE.AmbientLight(isMobile ? 0x555555 : 0x222222));
    const mainLight = new THREE.DirectionalLight(0xffaa77, 0.8);
    mainLight.position.set(2, 5, 3);
    scene.add(mainLight);

    let speed = 2.5;
    let time = 0;
    let isHolding = false;
    let holdStart = 0;

    // Throttle frame rate di HP
    let lastRenderTime = 0;
    const TARGET_FPS = isMobile ? 30 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    container.style.cursor = 'pointer';
    container.addEventListener('mousedown', () => { isHolding = true; holdStart = Date.now(); });
    container.addEventListener('mouseup', () => { isHolding = false; speed = 2.5; });
    container.addEventListener('mouseleave', () => { isHolding = false; speed = 2.5; });
    container.addEventListener('touchstart', () => { isHolding = true; holdStart = Date.now(); }, { passive: true });
    container.addEventListener('touchend', () => { isHolding = false; speed = 2.5; }, { passive: true });

    function animate(now) {
        requestAnimationFrame(animate);

        // Throttle FPS di HP
        if (now - lastRenderTime < FRAME_INTERVAL) return;
        lastRenderTime = now;

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
            if (car.light) {
                car.light.position.z = car.body.position.z;
                car.light.intensity = 0.5 + Math.random() * 0.8;
            }
            if (car.body.position.z > 15) {
                car.body.position.z = -500;
                car.body.position.x = (Math.random() - 0.5) * 6;
                car.speed = 1 + Math.random() * 2.5;
            }
        });

        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3 + 2] += speed * 1.5;
            if (positions[i * 3 + 2] > 15) {
                positions[i * 3 + 2] = -480;
                positions[i * 3] = (Math.random() - 0.5) * 30;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        const targetFOV = isHolding ? 75 + (speed - 2.5) * 2 : 75;
        camera.fov += (targetFOV - camera.fov) * 0.1;
        camera.updateProjectionMatrix();

        camera.position.x = isHolding ? Math.sin(time * 30) * 0.02 : 0;
        camera.lookAt(0, 0, -10);

        if (!isMobile) {
            mainLight.intensity = 0.6 + Math.sin(time * 10) * 0.3;
        }

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    return {
        dispose: () => {
            resizeObserver.disconnect();
            renderer.dispose();
        }
    };
}