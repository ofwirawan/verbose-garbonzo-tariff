// Global variables
let countries = [];
let currentCalculation = null;
let trendsChart = null;
let countriesChart = null;

// API Base URL
const API_BASE = "/api/v1/tariff";

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  console.log("TARIFF Application Loaded");

  // Set default date to today
  document.getElementById("tradeDate").value = new Date()
    .toISOString()
    .split("T")[0];

  // Load countries and initialize app
  loadCountries();

  // Show calculator page by default
  showPage("calculator");

  // Bind form submission
  document
    .getElementById("tariff-form")
    .addEventListener("submit", handleTariffCalculation);
});

// Navigation functions
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll(".page-content").forEach((page) => {
    page.classList.add("hidden");
  });

  // Show selected page
  document.getElementById(pageId + "-page").classList.remove("hidden");

  // Update navigation active state
  document.querySelectorAll(".nav-link, .nav-link-mobile").forEach((link) => {
    link.classList.remove("bg-gray-700", "text-white");
    link.classList.add("text-gray-300");
  });

  // Set active nav item
  const activeNavItems = document.querySelectorAll(
    `[onclick="showPage('${pageId}')"]`
  );
  activeNavItems.forEach((item) => {
    item.classList.remove("text-gray-300");
    item.classList.add("bg-gray-700", "text-white");
  });

  // Close mobile menu
  document.getElementById("mobile-menu").classList.add("hidden");

  // Load page-specific data
  if (pageId === "history") {
    loadHistory();
  } else if (pageId === "analytics") {
    loadAnalytics();
  }
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenu.classList.toggle("hidden");
}

// Load countries from API
async function loadCountries() {
  try {
    // Show loading indicators
    showCountriesLoading();

    const response = await fetch(`${API_BASE}/countries`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    countries = await response.json();

    // Populate country dropdowns
    populateCountryDropdowns();

    console.log(`Loaded ${countries.length} countries`);

    // Show success indicators
    showCountriesLoaded();
  } catch (error) {
    console.error("Error loading countries:", error);
    showCountriesError();
    showError("Failed to load countries. Please refresh the page.");
  }
}

function populateCountryDropdowns() {
  const exportingSelect = document.getElementById("exportingCountry");
  const importingSelect = document.getElementById("importingCountry");

  // Clear existing options and enable dropdowns
  exportingSelect.innerHTML =
    '<option value="" style="color: #000;">Select exporting country</option>';
  importingSelect.innerHTML =
    '<option value="" style="color: #000;">Select importing country</option>';

  exportingSelect.disabled = false;
  importingSelect.disabled = false;

  // Add country options using createElement for better compatibility
  countries.forEach((country) => {
    console.log("Processing country:", country); // Debug log

    // Create option for exporting country
    const option1 = document.createElement("option");
    option1.value = country.iso3Code;
    option1.textContent = country.name;
    option1.innerText = country.name; // Fallback for older browsers
    option1.style.color = "#000"; // Ensure text is visible
    option1.style.backgroundColor = "#fff";
    exportingSelect.appendChild(option1);

    // Create option for importing country
    const option2 = document.createElement("option");
    option2.value = country.iso3Code;
    option2.textContent = country.name;
    option2.innerText = country.name; // Fallback for older browsers
    option2.style.color = "#000"; // Ensure text is visible
    option2.style.backgroundColor = "#fff";
    importingSelect.appendChild(option2);
  });

  // Ensure select elements have proper styling
  exportingSelect.style.color = "#000";
  exportingSelect.style.backgroundColor = "#fff";
  importingSelect.style.color = "#000";
  importingSelect.style.backgroundColor = "#fff";

  // Log for debugging
  console.log("Countries populated:", countries.length, "countries");
  console.log("Exporting select options:", exportingSelect.options.length);
  console.log("Importing select options:", importingSelect.options.length);

  // Sample the first few countries for debugging
  if (countries.length > 0) {
    console.log(
      "Sample countries:",
      countries.slice(0, 3).map((c) => `${c.name} (${c.iso3Code})`)
    );
  }
}

function showCountriesLoading() {
  // Show loading indicators
  document.getElementById("exporting-loading").classList.remove("hidden");
  document.getElementById("importing-loading").classList.remove("hidden");

  // Hide loaded indicators
  document.getElementById("exporting-loaded").classList.add("hidden");
  document.getElementById("importing-loaded").classList.add("hidden");

  // Keep dropdowns disabled with loading message
  const exportingSelect = document.getElementById("exportingCountry");
  const importingSelect = document.getElementById("importingCountry");
  exportingSelect.innerHTML = '<option value="">Loading countries...</option>';
  importingSelect.innerHTML = '<option value="">Loading countries...</option>';
  exportingSelect.disabled = true;
  importingSelect.disabled = true;
}

function showCountriesLoaded() {
  // Hide loading indicators
  document.getElementById("exporting-loading").classList.add("hidden");
  document.getElementById("importing-loading").classList.add("hidden");

  // Show loaded indicators with count
  document.getElementById("exporting-loaded").classList.remove("hidden");
  document.getElementById("importing-loaded").classList.remove("hidden");
  document.getElementById("country-count-1").textContent = countries.length;
  document.getElementById("country-count-2").textContent = countries.length;

  // Hide the loaded message after 3 seconds
  setTimeout(() => {
    document.getElementById("exporting-loaded").classList.add("hidden");
    document.getElementById("importing-loaded").classList.add("hidden");
  }, 3000);
}

function showCountriesError() {
  // Hide loading indicators
  document.getElementById("exporting-loading").classList.add("hidden");
  document.getElementById("importing-loading").classList.add("hidden");

  // Show error in dropdowns
  const exportingSelect = document.getElementById("exportingCountry");
  const importingSelect = document.getElementById("importingCountry");
  exportingSelect.innerHTML =
    '<option value="">Error loading countries - Please refresh</option>';
  importingSelect.innerHTML =
    '<option value="">Error loading countries - Please refresh</option>';
  exportingSelect.disabled = true;
  importingSelect.disabled = true;
}

// Handle tariff calculation form submission
async function handleTariffCalculation(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const calculationRequest = {
    productDescription: formData.get("productDescription"),
    exportingCountry: formData.get("exportingCountry"),
    importingCountry: formData.get("importingCountry"),
    tradeValue: parseFloat(formData.get("tradeValue")),
    tradeDate: formData.get("tradeDate"),
  };

  // Validate form
  if (
    !calculationRequest.productDescription ||
    !calculationRequest.exportingCountry ||
    !calculationRequest.importingCountry ||
    !calculationRequest.tradeValue ||
    !calculationRequest.tradeDate
  ) {
    showError("Please fill in all required fields.");
    return;
  }

  // Show loading state
  showLoading(true);

  try {
    const response = await fetch(`${API_BASE}/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calculationRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    currentCalculation = result;

    // Display results
    displayCalculationResults(result);
  } catch (error) {
    console.error("Error calculating tariff:", error);
    showError("Failed to calculate tariff. Please try again.");
  } finally {
    showLoading(false);
  }
}

function displayCalculationResults(result) {
  const resultsDiv = document.getElementById("calculation-results");
  const contentDiv = document.getElementById("results-content");

  const exportingCountryName =
    countries.find((c) => c.iso3Code === result.exportingCountry)?.name ||
    result.exportingCountry;
  const importingCountryName =
    countries.find((c) => c.iso3Code === result.importingCountry)?.name ||
    result.importingCountry;

  contentDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 bg-white rounded border">
                    <span class="font-medium text-gray-700">Trade Route:</span>
                    <span class="text-gray-900">${exportingCountryName} → ${importingCountryName}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-white rounded border">
                    <span class="font-medium text-gray-700">Trade Value:</span>
                    <span class="font-mono text-gray-900">$${parseFloat(
                      result.tradeValue
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}</span>
                </div>
            </div>
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                    <span class="font-medium text-blue-700">Tariff Rate:</span>
                    <span class="font-bold text-blue-900">${parseFloat(
                      result.tariffRate
                    ).toFixed(2)}%</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                    <span class="font-medium text-green-700">Tariff Cost:</span>
                    <span class="font-bold text-green-900 text-lg">$${parseFloat(
                      result.tariffCost
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded border">
                    <span class="font-medium text-gray-700">Total Cost:</span>
                    <span class="font-bold text-gray-900 text-lg">$${(
                      parseFloat(result.tradeValue) +
                      parseFloat(result.tariffCost)
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}</span>
                </div>
            </div>
        </div>
        ${
          result.productDescription
            ? `
        <div class="mt-4 p-3 bg-gray-50 rounded border">
            <span class="font-medium text-gray-700">Product: </span>
            <span class="text-gray-900">${result.productDescription}</span>
        </div>
        `
            : ""
        }
    `;

  resultsDiv.classList.remove("hidden");
  resultsDiv.scrollIntoView({ behavior: "smooth" });
}

// Save calculation to history
async function saveCalculation() {
  if (!currentCalculation) {
    showError("No calculation to save.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentCalculation),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    showSuccess("Calculation saved to history!");

    // Clear current calculation
    currentCalculation = null;

    // Reset form and hide results
    document.getElementById("tariff-form").reset();
    document.getElementById("tradeDate").value = new Date()
      .toISOString()
      .split("T")[0];
    document.getElementById("calculation-results").classList.add("hidden");
  } catch (error) {
    console.error("Error saving calculation:", error);
    showError("Failed to save calculation. Please try again.");
  }
}

// Load calculation history
async function loadHistory() {
  const loadingDiv = document.getElementById("history-loading");
  const contentDiv = document.getElementById("history-content");
  const emptyDiv = document.getElementById("history-empty");

  // Show loading
  loadingDiv.classList.remove("hidden");
  contentDiv.classList.add("hidden");
  emptyDiv.classList.add("hidden");

  try {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const history = await response.json();

    if (history.length === 0) {
      emptyDiv.classList.remove("hidden");
    } else {
      populateHistoryTable(history);
      contentDiv.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Error loading history:", error);
    showError("Failed to load calculation history.");
    emptyDiv.classList.remove("hidden");
  } finally {
    loadingDiv.classList.add("hidden");
  }
}

function populateHistoryTable(history) {
  const tbody = document.getElementById("history-table-body");
  tbody.innerHTML = "";

  history.forEach((calc) => {
    const exportingCountryName =
      countries.find((c) => c.iso3Code === calc.exportingCountry)?.name ||
      calc.exportingCountry;
    const importingCountryName =
      countries.find((c) => c.iso3Code === calc.importingCountry)?.name ||
      calc.importingCountry;

    const row = tbody.insertRow();
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${new Date(calc.tradeDate).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${calc.productDescription || "-"}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${exportingCountryName} → ${importingCountryName}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $${parseFloat(calc.tradeValue).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${parseFloat(calc.tariffRate).toFixed(2)}%
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                $${parseFloat(calc.tariffCost).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
            </td>
        `;
  });
}

// Load analytics data
async function loadAnalytics() {
  try {
    const response = await fetch(`${API_BASE}/analytics`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const analytics = await response.json();

    // Update statistics cards
    document.getElementById("stat-total-calculations").textContent =
      analytics.totalCalculations || 0;
    document.getElementById("stat-avg-tariff-rate").textContent =
      analytics.averageTariffRate
        ? analytics.averageTariffRate.toFixed(2) + "%"
        : "0%";
    document.getElementById("stat-unique-countries").textContent =
      analytics.uniqueCountries || 0;
    document.getElementById("stat-unique-products").textContent =
      analytics.uniqueProducts || 0;

    // Update charts
    updateTrendsChart(analytics.tariffTrends || []);
    updateCountriesChart(analytics.countryComparisons || []);
  } catch (error) {
    console.error("Error loading analytics:", error);
    showError("Failed to load analytics data.");
  }
}

function updateTrendsChart(trendsData) {
  const ctx = document.getElementById("trends-chart").getContext("2d");

  // Destroy existing chart
  if (trendsChart) {
    trendsChart.destroy();
  }

  const labels = trendsData.map((item) =>
    new Date(item.date).toLocaleDateString()
  );
  const data = trendsData.map((item) => item.averageTariffRate);

  trendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Average Tariff Rate (%)",
          data: data,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function updateCountriesChart(countryData) {
  const ctx = document.getElementById("countries-chart").getContext("2d");

  // Destroy existing chart
  if (countriesChart) {
    countriesChart.destroy();
  }

  const labels = countryData.map((item) => {
    const country = countries.find((c) => c.iso3Code === item.country);
    return country ? country.name : item.country;
  });
  const data = countryData.map((item) => item.averageTariffRate);

  const colors = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#6366f1",
  ];

  countriesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Average Tariff Rate (%)",
          data: data,
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

// Export functions
async function exportToCSV() {
  try {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const history = await response.json();

    if (history.length === 0) {
      showError("No data to export.");
      return;
    }

    // Create CSV content
    const headers = [
      "Date",
      "HS Code",
      "Product",
      "Exporting Country",
      "Importing Country",
      "Trade Value",
      "Tariff Rate",
      "Tariff Cost",
    ];
    const csvContent = [
      headers.join(","),
      ...history.map((calc) => {
        const exportingCountryName =
          countries.find((c) => c.iso3Code === calc.exportingCountry)?.name ||
          calc.exportingCountry;
        const importingCountryName =
          countries.find((c) => c.iso3Code === calc.importingCountry)?.name ||
          calc.importingCountry;

        return [
          new Date(calc.tradeDate).toLocaleDateString(),
          calc.hsCode,
          `"${calc.productDescription || ""}"`,
          `"${exportingCountryName}"`,
          `"${importingCountryName}"`,
          calc.tradeValue,
          calc.tariffRate,
          calc.tariffCost,
        ].join(",");
      }),
    ].join("\n");

    // Download CSV
    downloadFile(csvContent, "tariff-calculations.csv", "text/csv");
    showSuccess("CSV exported successfully!");
  } catch (error) {
    console.error("Error exporting CSV:", error);
    showError("Failed to export CSV.");
  }
}

async function exportToPDF() {
  try {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const history = await response.json();

    if (history.length === 0) {
      showError("No data to export.");
      return;
    }

    // Create PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("TARIFF Calculation History", 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    // Add table headers
    let y = 50;
    const lineHeight = 8;

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Date", 20, y);
    doc.text("HS Code", 50, y);
    doc.text("Trade Route", 80, y);
    doc.text("Trade Value", 130, y);
    doc.text("Tariff Rate", 160, y);
    doc.text("Tariff Cost", 185, y);

    y += lineHeight;
    doc.line(20, y, 200, y); // Horizontal line
    y += 5;

    // Add data rows
    doc.setFont(undefined, "normal");
    history.forEach((calc) => {
      const exportingCountryName =
        countries.find((c) => c.iso3Code === calc.exportingCountry)?.name ||
        calc.exportingCountry;
      const importingCountryName =
        countries.find((c) => c.iso3Code === calc.importingCountry)?.name ||
        calc.importingCountry;

      if (y > 270) {
        // Start new page if needed
        doc.addPage();
        y = 20;
      }

      doc.text(new Date(calc.tradeDate).toLocaleDateString(), 20, y);
      doc.text(calc.hsCode, 50, y);
      doc.text(
        `${exportingCountryName.substring(
          0,
          8
        )} → ${importingCountryName.substring(0, 8)}`,
        80,
        y
      );
      doc.text(`$${parseFloat(calc.tradeValue).toLocaleString()}`, 130, y);
      doc.text(`${parseFloat(calc.tariffRate).toFixed(2)}%`, 160, y);
      doc.text(`$${parseFloat(calc.tariffCost).toLocaleString()}`, 185, y);

      y += lineHeight;
    });

    // Save PDF
    doc.save("tariff-calculations.pdf");
    showSuccess("PDF exported successfully!");
  } catch (error) {
    console.error("Error exporting PDF:", error);
    showError("Failed to export PDF.");
  }
}

function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Utility functions
function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  const spinner = document.getElementById("loading-spinner");
  const button = document.getElementById("calculate-btn");

  if (show) {
    overlay.classList.remove("hidden");
    spinner.classList.remove("hidden");
    button.disabled = true;
    button.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    overlay.classList.add("hidden");
    spinner.classList.add("hidden");
    button.disabled = false;
    button.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

function showError(message) {
  // Create and show error toast
  const toast = createToast(message, "error");
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function showSuccess(message) {
  // Create and show success toast
  const toast = createToast(message, "success");
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function createToast(message, type) {
  const toast = document.createElement("div");
  const bgColor = type === "error" ? "bg-red-500" : "bg-green-500";
  const icon = type === "error" ? "fa-exclamation-circle" : "fa-check-circle";

  toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`;
  toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icon} mr-3"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

  // Animate in
  setTimeout(() => {
    toast.classList.remove("translate-x-full");
  }, 100);

  return toast;
}

// Add some CSS for better styling
const style = document.createElement("style");
style.textContent = `
    .page-content {
        animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .nav-link, .nav-link-mobile {
        transition: all 0.2s ease-in-out;
    }
    
    .nav-link:hover, .nav-link-mobile:hover {
        transform: translateY(-1px);
    }
    
    input:focus, select:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    button:active {
        transform: translateY(0);
    }
    
    .table-row:hover {
        background-color: #f9fafb;
    }
`;
document.head.appendChild(style);
