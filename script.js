const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");

let headerScrolled = false;
let headerTicking = false;

const setHeaderState = () => {
  const shouldBeScrolled = headerScrolled ? window.scrollY > 8 : window.scrollY > 36;
  if (shouldBeScrolled !== headerScrolled) {
    headerScrolled = shouldBeScrolled;
    header.classList.toggle("is-scrolled", shouldBeScrolled);
  }
  headerTicking = false;
};

setHeaderState();
window.addEventListener("scroll", () => {
  if (!headerTicking) {
    headerTicking = true;
    requestAnimationFrame(setHeaderState);
  }
}, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  document.body.classList.toggle("nav-open", isOpen);
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("nav-open");
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.count);
      let start = 0;
      const duration = 900;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        start = Math.round(target * progress);
        element.textContent = start;
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      countObserver.unobserve(element);
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll("[data-count]").forEach((element) => {
  countObserver.observe(element);
});

const clearFormErrors = () => {
  form.querySelectorAll(".field-error").forEach((error) => error.remove());
  form.querySelectorAll(".has-error").forEach((label) => label.classList.remove("has-error"));
  formNote.classList.remove("success", "error");
};

const addFieldError = (field, message) => {
  const label = field.closest("label");
  if (!label) return;
  label.classList.add("has-error");
  const error = document.createElement("span");
  error.className = "field-error";
  error.textContent = message;
  label.appendChild(error);
};

const validateContactForm = () => {
  clearFormErrors();
  const data = new FormData(form);
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    company: form.elements.company,
    phone: form.elements.phone,
    requirement: form.elements.requirement,
    message: form.elements.message
  };
  let isValid = true;

  if (String(data.get("name") || "").trim().length < 2) {
    addFieldError(fields.name, "Please enter your full name.");
    isValid = false;
  }

  if (!fields.email.validity.valid) {
    addFieldError(fields.email, "Please enter a valid business email.");
    isValid = false;
  }

  if (String(data.get("company") || "").trim().length < 2) {
    addFieldError(fields.company, "Please enter your company name.");
    isValid = false;
  }

  if (data.get("phone") && !fields.phone.validity.valid) {
    addFieldError(fields.phone, "Please enter a valid phone number.");
    isValid = false;
  }

  if (!data.get("requirement")) {
    addFieldError(fields.requirement, "Please select a focus area.");
    isValid = false;
  }

  if (String(data.get("message") || "").trim().length < 10) {
    addFieldError(fields.message, "Please add a short requirement summary.");
    isValid = false;
  }

  return isValid;
};

form.noValidate = true;

form.addEventListener("input", (event) => {
  const label = event.target.closest("label");
  if (label) {
    label.classList.remove("has-error");
    label.querySelector(".field-error")?.remove();
  }
  formNote.classList.remove("error");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateContactForm()) {
    formNote.textContent = "Please correct the highlighted fields before sending.";
    formNote.classList.add("error");
    return;
  }

  formNote.textContent = "Thanks. Your enquiry is captured in this preview and ready to connect to email or CRM workflow.";
  formNote.classList.add("success");
  form.reset();
});
