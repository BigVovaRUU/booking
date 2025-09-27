// js/app.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------- ЭЛЕМЕНТЫ ----------
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");

  const formSection = document.getElementById("form-section");
  const successSection = document.getElementById("success-section");
  const backBtn = document.getElementById("back-btn");
  const addCalendarBtn = document.getElementById("add-calendar");
  const toast = document.getElementById("toast");

  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const serviceSelect = document.getElementById("reason");

  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const monthLabel = document.getElementById("month-label");
  const calendarEl = document.getElementById("calendar");
  const timeSlotsEl = document.getElementById("time-slots");
  const confirmBtn = document.getElementById("confirm-btn");

  const confirmDateEl = document.getElementById("confirm-date");
  const confirmTimeEl = document.getElementById("confirm-time");
  const confirmServiceEl = document.getElementById("confirm-service");

  // ---------- КОНСТАНТЫ ----------
  const RU_MONTHS = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  const RU_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const TIME_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00"];

  // ---------- СОСТОЯНИЕ ----------
  let viewYear, viewMonth;             // для календаря
  let selectedDate = null;             // Date
  let selectedTime = null;             // "HH:MM"
  let selectedService = null;          // текст услуги

  // ---------- УТИЛИТЫ ----------
  const pad2 = n => String(n).padStart(2, "0");

  function formatRuDate(date) {
    // 15 сентября 2025
    return `${date.getDate()} ${RU_MONTHS[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
  }

  function showToast(msg = "Запись успешно создана ✅", timeout = 2000) {
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), timeout);
  }

  function showSpinner() {
    const el = document.createElement("div");
    el.id = "spinner-overlay";
    el.className = "fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50";
    el.innerHTML = `
      <div class="flex flex-col items-center gap-3">
        <div class="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
        <div class="text-white font-medium">Создаём запись…</div>
      </div>
    `;
    document.body.appendChild(el);
  }
  function hideSpinner() {
    const el = document.getElementById("spinner-overlay");
    if (el) el.remove();
  }

  function saveFormToStorage() {
    localStorage.setItem("cd_name", nameInput.value.trim());
    localStorage.setItem("cd_phone", phoneInput.value.trim());
    localStorage.setItem("cd_email", emailInput.value.trim());
    localStorage.setItem("cd_service", serviceSelect.value);
  }
  function loadFormFromStorage() {
    const name = localStorage.getItem("cd_name");
    const phone = localStorage.getItem("cd_phone");
    const email = localStorage.getItem("cd_email");
    const service = localStorage.getItem("cd_service");

    if (name) nameInput.value = name;
    if (phone) phoneInput.value = phone;
    if (email) emailInput.value = email;
    if (service) serviceSelect.value = service;
  }

  function setThemeInitial() {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // авто-детект по ОС
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
    }
    themeIcon.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeIcon.textContent = isDark ? "☀️" : "🌙";
  }

  // ---------- КАЛЕНДАРЬ ----------
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstWeekdayIndex(year, month) {
    // В JS: 0=Вс ... 6=Сб
    // Нам нужно: 0=Пн ... 6=Вс
    const jsDay = new Date(year, month, 1).getDay(); // 0..6
    return (jsDay + 6) % 7; // сдвиг, чтобы Пн=0
  }

  function renderCalendar() {
    calendarEl.innerHTML = "";
    monthLabel.textContent = `${RU_MONTHS[viewMonth]} ${viewYear}`;

    // Шапка дней недели
    RU_WEEKDAYS.forEach(d => {
      const cell = document.createElement("div");
      cell.className = "font-bold text-text-light/60 dark:text-gray-300 py-2";
      cell.textContent = d;
      calendarEl.appendChild(cell);
    });

    const leading = getFirstWeekdayIndex(viewYear, viewMonth);
    const totalDays = daysInMonth(viewYear, viewMonth);

    // Пустые ячейки перед 1-м числом
    for (let i = 0; i < leading; i++) {
      const empty = document.createElement("div");
      calendarEl.appendChild(empty);
    }

    const today = new Date();
    const isCurrentMonth = (viewYear === today.getFullYear() && viewMonth === today.getMonth());

    for (let d = 1; d <= totalDays; d++) {
      const btn = document.createElement("button");
      btn.textContent = d;
      btn.className = "calendar-day mx-auto my-1 flex items-center justify-center h-10 w-10 rounded-full transition-colors hover:bg-subtle-light dark:hover:bg-subtle-dark";
      const dateObj = new Date(viewYear, viewMonth, d);

      // Блокируем прошедшие даты в текущем месяце
      if (isCurrentMonth && d < today.getDate()) {
        btn.classList.add("text-gray-400", "cursor-not-allowed", "opacity-50");
        btn.disabled = true;
      }

      // Выбранная дата
      if (selectedDate &&
          dateObj.getFullYear() === selectedDate.getFullYear() &&
          dateObj.getMonth() === selectedDate.getMonth() &&
          dateObj.getDate() === selectedDate.getDate()) {
        btn.classList.add("bg-primary", "text-white");
      }

      btn.addEventListener("click", () => {
        // сброс подсветки
        calendarEl.querySelectorAll(".calendar-day").forEach(b => b.classList.remove("bg-primary","text-white"));
        btn.classList.add("bg-primary","text-white");
        selectedDate = dateObj;
        confirmDateEl.textContent = formatRuDate(selectedDate);
      });

      calendarEl.appendChild(btn);
    }
  }

  function changeMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    } else if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderCalendar();
  }

  // ---------- СЛОТЫ ВРЕМЕНИ ----------
  function renderTimeSlots() {
    timeSlotsEl.innerHTML = "";
    TIME_SLOTS.forEach(slot => {
      const label = document.createElement("label");
      label.className = "cursor-pointer";
      label.innerHTML = `
        <input type="radio" name="time-slot" class="sr-only"/>
        <div class="text-center text-sm font-medium py-3 px-2 rounded-lg border border-border-light dark:border-border-dark hover:border-primary transition">
          ${slot}
        </div>
      `;
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        timeSlotsEl.querySelectorAll("div").forEach(d => d.classList.remove("bg-primary","text-white","border-primary"));
        label.querySelector("div").classList.add("bg-primary","text-white","border-primary");
        selectedTime = slot;
        confirmTimeEl.textContent = slot;
      });
      timeSlotsEl.appendChild(label);
    });
  }

  // ---------- .ICS ФАЙЛ ----------
  function downloadICS({ title, description, start, durationMinutes = 30, location = "Care Dental" }) {
    // start: Date (локальная)
    const dtStart = new Date(start);
    const dtEnd = new Date(start.getTime() + durationMinutes * 60000);

    const toICSDate = (d) =>
      d.getFullYear().toString() +
      pad2(d.getMonth() + 1) +
      pad2(d.getDate()) + "T" +
      pad2(d.getHours()) +
      pad2(d.getMinutes()) +
      pad2(d.getSeconds());

    const uid = `care-dental-${Date.now()}@example`;
    const now = new Date();

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Care Dental//Booking//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toICSDate(now)}`,
      `DTSTART:${toICSDate(dtStart)}`,
      `DTEND:${toICSDate(dtEnd)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "appointment.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- СОБЫТИЯ ----------
  themeToggle.addEventListener("click", toggleTheme);
  prevMonthBtn.addEventListener("click", () => changeMonth(-1));
  nextMonthBtn.addEventListener("click", () => changeMonth(1));

  [nameInput, phoneInput, emailInput, serviceSelect].forEach(el => {
    el.addEventListener("input", saveFormToStorage);
  });

  confirmBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    selectedService = serviceSelect.value;

    if (!name || !phone || !email) {
      alert("Пожалуйста, заполните имя, телефон и email.");
      return;
    }
    if (!selectedDate) {
      alert("Пожалуйста, выберите дату.");
      return;
    }
    if (!selectedTime) {
      alert("Пожалуйста, выберите время.");
      return;
    }

    saveFormToStorage();

    // имитация запроса к серверу
    showSpinner();
    setTimeout(() => {
      hideSpinner();
      confirmServiceEl.textContent = selectedService;
      confirmDateEl.textContent = formatRuDate(selectedDate);
      confirmTimeEl.textContent = selectedTime;

      formSection.classList.add("hidden");
      successSection.classList.remove("hidden");
      showToast();
    }, 900);
  });

  backBtn.addEventListener("click", () => {
    successSection.classList.add("hidden");
    formSection.classList.remove("hidden");
  });

  addCalendarBtn.addEventListener("click", () => {
    if (!selectedDate || !selectedTime) return;

    const [h, m] = selectedTime.split(":").map(Number);
    const start = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h, m, 0
    );

    downloadICS({
      title: `Визит: ${selectedService || "Стоматология"}`,
      description: `Запись в Care Dental\nИмя: ${nameInput.value}\nТелефон: ${phoneInput.value}`,
      start,
      durationMinutes: 30,
      location: "Care Dental"
    });
  });

  // ---------- ИНИЦИАЛИЗАЦИЯ ----------
  setThemeInitial();
  loadFormFromStorage();

  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();
  renderCalendar();
  renderTimeSlots();

  // Автовыбор ближайшей доступной даты (сегодня/завтра)
  const todayBtn = Array.from(calendarEl.querySelectorAll(".calendar-day"))
    .find((b) => !b.disabled);
  if (todayBtn) {
    todayBtn.click();
  }
});