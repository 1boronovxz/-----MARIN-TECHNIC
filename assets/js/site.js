let headerInitialized = false;
let activeDropdown = null;
let dropdownOpenScrollTop = 0;

async function loadIncludes() {
  const containers = Array.from(document.querySelectorAll('[data-include]'));
  if (!containers.length) {
    initHeaderInteractions();
    return;
  }

  await Promise.all(
    containers.map(async (container) => {
      const src = container.getAttribute('data-include');
      if (!src) {
        return;
      }
      try {
        const response = await fetch(src);
        if (!response.ok) {
          console.warn(`[site] Не удалось загрузить include: ${src}`);
          return;
        }
        const markup = await response.text();
        container.innerHTML = markup;
      } catch (error) {
        console.warn(`[site] Ошибка при загрузке include ${src}`, error);
      }
    })
  );

  initHeaderInteractions();
}

function closeActiveDropdown() {
  if (!activeDropdown) return;
  const trigger = activeDropdown.querySelector('[data-dropdown-trigger]');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
  }
  activeDropdown.classList.remove('open');
  activeDropdown = null;
}

function initEquipmentDropdown(dropdown) {
  const buttons = Array.from(dropdown.querySelectorAll('.equipment-category'));
  const lists = Array.from(dropdown.querySelectorAll('.equipment-list'));
  if (!buttons.length || !lists.length) {
    return;
  }

  const showCategory = (key) => {
    buttons.forEach((button) => {
      const isActive = button.dataset.category === key;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-expanded', String(isActive));
    });
    lists.forEach((list) => {
      list.classList.toggle('active', list.dataset.category === key);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      showCategory(button.dataset.category);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showCategory(button.dataset.category);
      }
    });
  });

  const first = buttons[0];
  if (first) {
    showCategory(first.dataset.category);
  }
}

function initDropdowns() {
  const dropdowns = Array.from(document.querySelectorAll('.dropdown'));
  dropdowns.forEach((dropdown) => {
    if (dropdown.dataset.dropdownInit === 'true') return;
    dropdown.dataset.dropdownInit = 'true';

    const trigger = dropdown.querySelector('[data-dropdown-trigger]');
    const panel = dropdown.querySelector('.dropdown-panel');
    if (!trigger || !panel) {
      return;
    }

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      if (activeDropdown && activeDropdown !== dropdown) {
        closeActiveDropdown();
      }
      if (!isOpen) {
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        activeDropdown = dropdown;
        dropdownOpenScrollTop = window.scrollY;
      } else {
        closeActiveDropdown();
      }
    });

    panel.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    panel.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeActiveDropdown();
      });
    });

    if (dropdown.dataset.dropdown === 'equipment') {
      initEquipmentDropdown(dropdown);
    }
  });
}

function initMobileMenu() {
  const menuButton = document.querySelector('#menu');
  const mobilePanel = document.querySelector('#mobile');
  if (!menuButton || !mobilePanel) {
    return;
  }

  const closeMobileMenu = () => {
    mobilePanel.classList.add('hidden');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('overflow-hidden');
  };

  if (menuButton.dataset.initialized !== 'true') {
    menuButton.dataset.initialized = 'true';
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const isHidden = mobilePanel.classList.toggle('hidden');
      menuButton.setAttribute('aria-expanded', String(!isHidden));
      document.body.classList.toggle('overflow-hidden', !isHidden);
      if (!isHidden) {
        closeActiveDropdown();
      }
    });
  }

  mobilePanel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  const accordions = mobilePanel.querySelectorAll('.mobile-accordion');
  accordions.forEach((accordion) => {
    accordion.addEventListener('toggle', () => {
      if (!accordion.open) return;
      accordions.forEach((other) => {
        if (other !== accordion) {
          other.open = false;
        }
      });
    });
  });

  const subAccordions = mobilePanel.querySelectorAll('.mobile-subaccordion');
  subAccordions.forEach((accordion) => {
    accordion.addEventListener('toggle', () => {
      if (!accordion.open) return;
      subAccordions.forEach((other) => {
        if (other !== accordion) {
          other.open = false;
        }
      });
    });
  });

  const mq = window.matchMedia('(min-width: 768px)');
  const watcher = (event) => {
    if (event.matches) {
      closeMobileMenu();
    }
  };
  mq.addEventListener ? mq.addEventListener('change', watcher) : mq.addListener(watcher);
}

function initHeaderInteractions() {
  if (headerInitialized) return;
  headerInitialized = true;

  initDropdowns();
  initMobileMenu();
  initContactModal();
  initEquipmentTabs();
}

document.addEventListener('click', (event) => {
  if (!activeDropdown) return;
  if (activeDropdown.contains(event.target)) return;
  closeActiveDropdown();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeActiveDropdown();
  }
});

window.addEventListener('scroll', () => {
  if (!activeDropdown) return;
  if (Math.abs(window.scrollY - dropdownOpenScrollTop) > window.innerHeight / 3) {
    closeActiveDropdown();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadIncludes();
});

let contactModalOverlay = null;
let contactModalDialog = null;
let contactModalPreviousFocus = null;
let contactModalFocusable = [];

function injectContactModal() {
  if (document.getElementById('contact-modal')) {
    contactModalOverlay = document.getElementById('contact-modal');
    contactModalDialog = contactModalOverlay.querySelector('[data-modal-dialog]');
    return;
  }

  const markup = `
    <div id="contact-modal" class="modal-overlay" aria-hidden="true">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" data-modal-dialog tabindex="-1">
        <button type="button" class="modal-close" aria-label="Закрыть" data-modal-close>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M6.75 6.75l10.5 10.5M17.25 6.75l-10.5 10.5"/>
          </svg>
        </button>
        <div class="modal-header">
          <h2 id="contact-modal-title" class="modal-title">Оставьте заявку</h2>
          <p class="modal-subtitle">Перезвоним, уточним задачу и предложим конфигурацию оборудования.</p>
        </div>
        <form class="modal-form space-y-4" action="https://formsubmit.co/youremail@example.com" method="POST">
          <input type="hidden" name="_subject" value="Запрос с попапа Marine Technology" />
          <input type="hidden" name="_captcha" value="false" />
          <div class="form-field">
            <label for="popup-name">Имя</label>
            <input id="popup-name" name="name" type="text" autocomplete="name" placeholder="Как к вам обращаться?" required />
          </div>
          <div class="form-field">
            <label for="popup-phone">Телефон</label>
            <input id="popup-phone" name="phone" type="tel" autocomplete="tel" placeholder="+7 ___ ___ __ __" required />
          </div>
          <button type="submit">Отправить заявку</button>
          <p class="modal-footnote">Нажимая «Отправить заявку», вы соглашаетесь с обработкой персональных данных.</p>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', markup);
  contactModalOverlay = document.getElementById('contact-modal');
  contactModalDialog = contactModalOverlay.querySelector('[data-modal-dialog]');
}

function openContactModal() {
  if (!contactModalOverlay || !contactModalDialog) {
    return;
  }
  contactModalPreviousFocus = document.activeElement;
  contactModalOverlay.classList.add('active');
  contactModalOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  contactModalFocusable = Array.from(contactModalDialog.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'))
    .filter((el) => !el.hasAttribute('disabled'));

  const firstInput = contactModalDialog.querySelector('input');
  (firstInput || contactModalDialog).focus({ preventScroll: true });

  contactModalOverlay.addEventListener('keydown', trapContactModalFocus);
}

function closeContactModal() {
  if (!contactModalOverlay || !contactModalDialog) {
    return;
  }
  contactModalOverlay.classList.remove('active');
  contactModalOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  contactModalOverlay.removeEventListener('keydown', trapContactModalFocus);

  if (contactModalPreviousFocus && typeof contactModalPreviousFocus.focus === 'function') {
    contactModalPreviousFocus.focus({ preventScroll: true });
  }
}

function trapContactModalFocus(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeContactModal();
    return;
  }

  if (event.key !== 'Tab' || contactModalFocusable.length === 0) {
    return;
  }

  const first = contactModalFocusable[0];
  const last = contactModalFocusable[contactModalFocusable.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initContactModal() {
  injectContactModal();
  if (!contactModalOverlay || !contactModalDialog) return;

  const closeButtons = contactModalOverlay.querySelectorAll('[data-modal-close]');
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      closeContactModal();
    });
  });

  contactModalOverlay.addEventListener('click', (event) => {
    if (event.target === contactModalOverlay) {
      closeContactModal();
    }
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    if (href.includes('#contact-form')) {
      const targetAttr = link.getAttribute('target');
      if (!targetAttr || targetAttr === '_self') {
        event.preventDefault();
        openContactModal();
      }
    }
  });
}

function initEquipmentTabs() {
  const container = document.querySelector('#equipment');
  if (!container) return;

  const tabs = Array.from(container.querySelectorAll('.equipment-tab'));
  const panels = Array.from(container.querySelectorAll('.equipment-panel'));

  if (!tabs.length || !panels.length) return;

  const activate = (targetId) => {
    panels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === targetId);
    });
    tabs.forEach((tab) => {
      const isTarget = tab.dataset.target === targetId;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', String(isTarget));
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activate(tab.dataset.target);
    });
    tab.addEventListener('keydown', (event) => {
      const index = tabs.indexOf(tab);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        tabs[(index + 1) % tabs.length]?.focus();
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        tabs[(index - 1 + tabs.length) % tabs.length]?.focus();
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate(tab.dataset.target);
      }
    });
  });

  const observer = window.matchMedia('(max-width: 768px)');
  const handleBreakpoint = (event) => {
    if (event.matches) {
      panels.forEach((panel) => panel.classList.add('active'));
    } else {
      activate(tabs.find((tab) => tab.classList.contains('active'))?.dataset.target || tabs[0].dataset.target);
    }
  };

  observer.addEventListener ? observer.addEventListener('change', handleBreakpoint) : observer.addListener(handleBreakpoint);
  handleBreakpoint(observer);
}
