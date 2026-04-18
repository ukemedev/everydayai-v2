(function () {
  const script = document.currentScript;
  const token = script.getAttribute("data-token");
  const baseUrl = script.getAttribute("data-url") || "https://everydayai-v2.vercel.app";

  if (!token) {
    console.error("[EverydayAI] No data-token provided.");
    return;
  }

  let threadId = null;
  let isOpen = false;

  const styles = `
    #eai-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #ff5500;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      box-shadow: 0 4px 20px rgba(255,85,0,0.4);
      transition: all 0.2s ease;
      font-size: 22px;
    }
    #eai-btn:hover { transform: scale(1.08); background: #ff6a1a; }
    #eai-window {
      position: fixed;
      bottom: 88px;
      right: 24px;
      width: 360px;
      height: 520px;
      background: #0d0d0d;
      border: 1px solid #222;
      border-top: 2px solid #ff5500;
      border-radius: 8px;
      display: none;
      flex-direction: column;
      z-index: 999998;
      font-family: 'JetBrains Mono', monospace;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.6);
    }
    #eai-window.open { display: flex; }
    #eai-header {
      padding: 12px 16px;
      background: #111;
      border-bottom: 1px solid #222;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #eai-header-title {
      font-size: 12px;
      color: #e8e8e8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #eai-status {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00ff88;
    }
    #eai-close {
      background: none;
      border: none;
      color: #555;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 2px 4px;
    }
    #eai-close:hover { color: #ff5500; }
    #eai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    #eai-messages::-webkit-scrollbar { width: 3px; }
    #eai-messages::-webkit-scrollbar-thumb { background: #333; }
    .eai-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.6;
    }
    .eai-msg.bot {
      background: #1a1a1a;
      border: 1px solid #222;
      color: #e8e8e8;
      align-self: flex-start;
    }
    .eai-msg.user {
      background: #ff5500;
      color: #fff;
      align-self: flex-end;
    }
    .eai-msg.typing {
      background: #1a1a1a;
      border: 1px solid #222;
      color: #555;
      align-self: flex-start;
      font-style: italic;
    }
    #eai-input-area {
      padding: 12px;
      border-top: 1px solid #222;
      display: flex;
      gap: 8px;
    }
    #eai-input {
      flex: 1;
      background: #111;
      border: 1px solid #333;
      color: #e8e8e8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 9px 12px;
      border-radius: 4px;
      outline: none;
    }
    #eai-input:focus { border-color: #ff5500; }
    #eai-input::placeholder { color: #444; }
    #eai-send {
      background: #ff5500;
      border: none;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 9px 14px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    #eai-send:hover { background: #ff6a1a; }
    #eai-send:disabled { opacity: 0.5; cursor: not-allowed; }
    #eai-footer {
      text-align: center;
      padding: 6px;
      font-size: 9px;
      color: #333;
      border-top: 1px solid #1a1a1a;
    }
    #eai-footer a { color: #444; text-decoration: none; }
    #eai-footer a:hover { color: #ff5500; }
  `;

  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const btn = document.createElement("button");
  btn.id = "eai-btn";
  btn.innerHTML = "💬";

  const win = document.createElement("div");
  win.id = "eai-window";
  win.innerHTML = `
    <div id="eai-header">
      <div id="eai-header-title">
        <div id="eai-status"></div>
        <span>// agent online</span>
      </div>
      <button id="eai-close">✕</button>
    </div>
    <div id="eai-messages">
      <div class="eai-msg bot">// Hello! How can I help you today?</div>
    </div>
    <div id="eai-input-area">
      <input id="eai-input" type="text" placeholder="> type your message..." />
      <button id="eai-send">send</button>
    </div>
    <div id="eai-footer">powered by <a href="https://everydayai.app" target="_blank">EverydayAI</a></div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  btn.addEventListener("click", () => {
    isOpen = !isOpen;
    win.classList.toggle("open", isOpen);
    btn.innerHTML = isOpen ? "✕" : "💬";
    if (isOpen) document.getElementById("eai-input").focus();
  });

  document.getElementById("eai-close").addEventListener("click", () => {
    isOpen = false;
    win.classList.remove("open");
    btn.innerHTML = "💬";
  });

  async function sendMessage() {
    const input = document.getElementById("eai-input");
    const send = document.getElementById("eai-send");
    const messages = document.getElementById("eai-messages");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    send.disabled = true;

    const userMsg = document.createElement("div");
    userMsg.className = "eai-msg user";
    userMsg.textContent = text;
    messages.appendChild(userMsg);

    const typing = document.createElement("div");
    typing.className = "eai-msg typing";
    typing.textContent = "// thinking...";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(`${baseUrl}/api/widget/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });

      const data = await res.json();
      threadId = data.threadId;

      typing.remove();
      const botMsg = document.createElement("div");
      botMsg.className = "eai-msg bot";
      botMsg.textContent = data.reply;
      messages.appendChild(botMsg);
    } catch {
      typing.remove();
      const errMsg = document.createElement("div");
      errMsg.className = "eai-msg bot";
      errMsg.textContent = "// error: could not reach agent.";
      messages.appendChild(errMsg);
    }

    send.disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  }

  document.getElementById("eai-send").addEventListener("click", sendMessage);
  document.getElementById("eai-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
