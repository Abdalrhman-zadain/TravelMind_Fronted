const dashboardState = {
  mode: "full",
  persona: "owner",
  companies: [],
  bookings: [],
  users: [],
  attractions: [],
  hotels: [],
  restaurants: [],
  selectedCompanyId: null,
  reportRows: [],
  ownerAnalytics: null,
  adminAnalytics: null,
  notifications: [],
};

const dashboardColors = ["#225966", "#b45309", "#4f772d", "#9333ea", "#0f766e"];

function dgById(id) {
  return document.getElementById(id);
}

function dashboardExists() {
  return Boolean(dgById("metric-grid"));
}

function getDashboardMode() {
  return document.querySelector("[data-dashboard-mode]")?.dataset.dashboardMode || "full";
}

function dgEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function currency(value) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} JOD`;
}

function todayString(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(value, start, end) {
  const date = parseDate(value);
  if (!date) return false;
  const startDate = start ? parseDate(start) : null;
  const endDate = end ? parseDate(end) : null;
  if (startDate && date < startDate) return false;
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    if (date > endDate) return false;
  }
  return true;
}

function allServices() {
  return dashboardState.companies.flatMap((company) => [
    ...(company.tours || []).map((tour) => ({ ...tour, companyId: company.id, companyName: company.name, kind: "tour" })),
    ...(company.packages || []).map((pkg) => ({ ...pkg, companyId: company.id, companyName: company.name, kind: "package" })),
  ]);
}

function currentFilteredBookings() {
  const start = dgById("range-start").value;
  const end = dgById("range-end").value;
  const selectedCompanyId = Number(dgById("company-select").value || 0);

  return dashboardState.bookings.filter((booking) => {
    if (!inRange(booking.createdAt || booking.bookingDate, start, end)) return false;
    if (dashboardState.persona === "owner" && selectedCompanyId && Number(booking.companyId) !== selectedCompanyId) return false;
    return true;
  });
}

function renderMetrics() {
  const companyId = Number(dgById("company-select").value || 0);
  const filteredBookings = currentFilteredBookings();
  const selectedCompany = dashboardState.companies.find((company) => Number(company.id) === companyId) || dashboardState.companies[0];
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

  let metrics = [];
  if (dashboardState.persona === "owner") {
    const analytics = dashboardState.ownerAnalytics;
    metrics = [
      ["Total Bookings", analytics?.totalBookings ?? filteredBookings.length],
      ["Total Revenue", currency(analytics?.totalRevenue ?? totalRevenue)],
      ["Active Tours", analytics?.activeTours ?? (selectedCompany?.tours || []).filter((tour) => tour.active !== false).length],
      ["Active Packages", analytics?.activePackages ?? (selectedCompany?.packages || []).filter((pkg) => pkg.active !== false).length],
      ["Customer Ratings", `${Number((analytics?.customerRatings ?? selectedCompany?.rating) || 0).toFixed(1)} / 5`],
      ["Recent Bookings", analytics?.recentBookings?.length ?? filteredBookings.slice(0, 5).length],
    ];
  } else {
    const analytics = dashboardState.adminAnalytics;
    const mostPopularDestination = analytics?.mostPopularDestinations?.[0]?.name || "N/A";
    const topCompany = analytics?.topPerformingCompanies?.[0]?.name || "N/A";

    metrics = [
      ["Total Users", analytics?.totalUsers ?? dashboardState.users.length],
      ["Total Companies", analytics?.totalCompanies ?? dashboardState.companies.length],
      ["Total Bookings", analytics?.totalBookings ?? filteredBookings.length],
      ["Total Revenue", currency(analytics?.totalRevenue ?? totalRevenue)],
      ["Popular Destination", mostPopularDestination],
      ["Most Booked Tour", analytics?.mostBookedTours?.[0]?.name || popularServices(filteredBookings)[0]?.name || "N/A"],
      ["Top Company", topCompany],
    ];
  }

  dgById("metric-grid").innerHTML = metrics
    .map(
      ([label, value]) => `
        <article class="metric-card">
          <span>${dgEsc(label)}</span>
          <strong>${dgEsc(value)}</strong>
        </article>`
    )
    .join("");
}

function renderWebsiteTotals() {
  const totalsCard = dgById("website-totals-card");
  const totalsShell = dgById("website-totals");
  if (!totalsCard || !totalsShell) return;

  const showTotals = dashboardState.persona === "admin";
  totalsCard.style.display = showTotals ? "block" : "none";
  if (!showTotals) return;

  const rows = [
    ["Registered Users", dashboardState.adminAnalytics?.totalUsers ?? dashboardState.users.length],
    ["Companies", dashboardState.adminAnalytics?.totalCompanies ?? dashboardState.companies.length],
    ["Attractions", dashboardState.attractions.length],
    ["Hotels", dashboardState.hotels.length],
    ["Restaurants", dashboardState.restaurants.length],
  ];

  totalsShell.innerHTML = rows
    .map(
      ([label, value]) => `
        <article class="total-item-card">
          <span>${dgEsc(label)}</span>
          <strong>${dgEsc(value)}</strong>
        </article>`
    )
    .join("");
}

function bookingsByMonth(bookings) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleString("en", { month: "short" }),
      revenue: 0,
    };
  });

  const map = new Map(months.map((item) => [item.key, item]));
  bookings.forEach((booking) => {
    const date = parseDate(booking.createdAt || booking.bookingDate);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (map.has(key)) map.get(key).revenue += Number(booking.totalPrice || 0);
  });
  return months;
}

function bookingsByDay(bookings) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return {
      key: date.toISOString().split("T")[0],
      label: date.toLocaleString("en", { weekday: "short" }),
      count: 0,
    };
  });
  const map = new Map(days.map((item) => [item.key, item]));
  bookings.forEach((booking) => {
    const key = String(booking.createdAt || booking.bookingDate || "").split("T")[0];
    if (map.has(key)) map.get(key).count += 1;
  });
  return days;
}

function popularServices(bookings) {
  const counter = new Map();
  bookings.forEach((booking) => {
    const service = findServiceByBooking(booking);
    const name = service?.title || booking.serviceType || "General booking";
    counter.set(name, (counter.get(name) || 0) + 1);
  });
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function topCompanies(bookings) {
  const revenueMap = new Map();
  bookings.forEach((booking) => {
    const company = dashboardState.companies.find((item) => Number(item.id) === Number(booking.companyId));
    if (!company) return;
    revenueMap.set(company.name, (revenueMap.get(company.name) || 0) + Number(booking.totalPrice || 0));
  });
  return [...revenueMap.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function statusDistribution(bookings) {
  const counts = new Map();
  bookings.forEach((booking) => {
    const key = booking.bookingStatus || "Pending";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].map(([label, value], index) => ({
    label,
    value,
    color: dashboardColors[index % dashboardColors.length],
  }));
}

function renderLineChart(svgId, data, valueKey) {
  const svg = dgById(svgId);
  const width = 640;
  const height = 260;
  const padding = 28;
  const max = Math.max(1, ...data.map((item) => Number(item[valueKey] || 0)));
  const stepX = (width - padding * 2) / Math.max(1, data.length - 1);
  const points = data.map((item, index) => {
    const x = padding + index * stepX;
    const y = height - padding - ((Number(item[valueKey] || 0) / max) * (height - padding * 2));
    return { x, y, label: item.label, value: item[valueKey] };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  svg.innerHTML = `
    <line class="chart-axis" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
    <path class="chart-line" d="${path}"></path>
    ${points
      .map(
        (point) => `
          <circle class="line-dot" cx="${point.x}" cy="${point.y}" r="5"></circle>
          <text class="chart-label" x="${point.x}" y="${height - 8}" text-anchor="middle">${dgEsc(point.label)}</text>
          <text class="chart-label" x="${point.x}" y="${point.y - 12}" text-anchor="middle">${Math.round(Number(point.value || 0))}</text>`
      )
      .join("")}
  `;
}

function renderBarChart(svgId, data, valueKey, useSecondary = false) {
  const svg = dgById(svgId);
  const width = 640;
  const height = 260;
  const padding = 28;
  const gap = 18;
  const max = Math.max(1, ...data.map((item) => Number(item[valueKey] || 0)));
  const barWidth = (width - padding * 2 - gap * (Math.max(data.length - 1, 0))) / Math.max(data.length, 1);

  svg.innerHTML = `
    <line class="chart-axis" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
    ${data
      .map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const barHeight = (value / max) * (height - padding * 2);
        const x = padding + index * (barWidth + gap);
        const y = height - padding - barHeight;
        return `
          <rect class="chart-bar ${useSecondary ? "secondary" : ""}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"></rect>
          <text class="chart-label" x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle">${dgEsc(item.label)}</text>
          <text class="chart-label" x="${x + barWidth / 2}" y="${y - 10}" text-anchor="middle">${Math.round(value)}</text>`;
      })
      .join("")}
  `;
}

function renderPieChart(items) {
  const svg = dgById("status-chart");
  const legend = dgById("status-legend");
  const total = Math.max(1, items.reduce((sum, item) => sum + Number(item.value || 0), 0));
  const radius = 90;
  const center = 130;
  let angle = -Math.PI / 2;

  const slices = items
    .map((item) => {
      const arc = (Number(item.value || 0) / total) * Math.PI * 2;
      const startX = center + Math.cos(angle) * radius;
      const startY = center + Math.sin(angle) * radius;
      angle += arc;
      const endX = center + Math.cos(angle) * radius;
      const endY = center + Math.sin(angle) * radius;
      const largeArcFlag = arc > Math.PI ? 1 : 0;
      return `<path d="M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z" fill="${item.color}"></path>`;
    })
    .join("");

  svg.innerHTML = `${slices}<circle cx="${center}" cy="${center}" r="46" fill="#fff"></circle><text class="chart-label" x="${center}" y="${center - 4}" text-anchor="middle">Bookings</text><text class="chart-label" x="${center}" y="${center + 18}" text-anchor="middle">${total}</text>`;
  legend.innerHTML = items
    .map(
      (item) => `
        <div class="legend-row">
          <div><span class="legend-color" style="background:${item.color}"></span>${dgEsc(item.label)}</div>
          <strong>${item.value}</strong>
        </div>`
    )
    .join("");
}

function renderRecentBookings(bookings) {
  const rows = bookings.slice(0, 8);
  dgById("recent-bookings").innerHTML = `
    <table class="dashboard-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Company</th>
          <th>Service</th>
          <th>Status</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((booking) => {
            const company = dashboardState.companies.find((item) => Number(item.id) === Number(booking.companyId));
            const service = findServiceByBooking(booking);
            return `
              <tr>
                <td>${dgEsc(booking.customerName)}</td>
                <td>${dgEsc(company?.name || "Unknown")}</td>
                <td>${dgEsc(service?.title || booking.serviceType || "Booking")}</td>
                <td>${dgEsc(booking.bookingStatus || "Pending")}</td>
                <td>${dgEsc(currency(booking.totalPrice || 0))}</td>
              </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function buildNotifications(bookings) {
  const latestBooking = bookings[0];
  const latestReviewCompany = [...dashboardState.companies].sort((a, b) => Number(b.reviewsCount || 0) - Number(a.reviewsCount || 0))[0];
  const topService = popularServices(bookings)[0];
  const activeOffer = dashboardState.companies.find((company) => company.specialOffer?.active);
  return [
    latestBooking && {
      title: "New booking received",
      message: `${latestBooking.customerName} booked ${findServiceByBooking(latestBooking)?.title || latestBooking.serviceType || "a service"}.`,
      timestamp: latestBooking.createdAt || latestBooking.bookingDate,
      unread: true,
    },
    latestReviewCompany && {
      title: "New review submitted",
      message: `${latestReviewCompany.name} is currently leading with ${latestReviewCompany.reviewsCount} reviews.`,
      timestamp: new Date().toISOString(),
      unread: false,
    },
    topService && {
      title: "Tour reaching full capacity",
      message: `${topService.name} is one of the most-booked services this period.`,
      timestamp: new Date().toISOString(),
      unread: true,
    },
    activeOffer && {
      title: "Offer expiration reminder",
      message: `${activeOffer.name} still has an active ${activeOffer.specialOffer?.discountPercentage || 10}% offer running.`,
      timestamp: new Date().toISOString(),
      unread: false,
    },
  ].filter(Boolean);
}

function renderNotifications(bookings) {
  const source = dashboardState.notifications.length ? dashboardState.notifications : buildNotifications(bookings);
  dgById("dashboard-notifications").innerHTML = source
    .map(
      (item) => `
        <article class="notification-card ${item.unread || item.isRead === false ? "unread" : ""}" ${item.id ? `data-notification-id="${item.id}"` : ""}>
          <div class="notification-card-head">
            <strong>${dgEsc(item.title)}</strong>
            <span class="notification-time">${dgEsc(new Date(item.timestamp || item.createdAt).toLocaleString())}</span>
          </div>
          <p>${dgEsc(item.message)}</p>
          <div class="notification-meta">${item.unread || item.isRead === false ? "Unread" : "Read"}</div>
        </article>`
    )
    .join("");

  dgById("dashboard-notifications").querySelectorAll("[data-notification-id]").forEach((card) => {
    card.addEventListener("click", async () => {
      const id = card.getAttribute("data-notification-id");
      if (!id || !window.DashboardNotificationsAPI?.markRead) return;
      try {
        await DashboardNotificationsAPI.markRead(id, true);
        card.classList.remove("unread");
        const meta = card.querySelector(".notification-meta");
        if (meta) meta.textContent = "Read";
      } catch (_error) {
        // ignore mark-read issues
      }
    });
  });
}

function renderSnapshot(bookings) {
  const popular = popularServices(bookings);
  const topByRevenue = topCompanies(bookings);
  const items = [
    topByRevenue[0] && `Top performing company: ${topByRevenue[0].name}`,
    popular[0] && `Most booked tour: ${popular[0].name}`,
    dashboardState.companies[0] && `Highest rated company: ${dashboardState.companies.slice().sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0].name}`,
  ].filter(Boolean);

  dgById("snapshot-list").innerHTML = items
    .map(
      (text, index) => `
        <div class="snapshot-item">
          <strong>Insight ${index + 1}</strong>
          <span>${dgEsc(text)}</span>
        </div>`
    )
    .join("");
}

function findServiceByBooking(booking) {
  const company = dashboardState.companies.find((item) => Number(item.id) === Number(booking.companyId));
  if (!company) return null;
  const services = [
    ...(company.tours || []),
    ...(company.packages || []),
    ...(company.transportServices || []),
  ];
  return services.find((item) => Number(item.id) === Number(booking.serviceId));
}

function renderCharts() {
  const bookings = currentFilteredBookings();
  renderLineChart("revenue-chart", bookingsByMonth(bookings), "revenue");
  renderBarChart("bookings-chart", bookingsByDay(bookings), "count");

  const popularitySource =
    dashboardState.persona === "admin"
      ? topCompanies(bookings).map((item) => ({ label: item.name.slice(0, 12), count: item.revenue }))
      : popularServices(bookings).map((item) => ({ label: item.name.slice(0, 12), count: item.count }));
  renderBarChart("popularity-chart", popularitySource, "count", true);
  renderPieChart(statusDistribution(bookings));
}

function populateSelect(selectId, items, labelKey, valueKey, allLabel) {
  const select = dgById(selectId);
  select.innerHTML = `<option value="">${dgEsc(allLabel)}</option>${items
    .map((item) => `<option value="${dgEsc(item[valueKey])}">${dgEsc(item[labelKey])}</option>`)
    .join("")}`;
}

function populateFilters() {
  populateSelect("company-select", dashboardState.companies, "name", "id", "All companies");
  populateSelect("report-company-filter", dashboardState.companies, "name", "id", "All companies");

  const destinationRows = [...new Set(dashboardState.companies.map((company) => company.city).filter(Boolean))].map((city) => ({ name: city, value: city }));
  populateSelect("report-destination-filter", destinationRows, "name", "value", "All destinations");

  const tours = allServices().filter((item) => item.kind === "tour");
  const packages = allServices().filter((item) => item.kind === "package");
  populateSelect("report-tour-filter", tours, "title", "id", "All tours");
  populateSelect("report-package-filter", packages, "title", "id", "All packages");

  if (dashboardState.companies[0]) {
    dgById("company-select").value = String(dashboardState.companies[0].id);
  }
}

function generateReportRows() {
  const destination = dgById("report-destination-filter").value;
  const tourId = dgById("report-tour-filter").value;
  const packageId = dgById("report-package-filter").value;
  const companyId = dgById("report-company-filter").value;
  const start = dgById("range-start").value;
  const end = dgById("range-end").value;

  dashboardState.reportRows = currentFilteredBookings()
    .filter((booking) => {
      const company = dashboardState.companies.find((item) => Number(item.id) === Number(booking.companyId));
      const service = findServiceByBooking(booking);
      if (!inRange(booking.createdAt || booking.bookingDate, start, end)) return false;
      if (destination && company?.city !== destination) return false;
      if (companyId && String(booking.companyId) !== String(companyId)) return false;
      if (tourId && String(service?.id) !== String(tourId)) return false;
      if (packageId && String(service?.id) !== String(packageId)) return false;
      return true;
    })
    .map((booking) => {
      const company = dashboardState.companies.find((item) => Number(item.id) === Number(booking.companyId));
      const service = findServiceByBooking(booking);
      return {
        date: String(booking.createdAt || booking.bookingDate || "").split("T")[0],
        destination: company?.city || "Jordan",
        company: company?.name || "Unknown",
        service: service?.title || booking.serviceType || "Booking",
        status: booking.bookingStatus || "Pending",
        total: Number(booking.totalPrice || 0),
      };
    });
  renderReportResults();
  renderReportSummary();
  if (typeof showToast === "function") {
    showToast(
      dashboardState.reportRows.length
        ? `Report generated with ${dashboardState.reportRows.length} booking${dashboardState.reportRows.length === 1 ? "" : "s"}.`
        : "Report generated. No bookings matched the selected filters.",
      "info"
    );
  }
}

function renderReportResults() {
  const rows = dashboardState.reportRows;
  dgById("report-results").innerHTML = `
    <table class="dashboard-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Destination</th>
          <th>Company</th>
          <th>Service</th>
          <th>Status</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows
                .map(
                  (row) => `
                    <tr>
                      <td>${dgEsc(row.date)}</td>
                      <td>${dgEsc(row.destination)}</td>
                      <td>${dgEsc(row.company)}</td>
                      <td>${dgEsc(row.service)}</td>
                      <td>${dgEsc(row.status)}</td>
                      <td>${dgEsc(currency(row.total))}</td>
                    </tr>`
                )
                .join("")
            : '<tr><td colspan="6">No bookings match the report filters.</td></tr>'
        }
      </tbody>
    </table>
  `;
}

function renderReportSummary() {
  const summary = dgById("report-summary");
  if (!summary) return;
  const totalBookings = dashboardState.reportRows.length;
  const totalRevenue = dashboardState.reportRows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  summary.textContent = totalBookings
    ? `Report ready: ${totalBookings} booking${totalBookings === 1 ? "" : "s"} · ${currency(totalRevenue)} total`
    : "Report ready: 0 bookings match the selected filters.";
}

function exportReportAsCsv() {
  const rows = dashboardState.reportRows;
  const lines = [
    ["Date", "Destination", "Company", "Service", "Status", "Total"],
    ...rows.map((row) => [row.date, row.destination, row.company, row.service, row.status, row.total]),
  ];
  const csv = lines.map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "travelmind-booking-report.xls";
  link.click();
  URL.revokeObjectURL(href);
}

function exportReportAsPdf() {
  const popup = window.open("", "_blank", "width=1080,height=720");
  if (!popup) {
    showToast("Allow popups to export the PDF view.", "error");
    return;
  }
  popup.document.write(`
    <html>
      <head>
        <title>TravelMind Booking Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #17323b; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d7dfe3; padding: 10px; text-align: left; }
          th { background: #f4f7f8; }
        </style>
      </head>
      <body>
        <h1>TravelMind Booking Report</h1>
        ${dgById("report-results").innerHTML}
      </body>
    </html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

function syncPersonaUi() {
  const isAdminOnly = dashboardState.mode === "admin-only";
  const companyShell = dgById("company-select-shell");
  const personaShell = dgById("persona-field-shell");
  const heroActions = dgById("dashboard-hero-actions");
  const personaSelect = dgById("persona-select");

  if (personaShell) {
    personaShell.style.display = isAdminOnly ? "none" : "grid";
  }

  if (heroActions) {
    heroActions.style.display = isAdminOnly ? "none" : "flex";
  }

  if (companyShell) {
    companyShell.style.display = dashboardState.persona === "owner" && !isAdminOnly ? "grid" : "none";
  }

  if (personaSelect) {
    personaSelect.disabled = isAdminOnly;
  }
}

async function fetchDashboardBackedData() {
  const companyId = Number(dgById("company-select").value || dashboardState.companies[0]?.id || 0);
  const params = { from: dgById("range-start").value, to: dgById("range-end").value };
  dashboardState.ownerAnalytics = null;
  dashboardState.adminAnalytics = null;
  dashboardState.notifications = [];

  if (dashboardState.persona === "owner" && companyId && window.AnalyticsAPI?.getOwner) {
    try {
      dashboardState.ownerAnalytics = await AnalyticsAPI.getOwner(companyId, params);
    } catch (_error) {
      dashboardState.ownerAnalytics = null;
    }
    try {
      dashboardState.notifications = await DashboardNotificationsAPI.getAll({ companyId, role: "owner" });
    } catch (_error) {
      dashboardState.notifications = [];
    }
    return;
  }

  if (dashboardState.persona === "admin" && window.AnalyticsAPI?.getAdmin) {
    try {
      dashboardState.adminAnalytics = await AnalyticsAPI.getAdmin(params);
    } catch (_error) {
      dashboardState.adminAnalytics = null;
    }
    try {
      dashboardState.notifications = await DashboardNotificationsAPI.getAll({ role: "admin", userId: getUser()?.id || "" });
    } catch (_error) {
      dashboardState.notifications = [];
    }
  }
}

async function renderDashboard() {
  if (dashboardState.mode === "admin-only") {
    dashboardState.persona = "admin";
    dgById("persona-select").value = "admin";
  }

  await fetchDashboardBackedData();
  syncPersonaUi();
  renderMetrics();
  renderWebsiteTotals();
  renderCharts();
  const bookings = currentFilteredBookings();
  renderRecentBookings(bookings);
  renderNotifications(bookings);
  renderSnapshot(bookings);
  generateReportRows();
}

function bindEvents() {
  document.querySelectorAll("[data-persona]").forEach((button) => {
    button.addEventListener("click", () => {
      dashboardState.persona = button.getAttribute("data-persona");
      dgById("persona-select").value = dashboardState.persona;
      renderDashboard();
    });
  });

  ["persona-select", "company-select", "range-start", "range-end"].forEach((id) => {
    dgById(id).addEventListener("change", (event) => {
      if (id === "persona-select") dashboardState.persona = event.target.value;
      renderDashboard();
    });
  });

  dgById("apply-report-filters-btn").addEventListener("click", generateReportRows);
  dgById("export-report-excel-btn").addEventListener("click", exportReportAsCsv);
  dgById("export-report-pdf-btn").addEventListener("click", exportReportAsPdf);
}

async function initDashboard() {
  if (!dashboardExists()) {
    return;
  }

  dashboardState.mode = getDashboardMode();
  if (dashboardState.mode === "admin-only") {
    dashboardState.persona = "admin";
  }

  dgById("range-start").value = todayString(-30);
  dgById("range-end").value = todayString(0);
  dgById("persona-select").value = dashboardState.persona;

  const [companies, bookings, users, attractions, hotels, restaurants] = await Promise.all([
    CompaniesAPI.getAll().catch(() => []),
    BookingsAPI.getAll().catch(() => []),
    UsersAPI.getAll().catch(() => []),
    AttractionsAPI.getAll().catch(() => []),
    HotelsAPI.getAll().catch(() => []),
    RestaurantsAPI.getAll().catch(() => []),
  ]);

  dashboardState.companies = companies || [];
  dashboardState.bookings = (bookings || []).map((booking) => ({
    ...booking,
    totalPrice: Number(booking.totalPrice || 0),
  }));
  dashboardState.users = users || [];
  dashboardState.attractions = attractions || [];
  dashboardState.hotels = hotels || [];
  dashboardState.restaurants = restaurants || [];

  populateFilters();
  bindEvents();
  await renderDashboard();
}

document.addEventListener("DOMContentLoaded", initDashboard);
