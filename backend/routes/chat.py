import asyncio
import logging

from fastapi import APIRouter, HTTPException, status

from models.schemas import ChatRequest, ChatResponse
from services.chat_service import answer_question

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post(
    "/chat-with-code",
    response_model=ChatResponse,
    summary="Ask a question about your code",
    description=(
        "Accepts a code snippet and a question, sends both to the configured AI provider, "
        "and returns a helpful natural-language answer."
    ),
    status_code=status.HTTP_200_OK,
)
async def chat_with_code_endpoint(request: ChatRequest) -> ChatResponse:
    """
    POST /api/chat-with-code

    Request body:
        code       (string) — source code to discuss (max 20,000 characters)
        question   (string) — the user's question (max 2,000 characters)
        language   (string) — programming language hint (default: python)

    Returns:
        answer — the AI's natural-language response
    """
    logger.info(
        "Chat request [language=%s, question_len=%d, code_len=%d]",
        request.language, len(request.question), len(request.code),
    )

    try:
        # Run the synchronous service in a thread pool to keep the event loop free
        answer = await asyncio.to_thread(
            answer_question,
            code=request.code,
            question=request.question,
            language=request.language,
        )
        return ChatResponse(answer=answer)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected error in chat endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        ) from exc
