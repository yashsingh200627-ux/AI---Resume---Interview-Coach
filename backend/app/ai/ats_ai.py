from typing import Dict, Any, List
import re
from app.ai.provider import ai_provider

class ATSAIService:
    @staticmethod
    async def analyze_resume_text(resume_text: str, filename: str = "") -> Dict[str, Any]:
        """
        Deeply inspects extracted resume text and calculates authentic scores based on content,
        formatting indicators, keyword density, section headers, and action verbs.
        """
        # Text metrics calculated from actual text
        words = resume_text.split()
        word_count = len(words)
        
        system_prompt = (
            "You are a rigorous, industry-standard Applicant Tracking System (ATS) and Executive Resume Auditor. "
            "Analyze the candidate's actual resume text provided below. "
            "CRITICAL INSTRUCTIONS:\n"
            "- Evaluate REAL content, not boilerplate.\n"
            "- Calculate genuine scores between 0 and 100 based strictly on this text:\n"
            "  * ats_score: ATS readability, lack of unparsable layouts, clear standard headings (Experience, Education, Skills).\n"
            "  * content_score: Depth of accomplishments, quantification (numbers, %, $), action verbs.\n"
            "  * keyword_score: Diversity of industry-relevant technical and operational keywords.\n"
            "  * formatting_score: Spacing, organization clarity, brevity.\n"
            "  * overall_score: Weighted average of the above.\n"
            "- Extract concrete strengths directly present in the text.\n"
            "- Identify weaknesses and missing standard elements (e.g. measurable metrics, LinkedIn, certifications).\n"
            "- Identify missing high-value keywords for the user's apparent domain.\n"
            "- Provide actionable, bulleted recommendations.\n"
            "Output ONLY a valid JSON object matching the requested schema."
        )

        user_prompt = f"""
Filename: {filename}
Word Count: {word_count}

--- RESUME TEXT START ---
{resume_text[:12000]}
--- RESUME TEXT END ---

Return exactly this JSON format:
{{
  "overall_score": 0.0,
  "ats_score": 0.0,
  "content_score": 0.0,
  "keyword_score": 0.0,
  "formatting_score": 0.0,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "missing_keywords": ["...", "..."],
  "recommendations": ["...", "..."]
}}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw = await ai_provider.generate(messages, temperature=0.2, max_tokens=1500)
        result = ai_provider.extract_json(raw)
        
        # Ensure scores are floats within 0-100
        for score_key in ["overall_score", "ats_score", "content_score", "keyword_score", "formatting_score"]:
            val = float(result.get(score_key, 70.0))
            result[score_key] = max(0.0, min(100.0, round(val, 1)))

        return result

    @staticmethod
    async def analyze_job_description(job_text: str, title: str = "") -> Dict[str, Any]:
        """
        Parses a job description to extract required skills, preferred skills,
        experience, education, responsibilities, and target keywords.
        """
        system_prompt = (
            "You are a technical recruiter and Job Description parser. "
            "Extract structured requirements from the job description below. "
            "Output ONLY valid JSON."
        )

        user_prompt = f"""
Job Title (if known): {title}

Job Description:
{job_text[:10000]}

Extract into this exact JSON:
{{
  "title": "extracted or confirmed title",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skillA", "skillB"],
  "experience_requirements": "Summary of years and seniority required",
  "education_requirements": "Required degrees or equivalents",
  "responsibilities": ["resp1", "resp2", "resp3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw = await ai_provider.generate(messages, temperature=0.2, max_tokens=1500)
        return ai_provider.extract_json(raw)

    @staticmethod
    async def match_resume_to_job(resume_text: str, job_description_text: str, job_title: str = "") -> Dict[str, Any]:
        """
        Compares candidate resume text against job description text.
        Calculates ATS compatibility score, matching/missing keywords and skills, and provides recommendations.
        """
        system_prompt = (
            "You are an ATS Matching Engine. Compare the candidate's resume text against the job description. "
            "Calculate genuine match scores based solely on the overlap and relevance of the candidate's actual qualifications. "
            "CRITICAL RULES:\n"
            "- Do NOT fabricate matches. If the candidate lacks a skill, put it in missing_skills.\n"
            "- If they possess it, put it in matched_skills.\n"
            "- Calculate scores from 0.0 to 100.0 accurately based on coverage.\n"
            "Output ONLY valid JSON."
        )

        user_prompt = f"""
Target Job Title: {job_title}

--- CANDIDATE RESUME ---
{resume_text[:10000]}

--- TARGET JOB DESCRIPTION ---
{job_description_text[:8000]}

Return JSON:
{{
  "overall_match_score": 0.0,
  "ats_compatibility_score": 0.0,
  "skill_match_score": 0.0,
  "experience_match_score": 0.0,
  "matched_skills": ["...", "..."],
  "missing_skills": ["...", "..."],
  "matched_keywords": ["...", "..."],
  "missing_keywords": ["...", "..."],
  "recommendations": [
    "Specific tweak to better align with this JD...",
    "..."
  ],
  "alignment_summary": "Detailed 2-3 paragraph breakdown of alignment, fit, and gaps."
}}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw = await ai_provider.generate(messages, temperature=0.2, max_tokens=2000)
        result = ai_provider.extract_json(raw)

        for key in ["overall_match_score", "ats_compatibility_score", "skill_match_score", "experience_match_score"]:
            val = float(result.get(key, 50.0))
            result[key] = max(0.0, min(100.0, round(val, 1)))

        return result
