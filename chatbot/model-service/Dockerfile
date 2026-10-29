FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home model
COPY app.py .
USER model
ENV HF_HOME=/home/model/.cache/huggingface
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8100", "--no-access-log"]
