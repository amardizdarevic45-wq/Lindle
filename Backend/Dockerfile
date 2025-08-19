FROM python:3.9-slim

WORKDIR /lindle

# Build-time version metadata
ARG BACKEND_VERSION=dev
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ARG ENVIRONMENT=dev

# Runtime environment variables
ENV BACKEND_VERSION=$BACKEND_VERSION \
    GIT_SHA=$GIT_SHA \
    BUILD_TIME=$BUILD_TIME \
    ENVIRONMENT=$ENVIRONMENT

COPY requirements.txt /lindle/requirements.txt

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    pip install --no-cache-dir --upgrade -r /lindle/requirements.txt && \
    apt-get remove -y build-essential && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* /root/.cache

COPY . /lindle/

CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "80"]