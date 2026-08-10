/* =========================================================
   PULSE — Three.js background scene
   - Ambient drifting particle field (depth / atmosphere)
   - A single glowing EKG-style waveform sweeping across the
     hero, built as a scrolling buffer of points
========================================================= */
(function(){
  const canvas = document.getElementById('pulse-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 18;

  const mintColor = new THREE.Color(0x6febaa);
  const coralColor = new THREE.Color(0xff8a5b);

  /* ---------- Ambient particle field ---------- */
  const PARTICLE_COUNT = window.innerWidth < 700 ? 220 : 500;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    speeds[i] = 0.15 + Math.random() * 0.35;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: mintColor,
    size: 0.06,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ---------- EKG pulse line ---------- */
  // A horizontal strip of points forming a heartbeat waveform,
  // scrolled continuously to feel alive.
  const LINE_POINTS = 240;
  const lineWidth = 34; // world units spanned
  const linePositions = new Float32Array(LINE_POINTS * 3);
  const lineGeo = new THREE.BufferGeometry();

  function ekgValue(x, t) {
    // x in [0,1] along the strip, t is time offset for scrolling
    const phase = (x * 6 + t) % 1;
    let y = Math.sin(phase * Math.PI * 2) * 0.08; // gentle baseline hum

    // Inject periodic heartbeat spikes
    const beatPhase = (x * 2.2 + t * 1.4) % 1;
    if (beatPhase > 0.46 && beatPhase < 0.5) {
      y += (beatPhase - 0.46) * 40; // sharp rise
    } else if (beatPhase >= 0.5 && beatPhase < 0.54) {
      y += (0.54 - beatPhase) * 40 - 1.1; // sharp fall past baseline (dip)
    } else if (beatPhase >= 0.54 && beatPhase < 0.6) {
      y += Math.sin((beatPhase - 0.54) / 0.06 * Math.PI) * 0.9; // recovery bump
    }
    return y;
  }

  for (let i = 0; i < LINE_POINTS; i++) {
    const xNorm = i / (LINE_POINTS - 1);
    linePositions[i * 3] = (xNorm - 0.5) * lineWidth;
    linePositions[i * 3 + 1] = ekgValue(xNorm, 0);
    linePositions[i * 3 + 2] = 0;
  }
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  const lineMat = new THREE.LineBasicMaterial({
    color: mintColor,
    transparent: true,
    opacity: 0.85,
    linewidth: 2
  });
  const ekgLine = new THREE.Line(lineGeo, lineMat);
  ekgLine.position.y = 1.5;
  scene.add(ekgLine);

  // Soft glow duplicate (thicker, additive, behind main line)
  const glowMat = new THREE.LineBasicMaterial({
    color: mintColor,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending
  });
  const ekgGlow = new THREE.Line(lineGeo.clone(), glowMat);
  ekgGlow.position.y = 1.5;
  ekgGlow.scale.set(1, 1.6, 1);
  scene.add(ekgGlow);

  // A traveling "lead" point that rides the pulse — represents a
  // lead being caught and carried through, rather than lost.
  const leadGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const leadMat = new THREE.MeshBasicMaterial({ color: coralColor });
  const leadDot = new THREE.Mesh(leadGeo, leadMat);
  scene.add(leadDot);

  /* ---------- Mouse parallax ---------- */
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });

  /* ---------- Resize ---------- */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  /* ---------- Animate ---------- */
  const clock = new THREE.Clock();
  let tOffset = 0;

  function animate() {
    requestAnimationFrame(animate);
    const delta = reduceMotion ? 0 : clock.getDelta();
    tOffset += delta * 0.12;

    // Update EKG waveform points
    if (!reduceMotion) {
      const posAttr = lineGeo.getAttribute('position');
      let leadX = 0, leadY = 0;
      for (let i = 0; i < LINE_POINTS; i++) {
        const xNorm = i / (LINE_POINTS - 1);
        const y = ekgValue(xNorm, tOffset);
        posAttr.setY(i, y);
        if (i === Math.floor(LINE_POINTS * 0.62)) {
          leadX = linePositions[i * 3];
          leadY = y;
        }
      }
      posAttr.needsUpdate = true;
      ekgGlow.geometry.getAttribute('position').copy(posAttr);
      ekgGlow.geometry.getAttribute('position').needsUpdate = true;

      leadDot.position.set(leadX, leadY + 1.5, 0.3);
      const pulseScale = 1 + Math.sin(tOffset * 40) * 0.15;
      leadDot.scale.setScalar(pulseScale);

      // Drift ambient particles gently to the left, wrap around
      const posArr = particleGeo.getAttribute('position').array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posArr[i * 3] -= speeds[i] * delta * 0.6;
        if (posArr[i * 3] < -20) posArr[i * 3] = 20;
      }
      particleGeo.getAttribute('position').needsUpdate = true;
      particles.rotation.y += delta * 0.01;
    }

    // Subtle parallax toward mouse
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.02;
    camera.lookAt(0, 1, 0);

    renderer.render(scene, camera);
  }

  animate();
})();
