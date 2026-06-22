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
  { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
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
  const label = field?.closest("label");
  if (!label) return;
  label.classList.add("has-error");
  const error = document.createElement("span");
  error.className = "field-error";
  error.textContent = message;
  label.appendChild(error);
};

const getFieldValue = (data, fieldName) => String(data.get(fieldName) || "").trim();

const validateContactForm = () => {
  clearFormErrors();
  const data = new FormData(form);
  const fields = {
    name: form.elements.name,
    email: form.elements.email,
    phone: form.elements.phone,
    message: form.elements.message
  };
  let isValid = true;

  if (getFieldValue(data, "name").length < 2) {
    addFieldError(fields.name, "Please enter your full name.");
    isValid = false;
  }

  if (!fields.email.validity.valid) {
    addFieldError(fields.email, "Please enter a valid business email.");
    isValid = false;
  }

  if (getFieldValue(data, "phone") && !fields.phone.validity.valid) {
    addFieldError(fields.phone, "Please enter a valid phone number.");
    isValid = false;
  }

  if (!getFieldValue(data, "message")) {
    addFieldError(fields.message, "Please add a short message.");
    isValid = false;
  }

  return isValid;
};

const setFormSubmitting = (isSubmitting) => {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;
  if (!submitButton.dataset.defaultText) {
    submitButton.dataset.defaultText = submitButton.textContent;
  }
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Sending..." : submitButton.dataset.defaultText;
};

const buildContactPayload = (data) => ({
  name: getFieldValue(data, "name"),
  email: getFieldValue(data, "email"),
  phone: getFieldValue(data, "phone"),
  company: getFieldValue(data, "company"),
  requirement: getFieldValue(data, "requirement"),
  message: getFieldValue(data, "message"),
  website: getFieldValue(data, "website")
});

form.noValidate = true;

form.addEventListener("input", (event) => {
  const label = event.target.closest("label");
  if (label) {
    label.classList.remove("has-error");
    label.querySelector(".field-error")?.remove();
  }
  formNote.classList.remove("success", "error");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateContactForm()) {
    formNote.textContent = "Please correct the highlighted fields before sending.";
    formNote.classList.add("error");
    return;
  }

  const endpoint = form.dataset.contactEndpoint || "/api/contact";
  const payload = buildContactPayload(new FormData(form));
  setFormSubmitting(true);
  formNote.textContent = "Sending your enquiry...";
  formNote.classList.remove("success", "error");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.ok === false) {
      throw new Error(result.error || "We could not send your enquiry. Please try again.");
    }

    formNote.textContent = "Thanks. Your enquiry has been sent. The team will get back to you shortly.";
    formNote.classList.add("success");
    form.reset();
  } catch (error) {
    formNote.textContent = error.message || "Something went wrong while sending. Please try again.";
    formNote.classList.add("error");
  } finally {
    setFormSubmitting(false);
  }
});
