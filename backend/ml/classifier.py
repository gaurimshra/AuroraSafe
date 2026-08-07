import json
import logging
import asyncio
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Default classification when AI fails
DEFAULT_CLASSIFICATION = {
    "incident_type": "suspicious_activity",
    "severity": 5,
    "threat_category": "public_safety",
    "confidence": 0.3,
    "summary": "Incident reported by community member. Awaiting AI analysis.",
    "is_credible": True
}

def _call_gemini_sync(description: str) -> Dict[str, Any]:
    """Synchronous Gemini call — runs in thread pool to not block event loop."""
    try:
        # Try new google-genai SDK first (v1.x)
        try:
            from google import genai
            from config import settings
            if not settings.GEMINI_API_KEY:
                logger.warning("GEMINI_API_KEY not set")
                return DEFAULT_CLASSIFICATION.copy()

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            prompt = f"""You are a public safety AI assistant for AuroraSafe, a women's safety platform.
Analyze this incident report and classify it accurately.

Incident Report: "{description}"

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "incident_type": "theft|assault|harassment|suspicious_activity|vandalism|accident|other",
  "severity": <integer 1-10 where 1=minor, 10=critical>,
  "threat_category": "violent_crime|property_crime|public_safety|harassment|other",
  "confidence": <float 0.0-1.0>,
  "summary": "<one sentence professional summary>",
  "is_credible": <true|false>
}}

Rule 1: Be extremely accurate. 
Rule 2: Severity definitions: 1-3 (verbal/suspicion), 4-6 (theft/groping/harassment), 7-9 (assault/weapons), 10 (fatality/critical).
Rule 3: Only classify as violent_crime for actual physical violence or verifiable threats."""

            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            text = response.text.strip()

        except ImportError:
            # Fall back to old google-generativeai SDK (v0.x)
            import google.generativeai as genai
            from config import settings
            if not settings.GEMINI_API_KEY:
                logger.warning("GEMINI_API_KEY not set")
                return DEFAULT_CLASSIFICATION.copy()

            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')

            prompt = f"""You are a public safety AI assistant for AuroraSafe, a women's safety platform.
Analyze this incident report and classify it accurately.

Incident Report: "{description}"

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "incident_type": "theft|assault|harassment|suspicious_activity|vandalism|accident|other",
  "severity": <integer 1-10 where 1=minor, 10=critical>,
  "threat_category": "violent_crime|property_crime|public_safety|harassment|other",
  "confidence": <float 0.0-1.0>,
  "summary": "<one sentence professional summary>",
  "is_credible": <true|false>
}}

Rule 1: Be extremely accurate. 
Rule 2: Severity definitions: 1-3 (verbal/suspicion), 4-6 (theft/groping/harassment), 7-9 (assault/weapons), 10 (fatality/critical).
Rule 3: Only classify as violent_crime for actual physical violence or verifiable threats."""

            response = model.generate_content(prompt)
            text = response.text.strip()

        # Clean any markdown code blocks
        if text.startswith('```'):
            lines = text.split('\n')
            # Remove first and last lines (``` markers)
            text = '\n'.join(lines[1:-1]) if lines[-1].strip() == '```' else '\n'.join(lines[1:])
            if text.startswith('json'):
                text = text[4:]

        result = json.loads(text.strip())
        # Validate and clamp values
        result['severity'] = max(1, min(10, int(result.get('severity', 5))))
        result['confidence'] = max(0.0, min(1.0, float(result.get('confidence', 0.5))))
        result['incident_type'] = result.get('incident_type', 'other')
        result['threat_category'] = result.get('threat_category', 'other')
        result['summary'] = result.get('summary', 'Incident classified by AI.')
        result['is_credible'] = bool(result.get('is_credible', True))
        logger.info(f"Gemini classified: {result['incident_type']} severity={result['severity']}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error from Gemini response: {e}")
        return DEFAULT_CLASSIFICATION.copy()
    except Exception as e:
        logger.error(f"Gemini classification failed: {type(e).__name__}: {e}")
        return DEFAULT_CLASSIFICATION.copy()


async def classify_incident(description: str) -> Dict[str, Any]:
    """
    Use Gemini to classify an incident report.
    Runs the synchronous SDK call in a thread pool to not block the event loop.
    """
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _call_gemini_sync, description)
        return result
    except Exception as e:
        logger.error(f"classify_incident wrapper error: {e}")
        return DEFAULT_CLASSIFICATION.copy()
