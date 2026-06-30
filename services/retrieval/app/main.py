from typing import Annotated
from fastapi import Depends, FastAPI
from app.dependencies import current_claims, retrieval_service
from app.schemas import AnswerResponse, QuestionRequest
from app.services import RetrievalService


app = FastAPI(title="Grounded Retrieval Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "retrieval", "status": "ok"}


@app.post("/questions")
async def answer_question(
    request: QuestionRequest,
    claims: Annotated[dict, Depends(current_claims)],
    service: Annotated[RetrievalService, Depends(retrieval_service)],
) -> AnswerResponse:
    return await service.answer(claims["tid"], claims["sub"], request)
