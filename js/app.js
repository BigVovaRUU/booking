// =======================
// Переменные
// =======================
const formSection = document.getElementById("form-section");
const successSection = document.getElementById("success-section");
const calendarEl = document.getElementById("calendar");
const monthLabel = document.getElementById("month-label");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const timeSlotsEl = document.getElementById("time-slots");
const confirmBtn = document.getElementById("confirm-btn");
const backBtn = document.getElementById("back-btn");
const toastEl = document.getElementById("toast");
const addCalendarBtn = document.getElementById("add-calendar");

// Поля формы
const nameEl = document.getElementById("name");
const phoneEl = document.getElementById("phone");
const emailEl = document.getElementById("email");
const reasonEl = document.getElementById("reason");

// Элементы подтверждения
const confirmDateEl = document.getElementById("confirm-date");
const confirmTimeEl = document.getElementById("confirm-time");
const confirmServiceEl = document.getElementById("confirm-service");

// Тема
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// =======================
// Локализация календаря
// =======================
const RU_MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];
const RU_WEEKDAYS = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

// =======================
// Дата и время
// =======================
let today = new Date();
let viewMonth = today.getMonth();
let viewYear = today.getFullYear();
let selectedDate = null;
let selectedTime = null;

// =======================
// Хелперы
// =======================
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekdayIndex(year, month) {
  return new Date(year, month, 1).getDay();
}
function formatRuDate(dateObj) {
  return `${dateObj.getDate()} ${RU_MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

// =======================
// Календарь
// =======================
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

  // Пустые ячейки
  for (let i = 0; i < leading; i++) {
    const empty = document.createElement("div");
    calendarEl.appendChild(empty);
  }

  const now = new Date();
  const isCurrentMonth = (viewYear === now.getFullYear() && viewMonth === now.getMonth());

  for (let d = 1; d <= totalDays; d++) {
    const btn = document.createElement("button");
    btn.textContent = d;
    btn.className = "calendar-day flex items-center justify-center h-10 w-10 mx-auto rounded-full transition-colors hover:bg-subtle-light dark:hover:bg-subtle-dark";
    const dateObj = new Date(viewYear, viewMonth, d);

    // прошлые дни = disabled
    if (isCurrentMonth && d < now.getDate()) {
      btn.classList.add("text-gray-400","cursor-not-allowed","opacity-50");
      btn.disabled = true;
    }

    // подсветка выбранного дня
    if (selectedDate &&
      dateObj.getFullYear() === selectedDate.getFullYear() &&
      dateObj.getMonth() === selectedDate.getMonth() &&
      dateObj.getDate() === selectedDate.getDate()) {
      btn.classList.add("bg-primary","text-white");
    }

    btn.addEventListener("click", () => {
      calendarEl.querySelectorAll(".calendar-day").forEach(b => b.classList.remove("bg-primary","text-white"));
      btn.classList.add("bg-primary","text-white");
      selectedDate = dateObj;
      confirmDateEl.textContent = formatRuDate(selectedDate);
      renderTimeSlots(selectedDate);
    });

    calendarEl.appendChild(btn);
  }
}

// =======================
// Время (динамика)
// =======================
function renderTimeSlots(dateObj) {
  timeSlotsEl.innerHTML = "";
  let slots = [];

  if (!dateObj) return;

  const day = dateObj.getDay(); // 0=Вс,6=Сб
  if (day === 0 || day === 6) {
    // выходные
    slots = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30"];
  } else {
    // будни
    slots = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00"];
  }

  // если сегодня → убираем прошедшие
  const now = new Date();
  if (dateObj.toDateString() === now.toDateString()) {
    const nowMinutes = now.getHours()*60 + now.getMinutes();
    slots = slots.filter(slot => {
      const [h,m] = slot.split(":").map(Number);
      return h*60+m > nowMinutes;
    });
  }

  slots.forEach(slot => {
    const label = document.createElement("label");
    label.className = "cursor-pointer";
    label.innerHTML = `
      <input type="radio" name="time-slot" class="sr-only"/>
      <div class="text-center text-sm font-medium py-3 px-2 rounded-lg border border-border-light dark:border-border-dark hover:border-primary transition">${slot}</div>
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

// =======================
// Toast
// =======================
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  setTimeout(() => toastEl.classList.add("hidden"), 3000);
}

// =======================
// ICS файл (Добавить в календарь)
// =======================
function downloadICS() {
  if (!selectedDate || !selectedTime) return;
  const [hours,minutes] = selectedTime.split(":").map(Number);
  const start = new Date(selectedDate);
  start.setHours(hours,minutes,0);
  const end = new Date(start.getTime()+30*60000);

  function toICSDate(d) {
    return d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  }

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${reasonEl.value}
DTSTART:${toICSDate(start)}
DTEND:${toICSDate(end)}
DESCRIPTION:Запись к стоматологу Care Dental
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics],{type:"text/calendar;charset=utf-8"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "appointment.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// =======================
// Тема
// =======================
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  const isDark = document.documentElement.classList.contains("dark");
  document.getElementById("icon-sun").classList.toggle("hidden", !isDark);
  document.getElementById("icon-moon").classList.toggle("hidden", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// при загрузке страницы
if (localStorage.getItem("theme")==="dark" || 
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.classList.add("dark");
  document.getElementById("icon-sun").classList.remove("hidden");
  document.getElementById("icon-moon").classList.add("hidden");
}

// =======================
// LocalStorage для формы
// =======================
[nameEl, phoneEl, emailEl, reasonEl].forEach(el => {
  const key = "form-"+el.id;
  el.value = localStorage.getItem(key) || "";
  el.addEventListener("input",()=>localStorage.setItem(key,el.value));
});

// =======================
// Подтверждение
// =======================
confirmBtn.addEventListener("click", () => {
  if (!selectedDate || !selectedTime) {
    showToast("Выберите дату и время");
    return;
  }
  confirmServiceEl.textContent = reasonEl.value;
  formSection.classList.add("hidden");
  successSection.classList.remove("hidden");
  showToast("Запись успешно создана ✅");
});

backBtn.addEventListener("click", () => {
  successSection.classList.add("hidden");
  formSection.classList.remove("hidden");
});

addCalendarBtn.addEventListener("click", downloadICS);

// =======================
// Навигация календаря
// =======================
prevMonthBtn.addEventListener("click", () => {
  viewMonth--;
  if (viewMonth<0){viewMonth=11;viewYear--;}
  renderCalendar();
});
nextMonthBtn.addEventListener("click", () => {
  viewMonth++;
  if (viewMonth>11){viewMonth=0;viewYear++;}
  renderCalendar();
});

// =======================
// Init
// =======================
renderCalendar();