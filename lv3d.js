/* LV3D: small calm 3D scenes for lecture slides (Three.js r128, global THREE). */
(function () {
  'use strict';
  var PAL = ['#00664a', '#2f9e6e', '#c9a227', '#4f86a8', '#8e6cc6', '#d07a5a'];
  var EC = { C: '#4a5753', H: '#e6ebe8', O: '#d65a4f', N: '#3d6fd1', S: '#e2b33c', P: '#e58a2f', F: '#57b36a', Cl: '#57b36a',
    Br: '#a0522d', I: '#7d3c98', Na: '#8e6cc6', K: '#8e6cc6', Mg: '#3fa66a', Ca: '#3fa66a', Fe: '#c46a32', Se: '#d9a441' };
  var ER = { H: 0.2, F: 0.28, S: 0.42, P: 0.42, Cl: 0.42, Br: 0.48, I: 0.5, Se: 0.44 };
  function ecol(e) { return EC[e] || '#9aa5a1'; }
  function erad(e) { return ER[e] || (EC[e] || e === 'C' ? 0.3 : 0.4); }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function sstep(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  function Ctx(THREE) {
    var C = { T: THREE, geos: [], mats: [] };
    var V = THREE.Vector3, Q = THREE.Quaternion, M4 = THREE.Matrix4, O = new THREE.Object3D();
    var up = new V(0, 1, 0), vd = new V(), qq = new Q(), col = new THREE.Color(), one = new V(1, 1, 1);
    C.g = function (g) { C.geos.push(g); return g; };
    C.m = function (m) { C.mats.push(m); return m; };
    C.phong = function (o) { o = o || {}; o.shininess = o.shininess || 45; o.specular = new THREE.Color(o.spec || 0x3a3f3d); delete o.spec; return C.m(new THREE.MeshPhongMaterial(o)); };
    C.basic = function (o) { return C.m(new THREE.MeshBasicMaterial(o)); };
    // instanced spheres: set(i,x,y,z,radius,hex)
    C.spheres = function (n, mat, seg) {
      var mesh = new THREE.InstancedMesh(C.g(new THREE.SphereGeometry(1, seg ? seg[0] : 16, seg ? seg[1] : 12)), mat || C.phong({ color: 0xffffff }), Math.max(n, 1));
      mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = n;
      mesh.set = function (i, x, y, z, r, hex) { O.position.set(x, y, z); O.quaternion.set(0, 0, 0, 1); O.scale.set(r, r, r); O.updateMatrix(); mesh.setMatrixAt(i, O.matrix); if (hex !== undefined) mesh.setColorAt(i, col.set(hex)); };
      mesh.done = function () { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
      return mesh;
    };
    // instanced cylinders between two points: set(i,ax,ay,az,bx,by,bz,radius,hex)
    C.cyls = function (n, mat, rad) {
      var mesh = new THREE.InstancedMesh(C.g(new THREE.CylinderGeometry(1, 1, 1, rad || 8, 1, false)), mat || C.phong({ color: 0xffffff }), Math.max(n, 1));
      mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.count = n;
      mesh.set = function (i, ax, ay, az, bx, by, bz, r, hex) {
        vd.set(bx - ax, by - ay, bz - az); var L = vd.length() || 1e-6; vd.multiplyScalar(1 / L);
        qq.setFromUnitVectors(up, vd); O.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); O.quaternion.copy(qq); O.scale.set(r, L, r); O.updateMatrix();
        mesh.setMatrixAt(i, O.matrix); if (hex !== undefined) mesh.setColorAt(i, col.set(hex));
      };
      mesh.done = mesh.done || function () { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
      return mesh;
    };
    C.lobeGeo = function (L, w, p) { // teardrop lobe along +y, pinched at the origin
      var pts = [], i, k = 28, mx = 0, f = function (u) { return Math.pow(u, 1.15) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2.6))); };
      for (i = 0; i <= k; i++) mx = Math.max(mx, f(i / k + 0.0001));
      for (i = 0; i <= k; i++) { var u = i / k; pts.push(new THREE.Vector2(w * f(u) / mx + 0.0001, L * u)); }
      return C.g(new THREE.LatheGeometry(pts, 28));
    };
    C.line = function (arr, hex, op) {
      var g = C.g(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)));
      return new THREE.LineSegments(g, C.m(new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: op })));
    };
    C.boxEdges = function (sx, sy, sz, hex, op) {
      var x = sx / 2, y = sy / 2, z = sz / 2, a = [], c = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]],
        e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
      for (var i = 0; i < e.length; i++) a.push(c[e[i]][0], c[e[i]][1], c[e[i]][2]);
      return C.line(a, hex, op);
    };
    return C;
  }

  /* ---------- 1. molecule ---------- */
  function buildMol(C, m) {
    var THREE = C.T, el = m.el, xyz = m.xyz, b = m.b || [], n = el.length, i, j, k, g = new THREE.Group(), nb = [], nc = 0, R = 0;
    for (i = 0; i < n; i++) nb.push([]);
    for (i = 0; i < b.length; i += 3) { nb[b[i]].push([b[i + 1], b[i + 2]]); nb[b[i + 1]].push([b[i], b[i + 2]]); nc += (b[i + 2] === 2 ? 2 : b[i + 2] === 3 ? 3 : b[i + 2] === 4 ? 3 : 1) * 2; }
    var at = C.spheres(n, null, [20, 14]);
    for (i = 0; i < n; i++) { at.set(i, xyz[3 * i], xyz[3 * i + 1], xyz[3 * i + 2], erad(el[i]), ecol(el[i])); R = Math.max(R, Math.hypot(xyz[3 * i], xyz[3 * i + 1], xyz[3 * i + 2]) + erad(el[i])); }
    at.done(); g.add(at);
    var cy = C.cyls(nc), ci = 0, P = function (a) { return [xyz[3 * a], xyz[3 * a + 1], xyz[3 * a + 2]]; };
    function half(a, c, o, r, f0, f1) { // bond a-c split in two colour halves, offset o (vec), span f0..f1
      var A = P(a), B = P(c), s = [], t = [], q;
      for (q = 0; q < 3; q++) { s.push(A[q] + (B[q] - A[q]) * f0 + o[q]); t.push(A[q] + (B[q] - A[q]) * f1 + o[q]); }
      var mid = [(s[0] + t[0]) / 2, (s[1] + t[1]) / 2, (s[2] + t[2]) / 2];
      cy.set(ci++, s[0], s[1], s[2], mid[0], mid[1], mid[2], r, ecol(el[a])); cy.set(ci++, mid[0], mid[1], mid[2], t[0], t[1], t[2], r, ecol(el[c]));
    }
    for (k = 0; k < b.length; k += 3) {
      i = b[k]; j = b[k + 1]; var ord = b[k + 2], A = P(i), B = P(j), d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, q;
      d = [d[0] / L, d[1] / L, d[2] / L];
      var ref = null, cands = nb[i].filter(function (e) { return e[0] !== j; }).map(function (e) { return [i, e]; }).concat(nb[j].filter(function (e) { return e[0] !== i; }).map(function (e) { return [j, e]; }));
      if (ord === 4) { var ar = cands.filter(function (e) { return e[1][1] === 4; }); if (ar.length) cands = ar; }
      if (cands.length) { var cc = cands[0], base = P(cc[0]), nn = P(cc[1][0]); ref = [nn[0] - base[0], nn[1] - base[1], nn[2] - base[2]]; }
      if (!ref || Math.abs(ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2]) > 0.98 * Math.hypot(ref[0], ref[1], ref[2])) ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      var dot = ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2], pp = [ref[0] - d[0] * dot, ref[1] - d[1] * dot, ref[2] - d[2] * dot], pl = Math.hypot(pp[0], pp[1], pp[2]) || 1;
      pp = [pp[0] / pl, pp[1] / pl, pp[2] / pl];
      var off = function (s) { return [pp[0] * s, pp[1] * s, pp[2] * s]; };
      if (ord === 2) { half(i, j, off(0.1), 0.055, 0, 1); half(i, j, off(-0.1), 0.055, 0, 1); }
      else if (ord === 3) { half(i, j, off(0), 0.055, 0, 1); half(i, j, off(0.15), 0.05, 0, 1); half(i, j, off(-0.15), 0.05, 0, 1); }
      else if (ord === 4) { half(i, j, off(-0.04), 0.075, 0, 1); half(i, j, off(0.2), 0.04, 0.2, 0.8); half(i, j, off(0.2), 0.0, 0, 0); }
      else half(i, j, off(0), 0.09, 0, 1);
    }
    cy.count = ci; cy.done(); g.add(cy);
    return { obj: g, r: R + 0.3 };
  }

  /* ---------- 2. protein / nucleic ---------- */
  function tubeGeo(C, pts, rad, cols, radial) {
    var THREE = C.T, n = pts.length, N = (n - 1) * 3, curve = new THREE.CatmullRomCurve3(pts), fr = curve.computeFrenetFrames(N, false), pos = [], nor = [], colr = [], idx = [], i, j, p = new THREE.Vector3(), nm = new THREE.Vector3(), c1 = new THREE.Color();
    function at(u, arr) { var f = u * (n - 1), a = Math.min(n - 2, Math.floor(f)), t = f - a; t = t * t * (3 - 2 * t); return arr[a] * (1 - t) + arr[a + 1] * t; }
    for (i = 0; i <= N; i++) {
      var u = i / N, f = u * (n - 1), a = Math.min(n - 2, Math.floor(f)), t = f - a, r = at(u, rad); curve.getPoint(u, p); c1.copy(cols[a]).lerp(cols[a + 1], t);
      for (j = 0; j < radial; j++) { var an = j / radial * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an); nm.copy(fr.normals[i]).multiplyScalar(cs).addScaledVector(fr.binormals[i], sn);
        pos.push(p.x + nm.x * r, p.y + nm.y * r, p.z + nm.z * r); nor.push(nm.x, nm.y, nm.z); colr.push(c1.r, c1.g, c1.b); }
    }
    for (i = 0; i < N; i++) for (j = 0; j < radial; j++) { var a0 = i * radial + j, a1 = i * radial + (j + 1) % radial, b0 = a0 + radial, b1 = a1 + radial; idx.push(a0, b0, a1, a1, b0, b1); }
    [0, N].forEach(function (e) { // end caps
      var base = pos.length / 3, tg = fr.tangents[e], s = e ? 1 : -1; curve.getPoint(e / N, p); c1.copy(cols[e ? n - 1 : 0]);
      pos.push(p.x, p.y, p.z); nor.push(tg.x * s, tg.y * s, tg.z * s); colr.push(c1.r, c1.g, c1.b);
      for (j = 0; j < radial; j++) { var o = (e * radial + j) * 3; pos.push(pos[e * radial * 3 + j * 3], pos[e * radial * 3 + j * 3 + 1], pos[e * radial * 3 + j * 3 + 2]); nor.push(tg.x * s, tg.y * s, tg.z * s); colr.push(c1.r, c1.g, c1.b); }
      for (j = 0; j < radial; j++) { var q0 = base + 1 + j, q1 = base + 1 + (j + 1) % radial; if (e) idx.push(base, q0, q1); else idx.push(base, q1, q0); }
    });
    var g = C.g(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
    return g;
  }
  function buildProtein(C, m) {
    var THREE = C.T, g = new THREE.Group(), segs = m.segs || [], mat = C.phong({ vertexColors: true, shininess: 55 }), all = [], i, s, k;
    var hel = new THREE.Color('#00664a'), str = new THREE.Color('#c9a227'), coil = new THREE.Color('#a9b9b3'), white = new THREE.Color('#ffffff');
    segs.forEach(function (sg, si) {
      var n = sg.xyz.length / 3; if (n < 2) return;
      var P = [], ss = sg.ss && sg.ss.length >= n ? sg.ss : null, rad = [], cols = [], nuc = sg.k === 'n';
      for (k = 0; k < n; k++) P.push([sg.xyz[3 * k], sg.xyz[3 * k + 1], sg.xyz[3 * k + 2]]);
      if (false) { // pull helix points onto a smooth axis so helices read as clean rods
        var Q2 = P.map(function (p) { return p.slice(); });
        for (k = 0; k < n; k++) if (ss[k] === 'h') {
          var lo = k, hi = k; while (lo > k - 1 && lo > 0 && ss[lo - 1] === 'h') lo--; while (hi < k + 2 && hi < n - 1 && ss[hi + 1] === 'h') hi++;
          var cnt = hi - lo + 1, f = Math.max(0, (cnt - 1) / 3), av = [0, 0, 0], q;
          for (q = lo; q <= hi; q++) { av[0] += P[q][0] / cnt; av[1] += P[q][1] / cnt; av[2] += P[q][2] / cnt; }
          for (q = 0; q < 3; q++) Q2[k][q] = P[k][q] * (1 - f) + av[q] * f;
        }
        P = Q2;
      }
      var tint = Math.min(0.5, 0.2 * (sg.c || 0));
      for (k = 0; k < n; k++) {
        var c = new THREE.Color();
        if (nuc) { c.set(si % 2 ? '#d65a4f' : '#e58a2f'); rad.push(0.9); }
        else if (ss) { var t = ss[k]; if (m.nch > 1) { c.set(PAL[(sg.c || 0) % PAL.length]); if (t === 'c') c.lerp(white, 0.35); } else c.copy(t === 'h' ? hel : t === 'e' ? str : coil); rad.push(t === 'h' ? 0.78 : t === 'e' ? 0.66 : 0.42); }
        else {
          if (m.nch > 1 || segs.length > 1) c.set(PAL[(sg.c || 0) % PAL.length]);
          else { var u = k / (n - 1); c.set(u < 0.5 ? '#00664a' : '#2f9e6e').lerp(new THREE.Color(u < 0.5 ? '#2f9e6e' : '#c9a227'), (u < 0.5 ? u : u - 0.5) * 2); }
          rad.push(0.55);
        }
        cols.push(c);
      }
      for (k = 0; k < 2; k++) for (i = 0; i < 2; i++) { var sm = rad.slice(); for (var z = 1; z < n - 1; z++) sm[z] = (rad[z - 1] + 2 * rad[z] + rad[z + 1]) / 4; rad = sm; }
      var tp = P.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
      g.add(new THREE.Mesh(tubeGeo(C, tp, rad, cols, 8), mat));
      tp.forEach(function (p) { all.push(p.x, p.y, p.z); });
    });
    var het = m.het || [], nh = het.length / 4;
    if (nh) { var hs = C.spheres(nh); for (i = 0; i < nh; i++) { var e = het[4 * i]; hs.set(i, het[4 * i + 1], het[4 * i + 2], het[4 * i + 3], e === 'H' ? 0.25 : (e === 'C' || e === 'N' || e === 'O') ? 0.36 : 0.55, ecol(e)); all.push(het[4 * i + 1], het[4 * i + 2], het[4 * i + 3]); } hs.done(); g.add(hs); }
    // centre on bounding-box middle
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (i = 0; i < all.length; i += 3) for (k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], all[i + k]); mx[k] = Math.max(mx[k], all[i + k]); }
    var c0 = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], R = 1;
    for (i = 0; i < all.length; i += 3) R = Math.max(R, Math.hypot(all[i] - c0[0], all[i + 1] - c0[1], all[i + 2] - c0[2]));
    var w = new THREE.Group(); g.position.set(-c0[0], -c0[1], -c0[2]); w.add(g);
    return { obj: w, r: R + 1.2 };
  }

  /* ---------- 3. atom (Bohr) ---------- */
  function buildAtom(C, m) {
    var THREE = C.T, g = new THREE.Group(), sh = m.shells || [2], i, k, ne = 0;
    sh.forEach(function (x) { ne += x; });
    var nuc, fib = Math.PI * (3 - Math.sqrt(5)), np = m.p | 0, nn = m.n | 0;
    if (np > 0 && np + nn <= 40) { // exact nucleus: np protons (red) and nn neutrons (gray), packed as a ball
      var tot = np + nn, ord = [], q;
      for (q = 0; q < tot; q++) ord.push([(Math.sin(q * 12.9898 + 4.1) * 43758.5453) % 1, q]);
      ord.sort(function (u, w) { return u[0] - w[0]; }); var isPr = {}; for (q = 0; q < np; q++) isPr[ord[q][1]] = 1;
      nuc = C.spheres(tot); var X = [], it, j, D = 0.5;
      for (i = 0; i < tot; i++) { var yy = 1 - 2 * ((i + 0.5) / tot), r2 = Math.sqrt(1 - yy * yy), th2 = i * fib, rad = 0.6; X.push([rad * r2 * Math.cos(th2), rad * yy, rad * r2 * Math.sin(th2)]); }
      for (it = 0; it < 160; it++) { // pack: pull to the centre, push overlapping nucleons apart
        for (i = 0; i < tot; i++) { X[i][0] *= 0.97; X[i][1] *= 0.97; X[i][2] *= 0.97; }
        for (i = 0; i < tot; i++) for (j = i + 1; j < tot; j++) { var dx = X[j][0] - X[i][0], dy = X[j][1] - X[i][1], dz = X[j][2] - X[i][2], dd = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-3;
          if (dd < D) { var f = (D - dd) / dd * 0.5; X[i][0] -= dx * f; X[i][1] -= dy * f; X[i][2] -= dz * f; X[j][0] += dx * f; X[j][1] += dy * f; X[j][2] += dz * f; } } }
      for (i = 0; i < tot; i++) nuc.set(i, X[i][0], X[i][1], X[i][2], 0.26, isPr[i] ? '#d65a4f' : '#b9c2bf');
    } else {
      nuc = C.spheres(17); nuc.set(0, 0, 0, 0, 0.27, '#d65a4f');
      for (i = 1; i < 17; i++) { var y = 1 - 2 * (i - 0.5) / 16, rr = Math.sqrt(1 - y * y), th = i * fib; nuc.set(i, 0.55 * rr * Math.cos(th), 0.55 * y, 0.55 * rr * Math.sin(th), 0.27, i % 2 ? '#d65a4f' : '#b9c2bf'); }
    }
    nuc.done(); g.add(nuc);
    var ringMat = C.basic({ color: 0x8a9a94, transparent: true, opacity: 0.4 }), el = C.spheres(ne, C.phong({ color: 0xffffff, emissive: new THREE.Color('#2f9e6e'), emissiveIntensity: 0.55, shininess: 80 })),
      halo = C.spheres(ne, C.basic({ color: 0x2f9e6e, transparent: true, opacity: 0.16, depthWrite: false }), [12, 8]), rings = [], R = 0;
    for (k = 0; k < sh.length; k++) {
      var r = 1.9 + 1.55 * k, rot = new THREE.Euler(Math.PI / 2 + 0.3 * Math.sin(1.9 * k + 0.6), 0.25 * Math.cos(1.3 * k), 0.3 * Math.sin(2.3 * k + 1), 'XYZ');
      var tor = new THREE.Mesh(C.g(new THREE.TorusGeometry(r, 0.02, 6, 120)), ringMat); tor.rotation.copy(rot); g.add(tor);
      rings.push({ r: r, q: new THREE.Quaternion().setFromEuler(rot), n: sh[k], w: 1.5 / (1 + 0.45 * k), ph: k * 0.9 }); R = r;
    }
    g.add(halo); g.add(el);
    var v = new THREE.Vector3(), es = ne > 40 ? 0.15 : 0.19;
    function tick(t) {
      var idx = 0;
      rings.forEach(function (rg) { for (var e = 0; e < rg.n; e++) { var a = rg.ph + e / rg.n * Math.PI * 2 + t * rg.w; v.set(rg.r * Math.cos(a), rg.r * Math.sin(a), 0).applyQuaternion(rg.q); el.set(idx, v.x, v.y, v.z, es, '#2f9e6e'); halo.set(idx, v.x, v.y, v.z, es * 2.3, '#2f9e6e'); idx++; } });
      el.done(); halo.done();
    }
    tick(0);
    var w = new THREE.Group(); g.rotation.x = 0.5; w.add(g);
    return { obj: w, r: R + 0.9, tick: tick };
  }

  /* ---------- 4. crystal ---------- */
  function buildCrystal(C, m) {
    var THREE = C.T, g = new THREE.Group(), d = 2.9, ions = [], i, j, k, ed = [];
    var cat = m.a === 'Na' || !m.a ? '#8e6cc6' : ecol(m.a), an = m.b === 'Cl' || !m.b ? '#57b36a' : ecol(m.b);
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) ions.push({ p: [(i - 1) * d, (j - 1) * d, (k - 1) * d], an: (i + j + k) % 2 === 0, ph: (i * 7 + j * 3 + k) * 1.3, i: [i, j, k] });
    function id(a, b, c) { return a * 9 + b * 3 + c; }
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) { if (i < 2) ed.push([id(i, j, k), id(i + 1, j, k)]); if (j < 2) ed.push([id(i, j, k), id(i, j + 1, k)]); if (k < 2) ed.push([id(i, j, k), id(i, j, k + 1)]); }
    var sp = C.spheres(27), cy = C.cyls(ed.length, C.phong({ color: 0xcfd9d5, shininess: 20, transparent: true, opacity: 0.8 })), cur = ions.map(function () { return [0, 0, 0]; });
    function tick(t) {
      var s = 1 + 0.03 * Math.sin(1.5 * t);
      ions.forEach(function (o, n) { var q = cur[n], a = 0.05 * Math.sin(2.7 * t + o.ph); for (var z = 0; z < 3; z++) q[z] = o.p[z] * s + a * (z === 0 ? 1 : z === 1 ? -0.7 : 0.5); sp.set(n, q[0], q[1], q[2], o.an ? 1.05 : 0.72, o.an ? an : cat); });
      ed.forEach(function (e, n) { var a = cur[e[0]], b = cur[e[1]]; cy.set(n, a[0], a[1], a[2], b[0], b[1], b[2], 0.05, '#cfd9d5'); });
      sp.done(); cy.done();
    }
    tick(0); g.add(cy); g.add(sp);
    return { obj: g, r: Math.sqrt(3) * d + 1.2, tick: tick };
  }

  /* ---------- 5. DNA ---------- */
  function buildDNA(C, m) {
    var THREE = C.T, g = new THREE.Group(), bp = Math.max(4, m.bp || 12), step = Math.PI * 2 / 10.5, rise = 3.4, R = 10, dl = 2.2, seq = 'ATGCGTACGTTAGC', comp = { A: 'T', T: 'A', G: 'C', C: 'G' },
      bc = { A: '#d65a4f', T: '#c9a227', G: '#4f86a8', C: '#2f9e6e' }, h = (bp - 1) * rise, i, s;
    function P(i, off) { var a = i * step + off; return new THREE.Vector3(R * Math.cos(a), i * rise - h / 2, R * Math.sin(a)); }
    for (s = 0; s < 2; s++) {
      var pts = [], steps = (bp + 1) * 4;
      for (i = -1; i <= bp + 0.001; i += 0.25) pts.push(P(i, s ? dl : 0));
      var crv = new THREE.CatmullRomCurve3(pts), geo = C.g(new THREE.TubeGeometry(crv, pts.length * 3, 1.15, 10, false));
      g.add(new THREE.Mesh(geo, C.phong({ color: s ? '#2f9e6e' : '#00664a', shininess: 60 })));
      [pts[0], pts[pts.length - 1]].forEach(function (p) { var sp = new THREE.Mesh(C.g(new THREE.SphereGeometry(1.15, 12, 8)), C.phong({ color: s ? '#2f9e6e' : '#00664a', shininess: 60 })); sp.position.copy(p); g.add(sp); });
    }
    var boxG = C.g(new THREE.BoxGeometry(1, 1, 1)), mesh = new THREE.InstancedMesh(boxG, C.phong({ color: 0xffffff, shininess: 40 }), bp * 2), O = new THREE.Object3D(), mx = new THREE.Matrix4(), c = new THREE.Color();
    mesh.frustumCulled = false;
    for (i = 0; i < bp; i++) {
      var A = P(i, 0), B = P(i, dl), dir = B.clone().sub(A), L = dir.length(), x = dir.clone().normalize(), y = new THREE.Vector3(0, 1, 0), z = new THREE.Vector3().crossVectors(x, y);
      var b1 = seq[i % seq.length], b2 = comp[b1], q = new THREE.Quaternion().setFromRotationMatrix(mx.makeBasis(x, y, z));
      [[0, b1, 1], [1, b2, -1]].forEach(function (e) {
        var base = e[2] > 0 ? A : B, len = L / 2 - 0.15, ctr = base.clone().addScaledVector(x, e[2] * (len / 2 + 0.6));
        O.position.copy(ctr); O.quaternion.copy(q); O.scale.set(len - 0.6, 1.0, 2.2); O.updateMatrix(); mesh.setMatrixAt(i * 2 + e[0], O.matrix); mesh.setColorAt(i * 2 + e[0], c.set(bc[e[1]]));
      });
    }
    g.add(mesh);
    return { obj: g, r: Math.sqrt(Math.pow(h / 2 + 4.8, 2) + Math.pow(R + 1.5, 2)) };
  }

  /* ---------- 6. membrane ---------- */
  function buildMembrane(C, m) {
    var THREE = C.T, g = new THREE.Group(), sp = 6.6, nx = 9, rnd = rng(7), heads = [], tails = [], i, j, s, half = (nx - 1) * sp / 2, T = 15.5, H = 18.5;
    for (s = 0; s < 2; s++) for (j = 0; j < nx; j++) for (i = 0; i < nx; i++) {
      var x = i * sp - half + (j % 2 ? sp / 2 - sp / 4 : -sp / 4) + (rnd() - 0.5) * 1.0, z = j * sp - half + (rnd() - 0.5) * 1.0, sg = s ? -1 : 1;
      if (m.protein && Math.hypot(x, z) < 17) continue;
      heads.push({ x: x, z: z, y: sg * H, sg: sg, ph: rnd() * 6.28, hex: rnd() < 0.15 ? '#00664a' : '#4f86a8' });
      for (var t = -1; t <= 1; t += 2) { var tx = x + t * 1.5, kx = (rnd() - 0.5) * 1.6, kz = (rnd() - 0.5) * 1.6; tails.push([tx, z, sg, kx, kz]); }
    }
    var hs = C.spheres(heads.length, C.phong({ color: 0xffffff, shininess: 70, spec: 0x666666 }), [16, 12]), tc = C.cyls(tails.length * 2, C.phong({ color: 0xffffff, shininess: 25 }), 8);
    tails.forEach(function (t, n) { var y0 = t[2] * (H - 1.5), ym = t[2] * (H - 1.5 - T / 2), y1 = t[2] * 2.2, mx = t[0] + t[3], mz = t[1] + t[4], c = n % 2 ? '#e3cf8a' : '#ead9a0';
      tc.set(2 * n, t[0], y0, t[1], mx, ym, mz, 0.42, c); tc.set(2 * n + 1, mx, ym, mz, t[0], y1, t[1], 0.42, c); });
    tc.done(); g.add(tc);
    function tick(t) { heads.forEach(function (h, n) { hs.set(n, h.x, h.y + h.sg * 0.35 * Math.sin(1.4 * t + h.ph), h.z, 2.2, h.hex); }); hs.done(); }
    tick(0); g.add(hs);
    if (m.protein) {
      var cols = ['#00664a', '#1f8460', '#00664a', '#2f9e6e', '#00664a', '#1f8460', '#2f9e6e'], hm = C.phong({ color: 0xffffff, shininess: 60 }), n = 7, ph = 0.25;
      var hc = C.cyls(n, hm, 14), cp = C.spheres(n * 2, hm, [14, 10]);
      for (i = 0; i < n; i++) {
        var a = i / n * Math.PI * 2, rr = 10.2 + (i % 2) * 0.3, tl = 0.16 * Math.sin(i * 2.1), cx = rr * Math.cos(a), cz = rr * Math.sin(a), hl = 21;
        var dx = Math.cos(a + 1.57) * tl, dz = Math.sin(a + 1.57) * tl;
        var ax = cx - dx * hl, az = cz - dz * hl, bx = cx + dx * hl, bz = cz + dz * hl;
        hc.set(i, ax, -hl, az, bx, hl, bz, 2.3, cols[i]); cp.set(2 * i, ax, -hl, az, 2.3, cols[i]); cp.set(2 * i + 1, bx, hl, bz, 2.3, cols[i]);
      }
      hc.done(); cp.done(); g.add(hc); g.add(cp);
    }
    var bound = Math.sqrt(2 * (half + 4) * (half + 4) + 24 * 24) * 0.9;
    return { obj: g, r: bound, tick: tick };
  }

  /* ---------- 7. orbitals ---------- */
  function buildOrbital(C, m) {
    var THREE = C.T, g = new THREE.Group(), ty = m.type || 's', Y = new THREE.Vector3(0, 1, 0), R = 6;
    function lobe(geo, dir, hex, op) {
      var mat = C.phong({ color: hex, transparent: true, opacity: op || 0.58, depthWrite: false, side: THREE.DoubleSide, shininess: 35, spec: 0x222222 }), me = new THREE.Mesh(geo, mat);
      me.quaternion.setFromUnitVectors(Y, new THREE.Vector3(dir[0], dir[1], dir[2]).normalize()); g.add(me); return me;
    }
    function axes(L) { var a = C.line([-L, 0, 0, L, 0, 0, 0, -L, 0, 0, L, 0, 0, 0, -L, 0, 0, L], 0x8a9a94, 0.35); g.add(a); }
    var nuc = new THREE.Mesh(C.g(new THREE.SphereGeometry(0.28, 12, 8)), C.phong({ color: 0x3b4a45 }));
    if (ty === 's') { var sm = new THREE.Mesh(C.g(new THREE.SphereGeometry(3.3, 40, 28)), C.phong({ color: '#2f9e6e', transparent: true, opacity: 0.4, depthWrite: false, shininess: 35, spec: 0x222222 })), s2 = new THREE.Mesh(C.g(new THREE.SphereGeometry(1.8, 32, 20)), C.phong({ color: '#00664a', transparent: true, opacity: 0.3, depthWrite: false, shininess: 35, spec: 0x222222 })); g.add(sm); g.add(s2); R = 4.5; axes(5); }
    else if (ty === 'p') {
      var lg = C.lobeGeo(5.4, 1.75, 0.62); [[[1, 0, 0], '#c9a227'], [[0, 0, 1], '#2f9e6e'], [[0, 1, 0], '#4f86a8']].forEach(function (a) { lobe(lg, a[0], a[1]); lobe(lg, [-a[0][0], -a[0][1], -a[0][2]], a[1], 0.5); });
      R = 6.4; axes(6.6);
    } else if (ty === 'd') {
      var dg = C.lobeGeo(5.2, 1.5, 0.62); [[1, 0, 1, '#2f9e6e'], [-1, 0, 1, '#c9a227'], [-1, 0, -1, '#2f9e6e'], [1, 0, -1, '#c9a227']].forEach(function (a) { lobe(dg, [a[0], 0, a[1] === 0 ? a[2] : a[2]], a[3]); });
      R = 5.6; axes(6);
    } else { // sp3
      var bg = C.lobeGeo(5.4, 1.5, 0.6), sg = C.lobeGeo(1.9, 0.7, 0.7);
      [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].forEach(function (d, k) { lobe(bg, d, ['#2f9e6e', '#4f86a8', '#c9a227', '#8e6cc6'][k], 0.62); lobe(sg, [-d[0], -d[1], -d[2]], ['#2f9e6e', '#4f86a8', '#c9a227', '#8e6cc6'][k], 0.5); });
      R = 5.8;
    }
    g.add(nuc);
    if (ty === 'd') { g.rotation.x = 0.95; var w = new THREE.Group(); w.add(g); return { obj: w, r: R }; }
    return { obj: g, r: R };
  }

  /* ---------- 8. gas ---------- */
  function buildGas(C, m) {
    var THREE = C.T, g = new THREE.Group(), n = Math.max(1, Math.min(m.n || 30, 80)), sp = m.speed === 'fast' ? 7 : 3.4, rnd = rng(11), E = 20, rd = 0.62, P = [], V = [], i;
    var hs = C.spheres(n, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [16, 12]), cl = m.speed === 'fast' ? '#d07a5a' : '#4f86a8';
    for (i = 0; i < n; i++) { P.push([(rnd() - 0.5) * (E - 2 * rd), (rnd() - 0.5) * (E - 2 * rd), (rnd() - 0.5) * (E - 2 * rd)]); var a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1), v = sp * (0.7 + 0.6 * rnd()); V.push([v * Math.sin(b) * Math.cos(a), v * Math.cos(b), v * Math.sin(b) * Math.sin(a)]); }
    function tick(t, dt) {
      dt = Math.min(dt || 0, 0.05); var lim = E / 2 - rd;
      for (var i = 0; i < n; i++) { for (var k = 0; k < 3; k++) { P[i][k] += V[i][k] * dt; if (P[i][k] > lim) { P[i][k] = 2 * lim - P[i][k]; V[i][k] = -Math.abs(V[i][k]); } else if (P[i][k] < -lim) { P[i][k] = -2 * lim - P[i][k]; V[i][k] = Math.abs(V[i][k]); } } hs.set(i, P[i][0], P[i][1], P[i][2], rd, cl); }
      hs.done();
    }
    tick(0, 0); g.add(hs); g.add(C.boxEdges(E, E, E, 0x8a9a94, 0.6));
    return { obj: g, r: E * 0.866 + 0.6, tick: tick };
  }

  /* ---------- 9. states of matter ---------- */
  function buildStates(C, m) {
    var THREE = C.T, g = new THREE.Group(), E = 12, X = [-16, 0, 16], rd = 0.78, rnd = rng(5), i, j, k, sol = [], liq = [], gas = [], gv = [];
    for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) for (k = 0; k < 4; k++) sol.push([(i - 1.5) * 2.7, (j - 1.5) * 2.7, (k - 1.5) * 2.7]);
    for (j = 0; j < 3; j++) for (i = 0; i < 4; i++) for (k = 0; k < 4; k++) liq.push([(i - 1.5) * 2.45 + (j % 2) * 0.9 - 0.45, -E / 2 + 1.5 + j * 1.9 + ((i + k) % 2) * 0.35, (k - 1.5) * 2.45 + ((j + i) % 2) * 0.6 - 0.3]);
    for (i = 0; i < 7; i++) { gas.push([(rnd() - 0.5) * 8, (rnd() - 0.5) * 8, (rnd() - 0.5) * 8]); gv.push([(rnd() - 0.5) * 12, (rnd() - 0.5) * 12, (rnd() - 0.5) * 12]); }
    var mt = C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), a = C.spheres(sol.length, mt), b = C.spheres(liq.length, mt), c = C.spheres(gas.length, mt);
    [-1, 0, 1].forEach(function (s, q) { var bx = C.boxEdges(E, E, E, 0x8a9a94, 0.6); bx.position.x = X[q]; g.add(bx); });
    var fill = new THREE.Mesh(C.g(new THREE.BoxGeometry(E - 0.2, 6.2, E - 0.2)), C.basic({ color: 0x4f86a8, transparent: true, opacity: 0.1, depthWrite: false })); fill.position.set(X[1], -E / 2 + 3.1 + 0.0, 0); g.add(fill);
    function tick(t, dt) {
      var i, lim = E / 2 - rd; dt = Math.min(dt || 0, 0.05);
      for (i = 0; i < sol.length; i++) { var p = sol[i], ph = i * 1.7; a.set(i, X[0] + p[0] + 0.14 * Math.sin(7 * t + ph), p[1] + 0.14 * Math.sin(6.3 * t + ph * 1.3), p[2] + 0.14 * Math.sin(7.7 * t + ph * 0.7), rd, '#00664a'); }
      for (i = 0; i < liq.length; i++) { var l = liq[i], ph2 = i * 2.3, row = Math.floor(i / 16); b.set(i, X[1] + l[0] + 0.75 * Math.sin(0.9 * t + row * 2 + ph2 * 0.2) + 0.2 * Math.sin(4 * t + ph2), l[1] + 0.25 * Math.sin(3.1 * t + ph2), l[2] + 0.55 * Math.sin(0.7 * t + ph2 * 0.3) + 0.2 * Math.sin(3.7 * t + ph2), rd, '#2f7fa0'); }
      for (i = 0; i < gas.length; i++) { for (var k = 0; k < 3; k++) { gas[i][k] += gv[i][k] * dt; if (gas[i][k] > lim) { gas[i][k] = 2 * lim - gas[i][k]; gv[i][k] = -Math.abs(gv[i][k]); } else if (gas[i][k] < -lim) { gas[i][k] = -2 * lim - gas[i][k]; gv[i][k] = Math.abs(gv[i][k]); } } c.set(i, X[2] + gas[i][0], gas[i][1], gas[i][2], rd, '#d07a5a'); }
      a.done(); b.done(); c.done();
    }
    tick(0, 0); g.add(a); g.add(b); g.add(c);
    return { obj: g, r: 24, tick: tick };
  }

  /* ---------- 10. electromagnetic wave ---------- */
  function buildWave(C, m) {
    var THREE = C.T, g = new THREE.Group(), L = 26, S = 130, NV = 34, lam = 10, kk = Math.PI * 2 / lam, A = 4.2, i;
    var mt = C.phong({ color: 0xffffff, shininess: 60 }), mtv = C.basic({ color: 0xffffff, transparent: true, opacity: 0.55 });
    var ec = C.cyls(S, mt, 8), es = C.spheres(S + 1, mt, [10, 8]), bc = C.cyls(S, mt, 8), bs = C.spheres(S + 1, mt, [10, 8]), ev = C.cyls(NV, mtv, 4), bv = C.cyls(NV, mtv, 4);
    var ax = C.cyls(1, C.phong({ color: '#6f817a' }), 8), cone = new THREE.Mesh(C.g(new THREE.ConeGeometry(0.55, 1.6, 12)), C.phong({ color: '#6f817a' }));
    ax.set(0, -L / 2 - 1, 0, 0, L / 2 + 0.6, 0, 0, 0.07, '#6f817a'); ax.done(); cone.rotation.z = -Math.PI / 2; cone.position.set(L / 2 + 1.4, 0, 0); g.add(ax); g.add(cone);
    function field(t, x) { var u = (x + L / 2) / L; return A * sstep(0, 0.14, u) * sstep(1, 0.86, u) * Math.sin(kk * x - 2.1 * t); }
    function tick(t) {
      var i, px = -L / 2, fy = field(t, px), x, f;
      for (i = 0; i <= S; i++) {
        x = -L / 2 + L * i / S; f = field(t, x);
        es.set(i, x, f, 0, 0.17, '#00664a'); bs.set(i, x, 0, f, 0.17, '#c9a227');
        if (i > 0) { ec.set(i - 1, px, fy, 0, x, f, 0, 0.17, '#00664a'); bc.set(i - 1, px, 0, fy, x, 0, f, 0.17, '#c9a227'); }
        px = x; fy = f;
      }
      for (i = 0; i < NV; i++) { x = -L / 2 + L * (i + 0.5) / NV; f = field(t, x); ev.set(i, x, 0, 0, x, f, 0, 0.045, '#6fb79b'); bv.set(i, x, 0, 0, x, 0, f, 0.045, '#e2c76a'); }
      [ec, es, bc, bs, ev, bv].forEach(function (q) { q.done(); });
    }
    tick(0); [ec, es, bc, bs, ev, bv].forEach(function (q) { g.add(q); });
    return { obj: g, r: Math.sqrt(Math.pow(L / 2 + 2, 2) + A * A) };
  }

  var KINDS = { mol: buildMol, protein: buildProtein, atom: buildAtom, crystal: buildCrystal, dna: buildDNA, membrane: buildMembrane, orbital: buildOrbital, gas: buildGas, states: buildStates, wave: buildWave };

  window.LV3D = {
    add: function (name, fn) { KINDS[name] = fn; },
    util: { PAL: PAL, ecol: ecol, erad: erad, rng: rng, sstep: sstep },
    build: function (THREE, m) {
      var C = Ctx(THREE), fn = KINDS[m && m.kind], res;
      if (!fn) res = { obj: new THREE.Group(), r: 1 }; else res = fn(C, m);
      return {
        obj: res.obj, r: res.r, tick: res.tick || null, noSpin: !!res.noSpin, fit: res.fit || 0,
        dispose: function () { C.geos.forEach(function (x) { x.dispose(); }); C.mats.forEach(function (x) { x.dispose(); }); }
      };
    },
    lights: function (THREE, scene) {
      scene.add(new THREE.HemisphereLight(0xffffff, 0xaebcb6, 0.78));
      var k = new THREE.DirectionalLight(0xffffff, 0.62); k.position.set(4, 7, 6); scene.add(k);
      var f = new THREE.DirectionalLight(0xdfeee8, 0.22); f.position.set(-6, -3, -4); scene.add(f);
    }
  };
})();
(function () {
  'use strict';
  var U = LV3D.util, S = U.sstep;
  var BGHEX = '#eef6f2';
  function frac(x) { return x - Math.floor(x); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  // instanced arbitrary geometry: set(i,x,y,z,sx,sy,sz,rx,ry,rz,hex)
  function inst(C, geo, mat, n) {
    var T = C.T, mesh = new T.InstancedMesh(C.g(geo), mat, Math.max(n, 1)), O = new T.Object3D(), col = new T.Color();
    mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.count = n;
    mesh.set = function (i, x, y, z, sx, sy, sz, rx, ry, rz, hex) {
      O.position.set(x, y, z); O.rotation.set(rx || 0, ry || 0, rz || 0); O.scale.set(sx, sy, sz); O.updateMatrix();
      mesh.setMatrixAt(i, O.matrix); if (hex !== undefined) mesh.setColorAt(i, col.set(hex));
    };
    mesh.done = function () { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
    return mesh;
  }
  function glassMat(C) { return C.phong({ color: 0xe3f3ed, transparent: true, opacity: 0.2, depthWrite: false, side: C.T.DoubleSide, shininess: 100, spec: 0xffffff }); }
  function liqMat(C, hex, op) { return C.phong({ color: hex, transparent: true, opacity: op || 0.55, depthWrite: false, shininess: 60, spec: 0x222222 }); }
  function mesh(C, geo, mat) { return new C.T.Mesh(C.g(geo), mat); }
  function lathe(C, pts, seg) { var T = C.T, p = pts.map(function (a) { return new T.Vector2(a[0], a[1]); }); return C.g(new T.LatheGeometry(p, seg || 32)); }
  function rimTorus(C, r, y, tube) {
    var m = mesh(C, new C.T.TorusGeometry(r, tube || 0.035, 6, 40), C.phong({ color: 0xcfe6dc, shininess: 80 }));
    m.rotation.x = Math.PI / 2; m.position.y = y; return m;
  }
  function hiStrip(C, R, w, h, ang, y) {
    var m = mesh(C, new C.T.PlaneGeometry(w, h), C.basic({ color: 0xffffff, transparent: true, opacity: 0.38, depthWrite: false, side: C.T.DoubleSide }));
    m.position.set(-(R + 0.01) * Math.sin(ang), y, (R + 0.01) * Math.cos(ang)); m.rotation.y = -ang; m.renderOrder = 3; return m;
  }
  function labelPlane(C, w, h, cw, ch, draw) {
    var T = C.T, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; draw(cv.getContext('2d'));
    var tx = C.m(new T.CanvasTexture(cv)); tx.minFilter = T.LinearFilter; tx.anisotropy = 4;
    return new T.Mesh(C.g(new T.PlaneGeometry(w, h)), C.m(new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })));
  }
  function hexLerp(a, b, k) {
    var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), r = 0, i, s = 16, v;
    for (i = 0; i < 3; i++) { v = Math.round(((A >> s) & 255) * (1 - k) + ((B >> s) & 255) * k); r = r * 256 + v; s -= 8; }
    return '#' + ('000000' + r.toString(16)).slice(-6);
  }
  // Erlenmeyer flask profile helper
  function flaskKit(C, H, R, Rn) {
    var P = [[0, 0], [0.84 * R, 0], [0.96 * R, 0.02 * H], [R, 0.07 * H], [Rn, 0.72 * H], [Rn, H], [Rn * 1.1, H * 1.004]];
    function rAt(y) {
      for (var i = 1; i < P.length; i++) if (y <= P[i][1]) { var a = P[i - 1], b = P[i], k = (y - a[1]) / Math.max(b[1] - a[1], 1e-6); return a[0] + (b[0] - a[0]) * k; }
      return Rn;
    }
    function liqGeo(yl) {
      var pts = [[0, 0.02]], i;
      for (i = 1; i < P.length; i++) { if (P[i][1] >= yl) break; pts.push([P[i][0] * 0.955, Math.max(P[i][1], 0.02)]); }
      pts.push([rAt(yl) * 0.955, yl]); pts.push([0, yl]); return lathe(C, pts, 36);
    }
    return { P: P, rAt: rAt, glass: function () { return lathe(C, P, 36); }, liqGeo: liqGeo };
  }

  /* ---------------- 1. beaker ---------------- */
  LV3D.add('beaker', function (C, m) {
    var T = C.T, g = new T.Group(), R = 1.25, H = 3.0, mode = m.mode || 'still', lvl = m.level === undefined ? 0.6 : m.level;
    var hL = Math.max(0.4, lvl * (H - 0.35)), yb = -H / 2, rl = R - 0.06, liq = m.liquid || '#9fd0e6';
    var beak = mesh(C, lathe(C, [[0, 0], [R * 0.9, 0], [R * 0.97, 0.04], [R, 0.12], [R, H]], 40), glassMat(C)); beak.position.y = yb; beak.renderOrder = 2; g.add(beak);
    g.add(rimTorus(C, R, H / 2)); g.add(hiStrip(C, R, 0.1, H * 0.72, 0.62, 0.05));
    var gl = [], a, yy, ys = [0.8, 1.2, 1.6, 2.0, 2.4];
    ys.forEach(function (q, i) { var a0 = i % 2 ? 0.45 : 0.3, a1 = 0.62; gl.push(R * 1.006 * Math.sin(a0), yb + q, R * 1.006 * Math.cos(a0), R * 1.006 * Math.sin(a1), yb + q, R * 1.006 * Math.cos(a1)); });
    var gm = C.line(gl, 0x3b4a45, 0.45); g.add(gm);
    var lm = liqMat(C, liq, 0.62), lq = mesh(C, new T.CylinderGeometry(1, 1, 1, 40, 1), lm); lq.scale.set(rl, hL, rl); lq.position.y = yb + 0.04 + hL / 2; lq.renderOrder = 1; g.add(lq);
    var top = mesh(C, new T.CircleGeometry(rl, 40), C.basic({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false })); top.rotation.x = -Math.PI / 2; top.position.y = yb + 0.04 + hL + 0.003; g.add(top);
    var yB = yb + 0.1, yT = yb + 0.04 + hL, rnd = U.rng(11), i;
    var tick = null, c1 = new T.Color(liq), c2 = new T.Color(m.color2 || '#c6a0d8');
    function inLiq(rr, lo, hi) { var an = rnd() * 6.283, rad = Math.sqrt(rnd()) * (rl - 0.12); return [rad * Math.cos(an), lo + rnd() * (hi - lo), rad * Math.sin(an)]; }
    if (mode === 'bubbles') {
      var N = 34, bs = C.spheres(N, C.phong({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, shininess: 120, spec: 0xffffff, emissive: 0x4a5c56 }), [10, 7]), B = [];
      for (i = 0; i < N; i++) { var p = inLiq(0, yB, yB), pr = 3.2 + rnd() * 3.8; B.push({ x: p[0] * 0.9, z: p[2] * 0.9, per: pr, off: rnd() * pr, r: 0.06 + rnd() * 0.06, w: rnd() * 6.28, wa: 0.03 + rnd() * 0.05 }); }
      bs.renderOrder = 4; g.add(bs);
      tick = function (t) {
        for (var k = 0; k < N; k++) {
          var b = B[k], u = frac(t / b.per + b.off / b.per), y = yB + 0.1 + (yT - yB - 0.15) * u, sz = b.r * (0.6 + 0.6 * u) * (1 - S(0.93, 1, u)) * S(0, 0.05, u);
          bs.set(k, b.x + b.wa * Math.sin(t * 1.4 + b.w), y, b.z + b.wa * Math.cos(t * 1.1 + b.w), sz + 0.0005, '#ffffff');
        }
        bs.done();
      };
    } else if (mode === 'dissolve') {
      var cg = new T.BoxGeometry(1, 1, 1), cr = inst(C, cg, C.phong({ color: 0xffffff, shininess: 80, spec: 0xffffff }), 4), cp = [[-0.4, 0.15], [0.1, -0.35], [0.45, 0.2], [0.0, 0.3]], cs = [0.3, 0.26, 0.28, 0.22], cy0 = yb + 0.06, rot = [0.4, 1.1, 0.8, 0.2];
      var NP = 72, ps = C.spheres(NP, C.basic({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false }), [6, 5]), P = [];
      for (i = 0; i < NP; i++) { var h = inLiq(0, yB + 0.1, yT - 0.15), c = i % 4; P.push({ h: h, c: c, d: 0.1 + 0.4 * rnd(), ph: rnd() * 6.28, r: 0.05 + rnd() * 0.03 }); }
      ps.renderOrder = 4; g.add(cr); g.add(ps);
      tick = function (t) {
        var u = frac(t / 9), k, sc = (1 - S(0.05, 0.72, u)) + S(0.94, 1, u);
        for (k = 0; k < 4; k++) { var s = cs[k] * sc; cr.set(k, cp[k][0], cy0 + s * 0.55, cp[k][1], s, s, s, rot[k] * 0.5, rot[k], rot[k] * 0.3, '#f6f8f6'); }
        cr.done();
        for (k = 0; k < NP; k++) {
          var q = P[k], e = S(q.d * 0.8, q.d * 0.8 + 0.28, u), ap = S(q.d * 0.8, q.d * 0.8 + 0.06, u) * (1 - S(0.86, 0.97, u)), x0 = cp[q.c][0], z0 = cp[q.c][1], y0 = cy0 + 0.1;
          ps.set(k, x0 + (q.h[0] - x0) * e + 0.08 * Math.sin(t * 0.9 + q.ph) * e, y0 + (q.h[1] - y0) * e + 0.08 * Math.sin(t * 0.7 + q.ph * 2) * e, z0 + (q.h[2] - z0) * e + 0.08 * Math.cos(t * 0.8 + q.ph) * e, q.r * ap + 0.0005, '#ffffff');
        }
        ps.done();
      };
    } else if (mode === 'precipitate') {
      var NS = 110, sp = C.spheres(NS, C.basic({ color: 0xffffff, transparent: true, opacity: 0.92 }), [6, 5]), Q = [];
      for (i = 0; i < NS; i++) {
        var h2 = inLiq(0, yB + 0.3, yT - 0.15), a0 = 0.02 + rnd() * 0.3, fs = a0 + 0.06, fe = Math.min(0.9, fs + 0.38 + rnd() * 0.2), bx = h2[0] * 0.95, bz = h2[2] * 0.95;
        Q.push({ h: h2, a: a0, fs: fs, fe: fe, yb: yb + 0.09 + rnd() * 0.07, bx: bx, bz: bz, r: 0.04 + rnd() * 0.03, ph: rnd() * 6.28 });
      }
      sp.renderOrder = 4; g.add(sp);
      tick = function (t) {
        var u = frac(t / 9), k;
        for (k = 0; k < NS; k++) {
          var q = Q[k], ap = S(q.a, q.a + 0.06, u) * (1 - S(0.92, 0.99, u)), e = S(q.fs, q.fe, u), e2 = e * e * 0.4 + e * 0.6;
          sp.set(k, q.h[0] + (q.bx - q.h[0]) * e + 0.03 * Math.sin(t * 0.8 + q.ph) * (1 - e), q.h[1] + (q.yb - q.h[1]) * e2, q.h[2] + (q.bz - q.h[2]) * e, q.r * ap + 0.0005, m.color2 || '#f1f4f2');
        }
        sp.done();
      };
    } else if (mode === 'color') {
      tick = function (t) {
        var u = frac(t / 9), k = S(0.12, 0.42, u) - S(0.58, 0.88, u); lm.color.copy(c1).lerp(c2, k);
      };
    }
    return { obj: g, r: 2.1, fit: 4.0, noSpin: true, tick: tick ? function (t) { tick(t); } : function () { } };
  });

  /* ---------------- 2. titration ---------------- */
  LV3D.add('titration', function (C, m) {
    var T = C.T, g = new T.Group(), inner = new T.Group(); inner.position.y = -0.3; g.add(inner);
    var fromC = new T.Color(m.from || '#e9eef0'), toC = new T.Color(m.to || '#d65a8f'), tmp = new T.Color();
    var H = 3.0, R = 1.35, Rn = 0.4, fy = -3.0, kit = flaskKit(C, H, R, Rn);
    var fl = mesh(C, kit.glass(), glassMat(C)); fl.position.y = fy; fl.renderOrder = 2; inner.add(fl);
    var rim = rimTorus(C, Rn * 1.1, fy + H, 0.04); inner.add(rim);
    var yl = 1.0, lm = liqMat(C, 0xffffff, 0.6); lm.color.copy(fromC);
    var lq = mesh(C, kit.liqGeo(yl), lm); lq.position.y = fy; lq.renderOrder = 1; inner.add(lq);
    var surfY = fy + yl;
    var tl = mesh(C, new T.CircleGeometry(kit.rAt(yl) * 0.95, 32), C.basic({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false })); tl.rotation.x = -Math.PI / 2; tl.position.y = surfY + 0.004; inner.add(tl);
    inner.add(hiStrip(C, 1.0, 0.09, 1.1, 0.7, fy + 0.95)); inner.children[inner.children.length - 1].position.set(-0.66, fy + 0.9, 0.72);
    // burette
    var Hb = 3.3, ty = 0.3, bur = mesh(C, lathe(C, [[0.045, 0], [0.045, 0.35], [0.2, 0.9], [0.2, Hb]], 20), glassMat(C)); bur.position.y = ty; bur.renderOrder = 2; inner.add(bur);
    inner.add((function () { var r = rimTorus(C, 0.2, ty + Hb, 0.03); return r; })());
    var bl = liqMat(C, '#bcd9e8', 0.7), bq = mesh(C, new T.CylinderGeometry(1, 1, 1, 16, 1), bl), bt = mesh(C, new T.CylinderGeometry(0.15, 0.035, 0.5, 14, 1), bl), bt2 = mesh(C, new T.CylinderGeometry(0.035, 0.035, 0.36, 8, 1), bl);
    bq.renderOrder = 1; bt.renderOrder = 1; bt2.renderOrder = 1; bt.position.set(0, ty + 0.65, 0); bt2.position.set(0, ty + 0.18, 0); inner.add(bq); inner.add(bt); inner.add(bt2);
    // graduations
    var gl = [], k; for (k = 0; k < 13; k++) { var yy = ty + 1.15 + k * 0.2, w = k % 4 === 0 ? 0.14 : 0.08; gl.push(0.205, yy, 0.02, 0.205 + w, yy, 0.02); }
    inner.add(C.line(gl, 0x3b4a45, 0.55));
    inner.add(hiStrip(C, 0.2, 0.035, 2.4, 0.75, ty + 2.2));
    // stopcock
    var gold = C.phong({ color: '#c9a227', shininess: 60 }), sc = mesh(C, new T.CylinderGeometry(0.075, 0.075, 0.62, 12), gold); sc.rotation.z = Math.PI / 2; sc.position.set(0.04, ty + 0.62, 0); inner.add(sc);
    var lev = mesh(C, new T.BoxGeometry(0.34, 0.07, 0.07), gold); lev.position.set(0.38, ty + 0.62, 0); lev.rotation.z = 0.5; inner.add(lev);
    var nut = mesh(C, new T.SphereGeometry(0.1, 12, 8), gold); nut.position.set(-0.3, ty + 0.62, 0); inner.add(nut);
    // drop and ripple
    var dm = C.phong({ color: '#8fbad3', shininess: 90, spec: 0xffffff }), drop = mesh(C, new T.SphereGeometry(1, 12, 9), dm); drop.visible = false; inner.add(drop);
    var rm = C.basic({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), rip = mesh(C, new T.TorusGeometry(1, 0.025, 5, 36), rm); rip.rotation.x = Math.PI / 2; rip.position.y = surfY + 0.01; inner.add(rip);
    var TOP = ty + 1.0, tipY = ty - 0.02;
    function tick(t) {
      var tt = t % 10, kk = clamp(Math.floor((tt - 0.5) / 1.0), 0, 4), tr = 0.5 + kk * 1.0, t0 = tt - tr, n = 0, j, e = S(5.6, 6.5, tt), mm, lvB;
      for (j = 0; j < 5; j++) if (tt > 0.5 + j * 1.0 + 0.95) n++;
      if (tt >= 0.5 && t0 < 0.95 && !(kk === 4 && t0 >= 0.95)) {
        drop.visible = true;
        if (t0 < 0.35) { var rr = 0.1 * S(0, 0.35, t0); drop.scale.set(rr, rr * 1.25, rr); drop.position.set(0, tipY - rr * 0.8, 0); }
        else { var tau = t0 - 0.35, yy2 = tipY - 0.1 - 7.5 * tau * tau; drop.scale.set(0.09, 0.12, 0.09); drop.position.set(0, yy2, 0); if (yy2 < surfY) drop.visible = false; }
      } else drop.visible = false;
      var ra = -1; for (j = 0; j < 5; j++) { var a = tt - (0.5 + j * 1.0 + 0.95); if (a >= 0 && a < 0.9) ra = a; }
      if (ra >= 0) { var s2 = 0.2 + 0.85 * (ra / 0.9); rip.scale.set(s2, s2, s2); rm.opacity = 0.55 * (1 - ra / 0.9); } else rm.opacity = 0;
      mm = (0.05 * Math.min(n, 4) * (1 - e) + e) * (1 - S(8.8, 9.8, tt));
      lm.color.copy(fromC).lerp(toC, mm);
      lvB = 1 - 0.1 * (Math.min(n, 5) / 5) * (1 - S(8.8, 9.8, tt)); var hb = (Hb - 1.1) * 0.75 * lvB; bq.scale.set(0.15, hb, 0.15); bq.position.y = ty + 0.9 + hb / 2;
    }
    tick(0);
    return { obj: g, r: 3.8, fit: 3.75, noSpin: true, tick: tick };
  });

  /* ---------------- 3. flask_heat ---------------- */
  LV3D.add('flask_heat', function (C, m) {
    var T = C.T, g = new T.Group(), exo = (m.mode || 'exo') !== 'endo', H = 3.4, R = 1.5, Rn = 0.45, kit = flaskKit(C, H, R, Rn), inner = new T.Group(); inner.position.y = -H / 2; g.add(inner);
    var fl = mesh(C, kit.glass(), glassMat(C)); fl.renderOrder = 2; inner.add(fl); inner.add(rimTorus(C, Rn * 1.1, H, 0.04));
    var yl = 0.36 * H, lq = mesh(C, kit.liqGeo(yl), liqMat(C, exo ? '#f3c79b' : '#a5cfe2', 0.6)); lq.renderOrder = 1; inner.add(lq);
    var tl = mesh(C, new T.CircleGeometry(kit.rAt(yl) * 0.95, 32), C.basic({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false })); tl.rotation.x = -Math.PI / 2; tl.position.y = yl + 0.004; inner.add(tl);
    inner.add(hiStrip(C, 1.2, 0.09, 1.4, 0.78, 1.0)); inner.children[inner.children.length - 1].position.set(-0.85, 0.95, 0.88);
    var col = exo ? '#e2653f' : '#4f86a8', NA = 6, NS = 10, NC = NA * (NS + 2), cy = C.cyls(NC, C.basic({ color: 0xffffff }), 6), LV = 12, pal = [], i;
    for (i = 0; i < LV; i++) pal.push(hexLerp(BGHEX, col, i / (LV - 1)));
    var ang = [20, 90, 160, 200, 270, 340], ph = [0, 0.37, 0.71, 0.13, 0.52, 0.86], zs = [0.3, -0.2, 0.3, -0.3, 0.2, -0.3];
    g.add(cy);
    var nf = 64, fr = null, FK = [];
    if (!exo) {
      fr = C.spheres(nf, C.basic({ color: 0xf6fbff }), [6, 4]); var rnd = U.rng(5);
      for (i = 0; i < nf; i++) { var yv = 0.05 * H + rnd() * 0.5 * H, an = (rnd() - 0.5) * 2.6; FK.push({ y: yv, a: an, p: rnd() * 6.28, r: 0.035 + rnd() * 0.035 }); }
      inner.add(fr);
    }
    function tick(t) {
      var k, s, ci = 0, d, L = 1.25, per = 5.0;
      for (k = 0; k < NA; k++) {
        var th = ang[k] * Math.PI / 180, dx = Math.cos(th), dy = Math.sin(th), nx = -dy, ny = dx, p = frac(t / per + ph[k]), pp = exo ? p : 1 - p, r0 = 2.05, r1 = 3.1;
        var cc = r0 + (r1 - r0) * pp + L / 2, al = Math.pow(Math.sin(Math.PI * p), 0.8), hx = exo ? 1 : -1, ci2 = pal[Math.round(al * (LV - 1))], z = zs[k];
        var px = 0, py = 0, qx, qy, f, lat;
        for (s = 0; s <= NS; s++) {
          f = s / NS; lat = 0.07 * Math.sin(6.28 * 1.0 * f - 2.4 * t * (exo ? 1 : -1) + k);
          qx = dx * (cc - L / 2 + L * f) + nx * lat; qy = dy * (cc - L / 2 + L * f) + ny * lat;
          if (s > 0) cy.set(ci++, px, py, z, qx, qy, z, 0.05, ci2);
          px = qx; py = qy;
        }
        f = exo ? 1 : 0; lat = 0.07 * Math.sin(6.283 * f - 2.4 * t * (exo ? 1 : -1) + k);
        var tipx = dx * (cc - L / 2 + L * f) + nx * lat, tipy = dy * (cc - L / 2 + L * f) + ny * lat;
        var bx = dx * hx, by = dy * hx; // head direction
        cy.set(ci++, tipx, tipy, z, tipx - bx * 0.26 + (-by) * 0.19, tipy - by * 0.26 + bx * 0.19, z, 0.045, ci2);
        cy.set(ci++, tipx, tipy, z, tipx - bx * 0.26 - (-by) * 0.19, tipy - by * 0.26 - bx * 0.19, z, 0.045, ci2);
      }
      cy.done();
      if (fr) {
        for (k = 0; k < nf; k++) {
          var q = FK[k], rr = kit.rAt(q.y) + 0.012, sz = q.r * (0.75 + 0.25 * Math.sin(t * 0.9 + q.p));
          fr.set(k, rr * Math.sin(q.a), q.y, rr * Math.cos(q.a), sz);
        }
        fr.done();
      }
    }
    for (i = 0; i < nf && fr; i++) fr.set(i, 0, 0, 0, 0.01, '#f6fbff');
    tick(0);
    return { obj: g, r: 3.8, fit: 4.0, noSpin: true, tick: tick };
  });

  /* ---------------- 4. thermometer ---------------- */
  LV3D.add('thermometer', function (C, m) {
    var T = C.T, g = new T.Group(), from = m.from === undefined ? 20 : m.from, to = m.to === undefined ? 80 : m.to;
    var mn = Math.min(from, to), mx = Math.max(from, to), range = mx - mn, major = range <= 60 ? 10 : range <= 130 ? 20 : 50, minor = major / 5, lo = Math.floor((mn - major * 0.5) / major) * major, hi = Math.ceil((mx + major * 0.5) / major) * major;
    var cy0 = -2.55, Rb = 0.62, rs = 0.26, ytop = 2.9, y0 = -1.55, y1 = 2.3, i;
    function ymap(v) { return y0 + (v - lo) / (hi - lo) * (y1 - y0); }
    var pts = [], phi1 = Math.PI - Math.asin(rs / Rb), nb = 16;
    for (i = 0; i <= nb; i++) { var a = phi1 * i / nb; pts.push([Rb * Math.sin(a), cy0 - Rb * Math.cos(a)]); }
    var ys0 = pts[pts.length - 1][1]; pts.push([rs, ytop - rs]);
    for (i = 1; i <= 8; i++) { var b = Math.PI / 2 * i / 8; pts.push([rs * Math.cos(b), ytop - rs + rs * Math.sin(b)]); }
    var gm = mesh(C, lathe(C, pts, 28), glassMat(C)); gm.renderOrder = 2; g.add(gm);
    var plate = mesh(C, new T.BoxGeometry(1.5, 4.5, 0.05), C.phong({ color: '#f4efd9', shininess: 15 })); plate.position.set(0.55, 0.65, -0.2); g.add(plate);
    var back = mesh(C, new T.BoxGeometry(0.0001, 0.0001, 0.0001), C.basic({ color: 0xffffff })); back.visible = false; g.add(back);
    var red = C.phong({ color: '#dc4a3e', shininess: 70, spec: 0x888888 });
    var bulb = mesh(C, new T.SphereGeometry(0.46, 22, 16), red); bulb.position.y = cy0; g.add(bulb);
    var col = mesh(C, new T.CylinderGeometry(1, 1, 1, 14, 1), red); g.add(col); col.scale.x = col.scale.z = 0.1;
    var cap = mesh(C, new T.SphereGeometry(0.1, 10, 8), red); g.add(cap);
    g.add(hiStrip(C, 0.26, 0.04, 4.2, 0.9, 0.35)); g.children[g.children.length - 1].position.set(-0.1, 0.35, 0.22); g.children[g.children.length - 1].rotation.y = 0;
    // ticks
    var tm = C.phong({ color: '#3b4a45', shininess: 5 }), nt = 0, v, list = [];
    for (v = lo; v <= hi + 1e-6; v += minor) list.push(v);
    var tk = inst(C, new T.BoxGeometry(1, 1, 1), tm, list.length);
    list.forEach(function (v, k) { var mj = Math.abs(v / major - Math.round(v / major)) < 1e-6, len = mj ? 0.34 : 0.18; tk.set(k, 0.34 + len / 2, ymap(v), -0.15, len, 0.02, 0.02); }); tk.done(); g.add(tk);
    var yA = y0 - 0.2, yB = y1 + 0.2, ch = 1024, lab = labelPlane(C, 0.55, yB - yA, 128, ch, function (x) {
      x.clearRect(0, 0, 128, ch); x.fillStyle = '#3b4a45'; x.font = '600 46px sans-serif'; x.textBaseline = 'middle'; x.textAlign = 'left';
      for (var vv = lo; vv <= hi + 1e-6; vv += major) x.fillText(String(vv), 4, (1 - (ymap(vv) - yA) / (yB - yA)) * ch);
    }); lab.position.set(0.97 + 0.1, (yA + yB) / 2, -0.15); g.add(lab);
    g.position.y = 0.15;
    function tick(t) {
      var u = frac(t / 8), k = S(0.08, 0.42, u) - S(0.55, 0.9, u), v = from + (to - from) * k, yt = ymap(v), h = yt - cy0;
      col.scale.y = h; col.position.y = cy0 + h / 2; cap.position.y = yt; cap.scale.y = 0.6;
    }
    tick(0);
    return { obj: g, r: 3.4, fit: 3.7, noSpin: true, tick: tick };
  });

  /* ---------------- 5. balance ---------------- */
  LV3D.add('balance', function (C, m) {
    var T = C.T, g = new T.Group(), inner = new T.Group(); inner.position.y = 0.35; g.add(inner); var tip = m.mode === 'tip';
    var slate = C.phong({ color: '#3b4a45', shininess: 40 }), gold = C.phong({ color: '#c9a227', shininess: 70, spec: 0x999999 }), pan = C.phong({ color: '#cfdcd6', shininess: 90, spec: 0xffffff });
    var base = mesh(C, new T.CylinderGeometry(1.5, 1.75, 0.26, 32), slate); base.position.y = -2.4; inner.add(base);
    var pil = mesh(C, new T.CylinderGeometry(0.12, 0.17, 3.8, 16), slate); pil.position.y = -0.5; inner.add(pil);
    var by = 1.5, beamG = new T.Group(); beamG.position.y = by; inner.add(beamG);
    var beam = mesh(C, new T.BoxGeometry(4.7, 0.1, 0.16), slate); beamG.add(beam);
    var nd = mesh(C, new T.BoxGeometry(0.035, 1.05, 0.035), gold); nd.position.y = -0.55; beamG.add(nd);
    var pv = mesh(C, new T.SphereGeometry(0.17, 16, 12), gold); pv.position.y = by; inner.add(pv);
            var EN = 2.3, HL = 1.55, i, j;
    var pans = [new T.Group(), new T.Group()]; pans.forEach(function (p, k) { var d = mesh(C, new T.CylinderGeometry(1.0, 0.85, 0.09, 28), pan); p.add(d); inner.add(p); });
    var hang = C.cyls(4, slate, 5), hook = C.spheres(2, gold, [10, 7]); inner.add(hang); inner.add(hook);
    var NL = 14, NR = tip ? 8 : 14, bs = C.spheres(NL + NR, C.phong({ color: 0xffffff, shininess: 80, spec: 0x888888 }), [14, 10]), rad = 0.19, loc = [];
    inner.add(bs);
    function pile(n) {
      var out = [], x, z;
      for (z = 0; z < 3; z++) for (x = 0; x < 3; x++) out.push([(x - 1) * 0.4, 0.045 + rad, (z - 1) * 0.4]);
      for (z = 0; z < 2; z++) for (x = 0; x < 2; x++) out.push([(x - 0.5) * 0.4, 0.045 + rad + 0.32, (z - 0.5) * 0.4]);
      out.push([0, 0.045 + rad + 0.64, 0]);
      return out.slice(0, n);
    }
    var pl = pile(NL), pr = pile(NR), cL = ['#4f86a8', '#d65a4f'], cR = tip ? ['#c9a227'] : ['#8e6cc6'];
    var colL = [], colR = []; for (i = 0; i < NL; i++) colL.push(tip ? '#c9a227' : cL[i % 2]); for (i = 0; i < NR; i++) colR.push(tip ? '#4f86a8' : '#8e6cc6');
    var A = tip ? -0.2 : 0;
    function tick(t) {
      var tt = t % 8, x = Math.max(0, tt - 0.5), ang;
      if (tip) ang = A * (1 - Math.exp(-2.3 * x) * Math.cos(5 * x)) * (1 - S(6.2, 7.8, tt));
      else ang = 0.075 * Math.exp(-2.0 * x) * Math.sin(4.6 * x) * (1 - S(6.5, 7.9, tt));
      beamG.rotation.z = ang;
      var sa = Math.sin(ang), ca = Math.cos(ang), k, e;
      for (k = 0; k < 2; k++) {
        var sg = k ? 1 : -1, ex = sg * EN * ca, ey = by + sg * EN * sa, py = ey - HL; pans[k].position.set(ex, py, 0);
        hang.set(k * 2, ex, ey, 0, ex - 0.85, py + 0.03, 0, 0.02, '#3b4a45'); hang.set(k * 2 + 1, ex, ey, 0, ex + 0.85, py + 0.03, 0, 0.02, '#3b4a45'); hook.set(k, ex, ey, 0, 0.07, '#c9a227');
        if (k === 0) for (e = 0; e < NL; e++) bs.set(e, ex + pl[e][0], py + pl[e][1], pl[e][2], rad, colL[e]);
        else for (e = 0; e < NR; e++) bs.set(NL + e, ex + pr[e][0], py + pr[e][1], pr[e][2], rad, colR[e]);
      }
      hang.done(); hook.done(); bs.done();
    }
    bs.count = NL + NR; tick(0);
    return { obj: g, r: 3.9, fit: 3.2, noSpin: true, tick: tick };
  });

  /* ---------------- 6. ruler ---------------- */
  LV3D.add('ruler', function (C, m) {
    var T = C.T, g = new T.Group(), world = new T.Group(); g.add(world);
    var EDGE = 6.43;
    var body = mesh(C, new T.BoxGeometry(10.8, 1.5, 0.1), C.phong({ color: '#f1e6bd', shininess: 25 })); body.position.set(5, 0.75, 0); world.add(body);
    var tk = inst(C, new T.BoxGeometry(1, 1, 1), C.phong({ color: '#3b4a45', shininess: 5 }), 101), i;
    for (i = 0; i <= 100; i++) { var len = i % 10 === 0 ? 0.55 : i % 5 === 0 ? 0.4 : 0.26; tk.set(i, i / 10, len / 2, 0.055, i % 10 === 0 ? 0.03 : 0.02, len, 0.012); } tk.done(); world.add(tk);
    var lab = labelPlane(C, 10.8, 0.5, 2160, 100, function (x) {
      x.clearRect(0, 0, 2160, 100); x.fillStyle = '#3b4a45'; x.font = '600 64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (var d = 0; d <= 10; d++) x.fillText(String(d), (d + 0.4) / 10.8 * 2160, 52);
    }); lab.position.set(5, 1.05, 0.056); world.add(lab);
    var block = mesh(C, new T.BoxGeometry(EDGE, 0.9, 0.5), C.phong({ color: '#4f86a8', shininess: 55, spec: 0x777777 })); block.position.set(EDGE / 2, -0.45, 0.12); world.add(block);
    var guide = mesh(C, new T.BoxGeometry(0.012, 1.55, 0.012), C.basic({ color: '#c9a227' })); guide.position.set(EDGE, 0.3, 0.07); world.add(guide);
    var band = mesh(C, new T.BoxGeometry(0.1, 1.5, 0.01), C.basic({ color: '#c9a227', transparent: true, opacity: 0.0, depthWrite: false })); band.position.set(6.45, 0.75, 0.062); world.add(band);
    var pm = C.phong({ color: '#c9a227', shininess: 70, spec: 0xaaaaaa }), ptr = mesh(C, new T.ConeGeometry(0.05, 0.18, 12), pm); ptr.rotation.x = Math.PI; ptr.position.set(EDGE, 0.72, 0.07); world.add(ptr);
    var ptr2 = mesh(C, new T.CylinderGeometry(0.014, 0.014, 0.2, 8), pm); ptr2.position.set(EDGE, 0.91, 0.07); world.add(ptr2);
    g.position.set(0, -0.2, 0);
    function tick(t) {
      var u = frac(t / 10), p = S(0.1, 0.34, u) - S(0.76, 0.93, u), s = Math.exp(Math.log(6.5) * p), cx = 5 + (EDGE - 5) * p, cy = 0.75 + (0.5 - 0.75) * p, pa = S(0.38, 0.47, u) - S(0.68, 0.74, u);
      world.scale.setScalar(s); world.position.set(-cx * s, -cy * s, 0);
      band.material.opacity = 0.33 * pa; ptr.visible = ptr2.visible = pa > 0.01; var q = 0.4 + 0.6 * pa; ptr.scale.setScalar(q); ptr2.scale.set(q, q, q);
    }
    tick(0);
    return { obj: g, r: 5.9, fit: 2.7, noSpin: true, tick: tick };
  });

  /* ---------------- 7. cube ---------------- */
  LV3D.add('cube', function (C, m) {
    var T = C.T, g = new T.Group(), n = Math.max(2, Math.min(10, m.n || 10)), Sx = 4.2, s = Sx / n, N = n * n * n, i, j, k, idx = 0;
    var cm = inst(C, new T.BoxGeometry(1, 1, 1), C.phong({ color: 0xffffff, shininess: 40, spec: 0x445544 }), N), P = [];
    for (k = 0; k < n; k++) for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      var gold = (i === n - 1 && j === n - 1 && k === n - 1), mix = (j + i * 0.3 + k * 0.2) / (n * 1.5);
      P.push({ x: (i - (n - 1) / 2) * s, y: (j - (n - 1) / 2) * s, z: (k - (n - 1) / 2) * s, c: gold ? '#c9a227' : hexLerp('#2f9e6e', '#a9dcc3', clamp(mix, 0, 1)), gold: gold });
    }
    g.add(cm); g.add(C.boxEdges(Sx, Sx, Sx, 0x3b4a45, 0.4));
    function tick(t) {
      var u = frac(t / 9), e = S(0.14, 0.4, u) - S(0.62, 0.88, u), f = 1 + 0.55 * e, q, c, sc = s * (0.97 - 0.2 * e), gs;
      for (q = 0; q < N; q++) { c = P[q]; gs = c.gold ? 1 + 0.25 * e : 1; cm.set(q, c.x * f, c.y * f, c.z * f, sc * gs, sc * gs, sc * gs, 0, 0, 0, c.c); }
      cm.done();
    }
    tick(0);
    return { obj: g, r: 5.2, fit: 3.3, noSpin: false, tick: tick };
  });

  /* ---------------- 8. density ---------------- */
  LV3D.add('density', function (C, m) {
    var T = C.T, g = new T.Group(), R = 1.0, Hc = 6.0, yb = -3.0;
    var gl = mesh(C, lathe(C, [[0, 0], [R, 0], [R, Hc]], 36), glassMat(C)); gl.position.y = yb; gl.renderOrder = 2; g.add(gl);
    g.add(rimTorus(C, R, yb + Hc, 0.035)); g.add(hiStrip(C, R, 0.09, Hc * 0.82, 0.55, 0.05));
    var L = [[yb + 0.04, -0.8, '#dba33a', 0.62], [-0.8, 0.8, '#6fa8cc', 0.5], [0.8, 2.6, '#f0dc72', 0.5]], i;
    L.forEach(function (q, k) {
      var h = q[1] - q[0], lq = mesh(C, new T.CylinderGeometry(R - 0.04, R - 0.04, h, 36, 1, k > 0), liqMat(C, q[2], q[3])); lq.position.y = (q[0] + q[1]) / 2; lq.renderOrder = 1; g.add(lq);
      var d = mesh(C, new T.CircleGeometry(R - 0.04, 36), C.basic({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false })); d.rotation.x = -Math.PI / 2; d.position.y = q[1] + 0.004; g.add(d);
    });
    var ball = mesh(C, new T.SphereGeometry(0.48, 24, 18), C.phong({ color: '#b9c4cb', shininess: 110, spec: 0xffffff })); ball.position.set(0.05, yb + 0.04 + 0.48, 0.0); g.add(ball);
    var bead = mesh(C, new T.SphereGeometry(0.36, 20, 14), C.phong({ color: '#d65a4f', shininess: 90, spec: 0xffffff })); g.add(bead);
    var cork = mesh(C, new T.CylinderGeometry(0.4, 0.4, 0.5, 20), C.phong({ color: '#b98b5a', shininess: 10 })); g.add(cork);
    var cork2 = mesh(C, new T.CylinderGeometry(0.405, 0.405, 0.04, 20), C.phong({ color: '#9c7345', shininess: 10 })); cork.add(cork2); cork2.position.y = 0.2;
    function tick(t) {
      bead.position.set(-0.05, -0.8 + 0.04 + 0.05 * Math.sin(t * 1.1), 0.05);
      cork.position.set(0.02, 2.6 - 0.02 + 0.05 * Math.sin(t * 0.9 + 1), -0.02); cork.rotation.z = 0.04 * Math.sin(t * 0.7); cork.rotation.x = 0.03 * Math.sin(t * 0.8 + 2);
    }
    tick(0);
    return { obj: g, r: 3.5, fit: 3.9, noSpin: true, tick: tick };
  });
})();
(function () {
  var U = LV3D.util, sstep = U.sstep;
  var PI = Math.PI;

  /* ---------- formula + molecule shapes ---------- */
  function parse(f) {
    var out = [], re = /([A-Z][a-z]?)(\d*)/g, m;
    while ((m = re.exec(f))) { var n = m[2] ? +m[2] : 1; for (var i = 0; i < n; i++) out.push(m[1]); }
    return out;
  }
  function fib(n, R, k) {
    var o = [], ga = PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) { var y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * ga + (k || 0); o.push([R * r * Math.cos(a), R * y, R * r * Math.sin(a)]); }
    return o;
  }
  // returns {el:[], p:[[x,y,z]], bonds:[[i,j]], ext}
  function shape(f) {
    var el = parse(f), n = el.length, i, p = [], bonds = [], heavy = [], ci = -1, cnt = {};
    el.forEach(function (e) { cnt[e] = (cnt[e] || 0) + 1; });
    for (i = 0; i < n; i++) if (el[i] !== 'H') heavy.push(i);
    for (i = 0; i < heavy.length; i++) if (cnt[el[heavy[i]]] === 1) { ci = heavy[i]; break; }
    if (heavy.length === 1) ci = heavy[0];
    var S = 1.5, rd = function (e) { return U.erad(e) * S; };
    if (ci >= 0) {
      var nb = [], d;
      for (i = 0; i < n; i++) if (i !== ci) nb.push(i);
      var k = nb.length;
      if (k === 1) d = [[1, 0, 0]];
      else if (k === 2) { if (el[ci] === 'C' || el[ci] === 'Be') d = [[1, 0, 0], [-1, 0, 0]]; else { var a = 52.5 * PI / 180; d = [[Math.sin(a), -Math.cos(a), 0], [-Math.sin(a), -Math.cos(a), 0]]; } }
      else if (k === 3) d = [[0.94, -0.33, 0.0], [-0.47, -0.33, 0.81], [-0.47, -0.33, -0.81]];
      else if (k === 4) d = [[0, 1, 0], [0.94, -0.33, 0], [-0.47, -0.33, 0.82], [-0.47, -0.33, -0.82]];
      else d = fib(k, 1, 0.4);
      if (k === 3) d = [[0, 0.5, 0], [0.9, -0.3, 0], [-0.45, -0.3, 0.78]].slice(0, 0).concat([[0.95, -0.3, 0], [-0.48, -0.3, 0.82], [-0.48, -0.3, -0.82]]);
      p[ci] = [0, 0, 0];
      nb.forEach(function (j, q) {
        var L = (rd(el[ci]) + rd(el[j])) * 0.95, v = d[q], l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        p[j] = [v[0] / l * L, v[1] / l * L, v[2] / l * L]; bonds.push([ci, j]);
      });
    } else {
      var chain = heavy.length ? heavy : el.map(function (e, q) { return q; }), x = 0, y = 0, hs = [];
      for (i = 0; i < n; i++) if (heavy.length && el[i] === 'H') hs.push(i);
      chain.forEach(function (j, q) {
        var L = q ? (rd(el[chain[q - 1]]) + rd(el[j])) * 0.95 : 0;
        if (q) { x += L * 0.86; y += (q % 2 ? 1 : -1) * L * 0.5; }
        p[j] = [x, y, 0]; if (q) bonds.push([chain[q - 1], j]);
      });
      hs.forEach(function (j, q) {
        var host = chain[q % chain.length], hp = p[host], up = ((q % chain.length) % 2 ? 1 : -1), L = (rd(el[host]) + rd('H')) * 0.95, rnd = Math.floor(q / chain.length);
        var ang = rnd === 0 ? 1.15 : rnd === 1 ? 2.1 : 0.4;
        p[j] = [hp[0] + Math.sin(ang) * L * 0.45, hp[1] + up * Math.cos(ang < 1.6 ? 0.55 : -0.2) * L * 0.9, (rnd % 2 ? -1 : 1) * L * 0.7]; bonds.push([host, j]);
      });
    }
    var cx = 0, cy = 0, cz = 0;
    p.forEach(function (q) { cx += q[0]; cy += q[1]; cz += q[2]; }); cx /= n; cy /= n; cz /= n;
    var ext = 0;
    p = p.map(function (q, j) { var r = [q[0] - cx, q[1] - cy, q[2] - cz]; ext = Math.max(ext, Math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2]) + rd(el[j])); return r; });
    return { el: el, p: p, bonds: bonds, ext: ext };
  }
  // lay out copies in a row; returns atoms [{e,x,y,z}] and bonds on global indices
  function layout(list, cx, shapes) {
    var mols = [], ext = 0;
    list.forEach(function (it) { for (var c = 0; c < it[1]; c++) { var s = shape(it[0]); mols.push(s); ext = Math.max(ext, s.ext); } });
    var gap = 0.35, atoms = [], bonds = [], tot = mols.length, ca = Math.cos(0.5), sa = Math.sin(0.5), W = -gap, xs = [];
    mols.forEach(function (s) { xs.push(W + gap + s.ext); W += gap + 2 * s.ext; });
    mols.forEach(function (s, mi) {
      var ox = cx + xs[mi] - W / 2, base = atoms.length, th = mi * 1.3 + 0.4, ct = Math.cos(th * 0.35), st = Math.sin(th * 0.35);
      s.p.forEach(function (q, j) {
        var x = q[0] * ct - q[1] * st, y = q[0] * st + q[1] * ct, z = q[2];
        var y2 = y * ca - z * sa, z2 = y * sa + z * ca;
        atoms.push({ e: s.el[j], x: ox + x, y: y2, z: z2 });
      });
      s.bonds.forEach(function (b) { bonds.push([base + b[0], base + b[1]]); });
    });
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    atoms.forEach(function (a) { var r = U.erad(a.e) * 1.5; x0 = Math.min(x0, a.x - r); x1 = Math.max(x1, a.x + r); y0 = Math.min(y0, a.y - r); y1 = Math.max(y1, a.y + r); });
    atoms.forEach(function (a) { a.x -= (x0 + x1) / 2; a.y -= (y0 + y1) / 2; });
    return { atoms: atoms, bonds: bonds, w: x1 - x0, ext: ext };
  }
  function ease(x) { return x * x * (3 - 2 * x); }

  LV3D.add('reaction', function (C, m) {
    var THREE = C.T, g = new THREE.Group();
    var R = m.reactants || [['H2', 2], ['O2', 1]], P = m.products || [['H2O', 2]];
    var cR = {}, cP = {}, bal = true;
    R.forEach(function (it) { parse(it[0]).forEach(function (e) { cR[e] = (cR[e] || 0) + it[1]; }); });
    P.forEach(function (it) { parse(it[0]).forEach(function (e) { cP[e] = (cP[e] || 0) + it[1]; }); });
    Object.keys(cR).forEach(function (e) { if (cR[e] !== cP[e]) bal = false; });
    Object.keys(cP).forEach(function (e) { if (cR[e] !== cP[e]) bal = false; });
    var LR = layout(R, 0), LP = bal ? layout(P, 0) : null, w0 = LR.w, w1 = LP ? LP.w : 0;
    var n = LR.atoms.length, sph = C.spheres(n, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [20, 14]);
    var nbR = LR.bonds.length, nbP = LP ? LP.bonds.length : 0;
    var cm = C.phong({ color: 0xffffff, shininess: 20 });
    var cyR = C.cyls(nbR, cm, 8), cyP = C.cyls(Math.max(nbP, 1), cm, 8);
    if (!nbP) cyP.count = 0; if (!nbR) cyR.count = 0;
    var tgt = [], used = {};
    if (LP) LR.atoms.forEach(function (a, i) {
      for (var j = 0; j < LP.atoms.length; j++) if (LP.atoms[j].e === a.e && !used[j]) { used[j] = 1; tgt[i] = j; break; }
    });
    var rx = Math.max(w0, w1) / 2 + 0.1;
    var inv = []; tgt.forEach(function (j, q) { inv[j] = q; });
    var pos = []; for (var i = 0; i < n; i++) pos.push([0, 0, 0]);
    var grp = new THREE.Group(); g.add(grp); grp.add(sph); if (nbR) grp.add(cyR); if (nbP) grp.add(cyP);
    function tick(t) {
      var u = (t % 8) / 8, s = ease(sstep(0.2, 0.45, u)) - ease(sstep(0.7, 0.92, u)), i, a, b, q;
      if (!bal) { grp.rotation.y = Math.sin(t * 0.5) * 0.7; s = 0; }
      for (i = 0; i < n; i++) {
        a = LR.atoms[i]; var x = a.x, y = a.y, z = a.z;
        if (LP) {
          b = LP.atoms[tgt[i]]; q = Math.sin(s * PI);
          x += (b.x - a.x) * s; y += (b.y - a.y) * s + q * (0.6 + 0.35 * Math.sin(i * 2.3)); z += (b.z - a.z) * s + q * 0.6 * Math.cos(i * 1.7);
        }
        pos[i][0] = x; pos[i][1] = y; pos[i][2] = z;
        sph.set(i, x, y, z, U.erad(a.e) * 1.5 * (1 + 0.06 * Math.sin(s * PI)), U.ecol(a.e));
      }
      sph.done();
      var vr = 1 - sstep(0.0, 0.25, s) , vp = sstep(0.75, 1, s);
      for (i = 0; i < nbR; i++) { var br = LR.bonds[i], A = pos[br[0]], B = pos[br[1]]; cyR.set(i, A[0], A[1], A[2], B[0], B[1], B[2], 0.1 * vr + 0.0001, '#7f948c'); }
      if (nbR) cyR.done();
      for (i = 0; i < nbP; i++) { var bp = LP.bonds[i], ia = -1, ib = -1, k; ia = inv[bp[0]]; ib = inv[bp[1]]; var A2 = pos[ia], B2 = pos[ib]; cyP.set(i, A2[0], A2[1], A2[2], B2[0], B2[1], B2[2], 0.1 * vp + 0.0001, '#7f948c'); }
      if (nbP) cyP.done();
    }
    tick(0);
    return { obj: g, r: rx, tick: tick, noSpin: true, fit: 3.2 };
  });

  /* ---------- shared glass helpers ---------- */
  function glassMat(C, op) { return C.phong({ color: 0xcfe6dd, transparent: true, opacity: op || 0.2, depthWrite: false, side: C.T.DoubleSide, shininess: 90 }); }
  function fib(n, R, k) { var o = [], ga = Math.PI * (3 - Math.sqrt(5)); for (var i = 0; i < n; i++) { var y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * ga + (k || 0); o.push([R * r * Math.cos(a), R * y, R * r * Math.sin(a)]); } return o; }
  function ionCol(el) { return U.ecol(el); }

  /* ---------- 2. dissolve_ions ---------- */
  LV3D.add('dissolve_ions', function (C, m) {
    var THREE = C.T, g = new THREE.Group(), a = m.a || 'Na', b = m.b || 'Cl', rnd = U.rng(5), i, j, k;
    var Rg = 3.0, Hg = 4.6, Hw = 3.7, yb = -Hg / 2;
    var glass = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rg, Rg * 0.96, Hg, 28, 1, true)), glassMat(C, 0.2)); g.add(glass);
    var bot = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rg * 0.96, Rg * 0.96, 0.1, 28)), glassMat(C, 0.3)); bot.position.y = yb; g.add(bot);
    var wat = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rg * 0.985, Rg * 0.95, Hw, 28)), C.phong({ color: 0xa9d3e6, transparent: true, opacity: 0.32, depthWrite: false, shininess: 60 }));
    wat.position.y = yb + Hw / 2 + 0.05; g.add(wat);
    // crystal 3x3x3
    var sp = 0.8, cat = [], ions = [], q, cx = -1.7, cy = yb + 0.55, cz = 0;
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++)
      ions.push({ x: cx + (i - 1) * sp, y: cy + j * sp, z: cz + (k - 1) * sp, c: (i + j + k) % 2 === 0, i: i, j: j, k: k });
    var rc = 0.3, ra = 0.43;
    // leaving order: from the corner (+x, +y, +z) outward
    var order = ions.map(function (o, n) { return n; }).sort(function (p, q2) {
      var A = ions[p], B = ions[q2]; return (B.i + B.j + B.k + 0.01 * B.k) - (A.i + A.j + A.k + 0.01 * A.k);
    });
    var NL = 8, leave = order.slice(0, NL), tgt = [], ang;
    for (i = 0; i < NL; i++) { var f = (i + 0.5) / NL; ang = i * 2.4; tgt.push([-0.6 + 2.1 * f + 0.3 * Math.cos(ang), yb + 1.2 + 1.6 * ((i * 5) % NL) / NL + 0.2 * Math.sin(ang), 1.4 * Math.sin(ang * 1.3)]); }
    var iS = C.spheres(ions.length, C.phong({ color: 0xffffff, shininess: 80, spec: 0x555555 }), [14, 10]);
    var NW = 4, nw = NL * NW, wO = C.spheres(nw, C.phong({ color: 0xffffff, shininess: 60 }), [8, 6]), wH = C.spheres(nw * 2, C.phong({ color: 0xffffff, shininess: 60 }), [8, 6]);
    var wB = C.cyls(nw * 2, C.phong({ color: 0xe6edf0, shininess: 20 }), 6);
    var dirs = fib(NW, 1, 0.5), perp = dirs.map(function (u) { var px = -u[2], py = 0, pz = u[0], l = Math.sqrt(px * px + pz * pz) || 1; return [px / l, 0, pz / l]; });
    var tS = [], isL = {}; leave.forEach(function (n, q2) { isL[n] = q2; tS.push(1.0 + q2 * 0.55); });
    var T = 10, ca = Math.cos(0.9), sa = Math.sin(0.9);
    var sphO = ecolO(), sphH = ecolH();
    function ecolO() { return U.ecol('O'); } function ecolH() { return '#eef2f0'; }
    function tick(t) {
      var u = t % T, back = sstep(8.3, 9.4, u), fwd = 1 - sstep(9.4, 10, u) * 0, n, pt = [0, 0, 0];
      var vis = u > 9.4 ? sstep(9.4, 10, u) : 1;  // crystal reforms
      for (n = 0; n < ions.length; n++) {
        var o = ions[n], x = o.x, y = o.y, z = o.z, s = 1, q2 = isL[n];
        var r = o.c ? rc : ra, hex = ionCol(o.c ? a : b);
        if (q2 !== undefined) {
          var p = sstep(tS[q2], tS[q2] + 2.4, u), tg = tgt[q2], w = t * 0.9 + q2 * 1.7;
          x = o.x + (tg[0] - o.x) * p + 0.07 * Math.sin(w) * p; y = o.y + (tg[1] - o.y) * p + 0.07 * Math.sin(w * 1.3) * p; z = o.z + (tg[2] - o.z) * p + 0.07 * Math.cos(w) * p;
          s = (u > 8.3 ? 1 - back : 1) * (u >= 9.4 ? sstep(9.4, 10, u) : 1);
          if (u >= 9.4) { x = o.x; y = o.y; z = o.z; }
          // waters
          for (k = 0; k < NW; k++) {
            var wi = q2 * NW + k, ws = sstep(tS[q2] + 1.0, tS[q2] + 2.4, u) * (u > 8.3 ? 1 - back : 1) * (u >= 9.4 ? 0 : 1);
            var rot = t * 0.25 + q2, cr = Math.cos(rot), sr = Math.sin(rot), du = dirs[k], pp = perp[k];
            var ux = du[0] * cr - du[2] * sr, uz = du[0] * sr + du[2] * cr, uy = du[1], px = pp[0] * cr - pp[2] * sr, pz = pp[0] * sr + pp[2] * cr;
            var d0 = (r + 0.2 + 0.1) * 1.0, ox, oy, oz, h1, h2, sg = 0.5, cs = Math.cos(sg), sn = Math.sin(sg), hl = 0.3;
            if (o.c) { // oxygen toward cation
              ox = x + ux * (r + 0.25); oy = y + uy * (r + 0.25); oz = z + uz * (r + 0.25);
              h1 = [ox + (ux * cs + px * sn) * hl, oy + uy * cs * hl, oz + (uz * cs + pz * sn) * hl];
              h2 = [ox + (ux * cs - px * sn) * hl, oy + uy * cs * hl, oz + (uz * cs - pz * sn) * hl];
            } else { // hydrogens toward anion
              var dh = r + 0.12;
              h1 = [x + (ux * cs + px * sn * 0.9) * dh * 1.0 + ux * 0.1, y + uy * (cs * dh + 0.1), z + (uz * cs + pz * sn * 0.9) * dh + uz * 0.1];
              h2 = [x + (ux * cs - px * sn * 0.9) * dh + ux * 0.1, y + uy * (cs * dh + 0.1), z + (uz * cs - pz * sn * 0.9) * dh + uz * 0.1];
              ox = (h1[0] + h2[0]) / 2 + ux * 0.2; oy = (h1[1] + h2[1]) / 2 + uy * 0.2; oz = (h1[2] + h2[2]) / 2 + uz * 0.2;
            }
            var ro = 0.17 * ws + 0.0001, rh = 0.1 * ws + 0.0001;
            wO.set(wi, ox, oy, oz, ro, sphO); wH.set(wi * 2, h1[0], h1[1], h1[2], rh, sphH); wH.set(wi * 2 + 1, h2[0], h2[1], h2[2], rh, sphH);
            wB.set(wi * 2, ox, oy, oz, h1[0], h1[1], h1[2], 0.03 * ws + 0.0001, '#dfe8ec'); wB.set(wi * 2 + 1, ox, oy, oz, h2[0], h2[1], h2[2], 0.03 * ws + 0.0001, '#dfe8ec');
          }
        } else s = 1;
        if (q2 === undefined && u > 9.4) s = 1;
        iS.set(n, x, y, z, r * Math.max(s, 0.0001), hex);
      }
      iS.done(); wO.done(); wH.done(); wB.done();
    }
    tick(0);
    [iS, wO, wH, wB].forEach(function (o) { g.add(o); });
    g.rotation.x = 0.05;
    return { obj: g, r: 4.6, tick: tick, noSpin: true, fit: 3.0 };
  });

  /* ---------- 3. piston ---------- */
  LV3D.add('piston', function (C, m) {
    var THREE = C.T, g = new THREE.Group(), heat = m.mode === 'heat', rnd = U.rng(21), i, k;
    var Rc = 1.7, Hc = 5, yb = -Hc / 2, rp = 0.2, N = 26;
    var glass = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rc, Rc, Hc, 28, 1, true)), glassMat(C, 0.2)); g.add(glass);
    var baseM = C.phong({ color: 0x9fb0a9 }), base = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rc + 0.08, Rc + 0.08, 0.16, 28)), baseM); base.position.y = yb - 0.08; g.add(base);
    var pm = C.phong({ color: 0x3b4a45, shininess: 50 }), pis = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rc - 0.02, Rc - 0.02, 0.3, 28)), pm);
    var rod = new THREE.Mesh(C.g(new THREE.CylinderGeometry(0.14, 0.14, 1.9, 12)), C.phong({ color: 0x9fb0a9 }));
    var hnd = new THREE.Mesh(C.g(new THREE.CylinderGeometry(0.7, 0.7, 0.18, 20)), pm);
    g.add(pis); g.add(rod); g.add(hnd);
    var glow = [], j;
    if (heat) for (j = 0; j < 3; j++) { var gm = C.basic({ color: 0xf0a14a, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }); var d = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rc * (1.15 + 0.3 * j), Rc * (1.15 + 0.3 * j), 0.04, 28)), gm); d.position.y = yb - 0.3 - j * 0.01; glow.push([d, gm]); g.add(d); }
    var hs = C.spheres(N, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [14, 10]);
    var P = [], V = [], lim = Rc - rp - 0.05;
    for (i = 0; i < N; i++) {
      var rr = Math.sqrt(rnd()) * lim * 0.9, th = rnd() * 6.283; P.push([rr * Math.cos(th), yb + 0.3 + rnd() * 2.2, rr * Math.sin(th)]);
      var a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1); V.push([Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)]);
    }
    var cA = new THREE.Color('#4f86a8'), cB = new THREE.Color('#d65a4f'), cc = new THREE.Color();
    function state(t) {
      var u = (t % 8) / 8, w;
      if (heat) { w = sstep(0.12, 0.45, u) - sstep(0.62, 0.95, u); return { w: w, hv: 2.6 + 1.6 * w, sp: 1.6 + 3.2 * w }; }
      w = sstep(0.12, 0.42, u) - sstep(0.58, 0.88, u); return { w: w, hv: 4.4 - 2.2 * w, sp: 3.0 };
    }
    function tick(t, dt) {
      dt = Math.min(dt || 0, 0.04); var s = state(t), top = yb + s.hv, yt = top - 0.15 - rp, yl = yb + rp, i, p, v;
      pis.position.y = top + 0.0; rod.position.y = top + 0.95; hnd.position.y = top + 1.95;
      cc.copy(cA).lerp(cB, heat ? s.w : 0);
      for (i = 0; i < N; i++) {
        p = P[i]; v = V[i];
        p[0] += v[0] * s.sp * dt; p[1] += v[1] * s.sp * dt; p[2] += v[2] * s.sp * dt;
        var rr = Math.sqrt(p[0] * p[0] + p[2] * p[2]);
        if (rr > lim) { var nx = p[0] / rr, nz = p[2] / rr, dp = v[0] * nx + v[2] * nz; if (dp > 0) { v[0] -= 2 * dp * nx; v[2] -= 2 * dp * nz; } p[0] = nx * lim; p[2] = nz * lim; }
        if (p[1] > yt) { p[1] = yt; if (v[1] > 0) v[1] = -v[1]; }
        if (p[1] < yl) { p[1] = yl; if (v[1] < 0) v[1] = -v[1]; }
        hs.set(i, p[0], p[1], p[2], rp, '#' + cc.getHexString());
      }
      hs.done();
      for (var q = 0; q < glow.length; q++) glow[q][1].opacity = (0.04 + 0.2 * s.w) * (1 - q * 0.25); baseM.emissive.setRGB(0.55 * s.w, 0.25 * s.w, 0.05 * s.w);
    }
    tick(0, 0); g.add(hs);
    return { obj: g, r: 5.0, tick: tick, noSpin: true, fit: 3.1 };
  });

  /* ---------- 4. collision ---------- */
  LV3D.add('collision', function (C, m) {
    var THREE = C.T, g = new THREE.Group();
    // pairs: each pair has two diatomic molecules A-A (blue/gold) approaching along x at its own lane (y,z)
    var lanes = [[1.9, -0.6, 0.55, 'slow', 0], [-1.9, 0.4, 0.55, 'slow', 1.3], [0, 0, 0, 'fast', 0]];
    var T = 9, ra = 0.34, bl = 0.34;
    // slow lanes (top & bottom) bounce; fast lane centred, head-on, forms product
    var at = C.spheres(12, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [16, 12]);
    var bd = C.cyls(6, C.phong({ color: 0xdfe6e3, shininess: 20 }), 8);
    var flash = new THREE.Mesh(C.g(new THREE.SphereGeometry(1, 16, 12)), C.basic({ color: 0xffe9a8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); flash.visible = false;
    C.m(flash.material); g.add(flash);
    var halo = new THREE.Mesh(C.g(new THREE.SphereGeometry(1, 16, 12)), C.basic({ color: 0xf0a14a, transparent: true, opacity: 0, depthWrite: false })); halo.visible = false; g.add(halo);
    var streak = C.cyls(2, C.basic({ color: 0xc9a227, transparent: true, opacity: 0.22, depthWrite: false }), 6); g.add(streak);
    var lane = [{ y: 2.2, z: 0, v: 0.9 }, { y: -2.2, z: 0, v: 0.9 }, { y: 0, z: 0, v: 3.2 }];
    // molecule: centre (x), orientation angle; atoms at +-bl/2 along (cos a, sin a)
    function mol(i, x, y, z, ang, c1, c2) {
      var cx = Math.cos(ang) * bl, sy = Math.sin(ang) * bl;
      at.set(i * 2, x + cx, y + sy, z, ra, c1); at.set(i * 2 + 1, x - cx, y - sy, z, ra, c2);
      bd.set(i, x + cx, y + sy, z, x - cx, y - sy, z, 0.09, '#dfe6e3');
    }
    var cb = '#4f86a8', cg = '#c9a227';
    function tick(t) {
      var u = (t % T) / T, i, s;
      // slow lanes: approach to contact at u~0.4, bounce apart
      for (i = 0; i < 2; i++) {
        var L = lane[i], ph = u, d = 3.6 - 3.6 * 0, off = 0.6 + 2.2 * (1 - Math.min(1, ph / 0.38)) * (ph < 0.38 ? 1 : 0) + (ph >= 0.38 ? 2.2 * sstep(0.38, 0.9, ph) * 0 + 0 : 0);
        var xa, ang = 0.5 + i * 1.2 + ph * 1.5;
        if (ph < 0.38) { s = sstep(0, 0.38, ph); xa = 3.4 - 2.8 * s; } else { s = sstep(0.38, 0.95, ph); xa = 0.6 + 2.8 * s; if (ph > 0.95) xa = 3.4; }
        var yoff = L.y * 0.0, rock = ph >= 0.38 ? 0.35 * Math.sin((ph - 0.38) * 14) * (1 - s) : 0;
        var yb = L.y, dy = ph >= 0.38 ? 0.32 * s * (i ? -1 : 1) : 0;
        mol(i * 2, -xa, yb + dy, 0, ang + rock, i ? cg : cb, i ? cb : cg);
        mol(i * 2 + 1, xa, yb - dy, 0, -ang * 0.8 + rock, i ? cb : cg, i ? cg : cb);
        if (u > 0.95) { /* fade handled by scale loop below */ }
      }
      // fast lane: head-on at u=0.35; forms two product molecules? -> A2 + B2 -> 2 AB
      var f = lane[2];
      var uu = u, ap;
      if (uu < 0.4) { ap = sstep(0, 0.4, uu); var x = 4.6 - 4.1 * ap; mol(4, -x, 0, 0, 0.1, cb, cb); mol(5, x, 0, 0, 0.1, cg, cg); var sv = ap < 0.97 ? 0.05 : 0.0001; streak.set(0, -x - 0.55, 0, 0, -x - 1.1 - 0.9 * (1 - ap), 0, 0, sv, '#4f86a8'); streak.set(1, x + 0.55, 0, 0, x + 1.1 + 0.9 * (1 - ap), 0, 0, sv, '#c9a227'); }
      else { streak.set(0, 0, 0, 0, 0, 0, 0.1, 0.0001, '#4f86a8'); streak.set(1, 0, 0, 0, 0, 0, 0.1, 0.0001, '#c9a227'); ap = sstep(0.4, 0.9, uu); var y2 = 3.0 * ap; mol(4, -0.55 - 0.9 * ap, y2, 0, 0.9, cb, cg); mol(5, 0.55 + 0.9 * ap, -y2, 0, -0.9, cb, cg); }
      // flash
      var fv = 0; if (u > 0.37 && u < 0.6) fv = Math.sin(PI * (u - 0.37) / 0.23);
      flash.visible = fv > 0.01; flash.scale.setScalar(0.35 + 0.7 * fv); flash.material.opacity = 0.4 * fv;
      at.done(); bd.done(); streak.done();
    }
    tick(0); g.add(at); g.add(bd);
    return { obj: g, r: 5.2, tick: tick, noSpin: true, fit: 2.9 };
  });

  /* ---------- 5. energy_profile ---------- */
  LV3D.add('energy_profile', function (C, m) {
    var THREE = C.T, g = new THREE.Group(), exo = m.exo !== false, i;
    var y1 = exo ? -1.3 : 1.3, Hh = exo ? 2.6 : 2.0;
    function prof(x) { return y1 * sstep(-1.7, 1.7, x) + Hh * Math.exp(-x * x / 0.8); }
    var pts = [], X0 = -4.2, X1 = 4.2;
    for (i = 0; i <= 64; i++) { var x = X0 + (X1 - X0) * i / 64; pts.push(new THREE.Vector3(x, prof(x), 0)); }
    var curve = new THREE.CatmullRomCurve3(pts);
    var tube = new THREE.Mesh(C.g(new THREE.TubeGeometry(curve, 96, 0.1, 8, false)), C.phong({ color: 0x00664a, emissive: new THREE.Color('#2f9e6e'), emissiveIntensity: 0.35, shininess: 60 }));
    var halo = new THREE.Mesh(C.g(new THREE.TubeGeometry(curve, 96, 0.26, 8, false)), C.basic({ color: 0x2f9e6e, transparent: true, opacity: 0.16, depthWrite: false }));
    g.add(tube); g.add(halo);
    var yb = -2.5, xa = -4.9;
    g.add(C.line([xa, yb, 0, xa, 3.6, 0, xa, 3.6, 0, xa - 0.16, 3.2, 0, xa, 3.6, 0, xa + 0.16, 3.2, 0, xa, yb, 0, 4.9, yb, 0, 4.9, yb, 0, 4.5, yb + 0.16, 0, 4.9, yb, 0, 4.5, yb - 0.16, 0], 0x6f817a, 0.7));
    // level guides and brackets
    var d = [], xx; for (xx = -4.2; xx < 4.2; xx += 0.36) { d.push(xx, 0, 0, xx + 0.18, 0, 0); } for (xx = -4.2; xx < 4.2; xx += 0.36) { d.push(xx, y1, 0, xx + 0.18, y1, 0); }
    var lv = C.line(d, 0x8a9a94, 0.35); g.add(lv);
    var pk = Hh, ea = C.line([-2.7, 0, 0, -2.7, pk, 0, -2.7, pk, 0, -2.82, pk - 0.22, 0, -2.7, pk, 0, -2.58, pk - 0.22, 0, -2.7, 0, 0, -2.82, 0.22, 0, -2.7, 0, 0, -2.58, 0.22, 0], 0xc9a227, 0.95);
    var dh = C.line([3.3, 0, 0, 3.3, y1, 0, 3.3, y1, 0, 3.18, y1 + (exo ? 0.22 : -0.22), 0, 3.3, y1, 0, 3.42, y1 + (exo ? 0.22 : -0.22), 0], 0xd65a4f, 0.95);
    g.add(ea); g.add(dh);
    var ball = new THREE.Mesh(C.g(new THREE.SphereGeometry(0.3, 20, 14)), C.phong({ color: 0xc9a227, emissive: new THREE.Color('#c9a227'), emissiveIntensity: 0.25, shininess: 90, transparent: true }));
    var bh = new THREE.Mesh(C.g(new THREE.SphereGeometry(0.62, 14, 10)), C.basic({ color: 0xf0d36a, transparent: true, opacity: 0.2, depthWrite: false }));
    g.add(ball); g.add(bh);
    function tick(t) {
      var u = (t % 9) / 9, s = sstep(0.14, 0.62, u), xb = -3.6 + 7.2 * (s + 0.09 * Math.sin(6.2832 * s)), p = 1;
      if (u > 0.62) xb += 0.25 * Math.sin((u - 0.62) * 28) * Math.exp(-(u - 0.62) * 14) * 0.6;
      var yb2 = prof(xb) + 0.4, dx = 0.05, sl = (prof(xb + dx) - prof(xb - dx)) / (2 * dx), n = Math.sqrt(1 + sl * sl);
      var o = u < 0.62 || u > 0.62 ? 1 : 1, fade = u > 0.93 ? 1 - sstep(0.93, 1, u) : (u < 0.04 ? sstep(0, 0.04, u) : 1);
      ball.position.set(xb - sl / n * 0.3 + sl / n * 0.3, prof(xb) + 0.1 + 0.3 * 1.0 / n * 1.0 + 0.05, 0);
      ball.material.opacity = fade; ball.scale.setScalar(0.4 + 0.6 * fade); bh.position.copy(ball.position); bh.scale.setScalar(1 + 0.15 * Math.sin(t * 3)); bh.material.opacity = 0.18 * fade;
    }
    tick(0);
    g.position.y = -0.6; var w = new THREE.Group(); w.add(g);
    return { obj: w, r: 5.5, tick: tick, noSpin: true, fit: 2.7 };
  });

  /* ---------- 6. equilibrium ---------- */
  LV3D.add('equilibrium', function (C, m) {
    var THREE = C.T, g = new THREE.Group(), rnd = U.rng(33), i, k, N = 30, T = 14, Rc = 1.6, Hc = 3.8, yb = -Hc / 2, rp = 0.2;
    g.position.x = -0.5;
    var fl = new THREE.Group(); fl.position.x = -1.7; g.add(fl);
    var body = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rc, Rc, Hc, 28, 1, true)), glassMat(C, 0.2)); fl.add(body);
    var bt = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rc, Rc, 0.1, 28)), glassMat(C, 0.3)); bt.position.y = yb; fl.add(bt);
    var lid = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rc + 0.05, Rc + 0.05, 0.2, 28)), C.phong({ color: 0x3b4a45 })); lid.position.y = -yb + 0.1; fl.add(lid);
    // precomputed flips
    var A = '#4f86a8', B = '#c9a227', kf = 0.26, kb = 0.2, st = [], flips = [], dts = 0.05, step;
    for (i = 0; i < N; i++) { st.push(0); flips.push([]); }
    for (step = 0; step < T * 0.8 / dts; step++) { var tt = step * dts; for (i = 0; i < N; i++) { if (rnd() < (st[i] === 0 ? kf : kb) * dts) { st[i] ^= 1; flips[i].push(tt); } } }
    var P = [], V = [], lim = Rc - rp - 0.05, ca = new THREE.Color(A), cb = new THREE.Color(B), cc = new THREE.Color();
    for (i = 0; i < N; i++) {
      var rr = Math.sqrt(rnd()) * lim * 0.9, th = rnd() * 6.283; P.push([rr * Math.cos(th), yb + 0.3 + rnd() * (Hc - 0.6), rr * Math.sin(th)]);
      var a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1); V.push([Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)]);
    }
    var hs = C.spheres(N, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [14, 10]); fl.add(hs);
    // gauge
    var gx = 3.2, gh = 3.4, gy = yb;
    var bm = new THREE.Mesh(C.g(new THREE.BoxGeometry(0.6, 1, 0.6)), C.phong({ color: 0x4f86a8 })), bn = new THREE.Mesh(C.g(new THREE.BoxGeometry(0.6, 1, 0.6)), C.phong({ color: 0xc9a227 }));
    bm.position.x = gx - 0.55; bn.position.x = gx + 0.55; g.add(bm); g.add(bn);
    g.add(C.line([gx - 1.2, gy, 0, gx + 1.2, gy, 0, gx - 1.2, gy, 0, gx - 1.2, gy + gh, 0], 0x6f817a, 0.7));
    function flipState(i, t) { var f = flips[i], c = 0, mix = 0, j; for (j = 0; j < f.length && f[j] <= t; j++) { c++; mix = sstep(f[j], f[j] + 0.45, t) ; if (j + 1 < f.length && f[j + 1] <= t) mix = 1; } return [c & 1, c, mix]; }
    function tick(t, dt) {
      dt = Math.min(dt || 0, 0.04); var u = t % T, sc = (u > 12.6 ? 1 - sstep(12.6, 13.4, u) : 1) * (u < 0.6 ? sstep(0, 0.6, u) : 1), na = 0, nb = 0, i;
      if (u >= 13.4) sc = 0; if (u > 13.4) sc = sstep(13.4, 14, u) * 0;
      var fadeIn = u >= 13.4 ? sstep(13.4, 14, u) : 1; if (u >= 13.4) sc = fadeIn;
      for (i = 0; i < N; i++) {
        var p = P[i], v = V[i], sp = 1.9;
        p[0] += v[0] * sp * dt; p[1] += v[1] * sp * dt; p[2] += v[2] * sp * dt;
        var rr = Math.sqrt(p[0] * p[0] + p[2] * p[2]);
        if (rr > lim) { var nx = p[0] / rr, nz = p[2] / rr, dp = v[0] * nx + v[2] * nz; if (dp > 0) { v[0] -= 2 * dp * nx; v[2] -= 2 * dp * nz; } p[0] = nx * lim; p[2] = nz * lim; }
        if (p[1] > -yb - rp - 0.05) { p[1] = -yb - rp - 0.05; if (v[1] > 0) v[1] = -v[1]; } if (p[1] < yb + rp) { p[1] = yb + rp; if (v[1] < 0) v[1] = -v[1]; }
        var tu = u >= 13.4 ? 0 : u, fs = flipState(i, tu), cur = fs[0], mix = fs[2], bf;
        if (fs[1] === 0) bf = 0; else bf = cur === 1 ? mix : 1 - mix;
        cc.copy(ca).lerp(cb, bf); nb += bf; na += 1 - bf;
        hs.set(i, p[0], p[1], p[2], rp * Math.max(sc, 0.0001), '#' + cc.getHexString());
      }
      hs.done();
      var ha = na / N * gh * sc, hb = nb / N * gh * sc;
      bm.scale.y = Math.max(ha, 0.001); bm.position.y = gy + ha / 2; bn.scale.y = Math.max(hb, 0.001); bn.position.y = gy + hb / 2;
    }
    tick(0, 0);
    return { obj: g, r: 5.2, tick: tick, noSpin: true, fit: 2.9 };
  });

  /* ---------- 7. osmosis ---------- */
  LV3D.add('osmosis', function (C, m) {
    var THREE = C.T, g = new THREE.Group(), rnd = U.rng(8), i;
    var ax = 1.75, Ra = 0.95, yb = -1.6, ytop = 2.9, T = 12;
    var gm = glassMat(C, 0.2), lm = C.phong({ color: 0xa9d3e6, transparent: true, opacity: 0.5, depthWrite: false, shininess: 60 });
    function cyl(r, h, mat, x, y, z, rot) { var o = new THREE.Mesh(C.g(new THREE.CylinderGeometry(r, r, h, 24, 1, true)), mat); o.position.set(x, y, z); if (rot) o.rotation.z = Math.PI / 2; g.add(o); return o; }
    cyl(Ra, ytop - yb, gm, -ax, (ytop + yb) / 2, 0); cyl(Ra, ytop - yb, gm, ax, (ytop + yb) / 2, 0); cyl(Ra, 2 * ax, gm, 0, yb, 0, true);
    [-ax, ax].forEach(function (x) { var s = new THREE.Mesh(C.g(new THREE.SphereGeometry(Ra, 20, 14)), gm); s.position.set(x, yb, 0); g.add(s); });
    // liquids: unit-height cylinders, scaled in y
    var mkL = function (x) { var o = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Ra * 0.97, Ra * 0.97, 1, 24)), lm); o.position.x = x; g.add(o); return o; };
    var lL = mkL(-ax), lR = mkL(ax); var lB = cyl(Ra * 0.97, 2 * ax, lm, 0, yb, 0, true); lB.geometry = C.g(new THREE.CylinderGeometry(Ra * 0.97, Ra * 0.97, 2 * ax, 24)); lB.rotation.z = Math.PI / 2;
    [-ax, ax].forEach(function (x) { var s = new THREE.Mesh(C.g(new THREE.SphereGeometry(Ra * 0.97, 20, 14)), lm); s.position.set(x, yb, 0); g.add(s); });
    // membrane
    var mem = new THREE.Mesh(C.g(new THREE.CircleGeometry(Ra, 24)), C.phong({ color: 0x8e6cc6, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })); mem.rotation.y = Math.PI / 2; mem.position.set(0, yb, 0); g.add(mem);
    var ring = []; for (i = 0; i < 12; i++) { var a0 = i / 12 * 6.2832, a1 = (i + 0.55) / 12 * 6.2832; ring.push(0, yb + Math.cos(a0) * Ra, Math.sin(a0) * Ra, 0, yb + Math.cos(a1) * Ra, Math.sin(a1) * Ra); }
    g.add(C.line(ring, 0x8e6cc6, 0.8));
    var NW = 60, NS = 9, hw = C.spheres(NW, C.phong({ color: 0xffffff, shininess: 80, spec: 0x555555 }), [10, 8]), hsl = C.spheres(NS, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [14, 10]);
    var P = [], V = [], S = [], SV = [], rw = 0.12, rs = 0.22;
    function lv(t) { var u = (t % T) / T, w = sstep(0.1, 0.8, u) * (1 - sstep(0.9, 1, u)); return [3.0 - 0.8 * w, 3.0 + 0.75 * w]; }
    function inside(x, y, hl, hr, solute) {
      var rad = Ra * 0.97 - 0.14;
      if (Math.abs(x + ax) <= rad && y > yb && y < hl - 0.08 + yb * 0 - 0.0 && !solute) return true;
      if (Math.abs(x - ax) <= rad && y < hr - 0.08) return true;
      if (Math.abs(y - yb) <= rad && Math.abs(x) <= ax + rad && (!solute || x > 0.1)) return true;
      if (Math.abs(x + ax) <= rad && y <= yb) return !solute;
      return false;
    }
    function rv() { var a = rnd() * 6.283, b = Math.acos(2 * rnd() - 1); return [Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)]; }
    for (i = 0; i < NW; i++) { var left = i % 5 < 3; P.push([(left ? -ax : ax) + (rnd() - 0.5) * 1.0, yb + 0.5 + rnd() * 2.4, (rnd() - 0.5) * 1.0]); V.push(rv()); }
    for (i = 0; i < NS; i++) { S.push([ax + (rnd() - 0.5) * 1.0, yb + 0.5 + rnd() * 1.6, (rnd() - 0.5) * 1.0]); SV.push(rv()); }
    function tick(t, dt) {
      dt = Math.min(dt || 0, 0.04); var L = lv(t), hl = L[0] + yb + 0.0, hr = L[1] + yb + 0.0, i, p, v, np;
      // liquid levels measured from the bottom of arm (yb)
      hl = L[0] + yb; hr = L[1] + yb;
      lL.scale.y = hl - yb; lL.position.y = (hl + yb) / 2; lR.scale.y = hr - yb; lR.position.y = (hr + yb) / 2;
      for (i = 0; i < NW; i++) {
        p = P[i]; v = V[i]; var sp = 1.5;
        var nx = p[0] + v[0] * sp * dt, ny = p[1] + v[1] * sp * dt, nz = p[2] + v[2] * sp * dt;
        // bias: net flow left to right through the membrane
        if (p[0] < 0 && p[0] > -0.9 && p[1] < yb + 0.7 && v[0] < 0 && rnd() < 0.08) v[0] = -v[0];
        if (p[0] > 0 && p[0] < 0.6 && v[0] < 0 && rnd() < 0.045) v[0] = -v[0];
        if (inside(nx, ny, hl, hr, false) && nx * nx + nz * nz < 99 && Math.abs(nz) < Ra * 0.8 - 0.1 * 0 - 0.0) { p[0] = nx; p[1] = ny; p[2] = nz; } else { v[0] = -v[0] + (rnd() - 0.5) * 0.6; v[1] = -v[1] + (rnd() - 0.5) * 0.6; v[2] = -v[2]; }
        hw.set(i, p[0], p[1], p[2], rw, '#4f86a8');
      }
      for (i = 0; i < NS; i++) {
        p = S[i]; v = SV[i]; var sp2 = 0.8;
        var nx2 = p[0] + v[0] * sp2 * dt, ny2 = p[1] + v[1] * sp2 * dt, nz2 = p[2] + v[2] * sp2 * dt;
        if (inside(nx2, ny2, hl, hr, true) && Math.abs(nz2) < Ra * 0.8 - 0.15) { p[0] = nx2; p[1] = ny2; p[2] = nz2; } else { v[0] = -v[0]; v[1] = -v[1]; v[2] = -v[2]; if (p[1] > hr - 0.4) p[1] -= 0.05; }
        hsl.set(i, p[0], p[1], p[2], rs, '#c9a227');
      }
      hw.done(); hsl.done();
    }
    tick(0, 0); g.add(hw); g.add(hsl);
    g.position.y = -0.2;
    return { obj: g, r: 4.6, tick: tick, noSpin: true, fit: 3.0 };
  });

  /* ---------- 8. electrolyte ---------- */
  LV3D.add('electrolyte', function (C, m) {
    var THREE = C.T, g = new THREE.Group(), type = m.type || 'strong', rnd = U.rng(14), i;
    var Rg = 2.5, Hg = 3.2, yb = -Hg / 2 - 0.6, Hw = 2.5, T = 8;
    var glass = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rg, Rg * 0.96, Hg, 28, 1, true)), glassMat(C, 0.2)); glass.position.y = yb + Hg / 2; g.add(glass);
    var bot = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rg * 0.96, Rg * 0.96, 0.1, 28)), glassMat(C, 0.3)); bot.position.y = yb; g.add(bot);
    var wat = new THREE.Mesh(C.g(new THREE.CylinderGeometry(Rg * 0.985, Rg * 0.95, Hw, 28)), C.phong({ color: 0xa9d3e6, transparent: true, opacity: 0.3, depthWrite: false, shininess: 60 }));
    wat.position.y = yb + Hw / 2 + 0.05; g.add(wat);
    var ex = 1.7, ytopE = yb + 3.0, emat = C.phong({ color: 0x4a5753, shininess: 40 });
    [-ex, ex].forEach(function (x, q) {
      var e = new THREE.Mesh(C.g(new THREE.CylinderGeometry(0.17, 0.17, ytopE - (yb + 0.45), 12)), emat); e.position.set(x, (ytopE + yb + 0.45) / 2, 0); g.add(e);
      var cap = new THREE.Mesh(C.g(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 12)), C.phong({ color: q ? 0xd65a4f : 0x4f86a8 })); cap.position.set(x, ytopE + 0.1, 0); g.add(cap);
    });
    // wires and bulb
    var wy = ytopE + 0.9, wm = C.phong({ color: 0x6f817a, shininess: 20 }), wr = C.cyls(5, wm, 6);
    wr.set(0, -ex, ytopE + 0.2, 0, -ex, wy, 0, 0.05, '#6f817a'); wr.set(1, ex, ytopE + 0.2, 0, ex, wy, 0, 0.05, '#6f817a');
    wr.set(2, -ex, wy, 0, -0.55, wy, 0, 0.05, '#6f817a'); wr.set(3, ex, wy, 0, 0.9, wy, 0, 0.05, '#6f817a'); wr.set(4, 0.55, wy, 0, 0.9, wy, 0, 0.05, '#6f817a'); wr.done(); g.add(wr);
    var bat = new THREE.Mesh(C.g(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 14)), C.phong({ color: 0x2f9e6e })); bat.rotation.z = Math.PI / 2; bat.position.set(1.2, wy, 0); g.add(bat);
    var glow = type === 'strong' ? 1 : type === 'weak' ? 0.28 : 0;
    var by = wy + 0.62, bulbM = C.phong({ color: 0xffffff, emissive: new THREE.Color(glow ? '#ffe9a0' : '#000000'), emissiveIntensity: glow * 0.55, transparent: true, opacity: 0.75, shininess: 90 });
    var bulb = new THREE.Mesh(C.g(new THREE.SphereGeometry(0.55, 20, 14)), bulbM); bulb.position.set(0, by, 0); g.add(bulb);
    var base = new THREE.Mesh(C.g(new THREE.CylinderGeometry(0.28, 0.28, 0.35, 12)), C.phong({ color: 0x8a9a94 })); base.position.set(0, wy + 0.1, 0); g.add(base);
    var hm = C.basic({ color: 0xffd966, transparent: true, opacity: glow * 0.07, depthWrite: false, blending: THREE.AdditiveBlending });
    var halo = new THREE.Mesh(C.g(new THREE.SphereGeometry(0.85, 16, 12)), hm); halo.position.set(0, by, 0); g.add(halo);
    var fil = C.line([-0.15, by - 0.2, 0, -0.1, by + 0.1, 0, -0.1, by + 0.1, 0, 0.1, by + 0.1, 0, 0.1, by + 0.1, 0, 0.15, by - 0.2, 0], glow ? 0xe0a020 : 0x8a9a94, 1); g.add(fil);
    // particles
    var nc = type === 'strong' ? 14 : type === 'weak' ? 4 : 0, nn = type === 'strong' ? 0 : type === 'weak' ? 24 : 34;
    var cat = C.spheres(Math.max(nc, 1), C.phong({ color: 0xffffff, shininess: 80, spec: 0x555555 }), [12, 9]), ani = C.spheres(Math.max(nc, 1), C.phong({ color: 0xffffff, shininess: 80, spec: 0x555555 }), [12, 9]);
    var nm = C.spheres(Math.max(nn, 1), C.phong({ color: 0xffffff, shininess: 60 }), [12, 9]), nm2 = C.spheres(Math.max(nn, 1), C.phong({ color: 0xffffff, shininess: 60 }), [8, 6]);
    var rp = [], rn = [], spd = type === 'strong' ? 1 : 0.6, yw0 = yb + 0.4, yw1 = yb + Hw - 0.2;
    for (i = 0; i < nc; i++) { rp.push([rnd(), yw0 + rnd() * (yw1 - yw0), (rnd() - 0.5) * 2.2, rnd() * 6.28]); rn.push([rnd(), yw0 + rnd() * (yw1 - yw0), (rnd() - 0.5) * 2.2, rnd() * 6.28]); }
    var nb = []; for (i = 0; i < nn; i++) nb.push([(rnd() - 0.5) * 2 * (Rg - 0.9), yw0 + rnd() * (yw1 - yw0), (rnd() - 0.5) * 2.4, rnd() * 6.28, 0.3 + rnd() * 0.4]);
    function tick(t) {
      var i, x, f, w;
      for (i = 0; i < nc; i++) {
        f = (t * spd / T + rp[i][0]) % 1; x = ex * 0.0 + (1 - f) * 1.0; // cations move left toward the negative electrode
        var xs = -(Rg - 0.7) + 0, xe = -ex + 0.35; w = Math.min(1, sstep(0, 0.1, f) * sstep(1, 0.88, f));
        var sx = ex * 0.75 + 0.0; // start near the middle-right
        var px = (0.4 * (rp[i][2])) + (xe) + (-xe - 0.0) * 0; px = xe + (-0.3 + 1.5 * (rp[i][3] / 6.29) - xe) * (1 - f);
        cat.set(i, px, rp[i][1] + 0.08 * Math.sin(t * 1.6 + rp[i][3]), rp[i][2] + 0.1 * Math.cos(t + rp[i][3]), 0.2 * Math.max(w, 0.0001), '#8e6cc6');
        f = (t * spd / T + rn[i][0]) % 1; w = Math.min(1, sstep(0, 0.1, f) * sstep(1, 0.88, f));
        px = (ex - 0.35) + (1.2 - 1.5 * (rn[i][3] / 6.29) - (ex - 0.35)) * (1 - f);
        ani.set(i, px, rn[i][1] + 0.08 * Math.sin(t * 1.5 + rn[i][3]), rn[i][2] + 0.1 * Math.cos(t * 1.1 + rn[i][3]), 0.26 * Math.max(w, 0.0001), '#2f9e6e');
      }
      for (i = 0; i < nn; i++) {
        var q = nb[i], tt = t * 0.5 * q[4] * 1.6 + q[3], a = 0.35;
        x = q[0] + a * Math.sin(tt); nm.set(i, x, q[1] + a * 0.6 * Math.cos(tt * 1.2), q[2] + a * Math.sin(tt * 0.8), 0.2, type === 'non' ? '#d9c48a' : '#c8d3cf');
        nm2.set(i, x + 0.2 * Math.cos(tt * 0.9 + 1), q[1] + a * 0.6 * Math.cos(tt * 1.2) + 0.17, q[2] + a * Math.sin(tt * 0.8) + 0.1, 0.11, type === 'non' ? '#f0e3b0' : '#e8eeeb');
      }
      if (nc) { cat.done(); ani.done(); } if (nn) { nm.done(); nm2.done(); }
      if (glow) { var pl = 1 + 0.05 * Math.sin(t * 2); halo.scale.setScalar(pl); }
    }
    tick(0);
    if (nc) { g.add(cat); g.add(ani); } if (nn) { g.add(nm); g.add(nm2); }
    g.position.y = -0.6; var w = new THREE.Group(); w.add(g);
    return { obj: w, r: 4.6, tick: tick, noSpin: true, fit: 3.1 };
  });
})();
(function () {
  var U = LV3D.util, TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function mix(a, b, t) {
    var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (((ar + (br - ar) * t) << 16) | ((ag + (bg - ag) * t) << 8) | (ab + (bb - ab) * t));
  }
  function hx(s) { return typeof s === 'string' ? parseInt(s.replace('#', ''), 16) : s; }
  function bump(u, a, b, c, d) { return U.sstep(a, b, u) * (1 - U.sstep(c, d, u)); }
  var RED = 0xd65a4f, GRAY = 0xa3aeaa, GOLD = 0xc9a227;

  // face-centred packing of n nucleons (touching spheres of diameter d), centred, lightly jittered
  function fcc(n, d, rnd) {
    var s = d / Math.SQRT2, a = [], R = 5, i, j, k, cx = 0, cy = 0, cz = 0, out = [];
    for (i = -R; i <= R; i++) for (j = -R; j <= R; j++) for (k = -R; k <= R; k++) {
      if (Math.abs(i + j + k) % 2 === 0) {
        var x = i * s, y = j * s, z = k * s;
        a.push({ x: x, y: y, z: z, q: (x - 0.11) * (x - 0.11) + (y - 0.07) * (y - 0.07) + (z - 0.05) * (z - 0.05) + rnd() * 0.002 });
      }
    }
    a.sort(function (p, q) { return p.q - q.q; }); a = a.slice(0, n);
    for (i = 0; i < n; i++) { cx += a[i].x; cy += a[i].y; cz += a[i].z; }
    cx /= n; cy /= n; cz /= n;
    for (i = 0; i < n; i++) out.push(a[i].x - cx + (rnd() - 0.5) * 0.05, a[i].y - cy + (rnd() - 0.5) * 0.05, a[i].z - cz + (rnd() - 0.5) * 0.05);
    return out;
  }
  // wavy ray built from instanced cylinders; wave lies in the xy plane, travelling along unit (dx,dy,0)
  function setWave(mesh, n, ox, oy, oz, dx, dy, s0, len, amp, k, ph, rad, smin) {
    var px = -dy, py = dx, i, s, env, off, x, y, ax = 0, ay = 0, az = 0;
    for (i = 0; i <= n; i++) {
      s = s0 + len * i / n; env = Math.sin(Math.PI * i / n); off = amp * env * Math.sin(k * s - ph);
      x = ox + dx * s + px * off; y = oy + dy * s + py * off;
      if (i > 0) mesh.set(i - 1, ax, ay, az, x, y, oz, s < smin ? 0 : rad, 0xffffff);
      ax = x; ay = y; az = oz;
    }
    mesh.done();
  }
  function glowSphere(C, hex, op, seg) {
    var T = C.T, m = new T.Mesh(C.g(new T.SphereGeometry(1, seg || 16, seg ? seg - 4 : 12)), C.basic({ color: hex, transparent: true, opacity: op, depthWrite: false }));
    m.visible = false; return m;
  }
  function spriteText(C, txt, px, font, color, w, h) {
    var T = C.T, cv = document.createElement('canvas'); cv.width = w || 128; cv.height = h || 128;
    var cx = cv.getContext('2d'); cx.clearRect(0, 0, cv.width, cv.height); cx.fillStyle = color; cx.font = font; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(txt, cv.width / 2, cv.height / 2 + px);
    var tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
    C.m({ dispose: function () { tex.dispose(); } });
    var mat = C.m(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    return new T.Sprite(mat);
  }

  /* ---------------------------------------------------------------- 1. decay */
  LV3D.add('decay', function (C, m) {
    var T = C.T, g = new T.Group(), type = m.type || 'alpha', PER = 8, TP = TAU / PER;
    var rnd = U.rng(type === 'alpha' ? 5 : type === 'beta' ? 9 : 13), N = 18, P = fcc(N, 1.0, rnd), OX = -2.6, i, j;
    var dx = type === 'gamma' ? 0.92 : 0.95, dy = type === 'gamma' ? 0.38 : 0.3, dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
    var ord = [], col = [], cl = [], e = -1;
    for (i = 0; i < N; i++) ord.push(i);
    ord.sort(function (a, b) { return (P[3 * b] * dx + P[3 * b + 1] * dy) - (P[3 * a] * dx + P[3 * a + 1] * dy); });
    var pool = []; for (i = 0; i < N; i++) pool.push(i < N / 2 ? RED : GRAY);
    for (i = N - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    for (i = 0; i < N; i++) col[i] = pool[i];
    if (type === 'alpha') {
      var a0 = ord[0], dd = [];
      for (i = 0; i < N; i++) dd.push([Math.hypot(P[3 * i] - P[3 * a0], P[3 * i + 1] - P[3 * a0 + 1], P[3 * i + 2] - P[3 * a0 + 2]), i]);
      dd.sort(function (a, b) { return a[0] - b[0]; });
      for (i = 0; i < 4; i++) cl.push(dd[i][1]);
      var cc = [RED, GRAY, RED, GRAY];
      // keep overall count balanced
      var nr = 0, k2; for (i = 0; i < N; i++) if (cl.indexOf(i) < 0 && col[i] === RED) nr++;
      for (i = 0; i < 4; i++) col[cl[i]] = cc[i];
      var want = N / 2 - 2, rest = []; for (i = 0; i < N; i++) if (cl.indexOf(i) < 0) rest.push(i);
      for (k2 = 0; k2 < rest.length; k2++) col[rest[k2]] = k2 < want ? RED : GRAY;
      for (i = rest.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var q = col[rest[i]]; col[rest[i]] = col[rest[j]]; col[rest[j]] = q; }
    }
    if (type === 'beta') { for (i = 0; i < N; i++) { e = ord[i]; if (col[e] === GRAY) break; } }
    var nm = C.spheres(N, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [14, 10]); g.add(nm);
    var jf = [], jp = []; for (i = 0; i < N * 3; i++) { jf.push(TP * (2 + Math.floor(rnd() * 3))); jp.push(rnd() * 6.283); }
    var halo = glowSphere(C, GOLD, 0.18), flash = glowSphere(C, 0xffe9a8, 0.3); g.add(halo); g.add(flash);
    var tr = C.spheres(6, C.basic({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }), [10, 8]); g.add(tr);
    var el, W1, W2, ew = 0;
    if (type === 'beta') { el = C.spheres(1, C.phong({ color: 0xffffff, shininess: 80 }), [14, 10]); g.add(el); }
    if (type === 'gamma') { W1 = C.cyls(28, C.basic({ color: 0xe0b73a, transparent: true, opacity: 1 }), 5); W2 = C.cyls(28, C.basic({ color: 0xffd86b, transparent: true, opacity: 0.2, depthWrite: false }), 5); g.add(W1); g.add(W2); }
    var cxm = 0, cym = 0, czm = 0;
    if (type === 'alpha') { for (i = 0; i < 4; i++) { cxm += P[3 * cl[i]] / 4; cym += P[3 * cl[i] + 1] / 4; czm += P[3 * cl[i] + 2] / 4; } }

    function tick(t) {
      var u = ((t % PER) + PER) % PER, amp = 0.03, rx = 0, ry = 0, k, s, sc, hid, jx, jy, jz, scl;
      if (type === 'alpha') {
        amp += 0.05 * bump(u, 1.0, 2.3, 2.4, 3.0);
        var rc = 0.35 * bump(u, 2.4, 2.7, 2.7, 4.0); rx = -dx * rc; ry = -dy * rc;
        s = u < 6.4 ? 8.0 * Math.pow(clamp((u - 2.4) / 3.0, 0, 1), 1.25) : 0;
        sc = u < 6.4 ? 1 - U.sstep(5.2, 6.0, u) : U.sstep(6.8, 7.6, u);
      } else if (type === 'beta') {
        amp += 0.04 * bump(u, 1.0, 2.3, 2.4, 3.0); rx = -dx * 0.12 * bump(u, 2.4, 2.8, 2.8, 4.0); ry = -dy * 0.12 * bump(u, 2.4, 2.8, 2.8, 4.0);
      } else {
        amp += 0.045 * (u < 4 ? 1 - U.sstep(2.5, 3.6, u) : U.sstep(6.8, 8.0, u));
      }
      for (i = 0; i < N; i++) {
        j = i * 3; jx = amp * Math.sin(jf[j] * t + jp[j]); jy = amp * Math.sin(jf[j + 1] * t + jp[j + 1]); jz = amp * Math.sin(jf[j + 2] * t + jp[j + 2]);
        var cx = col[i], ox = rx, oy = ry; scl = 1;
        if (type === 'alpha' && cl.indexOf(i) >= 0) { ox = dx * s; oy = dy * s; scl = sc; }
        if (type === 'beta' && i === e) cx = mix(GRAY, RED, U.sstep(2.4, 3.0, u) * (1 - U.sstep(6.4, 7.4, u)));
        nm.set(i, OX + P[j] + jx + ox, P[j + 1] + jy + oy, P[j + 2] + jz, 0.5 * Math.max(scl, 0.001), cx);
      }
      nm.done(); if (nm.instanceColor) nm.instanceColor.needsUpdate = true;
      if (type === 'alpha') {
        halo.visible = sc > 0.02 && u > 2.3 && u < 6.4;
        if (halo.visible) { halo.position.set(OX + cxm + dx * s, cym + dy * s, czm); halo.scale.setScalar(1.45); halo.material.opacity = 0.17 * sc; }
        for (k = 0; k < 6; k++) { var ss = s - (k + 1) * 0.6; tr.set(k, OX + cxm + dx * ss, cym + dy * ss, czm, ss > 0.8 && u < 6.4 ? 0.3 * (1 - k / 6.5) * sc : 0.001, GOLD); }
        tr.done();
        var fl = U.sstep(2.35, 2.5, u) * (1 - U.sstep(2.5, 3.3, u));
        flash.visible = fl > 0.01; if (flash.visible) { flash.position.set(OX + cxm, cym, czm); flash.scale.setScalar(1.4 + 2.6 * U.sstep(2.4, 3.3, u)); flash.material.opacity = 0.26 * fl; }
      } else if (type === 'beta') {
        var sx = OX + P[3 * e], sy = P[3 * e + 1], sz = P[3 * e + 2], es = 9 * clamp((u - 2.4) / 1.7, 0, 1), vis = U.sstep(2.2, 2.5, u) * (1 - U.sstep(4.0, 4.4, u));
        el.set(0, sx + dx * es, sy + dy * es, sz, 0.22 * Math.max(vis, 0.001), 0x4f86a8); el.done();
        for (k = 0; k < 6; k++) { var s2 = es - (k + 1) * 0.55; tr.set(k, sx + dx * s2, sy + dy * s2, sz, s2 > 0.5 && vis > 0 ? 0.16 * (1 - k / 6.5) * vis : 0.001, 0x4f86a8); }
        tr.done();
        var fb = U.sstep(2.3, 2.5, u) * (1 - U.sstep(2.5, 3.4, u));
        flash.visible = fb > 0.01; if (flash.visible) { flash.material.color.setHex(0xff9a8e); flash.position.set(sx, sy, sz); flash.scale.setScalar(0.7 + 1.1 * U.sstep(2.4, 3.3, u)); flash.material.opacity = 0.35 * fb; }
      } else {
        var hf = u < 4 ? 1 - U.sstep(2.5, 3.6, u) : U.sstep(6.8, 8.0, u);
        halo.visible = hf > 0.02; if (halo.visible) { halo.position.set(OX, 0, 0); halo.scale.setScalar(3.3 + 0.12 * Math.sin(TP * 3 * u)); halo.material.opacity = 0.09 * hf * (0.85 + 0.15 * Math.sin(TP * 3 * u)); }
        var hd = 2.0 + 2.2 * Math.max(0, u - 2.5), on = u > 2.5 && u < 5.8, fo = 1 - U.sstep(4.7, 5.6, u);
        W1.visible = W2.visible = on;
        if (on) {
          var ln = 3.0 * Math.min(1, (u - 2.5) / 0.6) + 0.001;
          W1.material.opacity = fo; W2.material.opacity = 0.2 * fo;
          setWave(W1, 28, OX, 0, 0, dx, dy, hd - ln, ln, 0.3, TAU / 0.95, TAU * 1.1 * u, 0.07, 2.75);
          setWave(W2, 28, OX, 0, 0, dx, dy, hd - ln, ln, 0.3, TAU / 0.95, TAU * 1.1 * u, 0.17, 2.75);
        }
        var ff = U.sstep(2.4, 2.5, u) * (1 - U.sstep(2.5, 3.3, u));
        flash.visible = ff > 0.01; if (flash.visible) { flash.position.set(OX, 0, 0); flash.scale.setScalar(2.8 + 1.6 * U.sstep(2.4, 3.3, u)); flash.material.opacity = 0.22 * ff; }
        for (k = 0; k < 6; k++) tr.set(k, 0, 0, 0, 0.001, GOLD); tr.done();
      }
    }
    tick(0);
    return { obj: g, r: 6.6, tick: tick, noSpin: true, fit: 2.8 };
  });

  /* ---------------------------------------------------------------- 2. halflife */
  LV3D.add('halflife', function (C, m) {
    var T = C.T, g = new T.Group(), PER = 10, rnd = U.rng(21), n = 64, i, j, ord = [], rd = [], dt = [];
    for (i = 0; i < n; i++) ord.push(i);
    for (i = n - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var tmp = ord[i]; ord[i] = ord[j]; ord[j] = tmp; }
    var cnt = [32, 16, 8, 4], k = 0, r;
    for (i = 0; i < n; i++) rd[i] = 9;
    for (r = 0; r < 4; r++) for (j = 0; j < cnt[r]; j++) { rd[ord[k]] = r; dt[ord[k]] = 1.0 + 2.0 * r + rnd() * 0.5; k++; }
    var at = C.spheres(n, C.phong({ color: 0xffffff, shininess: 80, spec: 0x666666 }), [10, 8]), hl = C.spheres(n, C.basic({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false }), [10, 6]);
    g.add(hl); g.add(at);
    var OXG = -1.0, X = [], Y = [];
    for (i = 0; i < n; i++) { X.push(OXG + ((i % 8) - 3.5) * 1.0); Y.push((3.5 - Math.floor(i / 8)) * 1.0); }
    var BX = 4.6, BH = 7.0, BW = 0.5;
    var track = new T.Mesh(C.g(new T.BoxGeometry(BW, BH, 0.5)), C.phong({ color: 0xe6f2ed, transparent: true, opacity: 0.4, depthWrite: false }));
    track.position.set(BX, 0, 0); g.add(track);
    var te = C.boxEdges(BW, BH, 0.5, 0x6f8179, 0.7); te.position.set(BX, 0, 0); g.add(te);
    var fill = new T.Mesh(C.g(new T.BoxGeometry(BW * 0.82, 1, 0.38)), C.phong({ color: 0x2f9e6e, shininess: 60 })); fill.position.set(BX, 0, 0); g.add(fill);
    var tk = C.boxEdges(1, 0.001, 0.001, 0x3b4a45, 0.0), lv = [0.5, 0.25, 0.125, 0.0625], mk = C.cyls(4, C.basic({ color: 0x3b4a45, transparent: true, opacity: 0.6 }), 4);
    for (i = 0; i < 4; i++) { var yy = -BH / 2 + BH * lv[i]; mk.set(i, BX + 0.45, yy, 0.3, BX + 0.95, yy, 0.3, 0.035, 0xffffff); } mk.done(); g.add(mk);
    var ACT = 0x2f9e6e, DEAD = 0xb9c2be, WHITE = 0xf4fff9;
    function tick(t) {
      var u = ((t % PER) + PER) % PER, rem = 0, sv, f, c, sc, hs, pul;
      for (i = 0; i < n; i++) {
        sv = rd[i] < 9 ? U.sstep(dt[i], dt[i] + 0.4, u) : 0; sv *= 1 - U.sstep(9.0, 9.8, u);
        f = rd[i] < 9 ? Math.exp(-Math.pow((u - dt[i] - 0.18) / 0.22, 2)) : 0;
        pul = Math.sin(TAU * (u / PER * 2 + i * 0.137));
        c = mix(mix(ACT, DEAD, sv), WHITE, 0.7 * f);
        sc = (0.34 + 0.02 * pul * (1 - sv)) * (1 - 0.38 * sv) * (1 + 0.55 * f);
        at.set(i, X[i], Y[i], 0, sc, c);
        hs = (1 - sv) * (0.62 + 0.04 * pul) + 0.5 * f;
        hl.set(i, X[i], Y[i], 0, Math.max(hs, 0.001), mix(0x7fd6b0, 0xffffff, f));
        rem += 1 - sv;
      }
      at.done(); hl.done();
      var fr = rem / n; fill.scale.y = Math.max(BH * fr, 0.001); fill.position.y = -BH / 2 + BH * fr / 2;
    }
    tick(0);
    return { obj: g, r: 6.4, tick: tick, noSpin: true, fit: 2.55 };
  });

  /* ---------------------------------------------------------------- 3. fission */
  LV3D.add('fission', function (C, m) {
    var T = C.T, g = new T.Group(), PER = 9, TP = TAU / PER, rnd = U.rng(33), N = 34, P = fcc(N, 1.0, rnd), i, j;
    var ax = 0.88, ay = 0.47, al = Math.hypot(ax, ay); ax /= al; ay /= al;
    var proj = [], sgn = [], col = [];
    var ord = []; for (i = 0; i < N; i++) { ord.push(i); proj.push(P[3 * i] * ax + P[3 * i + 1] * ay); }
    ord.sort(function (a, b) { return proj[a] - proj[b]; });
    for (i = 0; i < N; i++) sgn[ord[i]] = i < 17 ? -1 : 1;
    for (i = 0; i < N; i++) col.push(rnd() < 0.5 ? RED : GRAY);
    var nm = C.spheres(N, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [12, 8]);
    var neu = C.spheres(4, C.phong({ color: 0xffffff, shininess: 70, spec: 0x555555 }), [12, 8]); g.add(nm); g.add(neu);
    var jf = [], jp = []; for (i = 0; i < N * 3; i++) { jf.push(TP * (2 + Math.floor(rnd() * 3))); jp.push(rnd() * 6.283); }
    var flash = glowSphere(C, 0xffe3a0, 0.3), f2 = glowSphere(C, 0xbfe3f5, 0.3); g.add(flash); g.add(f2);
    var tr = C.spheres(8, C.basic({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false }), [8, 6]); g.add(tr);
    var ND = [[0.45, -0.89, 0.1], [-0.45, 0.89, 0.2], [0.25, 0.97, -0.3]];
    var STR = 0.62;
    function tick(t) {
      var u = ((t % PER) + PER) % PER, k, amp = 0.025, str, D = 0, vis, wob, p0, p1, p2, pa, ex, ey, ez, sx, sy, sz, fl;
      if (u < 7.6) vis = 1 - U.sstep(7.0, 7.6, u); else vis = U.sstep(8.0, 8.8, u);
      // wobble then stretch
      wob = U.sstep(1.9, 3.6, u);
      str = u < 3.6 ? STR * wob * (0.55 + 0.45 * Math.sin(TAU * 1.0 * (u - 1.9))) * wob : STR * (1 - U.sstep(3.6, 4.7, u));
      if (u < 3.6) str = Math.max(str, 0); if (u >= 3.6 && u < 3.62) str = STR;
      if (u > 3.0 && u < 3.6) str = STR * U.sstep(2.9, 3.6, u) + 0.07 * Math.sin(TAU * 1.5 * u) * (1 - U.sstep(2.9, 3.6, u));
      if (u >= 7.6) str = 0;
      amp += 0.03 * U.sstep(1.7, 3.0, u) * (u < 3.6 ? 1 : 0);
      if (u > 3.6 && u < 7.6) D = 5.4 * (1 - Math.pow(1 - clamp((u - 3.6) / 3.4, 0, 1), 2));
      for (i = 0; i < N; i++) {
        j = i * 3; p0 = P[j]; p1 = P[j + 1]; p2 = P[j + 2]; pa = p0 * ax + p1 * ay;
        ex = p0 + ax * pa * str - (p0 - ax * pa) * 0.22 * str; ey = p1 + ay * pa * str - (p1 - ay * pa) * 0.22 * str; ez = p2 * (1 - 0.22 * str);
        ex += sgn[i] * ax * D; ey += sgn[i] * ay * D;
        ex += amp * Math.sin(jf[j] * t + jp[j]); ey += amp * Math.sin(jf[j + 1] * t + jp[j + 1]); ez += amp * Math.sin(jf[j + 2] * t + jp[j + 2]);
        nm.set(i, ex, ey, ez, 0.5 * Math.max(vis, 0.001), col[i]);
      }
      nm.done();
      // incoming neutron
      var nx = -8.8 + 6.1 * clamp(u / 1.95, 0, 1), nv = U.sstep(0, 0.5, u) * (1 - U.sstep(1.9, 2.25, u));
      neu.set(0, nx, 0.25 * (1 - clamp(u / 1.95, 0, 1)), 0, 0.5 * Math.max(nv, 0.001), 0xa3aeaa);
      for (k = 0; k < 8; k++) { var xs = nx - (k + 1) * 0.7; tr.set(k, xs, 0.25 * (1 - clamp(u / 1.95, 0, 1)), 0, nv > 0.05 && u < 1.95 ? 0.22 * (1 - k / 9) : 0.001, 0x9aa5a1); }
      tr.done();
      // released neutrons
      var ne = clamp((u - 3.6) / 3.3, 0, 1), nd = 5.3 * (1 - Math.pow(1 - ne, 2)), nvv = u < 7.6 ? (u > 3.55 ? 1 - U.sstep(6.7, 7.5, u) : 0) : 0;
      for (k = 0; k < 3; k++) neu.set(k + 1, ND[k][0] * nd, ND[k][1] * nd, ND[k][2] * nd, 0.5 * Math.max(nvv, 0.001), 0xa3aeaa);
      neu.done();
      fl = U.sstep(3.55, 3.7, u) * (1 - U.sstep(3.7, 4.8, u));
      flash.visible = fl > 0.01; if (flash.visible) { flash.position.set(0, 0, 0); flash.scale.setScalar(2.4 + 4.6 * U.sstep(3.6, 4.8, u)); flash.material.opacity = 0.3 * fl; }
      var f3 = U.sstep(1.8, 1.95, u) * (1 - U.sstep(1.95, 2.8, u));
      f2.visible = f3 > 0.01; if (f2.visible) { f2.position.set(-2.8, 0, 0); f2.scale.setScalar(1.0 + 1.2 * U.sstep(1.9, 2.8, u)); f2.material.opacity = 0.35 * f3; }
    }
    tick(0);
    return { obj: g, r: 8.4, tick: tick, noSpin: true, fit: 3.0 };
  });

  /* ---------------------------------------------------------------- 4. spectrum */
  LV3D.add('spectrum', function (C, m) {
    var T = C.T, g = new T.Group(), root = new T.Group(); g.add(root); root.position.y = 1.1;
    var s = 5, h = s * 0.8660254, D = 2.6;
    var sh = new T.Shape(); sh.moveTo(0, h / 2); sh.lineTo(-s / 2, -h / 2); sh.lineTo(s / 2, -h / 2); sh.closePath();
    var pg = C.g(new T.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false })); pg.translate(0, 0, -D / 2);
    var prism = new T.Mesh(pg, C.m(new T.MeshPhongMaterial({ color: 0xcfe8ef, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide, shininess: 90, specular: new T.Color(0xffffff) })));
    root.add(prism);
    var eg = C.g(new T.EdgesGeometry(pg)), ed = new T.LineSegments(eg, C.m(new T.LineBasicMaterial({ color: 0x5d7b72, transparent: true, opacity: 0.7 }))); root.add(ed);
    // refraction (2D)
    var cols = [0xe0443a, 0xee8a2e, 0xe9c52f, 0x4cb35a, 0x3aa6c6, 0x4a6fd0, 0x8a5cc8], nn = [1.48, 1.51, 1.54, 1.58, 1.62, 1.65, 1.68];
    function refr(dx_, dy_, nx, ny, e) { var ci = -(nx * dx_ + ny * dy_), k = 1 - e * e * (1 - ci * ci), a = e * ci - Math.sqrt(Math.max(k, 0)); return [e * dx_ + a * nx, e * dy_ + a * ny]; }
    var nL = [-0.8660254, 0.5], nR = [0.8660254, 0.5], f = 0.45;
    var L0 = [-s / 2, -h / 2], A0 = [0, h / 2], R0 = [s / 2, -h / 2];
    var P1 = [L0[0] + f * (A0[0] - L0[0]), L0[1] + f * (A0[1] - L0[1])];
    var th = Math.asin(1.55 * 0.5), ang = -Math.PI / 6 + th, d0 = [Math.cos(ang), Math.sin(ang)];
    var S0 = [P1[0] - d0[0] * 7.5, P1[1] - d0[1] * 7.5], XS = 8.4, K = cols.length, paths = [], hits = [], i, k;
    for (i = 0; i < K; i++) {
      var t1 = refr(d0[0], d0[1], nL[0], nL[1], 1 / nn[i]);
      // intersect inner ray with right face
      var ex = A0[0] - P1[0], ey = A0[1] - P1[1], fx = R0[0] - A0[0], fy = R0[1] - A0[1], det = t1[0] * (-fy) - t1[1] * (-fx);
      var sI = (ex * (-fy) - ey * (-fx)) / det, P2 = [P1[0] + t1[0] * sI, P1[1] + t1[1] * sI];
      var t2 = refr(t1[0], t1[1], -nR[0], -nR[1], nn[i]), sE = (XS - P2[0]) / t2[0], H = [XS, P2[1] + t2[1] * sE];
      paths.push({ P2: P2, H: H, L1: Math.hypot(P1[0] - S0[0], P1[1] - S0[1]), L2: Math.hypot(P2[0] - P1[0], P2[1] - P1[1]), L3: Math.hypot(H[0] - P2[0], H[1] - P2[1]) }); hits.push(H);
    }
    // beams
    var beam = C.cyls(2, C.basic({ color: 0xffe9a0, transparent: true, opacity: 0.55, depthWrite: false }), 8); root.add(beam);
    beam.set(0, S0[0], S0[1], 0, P1[0], P1[1], 0, 0.2, 0xffe9a0); beam.set(1, S0[0], S0[1], 0, P1[0], P1[1], 0, 0.07, 0xfffdf0);
    var bi = 1;
    var rays = C.cyls(K * 2, C.basic({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false }), 6); root.add(rays);
    for (i = 0; i < K; i++) {
      rays.set(2 * i, P1[0], P1[1], 0, paths[i].P2[0], paths[i].P2[1], 0, 0.045, cols[i]);
      rays.set(2 * i + 1, paths[i].P2[0], paths[i].P2[1], 0, paths[i].H[0], paths[i].H[1], 0, 0.06, cols[i]);
    }
    beam.done(); rays.done();
    // translucent fan
    var fv = [], fc = [], fi = [], c3 = new T.Color();
    fv.push(paths[0].P2[0], paths[0].P2[1], 0); fc.push(1, 1, 1);
    for (i = 0; i < K; i++) { fv.push(hits[i][0], hits[i][1], 0); c3.setHex(cols[i]); fc.push(c3.r, c3.g, c3.b); }
    for (i = 0; i < K - 1; i++) fi.push(0, i + 1, i + 2);
    var fg = C.g(new T.BufferGeometry()); fg.setAttribute('position', new T.Float32BufferAttribute(fv, 3)); fg.setAttribute('color', new T.Float32BufferAttribute(fc, 3)); fg.setIndex(fi);
    root.add(new T.Mesh(fg, C.m(new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide }))));
    // screen with continuous rainbow band
    var sg = new T.Group(); sg.position.set(XS, 0, 0); sg.rotation.y = 0.85; root.add(sg);
    var yMin = hits[0][1], yMax = hits[K - 1][1], yc = (yMin + yMax) / 2, SH = Math.abs(yMax - yMin) + 3.2;
    var scr = new T.Mesh(C.g(new T.PlaneGeometry(3.4, SH)), C.m(new T.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false }))); scr.position.y = yc; sg.add(scr);
    var se = C.line([-1.7, yc - SH / 2, 0, 1.7, yc - SH / 2, 0, 1.7, yc - SH / 2, 0, 1.7, yc + SH / 2, 0, 1.7, yc + SH / 2, 0, -1.7, yc + SH / 2, 0, -1.7, yc + SH / 2, 0, -1.7, yc - SH / 2, 0], 0x6f8179, 0.6); sg.add(se);
    var bv = [], bc = [], bi2 = [];
    for (i = 0; i < K; i++) { var hy = hits[i][1], hw = 0.75; bv.push(-hw, hy, 0.02, hw, hy, 0.02); c3.setHex(cols[i]); bc.push(c3.r, c3.g, c3.b, c3.r, c3.g, c3.b); }
    for (i = 0; i < K - 1; i++) bi2.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
    var bg = C.g(new T.BufferGeometry()); bg.setAttribute('position', new T.Float32BufferAttribute(bv, 3)); bg.setAttribute('color', new T.Float32BufferAttribute(bc, 3)); bg.setIndex(bi2);
    sg.add(new T.Mesh(bg, C.m(new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false }))));
    // travelling light packets
    var NP = 3, pk = C.spheres(K * NP, C.basic({ color: 0xffffff }), [8, 6]); root.add(pk);
    var cc3 = new T.Color(), PERD = 6;
    function tick(t) {
      var u = (((t % PERD) + PERD) % PERD) / PERD, a, b, p, d, q, x, y, hw2;
      for (a = 0; a < K; a++) {
        p = paths[a]; var tot = p.L1 + p.L2 + p.L3;
        for (b = 0; b < NP; b++) {
          d = ((u + b / NP) % 1) * tot; var white = d < p.L1, r2 = 0.17;
          if (d < p.L1) { q = d / p.L1; x = S0[0] + (P1[0] - S0[0]) * q; y = S0[1] + (P1[1] - S0[1]) * q; if (a !== 3) r2 = 0.001; }
          else if (d < p.L1 + p.L2) { q = (d - p.L1) / p.L2; x = P1[0] + (p.P2[0] - P1[0]) * q; y = P1[1] + (p.P2[1] - P1[1]) * q; }
          else { q = (d - p.L1 - p.L2) / p.L3; x = p.P2[0] + (p.H[0] - p.P2[0]) * q; y = p.P2[1] + (p.H[1] - p.P2[1]) * q; hw2 = 1 - U.sstep(0.9, 1, q); r2 *= hw2 + 0.001; }
          pk.set(a * NP + b, x, y, 0, r2, white ? 0xf2c94c : cols[a]);
        }
      }
      pk.done();
    }
    tick(0);
    return { obj: g, r: 9.8, tick: tick, noSpin: true, fit: 2.4 };
  });

  /* ---------------------------------------------------------------- 5. emission */
  LV3D.add('emission', function (C, m) {
    var T = C.T, g = new T.Group(), tilt = new T.Group(); g.add(tilt); tilt.rotation.x = -1.05;
    var sh = (m.shells && m.shells.length ? m.shells : [2, 8, 1]).slice(0, 4), ns = sh.length, PER = 9, i, k, j;
    var PCOL = hx(m.color || '#e8a317'), BLUE = 0x4f86a8, RR = [], MM = [3, 2, 1, 1, 1];
    for (i = 0; i <= ns; i++) RR.push(2.0 + 1.55 * i);
    // nucleus
    var rnd = U.rng(8), np = fcc(7, 0.78, rnd), nuc = C.spheres(7, C.phong({ color: 0xffffff, shininess: 70 }), [12, 8]);
    for (i = 0; i < 7; i++) nuc.set(i, np[3 * i], np[3 * i + 1], np[3 * i + 2], 0.39, i % 2 ? GRAY : RED); nuc.done(); tilt.add(nuc);
    // rings
    for (i = 0; i <= ns; i++) {
      var ring = new T.Mesh(C.g(new T.TorusGeometry(RR[i], 0.024, 6, 90)), C.basic({ color: 0x3b4a45, transparent: true, opacity: i === ns ? 0.16 : 0.42, depthWrite: false })); tilt.add(ring);
    }
    var tot = 0; for (i = 0; i < ns; i++) tot += sh[i];
    var ES = C.spheres(tot, C.phong({ color: 0xffffff, shininess: 90, spec: 0x777777 }), [14, 10]); tilt.add(ES);
    var ring_of = [], th0 = [], idx = 0;
    for (i = 0; i < ns; i++) for (k = 0; k < sh[i]; k++) { ring_of.push(i); th0.push(TAU * k / sh[i] + i * 0.6); idx++; }
    var jmp = tot - 1, vr = ns - 1, mj = MM[vr], halo = glowSphere(C, PCOL, 0.28); tilt.add(halo);
    var W1 = C.cyls(30, C.basic({ color: PCOL, transparent: true, opacity: 1 }), 5), W2 = C.cyls(30, C.basic({ color: PCOL, transparent: true, opacity: 0.2, depthWrite: false }), 5); tilt.add(W1); tilt.add(W2);
    var tE = 5.0; th0[jmp] = 0.5 - TAU * mj * tE / PER; var aE = th0[jmp] + TAU * mj * tE / PER, cdx = Math.cos(aE), cdy = Math.sin(aE);
    function tick(t) {
      var u = ((t % PER) + PER) % PER, ang, rad, c, ex, ey;
      var up = U.sstep(1.8, 2.8, u) * (1 - U.sstep(4.4, 5.2, u));
      for (i = 0; i < tot; i++) {
        if (i === jmp) {
          ang = th0[i] + TAU * mj * u / PER; rad = RR[vr] + (RR[ns] - RR[vr]) * up; c = mix(BLUE, PCOL, up);
          ES.set(i, Math.cos(ang) * rad, Math.sin(ang) * rad, 0, 0.27 + 0.03 * up, c);
          ex = Math.cos(ang) * rad; ey = Math.sin(ang) * rad;
        } else { ang = th0[i] + TAU * MM[ring_of[i]] * u / PER; rad = RR[ring_of[i]]; ES.set(i, Math.cos(ang) * rad, Math.sin(ang) * rad, 0, 0.27, BLUE); }
      }
      ES.done();
      var hv = up * (1 - 0.0); halo.visible = hv > 0.02; if (halo.visible) { halo.position.set(ex, ey, 0); halo.scale.setScalar(0.5 + 0.14 * Math.sin(TAU * 3 * u / PER * 3)); halo.material.opacity = 0.3 * hv; }
      var on = u > tE && u < 8.6;
      W1.visible = W2.visible = on;
      if (on) {
        var hd = RR[vr] + 4.2 * (u - tE) , ln = 3.1 * Math.min(1, (u - tE) / 0.5) + 0.001, fo = 1 - U.sstep(7.4, 8.4, u);
        W1.material.opacity = fo; W2.material.opacity = 0.2 * fo;
        setWave(W1, 30, 0, 0, 0, cdx, cdy, hd - ln, ln, 0.3, TAU / 1.0, TAU * 1.3 * u, 0.065, 0);
        setWave(W2, 30, 0, 0, 0, cdx, cdy, hd - ln, ln, 0.3, TAU / 1.0, TAU * 1.3 * u, 0.16, 0);
      }
    }
    tick(0);
    return { obj: g, r: RR[ns] + 2.2, tick: tick, noSpin: true, fit: 2.7 };
  });

  /* ---------------------------------------------------------------- 6. geiger */
  LV3D.add('geiger', function (C, m) {
    var T = C.T, g = new T.Group(), PER = 8, R = 2.5, XL = -6, XR = 5, i, k, rnd = U.rng(17);
    var metal = C.phong({ color: 0x9fb0aa, transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false, shininess: 80 });
    var shell = new T.Mesh(C.g(new T.CylinderGeometry(R, R, XR - XL, 32, 1, true)), metal); shell.rotation.z = Math.PI / 2; shell.position.x = (XL + XR) / 2; g.add(shell);
    var gas = new T.Mesh(C.g(new T.CylinderGeometry(R * 0.97, R * 0.97, XR - XL, 28, 1, false)), C.basic({ color: 0x9fd6c8, transparent: true, opacity: 0.1, depthWrite: false })); gas.rotation.z = Math.PI / 2; gas.position.x = (XL + XR) / 2; g.add(gas);
    var capm = C.phong({ color: 0x7f918b, shininess: 60 });
    var cap = new T.Mesh(C.g(new T.CylinderGeometry(R + 0.12, R + 0.12, 0.5, 32)), capm); cap.rotation.z = Math.PI / 2; cap.position.x = XR + 0.25; g.add(cap);
    var fl = new T.Mesh(C.g(new T.TorusGeometry(R + 0.06, 0.14, 8, 40)), capm); fl.rotation.y = Math.PI / 2; fl.position.x = XL; g.add(fl);
    var win = new T.Mesh(C.g(new T.CircleGeometry(R, 32)), C.m(new T.MeshPhongMaterial({ color: 0xf0dd9a, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false }))); win.rotation.y = Math.PI / 2; win.position.x = XL; g.add(win);
    var bands = C.cyls(2, capm, 24); bands.set(0, XL - 0.05, 0, 0, XL + 0.12, 0, 0, R + 0.1, 0x8da09a); bands.set(1, XR - 0.3, 0, 0, XR, 0, 0, R + 0.1, 0x8da09a); bands.done();
    // wire and lead
    var LX = 7.3, CY = 5.0, wireC = C.phong({ color: 0xc9a227, shininess: 90 }), wire = C.cyls(3, wireC, 8);
    wire.set(0, XL + 0.5, 0, 0, LX, 0, 0, 0.07, 0xc9a227); wire.set(1, LX, 0, 0, LX, CY, 0, 0.07, 0xc9a227); wire.set(2, LX, CY, 0, LX + 0.4, CY, 0, 0.07, 0xc9a227); wire.done(); g.add(wire);
    var box = new T.Mesh(C.g(new T.BoxGeometry(3.0, 1.9, 1.5)), C.phong({ color: 0x3b4a45, shininess: 40 })); box.position.set(LX + 0.4 + 1.5, CY, 0); g.add(box);
    var lamp = new T.Mesh(C.g(new T.SphereGeometry(0.42, 16, 12)), C.basic({ color: 0x5a6a64 })); lamp.position.set(LX + 1.9, CY, 0.9); g.add(lamp);
    var lh = glowSphere(C, 0xffd24a, 0.3); lh.position.copy(lamp.position); g.add(lh);
    var winY = 1.0, ENT = -10, STOP = 0.2, NP = 9;
    // gas atoms
    var NG = 40, GP = [], gs = C.spheres(NG, C.basic({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }), [8, 6]); g.add(gs);
    for (i = 0; i < NG; i++) { var r0 = Math.sqrt(rnd()) * (R - 0.35), a0 = rnd() * TAU; GP.push([XL + 0.6 + rnd() * (XR - XL - 1.2), Math.cos(a0) * r0, Math.sin(a0) * r0, TAU * (1 + Math.floor(rnd() * 2)) / PER, rnd() * 6.28]); }
    var part = C.spheres(1, C.phong({ color: 0xffffff, shininess: 80 }), [12, 8]); g.add(part);
    var ptr = C.spheres(6, C.basic({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false }), [8, 6]); g.add(ptr);
    var el = C.spheres(NP, C.basic({ color: 0xffffff }), [8, 6]), io = C.spheres(NP, C.basic({ color: 0xffffff }), [8, 6]); g.add(el); g.add(io);
    var pulse = C.spheres(1, C.basic({ color: 0xffffff }), [10, 8]), pg = C.spheres(1, C.basic({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }), [10, 8]); g.add(pulse); g.add(pg);
    var av = glowSphere(C, 0xffd24a, 0.3); g.add(av);
    var T0 = 0.5, T1 = 1.5, T2 = 2.9; // start, window, stop
    var PX = [], pairT = []; for (i = 0; i < NP; i++) { PX.push(XL + 0.5 + i * (STOP - XL - 0.5) / (NP - 1)); }
    var pathA = LX - (-1.6), pathB = CY, pathL = pathA + pathB, v = 6.5, tP = 3.1, tArr = tP + pathL / v;
    function tick(t) {
      var u = ((t % PER) + PER) % PER, x, q, s, vis, fo, ph;
      for (i = 0; i < NG; i++) { var G = GP[i]; gs.set(i, G[0] + 0.12 * Math.sin(G[3] * t + G[4]), G[1] + 0.12 * Math.sin(G[3] * t * 1 + G[4] * 2), G[2] + 0.12 * Math.cos(G[3] * t + G[4]), 0.09, 0x8fb8ab); }
      gs.done();
      // particle
      q = clamp((u - T0) / (T2 - T0), 0, 1); x = ENT + (STOP - ENT) * q;
      var py = x < XL ? winY : winY, pv = (u > T0 - 0.2 && u < T2 + 0.4) ? U.sstep(T0 - 0.2, T0 + 0.1, u) * (1 - U.sstep(T2, T2 + 0.4, u)) : 0;
      part.set(0, x, py, 0, 0.24 * Math.max(pv, 0.001), 0xd65a4f); part.done();
      for (k = 0; k < 6; k++) { var xx = x - (k + 1) * 0.55; ptr.set(k, xx, py, 0, pv > 0.05 ? 0.15 * (1 - k / 6.5) * pv : 0.001, 0xd65a4f); } ptr.done();
      // ion pairs
      var gl = 1 - U.sstep(5.4, 6.4, u);
      for (i = 0; i < NP; i++) {
        var te = T0 + (PX[i] - ENT) / (STOP - ENT) * (T2 - T0), born = U.sstep(te, te + 0.15, u) * gl, mv = U.sstep(T2 - 0.2, T2 + 0.9, u), rr = born > 0.01 ? 0.1 * born : 0.001;
        el.set(i, PX[i] + 0.12 * mv, py + (0.12 - py) * mv, 0.12 * Math.sin(i), rr, 0x4f86a8);
        io.set(i, PX[i] - 0.1 + 0.1 * Math.sin(i) * mv, py + (R - 0.35 - py) * mv * 0.3, -0.12, rr, 0xd65a4f);
      }
      el.done(); io.done();
      // avalanche flash on the wire
      var fa = U.sstep(T2 + 0.15, T2 + 0.3, u) * (1 - U.sstep(T2 + 0.3, T2 + 1.1, u));
      av.visible = fa > 0.01; if (av.visible) { av.position.set(-1.6, 0, 0); av.scale.setScalar(0.5 + 1.2 * U.sstep(T2 + 0.2, T2 + 1.1, u)); av.material.opacity = 0.35 * fa; }
      // pulse along wire and lead
      var pr = (u - tP) * v, pvv = (pr > 0 && pr < pathL) ? 1 : 0, px, pyy;
      if (pr < pathA) { px = -1.6 + pr; pyy = 0; } else { px = LX; pyy = pr - pathA; }
      pulse.set(0, px, pyy, 0, pvv ? 0.2 : 0.001, 0xffd24a); pg.set(0, px, pyy, 0, pvv ? 0.45 : 0.001, 0xffd24a); pulse.done(); pg.done();
      var lo = U.sstep(tArr, tArr + 0.1, u) * (1 - U.sstep(tArr + 0.5, tArr + 1.4, u));
      lamp.material.color.setHex(mix(0x5a6a64, 0xffd24a, lo)); lh.visible = lo > 0.02; if (lh.visible) { lh.scale.setScalar(0.7 + 0.5 * lo); lh.material.opacity = 0.35 * lo; }
    }
    tick(0);
    return { obj: g, r: 9.6, tick: tick, noSpin: true, fit: 3.35 };
  });

  /* ---------------------------------------------------------------- 7. ph_scale */
  LV3D.add('ph_scale', function (C, m) {
    var T = C.T, g = new T.Group(), val = clamp(m.value === undefined ? 7 : +m.value, 0, 14), PER = 9, i;
    var stops = [[0, 0xd9443a], [3, 0xec8a34], [5.2, 0xe8c63a], [7, 0x4cb06a], [10, 0x3f8fc4], [14, 0x8a5cc8]];
    function pc(v) { for (var k = 1; k < stops.length; k++) if (v <= stops[k][0]) return mix(stops[k - 1][1], stops[k][1], (v - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0])); return stops[stops.length - 1][1]; }
    var bg = C.g(new T.BoxGeometry(0.94, 1.1, 1.3)), seg = [], lab = [], X0 = -7;
    for (i = 0; i <= 14; i++) {
      var mesh = new T.Mesh(bg, C.phong({ color: pc(i), shininess: 60 })); mesh.position.set(X0 + i, 0, 0); g.add(mesh); seg.push(mesh);
      var sp = spriteText(C, '' + i, 0, '600 64px sans-serif', '#3b4a45', 128, 128); sp.position.set(X0 + i, -1.25, 0.4); sp.scale.set(0.78, 0.78, 1); g.add(sp); lab.push(sp);
    }
    var words = [['acidic', -4.5], ['neutral', 0], ['basic', 4.5]];
    for (i = 0; i < 3; i++) { var w = spriteText(C, words[i][0], 0, '500 38px sans-serif', '#6f8179', 256, 64); w.position.set(words[i][1], -2.3, 0.4); w.scale.set(2.6, 0.65, 1); g.add(w); }
    var pin = new T.Group(); g.add(pin);
    var cone = new T.Mesh(C.g(new T.ConeGeometry(0.34, 0.9, 20)), C.phong({ color: 0x3b4a45, shininess: 70 })); cone.rotation.z = Math.PI; cone.position.y = 0.45; pin.add(cone);
    var ball = new T.Mesh(C.g(new T.SphereGeometry(0.34, 18, 14)), C.phong({ color: 0x3b4a45, shininess: 90 })); ball.position.y = 1.0; pin.add(ball);
    var stem = new T.Mesh(C.g(new T.CylinderGeometry(0.05, 0.05, 1.2, 8)), C.phong({ color: 0x3b4a45 })); stem.position.y = 1.55; pin.add(stem);
    var start = val < 7 ? 14 : 0, tcol = new T.Color();
    function pos(u) {
      var x;
      if (u < 0.6) x = start;
      else if (u < 7.2) { var tau = (u - 0.6) * 0.85, f = 1 - Math.exp(-3.2 * tau) * (Math.cos(4.6 * tau) + (3.2 / 4.6) * Math.sin(4.6 * tau)); x = start + (val - start) * f; }
      else x = val + (start - val) * U.sstep(7.2, 8.7, u);
      return x;
    }
    function tick(t) {
      var u = ((t % PER) + PER) % PER, x = clamp(pos(u), -0.6, 14.6), k, d, l;
      pin.position.set(X0 + x, 0.9, 0.0);
      for (k = 0; k <= 14; k++) {
        d = k - x; l = Math.exp(-d * d / 1.1);
        seg[k].position.y = 0.32 * l; seg[k].scale.y = 1 + 0.0 * l;
        lab[k].scale.setScalar(0.78 + 0.34 * l); lab[k].material.opacity = 0.6 + 0.4 * l;
      }
      pin.position.y = 0.9 + 0.32 * Math.exp(-0.0);
    }
    tick(0);
    return { obj: g, r: 8.4, tick: tick, noSpin: true, fit: 2.55 };
  });

  /* ---------------------------------------------------------------- 8. periodic */
  var SYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  function cell(z) { // z: 1..118 -> [col,row] or null (f-block)
    if (z === 1) return [1, 1]; if (z === 2) return [18, 1];
    if (z <= 4) return [z - 2, 2]; if (z <= 10) return [z + 8, 2];
    if (z <= 12) return [z - 10, 3]; if (z <= 18) return [z, 3];
    if (z <= 36) return [z - 18, 4]; if (z <= 54) return [z - 36, 5];
    if (z <= 56) return [z - 54, 6]; if (z <= 71) return null; if (z <= 86) return [z - 68, 6];
    if (z <= 88) return [z - 86, 7]; if (z <= 103) return null; return [z - 100, 7];
  }
  LV3D.add('periodic', function (C, m) {
    var T = C.T, g = new T.Group(), PER = 8, i, k, tiles = [], hs = (m.highlight || (m.group || m.period ? [] : ['Na']));
    var BASE = 0xe6f2ed, TINT = { s: 0xe8a89f, p: 0x9fc3dc, d: 0xbfa6e0 }, STR = { s: 0xd65a4f, p: 0x4f86a8, d: 0x8e6cc6 };
    function blk(c) { return c <= 2 ? 's' : c <= 12 ? 'd' : 'p'; }
    var sp = new T.Shape(), w = 0.46, rr = 0.12; // rounded square 0.92
    sp.moveTo(-w + rr, -w); sp.lineTo(w - rr, -w); sp.quadraticCurveTo(w, -w, w, -w + rr); sp.lineTo(w, w - rr); sp.quadraticCurveTo(w, w, w - rr, w); sp.lineTo(-w + rr, w); sp.quadraticCurveTo(-w, w, -w, w - rr); sp.lineTo(-w, -w + rr); sp.quadraticCurveTo(-w, -w, -w + rr, -w);
    var tg = C.g(new T.ExtrudeGeometry(sp, { depth: 0.2, bevelEnabled: false, curveSegments: 3 })); tg.translate(0, 0, -0.1);
    for (z = 1; z <= 118; z++) { var cc = cell(z); if (cc) tiles.push({ z: z, sym: SYM[z - 1], c: cc[0], r: cc[1] }); }
    var z; var n = tiles.length, inst = new T.InstancedMesh(tg, C.phong({ color: 0xffffff, shininess: 40, spec: 0x2a302e }), n);
    inst.frustumCulled = false; inst.instanceMatrix.setUsage(T.DynamicDrawUsage); g.add(inst);
    var O = new T.Object3D(), col = new T.Color(), cxo = -8.5, cyo = 3.0, hl = [];
    for (i = 0; i < n; i++) {
      var tl = tiles[i], b = blk(tl.c), on = hs.indexOf(tl.sym) >= 0 || (m.group && tl.c === m.group) || (m.period && tl.r === m.period);
      tl.x = cxo + (tl.c - 1); tl.y = cyo - (tl.r - 1); tl.b = b; tl.base = mix(BASE, TINT[b], 0.62); tl.on = !!on;
      O.position.set(tl.x, tl.y, 0); O.scale.set(1, 1, 1); O.updateMatrix(); inst.setMatrixAt(i, O.matrix); inst.setColorAt(i, col.setHex(tl.base));
      if (on) {
        var halo = new T.Mesh(tg, C.basic({ color: STR[b], transparent: true, opacity: 0.2, depthWrite: false })); halo.position.set(tl.x, tl.y, -0.12); halo.scale.set(1.5, 1.5, 0.3); halo.visible = false; g.add(halo);
        var spr = spriteText(C, tl.sym, 0, '700 70px sans-serif', '#ffffff', 128, 128); spr.scale.set(0.85, 0.85, 1); spr.position.set(tl.x, tl.y, 0.2); spr.visible = false; g.add(spr);
        tl.halo = halo; tl.spr = spr; tl.idx = hl.length; hl.push(tl);
      }
    }
    inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
    var sgm = 0.07;
    function tick(t) {
      var u = ((t % PER) + PER) % PER, j, tl2, lf, s;
      for (j = 0; j < hl.length; j++) {
        tl2 = hl[j]; var dl = 0.1 * (tl2.idx % 9) * 0.5 + 0.04 * Math.floor(tl2.idx / 9);
        lf = U.sstep(0.4 + dl, 1.6 + dl, u) * (1 - U.sstep(6.7 + dl, 7.9 + dl > 8 ? 7.95 : 7.9 + dl, u));
        s = 1 + 0.12 * lf;
        O.position.set(tl2.x, tl2.y, 1.0 * lf); O.scale.set(s, s, 1 + 1.6 * lf); O.updateMatrix(); inst.setMatrixAt(tiles.indexOf(tl2), O.matrix);
        inst.setColorAt(tiles.indexOf(tl2), col.setHex(mix(tl2.base, STR[tl2.b], lf)));
        tl2.halo.visible = lf > 0.03; tl2.halo.material.opacity = 0.24 * lf * (0.8 + 0.2 * Math.sin(TAU * 2 * u / PER)); tl2.halo.scale.setScalar(1.35 + 0.15 * lf);
        tl2.spr.visible = lf > 0.05; tl2.spr.position.z = 0.1 + 1.0 * lf + 0.35; tl2.spr.material.opacity = lf;
      }
      inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
    }
    tick(0);
    return { obj: g, r: 9.4, tick: tick, noSpin: true, fit: 2.85 };
  });
})();
