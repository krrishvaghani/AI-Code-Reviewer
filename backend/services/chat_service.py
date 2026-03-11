"""
Chat with Code service.

Answers user questions about a provided code snippet using OpenAI or Gemini.
Falls back to a mock answer when USE_MOCK=true or no API key is set.
"""

import logging

from openai import OpenAI
from google import genai
from google.genai import types

from core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "You are an expert software engineer and patient code mentor. "
    "Your task is to answer questions about code clearly, accurately, and concisely. "
    "Use plain prose — no special markdown formatting is required. "
    "When it helps, include short inline code examples. "
    "Keep answers focused and under 400 words unless a detailed explanation is genuinely needed."
)

_USER_PROMPT_TEMPLATE = """Here is the {language} code under discussion:

```{language}
{code}
```

User's question: {question}

Provide a clear, helpful, and technically accurate answer."""

_MOCK_ANSWER = (
    "This function iterates over a collection and processes each element. "
    "In its current form it runs in O(n) time complexity where n is the number of elements. "
    "To optimize, consider using built-in functions or vectorized operations depending on your language.\n\n"
    "(This is a mock response — configure a real API key for AI-powered answers.)"
)


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

def answer_question(code: str, question: str, language: str = "python") -> str:
    """
    Return an AI answer to the user's question about the given code.
    Dispatches to OpenAI, Gemini, or mock based on settings.
    """
    if settings.use_mock or (not settings.openai_api_key and not settings.gemini_api_key):
        logger.info("Chat service: using mock response")
        return _MOCK_ANSWER

    provider = settings.ai_provider.lower()
    if provider == "openai" and settings.openai_api_key:
        return _answer_openai(code, question, language)
    elif settings.gemini_api_key:
        return _answer_gemini(code, question, language)
    else:
        return _MOCK_ANSWER


def _answer_openai(code: str, question: str, language: str) -> str:
    client = OpenAI(api_key=settings.openai_api_key)
    prompt = _USER_PROMPT_TEMPLATE.format(code=code, question=question, language=language)
    logger.info("Chat: sending question to OpenAI [language=%s, code_len=%d]", language, len(code))
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=1024,
    )
    return response.choices[0].message.content or ""


def _answer_gemini(code: str, question: str, language: str) -> str:
    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = _SYSTEM_PROMPT + "\n\n" + _USER_PROMPT_TEMPLATE.format(
        code=code, question=question, language=language
    )
    logger.info("Chat: sending question to Gemini [language=%s, code_len=%d]", language, len(code))
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(temperature=0.4, max_output_tokens=1024),
    )
    return response.text or ""
