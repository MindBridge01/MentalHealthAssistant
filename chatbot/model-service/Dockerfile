FROM python:3.12-slim
ARG RELEASE_SHA=unknown
LABEL org.opencontainers.image.revision=${RELEASE_SHA}
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir 'torch>=2.6,<3' --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt \
    && useradd --create-home model \
    && mkdir -p /home/model/.cache/huggingface \
    && chown -R model:model /home/model/.cache
COPY app.py .
USER model
ENV HF_HOME=/home/model/.cache/huggingface
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8100", "--no-access-log"]
