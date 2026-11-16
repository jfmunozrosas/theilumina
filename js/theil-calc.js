/* THEILUMINA · Theil index calculator (runs entirely in the browser; no data leave the user's computer).
   Theil T0 (mean log deviation) and T1, between/within decomposition, and jackknife bias and
   standard error computed in O(n) from a few sums (THEILUMINA preliminary results). */
(function (root) {
  "use strict";

  // ---------- CSV parsing (comma, semicolon or tab; quoted fields; decimal comma) ----------
  function detectDelimiter(text) {
    const first = text.split(/\r?\n/).find(l => l.trim().length) || "";
    const counts = {",": 0, ";": 0, "\t": 0};
    let q = false;
    for (const ch of first) { if (ch === '"') q = !q; else if (!q && ch in counts) counts[ch]++; }
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }
  function parseCSV(text) {
    text = text.replace(/^﻿/, "");
    const d = detectDelimiter(text), rows = [];
    let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') q = false;
        else field += c;
      } else if (c === '"') q = true;
      else if (c === d) { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some(x => x.trim() !== "")) rows.push(row);
        row = [];
      } else field += c;
    }
    row.push(field);
    if (row.some(x => x.trim() !== "")) rows.push(row);
    if (!rows.length) return {header: [], data: []};
    const header = rows[0].map((h, j) => h.trim() || `V${j + 1}`);
    const data = rows.slice(1).map(r => Object.fromEntries(header.map((h, j) => [h, (r[j] ?? "").trim()])));
    return {header, data};
  }
  function toNumber(s) {
    if (s == null) return NaN;
    s = String(s).trim().replace(/\s/g, "");
    if (s === "") return NaN;
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");   // 1.234,56
    else if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");                                   // 1234,56
    else s = s.replace(/,(?=\d{3}(\D|$))/g, "");                                                // 1,234.56
    return Number(s);
  }
  function parseList(text) {
    // Numbers separated by semicolons, spaces, tabs or new lines (a comma is then a decimal comma);
    // if there are no such separators, commas separate the numbers.
    const t = text.trim();
    const tokens = /[;\s]/.test(t) ? t.split(/[;\s]+/) : t.split(",");
    return tokens.map(toNumber).filter(Number.isFinite);
  }

  // ---------- Indices ----------
  function sums(y, w) {
    let W = 0, S1 = 0, S2 = 0, L = 0;
    for (let i = 0; i < y.length; i++) {
      const wi = w ? w[i] : 1, ly = Math.log(y[i]);
      W += wi; S1 += wi * y[i]; S2 += wi * y[i] * ly; L += wi * ly;
    }
    return {W, S1, S2, L};
  }
  function fromSums(s) {
    const mu = s.S1 / s.W;
    return {mu, T1: s.S2 / s.S1 - Math.log(mu), T0: Math.log(mu) - s.L / s.W};
  }
  function theil(y, w) {
    const s = sums(y, w);
    return Object.assign({n: y.length, W: s.W}, fromSums(s));
  }

  // Jackknife (delete-one) in O(n): bias, bias-corrected estimate and standard error
  function jackknife(y, w) {
    const n = y.length, s = sums(y, w), full = fromSums(s);
    const loo = {T0: new Float64Array(n), T1: new Float64Array(n)};
    for (let i = 0; i < n; i++) {
      const wi = w ? w[i] : 1, ly = Math.log(y[i]);
      const r = fromSums({W: s.W - wi, S1: s.S1 - wi * y[i], S2: s.S2 - wi * y[i] * ly, L: s.L - wi * ly});
      loo.T0[i] = r.T0; loo.T1[i] = r.T1;
    }
    const out = {};
    for (const k of ["T0", "T1"]) {
      let m = 0; for (let i = 0; i < n; i++) m += loo[k][i]; m /= n;
      let v = 0; for (let i = 0; i < n; i++) v += (loo[k][i] - m) ** 2;
      const bias = (n - 1) * (m - full[k]);
      const se = Math.sqrt((n - 1) / n * v);
      const tc = full[k] - bias;
      out[k] = {estimate: full[k], bias, relBias: bias / full[k], corrected: tc, se,
                ci: [tc - 1.959964 * se, tc + 1.959964 * se]};
    }
    return out;
  }

  // Between/within decomposition by groups
  function decompose(y, g, w) {
    const tot = theil(y, w), groups = new Map();
    for (let i = 0; i < y.length; i++) {
      const k = g[i];
      if (!groups.has(k)) groups.set(k, {y: [], w: []});
      groups.get(k).y.push(y[i]); groups.get(k).w.push(w ? w[i] : 1);
    }
    const res = [];
    let W0 = 0, B0 = 0, W1 = 0, B1 = 0;
    for (const [k, d] of groups) {
      const t = theil(d.y, d.w), p = t.W / tot.W, s = p * t.mu / tot.mu;
      const r = {group: k, n: d.y.length, popShare: p, incShare: s, mean: t.mu, T0: t.T0, T1: t.T1,
                 within0: p * t.T0, between0: p * Math.log(tot.mu / t.mu),
                 within1: s * t.T1, between1: s * Math.log(t.mu / tot.mu)};
      W0 += r.within0; B0 += r.between0; W1 += r.within1; B1 += r.between1;
      res.push(r);
    }
    res.sort((a, b) => String(a.group).localeCompare(String(b.group), undefined, {numeric: true}));
    return {groups: res, T0: {total: tot.T0, within: W0, between: B0}, T1: {total: tot.T1, within: W1, between: B1}};
  }

  const api = {parseCSV, toNumber, parseList, theil, jackknife, decompose};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TheilCalc = api;
})(typeof window !== "undefined" ? window : this);
