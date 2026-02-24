FROM python:3.12-slim

WORKDIR /app

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    bash curl git \
 && rm -rf /var/lib/apt/lists/*

CMD ["sleep", "infinity"]
