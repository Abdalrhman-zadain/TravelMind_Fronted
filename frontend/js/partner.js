const partnerForm = document.getElementById("partner-form");
const partnerLoginRequired = document.getElementById("partner-login-required");
const partnerAuthButton = document.getElementById("partner-auth-btn");
const partnerMessageEl = document.getElementById("partner-form-message");
const partnerSubmitButton = document.getElementById("partner-submit-btn");
const partnerRequiredFieldIds = [
  "partner-company-name",
  "partner-contact-name",
  "partner-email",
  "partner-phone",
  "partner-city",
  "partner-services",
  "partner-message",
];

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
  setupPartnerView();
  partnerForm?.addEventListener("submit", submitPartnerApplication);
});
