/* ============================================================
   CALCULATOR — script.js
   Sections:
   1. State
   2. DOM References
   3. Display Helpers
   4. Core Calculation Logic
   5. Input Handlers  (digit / operator / equals / actions)
   6. Event Wiring   (click)
   7. Keyboard Support
   ============================================================ */


/* ── 1. State ───────────────────────────────────────────── */
const state = {
    current: '0',   // Number currently on screen
    prev: null,  // Operand stored before operator press
    op: null,  // Pending operator  (+ − × ÷)
    freshEntry: false, // Next digit replaces display (after op press)
    justEvaluated: false, // = was just pressed
    expression: '',    // Text shown in expression line
};


/* ── 2. DOM References ──────────────────────────────────── */
const mainEl = document.getElementById('main');    // Large number
const exprEl = document.getElementById('expr');    // e.g.  "12 + "
const historyEl = document.getElementById('history'); // Previous result


/* ── 3. Display Helpers ─────────────────────────────────── */

/**
 * Format a float for display — avoids floating-point artifacts
 * and trims unnecessary trailing zeros.
 */
function fmt(n) {
    if (!isFinite(n) || isNaN(n)) return 'Error';
    return parseFloat(n.toPrecision(12)).toString();
}

/**
 * Push a value to the main display.
 * Automatically shrinks the font size for long strings.
 */
function setDisplay(val, isError = false) {
    const s = String(val);
    mainEl.classList.toggle('error', isError);

    if (s.length > 13) mainEl.style.fontSize = '22px';
    else if (s.length > 9) mainEl.style.fontSize = '30px';
    else if (s.length > 7) mainEl.style.fontSize = '36px';
    else mainEl.style.fontSize = '42px';

    mainEl.textContent = s;
}

/** Brief green flash to signal a result has been computed. */
function flash() {
    mainEl.classList.add('result-flash');
    setTimeout(() => mainEl.classList.remove('result-flash'), 220);
}

/** Remove the "active" highlight from all operator buttons. */
function clearActiveOp() {
    document.querySelectorAll('.btn.op').forEach(b => b.classList.remove('active'));
}

/** Highlight the operator button that is currently pending. */
function setActiveOp(op) {
    clearActiveOp();
    if (!op) return;
    document.querySelectorAll('.btn.op').forEach(b => {
        if (b.dataset.op === op) b.classList.add('active');
    });
}

/** Animate a ripple at click coordinates inside a button. */
function rippleEffect(btn, event) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (event.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (event.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
    const span = document.createElement('span');
    span.classList.add('ripple');
    span.style.width = size + 'px';
    span.style.height = size + 'px';
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
}

/** Briefly scale-down a button (used for keyboard feedback). */
function highlightBtn(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.transform = 'scale(0.91)';
    setTimeout(() => (el.style.transform = ''), 100);
}


/* ── 4. Core Calculation Logic ──────────────────────────── */

/**
 * Evaluate two operands with a given operator.
 * Returns Infinity for division-by-zero (shown as Error).
 */
function evaluate(a, op, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    switch (op) {
        case '+': return a + b;
        case '−': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? Infinity : a / b;
        default: return b;
    }
}


/* ── 5. Input Handlers ──────────────────────────────────── */

/** Handle a digit (0–9) or decimal point character. */
function inputDigit(d) {
    if (state.justEvaluated) {
        // Start fresh after an = press
        state.current = d;
        state.justEvaluated = false;
        exprEl.textContent = '';
    } else if (state.freshEntry) {
        // Replace display after an operator was chosen
        state.current = d;
        state.freshEntry = false;
    } else {
        // Append digit (max 13 chars)
        if (state.current === '0' && d !== '.') {
            state.current = d;
        } else if (state.current.length < 13) {
            state.current += d;
        }
    }
    setDisplay(state.current);
}

/** Handle an arithmetic operator press (+ − × ÷). */
function inputOp(op) {
    // If an operator is already pending and a new number was entered, chain
    if (state.op && !state.freshEntry && !state.justEvaluated) {
        const res = evaluate(state.prev, state.op, state.current);
        const rf = fmt(res);
        state.prev = rf;
        state.current = rf;
        setDisplay(rf, rf === 'Error');
        flash();
    } else {
        state.prev = state.current;
    }

    state.op = op;
    state.freshEntry = true;
    state.justEvaluated = false;
    exprEl.textContent = state.prev + ' ' + op;
    historyEl.textContent = '';
    setActiveOp(op);
}

/** Handle the = button press. */
function inputEquals() {
    if (!state.op || state.prev === null) return;

    const fullExpr = state.prev + ' ' + state.op + ' ' + state.current + ' =';
    const res = evaluate(state.prev, state.op, state.current);
    const rf = fmt(res);

    historyEl.textContent = exprEl.textContent || '';
    exprEl.textContent = fullExpr;
    setDisplay(rf, rf === 'Error');
    flash();

    state.current = rf;
    state.prev = null;
    state.op = null;
    state.justEvaluated = true;
    state.freshEntry = false;
    clearActiveOp();
}

/**
 * Handle special action buttons:
 *   clear, sign, percent, dot, equals,
 *   sqrt, square, inverse, backspace
 */
function doAction(action) {
    switch (action) {

        case 'clear':
            Object.assign(state, {
                current: '0', prev: null, op: null,
                freshEntry: false, justEvaluated: false, expression: '',
            });
            setDisplay('0');
            exprEl.textContent = '';
            historyEl.textContent = '';
            clearActiveOp();
            break;

        case 'sign':
            if (state.current !== '0' && state.current !== 'Error') {
                state.current = fmt(parseFloat(state.current) * -1);
                setDisplay(state.current);
            }
            break;

        case 'percent':
            if (state.current !== 'Error') {
                state.current = fmt(parseFloat(state.current) / 100);
                setDisplay(state.current);
            }
            break;

        case 'dot':
            if (state.justEvaluated || state.freshEntry) {
                state.current = '0.';
                state.justEvaluated = false;
                state.freshEntry = false;
            } else if (!state.current.includes('.')) {
                state.current += '.';
            }
            setDisplay(state.current);
            break;

        case 'equals':
            inputEquals();
            break;

        case 'sqrt': {
            const v = parseFloat(state.current);
            if (v < 0) { setDisplay('Error', true); return; }
            const r = fmt(Math.sqrt(v));
            exprEl.textContent = '√(' + state.current + ') =';
            state.current = r;
            state.justEvaluated = true;
            setDisplay(r, r === 'Error');
            flash();
            break;
        }

        case 'square': {
            const r = fmt(Math.pow(parseFloat(state.current), 2));
            exprEl.textContent = '(' + state.current + ')² =';
            state.current = r;
            state.justEvaluated = true;
            setDisplay(r, r === 'Error');
            flash();
            break;
        }

        case 'inverse': {
            const v = parseFloat(state.current);
            if (v === 0) { setDisplay('Error', true); return; }
            const r = fmt(1 / v);
            exprEl.textContent = '1/(' + state.current + ') =';
            state.current = r;
            state.justEvaluated = true;
            setDisplay(r, r === 'Error');
            flash();
            break;
        }

        case 'backspace':
            if (state.justEvaluated || state.freshEntry) return;
            state.current = state.current.length > 1
                ? state.current.slice(0, -1)
                : '0';
            setDisplay(state.current);
            break;
    }
}


/* ── 6. Event Wiring (click) ────────────────────────────── */

// Digit buttons
document.querySelectorAll('[data-num]').forEach(btn => {
    btn.addEventListener('click', e => {
        rippleEffect(btn, e);
        inputDigit(btn.dataset.num);
    });
});

// Operator buttons
document.querySelectorAll('[data-op]').forEach(btn => {
    btn.addEventListener('click', e => {
        rippleEffect(btn, e);
        inputOp(btn.dataset.op);
    });
});

// Action buttons (main grid + extras row)
document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
        rippleEffect(btn, e);
        doAction(btn.dataset.action);
    });
});


/* ── 7. Keyboard Support ────────────────────────────────── */
document.addEventListener('keydown', e => {
    // Don't intercept browser shortcuts
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const k = e.key;

    if (k >= '0' && k <= '9') {
        e.preventDefault();
        inputDigit(k);
        highlightBtn(`[data-num="${k}"]`);

    } else if (k === '.') {
        e.preventDefault();
        doAction('dot');
        highlightBtn('[data-action="dot"]');

    } else if (k === '+') {
        e.preventDefault();
        inputOp('+');
        highlightBtn('[data-op="+"]');

    } else if (k === '-') {
        e.preventDefault();
        inputOp('−');
        highlightBtn('[data-op="−"]');

    } else if (k === '*') {
        e.preventDefault();
        inputOp('×');
        highlightBtn('[data-op="×"]');

    } else if (k === '/') {
        e.preventDefault();
        inputOp('÷');
        highlightBtn('[data-op="÷"]');

    } else if (k === 'Enter' || k === '=') {
        e.preventDefault();
        doAction('equals');
        highlightBtn('[data-action="equals"]');

    } else if (k === 'Escape') {
        e.preventDefault();
        doAction('clear');
        highlightBtn('[data-action="clear"]');

    } else if (k === 'Backspace') {
        e.preventDefault();
        doAction('backspace');
        highlightBtn('[data-action="backspace"]');

    } else if (k === '%') {
        e.preventDefault();
        doAction('percent');
        highlightBtn('[data-action="percent"]');
    }
});