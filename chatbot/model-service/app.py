import base64
import io
import re
from functools import lru_cache
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer, CrossEncoder

app = FastAPI(docs_url=None, redoc_url=None)

@lru_cache
def embedder():
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', trust_remote_code=False)
    model.max_seq_length = 512
    return model

@lru_cache
def reranker():
    return CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512, trust_remote_code=False)

class Texts(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=32)

class Rerank(Texts):
    query: str = Field(min_length=1, max_length=1200)

class Source(BaseModel):
    mime: str
    content: str = Field(max_length=7_000_000)

class Page(BaseModel):
    page: int = Field(ge=1)
    text: str = Field(max_length=100_000)

class Pages(BaseModel):
    pages: list[Page] = Field(min_length=1, max_length=200)

@app.get('/health')
def health():
    return {'status': 'ok', 'embedding_dimensions': 384}

@app.post('/embed')
def embed(body: Texts):
    if any(len(t) > 12000 for t in body.texts):
        raise HTTPException(400, 'Text too long')
    return {'vectors': embedder().encode(body.texts, normalize_embeddings=True).tolist()}

@app.post('/rerank')
def rerank(body: Rerank):
    if any(len(t) > 12000 for t in body.texts):
        raise HTTPException(400, 'Text too long')
    return {'scores': reranker().predict([(body.query, t) for t in body.texts]).tolist()}

@app.post('/extract')
def extract(body: Source):
    try:
        data = base64.b64decode(body.content, validate=True)
        if len(data) > 5 * 1024 * 1024:
            raise ValueError()
        if body.mime == 'application/pdf':
            reader = PdfReader(io.BytesIO(data), strict=True)
            if reader.is_encrypted or len(reader.pages) > 200:
                raise ValueError()
            pages = [{'page': i + 1, 'text': p.extract_text() or ''} for i, p in enumerate(reader.pages)]
        elif body.mime == 'text/plain':
            pages = [{'page': 1, 'text': data.decode('utf-8')}]
        else:
            raise ValueError()
        if sum(len(p['text']) for p in pages) > 400_000 or any(len(p['text']) > 100_000 for p in pages):
            raise ValueError()
        if not any(p['text'].strip() for p in pages):
            raise ValueError()  # Scanned PDFs need a separately reviewed OCR pipeline.
        return {'pages': pages}
    except Exception:
        raise HTTPException(400, 'Cannot extract this source; use a text-based PDF or UTF-8 text.')

@app.post('/chunks')
def chunks(body: Pages):
    if sum(len(p.text) for p in body.pages) > 400_000:
        raise HTTPException(400, 'Source too large')
    # Repeated first/last lines are removed only when present on at least three pages.
    edges = {}
    for page in body.pages:
        lines = [s.strip() for s in page.text.splitlines() if s.strip()]
        for edge in set(lines[:1] + lines[-1:]):
            edges[edge] = edges.get(edge, 0) + 1
    output = []
    tokenizer = embedder().tokenizer
    for page in body.pages:
        clean = '\n'.join(line for line in page.text.splitlines() if edges.get(line.strip(), 0) < 3)
        sections = re.split(r'(?m)(?=^#{1,3} |^[A-Z][A-Z \-]{8,80}$)', clean)
        for section in sections:
            section = section.strip()
            if not section:
                continue
            offsets = tokenizer(section, add_special_tokens=False, return_offsets_mapping=True)['offset_mapping']
            for start in range(0, len(offsets), 290):
                end = min(start + 350, len(offsets))
                lo, hi = offsets[start][0], offsets[end - 1][1]
                parent_lo = offsets[max(0, start - 100)][0]
                parent_hi = offsets[min(len(offsets) - 1, end + 99)][1]
                output.append({'text': section[lo:hi], 'parent': section[parent_lo:parent_hi], 'page': page.page, 'section': section.splitlines()[0][:160]})
                if end == len(offsets):
                    break
    if len(output) > 500:
        raise HTTPException(400, 'Too many chunks')
    return {'chunks': output}
