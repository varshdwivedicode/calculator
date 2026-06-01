const resultEl = document.getElementById('result');
const exprEl = document.getElementById('expr');

let cur = '0', prev = '', op = '', justEvaled = false;

function setDisplay(val) {
    resultEl.textContent = val;
    if (val.length > 12) resultEl.className = 'result xs';
    else if (val.length > 9) resultEl.className = 'result small';
    else resultEl.className = 'result';
}

function updateExpr() {
    const opSyms = { '*': '×', '/': '÷', '+': '+', '-': '−' };
    if (op && prev) exprEl.textContent = prev + ' ' + (opSyms[op] || op);
    else exprEl.textContent = '';
}

function evaluate() {
    const a = parseFloat(prev);
    const b = parseFloat(cur);
    let res;

    if (op === '+') res = a + b;
    else if (op === '-') res = a - b;
    else if (op === '*') res = a * b;
    else if (op === '/') res = b === 0 ? 'Error' : a / b;

    if (res === 'Error') {
        cur = 'Error'; prev = ''; op = '';
        setDisplay('Error');
        return;
    }

    cur = String(parseFloat(res.toFixed(10)));
    prev = '';
    setDisplay(cur);
}

function press(val) {
    // Clear
    if (val === 'AC') {
        cur = '0'; prev = ''; op = ''; justEvaled = false;
        exprEl.textContent = '';
        setDisplay('0');
        return;
    }

    // Toggle sign
    if (val === '+/-') {
        if (cur !== '0')
            cur = cur.startsWith('-') ? cur.slice(1) : '-' + cur;
        setDisplay(cur);
        return;
    }

    // Percentage
    if (val === '%') {
        cur = String(parseFloat(cur) / 100);
        setDisplay(cur);
        return;
    }

    // Operator
    if (['+', '-', '*', '/'].includes(val)) {
        if (op && prev && !justEvaled) evaluate();
        prev = cur;
        op = val;
        justEvaled = false;
        updateExpr();
        return;
    }

    // Equals
    if (val === '=') {
        if (!op || !prev) return;
        const opSyms = { '*': '×', '/': '÷', '+': '+', '-': '−' };
        exprEl.textContent = prev + ' ' + opSyms[op] + ' ' + cur + ' =';
        evaluate();
        justEvaled = true;
        op = '';
        return;
    }

    // Decimal point
    if (val === '.') {
        if (justEvaled) { cur = '0'; justEvaled = false; }
        if (!cur.includes('.')) cur += '.';
        setDisplay(cur);
        return;
    }

    // Digit
    if (justEvaled) {
        cur = '0'; justEvaled = false;
        prev = ''; op = '';
        exprEl.textContent = '';
    }
    cur = (cur === '0' || cur === '-0')
        ? (cur.startsWith('-') ? '-' + val : val)
        : cur + val;
    setDisplay(cur);
    updateExpr();
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
        if (cur.length > 1 && !justEvaled) cur = cur.slice(0, -1);
        else cur = '0';
        setDisplay(cur);
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
