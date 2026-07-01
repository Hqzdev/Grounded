from __future__ import annotations

from hashlib import blake2b
from math import sqrt
import re
import httpx


class LocalEmbeddingProvider:
    def __init__(self, dimensions: int, model: str) -> None:
        self.dimensions = dimensions
        self.provider = "local"
        self.model = model

    def embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dimensions
        tokens = re.findall(r"[a-zA-Z0-9]+", text.lower())

        for token in tokens:
            digest = blake2b(token.encode("utf-8"), digest_size=8).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign

        magnitude = sqrt(sum(value * value for value in vector))
        if magnitude == 0:
            return vector
        return [value / magnitude for value in vector]


class OpenAIEmbeddingProvider(LocalEmbeddingProvider):
    def __init__(self, dimensions: int, model: str, api_key: str, base_url: str) -> None:
        self.dimensions = dimensions
        self.provider = "openai"
        self.model = model
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(timeout=30.0)

    def embed(self, text: str) -> list[float]:
        response = self.client.post(
            f"{self.base_url}/embeddings",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json={
                "model": self.model,
                "input": text,
                "dimensions": self.dimensions,
            },
        )
        response.raise_for_status()
        return [float(value) for value in response.json()["data"][0]["embedding"]]


class OllamaEmbeddingProvider(LocalEmbeddingProvider):
    def __init__(self, dimensions: int, model: str, base_url: str) -> None:
        self.dimensions = dimensions
        self.provider = "ollama"
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.client = httpx.Client(timeout=60.0)

    def embed(self, text: str) -> list[float]:
        response = self.client.post(
            f"{self.base_url}/api/embed",
            json={"model": self.model, "input": text},
        )
        response.raise_for_status()
        payload = response.json()
        embedding = payload.get("embeddings", [payload.get("embedding")])[0]
        return [float(value) for value in embedding]


def create_embedding_provider(provider: str, model: str, dimensions: int, openai_api_key: str, openai_base_url: str, ollama_base_url: str) -> LocalEmbeddingProvider:
    if provider == "local":
        return LocalEmbeddingProvider(dimensions, model)
    if provider == "openai":
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY is required for EMBEDDING_PROVIDER=openai")
        resolved_model = "text-embedding-3-small" if model == "local-hash-v1" else model
        return OpenAIEmbeddingProvider(dimensions, resolved_model, openai_api_key, openai_base_url)
    if provider == "ollama":
        resolved_model = "nomic-embed-text" if model == "local-hash-v1" else model
        return OllamaEmbeddingProvider(dimensions, resolved_model, ollama_base_url)
    raise ValueError(f"Unsupported embedding provider: {provider}")
