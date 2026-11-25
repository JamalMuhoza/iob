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
    var nuc = C.spheres(17), fib = Math.PI * (3 - Math.sqrt(5));
    nuc.set(0, 0, 0, 0, 0.27, '#d65a4f');
    for (i = 1; i < 17; i++) { var y = 1 - 2 * (i - 0.5) / 16, rr = Math.sqrt(1 - y * y), th = i * fib; nuc.set(i, 0.55 * rr * Math.cos(th), 0.55 * y, 0.55 * rr * Math.sin(th), 0.27, i % 2 ? '#d65a4f' : '#b9c2bf'); }
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
    build: function (THREE, m) {
      var C = Ctx(THREE), fn = KINDS[m && m.kind], res;
      if (!fn) res = { obj: new THREE.Group(), r: 1 }; else res = fn(C, m);
      return {
        obj: res.obj, r: res.r, tick: res.tick || null,
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
