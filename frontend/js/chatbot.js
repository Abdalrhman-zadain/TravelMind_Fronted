// CHATBOT PAGE LOGIC

let chatHistory = [];
let isTyping = false;

function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

function showTyping() {
    document.getElementById('typing-indicator').classList.remove('hidden');
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    document.getElementById('typing-indicator').classList.add('hidden');
}

async function callAI(userMessage) {
    chatHistory.push({ role: 'user', content: userMessage });

    const data = await ChatAPI.reply({
        message: userMessage,
        history: chatHistory
    });
    const reply = data?.reply || 'Sorry, I could not generate a response.';

    chatHistory.push({ role: 'assistant', content: reply });

    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    return reply;
}

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
            "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!",
            'bot'
        );
    }

    isTyping = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('chat-input').focus();
}

function askQuick(question) {
    document.getElementById('chat-input').value = question;
    sendMessage();
}

async function clearChat() {
    if (!confirm('Clear all chat history?')) return;

    chatHistory = [];

    const container = document.getElementById('chat-messages');
    container.innerHTML = `
    <div class="message message-bot">
      <div class="message-avatar">🤖</div>
      <div class="message-bubble">
        <div class="message-text">
          Marhaba! I'm your TravelMind AI assistant — here to help you explore the beautiful Kingdom of Jordan!<br/><br/>
          What would you like to know?
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

    showToast('Chat cleared!', 'info');
}

function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

async function loadChatHistory() {
    if (!isLoggedIn()) return;

    const user = getUser();
    try {
        const history = await ChatAPI.getHistory(user.id);
        if (!Array.isArray(history) || history.length === 0) return;

        const recent = history.slice(-10);
        recent.forEach((msg) => {
            appendMessage(msg.message, 'user');
            if (msg.response && msg.response !== msg.message) {
                appendMessage(msg.response, 'bot');
            }
        });
    } catch (e) { /* silent */ }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chat-input').focus();
    loadChatHistory();
});
