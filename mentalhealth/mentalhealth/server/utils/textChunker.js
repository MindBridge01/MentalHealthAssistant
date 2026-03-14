function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize || 220;
  const overlap = options.overlap || 40;

  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(" "));
    if (end === words.length) break;
    start = end - overlap;
  }

  return chunks;
}

module.exports = {
  chunkText,
};
