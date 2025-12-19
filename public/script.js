// public/script.js

// --- 1. Global: Profile & Sidebar Management ---
document.addEventListener("DOMContentLoaded", function () {
  loadProfileData();
  setupNavigation();
  // New: If we are on the home page, load the dashboard stats and chart
  if (document.getElementById('studentName')) {
    updateDashboardFromStorage();
  }
});

function loadProfileData() {
  // Load from LocalStorage
  const name = localStorage.getItem("userName") || "Student Name";
  const photo = localStorage.getItem("userPhoto");
  const role = localStorage.getItem("userRole") || "Junior Developer";

  // Update Sidebar & Topbar
  const nameElements = document.querySelectorAll(".user-name-display");
  nameElements.forEach((el) => (el.textContent = name));

  // Update Home Page Welcome Text
  const welcomeName = document.getElementById("studentName");
  if (welcomeName) welcomeName.textContent = name;

  // Update Top Bar User Icon
  const topBarUser = document.getElementById("topBarUser");
  if (topBarUser) topBarUser.textContent = name.split(' ')[0];

  if (photo) {
    const photoElements = document.querySelectorAll(
      ".avatar-circle, .user-icon"
    );
    photoElements.forEach((el) => {
      el.style.backgroundImage = `url(${photo})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.innerText = ""; // Remove text if image exists
    });
  }

  // Update Input Fields if on Profile Page
  const nameInput = document.getElementById("inputName");
  if (nameInput) nameInput.value = name;

  const roleInput = document.getElementById("inputRole");
  if (roleInput) roleInput.value = role;
}

function saveProfile() {
  const name = document.getElementById("inputName").value;
  const role = document.getElementById("inputRole").value;
  const emailInput = document.getElementById("inputEmail");
  
  localStorage.setItem("userName", name);
  localStorage.setItem("userRole", role);
  if (emailInput) localStorage.setItem("userEmail", emailInput.value);

  alert("Profile Saved Successfully!");
  loadProfileData(); // Refresh UI
}

function uploadPhoto(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem("userPhoto", e.target.result); 
      loadProfileData();
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// --- 2. Dashboard Logic (Home Page Updates & Charts) ---
function updateDashboardFromStorage() {
  const storedData = localStorage.getItem("resumeAnalysis");
  if (!storedData) return;

  const data = JSON.parse(storedData);

  // Update Demand Match Text
  const demandMatch = document.getElementById("demandMatchValue");
  if (demandMatch) demandMatch.innerText = data.matchScore + "%";

  // Update Skill Level Gauge & Text
  const skillText = document.getElementById("skillText");
  const skillGauge = document.getElementById("skillGauge");
  if (skillText && skillGauge) {
    let level = "Beginner";
    let color = "#ef4444"; // Red
    if (data.matchScore > 75) { level = "Expert"; color = "#4361EE"; }
    else if (data.matchScore > 45) { level = "Intermediate"; color = "#4CC9F0"; }
    
    skillText.innerText = level;
    skillGauge.style.borderColor = color;
  }

  // Update Home Recommendations
  const homeRecList = document.getElementById("recommendationList");
  if (homeRecList && data.recommendations) {
    homeRecList.innerHTML = data.recommendations
      .map(rec => `<div class="rec-item"><i class="fa-regular fa-lightbulb"></i> ${rec}</div>`)
      .join('');
  }

  // --- NEW: Update Career Progress Chart on Home Page ---
  const ctxProgress = document.getElementById("careerProgressChart");
  if (ctxProgress) {
    // Destroy previous instance to avoid hover glitches
    if (window.homeProgressChartInstance) window.homeProgressChartInstance.destroy();

    window.homeProgressChartInstance = new Chart(ctxProgress, {
      type: 'line',
      data: {
        labels: ['Starting Point', 'Latest Analysis'],
        datasets: [{
          label: 'Career Readiness %',
          data: [0, data.matchScore], 
          borderColor: '#4361EE',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#4361EE'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 100,
            ticks: { callback: value => value + '%' }
          }
        }
      }
    });
  }
}

// --- 3. Assessment Page: AI Resume Analysis ---
async function analyzeResume() {
  const fileInput = document.getElementById("resumeUpload");
  const statusText = document.getElementById("uploadStatus");
  const btn = document.getElementById("analyzeBtn");

  if (!fileInput.files[0]) {
    alert("Please select a PDF file first.");
    return;
  }

  statusText.innerText = "Analyzing Resume with AI...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("resume", fileInput.files[0]);

  try {
    const response = await fetch("/api/analyze-resume", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Save results for the Home page to use
    localStorage.setItem("resumeAnalysis", JSON.stringify(data));

    statusText.innerText = "Analysis Complete!";
    btn.disabled = false;

    updateAssessmentUI(data);
  } catch (error) {
    console.error(error);
    statusText.innerText = "Error analyzing resume.";
    btn.disabled = false;
  }
}

function updateAssessmentUI(data) {
  // Update Match Score on Assessment Page
  const matchDisplay = document.getElementById("matchScoreDisplay");
  if (matchDisplay) matchDisplay.innerText = data.matchScore + "%";

  // Update Recommendations on Assessment Page
  const recList = document.getElementById("aiRecommendations");
  if (recList) {
    recList.innerHTML = data.recommendations
      .map(rec => `<div class="rec-item"><i class="fa-regular fa-lightbulb"></i> ${rec}</div>`)
      .join('');
  }

  // Soft Skills Chart (Assessment Page)
  if (window.softSkillsChartInstance) window.softSkillsChartInstance.destroy();
  const ctxDonut = document.getElementById("softSkillsChart");
  if (ctxDonut) {
    window.softSkillsChartInstance = new Chart(ctxDonut, {
      type: "doughnut",
      data: {
        labels: ["Match", "Gap"],
        datasets: [{
          data: [data.softSkills.match, data.softSkills.gap],
          backgroundColor: ["#2E0249", "#81C784"],
          borderWidth: 0,
        }],
      },
      options: { cutout: "60%", plugins: { legend: { display: false } } },
    });
  }

  // Tech Skills Chart (Assessment Page)
  if (window.techSkillsChartInstance) window.techSkillsChartInstance.destroy();
  const ctxBar = document.getElementById("techSkillsChart");
  if (ctxBar) {
    window.techSkillsChartInstance = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: data.techSkills.map(s => s.name),
        datasets: [
          { label: "Your Skill", data: data.techSkills.map(s => s.current), backgroundColor: "#4CC9F0" },
          { label: "Market Demand", data: data.techSkills.map(s => s.demand), backgroundColor: "#BDBDBD" }
        ],
      },
      options: { indexAxis: "y", responsive: true },
    });
  }
}

// --- 4. Chatbot Page: AI Chat ---
async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const msgArea = document.getElementById("chatHistory");
  const userText = input.value;

  if (!userText.trim()) return;

  msgArea.innerHTML += `<div class="msg user">${userText}</div>`;
  input.value = "";
  msgArea.scrollTop = msgArea.scrollHeight;

  const typingId = "typing-" + Date.now();
  msgArea.innerHTML += `<div id="${typingId}" class="msg ai">Thinking...</div>`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });

    const data = await response.json();
    document.getElementById(typingId).remove();
    msgArea.innerHTML += `<div class="msg ai"><i class="fa-solid fa-robot"></i> ${data.reply}</div>`;
    msgArea.scrollTop = msgArea.scrollHeight;
  } catch (error) {
    document.getElementById(typingId).innerText = "Error connecting to AI.";
  }
}

function handleChatKey(event) {
  if (event.key === "Enter") sendChatMessage();
}

function setupNavigation() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".nav-links a");
  links.forEach((link) => {
    if (link.getAttribute("href") === path) {
      link.parentElement.classList.add("active-page");
    } else {
      link.parentElement.classList.remove("active-page");
    }
  });
}