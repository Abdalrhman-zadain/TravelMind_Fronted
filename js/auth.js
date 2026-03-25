// ═══════════════════════════════════════════════
// AUTH PAGE LOGIC
// ═══════════════════════════════════════════════

// ── REDIRECT IF ALREADY LOGGED IN ──────────────
if (isLoggedIn()) location.href = 'index.html';

// ── CHECK URL FOR TAB ───────────────────────────
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('tab') === 'register') showTab('register');

// ── SHOW TAB ────────────────────────────────────
function showTab(tab) {
    // update tabs
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');

    // show/hide forms
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');

    // clear errors
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('register-error').classList.add('hidden');
}

// ── TOGGLE PASSWORD ─────────────────────────────
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

// ── SHOW ERROR ──────────────────────────────────
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.remove('hidden');
}

// ── LOGIN ───────────────────────────────────────
async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    // validate
    if (!email || !password) {
        showError('login-error', 'Please enter your email and password!');
        return;
    }

    // disable button
    const btn = document.getElementById('login-btn');
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
        const result = await AuthAPI.login({
            id: 0,
            name: '',
            email: email,
            passwordHash: password,
            preferredLanguage: 'en',
            profileImage: '',
            createdAt: new Date().toISOString()
        });

        // save user to localStorage
        localStorage.setItem('tm_token', (result.token || result.userId?.toString() || '').toString());
        localStorage.setItem('tm_user', JSON.stringify({
            id: result.userId,
            name: result.name,
            email: result.email,
            language: result.language
        }));

        showToast('Welcome back, ' + result.name + '! 👋', 'success');
        setTimeout(() => location.href = 'index.html', 1000);

    } catch (err) {
        showError('login-error', 'Invalid email or password. Please try again!');
        btn.textContent = 'Login';
        btn.disabled = false;
    }
}

// ── REGISTER ────────────────────────────────────
async function doRegister() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const language = document.getElementById('register-language').value;

    // validate
    if (!name) {
        showError('register-error', 'Please enter your full name!');
        return;
    }
    if (!email || !email.includes('@')) {
        showError('register-error', 'Please enter a valid email address!');
        return;
    }
    if (password.length < 6) {
        showError('register-error', 'Password must be at least 6 characters!');
        return;
    }

    // disable button
    const btn = document.getElementById('register-btn');
    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
        const result = await AuthAPI.register({
            id: 0,
            name: name,
            email: email,
            passwordHash: password,
            preferredLanguage: language,
            profileImage: '',
            createdAt: new Date().toISOString()
        });

        showToast('Account created successfully! 🎉', 'success');

        // auto login after register
        localStorage.setItem('tm_token', (result.token || result.userId?.toString() || '').toString());
        localStorage.setItem('tm_user', JSON.stringify({
            id: result.userId,
            name: result.name,
            email: result.email,
            language: language
        }));

        setTimeout(() => location.href = 'index.html', 1000);

    } catch (err) {
        showError('register-error', err.message || 'Registration failed. Email may already exist!');
        btn.textContent = 'Create Account';
        btn.disabled = false;
    }
}

// ── ENTER KEY SUPPORT ───────────────────────────
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const loginForm = document.getElementById('form-login');
    if (!loginForm.classList.contains('hidden')) doLogin();
    else doRegister();
});
