FROM python:3.12-slim

ARG SERVICE_PATH

WORKDIR /app

COPY ${SERVICE_PATH}/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY ${SERVICE_PATH}/app ./app

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
