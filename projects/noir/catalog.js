"use strict";

const films = [
  { title: "Спектр", original: "Spectrum", genre: "Фантастика", year: 2026, director: "Вера Соколова", cast: "Полина Морозова", color: "violet" },
  { title: "Последний вагон", original: "The Last Car", genre: "Триллер", year: 2025, director: "Илья Орлов", cast: "Артём Волков", color: "red" },
  { title: "Свет на кухне", original: "Kitchen Light", genre: "Драма", year: 2026, director: "Анна Лебедева", cast: "Мария Соколова", color: "amber" },
  { title: "Орбита", original: "Orbit", genre: "Фантастика", year: 2024, director: "Илья Орлов", cast: "Полина Морозова", color: "blue" },
];

const query = document.querySelector("#query");
const genre = document.querySelector("#genre");
const list = document.querySelector("#films");

function render() {
  const results = films.filter((film) => (!genre.value || film.genre === genre.value) && matches(film, query.value));
  document.querySelector("#count").textContent = results.length ? `Найдено фильмов: ${results.length}` : "Фильмы не найдены.";

  const items = results.map((film) => {
    const item = document.createElement("li");
    const cover = document.createElement("div");
    cover.className = `cover ${film.color}`;
    cover.setAttribute("aria-hidden", "true");
    const title = document.createElement("h2");
    title.textContent = film.title;
    const metadata = document.createElement("p");
    metadata.textContent = `${film.year} · ${film.genre}`;
    const director = document.createElement("p");
    director.textContent = `Режиссёр — ${film.director}`;
    item.append(cover, title, metadata, director);
    return item;
  });
  list.replaceChildren(...items);
}

query.addEventListener("input", render);
genre.addEventListener("change", render);
render();
