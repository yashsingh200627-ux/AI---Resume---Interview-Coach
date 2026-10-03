import json
import re
import logging
import httpx
from typing import List, Dict, Any, AsyncGenerator, Optional
from app.config import settings
from app.ai.aura_engine import aura_engine

logger = logging.getLogger(__name__)

class AIProviderException(Exception):
    def __init__(self, message: str, status_code: int = 503):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AIProvider:
    def __init__(self):
        self.api_key = settings.AI_API_KEY
        self.base_url = settings.AI_API_BASE_URL.rstrip("/")
        self.model = settings.AI_MODEL
        self.name = getattr(settings, "AI_NAME", "Aura")
        self.full_name = getattr(settings, "AI_FULL_NAME", "Aura AI Career & Interview Coach")

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    @staticmethod
    def _prepare_multilingual_messages(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        universal_rule = (
            "\n\n==================================================\n"
            "AI ASSISTANT PERSONA & CORE OPERATING BEHAVIOR:\n"
            "You are Aura, the AI Assistant for this project ('AI Resume & Interview Coach').\n"
            "Your primary goal is to understand the user's question correctly and provide accurate, relevant, clear, and useful answers.\n\n"
            "CORE BEHAVIOR:\n"
            "1. Understand the user's complete question before answering.\n"
            "2. Answer ONLY what the user is asking.\n"
            "3. Do not make up facts, sources, results, features, or information.\n"
            "4. Never provide misleading or intentionally false information.\n"
            "5. If you are unsure about something, clearly say that you are unsure instead of guessing.\n"
            "6. If the question cannot be answered from the available information, say so clearly.\n"
            "7. If the user's question is ambiguous, ask a short clarification question instead of assuming.\n"
            "8. Give direct answers first, followed by explanation when useful.\n"
            "9. Keep answers easy to understand and naturally conversational.\n"
            "10. Do not unnecessarily repeat the user's question.\n"
            "11. Maintain context from previous messages in the conversation.\n"
            "12. If the user corrects you, acknowledge the correction and use the corrected information.\n"
            "13. Do not change previously established project information unless the user explicitly asks you to.\n"
            "14. Do not confuse similar questions or topics.\n"
            "15. Do not present guesses as facts.\n\n"
            "YES/NO QUESTIONS:\n"
            "- If the user asks a question that can be answered with Yes or No, begin with 'Yes.' or 'No.'\n"
            "- Then give a short explanation.\n"
            "- If the answer genuinely cannot be determined, say: 'It depends.' or 'I can't determine that from the information provided.'\n"
            "- Do not force a Yes/No answer when the question does not have a definite Yes/No answer.\n\n"
            "ANSWER QUALITY:\n"
            "- Give factual and logically consistent answers.\n"
            "- For technical questions, explain the reasoning when necessary.\n"
            "- For calculations, verify the calculation before answering.\n"
            "- For programming questions, provide working and logically correct code.\n"
            "- For academic questions, answer according to the requested marks/level when specified.\n"
            "- For project-related questions, use the project's actual features and information rather than inventing features.\n"
            "- When information may be outdated, state what is known reliably.\n\n"
            "CHATGPT-LIKE CONVERSATION & SAFETY:\n"
            "- Be conversational, helpful, and concise.\n"
            "- Understand follow-up questions using previous conversation context.\n"
            "- Handle greetings, explanations, comparisons, questions, corrections, and follow-ups naturally.\n"
            "- Do not respond with irrelevant information.\n"
            "- Never fabricate information just to provide an answer. When reliable information is unavailable, state: 'I don't have enough reliable information to answer that accurately.'\n\n"
            "MULTILINGUAL & GLOBAL LANGUAGE MANDATE:\n"
            "1. You are completely fluent in ALL world and regional languages, including English, Hindi (हिंदी), Marathi (मराठी), Gujarati (ગુજરાતી), Tamil (தமிழ்), Telugu (తెలుగు), Spanish (Español), French (Français), German (Deutsch), and code-mixed formats (Hinglish, Marathish).\n"
            "2. If the user asks or tells you to speak/talk/reply in a specific language (e.g. 'can we talk in marathi', 'so talk in marathi', 'talk in marathi', 'marathit bola', 'hindi me bolo', 'habla en español'), you MUST IMMEDIATELY switch to that requested language and conduct the entire conversation in that language.\n"
            "3. Answer, advise, and converse fluently in the EXACT same language/dialect that the user is using or requested.\n"
            "4. NEVER fall back to English when the user has chosen or requested another language.\n"
            "5. For Yes/No questions in Hindi, start with 'हाँ।' or 'नहीं।' or 'यह इस बात पर निर्भर करता है कि...'.\n"
            "6. For Yes/No questions in Marathi, start with 'होय.' or 'नाही.' or 'हे यावर अवलंबून आहे की...'.\n"
            "7. MANDATORY JSON COMPATIBILITY RULE: If generating structured JSON output, all JSON keys/field names MUST strictly remain in English to maintain frontend parsing compatibility, while all values, descriptions, feedback messages, evaluations, and career guidance must be generated in the user's corresponding language.\n"
            "=================================================="
        )
        prepared = [dict(m) for m in messages]
        found_system = False
        for msg in prepared:
            if msg.get("role") == "system":
                msg["content"] = str(msg.get("content", "")) + universal_rule
                found_system = True
                break
        if not found_system:
            prepared.insert(0, {"role": "system", "content": universal_rule.strip()})
        return prepared

    async def generate(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        # If API key is provided, attempt live cloud LLM API
        if self.is_configured():
            headers = {
                "Authorization": f"Bearer {self.api_key.strip()}",
                "Content-Type": "application/json"
            }
            
            prepared_messages = self._prepare_multilingual_messages(messages)
            
            payload: Dict[str, Any] = {
                "model": self.model,
                "messages": prepared_messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            if response_format:
                payload["response_format"] = response_format

            try:
                async with httpx.AsyncClient(timeout=40.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    if response.status_code == 200:
                        data = response.json()
                        choices = data.get("choices", [])
                        if choices:
                            return choices[0]["message"]["content"]
                    logger.warning(f"External AI API returned status {response.status_code}. Seamlessly engaging Aura autonomous engine.")
            except Exception as e:
                logger.warning(f"External AI API communication failed ({e}). Seamlessly engaging Aura autonomous engine.")

        # Autonomous Engine Execution (Zero-downtime, fully intelligent fallback)
        return await aura_engine.generate(messages)

    async def stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> AsyncGenerator[str, None]:
        # If API key is provided, attempt live cloud LLM streaming
        if self.is_configured():
            headers = {
                "Authorization": f"Bearer {self.api_key.strip()}",
                "Content-Type": "application/json"
            }
            
            prepared_messages = self._prepare_multilingual_messages(messages)
            
            payload = {
                "model": self.model,
                "messages": prepared_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    ) as response:
                        if response.status_code == 200:
                            streamed_any = False
                            async for line in response.aiter_lines():
                                line = line.strip()
                                if not line:
                                    continue
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    if data_str == "[DONE]":
                                        break
                                    try:
                                        chunk = json.loads(data_str)
                                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                                        content = delta.get("content", "")
                                        if content:
                                            streamed_any = True
                                            yield content
                                    except json.JSONDecodeError:
                                        continue
                            if streamed_any:
                                return
                        logger.warning(f"External streaming returned {response.status_code}. Falling back to Aura autonomous stream.")
            except Exception as e:
                logger.warning(f"External stream exception: {e}. Falling back to Aura autonomous stream.")

        # Autonomous Stream Execution
        async for chunk in aura_engine.stream(messages):
            yield chunk

    @staticmethod
    def extract_json(content: str) -> Dict[str, Any]:
        """Extract and parse JSON from LLM response whether in markdown code block or raw string."""
        cleaned = content.strip()
        # Look for ```json ... ``` or ``` ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Try to locate the outermost { ... }
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(cleaned[start:end+1])
                except json.JSONDecodeError:
                    pass
            # Try outermost [ ... ]
            start_arr = cleaned.find("[")
            end_arr = cleaned.rfind("]")
            if start_arr != -1 and end_arr != -1 and end_arr > start_arr:
                try:
                    return json.loads(cleaned[start_arr:end_arr+1])
                except json.JSONDecodeError:
                    pass
            raise AIProviderException(f"Failed to parse structured JSON from AI output: {content[:150]}...")

ai_provider = AIProvider()
