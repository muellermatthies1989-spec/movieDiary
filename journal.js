const IMG_URL = "https://image.tmdb.org/t/p/w500";
const STORAGE_KEY = "movieDiary";

const list = document.querySelector("#journal-list");
const emptyMessage = document.querySelector("#empty");

// ---------- Web Storage ----------
function getFavourites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveFavourites(favourites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
}

function saveNote(id, text) {
  const favourites = getFavourites();
  const movie = favourites.find((entry) => entry.id === id);
  if (!movie) return;
  movie.note = text; // Notiz am selben Objekt speichern
  saveFavourites(favourites);
}

function removeFavourite(id) {
  saveFavourites(getFavourites().filter((entry) => entry.id !== id));
  render();
}

// ---------- DOM ----------
function el(tag, classes, text) {
  const node = document.createElement(tag);
  node.className = classes;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createEntry(movie) {
  const item = el("li", "flex flex-col gap-5 rounded-xl bg-panel p-4 sm:flex-row");

  const posterBox = el("div", "w-full shrink-0 overflow-hidden rounded-lg bg-line sm:w-40");
  if (movie.poster_path) {
    const img = document.createElement("img");
    img.src = IMG_URL + movie.poster_path;
    img.alt = `Poster von ${movie.title}`;
    img.className = "aspect-[2/3] w-full object-cover";
    posterBox.append(img);
  } else {
    posterBox.append(el("p", "flex aspect-[2/3] items-center justify-center text-sm text-paper/60", "Kein Poster"));
  }

  const year = movie.release_date ? movie.release_date.slice(0, 4) : "Jahr unbekannt";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "–";

  const body = el("div", "flex min-w-0 flex-1 flex-col");
  const title = el("h2", "text-2xl font-extrabold tracking-tight", movie.title);
  const info = el("p", "mt-1 text-sm text-paper/70", `${year} · Bewertung ${rating}`);
  const overview = el("p", "mt-3 line-clamp-3 text-sm text-paper/80", movie.overview || "Keine Beschreibung vorhanden.");

  const label = el("label", "mt-5 text-sm font-semibold", "Deine Notiz");
  const textareaId = `note-${movie.id}`;
  label.htmlFor = textareaId;
  const textarea = el("textarea", "mt-2 min-h-24 w-full rounded-lg border border-line bg-ink p-3 text-paper placeholder:text-paper/40 focus:border-mint focus:outline-none");
  textarea.id = textareaId;
  textarea.placeholder = "Was ist dir von diesem Film geblieben?";
  textarea.value = movie.note ?? "";

  const actions = el("div", "mt-3 flex flex-wrap items-center gap-3");
  const saveButton = el("button", "rounded-lg bg-gold px-4 py-2 text-sm font-extrabold text-ink hover:bg-mint focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint", "Notiz speichern");
  saveButton.type = "button";
  saveButton.addEventListener("click", () => {
    saveNote(movie.id, textarea.value.trim());
    saveButton.textContent = "Notiz gespeichert";
    setTimeout(() => (saveButton.textContent = "Notiz speichern"), 1500);
  });

  const removeButton = el("button", "rounded-lg px-4 py-2 text-sm font-semibold text-paper/70 hover:bg-line hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-mint", "Aus Journal entfernen");
  removeButton.type = "button";
  removeButton.addEventListener("click", () => removeFavourite(movie.id));

  actions.append(saveButton, removeButton);
  body.append(title, info, overview, label, textarea, actions);
  item.append(posterBox, body);
  return item;
}

function render() {
  const favourites = getFavourites();
  emptyMessage.classList.toggle("hidden", favourites.length > 0);
  list.replaceChildren(...favourites.map(createEntry));
}

render();
