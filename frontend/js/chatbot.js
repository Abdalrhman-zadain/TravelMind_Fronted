// ═══════════════════════════════════════════════
// CHATBOT PAGE LOGIC
// ═══════════════════════════════════════════════

let chatHistory = [];
let isTyping = false;

// ── SYSTEM PROMPT ───────────────────────────────
const SYSTEM_PROMPT = `You are TravelMind AI, a friendly and knowledgeable travel assistant 
specializing in Jordan tourism. You help travelers discover attractions, hotels, restaurants, 
plan trips, and learn about Jordanian culture and history.

Key facts about Jordan you know:
- Major destinations: Petra, Wadi Rum, Amman, Aqaba, Dead Sea, Jerash, Madaba, Ajloun
- Currency: Jordanian Dinar (JOD). 1 JOD ≈ 1.41 USD
- Language: Arabic (official), English widely spoken
- Best time to visit: March-May and September-November
- Famous food: Mansaf, Falafel, Hummus, Maqluba, Kunafa
- Petra entry fee: ~50 JOD for 1 day, ~55 JOD for 2 days
- Jordan Pass available for multiple attractions
- Visa on arrival available for most nationalities

Always be helpful, friendly, and concise. Use emojis occasionally to make responses warm 
and engaging. If asked about bookings or real-time data, remind users to check official sources.
Answer in the same language the user writes in (Arabic or English).`;

// ── GET TIME ────────────────────────────────────
function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── APPEND MESSAGE ──────────────────────────────
function appendMessage(text, role) {
    const container = document.getElementById('chat-messages');

    const div = document.createElement('div');
    div.className = `message message-${role}`;

    const avatar = role === 'bot' ? '🤖' : '👤';

    div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-bubble">
      <div class="message-text">${text}</div>
      <div class="message-time">${getTime()}</div>
    </div>
  `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ── SHOW / HIDE TYPING ──────────────────────────
function showTyping() {
    document.getElementById('typing-indicator').classList.remove('hidden');
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    document.getElementById('typing-indicator').classList.add('hidden');
}

// ── CALL AI API ─────────────────────────────────
async function callAI(userMessage) {
    chatHistory.push({ role: 'user', content: userMessage });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: chatHistory
        })
    });

    if (!response.ok) throw new Error('AI service error');

    const data = response.ok ? await response.json() : null;
    const reply = data?.content?.[0]?.text || 'Sorry, I could not generate a response.';

    chatHistory.push({ role: 'assistant', content: reply });

    // keep history to last 20 messages
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    return reply;
}

// ── SEND MESSAGE ────────────────────────────────
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();

    if (!text || isTyping) return;

    input.value = '';
    input.style.height = 'auto';

    appendMessage(text, 'user');

    isTyping = true;
    document.getElementById('send-btn').disabled = true;
    showTyping();

    // save to backend if logged in
    if (isLoggedIn()) {
        const user = getUser();
        try {
            await ChatAPI.sendMessage({
                id: 0,
                userId: user.id,
                message: text,
                response: '',
                createdAt: new Date().toISOString()
            });
        } catch (e) { /* silent */ }
    }

    try {
        const reply = await callAI(text);
        hideTyping();
        appendMessage(reply, 'bot');

        // save AI response to backend
        if (isLoggedIn()) {
            const user = getUser();
            try {
                await ChatAPI.sendMessage({
                    id: 0,
                    userId: user.id,
                    message: reply,
                    response: reply,
                    createdAt: new Date().toISOString()
                });
            } catch (e) { /* silent */ }
        }

    } catch (err) {
        hideTyping();
        appendMessage(
            "I'm sorry, I'm having trouble connecting right now. Please try again in a moment! 😊",
            'bot'
        );
    }

    isTyping = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('chat-input').focus();
}

// ── QUICK QUESTION ──────────────────────────────
function askQuick(question) {
    document.getElementById('chat-input').value = question;
    sendMessage();
}

// ── CLEAR CHAT ──────────────────────────────────
async function clearChat() {
    if (!confirm('Clear all chat history?')) return;

    chatHistory = [];

    const container = document.getElementById('chat-messages');
    container.innerHTML = `
    <div class="message message-bot">
      <div class="message-avatar">🤖</div>
      <div class="message-bubble">
        <div class="message-text">
          Marhaba! 👋 I'm your TravelMind AI assistant — here to help you explore the beautiful Kingdom of Jordan!<br/><br/>
          What would you like to know? 😊
        </div>
        <div class="message-time">${getTime()}</div>
      </div>
    </div>`;

    if (isLoggedIn()) {
        const user = getUser();
        try {
            await ChatAPI.clearHistory(user.id);
        } catch (e) { /* silent */ }
    }

    showToast('Chat cleared! 🗑️', 'info');
}

// ── HANDLE ENTER KEY ────────────────────────────
function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// ── AUTO RESIZE TEXTAREA ────────────────────────
function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── LOAD CHAT HISTORY FROM BACKEND ──────────────
async function loadChatHistory() {
    if (!isLoggedIn()) return;

    const user = getUser();
    try {
        const history = await ChatAPI.getHistory(user.id);
        if (!Array.isArray(history) || history.length === 0) return;

        // show last 10 messages
        const recent = history.slice(-10);
        recent.forEach(msg => {
            appendMessage(msg.message, 'user');
            if (msg.response && msg.response !== msg.message) {
                appendMessage(msg.response, 'bot');
            }
        });
    } catch (e) { /* silent */ }
}

// ── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chat-input').focus();
    loadChatHistory();
});