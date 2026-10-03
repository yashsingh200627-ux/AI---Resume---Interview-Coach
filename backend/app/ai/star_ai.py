from typing import Dict, Any, List
from app.ai.provider import ai_provider

class STARAIService:
    @staticmethod
    async def analyze_star(question: str, answer: str, target_role: str = "") -> Dict[str, Any]:
        """
        Breaks down a behavioral answer into Situation, Task, Action, and Result components.
        Identifies missing elements without hallucinating facts.
        """
        system_prompt = (
            "You are a Master Behavioral Interview Coach specializing in the STAR technique (Situation, Task, Action, Result). "
            "Analyze the candidate's answer to the given behavioral interview question.\n"
            "RULES:\n"
            "1. Detect whether each of Situation, Task, Action, and Result is present with evidence.\n"
            "2. If an element is missing, explicitly flag it in missing_components.\n"
            "3. DO NOT invent candidate's results or fake events. In 'restructured_answer', preserve their exact narrative "
            "   while restructuring the flow into clean STAR headings and marking [YOUR MEASURABLE RESULT HERE: e.g. metric, timeline, impact] if missing.\n"
            "4. Provide actionable suggestions on how to articulate the missing components.\n"
            "5. Score the completeness and rigor from 0 to 100.\n"
            "Output ONLY valid JSON."
        )

        user_prompt = f"""
Target Role: {target_role or 'General Professional'}
Question: {question}
Candidate Answer: {answer}

Return JSON with exact keys:
{{
  "situation_present": true,
  "situation_details": "Brief snippet or explanation of their situation...",
  "task_present": true,
  "task_details": "Brief snippet or explanation of the task...",
  "action_present": true,
  "action_details": "Brief snippet or explanation of what actions were taken...",
  "result_present": false,
  "result_details": "Explanation of whether a quantifiable outcome was stated...",
  "missing_components": ["Result"],
  "restructured_answer": "STAR structured formulation preserving their words...",
  "actionable_suggestions": [
    "Quantify the outcome: What % increase or time saved was achieved?",
    "Highlight what you learned or how it impacted team velocity."
  ],
  "score": 75.0
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw = await ai_provider.generate(messages, temperature=0.2, max_tokens=1500)
        return ai_provider.extract_json(raw)
