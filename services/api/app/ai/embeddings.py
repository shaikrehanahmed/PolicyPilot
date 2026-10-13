import logging
from typing import List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("policypilot.ai.embeddings")


async def generate_embedding(text: str) -> Optional[List[float]]:
    """Generates a 768-dimensional vector embedding using gemini-embedding-2.
    Returns None if GEMINI_API_KEY is not configured or if API fails.
    """
    api_key = settings.effective_gemini_api_key
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.embedding_model}:embedContent?key={api_key}"
    payload = {
        "model": f"models/{settings.embedding_model}",
        "content": {
            "parts": [{"text": text}]
        },
        "outputDimensionality": settings.embedding_dim,  # explicitly 768
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                embedding = data.get("embedding", {}).get("values")
                if embedding:
                    if len(embedding) == settings.embedding_dim:
                        return [float(x) for x in embedding]
                    logger.warning(
                        f"Embedding dimension mismatch: expected {settings.embedding_dim}, got {len(embedding)}"
                    )
            else:
                logger.warning(f"Gemini embedding API returned status {resp.status_code}")
    except Exception as e:
        logger.warning(f"Gemini embedding call failed: {e}")

    return None
