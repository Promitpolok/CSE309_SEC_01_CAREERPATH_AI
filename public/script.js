// public/script.js

// --- 1. Global: Profile & Sidebar Management ---
document.addEventListener("DOMContentLoaded", function () {
  loadProfileData();
  setupNavigation();
});

function loadProfileData() {
  // Load from LocalStorage
  const name = localStorage.getItem("userName") || "Student Name";
  const photo = localStorage.getItem("userPhoto");
  const role = localStorage.getItem("userRole") || "Junior Developer";

  // Update Sidebar & Topbar
  const nameElements = document.querySelectorAll(".user-name-display");
  nameElements.forEach((el) => (el.textContent = name));

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
  const email = document.getElementById("inputEmail").value;
  const role = document.getElementById("inputRole").value;

  localStorage.setItem("userName", name);
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userRole", role);

  alert("Profile Saved Successfully!");
  loadProfileData(); // Refresh UI
}

// Handle Photo Upload
function uploadPhoto(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem("userPhoto", e.target.result); // Save Base64 to Storage
      loadProfileData();
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// --- 2. Assessment Page: AI Resume Analysis ---
async function analyzeResume() {
  const fileInput = document.getElementById("resumeUpload");
  const statusText = document.getElementById("uploadStatus");
  const btn = document.getElementById("analyzeBtn");

  if (!fileInput.files[0]) {
    alert("Please select a PDF file first.");
    return;
  }

  // UI Loading State
  statusText.innerText = "Uploading & Analyzing... (This uses AI)";
  btn.disabled = true;
  btn.style.backgroundColor = "#ccc";

  const formData = new FormData();
  formData.append("resume", fileInput.files[0]);

  try {
    const response = await fetch("/api/analyze-resume", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    // Success! Update UI with Real AI Data
    statusText.innerText = "Analysis Complete!";
    btn.disabled = false;
    btn.style.backgroundColor = "#3A0CA3";

    updateAssessmentUI(data);
  } catch (error) {
    console.error(error);
    statusText.innerText = "Error analyzing resume.";
    btn.disabled = false;
  }
}

function updateAssessmentUI(data) {
  // 1. Update Match Score
  document.getElementById("matchScoreDisplay").innerText =
    data.matchScore + "%";

  // 2. Update Recommendations List
  const recList = document.getElementById("aiRecommendations");
  recList.innerHTML = ""; // Clear old
  data.recommendations.forEach((rec) => {
    recList.innerHTML += `<div class="rec-item"><i class="fa-regular fa-lightbulb"></i> ${rec}</div>`;
  });

  // 3. Update Soft Skills Chart
  if (window.softSkillsChartInstance) window.softSkillsChartInstance.destroy();
  const ctxDonut = document.getElementById("softSkillsChart");
  if (ctxDonut) {
    window.softSkillsChartInstance = new Chart(ctxDonut, {
      type: "doughnut",
      data: {
        labels: ["Match", "Gap"],
        datasets: [
          {
            data: [data.softSkills.match, data.softSkills.gap],
            backgroundColor: ["#2E0249", "#81C784"],
            borderWidth: 0,
          },
        ],
      },
      options: { cutout: "60%", plugins: { legend: { display: false } } },
    });
  }

  // 4. Update Tech Skills Chart
  if (window.techSkillsChartInstance) window.techSkillsChartInstance.destroy();
  const ctxBar = document.getElementById("techSkillsChart");
  if (ctxBar) {
    const labels = data.techSkills.map((s) => s.name);
    const currentData = data.techSkills.map((s) => s.current);
    const demandData = data.techSkills.map((s) => s.demand);

    window.techSkillsChartInstance = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Your Skill",
            data: currentData,
            backgroundColor: "#1E88E5",
          },
          {
            label: "Market Demand",
            data: demandData,
            backgroundColor: "#BDBDBD",
          },
        ],
      },
      options: { indexAxis: "y", responsive: true },
    });
  }
}

// --- 3. Chatbot Page: AI Chat ---
async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const msgArea = document.getElementById("chatHistory");
  const userText = input.value;

  if (!userText.trim()) return;

  // Add User Message to UI
  msgArea.innerHTML += `
        <div class="msg user">
            ${userText}
        </div>`;
  input.value = "";
  msgArea.scrollTop = msgArea.scrollHeight; // Scroll to bottom

  // Show Typing Indicator
  const typingId = "typing-" + Date.now();
  msgArea.innerHTML += `<div id="${typingId}" class="msg ai">Thinking...</div>`;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });

    const data = await response.json();

    // Remove typing indicator and add real response
    document.getElementById(typingId).remove();
    msgArea.innerHTML += `
            <div class="msg ai">
                <i class="fa-solid fa-robot"></i> ${data.reply}
            </div>`;
    msgArea.scrollTop = msgArea.scrollHeight;
  } catch (error) {
    console.error(error);
    document.getElementById(typingId).innerText = "Error connecting to AI.";
  }
}

// Allow Enter key to send
function handleChatKey(event) {
  if (event.key === "Enter") sendChatMessage();
}

function setupNavigation() {
  // Helper to highlight sidebar
  const path = window.location.pathname.split("/").pop();
  const links = document.querySelectorAll(".nav-links a");
  links.forEach((link) => {
    if (link.getAttribute("href") === path) {
      link.parentElement.classList.add("active-page");
    } else {
      link.parentElement.classList.remove("active-page");
    }
  });
}
