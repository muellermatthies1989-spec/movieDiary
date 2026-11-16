const API_KEY = "f4ba27160a1f1f8462697eae41d5b073";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const STORAGE_KEY = "movieDiary";

// ---------- DOM-Referenzen ----------
const grid = document.querySelector("#movie-grid");
const statusText = document.querySelector("#status");
const navCount = document.querySelector("#nav-count");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const dialog = document.querySelector("#search-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogMessage = document.querySelector("#dialog-message");
const dialogGrid = document.querySelector("#dialog-grid");
const dialogClose = document.querySelector("#dialog-close");

// ---------- Web Storage ----------
function getFavourites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveFavourites(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function isFavourite(id) {
  return getFavourites().some((movie) => movie.id === id);
}

function addFavourite(movie) {
  const list = getFavourites();
  if (list.some((entry) => entry.id === movie.id)) return;
  list.push({
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    overview: movie.overview,
    note: "",
  });
  saveFavourites(list);
  updateNavCount();
}

function removeFavourite(id) {
  saveFavourites(getFavourites().filter((entry) => entry.id !== id));
  updateNavCount();
}

function updateNavCount() {
  navCount.textContent = getFavourites().length;
}

// ---------- Fetch ----------
async function fetchMovies(path, params = {}) {
  const query = new URLSearchParams({ api_key: API_KEY, language: "de-DE", ...params });
  const response = await fetch(`${BASE_URL}${path}?${query}`);
  if (!response.ok) throw new Error(`TMDB antwortet mit Status ${response.status}`);
  const data = await response.json();
  return data.results;
}

// ---------- DOM: Karten bauen ----------
function el(tag, classes, text) {
  const node = document.createElement(tag);
  node.className = classes;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setButtonState(button, saved) {
  button.textContent = saved ? "Aus Favoriten entfernen" : "Zu Favoriten";
  button.setAttribute("aria-pressed", String(saved));
  button.className = saved
    ? "mt-3 w-full rounded-lg border border-gold px-3 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint"
    : "mt-3 w-full rounded-lg bg-gold px-3 py-2 text-sm font-extrabold text-ink hover:bg-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint";
}

function createCard(movie) {
  const card = el("article", "flex flex-col rounded-xl bg-panel p-3");

  const poster = el("div", "aspect-[2/3] overflow-hidden rounded-lg bg-line");
  if (movie.poster_path) {
    const img = document.createElement("img");
    img.src = IMG_URL + movie.poster_path;
    img.alt = `Poster von ${movie.title}`;
    img.loading = "lazy";
    img.className = "h-full w-full object-cover";
    poster.append(img);
  } else {
    poster.append(el("p", "flex h-full items-center justify-center p-4 text-center text-sm text-paper/60", "Kein Poster"));
  }

  const year = movie.release_date ? movie.release_date.slice(0, 4) : "Jahr unbekannt";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "–";

  const title = el("h3", "mt-3 font-extrabold leading-snug", movie.title);
  const info = el("p", "mt-1 text-sm text-paper/70", `${year} · Bewertung ${rating}`);

  const button = document.createElement("button");
  button.type = "button";
  setButtonState(button, isFavourite(movie.id));
  button.addEventListener("click", () => {
    if (isFavourite(movie.id)) {
      removeFavourite(movie.id);
      setButtonState(button, false);
    } else {
      addFavourite(movie);
      setButtonState(button, true);
    }
  });

  card.append(poster, title, info, button);
  return card;
}

function renderMovies(target, movies) {
  target.replaceChildren(...movies.map(createCard));
}

// ---------- Startseite: beliebte Filme ----------
let popularMovies = [];

async function loadPopular() {
  try {
    popularMovies = await fetchMovies("/movie/popular");
    statusText.hidden = true;
    renderMovies(grid, popularMovies);
  } catch (error) {
    statusText.textContent = "Die Filme konnten nicht geladen werden. Prüfe deinen API-Key und deine Verbindung.";
    console.error(error);
  }
}

// ---------- Suche mit Dialog ----------
async function handleSearch(event) {
  event.preventDefault();
  const term = searchInput.value.trim();
  if (!term) return;

  dialogTitle.textContent = `Ergebnisse für „${term}“`;
  dialogMessage.textContent = "Suche läuft …";
  dialogMessage.classList.remove("hidden");
  dialogGrid.replaceChildren();
  if (!dialog.open) dialog.showModal();

  try {
    const results = await fetchMovies("/search/movie", { query: term });
    if (results.length === 0) {
      dialogMessage.textContent = `Keine Treffer für „${term}“. Versuche einen anderen Titel.`;
      return;
    }
    dialogMessage.classList.add("hidden");
    renderMovies(dialogGrid, results.slice(0, 12));
  } catch (error) {
    dialogMessage.textContent = "Die Suche ist fehlgeschlagen. Bitte versuche es gleich noch einmal.";
    console.error(error);
  }
}

searchForm.addEventListener("submit", handleSearch);
dialogClose.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close(); // Klick auf den Hintergrund
});
dialog.addEventListener("close", () => {
  // Buttons auf der Startseite aktuell halten, falls im Dialog etwas geändert wurde
  renderMovies(grid, popularMovies);
});

// ---------- Start ----------
updateNavCount();
loadPopular();