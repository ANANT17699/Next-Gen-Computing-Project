/* ============================================================
   E-BLOOD BANK MANAGEMENT SYSTEM
   File: js/script.js
   Description: Main JS — shared across all pages
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. THEME MANAGER (Dark Mode)
══════════════════════════════════════════════════════════ */
const ThemeManager = {
  STORAGE_KEY: 'ebb-theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    this.apply(theme);

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.apply(e.matches ? 'dark' : 'light');
      }
    });
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.updateToggles(theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    showToast(`${next === 'dark' ? '🌙 Dark' : '☀️ Light'} mode enabled`, 'info');
  },

  updateToggles(theme) {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  }
};

/* ══════════════════════════════════════════════════════════
   2. NAVBAR
══════════════════════════════════════════════════════════ */
const Navbar = {
  init() {
    this.navbar = document.querySelector('.navbar');
    this.hamburger = document.querySelector('.hamburger');
    this.mobileNav = document.querySelector('.mobile-nav');
    this.mobileOverlay = document.querySelector('.mobile-nav-overlay');
    this._isOpen = false;

    if (!this.navbar) return;

    // Scroll shadow
    window.addEventListener('scroll', () => {
      this.navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Hamburger toggle
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this.toggleMobile());
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this._isOpen
        && !this.mobileNav?.contains(e.target)
        && !this.hamburger?.contains(e.target)) {
        this.closeMobile();
      }
    });

    // Active link
    this.setActiveLink();
  },

  toggleMobile() {
    this._isOpen ? this.closeMobile() : this.openMobile();
  },

  openMobile() {
    this._isOpen = true;
    this.mobileNav?.classList.add('open');
    this.hamburger?.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeMobile() {
    this._isOpen = false;
    this.mobileNav?.classList.remove('open');
    this.hamburger?.classList.remove('open');
    document.body.style.overflow = '';
  },

  setActiveLink() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href')?.split('/').pop();
      if (href === current) link.classList.add('active');
    });
  }
};

/* ══════════════════════════════════════════════════════════
   3. SIDEBAR (Dashboard + internal pages)
══════════════════════════════════════════════════════════ */
const Sidebar = {
  STORAGE_KEY: 'ebb-sidebar-open',

  init() {
    this.sidebar   = document.querySelector('.sidebar');
    this.overlay   = document.querySelector('.sidebar-overlay');
    this.toggleBtn = document.querySelector('.sidebar-toggle-btn');
    this.closeBtn  = document.querySelector('.sidebar-close');
    this.mainContent = document.querySelector('.main-content');

    if (!this.sidebar) return;

    // Default: open on desktop, closed on mobile
    const isMobile = window.innerWidth < 768;
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (isMobile) {
      this.close();
    } else {
      const shouldOpen = saved === null ? true : saved === 'true';
      shouldOpen ? this.open() : this.close();
    }

    // Toggle button
    this.toggleBtn?.addEventListener('click', () => this.toggle());
    this.closeBtn?.addEventListener('click',  () => this.close());

    // Overlay close
    this.overlay?.addEventListener('click', () => this.close());

    // Active link
    this.setActiveLink();

    // Responsive
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) this.close();
    });
  },

  open() {
    this.sidebar?.classList.remove('collapsed');
    this.mainContent?.classList.remove('expanded');
    if (window.innerWidth < 768) {
      this.overlay?.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  },

  close() {
    this.sidebar?.classList.add('collapsed');
    this.mainContent?.classList.add('expanded');
    this.overlay?.classList.remove('show');
    document.body.style.overflow = '';
  },

  toggle() {
    const isClosed = this.sidebar?.classList.contains('collapsed');
    isClosed ? this.open() : this.close();
    if (window.innerWidth >= 768) {
      localStorage.setItem(this.STORAGE_KEY, String(isClosed));
    }
  },

  setActiveLink() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href')?.split('/').pop();
      if (href === current) link.classList.add('active');
    });
  }
};

/* ══════════════════════════════════════════════════════════
   4. TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ══════════════════════════════════════════════════════════
   5. FORM VALIDATION
══════════════════════════════════════════════════════════ */
const FormValidator = {
  rules: {
    required: (val) => val.trim().length > 0,
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    phone: (val) => /^[+]?[\d\s\-()]{7,15}$/.test(val),
    minLength: (val, n) => val.trim().length >= n,
    maxLength: (val, n) => val.trim().length <= n,
    password: (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val),
    match: (val, selector) => {
      const other = document.querySelector(selector);
      return other ? val === other.value : false;
    }
  },

  messages: {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
    minLength: (n) => `Minimum ${n} characters required.`,
    maxLength: (n) => `Maximum ${n} characters allowed.`,
    password: 'Password must be 8+ characters with uppercase, lowercase, and a number.',
    match: 'Passwords do not match.'
  },

  validate(field) {
    const rules = field.dataset.validate?.split(' ') || [];
    let isValid = true;
    let message = '';

    for (const rule of rules) {
      const [name, param] = rule.split(':');
      const fn = this.rules[name];
      if (!fn) continue;

      const passed = fn(field.value, param);
      if (!passed) {
        isValid = false;
        const msg = this.messages[name];
        message = typeof msg === 'function' ? msg(param) : msg;
        break;
      }
    }

    this.setFieldState(field, isValid, message);
    return isValid;
  },

  setFieldState(field, isValid, message = '') {
    const group = field.closest('.form-group');
    if (!group) return;

    const errorEl = group.querySelector('.form-error');
    field.classList.toggle('error', !isValid);
    field.classList.toggle('success', isValid && field.value.trim().length > 0);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle('show', !isValid);
    }
  },

  bindForm(formEl) {
    if (!formEl) return;
    const fields = formEl.querySelectorAll('[data-validate]');

    // Blur validation
    fields.forEach(field => {
      field.addEventListener('blur', () => this.validate(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) this.validate(field);
      });
    });

    // Submit validation
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      let allValid = true;

      fields.forEach(field => {
        if (!this.validate(field)) allValid = false;
      });

      if (allValid) {
        const handler = formEl.dataset.onValid;
        if (handler && window[handler]) window[handler](formEl);
      } else {
        const firstError = formEl.querySelector('.form-control.error');
        firstError?.focus();
        showToast('Please fix the errors before submitting.', 'error');
      }
    });
  }
};

/* ══════════════════════════════════════════════════════════
   6. PASSWORD TOGGLE
══════════════════════════════════════════════════════════ */
function initPasswordToggles() {
  document.querySelectorAll('.input-action[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.togglePassword);
      if (!target) return;
      const isHidden = target.type === 'password';
      target.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? '🙈' : '👁️';
    });
  });
}

/* ══════════════════════════════════════════════════════════
   7. ROLE SELECTOR (Signup Page)
══════════════════════════════════════════════════════════ */
function initRoleSelector() {
  const cards = document.querySelectorAll('.role-card');
  const continueBtn = document.querySelector('#role-continue-btn');
  let selectedRole = null;

  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedRole = card.dataset.role;

      if (continueBtn) {
        continueBtn.removeAttribute('disabled');
        continueBtn.classList.remove('btn-ghost');
        continueBtn.classList.add('btn-primary');
      }
    });
  });

  continueBtn?.addEventListener('click', () => {
    if (!selectedRole) {
      showToast('Please select your role to continue.', 'warning');
      return;
    }
    const destinations = {
      donor:     'register-donor.html',
      requester: 'register-requester.html'
    };
    window.location.href = destinations[selectedRole] || '#';
  });
}

/* ══════════════════════════════════════════════════════════
   8. MULTI-STEP FORM
══════════════════════════════════════════════════════════ */
const MultiStepForm = {
  current: 0,
  steps: [],

  init(formEl) {
    if (!formEl) return;
    this.form = formEl;
    this.steps = Array.from(formEl.querySelectorAll('.form-step'));
    this.progressSteps = Array.from(document.querySelectorAll('.progress-step'));
    this.nextBtns = Array.from(formEl.querySelectorAll('.step-next'));
    this.prevBtns = Array.from(formEl.querySelectorAll('.step-prev'));

    if (!this.steps.length) return;

    this.showStep(0);

    this.nextBtns.forEach(btn => {
      btn.addEventListener('click', () => this.next());
    });

    this.prevBtns.forEach(btn => {
      btn.addEventListener('click', () => this.prev());
    });
  },

  showStep(index) {
    this.steps.forEach((step, i) => {
      step.classList.toggle('hidden', i !== index);
    });

    this.progressSteps.forEach((step, i) => {
      step.classList.remove('active', 'completed');
      if (i < index) step.classList.add('completed');
      if (i === index) step.classList.add('active');
    });

    this.current = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  next() {
    // Validate current step fields
    const currentStep = this.steps[this.current];
    const fields = currentStep.querySelectorAll('[data-validate]');
    let valid = true;

    fields.forEach(field => {
      if (!FormValidator.validate(field)) valid = false;
    });

    if (!valid) {
      showToast('Please fill all required fields correctly.', 'error');
      return;
    }

    if (this.current < this.steps.length - 1) {
      this.showStep(this.current + 1);
    }
  },

  prev() {
    if (this.current > 0) this.showStep(this.current - 1);
  }
};

/* ══════════════════════════════════════════════════════════
   9. SCROLL ANIMATIONS (Intersection Observer)
══════════════════════════════════════════════════════════ */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-fade-in-up, .animate-fade-in, .animate-scale-in').forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
}

/* ══════════════════════════════════════════════════════════
   10. COUNTER ANIMATION
══════════════════════════════════════════════════════════ */
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const startVal = 0;

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(startVal + (target - startVal) * ease);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const counterEls = document.querySelectorAll('[data-counter]');
  if (!counterEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.counter, 10);
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════════════════════
   11. BLOOD TYPE SELECTOR (Request Page)
══════════════════════════════════════════════════════════ */
function initBloodTypeSelector() {
  const options = document.querySelectorAll('.blood-type-option input[type="radio"]');
  options.forEach(input => {
    input.addEventListener('change', () => {
      const selected = input.value;
      // Can be used to update UI or fetch availability
      const display = document.querySelector('#selected-blood-type-display');
      if (display) display.textContent = selected;
    });
  });
}

/* ══════════════════════════════════════════════════════════
   12. SMOOTH SCROLL (for anchor links)
══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   13. LOGIN FORM HANDLER
══════════════════════════════════════════════════════════ */
function handleLoginSubmit(formEl) {
  const btn = formEl.querySelector('[type="submit"]');
  const originalHTML = btn.innerHTML;

  btn.innerHTML = '<span class="spinner"></span> Signing in…';
  btn.disabled = true;

  // Simulated delay — replace with fetch() after backend
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    showToast('Login feature requires backend. Frontend ready!', 'info');
  }, 1500);
}

/* ══════════════════════════════════════════════════════════
   14. REGISTER FORM HANDLER
══════════════════════════════════════════════════════════ */
function handleRegisterSubmit(formEl) {
  const btn = formEl.querySelector('[type="submit"]');
  const originalHTML = btn.innerHTML;

  btn.innerHTML = '<span class="spinner"></span> Registering…';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    showToast('Registration successful! (Backend required for real submission)', 'success');
  }, 1500);
}

/* ══════════════════════════════════════════════════════════
   15. CONTACT FORM HANDLER
══════════════════════════════════════════════════════════ */
function handleContactSubmit(formEl) {
  const btn = formEl.querySelector('[type="submit"]');
  const originalHTML = btn.innerHTML;

  btn.innerHTML = '<span class="spinner"></span> Sending…';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    formEl.reset();
    formEl.querySelectorAll('.form-control').forEach(f => {
      f.classList.remove('success', 'error');
    });
    showToast('Message sent successfully! We\'ll respond within 24 hours.', 'success');
  }, 1500);
}

/* ══════════════════════════════════════════════════════════
   16. REQUEST BLOOD FORM HANDLER
══════════════════════════════════════════════════════════ */
function handleBloodRequestSubmit(formEl) {
  const btn = formEl.querySelector('[type="submit"]');
  const originalHTML = btn.innerHTML;

  btn.innerHTML = '<span class="spinner"></span> Submitting…';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    showToast('Blood request submitted! (Requires backend)', 'success');
  }, 1500);
}

/* ══════════════════════════════════════════════════════════
   17. DASHBOARD — Tab Switching
══════════════════════════════════════════════════════════ */
function initTabs() {
  document.querySelectorAll('.tab-group').forEach(group => {
    const tabs   = group.querySelectorAll('.tab-btn');
    const panels = group.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.add('hidden'));

        tab.classList.add('active');
        const panel = group.querySelector(`.tab-panel[data-tab="${target}"]`);
        panel?.classList.remove('hidden');
      });
    });

    // Show first tab by default
    tabs[0]?.click();
  });
}

/* ══════════════════════════════════════════════════════════
   18. INITIALIZE ALL
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Core
  ThemeManager.init();
  Navbar.init();
  Sidebar.init();

  // Interactions
  initPasswordToggles();
  initRoleSelector();
  initScrollAnimations();
  initCounters();
  initBloodTypeSelector();
  initSmoothScroll();
  initTabs();

  // Form validation bindings (by page)
  FormValidator.bindForm(document.querySelector('#login-form'));
  FormValidator.bindForm(document.querySelector('#register-donor-form'));
  FormValidator.bindForm(document.querySelector('#register-requester-form'));
  FormValidator.bindForm(document.querySelector('#contact-form'));
  FormValidator.bindForm(document.querySelector('#blood-request-form'));

  // Multi-step forms
  MultiStepForm.init(document.querySelector('#register-donor-form'));
  MultiStepForm.init(document.querySelector('#register-requester-form'));
});

/* ══════════════════════════════════════════════════════════
   19. EXPOSE GLOBALS (for data-on-valid handlers)
══════════════════════════════════════════════════════════ */
window.handleLoginSubmit      = handleLoginSubmit;
window.handleRegisterSubmit   = handleRegisterSubmit;
window.handleContactSubmit    = handleContactSubmit;
window.handleBloodRequestSubmit = handleBloodRequestSubmit;
window.showToast              = showToast;
window.ThemeManager           = ThemeManager;
