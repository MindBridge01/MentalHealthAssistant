export function rrf(rankings, k = 60) {
  const found = new Map();
  for (const ranking of rankings) ranking.forEach((item, index) => {
    const old = found.get(item.id) || {
      ...item,
      fusionScore: 0
    };
    old.fusionScore += 1 / (k + index + 1);
    found.set(item.id, old);
  });
  return [...found.values()].sort((a, b) => b.fusionScore - a.fusionScore);
}
export async function retrieve(db, models, query) {
  const [vector] = await models.embed([query]);
  const eligible = "d.review_status='approved' AND d.state='ready' AND d.metadata->>'language'='en' AND d.metadata->>'audience'='adult' AND d.metadata->>'evidence_type' <> 'personal_experience'";
  const fields = 'c.id,c.chunk_text,c.parent_text,c.section,c.page,d.metadata';
  const [lexical, dense] = await Promise.all([db.query(`SELECT ${fields} FROM chatbot.document_chunks c JOIN chatbot.documents d ON d.id=c.document_id WHERE ${eligible} AND c.lexical @@ websearch_to_tsquery('english',$1) ORDER BY ts_rank_cd(c.lexical,websearch_to_tsquery('english',$1)) DESC LIMIT 15`, [query]), db.query(`SELECT ${fields} FROM chatbot.document_chunks c JOIN chatbot.documents d ON d.id=c.document_id WHERE ${eligible} ORDER BY c.embedding <=> $1::vector LIMIT 15`, [JSON.stringify(vector)])]);
  const candidates = rrf([lexical.rows, dense.rows]);
  if (!candidates.length) return [];
  const scores = await models.rerank(query, candidates.map(c => c.chunk_text));
  return candidates.map((c, i) => ({
    ...c,
    score: scores[i]
  })).sort((a, b) => b.score - a.score).filter(c => c.score > 0).slice(0, 4);
}
// Approximate token budget (Unicode code points / 3); validate real tokenizer in evaluation.
export function buildContext(chunks, maxCharacters = 10000) {
  let used = 0;
  const result = [];
  for (const chunk of chunks) {
    const remaining = maxCharacters - used;
    if (remaining < 200) break;
    const body = chunk.parent_text.slice(0, Math.min(3200, remaining));
    result.push({
      label: `S${result.length + 1}`,
      id: chunk.id,
      text: body,
      title: chunk.metadata.title,
      source: chunk.metadata.source,
      section: chunk.section,
      page: chunk.page
    });
    used += body.length;
  }
  return result;
}
