function checkoutById(id) {
  return document.getElementById(id);
}

function checkoutEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function checkoutMoney(value, currency = "JOD") {
  const amount = Number(value || 0);
  return `${Math.round(amount * 100) / 100} ${currency}`;
}

function getCheckoutPaymentMethod() {
  return document.querySelector('input[name="payment-method"]:checked')?.value || "Bank Card";
}

function resolvePaymentGateway(paymentMethod) {
  const method = String(paymentMethod || "").toLowerCase();
  if (method.includes("wallet")) {
    return { provider: "Digital Wallet Gateway", transactionPrefix: "WAL" };
  }
  if (method.includes("paypal")) {
    return { provider: "PayPal Gateway", transactionPrefix: "PPL" };
  }
  return { provider: "Card Payment Gateway", transactionPrefix: "CRD" };
}

function buildSummaryRows(draft) {
  const rows = [];
  if (draft.destination) rows.push(["Destination", draft.destination]);
  if (draft.bookingDate) rows.push(["Date", draft.bookingDate]);
  if (draft.startDate && draft.endDate) rows.push(["Dates", `${draft.startDate} to ${draft.endDate}`]);
  if (draft.reservationTime) rows.push(["Time", draft.reservationTime]);
  if (draft.travelersCount || draft.guests) rows.push(["Travelers", String(draft.travelersCount || draft.guests)]);
  if (draft.serviceName) rows.push(["Service", draft.serviceName]);
  if (draft.selectedAddOns?.length) rows.push(["Add-ons", draft.selectedAddOns.join(", ")]);
  return rows;
}

function renderCheckoutSummary(draft) {
  const emptyEl = checkoutById("checkout-empty");
  const summaryEl = checkoutById("checkout-summary");

  if (!draft) {
    emptyEl.classList.remove("hidden");
    summaryEl.classList.add("hidden");
    return;
  }

  emptyEl.classList.add("hidden");
  summaryEl.classList.remove("hidden");

  checkoutById("summary-image").src = draft.image || "image/city/petra-world-heritage-jordan_16x9.avif";
  checkoutById("summary-type").textContent = draft.itemType || "Travel experience";
  checkoutById("summary-title").textContent = draft.itemTitle || "Selected booking";
  checkoutById("summary-destination").textContent = draft.destination || "Jordan";

  checkoutById("summary-list").innerHTML = buildSummaryRows(draft)
    .map(([label, value]) => `<div class="summary-item"><span>${checkoutEsc(label)}</span><strong>${checkoutEsc(value)}</strong></div>`)
    .join("");

  const price = draft.priceBreakdown || {};
  const currency = price.currency || "JOD";
  checkoutById("price-base").textContent = checkoutMoney(price.base || 0, currency);
  checkoutById("price-taxes").textContent = checkoutMoney(price.taxes || 0, currency);
  checkoutById("price-fees").textContent = checkoutMoney(price.fees || 0, currency);
  checkoutById("price-addons").textContent = checkoutMoney(price.addOns || 0, currency);
  checkoutById("price-total").textContent = checkoutMoney(price.total || 0, currency);
}

function syncPaymentCards() {
  document.querySelectorAll(".payment-card").forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("active", !!input?.checked);
  });
}

function hydrateCheckoutForm(draft) {
  const user = getUser();
  const profile = typeof getBookingProfile === "function" ? getBookingProfile() : {};
  checkoutById("checkout-name").value = draft?.contact?.name || profile.name || user?.name || "";
  checkoutById("checkout-email").value = draft?.contact?.email || profile.email || user?.email || "";
  checkoutById("checkout-phone").value = draft?.contact?.phone || profile.phone || "";
  checkoutById("checkout-travelers").value = draft?.travelersCount || draft?.guests || 1;
  checkoutById("checkout-notes").value = draft?.notes || "";
}

async function finalizeCompanyBooking(draft, paymentMethod, contact) {
  if (!draft.companyId) return null;
  return api("POST", `/companies/${encodeURIComponent(draft.companyId)}/bookings`, {
    serviceType: draft.serviceType || draft.itemType || "experience",
    serviceId: draft.serviceId || draft.itemId || null,
    bookingDate: draft.bookingDate || draft.startDate || null,
    travelersCount: Number(draft.travelersCount || draft.guests || 1),
    customerName: contact.name,
    customerPhone: contact.phone,
    customerEmail: contact.email,
    specialRequests: draft.notes || "",
    paymentMethod,
  });
}

async function createCheckoutOrderRecord(draft, paymentMethod, contact) {
  if (typeof CheckoutOrdersAPI === "undefined") return null;
  return CheckoutOrdersAPI.create({
    userId: getUser()?.id || null,
    companyId: draft.companyId || null,
    guideId: draft.itemType === "Certified Guide" ? draft.itemId : (draft.guideId || null),
    orderType: draft.sourceType || draft.itemType || "experience",
    referenceId: draft.itemId || draft.serviceId || null,
    serviceName: draft.serviceName || draft.itemTitle || "Booking",
    destination: draft.destination || "Jordan",
    bookingDate: draft.bookingDate || null,
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    travelersCount: Number(draft.travelersCount || draft.guests || 1),
    addOns: Array.isArray(draft.selectedAddOns) ? draft.selectedAddOns : [],
    subtotal: Number(draft.priceBreakdown?.base || 0),
    taxes: Number(draft.priceBreakdown?.taxes || 0),
    fees: Number(draft.priceBreakdown?.fees || 0),
    total: Number(draft.priceBreakdown?.total || 0),
    currency: draft.priceBreakdown?.currency || "JOD",
    paymentMethod,
    orderStatus: "Paid",
    customerName: contact.name,
    customerEmail: contact.email,
    customerPhone: contact.phone,
    notes: draft.notes || "",
  });
}

async function createPaymentTransactionRecord(order, draft, paymentMethod) {
  if (!order || typeof PaymentTransactionsAPI === "undefined") return null;
  const gateway = resolvePaymentGateway(paymentMethod);
  return PaymentTransactionsAPI.create({
    checkoutOrderId: order.id,
    provider: gateway.provider,
    transactionRef: `${gateway.transactionPrefix}-${order.id}-${Date.now()}`,
    amount: Number(draft.priceBreakdown?.total || 0),
    currency: draft.priceBreakdown?.currency || "JOD",
    status: "Paid",
    paidAt: new Date().toISOString(),
  });
}

async function createGuideBookingRecord(draft, paymentMethod, contact) {
  if ((draft.sourceType !== "guide" && draft.itemType !== "Certified Guide") || typeof GuideBookingsAPI === "undefined") {
    return null;
  }
  return GuideBookingsAPI.create({
    guideId: draft.itemId,
    userId: getUser()?.id || null,
    attractionId: draft.attractionId || null,
    bookingDate: draft.bookingDate || new Date().toISOString(),
    travelersCount: Number(draft.travelersCount || 1),
    customerName: contact.name,
    customerPhone: contact.phone,
    customerEmail: contact.email,
    specialRequests: draft.notes || "",
    totalPrice: Number(draft.priceBreakdown?.total || 0),
    currency: draft.priceBreakdown?.currency || "JOD",
    paymentMethod,
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
  });
}

function storeCompletedBooking(draft, paymentMethod, contact) {
  if (typeof saveBookingProfile === "function") saveBookingProfile(contact);
  if (typeof saveBookingRecord !== "function") return null;
  return saveBookingRecord({
    type: draft.sourceType || draft.itemType || "experience",
    userId: getUser()?.id || 0,
    tripId: draft.tripId || "",
    itemId: draft.itemId || draft.serviceId || "",
    itemTitle: draft.itemTitle || draft.serviceName || "Booking",
    city: draft.destination || "Jordan",
    startDate: draft.startDate || draft.bookingDate || "",
    endDate: draft.endDate || "",
    reservationTime: draft.reservationTime || "",
    guests: Number(draft.travelersCount || draft.guests || 1),
    paymentMethod,
    total: Number(draft.priceBreakdown?.total || 0),
    contact,
    notes: draft.notes || "",
  });
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();
  const errorEl = checkoutById("checkout-error");
  const draft = getCheckoutDraft();

  if (!draft) {
    errorEl.textContent = "Your booking draft could not be found. Please start again from a tour, hotel, guide, or story.";
    errorEl.classList.remove("hidden");
    return;
  }

  const contact = {
    name: checkoutById("checkout-name").value.trim(),
    email: checkoutById("checkout-email").value.trim(),
    phone: checkoutById("checkout-phone").value.trim(),
  };
  const travelersCount = Number(checkoutById("checkout-travelers").value || 1);
  const paymentMethod = getCheckoutPaymentMethod();
  const notes = checkoutById("checkout-notes").value.trim();

  if (!contact.name || !contact.email || !contact.phone) {
    errorEl.textContent = "Please complete your full name, email address, and phone number.";
    errorEl.classList.remove("hidden");
    return;
  }

  errorEl.classList.add("hidden");
  const button = checkoutById("confirm-pay-btn");
  button.disabled = true;
  button.textContent = "Processing payment...";

  const payload = {
    ...draft,
    travelersCount,
    notes,
  };

  try {
    const order = await createCheckoutOrderRecord(payload, paymentMethod, contact);
    await createPaymentTransactionRecord(order, payload, paymentMethod);
    await createGuideBookingRecord(payload, paymentMethod, contact);
    await finalizeCompanyBooking(payload, paymentMethod, contact);
  } catch (_error) {
    // Fall back to local confirmation if backend booking is unavailable.
  }

  storeCompletedBooking(payload, paymentMethod, contact);
  clearCheckoutDraft();
  button.disabled = false;
  button.textContent = "Confirm & Pay";
  showToast(`Payment confirmed for ${payload.itemTitle || "your booking"}.`, "success");
  setTimeout(() => {
    location.href = "account.html";
  }, 800);
}

function initCheckoutPage() {
  if (!isLoggedIn()) {
    location.href = `auth.html?redirect=${encodeURIComponent("checkout.html")}&context=${encodeURIComponent("your booking")}`;
    return;
  }

  const draft = getCheckoutDraft();
  renderCheckoutSummary(draft);
  hydrateCheckoutForm(draft);
  syncPaymentCards();
  document.querySelectorAll('input[name="payment-method"]').forEach((input) => {
    input.addEventListener("change", syncPaymentCards);
  });
  checkoutById("checkout-form").addEventListener("submit", handleCheckoutSubmit);

  ["checkout-nav-home", "checkout-nav-trip-planner", "checkout-nav-stories"].forEach((id) => {
    const link = checkoutById(id);
    if (!link) return;
    link.addEventListener("click", () => {
      window.location.href = link.getAttribute("href");
    });
  });
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);
