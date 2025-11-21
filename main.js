import * as THREE from 'three';

// =========================================
// Global State
// =========================================
let atomicParticles;
let stellaratorContainer;
let atomicContainer;

// =========================================
// Global Interaction & UI Logic
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        document.querySelectorAll('a, button, .project-item, textarea, input, select').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
        });
    }

    // Loading Screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        const enterPrompt = document.getElementById('enter-prompt');
        const glitchLayers = document.querySelector('.glitch-layers');
        const mainContent = document.getElementById('main-content');

        window.addEventListener('load', () => {
            setTimeout(() => {
                if (glitchLayers) glitchLayers.style.display = 'none'; 
                if (enterPrompt) enterPrompt.classList.remove('hidden');
            }, 1500);
        });

        loadingScreen.addEventListener('click', () => {
            if (enterPrompt.classList.contains('hidden')) return;

            loadingScreen.style.opacity = '0';
            loadingScreen.style.pointerEvents = 'none';
            mainContent.classList.remove('hidden');
            
            // Initialize 3D Visuals if on home page
            if (document.getElementById('atomic-container')) {
                initAtomicEffect();
                initPlasmaReactor();
            }
            
            setTimeout(() => loadingScreen.remove(), 1000);
        });
    }

    // Parallax Scroll Logic
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        document.querySelectorAll('[data-speed]').forEach(el => {
            const speed = el.getAttribute('data-speed');
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // Tilt Effect for Cards
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5; 
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
});

// =========================================
// VISUAL MODULE 1: Atomic Parallax Structure
// =========================================
function initAtomicEffect() {
    atomicContainer = document.getElementById('atomic-container');
    stellaratorContainer = document.getElementById('plasma-section'); // Use section for larger target

    if (!atomicContainer) return;

    const width = atomicContainer.clientWidth;
    const height = atomicContainer.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    atomicContainer.appendChild(renderer.domElement);

    // Particles
    const particleCount = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const orbitOffsets = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color('#3B486A'); 
    const c2 = new THREE.Color('#224CF3'); 

    for (let i = 0; i < particleCount; i++) {
        const r = 10 + Math.random() * 15; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;

        orbitOffsets[i] = Math.random() * Math.PI * 2;

        const color = Math.random() > 0.5 ? c1 : c2;
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.15, vertexColors: true, transparent: true, opacity: 0.8
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    atomicParticles = particleSystem;

    // --- Nucleus & Rings ---
    const nucleusGroup = new THREE.Group();
    scene.add(nucleusGroup);

    const coreGeo = new THREE.IcosahedronGeometry(2, 1);
    const coreMat = new THREE.MeshBasicMaterial({ 
        color: 0x224CF3, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const nucleusCore = new THREE.Mesh(coreGeo, coreMat);
    nucleusGroup.add(nucleusCore);

    const ringMat = new THREE.LineBasicMaterial({ color: 0x3B486A, transparent: true, opacity: 0.3 });
    const ringGeo = new THREE.TorusGeometry(15, 0.05, 16, 100);
    const ring1 = new THREE.Line(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);
    const ring2 = new THREE.Line(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 2;
    scene.add(ring2);

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;

        if (stellaratorContainer) {
            const stellaratorRect = stellaratorContainer.getBoundingClientRect();
            const atomicRect = atomicContainer.getBoundingClientRect();
            
            // Calculate distance from center of viewport
            const viewCenter = window.innerHeight / 2;
            const stellaratorCenter = stellaratorRect.top + stellaratorRect.height / 2;
            
            // Determine if Stellarator is the focus
            const dist = Math.abs(viewCenter - stellaratorCenter);
            let attraction = 1 - Math.min(dist / (window.innerHeight * 0.6), 1); // Tighter focus range
            attraction = Math.pow(attraction, 3); // Sharper transition

            if (attraction > 0.01) {
                // Calculate Offset Y in World Coordinates
                // We need to map the visual difference between the Atomic center and Stellarator center
                // to Three.js units.
                
                // 1. Find Atomic Center relative to viewport
                const atomicCenterY = atomicRect.top + atomicRect.height / 2;
                
                // 2. Difference in pixels
                const pixelDiffY = stellaratorCenter - atomicCenterY;
                
                // 3. Convert to World Units
                // At z=30, the frustum height is:
                const vFOV = camera.fov * Math.PI / 180;
                const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
                const worldUnitPerPixel = visibleHeight / window.innerHeight;
                
                const targetOffsetY = -pixelDiffY * worldUnitPerPixel; // Invert Y for 3D space

                const positions = particleSystem.geometry.attributes.position.array;
                
                for(let i=0; i<particleCount; i++) {
                    const ix = i*3;
                    const ox = originalPositions[ix];
                    const oy = originalPositions[ix+1];
                    const oz = originalPositions[ix+2];
                    const offset = orbitOffsets[i];

                    // Toroidal Orbit logic
                    const orbitRadius = 10; 
                    const tubeRadius = 3;
                    const speed = 2;
                    const angle = time * speed + offset;
                    
                    let tx = Math.cos(angle) * orbitRadius;
                    let tz = Math.sin(angle) * orbitRadius;
                    let ty = 0;

                    tx += Math.cos(angle * 3) * tubeRadius;
                    ty += Math.sin(angle * 3) * tubeRadius;

                    // Tilt to match Stellarator camera (30 deg pitch)
                    const tilt = 30 * Math.PI / 180;
                    const ty_tilted = ty * Math.cos(tilt) - tz * Math.sin(tilt);
                    const tz_tilted = ty * Math.sin(tilt) + tz * Math.cos(tilt);
                    
                    // Apply Y offset to move to Stellarator
                    const finalY = ty_tilted + targetOffsetY;

                    // Lerp
                    positions[ix] = ox + (tx - ox) * attraction;
                    positions[ix+1] = oy + (finalY - oy) * attraction;
                    positions[ix+2] = oz + (tz_tilted - oz) * attraction;
                }
                particleSystem.geometry.attributes.position.needsUpdate = true;

                const opacity = 1 - attraction;
                nucleusGroup.visible = opacity > 0.1;
                ring1.visible = opacity > 0.1;
                ring2.visible = opacity > 0.1;
            } else {
                // Reset logic (simplified for performance)
                const positions = particleSystem.geometry.attributes.position.array;
                // Only reset if we were attracted previously or check occasionally?
                // For now, linear interpolation back to original
                for(let i=0; i<particleCount; i++) {
                    const ix = i*3;
                    // Gentle drift back
                    positions[ix] += (originalPositions[ix] - positions[ix]) * 0.1;
                    positions[ix+1] += (originalPositions[ix+1] - positions[ix+1]) * 0.1;
                    positions[ix+2] += (originalPositions[ix+2] - positions[ix+2]) * 0.1;
                }
                particleSystem.geometry.attributes.position.needsUpdate = true;
                
                nucleusGroup.visible = true;
                ring1.visible = true;
                ring2.visible = true;
            }
        }

        particleSystem.rotation.y += 0.001;
        nucleusGroup.rotation.x += 0.01;
        nucleusGroup.rotation.y += 0.01;
        ring1.rotation.x += 0.002;
        ring2.rotation.y += 0.002;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        const w = atomicContainer.clientWidth;
        const h = atomicContainer.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

// =========================================
// VISUAL MODULE 2: Stellarator Plasma Simulation
// =========================================
function initPlasmaReactor() {
    const container = document.getElementById('plasma-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const particleCount = 12000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const randomness = new Float32Array(particleCount);

    const R = 10; 
    const r = 1.2; 
    const twists = 5;

    for (let i = 0; i < particleCount; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;

        const distortion = Math.sin(u * twists) * 2.5 + Math.cos(u * 2) * 1.0; 
        
        const x = (R + (r + distortion * Math.cos(v)) * Math.cos(v)) * Math.cos(u);
        const y = (r + distortion * Math.cos(v)) * Math.sin(v); 
        const z = (R + (r + distortion * Math.cos(v)) * Math.cos(v)) * Math.sin(u);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        randomness[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00ffcc,
        size: 0.08, 
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });

    const plasmaSystem = new THREE.Points(geometry, material);
    scene.add(plasmaSystem);

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        const rect = container.getBoundingClientRect();
        const viewHeight = window.innerHeight;
        
        let scrollProgress = 1 - (rect.bottom / viewHeight);
        if (scrollProgress < 0) scrollProgress = 0;
        
        const brightness = 0.4 + scrollProgress * 0.6;
        material.opacity = Math.min(1.0, Math.max(0.1, brightness));
        material.size = 0.08 + scrollProgress * 0.05;

        plasmaSystem.rotation.y += 0.005;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            entry.target.style.filter = "blur(0)";
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.project-item, .gallery-header, .punk-content').forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.filter = "blur(5px)";
    el.style.transition = "all 0.8s ease-out";
    observer.observe(el);
});