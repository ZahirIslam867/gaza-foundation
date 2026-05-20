/*
 * Gaza Fundraising Cause — Main JavaScript
 */
const AMOUNT_RAISED = 1200;
const FUNDRAISING_GOAL = 5000;
const KM_CYCLED = Math.round(AMOUNT_RAISED / 100 * 59);
const KM_PER_LAP = 59;

const PERIMETER_RAISED = 15;
const PERIMETER_GOAL = 2000;

// =============================================================================
// 1. Navigation — hide on scroll down, show on scroll up
// =============================================================================
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  let lastScroll = 0, ticking = false;
  function handleScroll() {
    const current = window.scrollY;
    if (current > 80) {
      if (current > lastScroll) nav.classList.add('nav--hidden');
      else nav.classList.remove('nav--hidden');
    } else nav.classList.remove('nav--hidden');
    lastScroll = current;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(handleScroll); ticking = true; }
  }, { passive: true });
}

// =============================================================================
// 2. Hamburger Menu
// =============================================================================
function initHamburger() {
  const hamburger = document.querySelector('.nav__hamburger');
  const navLinks = document.querySelector('.nav__links');
  if (!hamburger || !navLinks) return;
  hamburger.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('nav__links--open');
    hamburger.classList.toggle('nav__hamburger--open');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  document.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('nav__links--open');
      hamburger.classList.remove('nav__hamburger--open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

// =============================================================================
// 3. Progress Bar — fill on scroll
// =============================================================================
function initProgressBar() {
  const fill = document.querySelector('#progress-fill');
  if (!fill) return;
  const percent = parseFloat(fill.getAttribute('data-progress')) || 0;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        fill.style.setProperty('--progress-width', percent + '%');
        fill.classList.add('progress__fill--animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  observer.observe(fill);
}

// =============================================================================
// 4. Fade-up on Scroll (Intersection Observer)
// =============================================================================
function initFadeUp() {
  const elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-up--visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  elements.forEach(function (el) { observer.observe(el); });
}

// =============================================================================
// 5. Simple Counter (for about page supporter count)
// =============================================================================
function initSimpleCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-counter'), 10);
        if (isNaN(target)) return;
        const duration = 2000;
        const startTime = performance.now();
        function tick(currentTime) {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString();
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(function (el) { observer.observe(el); });
}

// =============================================================================
// 6. Flip Counter (3D digit flip for home page progress)
// =============================================================================
function initFlipCounters() {
  var raisedEl = document.querySelector('[data-flip="raised"]');
  var cycledEl = document.querySelector('[data-flip="cycled"]');

  function buildFlipDigit(digit) {
    var container = document.createElement('span');
    container.className = 'flip-digit';
    container.innerHTML =
      '<span class="flip-digit__top">' + digit + '</span>' +
      '<span class="flip-digit__bottom">' + digit + '</span>' +
      '<span class="flip-digit__top-next"></span>' +
      '<span class="flip-digit__bottom-next"></span>';
    return container;
  }

  function setDigitValue(fd, newDigit) {
    var top = fd.querySelector('.flip-digit__top');
    var bottom = fd.querySelector('.flip-digit__bottom');
    var topNext = fd.querySelector('.flip-digit__top-next');
    var bottomNext = fd.querySelector('.flip-digit__bottom-next');
    if (top.textContent === newDigit.toString()) return;
    topNext.textContent = newDigit;
    bottomNext.textContent = newDigit;
    fd.classList.remove('flip-digit--animate');
    void fd.offsetWidth;
    fd.classList.add('flip-digit--animate');
    setTimeout(function () {
      top.textContent = newDigit;
      bottom.textContent = newDigit;
      topNext.textContent = '';
      bottomNext.textContent = '';
      fd.classList.remove('flip-digit--animate');
    }, 500);
  }

  function initFlip(el, targetValue) {
    if (!el) return;
    var digits = [];
    var str = targetValue.toString();
    var container = document.createElement('span');
    container.className = 'flip-number';
    for (var i = 0; i < str.length; i++) {
      var fd = buildFlipDigit(str[i]);
      container.appendChild(fd);
      digits.push(fd);
    }
    el.textContent = '';
    el.appendChild(container);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var strNow = targetValue.toString();
          for (var i = 0; i < digits.length; i++) {
            (function (idx, dig) {
              setTimeout(function () {
                setDigitValue(dig, strNow[idx]);
              }, idx * 80);
            })(i, digits[i]);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  }

  initFlip(cycledEl, KM_CYCLED);
}

// =============================================================================
// 7. Three.js — Scene 1: Gaza Map + Displaced Particles (Hero)
//    (includes route trace animation)
// =============================================================================
function initThreeGazaMap() {
  var container = document.querySelector('#three-canvas');
  if (!container) return;
  if (typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var scene = new THREE.Scene();
  var w = container.clientWidth || 400;
  var h = container.clientHeight || 600;
  var aspect = w / h;
  var camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
  camera.position.set(0, 0, aspect < 0.8 ? 7 : 6);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  container.appendChild(renderer.domElement);
  var pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h, false);

  // Gaza outline points
  var gp = [
    [0.0, 1.0], [0.2, 0.97], [0.35, 0.9], [0.45, 0.82],
    [0.55, 0.72], [0.62, 0.62], [0.68, 0.5], [0.72, 0.38],
    [0.74, 0.26], [0.72, 0.15], [0.7, 0.05], [0.67, -0.05],
    [0.64, -0.15], [0.6, -0.25], [0.55, -0.35], [0.5, -0.45],
    [0.44, -0.55], [0.37, -0.65], [0.28, -0.75], [0.18, -0.85],
    [0.08, -0.93], [0.0, -1.0], [-0.08, -0.93], [-0.18, -0.85],
    [-0.28, -0.75], [-0.37, -0.65], [-0.44, -0.55], [-0.5, -0.45],
    [-0.55, -0.35], [-0.6, -0.25], [-0.64, -0.15], [-0.67, -0.05],
    [-0.7, 0.05], [-0.72, 0.15], [-0.74, 0.26], [-0.72, 0.38],
    [-0.68, 0.5], [-0.62, 0.62], [-0.55, 0.72], [-0.45, 0.82],
    [-0.35, 0.9], [-0.2, 0.97], [0.0, 1.0],
  ];
  var gaza3d = gp.map(function (p) { return new THREE.Vector3(p[0] * 2.2, 0, p[1] * 1.1); });

  // Wireframe outline
  var outlineGeom = new THREE.BufferGeometry().setFromPoints(gaza3d);
  var outlineMat = new THREE.LineBasicMaterial({ color: 0xCE1126, opacity: 0.7 });
  var outline = new THREE.Line(outlineGeom, outlineMat);
  scene.add(outline);

  // Dashed perimeter route with trace animation
  var routeMat = new THREE.LineDashedMaterial({
    color: 0xCE1126, dashSize: 0.1, gapSize: 0.07, opacity: 0.6,
  });
  var route = new THREE.Line(outlineGeom.clone(), routeMat);
  route.computeLineDistances();
  var totalDist = route.geometry.attributes.lineDistance
    ? route.geometry.attributes.lineDistance.array[route.geometry.attributes.lineDistance.count - 1]
    : 15;
  routeMat.dashOffset = totalDist;
  scene.add(route);

  // One-time route trace animation
  (function animateTrace() {
    var startTime = performance.now();
    var traceDuration = 3000;
    function tick(now) {
      var t = Math.min((now - startTime) / traceDuration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      routeMat.dashOffset = totalDist * (1 - eased);
      routeMat.needsUpdate = true;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // Filled Gaza silhouette
  var shapePts = [];
  for (var i = 0; i < gp.length; i++) shapePts.push(new THREE.Vector2(gp[i][0] * 2.2, gp[i][1] * 1.1));
  var fillShape = new THREE.Shape(shapePts);
  var fillGeom = new THREE.ShapeGeometry(fillShape);
  var fillMat = new THREE.MeshBasicMaterial({
    color: 0xCE1126, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false,
  });
  var fillMesh = new THREE.Mesh(fillGeom, fillMat);
  fillMesh.rotation.x = -Math.PI / 2;
  fillMesh.position.y = -0.01;
  scene.add(fillMesh);

  // Displaced particles
  var particleCount = 600;
  var pPositions = new Float32Array(particleCount * 3);
  var pSpeeds = new Float32Array(particleCount);
  function getGazaWidth(z) {
    var minX = Infinity, maxX = -Infinity;
    for (var i = 0; i < gaza3d.length; i++) {
      var next = (i + 1) % gaza3d.length;
      var p1 = gaza3d[i], p2 = gaza3d[next];
      var zMin = Math.min(p1.z, p2.z), zMax = Math.max(p1.z, p2.z);
      if (z >= zMin && z <= zMax) {
        var t = (z - zMin) / (zMax - zMin || 1);
        var xAtZ = p1.x + t * (p2.x - p1.x);
        if (xAtZ < minX) minX = xAtZ;
        if (xAtZ > maxX) maxX = xAtZ;
      }
    }
    return minX === Infinity ? 0.6 : (maxX - minX) / 2;
  }
  for (var i = 0; i < particleCount; i++) {
    var pz = (Math.random() * 2.2 - 1.1);
    var halfW = getGazaWidth(pz) * 0.85;
    pPositions[i * 3] = (Math.random() - 0.5) * halfW * 2;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    pPositions[i * 3 + 2] = pz;
    pSpeeds[i] = 0.002 + Math.random() * 0.005;
  }
  var pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  var pMat = new THREE.PointsMaterial({
    color: 0xf7f5f0, size: 0.06, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  var particleSystem = new THREE.Points(pGeom, pMat);
  scene.add(particleSystem);

  // Mouse interaction
  var mouseNorm = 0.5;
  function onMouseMove(e) {
    var rect = container.getBoundingClientRect();
    mouseNorm = 1 - (e.clientY - rect.top) / rect.height;
    mouseNorm = Math.max(0, Math.min(1, mouseNorm));
  }
  var heroRight = document.querySelector('#hero-right');
  if (heroRight) heroRight.addEventListener('mousemove', onMouseMove, { passive: true });

  // Visibility
  var isVisible = true, animId = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { isVisible = true; if (!animId) animate(); }
      else { isVisible = false; if (animId) { cancelAnimationFrame(animId); animId = null; } }
    });
  }, { threshold: 0.01 });
  io.observe(container.parentElement);

  function animate() {
    if (!isVisible) { animId = null; return; }
    var pos = particleSystem.geometry.attributes.position.array;
    for (var i = 0; i < particleCount; i++) {
      var speedMod = 0.2 + 0.8 * mouseNorm;
      pos[i * 3 + 2] -= pSpeeds[i] * speedMod;
      if (pos[i * 3 + 2] < -1.1) {
        pos[i * 3 + 2] = 1.1;
        var hw = getGazaWidth(1.1) * 0.85;
        pos[i * 3] = (Math.random() - 0.5) * hw * 2;
      }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
    outline.rotation.y += 0.002;
    route.rotation.y += 0.002;
    particleSystem.rotation.y += 0.002;
    fillMesh.rotation.y += 0.002;
    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  function handleResize() {
    var cw = container.clientWidth, ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  }
  window.addEventListener('resize', handleResize, { passive: true });
}

// =============================================================================
// 8. Three.js — Scene 2: Cyclist Continuously Cycling Gaza Perimeter
// =============================================================================
function initThreeCyclistTrack() {
  var container = document.querySelector('#three-track');
  if (!container) return;
  if (typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var scene = new THREE.Scene();
  var w = container.clientWidth || 200;
  var h = container.clientHeight || 260;
  var camera = new THREE.OrthographicCamera(-2.8, 2.8, 3.2, -3.2, 0.1, 100);
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  container.appendChild(renderer.domElement);
  var pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h, false);

  // Gaza perimeter curve (real OSM border data, normalized)
  var rawGp = [
    [-0.7962, -0.4360], [-0.7813, -0.4541], [-0.7073, -0.5939],
    [-0.7066, -0.5949], [-0.7058, -0.5951], [-0.6905, -0.5963],
    [-0.6888, -0.5973], [-0.6870, -0.5977], [-0.6686, -0.6574],
    [-0.6647, -0.6685], [-0.6642, -0.6715], [-0.6542, -0.7033],
    [-0.6520, -0.7106], [-0.6518, -0.7122], [-0.6365, -0.7606],
    [-0.6243, -0.8022], [-0.6130, -0.8373], [-0.6094, -0.8503],
    [-0.5869, -0.9197], [-0.5777, -0.9505], [-0.5624, -1.0000],
    [-0.5583, -0.9978], [-0.5312, -0.9717], [-0.5126, -0.9555],
    [-0.5016, -0.9446], [-0.4823, -0.9241], [-0.4575, -0.8940],
    [-0.4517, -0.8881], [-0.4447, -0.8832], [-0.4322, -0.8767],
    [-0.4200, -0.8710], [-0.3963, -0.8582], [-0.3847, -0.8512],
    [-0.3760, -0.8468], [-0.3590, -0.8400], [-0.3417, -0.8324],
    [-0.3270, -0.8223], [-0.3061, -0.8059], [-0.2982, -0.7991],
    [-0.2850, -0.7868], [-0.2718, -0.7732], [-0.2573, -0.7538],
    [-0.2503, -0.7437], [-0.2324, -0.7108], [-0.2275, -0.7006],
    [-0.2239, -0.6914], [-0.2102, -0.6822], [-0.1136, -0.6263],
    [-0.1012, -0.5996], [-0.0934, -0.5762], [-0.0830, -0.5432],
    [-0.0977, -0.4365], [-0.1056, -0.3823], [-0.1218, -0.2486],
    [-0.1201, -0.2397], [-0.1203, -0.2340], [-0.1180, -0.2270],
    [-0.1164, -0.2188], [-0.1138, -0.2121], [-0.1108, -0.2066],
    [-0.1067, -0.2047], [-0.1029, -0.2051], [-0.0977, -0.2080],
    [-0.0959, -0.2080], [-0.0918, -0.2062], [-0.0896, -0.2032],
    [-0.0895, -0.1993], [-0.0914, -0.1938], [-0.0909, -0.1923],
    [-0.0842, -0.1842], [-0.0836, -0.1726], [-0.0797, -0.1576],
    [-0.0760, -0.1491], [-0.0569, -0.1204], [-0.0537, -0.1143],
    [-0.0513, -0.1108], [-0.0514, -0.1004], [-0.0422, -0.0907],
    [-0.0316, -0.0814], [-0.0223, -0.0710], [-0.0143, -0.0657],
    [-0.0105, -0.0588], [0.0155, -0.0352], [0.0192, -0.0277],
    [0.0265, -0.0204], [0.0379, -0.0073], [0.0505, 0.0105],
    [0.0570, 0.0167], [0.0599, 0.0191], [0.0721, 0.0164],
    [0.0845, 0.0308], [0.0940, 0.0379], [0.1053, 0.0486],
    [0.1123, 0.0596], [0.1209, 0.0664], [0.1317, 0.0705],
    [0.1450, 0.0790], [0.1574, 0.0962], [0.1653, 0.1082],
    [0.1763, 0.1205], [0.1900, 0.1467], [0.2059, 0.1687],
    [0.2279, 0.1831], [0.2444, 0.1874], [0.2510, 0.1942],
    [0.2614, 0.2057], [0.2704, 0.2176], [0.2790, 0.2313],
    [0.2964, 0.2460], [0.3313, 0.2795], [0.3328, 0.2814],
    [0.3430, 0.2987], [0.3524, 0.3100], [0.3753, 0.3363],
    [0.3821, 0.3470], [0.3910, 0.3595], [0.3943, 0.3624],
    [0.4022, 0.3682], [0.4240, 0.3799], [0.4301, 0.3843],
    [0.4415, 0.3941], [0.4568, 0.4119], [0.4748, 0.4283],
    [0.5118, 0.4602], [0.5297, 0.4769], [0.5487, 0.4895],
    [0.5668, 0.4941], [0.5733, 0.4949], [0.6031, 0.5014],
    [0.6188, 0.5126], [0.6252, 0.5188], [0.6333, 0.5234],
    [0.6657, 0.5395], [0.6826, 0.5457], [0.7030, 0.5550],
    [0.7181, 0.5746], [0.7368, 0.5853], [0.7354, 0.5915],
    [0.7348, 0.5986], [0.7394, 0.6069], [0.7548, 0.6192],
    [0.7559, 0.6324], [0.7587, 0.6367], [0.7657, 0.6413],
    [0.7836, 0.6552], [0.7876, 0.6623], [0.7916, 0.6777],
    [0.7962, 0.6988], [0.7932, 0.7059], [0.7858, 0.7124],
    [0.7445, 0.7441], [0.7293, 0.7594], [0.7227, 0.7655],
    [0.7094, 0.7750], [0.6907, 0.7908], [0.6872, 0.7952],
    [0.6744, 0.8065], [0.6623, 0.8161], [0.6497, 0.8279],
    [0.6384, 0.8368], [0.6258, 0.8486], [0.6005, 0.8690],
    [0.5897, 0.8788], [0.5749, 0.8892], [0.5636, 0.8986],
    [0.5509, 0.9101], [0.5390, 0.9199], [0.5135, 0.9402],
    [0.5005, 0.9500], [0.4631, 0.9805], [0.4513, 0.9894],
    [0.4365, 1.0000], [0.2866, 0.7660], [0.2018, 0.6585],
    [0.1979, 0.6557], [0.1918, 0.6537], [0.1800, 0.6513],
    [0.1736, 0.6489], [0.1684, 0.6448], [0.1642, 0.6398],
    [0.1591, 0.6335], [0.1558, 0.6288], [0.1533, 0.6234],
    [0.1523, 0.6172], [0.1524, 0.6067], [0.1509, 0.6017],
    [0.1400, 0.5843], [-0.0339, 0.3649], [-0.2619, 0.0943],
    [-0.3825, -0.0268], [-0.3862, -0.0296], [-0.3901, -0.0314],
    [-0.4027, -0.0347], [-0.4067, -0.0367], [-0.4112, -0.0403],
    [-0.4145, -0.0442], [-0.4200, -0.0567], [-0.4222, -0.0599],
    [-0.4858, -0.1259], [-0.5365, -0.1845], [-0.7014, -0.3465],
  ];
  var SCALE = 1.6;
  var gazaPts = rawGp.map(function (p) { return new THREE.Vector3(p[0] * SCALE, 0, p[1] * SCALE); });
  var curvePts = gazaPts.map(function (v) { return new THREE.Vector3(v.x, 0, v.z); });
  var curve = new THREE.CatmullRomCurve3(curvePts, true);

  // Gaza outline
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(gazaPts),
    new THREE.LineBasicMaterial({ color: 0xCE1126, opacity: 0.7 })
  ));

  // Gaza fill
  var sp = [];
  for (var i = 0; i < rawGp.length; i++) sp.push(new THREE.Vector2(rawGp[i][0] * SCALE, rawGp[i][1] * SCALE));
  var sh = new THREE.Shape(sp);
  var sg = new THREE.ShapeGeometry(sh);
  var sm = new THREE.MeshBasicMaterial({ color: 0xCE1126, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
  var fillMesh = new THREE.Mesh(sg, sm);
  fillMesh.rotation.x = -Math.PI / 2;
  fillMesh.position.y = -0.01;
  scene.add(fillMesh);

  // Pins
  var pinMat = new THREE.MeshBasicMaterial();
  var startPin = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), pinMat);
  startPin.position.copy(curve.getPoint(0));
  startPin.position.y = 0.01;
  startPin.material.color.setHex(0x2d6a2d);
  scene.add(startPin);
  var finishPin = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), pinMat);
  finishPin.position.copy(curve.getPoint(0.999));
  finishPin.position.y = 0.01;
  finishPin.material.color.setHex(0xCE1126);
  scene.add(finishPin);

  // Labels
  function makeLabel(text, pos, color) {
    var canvas = document.createElement('canvas');
    canvas.width = 80; canvas.height = 24;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 40, 16);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    var sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.position.y = 0.05;
    sprite.scale.set(0.45, 0.13, 1);
    scene.add(sprite);
  }
  makeLabel('START', curve.getPoint(0), '#2d6a2d');
  makeLabel('FINISH', curve.getPoint(0.999), '#CE1126');

  // Cyclist
  var trailSegs = 500;
  var bikeGroup = new THREE.Group();
  var wR = 0.09, wSegs = 10, wGap = 0.14;
  var wPts1 = [], wPts2 = [];
  for (var i = 0; i <= wSegs; i++) {
    var a = (i / wSegs) * Math.PI * 2;
    wPts1.push(new THREE.Vector3(Math.cos(a) * wR, 0, Math.sin(a) * wR));
    wPts2.push(new THREE.Vector3(Math.cos(a) * wR + wGap, 0, Math.sin(a) * wR));
  }
  var wm = new THREE.LineBasicMaterial({ color: 0xCE1126 });
  bikeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wPts1), wm));
  bikeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wPts2), wm));
  var fPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(wGap, 0, 0)];
  var fm = new THREE.LineBasicMaterial({ color: 0xCE1126, opacity: 0.5, transparent: true });
  bikeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(fPts), fm));
  var rider = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), new THREE.MeshBasicMaterial({ color: 0xCE1126 }));
  rider.position.set(wGap / 2, 0.065, 0);
  bikeGroup.add(rider);
  scene.add(bikeGroup);

  // Trail lines — bold via twin-line offset (3 layers for prominence)
  var trailMat = new THREE.LineBasicMaterial({ color: 0x3a9e3a, opacity: 1.0 });
  var trailLine = new THREE.Line(new THREE.BufferGeometry(), trailMat);
  scene.add(trailLine);
  var trailMatBold = new THREE.LineBasicMaterial({ color: 0x3a9e3a, opacity: 0.50 });
  var trailLineBold = new THREE.Line(new THREE.BufferGeometry(), trailMatBold);
  scene.add(trailLineBold);
  var trailMatBold2 = new THREE.LineBasicMaterial({ color: 0x3a9e3a, opacity: 0.25 });
  var trailLineBold2 = new THREE.Line(new THREE.BufferGeometry(), trailMatBold2);
  scene.add(trailLineBold2);
  var remainMat = new THREE.LineDashedMaterial({ color: 0xCE1126, dashSize: 0.06, gapSize: 0.04, opacity: 0.6 });
  var remainLine = new THREE.Line(new THREE.BufferGeometry(), remainMat);
  scene.add(remainLine);
  var remainMatBold = new THREE.LineDashedMaterial({ color: 0xCE1126, dashSize: 0.06, gapSize: 0.04, opacity: 0.30 });
  var remainLineBold = new THREE.Line(new THREE.BufferGeometry(), remainMatBold);
  scene.add(remainLineBold);
  var remainMatBold2 = new THREE.LineDashedMaterial({ color: 0xCE1126, dashSize: 0.06, gapSize: 0.04, opacity: 0.15 });
  var remainLineBold2 = new THREE.Line(new THREE.BufferGeometry(), remainMatBold2);
  scene.add(remainLineBold2);

  // Visibility + animation
  var isVisible = true, animId = null, time = 0;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { isVisible = true; if (!animId) animate(); }
      else { isVisible = false; if (animId) { cancelAnimationFrame(animId); animId = null; } }
    });
  }, { threshold: 0.01 });
  io.observe(container);

  function offsetPoints(pts, amount) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var prev = pts[Math.max(0, i - 1)];
      var next = pts[Math.min(pts.length - 1, i + 1)];
      var dx = next.x - prev.x;
      var dz = next.z - prev.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      var nx = -dz / len * amount;
      var nz = dx / len * amount;
      out.push(new THREE.Vector3(pts[i].x + nx, pts[i].y, pts[i].z + nz));
    }
    return out;
  }

  function buildTrails(progress) {
    var p = progress % 1;
    // Green trail: from 0 to current position
    var trailN = Math.max(3, Math.floor(p * trailSegs));
    var trailPts = [];
    for (var i = 0; i <= trailN; i++) trailPts.push(curve.getPoint((i / trailN) * p));
    trailLine.geometry.dispose();
    trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPts);
    trailLineBold.geometry.dispose();
    trailLineBold.geometry = new THREE.BufferGeometry().setFromPoints(offsetPoints(trailPts, 0.04));
    trailLineBold2.geometry.dispose();
    trailLineBold2.geometry = new THREE.BufferGeometry().setFromPoints(offsetPoints(trailPts, 0.08));
    // Red dashed: from current position to end of lap
    var remainN = Math.max(3, Math.floor((1 - p) * trailSegs));
    var remainPts = [];
    for (var i = 0; i <= remainN; i++) remainPts.push(curve.getPoint(p + (i / remainN) * (1 - p)));
    remainLine.geometry.dispose();
    remainLine.geometry = new THREE.BufferGeometry().setFromPoints(remainPts);
    remainLine.computeLineDistances();
    remainLineBold.geometry.dispose();
    remainLineBold.geometry = new THREE.BufferGeometry().setFromPoints(offsetPoints(remainPts, 0.04));
    remainLineBold.computeLineDistances();
    remainLineBold2.geometry.dispose();
    remainLineBold2.geometry = new THREE.BufferGeometry().setFromPoints(offsetPoints(remainPts, 0.08));
    remainLineBold2.computeLineDistances();
  }

  function animate() {
    if (!isVisible) { animId = null; return; }
    time += 0.003;
    var progress = time % 1;
    // Move cyclist along curve
    var pos = curve.getPoint(progress);
    var tangent = curve.getTangent(progress).normalize();
    var angle = Math.atan2(tangent.x, tangent.z);
    bikeGroup.position.copy(pos);
    bikeGroup.position.y = 0.02 + Math.sin(time * 8) * 0.008;
    bikeGroup.rotation.y = -angle;
    bikeGroup.rotation.z = Math.sin(time * 12) * 0.015;
    buildTrails(progress);
    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();
  function handleResize() {
    var cw = container.clientWidth, ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;
    var a = cw / ch;
    camera.left = -3.2 * a; camera.right = 3.2 * a;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  }
  window.addEventListener('resize', handleResize, { passive: true });
}

// =============================================================================
// 9. Three.js — Scene 3: Rising Hands (CTA)
// =============================================================================
function initThreeRisingHands() {
  var container = document.querySelector('#three-hands');
  if (!container) return;
  if (typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var scene = new THREE.Scene();
  var w = container.clientWidth || 800;
  var h = container.clientHeight || 400;
  var camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0.5, 7);
  camera.lookAt(0, -0.5, 0);
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  container.appendChild(renderer.domElement);
  var pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(w, h, false);

  // Colors
  var cream = { r: 0.97, g: 0.96, b: 0.94 };
  var green = { r: 0.18, g: 0.42, b: 0.18 };
  var red = { r: 0.81, g: 0.07, b: 0.15 };
  function lerpC(a, b, t) { return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t }; }
  function colorAt(y, minY, maxY) {
    var t = (y - minY) / (maxY - minY);
    if (t < 0) return cream;
    if (t > 1) return red;
    if (t < 0.5) return lerpC(cream, green, t * 2);
    return lerpC(green, red, (t - 0.5) * 2);
  }

  function createHand() {
    var g = new THREE.Group();
    g.add(new THREE.Mesh(
      (function () { var g = new THREE.SphereGeometry(0.18, 8, 6); g.scale(1.3, 0.3, 0.7); return g; })(),
      new THREE.MeshBasicMaterial({ color: 0xCE1126, transparent: true, opacity: 0.45 })
    ));
    var fp = [
      { x: -0.06, y: 0.24, h: 0.18 }, { x: 0, y: 0.26, h: 0.22 },
      { x: 0.07, y: 0.24, h: 0.18 }, { x: 0.13, y: 0.21, h: 0.14 },
    ];
    for (var i = 0; i < fp.length; i++) {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, fp[i].h, 5),
        new THREE.MeshBasicMaterial({ color: 0xCE1126, transparent: true, opacity: 0.45 })));
      g.children[g.children.length - 1].position.set(fp[i].x, fp[i].y, 0);
    }
    var t = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.12, 5),
      new THREE.MeshBasicMaterial({ color: 0xCE1126, transparent: true, opacity: 0.45 }));
    t.position.set(-0.14, 0.08, -0.04);
    t.rotation.z = 0.4; t.rotation.x = -0.3;
    g.add(t);
    return g;
  }

  var hands = [];
  for (var i = 0; i < 20; i++) {
    var hand = createHand();
    var angle = (i / 20) * Math.PI * 2;
    var radius = 1.2 + Math.random() * 2.0;
    hand.position.x = Math.cos(angle + Math.random() * 0.5) * radius;
    hand.position.z = Math.sin(angle + Math.random() * 0.5) * radius - 0.8;
    var sY = -3 - Math.random() * 2.5;
    var eY = 0.5 + Math.random() * 2.0;
    hand.position.y = sY;
    hand.rotation.x = (Math.random() - 0.5) * 0.4;
    hand.rotation.z = (Math.random() - 0.5) * 0.4;
    scene.add(hand);
    hands.push({
      mesh: hand, startY: sY, endY: eY,
      speed: 0.003 + Math.random() * 0.006, phase: Math.random() * Math.PI * 2,
    });
  }

  var isVisible = true, animId = null, time = 0;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { isVisible = true; if (!animId) animate(); }
      else { isVisible = false; if (animId) { cancelAnimationFrame(animId); animId = null; } }
    });
  }, { threshold: 0.01 });
  io.observe(container.parentElement);

  function animate() {
    if (!isVisible) { animId = null; return; }
    time += 0.01;
    for (var i = 0; i < hands.length; i++) {
      var h = hands[i];
      h.mesh.position.y += h.speed;
      h.mesh.rotation.x += Math.sin(time + h.phase) * 0.002;
      h.mesh.rotation.z += Math.cos(time + h.phase * 1.3) * 0.002;
      h.mesh.position.x += Math.sin(time * 0.5 + h.phase) * 0.0004;
      var y = h.mesh.position.y;
      var col = colorAt(y, h.startY, h.endY);
      var op = 0.2 + 0.55 * Math.max(0, Math.min(1, (y - h.startY) / (h.endY - h.startY)));
      h.mesh.traverse(function (child) {
        if (child.isMesh && child.material) {
          child.material.color.setRGB(col.r, col.g, col.b);
          child.material.opacity = op;
        }
      });
      if (y > h.endY) {
        h.mesh.position.y = h.startY;
        h.mesh.traverse(function (child) { if (child.isMesh && child.material) child.material.opacity = 0.2; });
        var angle2 = Math.random() * Math.PI * 2;
        var radius2 = 1.2 + Math.random() * 2.0;
        h.mesh.position.x = Math.cos(angle2) * radius2;
        h.mesh.position.z = Math.sin(angle2) * radius2 - 0.8;
      }
    }
    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  function handleResize() {
    var cw = container.clientWidth, ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  }
  window.addEventListener('resize', handleResize, { passive: true });
}

// =============================================================================
// 10. Three.js — Scene 4: Particle Field (Hero left)
// =============================================================================
function initParticleField() {
  var container = document.querySelector('#particle-field');
  if (!container) return;
  if (typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var scene = new THREE.Scene();
  var w = container.clientWidth || 600;
  var h = container.clientHeight || 800;
  var camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  container.appendChild(renderer.domElement);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);

  // Particles
  var count = 200;
  var positions = new Float32Array(count * 3);
  var velocities = [];
  for (var i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    velocities.push({
      x: (Math.random() - 0.5) * 0.005,
      y: (Math.random() - 0.5) * 0.005,
    });
  }
  var geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var mat = new THREE.PointsMaterial({
    color: 0xCE1126, size: 0.04, transparent: true, opacity: 0.25,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  var particles = new THREE.Points(geom, mat);
  scene.add(particles);

  // Mouse gravity
  var mouse = { x: 0, y: 0 };
  var heroLeft = container.parentElement;
  function onMove(e) {
    var rect = heroLeft.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  heroLeft.addEventListener('mousemove', onMove, { passive: true });

  // Visibility
  var isVisible = true, animId = null;
  var heroSection = document.querySelector('.hero--home');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { isVisible = true; if (!animId) animate(); }
      else { isVisible = false; if (animId) { cancelAnimationFrame(animId); animId = null; } }
    });
  }, { threshold: 0.01 });
  if (heroSection) io.observe(heroSection);

  function animate() {
    if (!isVisible) { animId = null; return; }
    var pos = particles.geometry.attributes.position.array;
    for (var i = 0; i < count; i++) {
      // Random drift
      pos[i * 3] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      // Mouse gravity
      var dx = mouse.x * 5 - pos[i * 3];
      var dy = mouse.y * 4 - pos[i * 3 + 1];
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        pos[i * 3] += dx * 0.002;
        pos[i * 3 + 1] += dy * 0.002;
      }
      // Wrap edges
      if (pos[i * 3] > 5) pos[i * 3] = -5;
      if (pos[i * 3] < -5) pos[i * 3] = 5;
      if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4;
      if (pos[i * 3 + 1] < -4) pos[i * 3 + 1] = 4;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  function handleResize() {
    var cw = container.clientWidth, ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  }
  window.addEventListener('resize', handleResize, { passive: true });
}

// =============================================================================
// 11. Three.js — Scene 5: Falling Coins (Donate page)
// =============================================================================
function initThreeFallingCoins() {
  var container = document.querySelector('#three-coins');
  if (!container) return;
  if (typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var scene = new THREE.Scene();
  var w = container.clientWidth || 800;
  var h = container.clientHeight || 600;

  var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 1, 6);
  camera.lookAt(0, -1, 0);

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  container.appendChild(renderer.domElement);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);

  // Lights
  var ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(2, 5, 3);
  scene.add(dirLight);
  var dirLight2 = new THREE.DirectionalLight(0xffdd99, 0.3);
  dirLight2.position.set(-2, 3, -2);
  scene.add(dirLight2);

  // Coins
  var coinMat = new THREE.MeshStandardMaterial({
    color: 0xb8960c, metalness: 0.8, roughness: 0.2,
  });
  var coins = [];
  var coinCount = 40;
  for (var i = 0; i < coinCount; i++) {
    var coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.04, 24),
      coinMat
    );
    coin.position.x = (Math.random() - 0.5) * 8;
    coin.position.y = Math.random() * 12 - 4;
    coin.position.z = (Math.random() - 0.5) * 5;
    coin.rotation.x = Math.random() * Math.PI;
    coin.rotation.y = Math.random() * Math.PI;
    coin.userData = {
      fallSpeed: 0.005 + Math.random() * 0.015,
      rotSpeedX: (Math.random() - 0.5) * 0.02,
      rotSpeedY: (Math.random() - 0.5) * 0.02,
    };
    scene.add(coin);
    coins.push(coin);
  }

  // Visibility
  var isVisible = true, animId = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { isVisible = true; if (!animId) animate(); }
      else { isVisible = false; if (animId) { cancelAnimationFrame(animId); animId = null; } }
    });
  }, { threshold: 0.01 });
  io.observe(container);

  function animate() {
    if (!isVisible) { animId = null; return; }
    for (var i = 0; i < coins.length; i++) {
      var c = coins[i];
      c.position.y -= c.userData.fallSpeed;
      c.rotation.x += c.userData.rotSpeedX;
      c.rotation.y += c.userData.rotSpeedY;
      if (c.position.y < -6) {
        c.position.y = 6;
        c.position.x = (Math.random() - 0.5) * 8;
        c.position.z = (Math.random() - 0.5) * 5;
      }
    }
    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  function handleResize() {
    var cw = container.clientWidth, ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  }
  window.addEventListener('resize', handleResize, { passive: true });
}

// =============================================================================
// 12. Elva Horizontal Scroll — Liquid Glass (About page)
// =============================================================================
function initElvaScroll() {
  var wrapper = document.querySelector('#about-wrapper');
  if (!wrapper) return;

  var track = wrapper.querySelector('.about-track');
  if (!track) return;

  var panels = wrapper.querySelectorAll('.panel');
  var glow = document.querySelector('#about-glow');
  var counterCurrent = document.querySelector('#panel-current');
  var ticking = false;

  // Glow color stops for each panel: hex values for gradient
  var glowColors = [
    { r: 206, g: 17, b: 38 },   // Panel 1: red
    { r: 45, g: 106, b: 45 },   // Panel 2: green
    { r: 45, g: 106, b: 45 },   // Panel 3: green
    { r: 206, g: 17, b: 38 },   // Panel 4: red
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function updatePanels(progress) {
    var active = Math.round(Math.max(0, Math.min(progress, 1)) * (panels.length - 1));
    panels.forEach(function (p, i) {
      p.classList.toggle('panel--active', i === active);
    });

    // Update panel counter
    if (counterCurrent) {
      counterCurrent.textContent = (active + 1).toString().padStart(2, '0');
    }

    // Update glow overlay
    if (glow) {
      var segment = progress * (panels.length - 1);
      var idx = Math.min(Math.floor(segment), panels.length - 2);
      var t = segment - idx;
      var c1 = glowColors[idx] || glowColors[0];
      var c2 = glowColors[Math.min(idx + 1, glowColors.length - 1)] || c1;
      var r = Math.round(lerp(c1.r, c2.r, t));
      var g = Math.round(lerp(c1.g, c2.g, t));
      var b = Math.round(lerp(c1.b, c2.b, t));
      glow.style.background =
        'radial-gradient(ellipse 80% 50% at 50% 50%, ' +
        'rgba(' + r + ',' + g + ',' + b + ',0.12) 0%, ' +
        'rgba(' + r + ',' + g + ',' + b + ',0.04) 50%, ' +
        'transparent 80%)';
    }
  }

  function handleScroll() {
    var rect = wrapper.getBoundingClientRect();
    var viewportH = window.innerHeight;
    var scrollable = rect.height - viewportH;
    if (scrollable <= 0) return;
    var progress = -rect.top / scrollable;
    var clamped = Math.max(0, Math.min(1, progress));
    var translateX = clamped * -300;
    track.style.transform = 'translateX(' + translateX + 'vw)';
    updatePanels(clamped);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  handleScroll();
}

// =============================================================================
// 12b. Ripple Pool Animation (Donate)
// =============================================================================

function initRipplePool(canvas) {
  if (typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var w = canvas.clientWidth || window.innerWidth;
  var h = canvas.clientHeight || window.innerHeight;
  var isMobile = window.innerWidth < 768;
  var segments = isMobile ? 64 : 128;

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.set(0, 8, 0);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  canvas.appendChild(renderer.domElement);

  // Lights
  var ambient = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambient);
  var dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // Water surface
  var geo = new THREE.PlaneGeometry(20, 20, segments, segments);
  geo.rotateX(-Math.PI / 2);

  var mat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.9,
    roughness: 0.1,
  });

  var mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Ripple state
  var activeRipples = [];
  var maxRipples = isMobile ? 4 : 8;

  function addRipple(x, z, amplitude, startTime) {
    if (activeRipples.length >= maxRipples) {
      activeRipples.shift();
    }
    activeRipples.push({
      x: x,
      z: z,
      amplitude: amplitude,
      startTime: startTime || performance.now(),
    });
  }

  // Auto-ripple every 2500ms at random positions
  setInterval(function () {
    var x = (Math.random() - 0.5) * 16;
    var z = (Math.random() - 0.5) * 16;
    addRipple(x, z, 0.4);
  }, 2500);

  // Donate button burst
  var donateBtn = document.querySelector('.btn--donate-large');
  if (donateBtn) {
    donateBtn.addEventListener('click', function () {
      var rect = donateBtn.getBoundingClientRect();
      var x = ((rect.left + rect.width / 2) / window.innerWidth) * 20 - 10;
      var z = ((rect.top + rect.height / 2) / window.innerHeight) * 20 - 10;
      addRipple(x, z, 1.2, performance.now());
      addRipple(x + 1, z, 0.6, performance.now());
      addRipple(x - 1, z, 0.6, performance.now() + 150);
      addRipple(x, z + 1, 0.6, performance.now() + 300);
    });
  }

  // Render loop
  var animId = null;

  function animate() {
    var now = performance.now();
    var pos = geo.attributes.position.array;

    // Reset y to base plane
    for (var i = 1; i < pos.length; i += 3) {
      pos[i] = 0;
    }

    // Apply each ripple displacement
    for (var r = activeRipples.length - 1; r >= 0; r--) {
      var ripple = activeRipples[r];
      var elapsed = (now - ripple.startTime) / 1000;
      if (elapsed > 3) {
        activeRipples.splice(r, 1);
        continue;
      }
      for (var j = 0; j < pos.length; j += 3) {
        var dx = pos[j] - ripple.x;
        var dz = pos[j + 2] - ripple.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var wave = ripple.amplitude * Math.sin(dist * 8 - elapsed * 5);
        var decay = Math.exp(-dist * 0.5) * Math.exp(-elapsed * 1.5);
        pos[j + 1] += wave * decay;
      }
    }

    geo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }

  // Pause when tab hidden
  function handleVisibility() {
    if (document.hidden) {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    } else {
      if (!animId) animate();
    }
  }
  document.addEventListener('visibilitychange', handleVisibility);

  // Resize
  function handleResize() {
    var cw = canvas.clientWidth || window.innerWidth;
    var ch = canvas.clientHeight || window.innerHeight;
    if (cw === 0 || ch === 0) return;
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
  }
  window.addEventListener('resize', handleResize, { passive: true });

  animate();
}

// =============================================================================
// 13. Init
// =============================================================================
function init() {
  initNav();
  initHamburger();
  initProgressBar();
  initFadeUp();
  initSimpleCounters();
  initFlipCounters();
  initThreeCyclistTrack();
  initThreeRisingHands();
  initParticleField();
  initElvaScroll();

  var rippleCanvas = document.querySelector('#ripple-canvas');
  if (rippleCanvas) initRipplePool(rippleCanvas);
}

document.addEventListener('DOMContentLoaded', init);
