document.addEventListener("DOMContentLoaded", () => {
  const calendar = document.getElementById("calendar");
  const timeSlots = document.getElementById("time-slots");
  const confirmBtn = document.getElementById("confirm-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");

  // Тема
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    themeIcon.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
  });

  // Календарь (30 дней)
  for (let i = 1; i <= 30; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "calendar-day w-10 h-10 rounded-full hover:bg-subtle-light dark:hover:bg-subtle-dark transition";
    btn.addEventListener("click", () => {
      document.querySelectorAll(".calendar-day").forEach(d => d.classList.remove("bg-primary","text-white"));
      btn.classList.add("bg-primary","text-white");
      localStorage.setItem("appointmentDate", `July ${i}, 2024`);
    });
    calendar.appendChild(btn);
  }

  // Слоты времени
  const slots = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","1:00 PM","1:30 PM","2:00 PM"];
  slots.forEach(slot => {
    const label = document.createElement("label");
    label.className = "cursor-pointer";
    label.innerHTML = `
      <input type="radio" name="time-slot" class="sr-only"/>
      <div class="text-center text-sm font-medium py-3 px-2 rounded-lg border border-border-light dark:border-border-dark hover:border-primary transition">${slot}</div>
    `;
    const input = label.querySelector("input");
    input.addEventListener("change", () => {
      timeSlots.querySelectorAll("div").forEach(d => d.classList.remove("bg-primary","text-white","border-primary"));
      label.querySelector("div").classList.add("bg-primary","text-white","border-primary");
      localStorage.setItem("appointmentTime", slot);
    });
    timeSlots.appendChild(label);
  });

  // Подтверждение
  confirmBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const service = document.getElementById("reason").value.trim() || "Routine Checkup";
    if (!name || !phone || !email) {
      alert("Please fill in all required fields.");
      return;
    }
    localStorage.setItem("appointmentService", service);
    window.location.href = "success.html";
  });
});