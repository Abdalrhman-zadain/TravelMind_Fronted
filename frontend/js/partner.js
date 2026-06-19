const partnerForm = document.getElementById("partner-form");
const partnerLoginRequired = document.getElementById("partner-login-required");
const partnerAuthButton = document.getElementById("partner-auth-btn");
const partnerMessageEl = document.getElementById("partner-form-message");
const partnerSubmitButton = document.getElementById("partner-submit-btn");
const partnerType = new URLSearchParams(window.location.search).get("partnerType") || "business";
const partnerRequiredFieldIds = [
  "partner-company-name",
  "partner-contact-name",
  "partner-email",
  "partner-phone",
  "partner-city",
  "partner-services",
  "partner-message",
];

const partnerContentByType = {
  hotel: {
    heroTitle: "Apply to feature your hotel on TravelMind.",
    heroLead: "We review every new hotel before publishing it on the platform. Share your hotel details and we will follow up with the next steps.",
    formTitle: "Hotel partner application",
    formLead: "This sends your hotel details to the TravelMind team for review.",
    nameLabel: "Hotel name *",
    namePlaceholder: "Amman Skyline Hotel",
    servicesLabel: "Hotel highlights *",
    servicesPlaceholder: "Rooms, breakfast, pool, spa, airport shuttle",
    messageLabel: "Why should we feature your hotel? *",
    messagePlaceholder: "Tell us about your hotel, your guests, location, amenities, and what you want to offer on the platform.",
  },
  restaurant: {
    heroTitle: "Apply to feature your restaurant on TravelMind.",
    heroLead: "We review every new restaurant before publishing it on the platform. Share your restaurant details and we will follow up with the next steps.",
    formTitle: "Restaurant partner application",
    formLead: "This sends your restaurant details to the TravelMind team for review.",
    nameLabel: "Restaurant name *",
    namePlaceholder: "Amman Garden Restaurant",
    servicesLabel: "Restaurant highlights *",
    servicesPlaceholder: "Jordanian cuisine, rooftop seating, family dining, reservations",
    messageLabel: "Why should we feature your restaurant? *",
    messagePlaceholder: "Tell us about your restaurant, your cuisine, guests, location, and what you want to offer on the platform.",
  },
  company: {
    heroTitle: "Apply to feature your tour company on TravelMind.",
    heroLead: "We review every new partner before publishing them on the platform. Share your company details and we will follow up with the next steps.",
    formTitle: "Partner application",
    formLead: "This sends your details to the TravelMind admin team for review.",
    nameLabel: "Company name *",
    namePlaceholder: "Petra Horizon Tours",
    servicesLabel: "Services offered *",
    servicesPlaceholder: "Private tours, desert camps, airport transfers",
    messageLabel: "Why do you want to join TravelMind? *",
    messagePlaceholder: "Tell us about your company, target travelers, and what you want to offer on the platform.",
  },
  business: {
    heroTitle: "Apply to feature your business on TravelMind.",
    heroLead: "We review every new partner before publishing them on the platform. Share your details and we will follow up with the next steps.",
    formTitle: "Partner application",
    formLead: "This sends your details to the TravelMind admin team for review.",
    nameLabel: "Business name *",
    namePlaceholder: "Business name",
    servicesLabel: "Services offered *",
    servicesPlaceholder: "Describe what you offer",
    messageLabel: "Why do you want to join TravelMind? *",
    messagePlaceholder: "Tell us about your business, your guests, and what you want to offer on the platform.",
  },
};

function applyPartnerContent() {
  const content = partnerContentByType[partnerType] || partnerContentByType.business;
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText("partner-hero-title", content.heroTitle);
  setText("partner-hero-lead", content.heroLead);
  setText("partner-form-title", content.formTitle);
  setText("partner-form-lead", content.formLead);
  setText("partner-name-label", content.nameLabel);
  setText("partner-services-label", content.servicesLabel);
  setText("partner-message-label", content.messageLabel);

  const nameInput = document.getElementById("partner-company-name");
  const websiteInput = document.getElementById("partner-website");
  const servicesInput = document.getElementById("partner-services");
  const messageInput = document.getElementById("partner-message");

  if (nameInput) nameInput.placeholder = content.namePlaceholder;
  if (websiteInput) websiteInput.placeholder = "https://yourwebsite.com";
  if (servicesInput) servicesInput.placeholder = content.servicesPlaceholder;
  if (messageInput) messageInput.placeholder = content.messagePlaceholder;
}

function partnerAuthUrl() {
  const redirect = encodeURIComponent("partner-with-us.html");
  const context = encodeURIComponent("your partner application");
  return `auth.html?tab=register&redirect=${redirect}&context=${context}`;
}

function setPartnerMessage(type, message) {
  if (!partnerMessageEl) return;
  partnerMessageEl.className = `partner-inline-message ${type}`;
  partnerMessageEl.textContent = message;
  partnerMessageEl.hidden = false;
  partnerMessageEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hidePartnerMessage() {
  if (!partnerMessageEl) return;
  partnerMessageEl.hidden = true;
  partnerMessageEl.textContent = "";
  partnerMessageEl.className = "partner-inline-message";
}

function clearPartnerFieldErrors() {
  partnerRequiredFieldIds.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    field?.classList.remove("partner-field-error");
  });
}

function validatePartnerFields() {
  clearPartnerFieldErrors();

  const missingFields = partnerRequiredFieldIds
    .map((fieldId) => document.getElementById(fieldId))
    .filter((field) => field && !field.value.trim());

  missingFields.forEach((field) => field.classList.add("partner-field-error"));

  return missingFields;
}

function fillPartnerDefaults() {
  const currentUser = getUser();
  if (!currentUser) return;
  const contactName = document.getElementById("partner-contact-name");
  const email = document.getElementById("partner-email");
  if (contactName && !contactName.value) contactName.value = currentUser.name || "";
  if (email && !email.value) email.value = currentUser.email || "";
}

function setupPartnerView() {
  const loggedIn = isLoggedIn();
  if (partnerAuthButton) {
    partnerAuthButton.addEventListener("click", () => {
      location.href = partnerAuthUrl();
    });
  }

  if (!partnerForm || !partnerLoginRequired) return;

  partnerLoginRequired.hidden = loggedIn;
  partnerForm.hidden = !loggedIn;

  if (loggedIn) {
    fillPartnerDefaults();
  }

  partnerRequiredFieldIds.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    field?.addEventListener("input", () => {
      if (field.value.trim()) field.classList.remove("partner-field-error");
    });
  });
}

async function submitPartnerApplication(event) {
  event.preventDefault();
  hidePartnerMessage();

  const currentUser = getUser();
  if (!currentUser || !isLoggedIn()) {
    location.href = partnerAuthUrl();
    return;
  }

  const payload = {
    partnerType,
    companyName: document.getElementById("partner-company-name").value.trim(),
    contactName: document.getElementById("partner-contact-name").value.trim(),
    email: document.getElementById("partner-email").value.trim(),
    phone: document.getElementById("partner-phone").value.trim(),
    city: document.getElementById("partner-city").value.trim(),
    website: document.getElementById("partner-website").value.trim(),
    services: document.getElementById("partner-services").value.trim(),
    message: document.getElementById("partner-message").value.trim(),
  };

  const missingFields = validatePartnerFields();
  if (missingFields.length) {
    setPartnerMessage("error", "Please complete all required fields before sending your application.");
    showToast("Please complete all required fields.", "error");
    missingFields[0].scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => missingFields[0].focus(), 250);
    return;
  }

  partnerSubmitButton.disabled = true;
  partnerSubmitButton.textContent = "Sending...";

  try {
    const response = await PartnerApplicationsAPI.create(payload);
    setPartnerMessage("success", response.message || "Your application was sent successfully.");
    showToast("Partner application sent successfully.", "success");
    partnerForm.reset();
    clearPartnerFieldErrors();
    fillPartnerDefaults();
  } catch (error) {
    setPartnerMessage("error", error.message || "We could not send your application right now.");
    showToast(error.message || "We could not send your application right now.", "error");
  } finally {
    partnerSubmitButton.disabled = false;
    partnerSubmitButton.textContent = "Send Application";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyPartnerContent();
  setupPartnerView();
  partnerForm?.addEventListener("submit", submitPartnerApplication);
});
