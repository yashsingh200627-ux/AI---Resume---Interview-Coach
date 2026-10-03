from typing import Dict, Any, List, AsyncGenerator
from app.ai.provider import ai_provider

class CareerAIService:
    @staticmethod
    def _build_user_context_string(user_data: Dict[str, Any]) -> str:
        profile = user_data.get("profile", {})
        skills = [s.get("name") for s in user_data.get("skills", [])]
        experiences = user_data.get("experiences", [])
        educations = user_data.get("educations", [])
        target_role = user_data.get("target_job_role", "Software Engineer")
        experience_level = user_data.get("experience_level", "Mid-Level")

        exp_str = "; ".join([
            f"{e.get('job_title')} at {e.get('company')} ({e.get('start_date')}-{e.get('end_date')})"
            for e in experiences
        ])
        edu_str = "; ".join([
            f"{ed.get('degree')} from {ed.get('institution')}" for ed in educations
        ])

        return (
            f"Candidate Name: {user_data.get('full_name')}\n"
            f"Target Role: {target_role}\n"
            f"Experience Level: {experience_level}\n"
            f"Headline/Summary: {profile.get('headline', '')} - {profile.get('summary', '')}\n"
            f"Recorded Skills: {', '.join(skills) if skills else 'None recorded yet'}\n"
            f"Work Experience History: {exp_str if exp_str else 'None recorded yet'}\n"
            f"Education: {edu_str if edu_str else 'None recorded yet'}\n"
            f"Interview History Stats: {user_data.get('interview_stats', 'No sessions completed yet')}\n"
            f"Resume ATS Score: {user_data.get('latest_ats_score', 'No ATS scan yet')}\n"
        )

    @staticmethod
    async def chat_stream(
        user_message: str,
        conversation_history: List[Dict[str, str]],
        user_context: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Streams real-time personalized career mentoring advice anchored on user's actual profile."""
        context_str = CareerAIService._build_user_context_string(user_context)

        system_prompt = (
            "You are an Elite Executive Career Coach & Talent Strategist at 'AI Resume & Interview Coach'.\n"
            "Your advice MUST be personalized to the candidate's exact background, verified skills, and target role.\n"
            "CRITICAL RULES:\n"
            "- NEVER give generic boilerplate when specific details are present in the user profile.\n"
            "- Address their actual strengths and real gaps directly.\n"
            "- Be motivating, pragmatic, tactical, and strategic.\n"
            "- If they ask what skills to learn, examine what skills they already have and specify the missing high-leverage ones.\n\n"
            f"CANDIDATE DOSSIER:\n{context_str}"
        )

        messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation_history[-6:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        async for chunk in ai_provider.stream(messages, temperature=0.7, max_tokens=1500):
            yield chunk

    @staticmethod
    async def generate_career_roadmap(
        target_role: str,
        timeline_months: int,
        user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generates a structured, phased career transition or promotion roadmap based on actual user profile."""
        context_str = CareerAIService._build_user_context_string(user_context)

        system_prompt = (
            "You are a Career Architect and Strategic Executive Coach. "
            "Generate an actionable, phased career roadmap and skill gap breakdown. "
            "Base every phase on bridging the candidate's current background to their desired target role.\n"
            "Output ONLY valid JSON."
        )

        user_prompt = f"""
Target Role: {target_role}
Timeline: {timeline_months} Months

{context_str}

Return JSON with structure:
{{
  "target_role": "{target_role}",
  "readiness_score": 75.0,
  "summary": "Strategic executive summary of transition pathway...",
  "key_skill_gaps": [
    {{
      "skill_name": "...",
      "importance": "Critical",
      "recommended_action": "..."
    }}
  ],
  "phases": [
    {{
      "phase_number": 1,
      "title": "Phase 1: Foundation & Skill Deepening",
      "duration": "Months 1-2",
      "goals": ["...", "..."],
      "action_items": ["...", "..."]
    }},
    {{
      "phase_number": 2,
      "title": "Phase 2: Portfolio & High-Impact Projects",
      "duration": "Months 3-4",
      "goals": ["...", "..."],
      "action_items": ["...", "..."]
    }},
    {{
      "phase_number": 3,
      "title": "Phase 3: Targeted Applications & Mock Interviews",
      "duration": "Months 5-6",
      "goals": ["...", "..."],
      "action_items": ["...", "..."]
    }}
  ],
  "certifications_recommended": ["...", "..."],
  "weekly_routine_suggestion": "Suggested weekly time allocation and study routine..."
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw = await ai_provider.generate(messages, temperature=0.4, max_tokens=2200)
        return ai_provider.extract_json(raw)
