const resultEl = document.getElementById('result');
const exprEl = document.getElementById('expr');

let cur = '0', prev = '', op = '', justEvaled = false;

const opSyms = { '*': '×', '/': '÷', '+': '+', '-': '−' };

// Show full live expression in result, e.g. "12 + 5"
function refreshDisplay() {
    let text = '';
    if (prev !== '') {
        text += prev;
        if (op) text += ' ' + (opSyms[op] || op) + ' ';
        if (op && cur !== '0') text += cur;
        else if (op && cur === '0' && !justEvaled) text += '';
    } else {
        text = cur;
    }
    // If nothing typed yet after operator, still show the operator
    if (prev !== '' && op && cur === '0') {
        text = prev + ' ' + (opSyms[op] || op);
    }

    resultEl.textContent = text || '0';
    const len = (text || '0').length;
    if (len > 16) resultEl.className = 'result xs';
    else if (len > 11) resultEl.className = 'result small';
    else resultEl.className = 'result';
}

// Top expression line: shows full equation after "="
function setExpr(text) {
    exprEl.textContent = text || '';
}

function evaluate() {
    const a = parseFloat(prev);
    const b = parseFloat(cur);
    let res;

    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*') res = a * b;
    else if (op === '/') res = b === 0 ? null : a / b;

    if (res === null) {
        cur = 'Error'; prev = ''; op = '';
        resultEl.textContent = 'Error';
        resultEl.className = 'result';
        return;
    }

    // Show full equation in expr line before replacing
    setExpr(prev + ' ' + (opSyms[op] || op) + ' ' + cur + ' =');

    cur = String(parseFloat(res.toFixed(10)));
    prev = '';
    refreshDisplay();
}

function press(val) {
    // Clear
    if (val === 'AC') {
        cur = '0'; prev = ''; op = ''; justEvaled = false;
        setExpr('');
        refreshDisplay();
        return;
    }

    // Backspace button
    if (val === 'BACK') {
        if (justEvaled || cur === 'Error') { cur = '0'; justEvaled = false; }
        else if (cur.length > 1) cur = cur.slice(0, -1);
        else cur = '0';
        refreshDisplay();
        return;
    }

    // Percentage
    if (val === '%') {
        cur = String(parseFloat(cur) / 100);
        refreshDisplay();
        return;
    }

    // Operator
    if (['+', '-', '*', '/'].includes(val)) {
        if (op && prev && cur !== '0') evaluate();
        if (cur === 'Error') return;
        prev = cur;
        cur = '0';
        op = val;
        justEvaled = false;
        setExpr('');
        refreshDisplay();
        return;
    }

    // Equals
    if (val === '=') {
        if (!op || !prev) return;
        evaluate();
        justEvaled = true;
        op = '';
        return;
    }

    // Decimal point
    if (val === '.') {
        if (justEvaled) { cur = '0'; justEvaled = false; prev = ''; setExpr(''); }
        if (!cur.includes('.')) cur += '.';
        refreshDisplay();
        return;
    }

    // Digit
    if (justEvaled) {
        cur = '0'; justEvaled = false;
        prev = ''; op = '';
        setExpr('');
    }
    if (cur === 'Error') { cur = '0'; prev = ''; op = ''; setExpr(''); }

    cur = (cur === '0')
        ? val
        : cur + val;

    refreshDisplay();
}

// --- Button click ---
document.getElementById('btns').addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    press(btn.dataset.val);
    btn.style.transform = 'scale(0.93)';
    setTimeout(() => btn.style.transform = '', 120);
});

// --- Keyboard support ---
document.addEventListener('keydown', e => {
    const map = { 'Enter': '=', 'Escape': 'AC' };
    let v = map[e.key] || e.key;

    // Backspace — delete last digit
    if (v === 'Backspace') {
        press('BACK');
        const btn = [...document.querySelectorAll('.btn')].find(b => b.dataset.val === 'BACK');
        if (btn) { btn.style.transform = 'scale(0.93)'; setTimeout(() => btn.style.transform = '', 120); }
        return;
    }

    const valid = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        '+', '-', '*', '/', '.', '=', 'AC', '%'];
    if (!valid.includes(v)) return;

    e.preventDefault();
    press(v);

    // Visual flash on matching button
    const btn = [...document.querySelectorAll('.btn')]
        .find(b => b.dataset.val === v);
    if (btn) {
        btn.style.transform = 'scale(0.93)';
        setTimeout(() => btn.style.transform = '', 120);
    }
});