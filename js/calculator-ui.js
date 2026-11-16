/* THEILUMINA · Theil index calculator: user interface (uses js/theil-calc.js) */
(function () {
  const $ = id => document.getElementById(id);
  const fmt = (v, d = 4) => Number.isFinite(v) ? v.toFixed(d) : "–";
  const pct = v => Number.isFinite(v) ? (100 * v).toFixed(1) + "%" : "–";
  let parsed = null, lastCSV = "";

  const EX = {
    list: "10\n20\n30\n40\n60\n80",
    sex: "income;sex\n12;Woman\n15;Woman\n18;Woman\n22;Woman\n30;Woman\n16;Man\n20;Man\n25;Man\n35;Man\n50;Man",
    regions: (() => {
      // Reproducible simulated log-normal incomes (seeded generator)
      let s = 2026; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
      const norm = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
      const R = [["North", 800, 9.9, 0.5], ["South", 600, 9.5, 0.7], ["East", 400, 10.1, 0.6], ["West", 200, 9.7, 0.4]];
      let out = "income;region";
      for (const [r, n, m, sd] of R) for (let i = 0; i < n; i++) out += `\n${Math.round(Math.exp(m + sd * norm()))};${r}`;
      return out;
    })()
  };
  document.querySelectorAll("[data-example]").forEach(b => b.addEventListener("click", () => {
    $("calc-input").value = EX[b.dataset.example]; prepare(); run();
  }));
  $("calc-file").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { $("calc-input").value = r.result; prepare(); };
    r.readAsText(f);
  });
  $("calc-input").addEventListener("input", () => { clearTimeout(window._calcT); window._calcT = setTimeout(prepare, 400); });
  $("calc-run").addEventListener("click", run);

  function isTable(text) {
    const first = text.trim().split(/\r?\n/)[0] || "";
    return /[A-Za-zÀ-ÿ]/.test(first);
  }
  function prepare() {
    const text = $("calc-input").value;
    if (text === lastCSV) return;
    lastCSV = text;
    if (!text.trim() || !isTable(text)) { parsed = null; $("calc-cols").hidden = true; return; }
    parsed = TheilCalc.parseCSV(text);
    const opts = (none) => (none ? `<option value="">(none)</option>` : "") + parsed.header.map(h => `<option>${h}</option>`).join("");
    $("calc-y").innerHTML = opts(false); $("calc-g").innerHTML = opts(true); $("calc-w").innerHTML = opts(true);
    // Guess: first numeric column = income; first non-numeric column = group
    const numeric = h => parsed.data.slice(0, 50).filter(r => Number.isFinite(TheilCalc.toNumber(r[h]))).length > 0.8 * Math.min(50, parsed.data.length);
    const yh = parsed.header.find(numeric); if (yh) $("calc-y").value = yh;
    const gh = parsed.header.find(h => !numeric(h)); if (gh) $("calc-g").value = gh;
    const wh = parsed.header.find(h => /^(w|weight|peso|pesos|factor)$/i.test(h)); if (wh) $("calc-w").value = wh;
    $("calc-cols").hidden = false;
  }

  function run() {
    prepare();
    const text = $("calc-input").value;
    let y = [], g = null, w = null;
    if (parsed) {
      const yh = $("calc-y").value, gh = $("calc-g").value, wh = $("calc-w").value;
      const rows = parsed.data.map(r => ({y: TheilCalc.toNumber(r[yh]), g: gh ? r[gh] : null, w: wh ? TheilCalc.toNumber(r[wh]) : 1}));
      const ok = rows.filter(r => Number.isFinite(r.y) && r.y > 0 && Number.isFinite(r.w) && r.w > 0 && (!gh || r.g !== ""));
      y = ok.map(r => r.y); if (gh) g = ok.map(r => r.g); if (wh) w = ok.map(r => r.w);
      message(rows.length - ok.length, rows.filter(r => Number.isFinite(r.y) && r.y <= 0).length);
    } else {
      const all = TheilCalc.parseList(text);
      y = all.filter(v => v > 0);
      message(0, all.length - y.length);
    }
    if (y.length < 3) { $("calc-out").innerHTML = `<div class="callout callout-warning"><p>At least 3 positive values are needed.</p></div>`; return; }
    show(y, g, w);
  }
  function message(dropped, nonpos) {
    $("calc-msg").innerHTML = dropped || nonpos ? `<p class="calc-note">${nonpos ? `${nonpos} zero or negative value(s) were excluded (Theil indices require positive incomes). ` : ""}${dropped - nonpos > 0 ? `${dropped - nonpos} row(s) with missing values were excluded.` : ""}</p>` : "";
  }

  function show(y, g, w) {
    const t = TheilCalc.theil(y, w), j = TheilCalc.jackknife(y, w);
    const rows = [["T0 (mean log deviation)", j.T0], ["T1 (Theil T)", j.T1]];
    let html = `<h3>3. Results</h3>
      <p>n = <b>${y.length.toLocaleString("en")}</b> observations${w ? " (weighted)" : ""} · mean income = <b>${t.mu.toLocaleString("en", {maximumFractionDigits: 2})}</b></p>
      <table class="table table-sm calc-table"><thead><tr><th>Index</th><th>Estimate</th><th>Jackknife bias</th><th>Relative bias</th><th>Bias-corrected</th><th>Std. error</th><th>95% CI (bias-corrected)</th></tr></thead><tbody>` +
      rows.map(([lab, r]) => `<tr><td>${lab}</td><td><b>${fmt(r.estimate)}</b></td><td>${fmt(r.bias)}</td><td>${pct(r.relBias)}</td><td>${fmt(r.corrected)}</td><td>${fmt(r.se)}</td><td>[${fmt(r.ci[0])}, ${fmt(r.ci[1])}]</td></tr>`).join("") +
      `</tbody></table>`;
    const big = Math.max(Math.abs(j.T0.relBias), Math.abs(j.T1.relBias));
    if (big > 0.05) html += `<div class="callout callout-warning"><p><b>Non-negligible bias.</b> The jackknife estimates a relative bias of up to ${pct(big)}. This is common with small samples or skewed distributions; consider reporting the bias-corrected estimate and its interval.</p></div>`;
    if (w) html += `<p class="calc-note">With sampling weights, the jackknife deletes one observation at a time and ignores the sampling design (strata, clusters); for complex surveys, use design-based variance estimators (e.g. the R package <code>convey</code>).</p>`;

    let dec = null;
    if (g) {
      dec = TheilCalc.decompose(y, g, w);
      const share = (b, tot) => pct(b / tot);
      html += `<h3>Decomposition by groups</h3>
        <table class="table table-sm calc-table"><thead><tr><th>Index</th><th>Total</th><th>Within groups</th><th>Between groups</th><th>% between</th></tr></thead><tbody>
        <tr><td>T0</td><td>${fmt(dec.T0.total)}</td><td>${fmt(dec.T0.within)}</td><td>${fmt(dec.T0.between)}</td><td><b>${share(dec.T0.between, dec.T0.total)}</b></td></tr>
        <tr><td>T1</td><td>${fmt(dec.T1.total)}</td><td>${fmt(dec.T1.within)}</td><td>${fmt(dec.T1.between)}</td><td><b>${share(dec.T1.between, dec.T1.total)}</b></td></tr>
        </tbody></table>
        <table class="table table-sm calc-table"><thead><tr><th>Group</th><th>n</th><th>Mean</th><th>Population share</th><th>Income share</th><th>T0 of group</th><th>T1 of group</th></tr></thead><tbody>` +
        dec.groups.map(r => `<tr><td>${r.group}</td><td>${r.n}</td><td>${r.mean.toLocaleString("en", {maximumFractionDigits: 2})}</td><td>${pct(r.popShare)}</td><td>${pct(r.incShare)}</td><td>${fmt(r.T0)}</td><td>${fmt(r.T1)}</td></tr>`).join("") +
        `</tbody></table>
        <p class="calc-note">The <b>between-group</b> term measures how much inequality would disappear if all groups had the same mean income; the <b>within-group</b> term is the inequality that would remain. Groups with very few observations give biased group indices.</p>`;
    }
    html += `<p><a class="btn btn-outline-primary btn-sm" id="calc-dl" download="theilumina_calculator_results.csv" href="#">Download results (CSV)</a></p>
      <p class="calc-note">Method: jackknife (delete-one) bias and variance; 95% interval = bias-corrected estimate ± 1.96 × standard error. With strongly skewed data or very small samples, normal-approximation intervals can be too narrow. See the <a href="guides/theil-indices-r.html">practical guide</a> for details.</p>`;
    $("calc-out").innerHTML = html;

    // CSV of results
    let csv = "section,index_or_group,statistic,value\n";
    for (const [k, r] of [["T0", j.T0], ["T1", j.T1]]) for (const s of ["estimate", "bias", "relBias", "corrected", "se"]) csv += `results,${k},${s},${r[s]}\n`;
    for (const [k, r] of [["T0", j.T0], ["T1", j.T1]]) csv += `results,${k},ci_lower,${r.ci[0]}\nresults,${k},ci_upper,${r.ci[1]}\n`;
    if (dec) {
      for (const k of ["T0", "T1"]) for (const s of ["total", "within", "between"]) csv += `decomposition,${k},${s},${dec[k][s]}\n`;
      for (const r of dec.groups) for (const s of ["n", "mean", "popShare", "incShare", "T0", "T1"]) csv += `groups,"${String(r.group).replace(/"/g, '""')}",${s},${r[s]}\n`;
    }
    const a = $("calc-dl");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], {type: "text/csv;charset=utf-8"}));
  }
})();
