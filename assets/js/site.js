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
