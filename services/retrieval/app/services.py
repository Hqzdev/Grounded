from __future__ import annotations

from app.answers import AnswerEvidence, LocalExtractiveAnswerProvider
from app.embeddings import LocalEmbeddingProvider
from app.errors import RetrievalError
from app.qdrant import QdrantSearch
from app.repositories import RetrievalRepository
from app.schemas import AnswerResponse, CitationResponse, QuestionRequest


class RetrievalService:
    def __init__(
        self,
        repository: RetrievalRepository,
        embeddings: LocalEmbeddingProvider,
        search: QdrantSearch,
        answers: LocalExtractiveAnswerProvider,
    ) -> None:
        self.repository = repository
        self.embeddings = embeddings
        self.search = search
        self.answers = answers

    async def answer(self, tenant_id: str, user_id: str, request: QuestionRequest) -> AnswerResponse:
        vector = self.embeddings.embed(request.question)
        hits = self.search.search(tenant_id, vector)
        chunks = await self.repository.load_chunks(tenant_id, [hit.chunk_id for hit in hits])
        evidence = self.evidence(chunks, hits)

        if not evidence:
            raise RetrievalError.no_evidence()

        answer = self.answers.answer(request.question, evidence)

        try:
            session = await self.repository.ensure_session(tenant_id, user_id, request.session_id, request.question)
            user_message = await self.repository.create_message(tenant_id, session["id"], user_id, "user", request.question)
            assistant_message = await self.repository.create_message(tenant_id, session["id"], None, "assistant", answer.content, answer.provider, answer.model)
            citations = []

            for item in evidence:
                snippet = self.answers.snippet(item.chunk["content"])
                await self.repository.create_citation(tenant_id, assistant_message["id"], item.chunk, item.hit.score, snippet)
                citations.append(
                    CitationResponse(
                        document_id=item.chunk["documentId"],
                        document_title=item.chunk["documentTitle"],
                        chunk_id=item.chunk["id"],
                        snippet=snippet,
                        score=item.hit.score,
                        source_start=item.chunk["sourceStart"],
                        source_end=item.chunk["sourceEnd"],
                    )
                )

            await self.repository.create_usage(
                tenant_id,
                user_id,
                assistant_message["id"],
                answer.provider,
                answer.model,
                self.answers.count_tokens(request.question),
                self.answers.count_tokens(answer.content),
            )
            await self.repository.touch_session(session["id"])
            await self.repository.commit()
        except Exception:
            await self.repository.rollback()
            raise

        return AnswerResponse(
            session_id=session["id"],
            user_message_id=user_message["id"],
            assistant_message_id=assistant_message["id"],
            answer=answer.content,
            citations=citations,
            created_at=assistant_message["createdAt"],
        )

    def evidence(self, chunks: list[dict], hits) -> list[AnswerEvidence]:
        chunks_by_id = {chunk["id"]: chunk for chunk in chunks}
        return [AnswerEvidence(chunk=chunks_by_id[hit.chunk_id], hit=hit) for hit in hits if hit.chunk_id in chunks_by_id]
