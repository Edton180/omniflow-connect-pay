/**
 * OmniFlow WebChat Widget v1.0
 * Embed this script on your website to enable live chat support
 */
(function() {
  'use strict';

  // Get configuration from global variable
  var config = window.omniflowConfig || {};
  var apiUrl = config.apiUrl || '';
  var tenantId = config.tenantId || '';
  var channelCode = config.channelCode || '';
  var welcomeMessage = config.welcomeMessage || 'Olá! Como podemos ajudar?';
  var themeColor = config.themeColor || '#8B5CF6';
  var position = config.position || 'bottom-right';
  var showAgentName = config.showAgentName !== false;
  var autoOpen = config.autoOpen === true;

  // Session management
  var sessionId = localStorage.getItem('omniflow_session_id');
  var visitorName = localStorage.getItem('omniflow_visitor_name') || '';
  var visitorEmail = localStorage.getItem('omniflow_visitor_email') || '';

  if (!sessionId) {
    sessionId = 'webchat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('omniflow_session_id', sessionId);
  }

  // Messages storage
  var messages = [];
  var isOpen = autoOpen;
  var isMinimized = false;
  var unreadCount = 0;

  // Create styles
  var styles = document.createElement('style');
  styles.textContent = `
    #omniflow-webchat-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      position: fixed;
      z-index: 999999;
      ${position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 20px;
    }

    #omniflow-webchat-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${themeColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
    }

    #omniflow-webchat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,0,0,0.3);
    }

    #omniflow-webchat-bubble svg {
      width: 28px;
      height: 28px;
    }

    #omniflow-webchat-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      font-size: 12px;
      font-weight: bold;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: none;
      align-items: center;
      justify-content: center;
    }

    #omniflow-webchat-window {
      display: none;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 550px;
      max-height: calc(100vh - 100px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
      flex-direction: column;
      position: absolute;
      bottom: 80px;
      ${position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
    }

    #omniflow-webchat-window.open {
      display: flex;
      animation: omniflow-slideUp 0.3s ease;
    }

    @keyframes omniflow-slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    #omniflow-webchat-header {
      background: ${themeColor};
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #omniflow-webchat-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    #omniflow-webchat-header p {
      margin: 4px 0 0;
      font-size: 12px;
      opacity: 0.9;
    }

    #omniflow-webchat-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 5px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    #omniflow-webchat-close:hover {
      opacity: 1;
    }

    #omniflow-webchat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f8f9fa;
    }

    .omniflow-message {
      margin-bottom: 12px;
      max-width: 85%;
      animation: omniflow-fadeIn 0.3s ease;
    }

    @keyframes omniflow-fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .omniflow-message.visitor {
      margin-left: auto;
    }

    .omniflow-message.agent {
      margin-right: auto;
    }

    .omniflow-message-content {
      padding: 10px 14px;
      border-radius: 12px;
      word-wrap: break-word;
    }

    .omniflow-message.visitor .omniflow-message-content {
      background: ${themeColor};
      color: white;
      border-bottom-right-radius: 4px;
    }

    .omniflow-message.agent .omniflow-message-content {
      background: white;
      color: #1f2937;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-bottom-left-radius: 4px;
    }

    .omniflow-message-meta {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
      padding: 0 4px;
    }

    .omniflow-message.visitor .omniflow-message-meta {
      text-align: right;
    }

    #omniflow-webchat-form {
      display: none;
      padding: 20px;
      background: white;
      border-top: 1px solid #e5e7eb;
    }

    #omniflow-webchat-form.active {
      display: block;
    }

    #omniflow-webchat-form h4 {
      margin: 0 0 16px;
      font-size: 14px;
      color: #374151;
    }

    #omniflow-webchat-form input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }

    #omniflow-webchat-form input:focus {
      outline: none;
      border-color: ${themeColor};
      box-shadow: 0 0 0 3px ${themeColor}20;
    }

    #omniflow-webchat-form button {
      width: 100%;
      padding: 12px;
      background: ${themeColor};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    #omniflow-webchat-form button:hover {
      opacity: 0.9;
    }

    #omniflow-webchat-input {
      display: flex;
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      background: white;
      gap: 10px;
      align-items: flex-end;
    }

    #omniflow-webchat-input textarea {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      padding: 10px 16px;
      resize: none;
      font-size: 14px;
      max-height: 100px;
      font-family: inherit;
    }

    #omniflow-webchat-input textarea:focus {
      outline: none;
      border-color: ${themeColor};
    }

    #omniflow-webchat-input button {
      background: ${themeColor};
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.2s, opacity 0.2s;
    }

    #omniflow-webchat-input button:hover {
      transform: scale(1.05);
    }

    #omniflow-webchat-input button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .omniflow-typing {
      display: none;
      padding: 10px 14px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 12px;
      max-width: 80px;
    }

    .omniflow-typing.active {
      display: block;
    }

    .omniflow-typing-dots {
      display: flex;
      gap: 4px;
    }

    .omniflow-typing-dots span {
      width: 8px;
      height: 8px;
      background: #9ca3af;
      border-radius: 50%;
      animation: omniflow-bounce 1.4s infinite ease-in-out both;
    }

    .omniflow-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .omniflow-typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes omniflow-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    @media (max-width: 480px) {
      #omniflow-webchat-window {
        width: calc(100vw - 20px);
        height: calc(100vh - 100px);
        bottom: 70px;
        border-radius: 12px;
      }

      #omniflow-webchat-bubble {
        width: 50px;
        height: 50px;
      }

      #omniflow-webchat-bubble svg {
        width: 24px;
        height: 24px;
      }
    }
  `;
  document.head.appendChild(styles);

  // Create HTML structure
  var container = document.createElement('div');
  container.id = 'omniflow-webchat-container';
  container.innerHTML = `
    <div id="omniflow-webchat-window">
      <div id="omniflow-webchat-header">
        <div>
          <h3>💬 Suporte ao Cliente</h3>
          <p>Estamos aqui para ajudar!</p>
        </div>
        <button id="omniflow-webchat-close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div id="omniflow-webchat-form">
        <h4>Antes de começar, nos conte um pouco sobre você:</h4>
        <input type="text" id="omniflow-visitor-name" placeholder="Seu nome" required>
        <input type="email" id="omniflow-visitor-email" placeholder="Seu e-mail (opcional)">
        <button type="button" id="omniflow-start-chat">Iniciar Conversa</button>
      </div>
      <div id="omniflow-webchat-messages">
        <div class="omniflow-typing">
          <div class="omniflow-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <div id="omniflow-webchat-input">
        <textarea id="omniflow-message-input" placeholder="Digite sua mensagem..." rows="1"></textarea>
        <button id="omniflow-send-btn" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
    <div id="omniflow-webchat-bubble">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span id="omniflow-webchat-badge">0</span>
    </div>
  `;
  document.body.appendChild(container);

  // Get DOM elements
  var bubble = document.getElementById('omniflow-webchat-bubble');
  var chatWindow = document.getElementById('omniflow-webchat-window');
  var closeBtn = document.getElementById('omniflow-webchat-close');
  var messagesContainer = document.getElementById('omniflow-webchat-messages');
  var messageInput = document.getElementById('omniflow-message-input');
  var sendBtn = document.getElementById('omniflow-send-btn');
  var form = document.getElementById('omniflow-webchat-form');
  var inputArea = document.getElementById('omniflow-webchat-input');
  var nameInput = document.getElementById('omniflow-visitor-name');
  var emailInput = document.getElementById('omniflow-visitor-email');
  var startChatBtn = document.getElementById('omniflow-start-chat');
  var badge = document.getElementById('omniflow-webchat-badge');
  var typingIndicator = document.querySelector('.omniflow-typing');

  // Initialize
  function init() {
    if (visitorName) {
      form.style.display = 'none';
      inputArea.style.display = 'flex';
      loadMessages();
      addSystemMessage(welcomeMessage);
    } else {
      form.classList.add('active');
      inputArea.style.display = 'none';
    }

    if (autoOpen) {
      openChat();
    }
  }

  // Event listeners
  bubble.addEventListener('click', function() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeBtn.addEventListener('click', closeChat);

  startChatBtn.addEventListener('click', function() {
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();

    if (!name) {
      nameInput.focus();
      return;
    }

    visitorName = name;
    visitorEmail = email;
    localStorage.setItem('omniflow_visitor_name', name);
    localStorage.setItem('omniflow_visitor_email', email);

    form.classList.remove('active');
    inputArea.style.display = 'flex';

    // Send initial contact to server
    sendToServer({
      type: 'contact',
      name: name,
      email: email,
      sessionId: sessionId
    });

    addSystemMessage(welcomeMessage);
  });

  messageInput.addEventListener('input', function() {
    sendBtn.disabled = !this.value.trim();
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Functions
  function openChat() {
    isOpen = true;
    chatWindow.classList.add('open');
    unreadCount = 0;
    updateBadge();
    messageInput.focus();
  }

  function closeChat() {
    isOpen = false;
    chatWindow.classList.remove('open');
  }

  function updateBadge() {
    if (unreadCount > 0) {
      badge.style.display = 'flex';
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
    } else {
      badge.style.display = 'none';
    }
  }

  function addMessage(content, isVisitor, agentName) {
    var messageDiv = document.createElement('div');
    messageDiv.className = 'omniflow-message ' + (isVisitor ? 'visitor' : 'agent');

    var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var meta = isVisitor ? time : (showAgentName && agentName ? agentName + ' · ' + time : time);

    messageDiv.innerHTML = `
      <div class="omniflow-message-content">${escapeHtml(content)}</div>
      <div class="omniflow-message-meta">${meta}</div>
    `;

    // Insert before typing indicator
    messagesContainer.insertBefore(messageDiv, typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    messages.push({
      content: content,
      isVisitor: isVisitor,
      agentName: agentName,
      time: new Date().toISOString()
    });
  }

  function addSystemMessage(content) {
    addMessage(content, false, 'Sistema');
  }

  function sendMessage() {
    var content = messageInput.value.trim();
    if (!content) return;

    addMessage(content, true);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;

    sendToServer({
      type: 'message',
      content: content,
      sessionId: sessionId,
      visitorName: visitorName,
      visitorEmail: visitorEmail
    });
  }

  function sendToServer(data) {
    data.tenantId = tenantId;
    data.channelCode = channelCode;

    fetch(apiUrl + '/functions/v1/webchat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(function(response) { return response.json(); })
    .then(function(result) {
      if (result.reply) {
        setTimeout(function() {
          addMessage(result.reply, false, result.agentName || 'Atendente');
        }, 500);
      }
    })
    .catch(function(error) {
      console.error('OmniFlow WebChat Error:', error);
    });
  }

  function loadMessages() {
    // Load messages from local storage or server
    var savedMessages = localStorage.getItem('omniflow_messages_' + sessionId);
    if (savedMessages) {
      try {
        var parsed = JSON.parse(savedMessages);
        parsed.forEach(function(msg) {
          addMessage(msg.content, msg.isVisitor, msg.agentName);
        });
      } catch (e) {}
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Polling for new messages
  function pollMessages() {
    if (!visitorName || !sessionId) return;

    fetch(apiUrl + '/functions/v1/webchat-webhook?sessionId=' + sessionId + '&tenantId=' + tenantId)
      .then(function(response) { return response.json(); })
      .then(function(result) {
        if (result.messages && result.messages.length > messages.length) {
          var newMessages = result.messages.slice(messages.length);
          newMessages.forEach(function(msg) {
            if (!msg.isVisitor) {
              addMessage(msg.content, false, msg.agentName);
              if (!isOpen) {
                unreadCount++;
                updateBadge();
              }
            }
          });
        }
      })
      .catch(function(error) {
        console.error('Polling error:', error);
      });
  }

  // Start polling every 5 seconds
  setInterval(pollMessages, 5000);

  // Initialize widget
  init();
})();
