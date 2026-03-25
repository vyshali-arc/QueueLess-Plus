let selectedService = null;

async function processAuth(type) {
    const isLogin = type === 'login';
    const email = isLogin ? document.getElementById('email')?.value.trim() : document.getElementById('signup-email')?.value.trim();
    const password = isLogin ? document.getElementById('password')?.value.trim() : document.getElementById('signup-password')?.value.trim();
    
    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }
    
    // Pure Frontend Mock Authentication
    console.log(`Mocking ${type} for ${email}`);
    
    // For demo purposes, we accept any login or signup
    localStorage.setItem('queueless_user', email);
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s ease';
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
}

// Add enter key support
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.getElementById('username')) processAuth('login');
        if (document.getElementById('signup-name')) processAuth('signup');
    }
});

async function logout() {
    localStorage.removeItem('queueless_user');
    window.location.href = 'login.html';
}

function selectService(service, el) {
    selectedService = service;
    document.querySelectorAll('.service-btn').forEach(btn => {
        btn.classList.remove('active');
        const icon = btn.querySelector('i');
        if(icon) {
            icon.classList.remove('anim-heartbeat', 'anim-coin', 'anim-sparkle');
        }
    });
    el.classList.add('active');
    
    // Add micro animations
    const icon = el.querySelector('i');
    if(icon) {
        if(service === 'Hospital') icon.classList.add('anim-heartbeat');
        if(service === 'Bank') icon.classList.add('anim-coin');
        if(service === 'Salon') icon.classList.add('anim-sparkle');
    }
    
    document.getElementById('book-btn').disabled = false;
    fetchQueue(service);
}

window.localQueue = [
    { token: 'H-92', state: 'serving', service: 'Hospital' },
    { token: 'H-93', state: 'waiting', service: 'Hospital' },
    { token: 'S-22', state: 'waiting', service: 'Salon' },
    { token: 'B-15', state: 'waiting', service: 'Bank' },
    { token: 'H-94', state: 'waiting', service: 'Hospital' }
];
window.globalTokenCounter = 95;

function initLocalQueue() {
    renderLocalQueue();
    // Start automated simulation loop without backend
    setInterval(() => {
        if (window.localQueue.length > 0) {
            const served = window.localQueue.shift();
            if (window.localQueue.length > 0) window.localQueue[0].state = 'serving';
            
            if (served.state === 'mine') {
                localStorage.removeItem('my_token');
                const btn = document.getElementById('book-btn');
                if(btn) { btn.disabled = false; btn.textContent = "Get Token"; btn.style.background = "var(--accent)"; }
                const disp = document.getElementById('my-token-display');
                if(disp) disp.innerHTML = "<p>No active token.</p>";
                showMascotPopup("Your Token has been called! ✅");
                try { playChime(); } catch(e){}
            } else {
                showSmartToast("Queue Moved!", `Token ${served.token} was successfully completed.`, "⚡");
            }
            renderLocalQueue();
        }
    }, 7000);
}

async function submitBooking() {
    const user = localStorage.getItem('queueless_user');
    if (!user || !selectedService) return;
    const btn = document.getElementById('book-btn');
    btn.textContent = "Booking..."; btn.disabled = true;

    setTimeout(() => {
        const prefix = selectedService.charAt(0).toUpperCase();
        const newTokenStr = `${prefix}-${window.globalTokenCounter++}`;
        window.localQueue.push({ token: newTokenStr, state: 'mine', service: selectedService });
        localStorage.setItem('my_token', JSON.stringify({ number: newTokenStr, service: selectedService, id: window.globalTokenCounter }));
        
        renderMyToken();
        renderLocalQueue();
        
        showMascotPopup(`Yay! Your token for ${selectedService} is ${newTokenStr} 🎉`);
        showSmartToast("Token Generated", "Your queue position has been secured.", "✅");
        
        btn.textContent = "Token Active"; btn.style.background = '#10b981'; btn.disabled = true;
    }, 600);
}

function renderMyToken() {
    const tokenDisplay = document.getElementById('my-token-display');
    const tokenData = JSON.parse(localStorage.getItem('my_token'));
    if (tokenData && tokenDisplay) {
        tokenDisplay.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                   <h3 style="margin:0; font-size:1.8rem; color:var(--accent);">${tokenData.number}</h3>
                   <p style="margin:5px 0 0 0; color:var(--text-secondary);">${tokenData.service} Queue</p>
                </div>
            </div>
            <div id="token-countdown" style="margin-top:15px; color:var(--accent); font-size:0.95rem; font-weight:bold; background:rgba(56,189,248,0.1); padding:10px; border-radius:10px; text-align:center;">
                <i class="fas fa-clock"></i> Approx Call In: <strong>-- : -- sec</strong>
            </div>
        `;
    }
}

// Redirect fetchQueue universally to local simulator
function fetchQueue(forcedService = null) {
    if (forcedService) selectedService = forcedService;
    renderLocalQueue();
}

function renderLocalQueue() {
    const queueList = document.getElementById('queue-list');
    if (!queueList) return;
    const myToken = JSON.parse(localStorage.getItem('my_token'));
    
    let serviceQueue = window.localQueue;
    
    document.getElementById('total-waiting').textContent = serviceQueue.length;
    let estTime = serviceQueue.length * 5;
    document.getElementById('est-time').textContent = `${estTime} min`;
    
    const count = serviceQueue.length;
    const badge = document.getElementById('queue-speed-badge');
    if (badge) {
        if (count === 0) { badge.innerHTML = `<i class="fas fa-circle" style="font-size:0.8em; margin-right:5px; color:#10b981;"></i> Fast`; badge.style.color = '#10b981'; } 
        else if (count <= 5) { badge.innerHTML = `<i class="fas fa-circle" style="font-size:0.8em; margin-right:5px; color:#f59e0b;"></i> Moderate`; badge.style.color = '#f59e0b'; } 
        else { badge.innerHTML = `<i class="fas fa-circle" style="font-size:0.8em; margin-right:5px; color:#ef4444;"></i> Busy`; badge.style.color = '#ef4444'; }
    }
    
    const newQueueStr = JSON.stringify(serviceQueue);
    if (window.lastQueueStr === newQueueStr) return;
    window.lastQueueStr = newQueueStr;

    queueList.innerHTML = '';
    
    if (serviceQueue.length > 0) {
        const nowServing = serviceQueue[0].token;
        const totalTokens = serviceQueue[serviceQueue.length - 1].token;
        const sLabel = document.getElementById('serving-label');
        const tLabel = document.getElementById('total-tokens-label');
        if(sLabel) sLabel.textContent = `Now Serving: ${nowServing}`;
        if(tLabel) tLabel.textContent = `Latest: ${totalTokens}`;
        
        let progress = 50; 
        
        serviceQueue.forEach((item, index) => {
            const isMe = item.state === 'mine' || (myToken && item.token === myToken.number);
            if (isMe) {
                progress = 100 - ((index / serviceQueue.length) * 100);
                if (progress < 8) progress = 8;
                window.myWaitMins = index * 5;
                window.remainingSec = window.myWaitMins * 60;
            }
            
            let extraClass = '';
            if (index === 0) extraClass = 'serving';
            else if (index > 2) extraClass = 'upcoming';
            
            const el = document.createElement('div');
            el.className = `queue-item ${isMe ? 'me glow-border' : ''} ${extraClass}`;
            el.style.animation = 'slideInRight 0.5s ease forwards';
            
            el.innerHTML = `
                <div style="flex:1;">
                    <strong>${item.token}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 8px;">${item.service}</span>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight: bold;">#${index + 1}</div>
                    <div style="font-size: 0.8rem; color: var(--accent); margin-top: 4px;">Est: ~${index * 5} mins</div>
                </div>
            `;
            queueList.appendChild(el);
        });
        
        const progFill = document.getElementById('queue-progress-fill');
        if(progFill) progFill.style.width = `${progress}%`;
    } else {
        const sLabel = document.getElementById('serving-label');
        const tLabel = document.getElementById('total-tokens-label');
        if(sLabel) sLabel.textContent = `Queue is empty`;
        if(tLabel) tLabel.textContent = `---`;
        const progFill = document.getElementById('queue-progress-fill');
        if(progFill) progFill.style.width = `0%`;
        queueList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 1rem;">Queue is empty. You're next!</p>`;
    }
}

// Auto init my token display if it exists in DOM
if (document.getElementById('my-token-display')) {
    renderMyToken();
}

// UI Functionality additions
function toggleSettings() {
    const dropdown = document.getElementById('settings-dropdown');
    dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Check local storage for theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// Close dropdown if clicked outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('settings-dropdown');
    const menu = document.querySelector('.settings-menu');
    if (dropdown && dropdown.style.display === 'flex' && menu && !menu.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Mascot Toast Logic
function showMascotPopup(msg) {
    const toastMsg = document.getElementById('toast-msg');
    const toast = document.getElementById('mascot-toast');
    if (toastMsg && toast) {
        toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4500);
    }
}

// Chatbot Logic
function toggleChat() {
    const box = document.getElementById('chat-box');
    if(box) box.classList.toggle('show');
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    
    input.value = '';
    const msgsContainer = document.getElementById('chat-messages');
    msgsContainer.innerHTML += `<div class="chat-msg user">${msg}</div>`;
    msgsContainer.scrollTop = msgsContainer.scrollHeight;
    
    setTimeout(() => {
        let reply = "I am your QueueLess+ Helper! I can tell you about wait times.";
        const low = msg.toLowerCase();
        if (low.includes('time') || low.includes('wait') || low.includes('long')) {
            reply = "Average wait time is low today! Queues are moving fast.";
        } else if (low.includes('token') || low.includes('book') || low.includes('queue')) {
            reply = "Your token will be called soon. Make sure to watch the live queue tracker!";
        } else if (low.includes('hi') || low.includes('hello')) {
            reply = "Hello! Do you need help booking a service?";
        }
        msgsContainer.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
        msgsContainer.scrollTop = msgsContainer.scrollHeight;
    }, 600);
}

document.getElementById('chat-input')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendChatMessage();
});

// Ambient Light Bubbles Generation
document.addEventListener("DOMContentLoaded", () => {
    const bubblesContainer = document.createElement("div");
    bubblesContainer.className = "ambient-bubbles";
    for (let i = 0; i < 20; i++) {
        const bubble = document.createElement("div");
        bubble.className = "ambient-bubble";
        bubble.style.left = `${Math.random() * 100}vw`;
        bubble.style.width = `${Math.random() * 50 + 10}px`;
        bubble.style.height = bubble.style.width;
        bubble.style.animationDuration = `${Math.random() * 15 + 10}s`;
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        bubblesContainer.appendChild(bubble);
    }
    document.body.prepend(bubblesContainer);
});

// Digital Clock & Ripple Events
setInterval(() => {
    const clock = document.getElementById('live-clock');
    if (clock) clock.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
}, 1000);

document.addEventListener('click', function(e) {
    if (e.target.closest('.glass-btn')) {
        const btn = e.target.closest('.glass-btn');
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-obj';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
});

function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5);
        osc.start(); osc.stop(ctx.currentTime + 1.5);
    } catch(e) {}
}

function triggerConfetti() {
    for (let i = 0; i < 40; i++) {
        const conf = document.createElement('div');
        conf.style.position = 'fixed';
        conf.style.width = '10px'; conf.style.height = '10px';
        conf.style.backgroundColor = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random()*5)];
        conf.style.left = '50%'; conf.style.top = '50%';
        conf.style.zIndex = '9999';
        conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        conf.style.transition = 'transform 1s cubic-bezier(.17,.89,.32,1.28), opacity 1s';
        document.body.appendChild(conf);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 20 + Math.random() * 20;
        const tx = Math.cos(angle) * velocity * 10;
        const ty = Math.sin(angle) * velocity * 10;
        
        requestAnimationFrame(() => {
            conf.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random()*360}deg)`;
            conf.style.opacity = '0';
        });
        setTimeout(() => conf.remove(), 1000);
    }
}

// Digital Clock & Ripple Events
setInterval(() => {
    const clock = document.getElementById('live-clock');
    if (clock) clock.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
}, 1000);

document.addEventListener('click', function(e) {
    if (e.target.closest('.glass-btn')) {
        const btn = e.target.closest('.glass-btn');
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-obj';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
});

function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5);
        osc.start(); osc.stop(ctx.currentTime + 1.5);
    } catch(e) {}
}

function triggerConfetti() {
    for (let i = 0; i < 40; i++) {
        const conf = document.createElement('div');
        conf.style.position = 'fixed';
        conf.style.width = '10px'; conf.style.height = '10px';
        conf.style.backgroundColor = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random()*5)];
        conf.style.left = '50%'; conf.style.top = '50%';
        conf.style.zIndex = '9999';
        conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        conf.style.transition = 'transform 1s cubic-bezier(.17,.89,.32,1.28), opacity 1s';
        document.body.appendChild(conf);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 20 + Math.random() * 20;
        const tx = Math.cos(angle) * velocity * 10;
        const ty = Math.sin(angle) * velocity * 10;
        
        requestAnimationFrame(() => {
            conf.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random()*360}deg)`;
            conf.style.opacity = '0';
        });
        setTimeout(() => conf.remove(), 1000);
    }
}

// Token Updates, Queue Movement Simulator, Toasts & Countdowns
function showSmartToast(title, desc, icon='🔔') {
    let container = document.getElementById('toast-wrapper');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-wrapper';
        container.style.cssText = 'position:fixed; top:80px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = 'glass-panel';
    t.style.cssText = 'padding:12px 20px; border-radius:12px; display:flex; gap:10px; align-items:center; animation: slideInRight 0.4s ease forwards; background: rgba(255,255,255,0.85); box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 4px solid var(--accent); max-width: 300px; pointer-events:auto;';
    t.innerHTML = `<div style="font-size:1.5rem; display:flex; align-items:center;">${icon}</div><div style="display:flex; flex-direction:column;"><strong style="color:var(--text-primary); font-size:0.95rem;">${title}</strong><span style="font-size:0.8rem; color:var(--text-secondary);">${desc}</span></div>`;
    container.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'fadeOutRight 0.4s ease forwards';
        setTimeout(()=>t.remove(), 400);
    }, 4500);
}

setInterval(() => {
    const bkBtn = document.getElementById('book-btn');
    if (localStorage.getItem('my_token')) {
        if (bkBtn && bkBtn.textContent !== 'Token Active') {
            bkBtn.disabled = true;
            bkBtn.textContent = 'Token Active';
            bkBtn.style.background = '#10b981';
        }
        const qItems = document.querySelectorAll('.queue-item');
        if (qItems.length > 1) {
            const meIndex = Array.from(qItems).findIndex(el => el.classList.contains('me'));
            if (meIndex === 1) {
                const disp = document.getElementById('my-token-display');
                if (disp && !document.getElementById('next-badge')) {
                    disp.innerHTML += `<div id="next-badge" class="glass-badge" style="background:#f59e0b; color:white; margin-top:1rem; padding:8px 15px; border-radius:12px; font-weight:bold; width:fit-content; animation:servingPulse 2s infinite;">You are next! 🔥</div>`;
                    showSmartToast('Get Ready!', 'You are next in line.', '🎯');
                }
            }
        }
        
        // Countdown Logic Update
        const cDown = document.getElementById('token-countdown');
        if (cDown && window.myWaitMins) {
            if (!window.remainingSec) window.remainingSec = window.myWaitMins * 60;
            if (window.remainingSec > 0) window.remainingSec--;
            const m = Math.floor(window.remainingSec / 60);
            const s = window.remainingSec % 60;
            cDown.innerHTML = `<i class="fas fa-clock"></i> Approx Call In: <strong>${m} : ${s.toString().padStart(2, '0')} sec</strong>`;
        }
    } else {
        if (bkBtn && bkBtn.textContent === 'Token Active') {
            bkBtn.disabled = false;
            bkBtn.textContent = 'Get Token';
            bkBtn.style.background = 'var(--accent)';
            const badge = document.getElementById('next-badge');
            if(badge) badge.remove();
        }
    }
    
    // Update Queue Speed Indicator
    const badge = document.getElementById('queue-speed-badge');
    const waitingStr = document.getElementById('total-waiting')?.textContent || '0';
    const count = parseInt(waitingStr);
    if (badge && !isNaN(count)) {
        if (count === 0) {
            badge.innerHTML = `<i class="fas fa-circle" style="font-size:0.8em; margin-right:5px; color:#10b981;"></i> Fast`;
            badge.style.color = '#10b981';
        } else if (count <= 5) {
            badge.innerHTML = `<i class="fas fa-circle" style="font-size:0.8em; margin-right:5px; color:#f59e0b;"></i> Moderate`;
            badge.style.color = '#f59e0b';
        } else {
            badge.innerHTML = `<i class="fas fa-circle" style="font-size:0.8em; margin-right:5px; color:#ef4444;"></i> Busy`;
            badge.style.color = '#ef4444';
        }
    }

    // Queue Moved Toast Logic (Track count drop)
    if (window.prevQueueLen !== undefined && count < window.prevQueueLen && count >= 0) {
        showSmartToast("Queue Moved!", "A token was just successfully completed.", "⚡");
    }
    window.prevQueueLen = count;

}, 1000);
