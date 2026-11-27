"use strict";

const records = [
  { customer: "ДЕМО-001", stars: 200, day: "2026-11-23" },
  { customer: "ДЕМО-002", stars: 500, day: "2026-11-25" },
  { customer: "ДЕМО-001", stars: 200, day: "2026-11-26" },
];
let remainingDays = 0;

function renderOverview() {
  const dateRange = ["2026-11-27", "2026-11-26", "2026-11-25", "2026-11-24", "2026-11-23"];
  const totalsByDay = Object.fromEntries(dateRange.map((day) => [day, 0]));
  for (const entry of records) totalsByDay[entry.day] += entry.stars;
  const total = records.reduce((sum, entry) => sum + entry.stars, 0);
  const numberOfCustomers = new Set(records.map((entry) => entry.customer)).size;
  document.querySelector("#total").textContent = money(total) + " ⭐";
  document.querySelector("#active").textContent = numberOfCustomers;
  document.querySelector("#customers").textContent = numberOfCustomers;
  document.querySelector("#chart").replaceChildren(
    chart(dateRange.map((day) => ({ day, stars: totalsByDay[day] })))
  );

  const rows = records.slice(-6).reverse().map(({ customer, stars }) => {
    const row = document.createElement("tr");
    for (const value of [customer, money(stars) + " ⭐", "Подтверждён"]) {
      row.insertCell().textContent = value;
    }
    return row;
  });
  document.querySelector("#ledger").replaceChildren(...rows);
}

const buttons = document.querySelectorAll("[data-view]");
for (const button of buttons) {
  button.addEventListener("click", () => {
    for (const tab of buttons) {
      const selected = tab === button;
      tab.setAttribute("aria-pressed", String(selected));
      tab.classList.toggle("active", selected);
      document.getElementById(tab.dataset.view).hidden = !selected;
    }
  });
}

document.querySelector("#checkout").addEventListener("submit", (event) => {
  event.preventDefault();
  const days = Number(new FormData(event.currentTarget).get("plan"));
  const stars = days === 90 ? 500 : 200;
  records.push({ customer: "ДЕМО-003", stars, day: "2026-11-27" });
  remainingDays += days;
  document.querySelector("#subscription").textContent = `Остаток срока: ${remainingDays} дн. Платёж добавлен в журнал.`;
  renderOverview();
});

renderOverview();
