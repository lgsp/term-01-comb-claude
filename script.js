// ────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────
function fact(n) {
  if (n <= 1) return 1n;
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}
function comb(n, k) {
  if (k < 0 || k > n) return 0n;
  return fact(n) / (fact(k) * fact(n - k));
}
function arr(n, k) {
  if (k < 0 || k > n) return 0n;
  return fact(n) / fact(n - k);
}
function fmt(big) {
  const s = big.toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
}

// ── CALCULATEURS ──
function calcFact() {
  const n = parseInt(document.getElementById('fact-n').value);
  if (isNaN(n) || n < 0 || n > 20) { document.getElementById('fact-result').textContent = 'Entrez n entre 0 et 20'; return; }
  document.getElementById('fact-result').innerHTML = `\\(${n}! = ${fmt(fact(n))}\\)`;
  if (window.MathJax) MathJax.typeset(['#fact-result']);
}
function calcArr() {
  const n = parseInt(document.getElementById('arr-n').value);
  const k = parseInt(document.getElementById('arr-k').value);
  const el = document.getElementById('arr-result');
  if (isNaN(n)||isNaN(k)||n<0||k<0) { el.textContent = 'Valeurs invalides'; return; }
  if (k > n) { el.textContent = `k > n : impossible (A = 0)`; return; }
  const v = arr(n, k);
  el.innerHTML = `\\(A_{${n}}^{${k}} = \\dfrac{${n}!}{${n-k}!} = ${fmt(v)}\\)`;
  if (window.MathJax) MathJax.typeset([el]);
}
function calcComb() {
  const n = parseInt(document.getElementById('comb-n').value);
  const k = parseInt(document.getElementById('comb-k').value);
  const el = document.getElementById('comb-result');
  if (isNaN(n)||isNaN(k)||n<0||k<0) { el.textContent = 'Valeurs invalides'; return; }
  if (k > n) { el.innerHTML = `\\(\\binom{${n}}{${k}} = 0\\) (k > n)`; if (window.MathJax) MathJax.typeset([el]); return; }
  const v = comb(n, k);
  el.innerHTML = `\\(\\binom{${n}}{${k}} = \\dfrac{${n}!}{${k}!\\,${n-k}!} = ${fmt(v)}\\)`;
  if (window.MathJax) MathJax.typeset([el]);
}
function calcBinom() {
  const n = parseInt(document.getElementById('binom-n').value);
  const a = parseFloat(document.getElementById('binom-a').value);
  const b = parseFloat(document.getElementById('binom-b').value);
  const el = document.getElementById('binom-result');
  if (isNaN(n)||n<0||n>8) { el.textContent='n doit être entre 0 et 8'; return; }
  const terms = [];
  for (let k = 0; k <= n; k++) {
    const c = Number(comb(n, k));
    const aP = Math.pow(a, n-k);
    const bP = Math.pow(b, k);
    const val = c * aP * bP;
    terms.push(val.toFixed(2).replace(/\.00$/, ''));
  }
  const total = terms.reduce((s,t) => s + parseFloat(t), 0);
  el.textContent = `(${a}+${b})^${n} = ${terms.join(' + ')} = ${total.toFixed(4).replace(/\.?0+$/, '')}`;
}

// init calculators
calcFact(); calcArr(); calcComb(); calcBinom();

// ────────────────────────────────────────────────
// PASCAL TRIANGLE
// ────────────────────────────────────────────────
function renderPascal() {
  const rows = parseInt(document.getElementById('pascal-rows').value);
  const T = [[1n]];
  for (let i = 1; i <= rows; i++) {
    const row = [1n];
    for (let k = 1; k < i; k++) row.push(T[i-1][k-1] + T[i-1][k]);
    row.push(1n);
    T.push(row);
  }
  const container = document.getElementById('pascal-triangle');
  let html = '<div style="display:inline-block">';
  for (let i = 0; i <= rows; i++) {
    html += `<div style="display:flex;justify-content:center;gap:4px;margin:2px 0;">`;
    for (let k = 0; k <= i; k++) {
      const v = T[i][k].toString();
      html += `<span data-n="${i}" data-k="${k}" style="
        display:inline-flex;align-items:center;justify-content:center;
        min-width:${rows>9?36:40}px;height:${rows>9?28:32}px;
        background:var(--bg3);border:1px solid var(--border);border-radius:6px;
        font-family:var(--font-mono);font-size:${rows>9?'0.65rem':'0.75rem'};
        color:var(--text2);cursor:default;transition:background 0.15s,color 0.15s,transform 0.1s;
      " onmouseenter="highlightPascal(this,${i},${k})" onmouseleave="unhighlightPascal()">${v}</span>`;
    }
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}
function highlightPascal(el, n, k) {
  document.querySelectorAll('#pascal-triangle span').forEach(s => {
    const sn = parseInt(s.dataset.n), sk = parseInt(s.dataset.k);
    if (sn === n && sk === k) { s.style.background = 'var(--accent)'; s.style.color = 'var(--bg)'; s.style.transform = 'scale(1.15)'; }
    else if (sn === n-1 && (sk === k-1 || sk === k)) { s.style.background = 'rgba(201,168,76,0.25)'; s.style.color = 'var(--accent2)'; }
    else { s.style.opacity = '0.3'; }
  });
}
function unhighlightPascal() {
  document.querySelectorAll('#pascal-triangle span').forEach(s => {
    s.style.background = ''; s.style.color = ''; s.style.transform = ''; s.style.opacity = '';
  });
}
renderPascal();

// ────────────────────────────────────────────────
// PYODIDE
// ────────────────────────────────────────────────
let pyodide = null;
let pyodideLoading = false;
const originalCodes = {};
document.querySelectorAll('.py-code').forEach(ta => {
  originalCodes[ta.id] = ta.value;
});

async function loadPyodideIfNeeded() {
  if (pyodide) return true;
  if (pyodideLoading) return false;
  pyodideLoading = true;
  const st = document.getElementById('pyodide-status');
  st.textContent = '⏳ Chargement de Python…';
  try {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
    document.head.appendChild(script);
    await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
    pyodide = await window.loadPyodide();
    st.textContent = '✓ Python prêt';
    st.classList.add('ready');
    setTimeout(() => st.classList.add('hidden'), 3000);
    return true;
  } catch(e) {
    st.textContent = '✗ Erreur Python';
    return false;
  }
}

async function runPy(blockId) {
  const code = document.getElementById(blockId + '-code').value;
  const outEl = document.getElementById(blockId + '-out');
  outEl.className = 'py-output active py-loading';
  outEl.textContent = '⏳ Exécution…';
  const ok = await loadPyodideIfNeeded();
  if (!ok) { outEl.className='py-output active error'; outEl.textContent='Python non disponible. Vérifiez la connexion.'; return; }
  try {
    let stdout = '';
    pyodide.setStdout({ batched: s => stdout += s + '\n' });
    await pyodide.runPythonAsync(code);
    outEl.className = 'py-output active';
    outEl.textContent = stdout || '(aucune sortie)';
  } catch(e) {
    outEl.className = 'py-output active error';
    outEl.textContent = '⚠ ' + e.message;
  }
}

function downloadPy(blockId) {
  const code = document.getElementById(blockId + '-code').value;
  const ta = document.getElementById(blockId + '-code');
  const titleEl = ta.closest('.py-block').querySelector('.py-title');
  const filename = titleEl ? titleEl.textContent.trim() : blockId + '.py';
  const blob = new Blob([code], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function resetPy(blockId) {
  document.getElementById(blockId + '-code').value = originalCodes[blockId + '-code'];
  const outEl = document.getElementById(blockId + '-out');
  outEl.className = 'py-output';
  outEl.textContent = '';
}

// ────────────────────────────────────────────────
// QCM
// ────────────────────────────────────────────────
const allQuestions = [
  { q: "Combien d'arrangements de 3 éléments parmi 7 existe-t-il ?", opts: ["210", "35", "7", "343"], ans: 0,
    exp: "\\(A_7^3 = 7 \\times 6 \\times 5 = 210\\)" },
  { q: "\\(\\binom{8}{3}\\) vaut :", opts: ["336", "56", "24", "512"], ans: 1,
    exp: "\\(\\binom{8}{3} = \\frac{8!}{3!\\,5!} = \\frac{8\\times7\\times6}{6} = 56\\)" },
  { q: "La relation de Pascal s'écrit :", opts: ["\\(\\binom{n}{k} = \\binom{n+1}{k}+\\binom{n-1}{k}\\)", "\\(\\binom{n}{k} = \\binom{n-1}{k-1}+\\binom{n-1}{k}\\)", "\\(\\binom{n}{k} = k\\cdot\\binom{n-1}{k}\\)", "\\(\\binom{n}{k} = \\binom{n}{k-1}+\\binom{n-1}{k}\\)"], ans: 1,
    exp: "La relation de Pascal est \\(\\binom{n}{k}=\\binom{n-1}{k-1}+\\binom{n-1}{k}\\)." },
  { q: "Quelle est la somme \\(\\sum_{k=0}^{n}\\binom{n}{k}\\) ?", opts: ["\\(n!\\)", "\\(2^n\\)", "\\(n^2\\)", "\\(\\frac{n(n+1)}{2}\\)"], ans: 1,
    exp: "En appliquant le binôme de Newton avec \\(a=b=1\\) : \\((1+1)^n=2^n\\)." },
  { q: "\\(\\binom{n}{k} = \\binom{n}{n-k}\\). Cette propriété s'appelle :", opts: ["Commutativité", "Symétrie", "Transitivité", "Associativité"], ans: 1,
    exp: "La propriété de symétrie des coefficients binomiaux : choisir \\(k\\) éléments revient à exclure \\(n-k\\) éléments." },
  { q: "Combien y a-t-il de mains de 5 cartes différentes dans un jeu de 52 cartes ?", opts: ["\\(52^5\\)", "\\(A_{52}^5=311\\,875\\,200\\)", "\\(\\binom{52}{5}=2\\,598\\,960\\)", "\\(52 \\times 5 = 260\\)"], ans: 2,
    exp: "L'ordre des cartes est indifférent : \\(\\binom{52}{5}=2\\,598\\,960\\)." },
  { q: "Quel est le coefficient de \\(a^2b^3\\) dans le développement de \\((a+b)^5\\) ?", opts: ["6", "10", "20", "3"], ans: 1,
    exp: "C'est \\(\\binom{5}{3}=\\binom{5}{2}=10\\)." },
  { q: "Combien d'anagrammes possède le mot CLAIR (toutes les lettres distinctes) ?", opts: ["5", "25", "120", "60"], ans: 2,
    exp: "\\(5! = 120\\) permutations de 5 lettres distinctes." },
  { q: "Parmi les formules suivantes, laquelle est correcte pour \\(A_n^k\\) ?", opts: ["\\(\\dfrac{n!}{k!}\\)", "\\(\\dfrac{n!}{(n-k)!}\\)", "\\(\\dfrac{k!}{(n-k)!}\\)", "\\(n^k\\)"], ans: 1,
    exp: "\\(A_n^k = \\dfrac{n!}{(n-k)!}\\) : on supprime les \\((n-k)!\\) arrangements non choisis." },
  { q: "Le binôme de Newton donne \\((a+b)^3 =\\) :", opts: ["\\(a^3 + b^3\\)", "\\(a^3+3a^2b+3ab^2+b^3\\)", "\\(3a^2b+3ab^2\\)", "\\(a^3+2a^2b+2ab^2+b^3\\)"], ans: 1,
    exp: "\\((a+b)^3 = \\binom{3}{0}a^3+\\binom{3}{1}a^2b+\\binom{3}{2}ab^2+\\binom{3}{3}b^3\\)." },
  { q: "La valeur de \\(0!\\) est :", opts: ["0", "1", "indéfinie", "\\(-1\\)"], ans: 1,
    exp: "Par convention (et pour cohérence des formules combinatoires) : \\(0! = 1\\)." },
  { q: "Un comité de 4 personnes est choisi parmi 10 candidats. Combien y a-t-il de comités possibles ?", opts: ["40", "5040", "210", "10000"], ans: 2,
    exp: "\\(\\binom{10}{4} = \\frac{10!}{4!\\,6!} = 210\\)." },
];

let currentQuestions = [];
let answered = {};
let chronoInterval = null;
let chronoSeconds = 0;
let chronoPaused = false;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newQCM() {
  answered = {};
  currentQuestions = shuffle(allQuestions).slice(0, 8);
  document.getElementById('qcm-result').classList.remove('active');
  document.getElementById('score-display').textContent = '0 / 0';
  resetChrono(); startChrono();
  renderQCM();
}

function renderQCM() {
  const container = document.getElementById('qcm-container');
  container.innerHTML = currentQuestions.map((q, qi) => `
    <div class="qcm-q" id="qcm-q-${qi}">
      <div class="qcm-question">${qi+1}. ${q.q}</div>
      <div class="qcm-opts">
        ${q.opts.map((opt, oi) => `
          <div class="qcm-opt" id="opt-${qi}-${oi}" onclick="selectOpt(${qi},${oi})">
            <span class="opt-letter">${String.fromCharCode(65+oi)}</span>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>
      <div class="qcm-feedback" id="feedback-${qi}"></div>
    </div>
  `).join('');
  if (window.MathJax) MathJax.typeset([container]);
}

function selectOpt(qi, oi) {
  if (answered[qi] !== undefined) return;
  document.querySelectorAll(`#qcm-q-${qi} .qcm-opt`).forEach(el => el.classList.remove('selected'));
  document.getElementById(`opt-${qi}-${oi}`).classList.add('selected');
  answered[qi] = oi;
}

function submitQCM() {
  let score = 0, total = currentQuestions.length;
  currentQuestions.forEach((q, qi) => {
    const chosen = answered[qi];
    const qEl = document.getElementById(`qcm-q-${qi}`);
    const fbEl = document.getElementById(`feedback-${qi}`);
    q.opts.forEach((_, oi) => {
      const optEl = document.getElementById(`opt-${qi}-${oi}`);
      optEl.classList.add('disabled');
      if (oi === q.ans) optEl.classList.add('correct');
      if (chosen === oi && chosen !== q.ans) optEl.classList.add('wrong');
    });
    if (chosen === q.ans) {
      score++;
      qEl.classList.add('correct');
      fbEl.innerHTML = `✓ Correct ! ${q.exp}`;
    } else {
      qEl.classList.add('wrong');
      fbEl.innerHTML = `✗ ${chosen === undefined ? 'Non répondu. ' : 'Incorrect. '}La bonne réponse est <strong>${q.opts[q.ans]}</strong>. ${q.exp}`;
    }
    fbEl.classList.add('active');
  });
  document.getElementById('score-display').textContent = `${score} / ${total}`;
  const resultEl = document.getElementById('qcm-result');
  const pct = Math.round(score / total * 100);
  let msg;
  if (pct >= 87) msg = '🏆 Excellent ! Maîtrise parfaite de la combinatoire.';
  else if (pct >= 62) msg = '👍 Bien ! Quelques points à revoir.';
  else msg = '📚 À retravailler — relisez le cours et les exemples.';
  document.getElementById('result-score').textContent = `${score} / ${total} — ${pct} %`;
  document.getElementById('result-msg').textContent = msg;
  resultEl.classList.add('active');
  if (window.MathJax) MathJax.typeset([resultEl, document.getElementById('qcm-container')]);
  stopChrono();
}

// ── CHRONO ──
function pad(n) { return String(n).padStart(2, '0'); }
function updateChronoDisplay() {
  const m = Math.floor(chronoSeconds / 60), s = chronoSeconds % 60;
  document.getElementById('chrono-display').textContent = `${pad(m)}:${pad(s)}`;
}
function startChrono() {
  stopChrono();
  chronoPaused = false;
  document.getElementById('chrono-btn').textContent = 'Pause';
  chronoInterval = setInterval(() => { if (!chronoPaused) { chronoSeconds++; updateChronoDisplay(); } }, 1000);
}
function stopChrono() { clearInterval(chronoInterval); chronoInterval = null; }
function resetChrono() { stopChrono(); chronoSeconds = 0; chronoPaused = false; updateChronoDisplay(); document.getElementById('chrono-btn').textContent = 'Pause'; }
function toggleChrono() {
  chronoPaused = !chronoPaused;
  document.getElementById('chrono-btn').textContent = chronoPaused ? 'Reprendre' : 'Pause';
}

// ── INIT ──
newQCM();

// ── SCROLL REVEAL ──
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('section').forEach(s => io.observe(s));

// ── NAV ACTIVE ──
const navLinks = document.querySelectorAll('nav a');
const sections = document.querySelectorAll('main section');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
  });
}, { passive: true });