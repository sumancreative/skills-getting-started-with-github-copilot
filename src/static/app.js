document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      // clear select options (keep placeholder)
      while (activitySelect.options.length > 1) activitySelect.remove(1);
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants section (no bullets, with remove icon)
        const participantsHtml =
          details.participants && details.participants.length
            ? `<h5 class="participants-title">Participants (${details.participants.length})</h5>
               <ul class="participants-list" data-activity="${name}">
                 ${details.participants
                   .map(
                     (p) =>
                       `<li class="participant-item" data-email="${p}" data-activity="${name}">
                          <span class="participant-email">${p}</span>
                          <button class="remove-btn" title="Remove participant">✖</button>
                        </li>`
                   )
                   .join("")}
               </ul>`
            : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to show new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate remove participant clicks
  activitiesList.addEventListener("click", async (ev) => {
    const btn = ev.target.closest(".remove-btn");
    if (!btn) return;

    const li = btn.closest(".participant-item");
    if (!li) return;

    const email = li.dataset.email;
    const activity = li.dataset.activity;

    if (!email || !activity) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE", cache: "no-store" }
      );

      const resJson = await resp.json();
      if (resp.ok) {
        // refresh list
        await fetchActivities();
      } else {
        alert(resJson.detail || "Failed to remove participant");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
      alert("Failed to remove participant. Try again.");
    }
  });

  // Initialize app
  fetchActivities();
});
