from typing import Dict, Any, List
from app.ai.provider import ai_provider

class ResumeAIService:
    @staticmethod
    async def generate_resume_content(
        profile_data: Dict[str, Any],
        target_role: str,
        experience_level: str = "Mid-Level",
        focus_keywords: List[str] = None,
        user_notes: str = ""
    ) -> Dict[str, Any]:
        """
        Uses real AI to polish, structure, and quantify user's actual profile data for the target role.
        Preserves truthful facts while improving phrasing, grammar, keywords, and action verbs.
        """
        user_context = {
            "personal_info": profile_data.get("personal_info", {}),
            "summary": profile_data.get("summary", ""),
            "experiences": profile_data.get("experiences", []),
            "educations": profile_data.get("educations", []),
            "skills": profile_data.get("skills", []),
            "projects": profile_data.get("projects", []),
            "certifications": profile_data.get("certifications", []),
            "target_role": target_role,
            "experience_level": experience_level,
            "focus_keywords": focus_keywords or [],
            "user_notes": user_notes
        }

        system_prompt = (
            "You are an elite, ATS-certified Resume Writer and Career Strategist. "
            "Your task is to take the user's real background and generate an optimized, high-impact resume content structure in valid JSON. "
            "CRITICAL RULES:\n"
            "1. NEVER invent employers, educational degrees, or fake certifications. Strictly build upon the user's provided profile.\n"
            "2. Elevate experience bullets using strong action verbs (e.g., 'Spearheaded', 'Architected', 'Accelerated') and quantify impact where reasonable.\n"
            "3. Organize skills cleanly into categories: Technical, Tools, Technologies, Soft Skills.\n"
            "4. Formulate a compelling 3-4 sentence Professional Summary tailored directly to the target role.\n"
            "5. Include relevant industry keywords suitable for ATS scanning.\n"
            "6. Output ONLY valid JSON matching the exact schema."
        )

        user_prompt = f"""
Target Job Role: {target_role}
Experience Level: {experience_level}
Additional Notes: {user_notes}
Focus Keywords: {', '.join(focus_keywords or [])}

User Provided Data:
{user_context}

Return a JSON object with this exact structure:
{{
  "personal_info": {{
    "full_name": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "linkedin": "...",
    "github": "...",
    "portfolio": "..."
  }},
  "summary": "Compelling tailored executive summary...",
  "skills": {{
    "Technical": ["...", "..."],
    "Tools & Frameworks": ["...", "..."],
    "Soft Skills": ["...", "..."]
  }},
  "experiences": [
    {{
      "company": "...",
      "job_title": "...",
      "location": "...",
      "start_date": "...",
      "end_date": "...",
      "is_current": false,
      "responsibilities": [
        "Action-driven bullet point with metrics...",
        "..."
      ],
      "achievements": [
        "Key quantifiable achievement statement..."
      ]
    }}
  ],
  "projects": [
    {{
      "name": "...",
      "description": "...",
      "technologies": "...",
      "results": "Quantifiable outcome or user metric..."
    }}
  ],
  "educations": [
    {{
      "degree": "...",
      "institution": "...",
      "start_year": "...",
      "end_year": "...",
      "grade": "..."
    }}
  ],
  "certifications": [
    {{
      "name": "...",
      "issuing_organization": "...",
      "issue_date": "..."
    }}
  ],
  "ats_keywords": ["keyword1", "keyword2", "keyword3"]
}}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw_response = await ai_provider.generate(messages, temperature=0.5, max_tokens=3000)
        return ai_provider.extract_json(raw_response)

    @staticmethod
    async def improve_bullet_point(bullet: str, target_role: str) -> Dict[str, Any]:
        """Rewrites a single bullet point into measurable, high-impact statements."""
        prompt = (
            f"You are a resume editor. Improve this bullet point for a '{target_role}' role: '{bullet}'.\n"
            "Provide:\n"
            "1. Improved action-verb version with placeholder [X%] or quantified metrics\n"
            "2. Concise version\n"
            "3. Reason for improvement\n"
            "Return JSON: {\"improved\": \"...\", \"concise\": \"...\", \"reason\": \"...\"}"
        )
        messages = [
            {"role": "system", "content": "You are a professional resume bullet optimizer. Return only JSON."},
            {"role": "user", "content": prompt}
        ]
        raw = await ai_provider.generate(messages, temperature=0.4, max_tokens=600)
        return ai_provider.extract_json(raw)
