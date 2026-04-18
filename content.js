(function () {
  const translations = {
    fr: {
      title: "Pause réflexion",
      subtitle: "Avant de valider ce panier, prenons un instant.",
      instruction: "Pour débloquer le paiement, tapez la phrase ci-dessous (sans tricher avec le copier-coller) :",
      targetPhrase: "j'ai conscience que cet achat n'est pas essentiel et je choisis de le faire quand même.",
      placeholder: "tapez la phrase ici..."
    },
    en: {
      title: "Moment of reflection",
      subtitle: "Let's take a second before validating this cart.",
      instruction: "To unlock the checkout, type the phrase below (without copy-pasting):",
      targetPhrase: "i realize this purchase isn't essential and i choose to make it anyway.",
      placeholder: "type the phrase here..."
    }
  };

  const getLanguage = () => {
    const lang = navigator.language.toLowerCase();
    return lang.startsWith('fr') ? 'fr' : 'en';
  };

  const t = translations[getLanguage()];
  let isUnlocked = false;
  let shadowRoot = null;
  let hostElement = null;

  // Le CSS pur et moderne, sans aucun !important
  const shadowStyles = `
    :host {
      --ap-bg: rgba(9, 9, 11, 0.7);
      --ap-surface: rgba(24, 24, 27, 0.6);
      --ap-border: rgba(255, 255, 255, 0.08);
      --ap-text-main: rgba(255, 255, 255, 0.95);
      --ap-text-muted: rgba(255, 255, 255, 0.6);
      --ap-primary: #ffffff;
      --ap-danger: #ef4444;
      --ap-danger-bg: rgba(239, 68, 68, 0.1);
      
      all: initial; /* Réinitialise tout héritage potentiel */
    }

    .ap-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background-color: var(--ap-bg);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ap-overlay.ap-visible {
      opacity: 1;
      pointer-events: auto;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .ap-modal {
      position: relative;
      width: 100%;
      max-width: 28rem;
      border-radius: 1.5rem;
      border: 1px solid var(--ap-border);
      background-color: var(--ap-surface);
      padding: 2.5rem;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transform: scale(0.95) translateY(10px);
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .ap-overlay.ap-visible .ap-modal {
      transform: scale(1) translateY(0);
    }

    .ap-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .ap-icon-wrapper {
      display: flex;
      height: 3.5rem;
      width: 3.5rem;
      align-items: center;
      justify-content: center;
      border-radius: 1rem;
      background-color: var(--ap-danger-bg);
      border: 1px solid rgba(239, 68, 68, 0.2);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
    }

    .ap-icon-wrapper svg {
      height: 1.75rem;
      width: 1.75rem;
      stroke: var(--ap-danger);
    }

    .ap-title {
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.03em;
      color: var(--ap-text-main);
    }

    .ap-subtitle {
      font-size: 0.9rem;
      color: var(--ap-text-muted);
      margin-top: 0.5rem;
    }

    .ap-instruction {
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--ap-text-muted);
      margin-bottom: 1.25rem;
      text-align: center;
    }

    .ap-target-box {
      border-radius: 0.75rem;
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--ap-border);
      padding: 1.25rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      color: var(--ap-text-main);
      text-align: center;
      margin-bottom: 2rem;
    }

    .ap-input-container {
      position: relative;
    }

    .ap-input {
      width: 100%;
      border-radius: 0.75rem;
      border: 1px solid var(--ap-border);
      background-color: rgba(0, 0, 0, 0.2);
      padding: 1.25rem;
      padding-right: 3.5rem;
      font-size: 0.95rem;
      color: var(--ap-text-main);
      transition: all 0.2s ease;
      outline: none;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    }

    .ap-input:focus {
      border-color: rgba(255, 255, 255, 0.3);
      background-color: rgba(0, 0, 0, 0.4);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1), inset 0 2px 4px rgba(0,0,0,0.2);
    }

    .ap-input::placeholder {
      color: rgba(255, 255, 255, 0.2);
    }

    .ap-lock-icon {
      position: absolute;
      right: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      height: 1.25rem;
      width: 1.25rem;
      stroke: rgba(255, 255, 255, 0.2);
      transition: stroke 0.3s ease;
    }

    .ap-lock-icon.ap-active {
      stroke: var(--ap-primary);
    }

    .ap-progress-container {
      margin-top: 1.5rem;
      height: 3px;
      width: 100%;
      overflow: hidden;
      border-radius: 9999px;
      background-color: rgba(255, 255, 255, 0.05);
    }

    .ap-progress-bar {
      height: 100%;
      background-color: var(--ap-primary);
      width: 0%;
      transition: width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }
  `;

  const isolateEvents = (e) => {
    e.stopPropagation();
    if (e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }
  };

  const createUI = () => {
    if (document.getElementById('anti-panier-host')) return;

    // Création de l'élément hôte
    hostElement = document.createElement('div');
    hostElement.id = 'anti-panier-host';
    
    // Positionnement global de l'hôte pour garantir qu'il couvre l'écran
    hostElement.style.position = 'fixed';
    hostElement.style.inset = '0';
    hostElement.style.zIndex = '2147483647';
    hostElement.style.pointerEvents = 'none'; // Laisse passer les clics quand invisible

    // Attacher le Shadow DOM
    shadowRoot = hostElement.attachShadow({ mode: 'closed' });

    // Injecter les styles isolés
    const styleSheet = document.createElement('style');
    styleSheet.textContent = shadowStyles;
    shadowRoot.appendChild(styleSheet);

    // Création de la structure HTML dans le Shadow DOM
    const overlay = document.createElement('div');
    overlay.className = 'ap-overlay';
    
    const eventsToIsolate = ['mousedown', 'mouseup', 'click', 'keydown', 'keyup', 'keypress'];
    eventsToIsolate.forEach(eventType => {
      overlay.addEventListener(eventType, isolateEvents, true);
    });

    overlay.innerHTML = `
      <div class="ap-modal">
        <div class="ap-header">
          <div class="ap-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <h2 class="ap-title">${t.title}</h2>
            <p class="ap-subtitle">${t.subtitle}</p>
          </div>
        </div>
        <div class="ap-body">
          <p class="ap-instruction">${t.instruction}</p>
          <div class="ap-target-box">${t.targetPhrase}</div>
        </div>
        <div class="ap-input-container">
          <input type="text" class="ap-input" placeholder="${t.placeholder}" autocomplete="off" autocorrect="off" spellcheck="false" />
          <svg class="ap-lock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="ap-progress-container">
          <div class="ap-progress-bar" id="ap-progress"></div>
        </div>
      </div>
    `;

    shadowRoot.appendChild(overlay);
    document.body.appendChild(hostElement);

    const input = shadowRoot.querySelector('.ap-input');
    const progressBar = shadowRoot.querySelector('#ap-progress');
    const lockIcon = shadowRoot.querySelector('.ap-lock-icon');

    input.addEventListener('paste', (e) => e.preventDefault());

    input.addEventListener('input', (e) => {
      const value = e.target.value;
      const progress = Math.min((value.length / t.targetPhrase.length) * 100, 100);
      progressBar.style.width = `${progress}%`;

      if (value === t.targetPhrase) {
        lockIcon.classList.add('ap-active');
        isUnlocked = true;
        setTimeout(() => hideOverlay(), 400);
      } else {
        lockIcon.classList.remove('ap-active');
      }
    });
  };

  const showOverlay = () => {
    if (!shadowRoot) createUI();
    const overlay = shadowRoot.querySelector('.ap-overlay');
    if (overlay) {
      overlay.classList.add('ap-visible');
      hostElement.style.pointerEvents = 'auto'; // Active les clics
      document.body.style.setProperty('overflow', 'hidden', 'important');
    }
  };

  const hideOverlay = () => {
    if (shadowRoot) {
      const overlay = shadowRoot.querySelector('.ap-overlay');
      if (overlay) {
        overlay.classList.remove('ap-visible');
        hostElement.style.pointerEvents = 'none'; // Désactive les clics
      }
    }
    document.body.style.removeProperty('overflow');
  };

  const checkUrl = () => {
    if (isUnlocked) return;

    try {
      // On utilise l'objet URL pour analyser proprement l'adresse (sans le nom de domaine)
      const urlObj = new URL(window.location.href);
      const pathAndQuery = (urlObj.pathname + urlObj.search).toLowerCase();

      // REGEX STRICTE : 
      // \/ ou [?&] -> Le mot DOIT être précédé par un slash (ex: /cart) ou un paramètre (?cart)
      // (cart|checkout|panier|basket|bag|commande|paiement) -> Les mots cibles
      // (\/|\?|&|#|$) -> Le mot DOIT être suivi d'une fin d'URL, d'un slash, ou d'un paramètre
      const checkoutRegex = /(?:\/|[?&])(cart|checkout|panier|basket|bag|commande|paiement)(?:[\/?&#]|$)/i;

      // Domaines développeurs à ignorer par sécurité
      const isDeveloperSite = ['github.com', 'gitlab.com', 'stackoverflow.com', 'localhost'].includes(urlObj.hostname);

      if (isDeveloperSite) {
        hideOverlay();
        return;
      }

      // Si le chemin correspond exactement à la structure d'un panier
      if (checkoutRegex.test(pathAndQuery)) {
        showOverlay();
      } else {
        hideOverlay();
      }
    } catch (e) {
      // Sécurité si l'URL est mal formée
      hideOverlay();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createUI();
      checkUrl();
    });
  } else {
    createUI();
    checkUrl();
  }

  const observer = new MutationObserver(checkUrl);
  observer.observe(document.body, { childList: true, subtree: true });

})();