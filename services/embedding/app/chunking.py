from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TextChunk:
    index: int
    content: str
    start: int
    end: int
    token_count: int


class TextChunker:
    def __init__(self, chunk_size: int, chunk_overlap: int) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split(self, text: str) -> list[TextChunk]:
        normalized = text.strip()
        if not normalized:
            return []

        chunks: list[TextChunk] = []
        start = 0
        index = 0

        while start < len(normalized):
            end = min(start + self.chunk_size, len(normalized))
            content = normalized[start:end].strip()
            if content:
                chunks.append(TextChunk(index=index, content=content, start=start, end=end, token_count=self.estimate_tokens(content)))
                index += 1
            if end == len(normalized):
                break
            start = max(end - self.chunk_overlap, start + 1)

        return chunks

    def estimate_tokens(self, content: str) -> int:
        return max(1, len(content.split()))
