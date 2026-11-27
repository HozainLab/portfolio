function normalize(value) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9 ]/g, "")
    .trim();
}
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = old;
    }
  }
  return row[b.length];
}
function matches(movie, query) {
  const q = normalize(query);
  if (!q) return true;
  const texts = [movie.title, movie.original, movie.director, movie.cast].map(
    normalize,
  );
  return texts.some(
    (t) =>
      t.includes(q) ||
      (q.length > 3 &&
        t
          .split(" ")
          .some(
            (w) => distance(w, q) <= Math.max(1, Math.floor(q.length / 5)),
          )),
  );
}
