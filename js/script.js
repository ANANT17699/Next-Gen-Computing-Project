/* ============================================================
   E-BLOOD BANK MANAGEMENT SYSTEM
   File: js/script.js
   Description: Main JS — shared across all pages
   ============================================================ */

"use strict";

/* ══════════════════════════════════════════════════════════
   0. USER MANAGER (Authentication & User Storage)
══════════════════════════════════════════════════════════ */
const UserManager = {
  USERS_STORAGE_KEY: "ebb-users",
  CURRENT_USER_KEY: "ebb-current-user",
  VERIFICATION_KEY: "ebb-verification-codes",

  // Generate a 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Send verification code (simulated - in real app, use backend email service)
  sendVerificationCode(email) {
    const code = this.generateVerificationCode();
    const codes = JSON.parse(
      localStorage.getItem(this.VERIFICATION_KEY) || "{}",
    );
    codes[email] = {
      code: code,
      timestamp: Date.now(),
      attempts: 0,
    };
    localStorage.setItem(this.VERIFICATION_KEY, JSON.stringify(codes));

    // Simulate sending email - show code in toast for demo
    showToast(
      `✉️ Verification code sent to ${email}\n(Demo: ${code})`,
      "info",
      5000,
    );
    console.log(`Verification code for ${email}: ${code}`);
    return code;
  },

  // Verify the code entered by user
  verifyCode(email, code) {
    const codes = JSON.parse(
      localStorage.getItem(this.VERIFICATION_KEY) || "{}",
    );
    const verif = codes[email];

    if (!verif) {
      showToast(
        "No verification code found. Please request a new one.",
        "error",
      );
      return false;
    }

    // Check if code expired (10 minutes)
    if (Date.now() - verif.timestamp > 10 * 60 * 1000) {
      delete codes[email];
      localStorage.setItem(this.VERIFICATION_KEY, JSON.stringify(codes));
      showToast(
        "Verification code expired. Please request a new one.",
        "error",
      );
      return false;
    }

    // Check attempts (max 3)
    if (verif.attempts >= 3) {
      delete codes[email];
      localStorage.setItem(this.VERIFICATION_KEY, JSON.stringify(codes));
      showToast(
        "Too many failed attempts. Please request a new code.",
        "error",
      );
      return false;
    }

    if (verif.code !== code) {
      verif.attempts++;
      localStorage.setItem(this.VERIFICATION_KEY, JSON.stringify(codes));
      showToast(
        `Invalid code. ${3 - verif.attempts} attempts remaining.`,
        "error",
      );
      return false;
    }

    // Code verified - remove it
    delete codes[email];
    localStorage.setItem(this.VERIFICATION_KEY, JSON.stringify(codes));
    return true;
  },

  // Register new user
  registerUser(userData) {
    const users = JSON.parse(
      localStorage.getItem(this.USERS_STORAGE_KEY) || "[]",
    );

    // Check if email already exists
    if (users.find((u) => u.email === userData.email)) {
      showToast(
        "Email already registered. Please use a different email or sign in.",
        "error",
      );
      return false;
    }

    const user = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password, // In production, this should be hashed
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      verified: true,
      createdAt: new Date().toISOString(),
      ...userData,
    };

    users.push(user);
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    showToast(
      `✅ Account created successfully! Welcome, ${user.firstName}!`,
      "success",
    );
    return true;
  },

  // Login user
  login(email, password) {
    const users = JSON.parse(
      localStorage.getItem(this.USERS_STORAGE_KEY) || "[]",
    );
    const user = users.find((u) => u.email === email);

    if (!user) {
      showToast("Email not found. Please sign up first.", "error");
      return null;
    }

    if (user.password !== password) {
      showToast("Incorrect password. Please try again.", "error");
      return null;
    }

    // Set current user
    localStorage.setItem(
      this.CURRENT_USER_KEY,
      JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        bloodType: user.blood_type || user.bloodType || "N/A",
      }),
    );

    showToast(`✅ Welcome back, ${user.firstName}!`, "success");
    return user;
  },

  // Get current logged-in user
  getCurrentUser() {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Logout user
  logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    showToast("Signed out successfully.", "info");
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  // Redirect to login if not authenticated
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  },
};

/* ══════════════════════════════════════════════════════════
   1. THEME MANAGER (Dark Mode)
══════════════════════════════════════════════════════════ */
const ThemeManager = {
  STORAGE_KEY: "ebb-theme",

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    this.apply(theme);

    // Listen for system changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.apply(e.matches ? "dark" : "light");
        }
      });
  },

  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.updateToggles(theme);
  },

  toggle() {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    this.apply(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    showToast(
      `${next === "dark" ? "🌙 Dark" : "☀️ Light"} mode enabled`,
      "info",
    );
  },

  updateToggles(theme) {
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.innerHTML = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute(
        "aria-label",
        `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
      );
      btn.setAttribute(
        "title",
        `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
      );
    });
  },
};

/* ══════════════════════════════════════════════════════════
   2. NAVBAR
══════════════════════════════════════════════════════════ */
const Navbar = {
  init() {
    this.navbar = document.querySelector(".navbar");
    this.hamburger = document.querySelector(".hamburger");
    this.mobileNav = document.querySelector(".mobile-nav");
    this.mobileOverlay = document.querySelector(".mobile-nav-overlay");
    this._isOpen = false;

    if (!this.navbar) return;

    // Scroll shadow
    window.addEventListener(
      "scroll",
      () => {
        this.navbar.classList.toggle("scrolled", window.scrollY > 10);
      },
      { passive: true },
    );

    // Hamburger toggle
    if (this.hamburger) {
      this.hamburger.addEventListener("click", () => this.toggleMobile());
    }

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        this._isOpen &&
        !this.mobileNav?.contains(e.target) &&
        !this.hamburger?.contains(e.target)
      ) {
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
    this.mobileNav?.classList.add("open");
    this.hamburger?.classList.add("open");
    document.body.style.overflow = "hidden";
  },

  closeMobile() {
    this._isOpen = false;
    this.mobileNav?.classList.remove("open");
    this.hamburger?.classList.remove("open");
    document.body.style.overflow = "";
  },

  setActiveLink() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link").forEach((link) => {
      const href = link.getAttribute("href")?.split("/").pop();
      if (href === current) link.classList.add("active");
    });
  },
};

/* ══════════════════════════════════════════════════════════
   3. SIDEBAR (Dashboard + internal pages)
══════════════════════════════════════════════════════════ */
const Sidebar = {
  STORAGE_KEY: "ebb-sidebar-open",

  init() {
    this.sidebar = document.querySelector(".sidebar");
    this.overlay = document.querySelector(".sidebar-overlay");
    this.toggleBtn = document.querySelector(".sidebar-toggle-btn");
    this.closeBtn = document.querySelector(".sidebar-close");
    this.mainContent = document.querySelector(".main-content");

    if (!this.sidebar) return;

    // Default: open on desktop, closed on mobile
    const isMobile = window.innerWidth < 768;
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (isMobile) {
      this.close();
    } else {
      const shouldOpen = saved === null ? true : saved === "true";
      shouldOpen ? this.open() : this.close();
    }

    // Toggle button
    this.toggleBtn?.addEventListener("click", () => this.toggle());
    this.closeBtn?.addEventListener("click", () => this.close());

    // Overlay close
    this.overlay?.addEventListener("click", () => this.close());

    // Active link
    this.setActiveLink();

    // Responsive
    window.addEventListener("resize", () => {
      if (window.innerWidth < 768) this.close();
    });
  },

  open() {
    this.sidebar?.classList.remove("collapsed");
    this.mainContent?.classList.remove("expanded");
    if (window.innerWidth < 768) {
      this.overlay?.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  },

  close() {
    this.sidebar?.classList.add("collapsed");
    this.mainContent?.classList.add("expanded");
    this.overlay?.classList.remove("show");
    document.body.style.overflow = "";
  },

  toggle() {
    const isClosed = this.sidebar?.classList.contains("collapsed");
    isClosed ? this.open() : this.close();
    if (window.innerWidth >= 768) {
      localStorage.setItem(this.STORAGE_KEY, String(isClosed));
    }
  },

  setActiveLink() {
    const current = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      const href = link.getAttribute("href")?.split("/").pop();
      if (href === current) link.classList.add("active");
    });
  },
};

/* ══════════════════════════════════════════════════════════
   4. TOAST NOTIFICATIONS
══════════════════════════════════════════════════════════ */
function showToast(message, type = "info", duration = 3500) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove());
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
    },
  },

  messages: {
    required: "This field is required.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid phone number.",
    minLength: (n) => `Minimum ${n} characters required.`,
    maxLength: (n) => `Maximum ${n} characters allowed.`,
    password:
      "Password must be 8+ characters with uppercase, lowercase, and a number.",
    match: "Passwords do not match.",
  },

  validate(field) {
    const rules = field.dataset.validate?.split(" ") || [];
    let isValid = true;
    let message = "";

    for (const rule of rules) {
      const [name, param] = rule.split(":");
      const fn = this.rules[name];
      if (!fn) continue;

      const passed = fn(field.value, param);
      if (!passed) {
        isValid = false;
        const msg = this.messages[name];
        message = typeof msg === "function" ? msg(param) : msg;
        break;
      }
    }

    this.setFieldState(field, isValid, message);
    return isValid;
  },

  setFieldState(field, isValid, message = "") {
    const group = field.closest(".form-group");
    if (!group) return;

    const errorEl = group.querySelector(".form-error");
    field.classList.toggle("error", !isValid);
    field.classList.toggle("success", isValid && field.value.trim().length > 0);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.toggle("show", !isValid);
    }
  },

  bindForm(formEl) {
    if (!formEl) return;
    const fields = formEl.querySelectorAll("[data-validate]");

    // Blur validation
    fields.forEach((field) => {
      field.addEventListener("blur", () => this.validate(field));
      field.addEventListener("input", () => {
        if (field.classList.contains("error")) this.validate(field);
      });
    });

    // Submit validation
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      let allValid = true;

      fields.forEach((field) => {
        if (!this.validate(field)) allValid = false;
      });

      if (allValid) {
        const handler = formEl.dataset.onValid;
        if (handler && window[handler]) window[handler](formEl);
      } else {
        const firstError = formEl.querySelector(".form-control.error");
        firstError?.focus();
        showToast("Please fix the errors before submitting.", "error");
      }
    });
  },
};

/* ══════════════════════════════════════════════════════════
   6. PASSWORD TOGGLE
══════════════════════════════════════════════════════════ */
function initPasswordToggles() {
  document
    .querySelectorAll(".input-action[data-toggle-password]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.querySelector(btn.dataset.togglePassword);
        if (!target) return;
        const isHidden = target.type === "password";
        target.type = isHidden ? "text" : "password";
        btn.textContent = isHidden ? "🙈" : "👁️";
      });
    });
}

/* ══════════════════════════════════════════════════════════
   7. ROLE SELECTOR (Signup Page)
══════════════════════════════════════════════════════════ */
function initRoleSelector() {
  const cards = document.querySelectorAll(".role-card");
  const continueBtn = document.querySelector("#role-continue-btn");
  let selectedRole = null;

  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedRole = card.dataset.role;

      if (continueBtn) {
        continueBtn.removeAttribute("disabled");
        continueBtn.classList.remove("btn-ghost");
        continueBtn.classList.add("btn-primary");
      }
    });
  });

  continueBtn?.addEventListener("click", () => {
    if (!selectedRole) {
      showToast("Please select your role to continue.", "warning");
      return;
    }
    const destinations = {
      donor: "register-donor.html",
      requester: "register-requester.html",
    };
    window.location.href = destinations[selectedRole] || "#";
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
    this.steps = Array.from(formEl.querySelectorAll(".form-step"));
    this.progressSteps = Array.from(
      document.querySelectorAll(".progress-step"),
    );
    this.nextBtns = Array.from(formEl.querySelectorAll(".step-next"));
    this.prevBtns = Array.from(formEl.querySelectorAll(".step-prev"));

    if (!this.steps.length) return;

    this.showStep(0);

    this.nextBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.next());
    });

    this.prevBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.prev());
    });
  },

  showStep(index) {
    this.steps.forEach((step, i) => {
      step.classList.toggle("hidden", i !== index);
    });

    this.progressSteps.forEach((step, i) => {
      step.classList.remove("active", "completed");
      if (i < index) step.classList.add("completed");
      if (i === index) step.classList.add("active");
    });

    this.current = index;
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  next() {
    // Validate current step fields
    const currentStep = this.steps[this.current];
    const fields = currentStep.querySelectorAll("[data-validate]");
    let valid = true;

    fields.forEach((field) => {
      if (!FormValidator.validate(field)) valid = false;
    });

    if (!valid) {
      showToast("Please fill all required fields correctly.", "error");
      return;
    }

    if (this.current < this.steps.length - 1) {
      this.showStep(this.current + 1);
    }
  },

  prev() {
    if (this.current > 0) this.showStep(this.current - 1);
  },
};

/* ══════════════════════════════════════════════════════════
   9. SCROLL ANIMATIONS (Intersection Observer)
══════════════════════════════════════════════════════════ */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = "running";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );

  document
    .querySelectorAll(
      ".animate-fade-in-up, .animate-fade-in, .animate-scale-in",
    )
    .forEach((el) => {
      el.style.animationPlayState = "paused";
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
  const counterEls = document.querySelectorAll("[data-counter]");
  if (!counterEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.dataset.counter, 10);
          animateCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  counterEls.forEach((el) => observer.observe(el));
}

/* ══════════════════════════════════════════════════════════
   11. BLOOD TYPE SELECTOR (Request Page)
══════════════════════════════════════════════════════════ */
function initBloodTypeSelector() {
  const options = document.querySelectorAll(
    '.blood-type-option input[type="radio"]',
  );
  options.forEach((input) => {
    input.addEventListener("change", () => {
      const selected = input.value;
      // Can be used to update UI or fetch availability
      const display = document.querySelector("#selected-blood-type-display");
      if (display) display.textContent = selected;
    });
  });
}

/* ══════════════════════════════════════════════════════════
   12. SMOOTH SCROLL (for anchor links)
══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   13. LOGIN FORM HANDLER
══════════════════════════════════════════════════════════ */
function handleLoginSubmit(formEl) {
  const btn = formEl.querySelector('[type="submit"]');
  const originalHTML = btn.innerHTML;
  const email = formEl.querySelector('[name="email"]').value.trim();
  const password = formEl.querySelector('[name="password"]').value;

  btn.innerHTML = '<span class="spinner"></span> Signing in…';
  btn.disabled = true;

  setTimeout(() => {
    // Check if verification is pending
    if (sessionStorage.getItem("ebb-pending-verification") === email) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      showToast("Please verify your email first.", "warning");
      window.location.href = `login.html?verify=${email}`;
      return;
    }

    const user = UserManager.login(email, password);
    btn.innerHTML = originalHTML;
    btn.disabled = false;

    if (user) {
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    }
  }, 1000);
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
    try {
      // Collect form data
      const formData = new FormData(formEl);
      const userData = {
        firstName: formData.get("first_name"),
        lastName: formData.get("last_name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: sessionStorage.getItem("ebb-selected-role") || "donor",
        dob: formData.get("dob"),
        gender: formData.get("gender"),
        phone: formData.get("phone"),
        city: formData.get("city"),
        address: formData.get("address"),
        blood_type: formData.get("blood_type"),
        weight: formData.get("weight"),
        total_donations: formData.get("total_donations") || 0,
        notifications: formData.get("notify_sms") ? true : false,
      };

      // Register user
      const success = UserManager.registerUser(userData);

      btn.innerHTML = originalHTML;
      btn.disabled = false;

      if (success) {
        // Auto-login after registration
        UserManager.login(userData.email, userData.password);

        setTimeout(() => {
          sessionStorage.removeItem("ebb-selected-role");
          window.location.href = "dashboard.html";
        }, 1500);
      }
    } catch (error) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      showToast("Registration failed. Please try again.", "error");
      console.error("Registration error:", error);
    }
  }, 1000);
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
    formEl.querySelectorAll(".form-control").forEach((f) => {
      f.classList.remove("success", "error");
    });
    showToast(
      "Message sent successfully! We'll respond within 24 hours.",
      "success",
    );
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
    showToast("Blood request submitted! (Requires backend)", "success");
  }, 1500);
}

/* ══════════════════════════════════════════════════════════
   17. DASHBOARD — Tab Switching
══════════════════════════════════════════════════════════ */
function initTabs() {
  document.querySelectorAll(".tab-group").forEach((group) => {
    const tabs = group.querySelectorAll(".tab-btn");
    const panels = group.querySelectorAll(".tab-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        tabs.forEach((t) => t.classList.remove("active"));
        panels.forEach((p) => p.classList.add("hidden"));

        tab.classList.add("active");
        const panel = group.querySelector(`.tab-panel[data-tab="${target}"]`);
        panel?.classList.remove("hidden");
      });
    });

    // Show first tab by default
    tabs[0]?.click();
  });
}

/* ══════════════════════════════════════════════════════════
   17. EMAIL VERIFICATION (Signup)
══════════════════════════════════════════════════════════ */
function initEmailVerification() {
  const verificationContainers = document.querySelectorAll(
    '[id*="email-verification-section"]',
  );
  if (!verificationContainers.length) return;

  verificationContainers.forEach((verificationContainer) => {
    const sendCodeBtn = verificationContainer.querySelector(
      '[id*="send-verification"]',
    );
    const verifyBtn = verificationContainer.querySelector(
      '[id*="verify-code-btn"]',
    );
    const codeInput = verificationContainer.querySelector(
      '[id*="verification-code"]',
    );
    const resendBtn = verificationContainer.querySelector('[id*="resend"]');

    // Find the email input - search for any email input in the form
    const form = verificationContainer.closest("form");
    const emailInput = form ? form.querySelector('input[type="email"]') : null;

    if (!emailInput) return;

    // Create a "Send Code" button if not showing verification section by default
    if (sendCodeBtn) {
      sendCodeBtn.addEventListener("click", () => {
        const email = emailInput.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showToast("Please enter a valid email address first.", "warning");
          return;
        }

        // Mark email as pending verification
        sessionStorage.setItem("ebb-pending-email", email);
        UserManager.sendVerificationCode(email);
        verificationContainer.classList.remove("hidden");
        emailInput.disabled = true;
        if (sendCodeBtn) sendCodeBtn.disabled = true;
      });
    }

    // Verify button
    if (verifyBtn) {
      verifyBtn.addEventListener("click", () => {
        const code = codeInput?.value.trim();
        const email =
          sessionStorage.getItem("ebb-pending-email") ||
          emailInput.value.trim();

        if (!code || code.length !== 6) {
          showToast("Please enter a 6-digit verification code.", "error");
          return;
        }

        if (UserManager.verifyCode(email, code)) {
          showToast("✅ Email verified successfully!", "success");
          sessionStorage.removeItem("ebb-pending-email");
          verificationContainer.classList.add("hidden");
          // Continue to next step in form
          const nextBtn = form?.querySelector(".step-next");
          nextBtn?.click();
        }
      });
    }

    // Resend button
    if (resendBtn) {
      resendBtn.addEventListener("click", () => {
        const email =
          sessionStorage.getItem("ebb-pending-email") ||
          emailInput.value.trim();
        if (email) {
          UserManager.sendVerificationCode(email);
        }
      });
    }

    // Trigger verification on email blur if needed
    emailInput.addEventListener("blur", () => {
      if (
        emailInput.value.trim() &&
        !verificationContainer.classList.contains("hidden")
      ) {
        // Already showing verification, don't do anything
        return;
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════
   17B. LOGIN EMAIL VERIFICATION
══════════════════════════════════════════════════════════ */
function initLoginVerification() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("verify");

  if (email) {
    // Show verification modal
    const modal = document.getElementById("login-verification-modal");
    if (modal) {
      modal.classList.remove("hidden");
      UserManager.sendVerificationCode(email);
      sessionStorage.setItem("ebb-pending-login-verify", email);

      const verifyBtn = document.getElementById("login-verify-btn");
      const codeInput = document.getElementById("login-verification-code");

      if (verifyBtn) {
        verifyBtn.addEventListener("click", () => {
          const code = codeInput?.value.trim();
          if (UserManager.verifyCode(email, code)) {
            modal.classList.add("hidden");
            sessionStorage.removeItem("ebb-pending-login-verify");
            // Continue with login
            const loginForm = document.getElementById("login-form");
            if (loginForm) {
              // Form should now proceed normally
              showToast("Email verified! You can now sign in.", "success");
            }
          }
        });
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════
   17C. DASHBOARD USER INFO
══════════════════════════════════════════════════════════ */
function initDashboardUser() {
  // Only run on dashboard
  const pageTitleEl = document.querySelector(".page-title");
  if (!pageTitleEl) return;

  const user = UserManager.getCurrentUser();

  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = "login.html";
    return;
  }

  // Update page title
  const firstName = user.firstName || user.email.split("@")[0];
  pageTitleEl.textContent = `Good morning, ${firstName} 👋`;

  // Update sidebar user info
  const sidebarName = document.querySelector(".sidebar-user-name");
  const sidebarRole = document.querySelector(".sidebar-user-role");
  const avatarEls = document.querySelectorAll(
    '.avatar, [data-tooltip*="John Doe"]',
  );

  if (sidebarName) {
    sidebarName.textContent = user.fullName || user.email;
  }

  if (sidebarRole) {
    const roleText = user.role === "donor" ? "Blood Donor" : "Blood Requester";
    const bloodType = user.bloodType || "N/A";
    sidebarRole.textContent = `${roleText} · ${bloodType}`;
  }

  // Update avatars (initials)
  const initials =
    `${user.firstName?.[0] || "U"}${user.lastName?.[0] || "S"}`.toUpperCase();
  avatarEls.forEach((avatar) => {
    avatar.textContent = initials;
    avatar.setAttribute("data-tooltip", `${user.fullName} — ${user.role}`);
  });

  // Update navbar avatar tooltip
  const navbarAvatar = document.querySelector(".navbar-actions .avatar");
  if (navbarAvatar) {
    navbarAvatar.setAttribute("title", `${user.fullName} — ${user.role}`);
    navbarAvatar.setAttribute(
      "data-tooltip",
      `${user.fullName} — ${user.role}`,
    );
  }

  // Add logout functionality
  const logoutLinks = document.querySelectorAll(
    'a[href="#logout"], .sidebar-footer a',
  );
  logoutLinks.forEach((link) => {
    if (
      link.textContent.includes("Sign Out") ||
      link.textContent.includes("Logout")
    ) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        UserManager.logout();
        setTimeout(() => {
          window.location.href = "login.html";
        }, 800);
      });
    }
  });
}

/* ══════════════════════════════════════════════════════════
   17D. ROLE SELECTOR - STORE SELECTED ROLE
══════════════════════════════════════════════════════════ */
const initRoleSelectorOld = initRoleSelector;
function initRoleSelector() {
  const cards = document.querySelectorAll(".role-card");
  const continueBtn = document.querySelector("#role-continue-btn");
  let selectedRole = null;

  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedRole = card.dataset.role;
      sessionStorage.setItem("ebb-selected-role", selectedRole);

      if (continueBtn) {
        continueBtn.removeAttribute("disabled");
        continueBtn.classList.remove("btn-ghost");
        continueBtn.classList.add("btn-primary");
      }
    });
  });

  continueBtn?.addEventListener("click", () => {
    if (!selectedRole) {
      showToast("Please select your role to continue.", "warning");
      return;
    }
    const destinations = {
      donor: "register-donor.html",
      requester: "register-requester.html",
    };
    window.location.href = destinations[selectedRole] || "#";
  });
}

/* ══════════════════════════════════════════════════════════
   18. INITIALIZE ALL
══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
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
  initEmailVerification();
  initLoginVerification();
  initDashboardUser();

  // Form validation bindings (by page)
  FormValidator.bindForm(document.querySelector("#login-form"));
  FormValidator.bindForm(document.querySelector("#register-donor-form"));
  FormValidator.bindForm(document.querySelector("#register-requester-form"));
  FormValidator.bindForm(document.querySelector("#contact-form"));
  FormValidator.bindForm(document.querySelector("#blood-request-form"));

  // Multi-step forms
  MultiStepForm.init(document.querySelector("#register-donor-form"));
  MultiStepForm.init(document.querySelector("#register-requester-form"));
});

/* ══════════════════════════════════════════════════════════
   19. EXPOSE GLOBALS (for data-on-valid handlers)
══════════════════════════════════════════════════════════ */
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.handleContactSubmit = handleContactSubmit;
window.handleBloodRequestSubmit = handleBloodRequestSubmit;
window.showToast = showToast;
window.ThemeManager = ThemeManager;
window.UserManager = UserManager;
