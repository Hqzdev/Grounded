from __future__ import annotations

from dataclasses import dataclass
import re
import httpx
from app.qdrant import SearchHit


@dataclass(frozen=True)
class AnswerEvidence:
    chunk: dict
    hit: SearchHit


@dataclass(frozen=True)
class AnswerResult:
    content: str
    provider: str
    model: str


class LocalExtractiveAnswerProvider:
    def __init__(self, model: str) -> None:
        self.provider = "local"
        self.model = model

    def answer(self, question: str, evidence: list[AnswerEvidence]) -> AnswerResult:
        statements = self.best_statements(question, evidence)
        if not statements:
            statements = [self.snippet(item.chunk["content"]) for item in evidence[:3]]
        bullets = "\n".join(f"- {statement}" for statement in statements[:4])
        return AnswerResult(
            content=f"I found this in the indexed sources:\n{bullets}",
            provider=self.provider,
            model=self.model,
        )

    def best_statements(self, question: str, evidence: list[AnswerEvidence]) -> list[str]:
        question_terms = self.terms(question)
        ranked: list[tuple[float, str]] = []

        for item in evidence:
            for sentence in self.sentences(item.chunk["content"]):
                sentence_terms = self.terms(sentence)
                overlap = len(question_terms.intersection(sentence_terms))
                density = overlap / max(1, len(sentence_terms))
                ranked.append((overlap + density + item.hit.score, sentence))

        ranked.sort(key=lambda item: item[0], reverse=True)
        selected: list[str] = []
        seen: set[str] = set()

        for _, sentence in ranked:
            key = sentence.lower()
            if key in seen:
                continue
            seen.add(key)
            selected.append(sentence)
            if len(selected) == 4:
                break

        return selected

    def sentences(self, content: str) -> list[str]:
        normalized = " ".join(content.split())
        parts = re.split(r"(?<=[.!?])\s+", normalized)
        return [part.strip()[:420] for part in parts if len(part.strip()) > 8]

    def terms(self, content: str) -> set[str]:
        stop_words = {"a", "an", "and", "are", "as", "at", "be", "by", "does", "for", "from", "in", "is", "it", "of", "on", "or", "the", "this", "to", "what", "with"}
        return {term for term in re.findall(r"[a-zA-Z0-9]+", content.lower()) if term not in stop_words and len(term) > 2}

    def snippet(self, content: str) -> str:
        normalized = " ".join(content.split())
        return normalized[:700]

    def count_tokens(self, content: str) -> int:
        return max(1, len(content.split()))


class OpenAIAnswerProvider(LocalExtractiveAnswerProvider):
    def __init__(self, model: str, api_key: str, base_url: str, temperature: float) -> None:
        self.provider = "openai"
        self.model = model
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.temperature = temperature
        self.client = httpx.Client(timeout=45.0)

    def answer(self, question: str, evidence: list[AnswerEvidence]) -> AnswerResult:
        context = self.context(evidence)
        response = self.client.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json={
                "model": self.model,
                "temperature": self.temperature,
                "messages": [
                    {
                        "role": "system",
                        "content": "Answer only from the provided source excerpts. If the excerpts do not support an answer, say that the indexed sources do not contain enough evidence.",
                    },
                    {
                        "role": "user",
                        "content": f"Question:\n{question}\n\nSource excerpts:\n{context}",
                    },
                ],
            },
        )
        response.raise_for_status()
        payload = response.json()
        content = payload["choices"][0]["message"]["content"].strip()
        return AnswerResult(content=content, provider=self.provider, model=self.model)

    def context(self, evidence: list[AnswerEvidence]) -> str:
        return "\n\n".join(
            f"[{index + 1}] {item.chunk['documentTitle']}\n{self.snippet(item.chunk['content'])}"
            for index, item in enumerate(evidence)
        )


class OllamaAnswerProvider(LocalExtractiveAnswerProvider):
    def __init__(self, model: str, base_url: str, temperature: float) -> None:
        self.provider = "ollama"
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.temperature = temperature
        self.client = httpx.Client(timeout=90.0)

    def answer(self, question: str, evidence: list[AnswerEvidence]) -> AnswerResult:
        context = self.context(evidence)
        response = self.client.post(
            f"{self.base_url}/api/chat",
            json={
                "model": self.model,
                "stream": False,
                "options": {"temperature": self.temperature},
                "messages": [
                    {
                        "role": "system",
                        "content": "Answer only from the provided source excerpts. If the excerpts do not support an answer, say that the indexed sources do not contain enough evidence.",
                    },
                    {
                        "role": "user",
                        "content": f"Question:\n{question}\n\nSource excerpts:\n{context}",
                    },
                ],
            },
        )
        response.raise_for_status()
        payload = response.json()
        content = payload["message"]["content"].strip()
        return AnswerResult(content=content, provider=self.provider, model=self.model)

    def context(self, evidence: list[AnswerEvidence]) -> str:
        return "\n\n".join(
            f"[{index + 1}] {item.chunk['documentTitle']}\n{self.snippet(item.chunk['content'])}"
            for index, item in enumerate(evidence)
        )


def create_answer_provider(provider: str, model: str, openai_api_key: str, openai_base_url: str, ollama_base_url: str, temperature: float) -> LocalExtractiveAnswerProvider:
    if provider == "local":
        return LocalExtractiveAnswerProvider(model)
    if provider == "openai":
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY is required for ANSWER_PROVIDER=openai")
        resolved_model = "gpt-4o-mini" if model == "local-extractive-v1" else model
        return OpenAIAnswerProvider(resolved_model, openai_api_key, openai_base_url, temperature)
    if provider == "ollama":
        resolved_model = "llama3.2" if model == "local-extractive-v1" else model
        return OllamaAnswerProvider(resolved_model, ollama_base_url, temperature)
    raise ValueError(f"Unsupported answer provider: {provider}")
