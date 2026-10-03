from typing import Dict, Any, List, Optional
from app.ai.provider import ai_provider

class InterviewAIService:
    @staticmethod
    async def generate_initial_question(
        target_role: str,
        experience_level: str,
        interview_type: str,
        difficulty: str
    ) -> Dict[str, Any]:
        """Generates the opening interview question tailored to role, type, and difficulty."""
        system_prompt = (
            f"You are an expert executive interviewer conducting a {difficulty}-level {interview_type} interview "
            f"for a '{target_role}' candidate with '{experience_level}' experience.\n"
            "Generate an engaging, realistic, and challenging opening interview question.\n"
            "Return valid JSON only."
        )

        user_prompt = f"""
Role: {target_role}
Level: {experience_level}
Type: {interview_type}
Difficulty: {difficulty}

Return JSON with:
{{
  "question_text": "Engaging, professional opening question...",
  "question_type": "{interview_type}",
  "expected_topics": ["topic1", "topic2", "topic3"]
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        raw = await ai_provider.generate(messages, temperature=0.6, max_tokens=600)
        return ai_provider.extract_json(raw)

    @staticmethod
    async def evaluate_answer_and_generate_next(
        target_role: str,
        interview_type: str,
        difficulty: str,
        question_text: str,
        answer_text: str,
        previous_qa_context: List[Dict[str, str]],
        current_question_number: int,
        total_questions: int
    ) -> Dict[str, Any]:
        """
        Analyzes the user's real answer on:
        - Content (did they answer the question?)
        - Technical Accuracy
        - Communication (clarity)
        - Structure (organization)
        - Relevance (on-topic)
        - STAR components if behavioral/situational
        - Strengths & actionable improvements
        - Generates follow-up or the next question
        """
        is_last_question = current_question_number >= total_questions

        system_prompt = (
            "You are an elite AI Interviewer and Executive Assessor. "
            "You are evaluating a candidate's answer in a live real-time interview.\n"
            "CRITICAL RULES:\n"
            "1. Evaluate strictly based on the substance of their provided answer. Never invent what they did not say.\n"
            "2. Score from 0.0 to 10.0 for Content, Technical Accuracy, Communication, Structure, Relevance, and Overall.\n"
            "3. If this is a behavioral or situational question, evaluate Situation, Task, Action, Result (STAR) explicitly.\n"
            "4. Do NOT claim to detect psychological states or emotions from text. Evaluate communication clarity and phrasing.\n"
            f"5. {'Since this is the final question, do not generate a next question (next_question: null).' if is_last_question else 'Generate the next logical question or targeted follow-up question for question ' + str(current_question_number + 1) + '.'}\n"
            "6. Output ONLY valid JSON matching the exact schema."
        )

        history_summary = "\n".join([
            f"Q: {qa.get('question')}\nA: {qa.get('answer')}" for qa in previous_qa_context[-3:]
        ])

        user_prompt = f"""
Candidate Target Role: {target_role}
Interview Type: {interview_type}
Difficulty: {difficulty}
Question #{current_question_number} of {total_questions}

QUESTION ASKED:
"{question_text}"

CANDIDATE ANSWER:
"{answer_text}"

Prior Context:
{history_summary if history_summary else "Opening of interview."}

Evaluate and return JSON:
{{
  "overall_score": 0.0,
  "content_score": 0.0,
  "technical_score": 0.0,
  "communication_score": 0.0,
  "structure_score": 0.0,
  "relevance_score": 0.0,
  "feedback_text": "Direct, constructive, professional evaluation of what was answered...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "follow_up_question": "A clarifying follow-up probe or elaboration request (optional)",
  "star_evaluation": {{
    "situation": true,
    "task": true,
    "action": true,
    "result": false,
    "missing": "Result",
    "suggestion": "Include measurable metrics or specific business outcome."
  }},
  "next_question": { "null" if is_last_question else '{"question_text": "Next interview question...", "question_type": "' + interview_type + '", "expected_topics": ["topicA", "topicB"]}' }
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw = await ai_provider.generate(messages, temperature=0.5, max_tokens=1800)
        result = ai_provider.extract_json(raw)

        # Normalize scores to 0-10 or 0-100 scale (let's keep 0-10 for individual answers)
        for key in ["overall_score", "content_score", "technical_score", "communication_score", "structure_score", "relevance_score"]:
            val = float(result.get(key, 7.0))
            if val > 10.0:
                val = val / 10.0
            result[key] = max(0.0, min(10.0, round(val, 1)))

        return result

    @staticmethod
    async def generate_final_report(
        session_id: str,
        target_role: str,
        interview_type: str,
        difficulty: str,
        qa_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Synthesizes the complete interview transcript into a comprehensive final evaluation report."""
        system_prompt = (
            "You are a Senior Hiring Committee Chair. Produce a comprehensive, definitive interview report "
            "based strictly on the candidate's answers and evaluations recorded during this session.\n"
            "Output ONLY valid JSON."
        )

        qa_formatted = []
        for i, item in enumerate(qa_history, 1):
            qa_formatted.append(
                f"Question {i}: {item.get('question')}\n"
                f"Answer: {item.get('answer')}\n"
                f"Evaluation: Overall {item.get('score', 'N/A')}/10, Feedback: {item.get('feedback', '')}\n"
            )

        user_prompt = f"""
Role: {target_role}
Interview Type: {interview_type}
Difficulty: {difficulty}

SESSION TRANSCRIPT:
{chr(10).join(qa_formatted)}

Produce final report JSON:
{{
  "overall_score": 0.0,
  "content_score": 0.0,
  "technical_score": 0.0,
  "communication_score": 0.0,
  "structure_score": 0.0,
  "relevance_score": 0.0,
  "summary_strengths": ["...", "..."],
  "summary_improvements": ["...", "..."],
  "recommended_practice": [
    "Practice dynamic system design trade-offs",
    "Strengthen STAR format when discussing past conflicts"
  ],
  "final_report": "Executive narrative summarizing candidate readiness, standout moments, and hire recommendation."
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw = await ai_provider.generate(messages, temperature=0.3, max_tokens=2200)
        result = ai_provider.extract_json(raw)
        
        # Scale scores to 0-100 for the final session aggregate
        for key in ["overall_score", "content_score", "technical_score", "communication_score", "structure_score", "relevance_score"]:
            val = float(result.get(key, 75.0))
            if val <= 10.0:
                val = val * 10.0
            result[key] = max(0.0, min(100.0, round(val, 1)))

        return result
