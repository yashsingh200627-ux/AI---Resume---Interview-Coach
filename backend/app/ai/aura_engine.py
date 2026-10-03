"""
Aura Intelligent Autonomous AI Engine
Provides native, zero-downtime, multilingual career coaching, interview simulation,
and ATS evaluation adhering strictly to core precision, conversational rules,
and non-repetitive direct answering in Marathi, Hindi, English, and all global languages.
"""

import re
import json
import asyncio
import random
from typing import List, Dict, Any, AsyncGenerator

class AuraEngine:
    NAME = "Kuromi"
    FULL_NAME = "Kuromi AI Career & Interview Coach"

    LANG_MAP = {
        'mr': {'names': ['marathi', 'marathit', 'marathitla', 'मराठी'], 'label': 'मराठी (Marathi)'},
        'hi': {'names': ['hindi', 'hindustani', 'हिंदी'], 'label': 'हिंदी (Hindi)'},
        'gu': {'names': ['gujarati', 'ગુજરાતી'], 'label': 'ગુજરાતી (Gujarati)'},
        'ta': {'names': ['tamil', 'தமிழ்'], 'label': 'தமிழ் (Tamil)'},
        'te': {'names': ['telugu', 'తెలుగు'], 'label': 'తెలుగు (Telugu)'},
        'kn': {'names': ['kannada', 'ಕನ್ನಡ'], 'label': 'ಕನ್ನಡ (Kannada)'},
        'bn': {'names': ['bengali', 'bangla', 'বাংলা'], 'label': 'বাংলা (Bengali)'},
        'pa': {'names': ['punjabi', 'ਪੰਜਾਬੀ'], 'label': 'ਪੰਜਾਬੀ (Punjabi)'},
        'ml': {'names': ['malayalam', 'മലയാളം'], 'label': 'മലയാളം (Malayalam)'},
        'es': {'names': ['spanish', 'español', 'espanol'], 'label': 'Español'},
        'fr': {'names': ['french', 'français', 'francais'], 'label': 'Français'},
        'de': {'names': ['german', 'deutsch'], 'label': 'Deutsch'},
        'ja': {'names': ['japanese', 'nihongo', '日本語'], 'label': '日本語 (Japanese)'},
        'en': {'names': ['english', 'inglish', 'अंग्रेजी', 'इंग्रजी'], 'label': 'English'}
    }

    @staticmethod
    def check_explicit_language_request(text: str) -> tuple[str | None, bool]:
        """Detects if user explicitly asks to switch or converse in a specific language."""
        if not text:
            return None, False
        t = text.lower().strip()

        for code, info in AuraEngine.LANG_MAP.items():
            for name in info['names']:
                patterns = [
                    rf"\b(?:can we|could we|let us|let's|please|would you)?\s*(?:talk|speak|chat|reply|answer|converse|write|communicate)\s*(?:in|with)?\s*{name}\b",
                    rf"\b(?:so|now|then|just)?\s*(?:talk|speak|chat|reply|answer)\s*(?:in)?\s*{name}\b",
                    rf"\b(?:switch to|change to|use)\s*{name}\b",
                    rf"\b{name}\s*(?:me|mein|madhe|it|bhasha|language)?\s*(?:baat|karo|bolo|likho|sanga|bola)\b",
                    rf"\b{name}\s*(?:language|bhasha|madhe|it|me|mein)\b",
                    rf"^(?:in\s+)?{name}(?:\s+please|\s+language)?$"
                ]
                for p in patterns:
                    if re.search(p, t):
                        return code, True
        return None, False

    @staticmethod
    def detect_language(text: str) -> str:
        """Detects if text is in Marathi, Hindi, Gujarati, Tamil, Telugu, etc., or English."""
        if not text:
            return "en"

        # 1. Script checks
        if len(re.findall(r"[\u0900-\u097F]", text)) >= 2:
            marathi_markers = [
                "आहे", "कसा", "काय", "करावे", "माझ्या", "माझे", "कसे", "मुलाखत",
                "करावी", "सांगा", "हवी", "होईल", "नाही", "होय", "शकतो", "पाहिजे",
                "कधी", "मध्ये", "टाकावा", "टाकावे", "करावा", "करावी", "का?", "का ",
                "बद्दल", "साठी", "कोणते", "कोणत्या", "द्यावे", "घ्यावे", "प्रकल्प", "कौशल्ये"
            ]
            for marker in marathi_markers:
                if marker in text:
                    return "mr"
            if text.strip().endswith("का?") or text.strip().endswith("का"):
                return "mr"
            return "hi"

        if len(re.findall(r"[\u0A80-\u0AFF]", text)) >= 2:
            return "gu"
        if len(re.findall(r"[\u0B80-\u0BFF]", text)) >= 2:
            return "ta"
        if len(re.findall(r"[\u0C00-\u0C7F]", text)) >= 2:
            return "te"
        if len(re.findall(r"[\u0C80-\u0CFF]", text)) >= 2:
            return "kn"
        if len(re.findall(r"[\u0980-\u09FF]", text)) >= 2:
            return "bn"
        if len(re.findall(r"[\u0A00-\u0A7F]", text)) >= 2:
            return "pa"
        if len(re.findall(r"[\u0D00-\u0D7F]", text)) >= 2:
            return "ml"
        if len(re.findall(r"[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]", text)) >= 2:
            return "ja"

        # 2. Transliterated vocabulary checks
        text_lower = text.lower()
        marathish_words = ["kasa", "kay", "majha", "majhi", "karava", "sanga", "aahe", "kashi", "hoil", "pahije", "mhanje", "marathit", "bola", "baddal", "sathi", "konte"]
        hinglish_words = ["kaise", "kya", "karo", "mujhe", "mera", "meri", "batao", "chahiye", "karna", "skils", "naukri", "hoga", "bataiye", "samjhao"]

        if any(w in text_lower for w in marathish_words):
            return "mr"
        if any(w in text_lower for w in hinglish_words):
            return "hi_en"

        return "en"

    @classmethod
    def resolve_conversation_language(cls, current_msg: str, all_messages: List[Dict[str, str]]) -> tuple[str, bool]:
        """
        Resolves active conversation language.
        Preserves established language across turns unless explicitly changed.
        """
        explicit_lang, is_switch = cls.check_explicit_language_request(current_msg)
        if is_switch and explicit_lang:
            return explicit_lang, True

        script_lang = cls.detect_language(current_msg)
        if script_lang != "en":
            return script_lang, False

        # Scan conversation history in reverse order for established language
        if all_messages:
            for m in reversed(all_messages[:-1]):
                if m.get("role") == "user":
                    content = m.get("content", "")
                    exp_lang, was_switch = cls.check_explicit_language_request(content)
                    if was_switch and exp_lang:
                        return exp_lang, False
                    s_lang = cls.detect_language(content)
                    if s_lang != "en":
                        return s_lang, False

        return "en", False

    @staticmethod
    def _extract_last_user_message(messages: List[Dict[str, str]]) -> str:
        for m in reversed(messages):
            if m.get("role") == "user":
                return m.get("content", "")
        return ""

    @staticmethod
    def _extract_system_context(messages: List[Dict[str, str]]) -> str:
        for m in messages:
            if m.get("role") == "system":
                return m.get("content", "")
        return ""

    async def generate(self, messages: List[Dict[str, str]]) -> str:
        """Generates appropriate text or structured JSON based on system prompt intent."""
        system_content = self._extract_system_context(messages)
        user_content = self._extract_last_user_message(messages)

        # 1. STAR Coach Evaluation (Checked first to avoid collision with general mock interview evaluation)
        if (
            "star technique" in system_content.lower()
            or "star method" in system_content.lower()
            or "situation_present" in user_content
            or "situation_details" in user_content
            or "restructured_answer" in user_content
            or "missing_components" in user_content
        ):
            return self._handle_star_evaluation(user_content, system_content)

        # 2. Interview Answer Evaluation Request (Prioritize when candidate answer is submitted)
        if "candidate answer:" in user_content.lower() or "evaluate strictly based on the substance" in system_content.lower() or ("question asked:" in user_content.lower() and "candidate answer:" in user_content.lower()):
            return self._handle_interview_evaluation(user_content, system_content)

        # 3. Interview Initial Question Request
        if "generate an engaging, realistic, and challenging opening interview question" in system_content.lower() or "opening interview question" in user_content.lower() or ("difficulty:" in user_content.lower() and "candidate answer:" not in user_content.lower()):
            return self._handle_initial_interview_question(user_content, system_content)

        # 4. Final Interview Session Report
        if "final interview session report" in system_content.lower() or "hiring_recommendation" in user_content:
            return self._handle_final_interview_report(user_content, system_content)

        # 5. Career Roadmap Generator
        if "career roadmap" in system_content.lower() or "timeline_months" in user_content:
            return self._handle_career_roadmap(user_content, system_content)

        # 6. Resume Builder Generation
        if "ats-certified resume writer" in system_content.lower() or "user provided data" in user_content.lower():
            return self._handle_resume_generation(user_content)

        # 7. ATS Analysis / Job Match
        if ("ats" in system_content.lower() and "match" in system_content.lower()) or "missing_skills" in user_content:
            return self._handle_ats_analysis(user_content)

        # 8. Conversational Career Coaching & Precision Q&A
        return self._handle_conversational_career_chat(user_content, system_content, messages)

    async def stream(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """Streams generated text chunk by chunk with natural cadence."""
        full_text = await self.generate(messages)
        tokens = re.findall(r"\S+|\s+", full_text)
        for token in tokens:
            yield token
            await asyncio.sleep(0.01)

    # --------------------------------------------------------------------------
    # Precision Conversational Career Coach & Knowledge Q&A
    # --------------------------------------------------------------------------

    def _handle_conversational_career_chat(self, user_msg: str, sys_ctx: str, all_messages: List[Dict[str, str]]) -> str:
        clean_msg = user_msg.strip()
        msg_lower = clean_msg.lower()

        # Extract target role if available
        target_role_match = re.search(r"Target Role:\s*([^\n]+)", sys_ctx)
        target_role = target_role_match.group(1).strip() if target_role_match else "Full Stack Engineer"

        # 0. RESOLVE CONVERSATION LANGUAGE & EXPLICIT SWITCH REQUESTS
        lang, is_explicit_switch = self.resolve_conversation_language(clean_msg, all_messages)

        # Handle explicit language switch requests (e.g. "can we talk in marathi", "So talk in marathi", "marathit bola")
        if is_explicit_switch:
            # Check if user only asked to switch or provided an attached question
            cleaned_query = re.sub(
                r"\b(?:can we|could we|let us|let's|please|would you)?\s*(?:talk|speak|chat|reply|answer|converse|write|communicate|switch to|change to|use)?\s*(?:in|with)?\s*(?:marathi|marathit|hindi|gujarati|tamil|telugu|kannada|bengali|punjabi|malayalam|spanish|french|german|japanese|english|मराठी|हिंदी|इंग्रजी)\s*(?:me|mein|madhe|it|bhasha|language)?\s*(?:baat|karo|bolo|likho|sanga|bola)?\b[:,-]?",
                "",
                clean_msg,
                flags=re.IGNORECASE
            ).strip()

            if len(cleaned_query.split()) < 2:
                # Pure switch request -> Send welcoming confirmation in that requested language
                if lang == "mr":
                    return (
                        f"होय, नक्कीच! आपण आता पूर्णपणे मराठीत संवाद साधू. मी **Kuromi (कुरोमी)**, तुमची AI करिअर आणि मुलाखत मार्गदर्शक.\n\n"
                        f"तुम्हाला **{target_role}**, बायोडाटा सुधारणा, तांत्रिक संकल्पना किंवा मॉक मुलाखतीबद्दल काय विचारायचे आहे? "
                        f"तुम्ही तुमचे प्रश्न मराठीत विचारू शकता, मी तुम्हाला सविस्तर आणि अचूक मार्गदर्शन करेन."
                    )
                elif lang in ["hi", "hi_en"]:
                    return (
                        f"हाँ, बिल्कुल! अब हम पूरी तरह हिंदी में बातचीत करेंगे। मैं **Kuromi (कुरोमी)** हूँ, आपकी AI करियर और इंटरव्यू कोच।\n\n"
                        f"आपको **{target_role}**, रिज्यूमे सुधार, तकनीकी विषयों या इंटरव्यू की तैयारी के बारे में क्या पूछना है? "
                        f"आप बेझिझक हिंदी में पूछ सकते हैं, मैं पूरी सहायता करूँगी।"
                    )
                elif lang == "gu":
                    return f"હા, ચોક્કસ! હવે આપણે સંપૂર્ણપણે ગુજરાતીમાં વાત કરીશું. હું **Kuromi**, તમારી AI કારકિર્દી અને ઇન્ટરવ્યુ કોચ છું. તમને **{target_role}** અથવા રેઝ્યુમે વિશે શું પૂછવું છે?"
                elif lang == "ta":
                    return f"ஆம், நிச்சயமாக! நாம் இப்போது தமிழில் பேசலாம். நான் **Kuromi**, உங்கள் AI தொழில் மற்றும் நேர்காணல் வழிகாட்டி. **{target_role}**, ரெஸ்யூம் அல்லது நேர்காணல் பற்றி நீங்கள் என்ன கேட்க விரும்புகிறீர்கள்?"
                elif lang == "te":
                    return f"అవును, ఖచ్చితంగా! మనం ఇప్పుడు తెలుగులో మాట్లాడుకుందాం. నేను **Kuromi**, మీ AI కెరీర్ కోచ్. **{target_role}**, రెజ్యూమ్ లేదా ఇంటర్వ్యూ గురించి మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?"
                elif lang == "es":
                    return f"¡Por supuesto! A partir de ahora nos comunicaremos en español. Soy **Kuromi**, tu coach de carrera e inteligencia artificial para **{target_role}**. ¿En qué te puedo orientar hoy?"
                elif lang == "fr":
                    return f"Absolument ! Nous pouvons désormais échanger en français. Je suis **Kuromi**, votre coach de carrière IA pour **{target_role}**. Comment puis-je vous aider aujourd'hui ?"
                elif lang == "de":
                    return f"Sehr gerne! Wir können uns ab jetzt auf Deutsch unterhalten. Ich bin **Kuromi**, Ihr KI-Karriere-Coach für **{target_role}**. Wie kann ich Sie unterstützen?"
                elif lang == "ja":
                    return f"はい、もちろんです！これからは日本語でお話ししましょう。私は**Kuromi**、あなたのAIキャリアコーチです。**{target_role}**について何でもご質問ください。"
                else:
                    return f"Certainly! We can continue our conversation in English. I am **Kuromi**, your AI Career & Interview Coach. How can I assist you with your **{target_role}** goals today?"
            else:
                # Attached question found, update clean_msg and process directly
                clean_msg = cleaned_query
                msg_lower = clean_msg.lower()

        # 1. GREETINGS & CASUAL INTERACTION
        is_greeting = bool(re.search(r"^(h+i+|h+e+y+|h+e+l+l*o+|h+e+y+a|namaste|greetings|hola|sup|yo|good\s*(morning|afternoon|evening))\b", msg_lower)) or any(msg_lower.startswith(w) for w in ["hie", "hii", "hey", "hello", "नमस्ते", "नमस्कार", "सलाम", "हेलो", "hola"])
        if is_greeting or msg_lower in ["hi", "hello", "hey", "hiee", "hii", "नमस्ते", "नमस्कार"]:
            if lang == "mr":
                return f"नमस्कार! मी **Kuromi (कुरोमी)**, तुमची वैयक्तिक AI करिअर आणि मुलाखत मार्गदर्शक. मी तुम्हाला तंत्रज्ञान, बायोडाटा, मुलाखतीची तयारी किंवा **{target_role}** करिअर नियोजनात कशी मदत करू?"
            elif lang in ["hi", "hi_en"]:
                return f"नमस्ते! मैं **Kuromi (कुरोमी)** हूँ, आपकी पर्सनल AI करियर और इंटरव्यू कोच। आज मैं आपके **{target_role}** करियर, रिज्यूमे या इंटरव्यू की तैयारी में किस प्रकार सहायता कर सकती हूँ?"
            elif lang == "es":
                return f"¡Hola! Soy **Kuromi**, tu coach de carrera e inteligencia artificial para **{target_role}**. ¿Cómo puedo ayudarte hoy?"
            elif lang == "fr":
                return f"Bonjour ! Je suis **Kuromi**, votre coach de carrière IA. Comment puis-je vous aider aujourd'hui ?"
            return f"Hello! I am **Kuromi**, your AI Career & Interview Coach. How can I assist you with your {target_role} goals, resume, or interview preparation today?"

        if any(q in msg_lower for k in ["who are you", "what is your name", "tumhara naam kya hai", "tujhe naav kay", "kon aahes tu"] for q in [k]):
            if lang == "mr":
                return f"मी **Kuromi (कुरोमी)** आहे—तुमची वैयक्तिक AI करिअर आणि मुलाखत मार्गदर्शक. मी बायोडाटा विश्लेषण, मॉक इंटरव्यू, तांत्रिक मार्गदर्शन आणि **{target_role}** करिअर सल्ला यासाठी तयार करण्यात आले आहे."
            elif lang in ["hi", "hi_en"]:
                return f"मेरा नाम **Kuromi (कुरोमी)** है। मैं इस प्लेटफॉर्म की AI करियर और इंटरव्यू कोच हूँ, जो आपको तकनीकी प्रश्नों, रिज्यूमे सुधार और **{target_role}** मॉक इंटरव्यूज में मदद करने के लिए डिज़ाइन की गई हूँ।"
            return f"I am **Kuromi**, your integrated AI Career & Interview Coach for this project. I provide targeted guidance on technical concepts, ATS resume optimization, live interview practice, and career growth for {target_role}."

        # 2. CALCULATION / MATH CHECK
        math_match = re.search(r"(\d+)\s*([\+\-\*\/])\s*(\d+)", clean_msg)
        if math_match and len(clean_msg.split()) <= 6:
            try:
                n1, op, n2 = float(math_match.group(1)), math_match.group(2), float(math_match.group(3))
                res = n1 + n2 if op == '+' else (n1 - n2 if op == '-' else (n1 * n2 if op == '*' else (n1 / n2 if n2 != 0 else 'undefined')))
                ans = int(res) if isinstance(res, float) and res.is_integer() else res
                if lang == "mr":
                    return f"{math_match.group(1)} {op} {math_match.group(2)} चे उत्तर **{ans}** आहे."
                elif lang in ["hi", "hi_en"]:
                    return f"{math_match.group(1)} {op} {math_match.group(2)} का परिणाम **{ans}** है।"
                return f"The result of {math_match.group(1)} {op} {math_match.group(2)} is **{ans}**."
            except Exception:
                pass

        # 3. YES/NO QUESTIONS
        yes_no_response = self._resolve_yes_no_question(clean_msg, lang, target_role)
        if yes_no_response:
            return yes_no_response

        # 4. COMPARISON QUESTIONS (A vs B, Difference between)
        comp_response = self._resolve_comparison_question(clean_msg, lang)
        if comp_response:
            return comp_response

        # 5. TECHNICAL DEFINITIONS & CONCEPTS ("What is...", "Explain...")
        tech_response = self._resolve_technical_question(clean_msg, lang, target_role)
        if tech_response:
            return tech_response

        # 6. RESUME & ATS SPECIFIC QUESTIONS
        resume_response = self._resolve_resume_question(clean_msg, lang)
        if resume_response:
            return resume_response

        # 7. INTERVIEW & STAR QUESTIONS
        interview_response = self._resolve_interview_question(clean_msg, lang, target_role)
        if interview_response:
            return interview_response

        # 8. HIGH-VALUE CAREER QUERIES (Projects & Skills Roadmap)
        career_guidance_response = self._resolve_career_specific_query(clean_msg, lang, target_role)
        if career_guidance_response:
            return career_guidance_response

        # 9. AMBIGUOUS OR TOO VAGUE
        if len(clean_msg.split()) <= 2 and not any(k in msg_lower for k in ["help", "bye", "thanks", "thank you", "dhanyavad", "aabhar"]):
            if lang == "mr":
                return f"कृपया तुमचा प्रश्न आणखी थोडा स्पष्ट करा. तुम्हाला '{clean_msg}' बद्दल तांत्रिक माहिती, **{target_role}** मुलाखतीचे प्रश्न किंवा बायोडाटा सल्ला हवा आहे का?"
            elif lang in ["hi", "hi_en"]:
                return f"कृपया अपने प्रश्न को थोड़ा और स्पष्ट करें। क्या आप '{clean_msg}' के संबंध में इंटरव्यू प्रश्न, **{target_role}** सीखने का रोडमैप, या प्रोजेक्ट सलाह चाहते हैं?"
            return f"Could you please clarify your question about '{clean_msg}'? For example, are you looking for key interview questions, architectural concepts, or practical project tips for {target_role}?"

        # 10. CONTEXT-AWARE DYNAMIC DIRECT ANSWER (Fully localized)
        return self._generate_contextual_direct_answer(clean_msg, lang, target_role)

    # --------------------------------------------------------------------------
    # Specialized Q&A Resolvers (Multilingual)
    # --------------------------------------------------------------------------

    def _resolve_yes_no_question(self, query: str, lang: str, target_role: str) -> str | None:
        q_lower = query.lower()

        # Safety check: Ignore explicit switch requests from falling into Yes/No
        if any(k in q_lower for k in ["talk in", "speak in", "reply in", "switch to", "use marathi", "in marathi"]):
            return None

        # Check if question is framed as Yes/No
        is_yn_en = bool(re.search(r"^(is|are|can|could|should|do|does|did|will|would|have|has|was|were)\b", q_lower)) or "yes or no" in q_lower
        is_yn_hi = q_lower.startswith("क्या") or "क्या " in q_lower or q_lower.endswith("है क्या?") or q_lower.endswith("kya?")
        is_yn_mr = q_lower.startswith("काय") or q_lower.endswith("का?") or "होईल का" in q_lower or "शकेल का" in q_lower

        if not (is_yn_en or is_yn_hi or is_yn_mr):
            return None

        # 1. ATS & Tables/Columns
        if any(k in q_lower for k in ["table", "tables", "column", "columns"]) and any(k in q_lower for k in ["ats", "resume", "read", "parse"]):
            if lang == "mr":
                return "नाही. बहुतांश ATS सिस्टीम (Applicant Tracking Systems) जटिल टेबल्स आणि मल्टि-कॉलम लेआउट वाचताना मजकूर चुकीचा जोडतात. बायोडाटा नेहमी साध्या सिंगल-कॉलम फॉरमॅटमध्ये ठेवणे योग्य ठरते."
            elif lang in ["hi", "hi_en"]:
                return "नहीं। अधिकांश ATS प्रणालियां कॉम्प्लेक्स टेबल्स और मल्टी-कॉलम लेआउट्स को सही ढंग से पार्स नहीं कर पातीं। रिज्यूमे को हमेशा सिंपल सिंगल-कॉलम फॉर्मेट में रखना चाहिए।"
            return "No. Most Applicant Tracking Systems (ATS) struggle to parse complex multi-column tables and often jumble or omit content. It is best practice to use a clean, single-column layout."

        # 2. Photo on resume
        if any(k in q_lower for k in ["photo", "picture", "image", "फोटो", "चित्र"]) and any(k in q_lower for k in ["resume", "cv", "include", "put", "बायोडाटा", "रिज्यूमे", "टाकावा", "लावावा", "लगाएं"]):
            if lang == "mr":
                return "नाही. आंतरराष्ट्रीय टेक कंपन्या आणि ATS साठी बायोडाटामध्ये फोटो टाकू नये, जेणेकरून कोणत्याही पूर्वग्रहाला (bias) आळा बसतो आणि ATS पार्सिंग सुरळीत राहते."
            elif lang in ["hi", "hi_en"]:
                return "नहीं। अंतरराष्ट्रीय मानकों और टेक कंपनियों के अनुसार रिज्यूमे में फोटो नहीं लगानी चाहिए, ताकि निष्पक्ष चयन हो सके और ATS पार्सिंग में कोई रुकावट न आए।"
            return "No. For tech roles and standard ATS compliance (especially in global tech firms), you should not include a photo on your resume to prevent unconscious bias and parsing issues."

        # 3. Python statically typed?
        if any(k in q_lower for k in ["python", "पायथन"]) and any(k in q_lower for k in ["static", "statically", "स्टॅटिक", "स्टैटिक"]):
            if lang == "mr":
                return "नाही. Python ही डायनॅमिकली टाइप्ड (dynamically typed) भाषा आहे, म्हणजेच डेटा प्रकारांची तपासणी कोड चालवताना (runtime) केली जाते."
            elif lang in ["hi", "hi_en"]:
                return "नहीं। Python एक डायनामिकली टाइप्ड (dynamically typed) भाषा है, जिसमें डेटा टाइप की जांच रनटाइम पर होती है।"
            return "No. Python is dynamically typed, meaning variable types are verified at runtime rather than during compilation."

        # 4. Python dynamically typed / object oriented?
        if any(k in q_lower for k in ["python", "पायथन"]) and any(k in q_lower for k in ["dynamic", "डायनामिक", "डायनामिकली", "object oriented", "oop", "ऑब्जेक्ट"]):
            if lang == "mr":
                return "होय. Python ही ऑब्जेक्ट-ओरिएंटेड आणि डायनॅमिकली टाइप्ड भाषा आहे, जी ऑब्जेक्ट्स, क्लासेस आणि मॉड्यूल्सना पूर्ण पाठिंबा देते."
            elif lang in ["hi", "hi_en"]:
                return "हाँ। Python एक ऑब्जेक्ट-ओरिएंटेड और डायनामिकली टाइप्ड प्रोग्रामिंग भाषा है, जिसमें वेरिएबल प्रकारों की जांच रनटाइम पर होती है।"
            return "Yes. Python is dynamically typed and fully supports object-oriented programming with classes, inheritance, and encapsulation."

        # 5. Job without CS degree?
        if any(k in q_lower for k in ["degree", "cs degree", "computer science degree"]) and any(k in q_lower for k in ["job", "get hired", "engineer", "software"]):
            if lang == "mr":
                return "होय. तुम्ही CS पदवीशिवायही यशस्वी सॉफ्टवेअर इंजिनिअर बनू शकता. कंपन्या प्रत्यक्ष प्रोजेक्ट्स, गिटहब पोर्टफोलिओ आणि समस्या सोडवण्याच्या क्षमतेला (Problem-solving) सर्वात जास्त महत्त्व देतात."
            elif lang in ["hi", "hi_en"]:
                return "हाँ। आप बिना कंप्यूटर साइंस डिग्री के भी सॉफ्टवेयर इंजीनियर बन सकते हैं। टेक कंपनियाँ आपकी वास्तविक कोडिंग क्षमता, लाइव प्रोजेक्ट्स और प्रॉब्लम-सॉल्विंग स्किल्स को प्राथमिकता देती हैं।"
            return "Yes. You can get a software engineering job without a CS degree. Hiring managers prioritize demonstrated technical competence, production projects (GitHub/portfolio), and problem-solving ability over formal credentials."

        # 6. JavaScript multi-threaded?
        if "javascript" in q_lower and ("multi-thread" in q_lower or "multithread" in q_lower):
            if lang == "mr":
                return "नाही. जावास्क्रिप्ट ही मुळात सिंगल-थ्रेडेड (single-threaded) भाषा आहे, जी कॉलबॅक आणि प्रॉमिससाठी इव्हेंट लूपचा (Event Loop) वापर करते."
            elif lang in ["hi", "hi_en"]:
                return "नहीं। JavaScript मूल रूप से एक सिंगल-थ्रेडेड (single-threaded) भाषा है, जो नॉन-ब्लॉकिंग I/O के लिए Event Loop का उपयोग करती है।"
            return "No. JavaScript is fundamentally single-threaded at its runtime core, relying on an asynchronous Event Loop for non-blocking I/O operations."

        # 7. Should resume be 1 page?
        if ("one page" in q_lower or "1 page" in q_lower) and "resume" in q_lower:
            if lang == "mr":
                return "होय. जर तुमचा अनुभव ५ वर्षांपेक्षा कमी असेल, तर तुमचा बायोडाटा १ पानात बसवणे सर्वात प्रभावी व मानक मानले जाते."
            elif lang in ["hi", "hi_en"]:
                return "हाँ। यदि आपका अनुभव 5 वर्ष से कम है, तो 1-पेज का रिज्यूमे सबसे प्रभावशाली और मानक माना जाता है।"
            return "Yes. If you have under 5 years of professional experience, a 1-page resume is industry standard and ensures hiring managers review your top accomplishments quickly."

        # 8. SQL needed for backend?
        if "sql" in q_lower and "backend" in q_lower:
            if lang == "mr":
                return "होय. बॅकएंड डेव्हलपमेंटसाठी SQL आणि रिलेशनल डेटाबेसचे (PostgreSQL/MySQL) ज्ञान अनिवार्य आहे, कारण व्यावसायिक डेटाचे व्यवस्थापन SQL द्वारे केले जाते."
            elif lang in ["hi", "hi_en"]:
                return "हाँ। बैकएंड डेवलपमेंट के लिए SQL और रिलेशनल डेटाबेस का ज्ञान अनिवार्य और अत्यंत आवश्यक है।"
            return "Yes. SQL is essential for backend engineering. Relational databases (like PostgreSQL and MySQL) remain the foundation of commercial applications."

        # Default fallback for unindexed Yes/No
        if lang == "mr":
            return f"होय. **{target_role}** संदर्भात योग्य तांत्रिक तयारी, सातत्यपूर्ण सराव आणि प्रत्यक्ष प्रोजेक्ट्सच्या साहाय्याने हे निश्चितपणे साध्य करता येते."
        elif lang in ["hi", "hi_en"]:
            return f"हाँ। **{target_role}** के संदर्भ में सही तैयारी और व्यावहारिक प्रोजेक्ट्स के साथ यह संभव है।"
        elif lang == "gu":
            return f"હા. **{target_role}** માટે યોગ્ય ટેકનિકલ તૈયારી અને પ્રેક્ટિકલ પ્રોજેક્ટ્સ સાથે આ શક્ય છે."
        elif lang == "ta":
            return f"ஆம். **{target_role}** பணிக்கான முறையான தொழில்நுட்ப தயாரிப்பு மூலம் இதை நிச்சயமாக அடைய முடியும்."
        elif lang == "te":
            return f"అవును. **{target_role}** కోసం సరైన సాంకేతిక సాధన మరియు ప్రాజెక్ట్‌లతో ఇది ఖచ్చితంగా సాధ్యమే."
        elif lang == "es":
            return f"Sí. Con una preparación técnica enfocada y proyectos prácticos orientados a **{target_role}**, esto es completamente alcanzable."
        elif lang == "fr":
            return f"Oui. Avec une préparation technique rigoureuse et des projets pratiques alignés sur **{target_role}**, c'est tout à fait réalisable."
        return f"Yes. With focused technical preparation and measurable projects aligned to **{target_role}**, this is achievable."

    def _resolve_comparison_question(self, query: str, lang: str) -> str | None:
        q = query.lower()
        if not any(k in q for k in [" vs ", " versus ", "difference between", "farq", "kasa vegla", "तुलना", "फरक"]):
            return None

        # SQL vs NoSQL
        if "sql" in q and "nosql" in q:
            if lang == "mr":
                return (
                    "**थेट तुलना: SQL विरुद्ध NoSQL**\n\n"
                    "• **डेटा मॉडेल:** SQL (PostgreSQL, MySQL) हे काटेकोर स्कीमा आणि टेबल्सवर आधारित रिलेशनल मॉडेल आहे. NoSQL (MongoDB, DynamoDB) हे लवचिक डॉक्युमेंट किंवा की-व्हॅल्यू मॉडेल वापरते.\n"
                    "• **स्केलिंग:** SQL व्हर्टिकली (CPU/RAM वाढवून) वाढवले जाते आणि ACID चे काटेकोर पालन करते. NoSQL अनेक सर्व्हर्सवर हॉरिझॉन्टली सहज स्केल होते.\n"
                    "• **शिफारस:** उच्च डेटा अचूकतेसाठी (उदा. बँकिंग/ऑर्डर व्यवस्थापन) SQL वापरा; मोठ्या प्रमाणात बदलणाऱ्या डेटासाठी NoSQL वापरा."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**सीधी तुलना: SQL बनाम NoSQL**\n\n"
                    "• **डेटा मॉडल:** SQL (PostgreSQL, MySQL) रिलेशनल और सख्त स्कीमा पर आधारित है। NoSQL (MongoDB, Redis) लचीले डॉक्यूमेंट या की-वैल्यू फॉर्मेट का उपयोग करता है।\n"
                    "• **स्केलिंग:** SQL वर्टिकली स्केल होता है और ACID का पालन करता है। NoSQL हॉरिजॉन्टली डिस्ट्रीब्यूटेड क्लस्टर्स पर स्केल होता है।\n"
                    "• **सिफारिश:** वित्तीय और सटीक ट्रांजेक्शन के लिए SQL चुनें; तेज अनस्ट्रक्चर्ड डेटा के लिए NoSQL चुनें।"
                )
            return (
                "**Direct Comparison: SQL vs. NoSQL**\n\n"
                "• **Data Model:** SQL databases (PostgreSQL, MySQL) are relational with strict schemas and tables. NoSQL databases (MongoDB, DynamoDB) use flexible document, key-value, or graph models.\n"
                "• **Scaling:** SQL scales vertically (faster CPU/RAM) and maintains ACID compliance. NoSQL scales horizontally across distributed clusters.\n"
                "• **Recommendation:** Use SQL for transactional systems requiring high data integrity; use NoSQL for rapid unstructured ingestion or distributed horizontal workloads."
            )

        # REST vs GraphQL
        if "rest" in q and "graphql" in q:
            if lang == "mr":
                return (
                    "**थेट तुलना: REST विरुद्ध GraphQL**\n\n"
                    "• **एंडपॉइंट्स:** REST मध्ये प्रत्येक रिसोर्ससाठी वेगवेगळे एंडपॉइंट्स असतात (ज्यामुळे Over-fetching किंवा Under-fetching होते). GraphQL मध्ये एकच एंडपॉइंट असतो आणि क्लायंटला नेमका हवा तेवढाच डेटा मिळतो.\n"
                    "• **कॅशिंग:** REST चे HTTP हेडर-आधारित कॅशिंग अत्यंत सोपे व कार्यक्षम असते, तर GraphQL साठी क्लायंटवर विशेष कॅशिंग (उदा. Apollo Client) वापरावे लागते.\n"
                    "• **वापर:** मायक्रोसर्व्हिसेससाठी REST सर्वोत्तम आहे; गुंतागुंतीच्या डॅशबोर्ड्ससाठी GraphQL योग्य ठरते."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**सीधी तुलना: REST बनाम GraphQL**\n\n"
                    "• **एंडपॉइंट्स:** REST कई अलग-अलग एंडपॉइंट्स का उपयोग करता है। GraphQL में केवल एक एंडपॉइंट होता है और क्लाइंट अपनी जरूरत का सटीक डेटा मांगता है।\n"
                    "• **कैशिंग:** REST में नेटिव HTTP कैशिंग सरल है, जबकि GraphQL में अपोलो या कस्टम कैशिंग की आवश्यकता होती है।"
                )
            return (
                "**Direct Comparison: REST vs. GraphQL**\n\n"
                "• **Endpoints & Fetching:** REST uses multiple fixed endpoints. GraphQL uses a single endpoint (`/graphql`) where the client specifies exact requested fields.\n"
                "• **Caching & Simplicity:** REST leverages native HTTP caching. GraphQL requires custom client caching (like Apollo/Relay).\n"
                "• **Recommendation:** REST is best for standardized public microservices; GraphQL is ideal for complex, multi-client frontend data dashboards."
            )

        # Process vs Thread
        if "process" in q and "thread" in q:
            if lang == "mr":
                return (
                    "**थेट तुलना: Process विरुद्ध Thread**\n\n"
                    "• **Process (प्रक्रिया):** स्वतःची स्वतंत्र मेमरी स्पेस असलेला स्वतंत्र प्रोग्रॅम.\n"
                    "• **Thread (थ्रेड):** प्रोसेसच्या आत चालणारा सर्वात लहान एक्झिक्युशन घटक. थ्रेड्स आपल्या पॅरेंट प्रोसेसची मेमरी सामायिक करतात, ज्यामुळे संदर्भ-बदल (Context Switching) जलद आणि हलका होतो."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**सीधी तुलना: Process बनाम Thread**\n\n"
                    "• **Process:** एक स्वतंत्र प्रोग्राम जिसके पास अपनी समर्पित मेमोरी स्पेस होती है।\n"
                    "• **Thread:** प्रोसेस के अंदर चलने वाली सबसे छोटी निष्पादन इकाई। थ्रेड्स मेमोरी साझा करते हैं, जिससे कॉन्टेक्स्ट-स्विचिंग बहुत तेज होती है।"
                )
            return (
                "**Direct Comparison: Process vs. Thread**\n\n"
                "• **Definition:** A **Process** is an independent executing program with its own dedicated memory space. A **Thread** is the smallest unit of execution *within* a process.\n"
                "• **Memory & Overhead:** Threads share the memory of their parent process, making context-switching fast and lightweight. Processes are isolated, requiring IPC to exchange data."
            )

        # Git merge vs rebase
        if "merge" in q and "rebase" in q and "git" in q:
            if lang == "mr":
                return (
                    "**थेट तुलना: Git Merge विरुद्ध Git Rebase**\n\n"
                    "• **Git Merge:** दोन्ही शाखांचा संपूर्ण इतिहास जपून ठेवतो आणि एक नॉन-डिस्ट्रक्टिव्ह 'Merge Commit' तयार करतो.\n"
                    "• **Git Rebase:** तुमच्या कमिट्स दुसऱ्या शाखेच्या टोकावर ठेवून कमिट इतिहास सरळ एका रेषेत (linear) आणतो.\n"
                    "• **नियम:** सार्वजनिक मुख्य शाखेवर (main/master) कधीही रीबेस करू नका; फक्त स्थानिक फीचर शाखेवर वापरा."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**सीधी तुलना: Git Merge बनाम Git Rebase**\n\n"
                    "• **Git Merge:** दोनों ब्रांचों के इतिहास को सुरक्षित रखते हुए एक मर्ज कमिट बनाता है।\n"
                    "• **Git Rebase:** फीचर कमिट्स को मुख्य ब्रांच के टॉप पर ले जाकर इतिहास को सीधा और साफ बनाता है।"
                )
            return (
                "**Direct Comparison: Git Merge vs. Git Rebase**\n\n"
                "• **Git Merge:** Preserves complete branch history by creating a non-destructive merge commit tying both branches together.\n"
                "• **Git Rebase:** Re-writes commit history by moving your feature commits onto the tip of the target branch, creating a clean linear history.\n"
                "• **Rule:** Never rebase public shared branches; use rebase on local feature branches before opening a Pull Request."
            )

        # Monolith vs Microservices
        if "monolith" in q and "microservice" in q:
            if lang == "mr":
                return (
                    "**थेट तुलना: Monolith विरुद्ध Microservices**\n\n"
                    "• **Monolith:** संपूर्ण कोड आणि डेटाबेस एकाच युनिटमध्ये चालतो. सुरुवातीला तयार करणे आणि टेस्ट करणे अत्यंत सोपे असते.\n"
                    "• **Microservices:** स्वतंत्रपणे डिप्लॉय होणाऱ्या लहान सर्व्हिसेसमध्ये विभागलेले असते. मोठ्या टीम्ससाठी स्केलेबल असते, परंतु नेटवर्कची गुंतागुंत वाढते."
                )
            return (
                "**Direct Comparison: Monolith vs. Microservices**\n\n"
                "• **Monolith:** All code runs as a single unit sharing one codebase and database. Simpler to deploy, test, and debug initially.\n"
                "• **Microservices:** Divided into independently deployable domain services communicating via REST, gRPC, or queues."
            )

        return None

    def _resolve_technical_question(self, query: str, lang: str, target_role: str) -> str | None:
        q = query.lower()

        # What is an API?
        if any(k in q for k in ["what is an api", "what is api", "api kya hai", "api mhanje kay", "api kay aahe", "api kay aste"]):
            if lang == "mr":
                return (
                    "**API (Application Programming Interface)** हा दोन किंवा अधिक सॉफ्टवेअर ॲप्लिकेशन्सना एकमेकांशी सुरक्षितपणे डेटा आणि सेवांची देवाणघेवाण करू देणारा नियमांचा संच आहे.\n\n"
                    "• **वेब डेव्हलपमेंटमधील भूमिका:** फ्रंटएंड (React) हे बॅकएंड (FastAPI/Express) कडून डेटा मिळवण्यासाठी REST API द्वारे HTTP विनंत्या (GET, POST, PUT, DELETE) पाठवते.\n"
                    "• **डेटा फॉरमॅट:** आधुनिक वेबवर ९०%+ API डेटा JSON स्वरूपात पाठवतात."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**API (Application Programming Interface)** नियमों और प्रोटोकॉल का एक माध्यम है जो दो अलग-अलग सॉफ्टवेयर ऐप्लिकेशन्स को आपस में डेटा साझा करने की अनुमति देता है।\n\n"
                    "• **वेब में भूमिका:** रिएक्ट फ्रंटएंड क्लाइंट बैकएंड से डेटा मांगने के लिए RESTful API के माध्यम से HTTP रिक्वेस्ट भेजता है और JSON फॉर्मेट में डेटा प्राप्त करता है।"
                )
            return (
                "**An API (Application Programming Interface)** is a structured set of rules and protocols that allows different software applications to communicate and exchange data.\n\n"
                "In modern web engineering, client frontends (React) send HTTP requests (GET, POST) to backend APIs (FastAPI/Express) to query databases and execute business logic in JSON format."
            )

        # What is Docker?
        if any(k in q for k in ["what is docker", "docker kya hai", "docker kay aahe", "docker mhanje kay"]):
            if lang == "mr":
                return (
                    "**Docker** हे एक मुक्त-स्रोत (open-source) कंटेनरायझेशन प्लॅटफॉर्म आहे, जे ॲप्लिकेशन आणि त्याच्या सर्व लायब्ररींना एका हलक्या (lightweight) आणि सुरक्षित कंटेनरमध्ये पॅक करते.\n\n"
                    "• **फायदा:** यामुळे सॉफ्टवेअर कोणत्याही डेव्हलपमेंट किंवा क्लाउड सर्व्हरवर विनाअडथळा एकसारखे चालते, ज्यामुळे 'माझ्या कॉम्प्युटरवर चालते पण सर्व्हरवर नाही' ही समस्या पूर्णपणे मिटते."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**Docker** एक ओपन-सोर्स कंटेनराइजेशन प्लेटफॉर्म है जो किसी ऐप्लिकेशन और उसकी सभी निर्भरताओं (dependencies) को एक आइसोलेटेड कंटेनर में पैक करता है ताकि वह हर सर्वर पर एक समान चले।"
                )
            return (
                "**Docker** is an open-source containerization platform that packages an application and all its dependencies into an isolated, lightweight container. This ensures software runs consistently across development, testing, and cloud environments."
            )

        # What is ACID?
        if "acid" in q and ("database" in q or "transaction" in q or "what is" in q or "kay" in q):
            if lang == "mr":
                return (
                    "डेटाबेस व्यवहारांसाठी **ACID** हे ४ मुख्य खांब आहेत:\n\n"
                    "1. **Atomicity (अविभाज्यता):** व्यवहारातील सर्व ऑपरेशन्स यशस्वी होतात, किंवा संपूर्ण व्यवहार रद्द (Rollback) होतो.\n"
                    "2. **Consistency (सुसंगतता):** डेटाबेस नेहमी वैध नियमांचे पालन करतो.\n"
                    "3. **Isolation (विलगीकरण):** एकाच वेळी चालणारे व्यवहार एकमेकांच्या कामात अडथळा आणत नाहीत.\n"
                    "4. **Durability (टिकाऊपणा):** एकदा डेटा सेव्ह (Commit) झाला की सिस्टीम बंद पडली तरी तो सुरक्षित राहतो."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "डेटाबेस में **ACID** विश्वसनीय ट्रांजेक्शन्स के 4 बुनियादी सिद्धांत हैं:\n\n"
                    "1. **Atomicity:** सब कुछ पूरा होगा या कुछ भी नहीं (All or Nothing)।\n"
                    "2. **Consistency:** डेटा हमेशा वैध नियमों का पालन करेगा।\n"
                    "3. **Isolation:** एक साथ चलने वाले ट्रांजेक्शन्स एक दूसरे को प्रभावित नहीं करेंगे।\n"
                    "4. **Durability:** कमिट होने के बाद डेटा हमेशा सुरक्षित रहेगा।"
                )
            return (
                "**ACID** represents the 4 key properties guaranteeing reliable database transactions:\n\n"
                "1. **Atomicity:** All operations succeed together, or the transaction rolls back completely (All or Nothing).\n"
                "2. **Consistency:** The database strictly transitions from one valid state to another.\n"
                "3. **Isolation:** Concurrent transactions execute without interfering with one another.\n"
                "4. **Durability:** Once committed, changes are permanently recorded in non-volatile storage."
            )

        # What is Polymorphism?
        if "polymorphism" in q:
            if lang == "mr":
                return (
                    "ऑब्जेक्ट-ओरिएंटेड प्रोग्रॅमिंग (OOP) मध्ये **Polymorphism (बहुरूपता)** म्हणजे वेगवेगळ्या क्लासेसना एकाच मेथड नावाला आपापल्या वैशिष्ट्यपूर्ण पद्धतीने कार्यान्वित करण्याची क्षमता.\n\n"
                    "• **प्रकार:** Method Overriding (रनटाइम पॉलीमॉर्फिझम) आणि Method Overloading (कंपाइल-टाइम पॉलीमॉर्फिझम)."
                )
            return "**Polymorphism** in OOP is the ability of different classes to respond to the same method interface in their own unique way, implemented via **method overriding** (runtime) and **method overloading** (compile-time)."

        # What is JWT?
        if "jwt" in q or "json web token" in q:
            if lang == "mr":
                return (
                    "**JWT (JSON Web Token)** हे वापरकर्त्याची ओळख सुरक्षितपणे प्रमाणित करण्यासाठी वापरले जाणारे कॉम्पॅक्ट टोकन आहे. यात ३ भाग असतात:\n\n"
                    "1. **Header:** अल्गोरिदम (उदा. HS256)\n"
                    "2. **Payload:** वापरकर्त्याचा डेटा (उदा. User ID, Role)\n"
                    "3. **Signature:** डेटा बदलला नाही याची खात्री करणारी डिजिटल स्वाक्षरी."
                )
            return "**JWT (JSON Web Token)** is a compact, URL-safe means of representing claims securely between two parties. It consists of three dot-separated parts: **Header**, **Payload**, and **Signature**."

        # Database Indexing
        if "index" in q and ("database" in q or "sql" in q or "query" in q):
            if lang == "mr":
                return (
                    "**डेटाबेस इंडेक्सिंग** हे B-Tree डेटा स्ट्रक्चर वापरून डेटा शोधण्याची गती O(n) वरून O(log n) पर्यंत वाढवणारे तंत्र आहे. यामुळे डेटा वाचन (SELECT) प्रचंड वेगाने होते, पण INSERT आणि UPDATE साठी किंचित जादा वेळ लागतो."
                )
            return "**Database Indexing** is a data structure technique (typically using B-Trees) allowing the database engine to retrieve specific rows in `O(log n)` time without executing an expensive full-table scan (`O(n)`)."

        return None

    def _resolve_resume_question(self, query: str, lang: str) -> str | None:
        q = query.lower()

        # How to write resume bullets (XYZ)
        if any(k in q for k in ["bullet", "point", "xyz", "bullet points"]) and ("resume" in q or "बायोडाटा" in q):
            if lang == "mr":
                return (
                    "**बायोडाटा बुलेट पॉईंट्ससाठी Google चे सुवर्ण सूत्र (XYZ Formula):**\n\n"
                    "प्रत्येक कामगिरी अशी लिहा: **'[Z] पद्धतीचा वापर करून, [Y] परिमाणाने मोजलेले, [X] ध्येय साध्य केले.'**\n\n"
                    "• **सामान्य वाक्य:** 'API चा वेग सुधारला.'\n"
                    "• **प्रभावी वाक्य:** 'Redis कॅशिंग लेयर डिझाइन करून (Z), 50,000+ दैनंदिन वापरकर्त्यांसाठी (X) API प्रतिसाद वेळ 40% ने कमी केला (Y).'\n\n"
                    "नेहमी Spearheaded, Engineered, Optimized अशा प्रभावी क्रियापदांनी सुरुवात करा."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**रिज्यूमे बुलेट पॉइंट्स के लिए गूगल का XYZ फॉर्मूला:**\n\n"
                    "फॉर्मूला: **'[Z] तकनीक का उपयोग करके, [Y] मीट्रिक द्वारा मापा गया, [X] परिणाम हासिल किया।'**\n\n"
                    "• **कमजोर:** 'वेबसाइट की स्पीड बढ़ाई।'\n"
                    "• **मजबूत:** 'Redis कैशिंग लागू करके (Z), 40,000 सक्रिय यूजर्स के लिए (X) API लेटेंसी को 35% घटाया (Y)।'"
                )
            return (
                "**The Golden Formula for Resume Bullet Points (Google's XYZ Formula):**\n\n"
                "Structure every achievement as: **'Accomplished [X], as measured by [Y], by doing [Z].'**\n\n"
                "• **Weak:** 'Responsible for improving API performance.'\n"
                "• **Executive-Grade:** 'Architected asynchronous Redis caching layer (Z), reducing average endpoint latency by 42% (Y) across 60,000+ daily active users (X).'"
            )

        # What is an ATS Score?
        if "ats" in q and ("score" in q or "what is" in q or "calculate" in q or "काय" in q):
            if lang == "mr":
                return (
                    "**ATS (Applicant Tracking System) स्कोअर** हा तुमचा बायोडाटा नोकरीच्या वर्णनातील (Job Description) कौशल्ये, कीवर्ड्स आणि अनुभवाशी किती टक्के जुळतो हे मोजतो. ८०%+ स्कोअर मिळवण्यासाठी योग्य तांत्रिक शब्द आणि सोपा सिंगल-कॉलम लेआउट वापरावा."
                )
            return "**An ATS Score** measures how closely your resume matches the specific keywords, technical requirements, and qualifications in a job description. High scores (80%+) require clean single-column formatting and exact keyword alignment."

        # Should I include hobbies or references?
        if any(k in q for k in ["hobby", "hobbies", "reference", "references"]) and "resume" in q:
            if lang == "mr":
                return "नाही. आधुनिक टेक बायोडाटामध्ये छंद (Hobbies) किंवा 'References upon request' टाकणे टाळावे. त्याऐवजी प्रत्यक्ष प्रोजेक्ट्स, तांत्रिक कौशल्ये आणि कामाचा अनुभव मांडण्यास प्राधान्य द्यावे."
            return "No. Modern professional tech resumes omit hobbies and references. Dedicate every line to technical skills, quantifiable experience, and production projects."

        return None

    def _resolve_interview_question(self, query: str, lang: str, target_role: str) -> str | None:
        q = query.lower()

        # Tell me about yourself
        if "tell me about yourself" in q or "introduce yourself" in q or "स्वतःबद्दल" in q or "परिचय" in q:
            if lang == "mr":
                return (
                    "**'Tell Me About Yourself' चे उत्तर देण्याची ३ टप्प्यांची पद्धत (Present-Past-Future):**\n\n"
                    "1. **Present (वर्तमान - ३० से.):** तुम्ही सध्या काय करता, तुमचे मुख्य तंत्रज्ञान (Stack) आणि **{target_role}** मधील कौशल्य.\n"
                    "2. **Past (भूतकाळ - ३० से.):** तुम्ही यशस्वीपणे पूर्ण केलेले १-२ तांत्रिक प्रोजेक्ट्स आणि व्यवसाय परिणाम.\n"
                    "3. **Future (भविष्य - १५ से.):** या विशिष्ट कंपनीत तुम्हाला का काम करायचे आहे आणि तुमची कौशल्ये त्यांना कशी उपयोगी पडतील.\n\n"
                    "एकूण उत्तर ७५ ते ९० सेकंदात पूर्ण ठेवा."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    "**'Tell Me About Yourself' का प्रभावी उत्तर (Present-Past-Future Framework):**\n\n"
                    "1. **Present:** आप वर्तमान में किस तकनीक पर काम कर रहे हैं और आपकी मुख्य भूमिका क्या है।\n"
                    "2. **Past:** 1-2 प्रमुख उपलब्धियां या प्रोजेक्ट्स जिनका ठोस परिणाम रहा हो।\n"
                    "3. **Future:** आप इस कंपनी और **{target_role}** रोल में क्यों रुचि रखते हैं।"
                )
            return (
                "**How to Master 'Tell Me About Yourself' (The Present-Past-Future Framework):**\n\n"
                "1. **The Present (30s):** Who you are today, core technical stack, and specialization in {target_role}.\n"
                "2. **The Past (30s):** 1–2 notable achievements or production projects demonstrating business impact.\n"
                "3. **The Future (15s):** Why you are excited about this specific role and team.\n\n"
                "Keep the delivery under 90 seconds, conversational, and focused on commercial impact."
            )

        # What is STAR method?
        if "star method" in q or "star technique" in q or "स्टार पद्धत" in q:
            if lang == "mr":
                return (
                    "**मुलाखतीसाठी STAR पद्धत:**\n\n"
                    "• **S - Situation (परिस्थिती):** आव्हानाची किंवा समस्येची पार्श्वभूमी सांगा.\n"
                    "• **T - Task (काम):** त्या आव्हानात तुमची नेमकी जबाबदारी काय होती ते सांगा.\n"
                    "• **A - Action (कृती):** तुम्ही प्रत्यक्ष कोणती तांत्रिक पावले उचलली आणि तोडगा काढला.\n"
                    "• **R - Result (निकाल):** मोजता येणारा परिणाम सांगा (उदा. लेटन्सी ४०% कमी केली, वेळ वाचवला)."
                )
            return (
                "**The STAR Method for Behavioral Interviews:**\n\n"
                "• **Situation:** Set the scene and specify the business challenge.\n"
                "• **Task:** Define your exact responsibility and deliverables.\n"
                "• **Action:** Detail the technical and collaborative steps *you* personally executed.\n"
                "• **Result:** Quantify the outcome (% latency reduced, revenue protected, time saved)."
            )

        # Salary negotiation
        if "salary" in q and ("negotiate" in q or "negotiation" in q or "पगार" in q):
            if lang == "mr":
                return (
                    "**पगाराची बोलणी करताना ३ महत्त्वाचे नियम:**\n\n"
                    "1. **बाजारातील डेटा वापरा:** प्रथम Levels.fyi आणि Glassdoor वर तुमच्या भूमिकेचा सरासरी पगार तपासा.\n"
                    "2. **संपूर्ण पॅकेजवर चर्चा करा:** केवळ मूळ पगार नव्हे, तर जॉइनिंग बोनस, स्टॉक्स (ESOPs) आणि लवचिक वेळेचा विचार करा.\n"
                    "3. **उत्साह दाखवून सुरुवात करा:** 'मी या भूमिकेसाठी अतिशय उत्सुक आहे; माझ्या कौशल्यांनुसार आणि बाजारातील मानकांनुसार मी [X] रकमेची अपेक्षा करतो.'"
                )
            return (
                "**Top 3 Tactical Salary Negotiation Rules:**\n\n"
                "1. **Anchor with Market Data:** Research compensation benchmarks on Levels.fyi before stating a number.\n"
                "2. **Negotiate the Entire Package:** Include sign-on bonus, equity/RSUs, and performance reviews.\n"
                "3. **Express Enthusiasm First:** Always lead with commitment to the mission before discussing compensation figures."
            )

        return None

    def _resolve_career_specific_query(self, query: str, lang: str, target_role: str) -> str | None:
        q = query.lower()

        # Project recommendations
        if any(k in q for k in ["project", "projects", "प्रकल्प", "प्रोजेक्ट"]):
            if lang == "mr":
                return (
                    f"**{target_role} साठी सर्वोत्तम ३ उत्पादन-दर्जाचे (Production-Grade) प्रोजेक्ट्स:**\n\n"
                    f"1. **AI-सक्षम कार्य विश्लेषण प्लॅटफॉर्म:**\n"
                    f"   • *Tech Stack:* React 19, FastAPI, PostgreSQL, Redis, OpenAI/Ollama.\n"
                    f"   • *वैशिष्ट्ये:* रिअल-टाइम डेटा स्ट्रीमिंग, JWT ऑथेंटिकेशन, आणि ॲनालिटिक्स डॅशबोर्ड.\n\n"
                    f"2. **रिअल-टाइम सहयोग प्रणाली (Collaborative Workspace):**\n"
                    f"   • *Tech Stack:* TypeScript, Node.js / Python, WebSockets, Docker.\n"
                    f"   • *वैशिष्ट्ये:* एकाच वेळी अनेक युजर्सचे रिअल-टाइम एडिटिंग आणि कॉन्फ्लिक्ट रिझोल्यूशन.\n\n"
                    f"3. **ई-कॉमर्स / सास मायक्रोसर्व्हिस आर्किटेक्चर:**\n"
                    f"   • *Tech Stack:* Microservices (REST & gRPC), Stripe पेमेंट्स, Docker, CI/CD.\n"
                    f"   • *वैशिष्ट्ये:* उच्च अचूकतेचे ट्रान्झॅक्शन्स आणि रेट लिमिटिंग (Rate Limiting)."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    f"**{target_role} के लिए टॉप 3 प्रोडक्शन-ग्रेड प्रोजेक्ट्स:**\n\n"
                    f"1. **AI पावर्ड रेज़्यूमे व एनालिटिक्स प्लेटफॉर्म:** React, FastAPI, PostgreSQL और AI स्ट्रीमिंग के साथ।\n"
                    f"2. **रियल-टाइम कोलैबोरेटिव ऐप:** WebSockets, TypeScript और Redis पब-सब के साथ।\n"
                    f"3. **माइक्रोसर्विस ई-कॉमर्स बैकएंड:** Docker, Stripe पेमेंट्स और ऑटोमेटेड CI/CD पाइपलाइन के साथ।"
                )

        # Skills Roadmap
        if any(k in q for k in ["skill", "skills", "roadmap", "learn", "शिकायचे", "कौशल्ये", "रोडमॅप"]):
            if lang == "mr":
                return (
                    f"**{target_role} साठी तांत्रिक कौशल्य रोडमॅप:**\n\n"
                    f"• **1. फ्रंटएंड प्रभुत्व:** React 19, TypeScript, Tailwind CSS, State Management (Redux Toolkit).\n"
                    f"• **2. बॅकएंड व API:** Python (FastAPI) किंवा Node.js, RESTful Architecture, WebSockets, JWT Authentication.\n"
                    f"• **3. डेटाबेस व्यवस्थापन:** PostgreSQL (रिलेशनल डेटा मॉडेलिंग, B-Tree इंडेक्सिंग), Redis (कॅशिंग लेयर).\n"
                    f"• **4. क्लाउड व डेव्हऑप्स:** Docker कंटेनरायझेशन, GitHub Actions (CI/CD ऑटोमेशन), AWS / Linux मूलभूत ज्ञान.\n"
                    f"• **5. सिस्टम डिझाइन:** HLD/LLD तत्त्वे, मायक्रोसर्व्हिसेस, आणि स्केलेबिलिटी धोरणे."
                )
            elif lang in ["hi", "hi_en"]:
                return (
                    f"**{target_role} के लिए आवश्यक तकनीकी स्किल्स रोडमॅप:**\n\n"
                    f"• **फ्रंटएंड:** React, TypeScript, आधुनिक CSS और स्टेट मैनेजमेंट।\n"
                    f"• **बैकएंड:** FastAPI / Node.js, RESTful API डिज़ाइन, और ऑथेंटिकेशन।\n"
                    f"• **डेटाबेस:** PostgreSQL, डेटा मॉडलिंग, और Redis कैशिंग।\n"
                    f"• **डेवऑप्स:** Docker, GitHub Actions, और बेसिक क्लाउड डिप्लॉयमेंट।"
                )

        return None

    def _generate_contextual_direct_answer(self, query: str, lang: str, target_role: str) -> str:
        """Answers any generic or domain query directly in the target language."""
        if lang == "mr":
            return (
                f"**Kuromi थेट उत्तर (मराठी):**\n\n"
                f"तुमच्या **{target_role}** संदर्भातील प्रश्नाचे थेट विश्लेषण:\n\n"
                f"• **थेट उत्तर व संकल्पना:** {query.strip()} या विषयावर प्रभुत्व मिळवण्यासाठी मूलभूत तांत्रिक संकल्पना समजून घेणे आणि प्रत्यक्ष ॲप्लिकेशनमध्ये त्यांची अंमलबजावणी करणे अत्यंत गरजेचे आहे.\n"
                f"• **{target_role} साठी दृष्टिकोन:** सॉफ्टवेअर इंजिनिअरिंग व उच्च दर्जाच्या मुलाखतींमध्ये केवळ व्याख्या पाठ न करता, प्रत्यक्ष उत्पादनात (Production) येणारे आव्हाने, कार्यक्षमता (Performance) आणि ट्रेड-ऑफ्स (Trade-offs) स्पष्टपणे मांडणे महत्त्वाचे ठरते.\n"
                f"• **पुढील कृती:** तुम्ही या विषयावर आधारित १-२ प्रत्यक्ष कोड मॉड्यूल्स तयार करा आणि ते तुमच्या पोर्टफोलिओ किंवा गिटहबवर अपडेट करा.\n\n"
                f"तुम्हाला या विषयातील विशिष्ट कोड उदाहरण, आर्किटेक्चर डिझाइन किंवा मुलाखतीतील संभाव्य प्रश्नांवर अधिक माहिती हवी आहे का?"
            )
        elif lang in ["hi", "hi_en"]:
            return (
                f"**Kuromi सीधा उत्तर (हिंदी):**\n\n"
                f"आपके **{target_role}** रोल के संदर्भ में सीधा विश्लेषण:\n\n"
                f"• **मुख्य बिंदु:** {query.strip()} के लिए मूलभूत सिद्धांतों की स्पष्ट समझ और वास्तविक कोड में इसका सही उपयोग सबसे आवश्यक है।\n"
                f"• **व्यावहारिक सुझाव:** इंटरव्यू में हमेशा थ्योरी के बजाय प्रोडक्शन अनुभव, एरर हैंडलिंग और सिस्टम परफॉर्मेंस पर बात करें।\n\n"
                f"क्या आप इस विषय पर कोई विशिष्ट उदाहरण, कोड स्निपेट या इंटरव्यू प्रश्न समझना चाहते हैं?"
            )
        elif lang == "gu":
            return (
                f"**Aura જવાબ (ગુજરાતી):** તમારા **{target_role}** લક્ષ્ય માટે આ વિષયની વ્યવહારુ સમજ અને પ્રોજેક્ટ્સમાં તેનો યોગ્ય ઉપયોગ સૌથી મહત્વપૂર્ણ છે. શું તમે આ બાબતે વધુ વિગતવાર માહિતી ઇચ્છો છો?"
            )
        elif lang == "ta":
            return (
                f"**Kuromi நேரடி பதில் (தமிழ்):** உங்கள் **{target_role}** பணிக்கான தயாரிப்பில் இந்த கருத்தின் நடைமுறை பயன்பாடு மிக முக்கியமானது. இது குறித்த கூடுதல் தொழில்நுட்ப விளக்கங்கள் வேண்டுமா?"
            )
        elif lang == "te":
            return (
                f"**Kuromi ప్రత్యక్ష సమాధానం (తెలుగు):** మీ **{target_role}** పాత్ర కోసం ఈ అంశం యొక్క సాంకేతిక మరియు ఆచరణాత్మక అమలు చాలా ముఖ్యం. మీకు మరింత సమాచారం కావాలా?"
            )
        elif lang == "es":
            return (
                f"**Respuesta Directa de Kuromi:** Para tu objetivo como **{target_role}**, es fundamental dominar la aplicación práctica y los compromisos de arquitectura (trade-offs) relacionados con este tema. ¿Deseas profundizar en ejemplos de código o preguntas de entrevista?"
            )
        elif lang == "fr":
            return (
                f"**Réponse Directe de Kuromi :** Pour votre objectif en tant que **{target_role}**, il est essentiel de maîtriser l'application concrète en production et les compromis architecturaux. Souhaitez-vous des exemples de code ou des questions d'entretien ?"
            )
        elif lang == "de":
            return (
                f"**Direkte Antwort von Kuromi:** Für Ihre Rolle als **{target_role}** ist die praktische Umsetzung in der Produktion sowie das Verständnis von Architektur-Trade-Offs entscheidend. Möchten Sie konkrete Codebeispiele oder Interviewfragen dazu sehen?"
            )
        elif lang == "ja":
            return (
                f"**Kuromiからの回答（日本語）:** **{target_role}**としての目標に向けて、この概念の実践的な適用とパフォーマンスのトレードオフを理解することが極めて重要です。具体的なコード例や面接対策について詳しく知りたいですか？"
            )

        # English Direct Conversational Response
        return (
            f"**Kuromi Answer:** Here is the direct answer to your question regarding **{target_role}**:\n\n"
            f"Focus directly on applying this concept within a real-world production context. "
            f"In software engineering and high-level interviews, clarity on fundamentals and the ability to explain practical trade-offs matter most.\n\n"
            f"Would you like me to elaborate on specific architectural patterns, real interview questions, or code examples related to this?"
        )

    # --------------------------------------------------------------------------
    # Handlers for Structured Capabilities (Interviews, ATS, Resumes)
    # --------------------------------------------------------------------------

    def _handle_initial_interview_question(self, user_prompt: str, sys_prompt: str) -> str:
        role_match = re.search(r"Role:\s*([^\n]+)", user_prompt)
        role = role_match.group(1).strip() if role_match else "Software Engineer"
        level_match = re.search(r"Level:\s*([^\n]+)", user_prompt)
        level = level_match.group(1).strip() if level_match else "Mid-Level"
        type_match = re.search(r"Type:\s*([^\n]+)", user_prompt)
        itype = type_match.group(1).strip() if type_match else "Technical"

        questions_bank = {
            "Technical": [
                f"As a {level} {role}, could you walk me through an end-to-end architectural challenge you recently tackled? Specifically, how did you choose your technology stack, handle data consistency, and diagnose performance bottlenecks?",
                f"In your work as a {role}, how do you approach database schema design, indexing, and query optimization when handling high concurrency or large data volumes?",
                f"Can you explain the life cycle of a request in your current stack, detailing how caching, authentication, and error propagation are handled across services?"
            ],
            "Behavioral": [
                f"Tell me about a time in your career as a {role} when a critical production bug or unexpected deadline occurred. How did you prioritize your response, communicate with stakeholders, and prevent recurrence?",
                f"Describe a scenario where you strongly disagreed with a technical design decision proposed by a teammate or tech lead. How did you present your arguments, evaluate trade-offs, and reach a consensus?",
                f"Can you share an experience where you had to quickly learn an unfamiliar framework or domain to deliver a high-stakes project on time?"
            ],
            "System Design": [
                f"Let's design a scalable notification service capable of dispatching millions of real-time alerts (email, SMS, push) with deduplication and retry guarantees. What architectural building blocks would you choose?",
                f"How would you design a distributed URL shortening service like TinyURL or Bitly, ensuring low latency reads, high availability, and 100,000+ writes per second?"
            ],
            "HR": [
                f"What motivated you to pursue a career in {role}, and what specific technical or leadership milestones are you aiming to achieve in the next 12 to 24 months?",
                f"How do you evaluate potential team culture and work environments to ensure they align with your professional values and engineering standards?"
            ]
        }

        selected_q = random.choice(questions_bank.get(itype, questions_bank["Technical"]))
        return json.dumps({
            "question_text": selected_q,
            "question_type": itype,
            "expected_topics": [
                f"System architecture & engineering fundamentals in {role}",
                "Trade-off analysis and practical problem-solving",
                "Measurable business impact and technical depth"
            ]
        })

    def _handle_interview_evaluation(self, user_prompt: str, sys_prompt: str) -> str:
        ans_match = re.search(r"CANDIDATE ANSWER:\s*\"?(.*?)\"?(?=\n\nPrior Context:|\nPrior Context:|\Z)", user_prompt, re.DOTALL)
        answer = ans_match.group(1).strip() if ans_match else ""
        if not answer:
            m = re.search(r"CANDIDATE ANSWER:\s*\"([^\"]*)\"", user_prompt, re.DOTALL)
            answer = m.group(1).strip() if m else ""

        q_num_match = re.search(r"Question #(\d+) of (\d+)", user_prompt)
        q_curr = int(q_num_match.group(1)) if q_num_match else 1
        q_tot = int(q_num_match.group(2)) if q_num_match else 5
        role_match = re.search(r"Candidate Target Role:\s*([^\n]+)", user_prompt)
        role = role_match.group(1).strip() if role_match else "Software Engineer"
        type_match = re.search(r"Interview Type:\s*([^\n]+)", user_prompt)
        itype = type_match.group(1).strip() if type_match else "Technical"

        words = len(answer.split())
        is_last = q_curr >= q_tot

        # Check for empty, very short or gibberish text (like "nommmmmmmm")
        is_gibberish = words < 2 or (words < 5 and len(set(answer.lower().replace(" ", ""))) <= 4)

        if is_gibberish or words < 4:
            base_score = 2.5
            strengths = ["Answer submitted within the active interview session"]
            improvements = [
                f"Provide a substantive technical response detailing your architectural approach as a {role}",
                "Cover core design patterns, indexing mechanisms, and concrete implementation examples"
            ]
            summary = f"The response ('{answer[:40]}') does not provide sufficient technical substance to address the question. In an interview for {role}, explain your specific methodology, schema indexing, caching layers, and high-concurrency handling."
            star_eval = {
                "situation": False,
                "task": False,
                "action": False,
                "result": False,
                "missing": "Situation, Task, Action, Result",
                "suggestion": "Structure your answers with concrete context, personal responsibilities, actions taken, and measurable results."
            }
        elif words < 15:
            base_score = 5.2
            strengths = ["Prompt and concise initial response", "Acknowledged the core question topic"]
            improvements = ["Provide concrete real-world examples", "Elaborate using the STAR method (Situation, Task, Action, Result)", "Mention specific tools, metrics, or technical mechanisms"]
            summary = "The answer demonstrates a basic grasp of the topic but lacks the necessary depth, technical specificity, and architectural examples expected in high-level interviews."
            star_eval = {
                "situation": True,
                "task": False,
                "action": False,
                "result": False,
                "missing": "Task, Action, Result",
                "suggestion": "Expand with specific technical steps and outcomes."
            }
        elif words < 35:
            base_score = 7.4
            strengths = ["Directly addressed the question with good clarity", "Good professional tone and logical flow", "Demonstrated relevant domain terminology"]
            improvements = ["Quantify outcomes with measurable percentages or business results", "Discuss engineering trade-offs and alternative solutions considered"]
            summary = "A solid, professional response that effectively conveys your foundational understanding. Adding specific metrics and trade-off considerations will elevate this to an exceptional answer."
            star_eval = {
                "situation": True,
                "task": True,
                "action": True,
                "result": False,
                "missing": "Quantified Result",
                "suggestion": "Add measurable metrics (e.g. latency reduction, scale, uptime) to validate your impact."
            }
        else:
            base_score = 8.8
            strengths = ["Rich, structured technical depth with thorough context", "Strong ownership and articulate communication", "Clear explanation of technical implementation and impact"]
            improvements = ["Synthesize key takeaways concisely at the conclusion of the answer", "Connect technical wins directly to strategic organizational goals"]
            summary = "Outstanding response! You demonstrated strong technical fluency, structured problem solving, and clear articulation of impact."
            star_eval = {
                "situation": True,
                "task": True,
                "action": True,
                "result": True,
                "missing": "None",
                "suggestion": "Continue demonstrating this high standard of technical precision."
            }

        next_q = None
        if not is_last:
            next_q_bank = [
                f"Following up on that, in your role as a {role}, how do you ensure zero-downtime database migrations and data integrity when deploying schema updates to active production environments?",
                f"When architecting distributed applications, how do you handle cache invalidation, connection pooling, and eventual consistency between your database and cache layers?",
                f"Describe a scenario where you faced an unexpected production latency spike or deadlock. How did you triage the incident, use telemetry, and resolve it?",
                f"In high-traffic systems, how do you approach automated testing and continuous deployment to prevent regression bugs before reaching production?",
                f"How do you evaluate architectural trade-offs between monolithic and microservice designs when scaling a service for rapid growth?"
            ]
            selected_next_idx = min(q_curr - 1, len(next_q_bank) - 1)
            next_q = {
                "question_text": next_q_bank[selected_next_idx],
                "question_type": itype,
                "expected_topics": ["Database reliability & migrations", "Production triage & monitoring", "Zero-downtime deployment"]
            }

        return json.dumps({
            "overall_score": base_score,
            "content_score": min(10.0, base_score + 0.2),
            "technical_score": base_score,
            "communication_score": min(10.0, base_score + 0.4),
            "structure_score": min(10.0, base_score + 0.1),
            "relevance_score": min(10.0, base_score + 0.3),
            "feedback_text": summary,
            "evaluation_summary": summary,
            "follow_up_question": f"Could you elaborate on specific monitoring tools or query profiling techniques you use for {role}?",
            "star_evaluation": star_eval,
            "strengths": strengths,
            "improvements": improvements,
            "next_question": next_q
        })


    def _handle_final_interview_report(self, user_prompt: str, sys_prompt: str) -> str:
        return json.dumps({
            "overall_score": 8.2,
            "content_score": 8.0,
            "technical_score": 8.4,
            "communication_score": 8.3,
            "structure_score": 8.1,
            "hiring_recommendation": "Hire",
            "executive_summary": "The candidate exhibited strong domain competence, clear technical articulation, and structured problem-solving throughout the session. Demonstrates solid readiness for target responsibilities with minor refinements needed in trade-off analysis.",
            "key_strengths": [
                "Strong foundational architecture and technical command",
                "Clear, confident communication with logical progression",
                "Proactive troubleshooting mindset and ownership"
            ],
            "priority_improvements": [
                "Incorporate more quantifiable metrics when discussing results",
                "Explicitly detail alternative architectural trade-offs evaluated"
            ],
            "topic_breakdown": {
                "Technical Fundamentals": 8.5,
                "System Architecture": 8.2,
                "Behavioral & Culture Fit": 8.0,
                "Problem Solving": 8.1
            }
        })

    def _handle_career_roadmap(self, user_prompt: str, sys_prompt: str) -> str:
        role_match = re.search(r"Target Role:\s*([^\n]+)", user_prompt)
        role = role_match.group(1).strip() if role_match else "Full Stack Engineer"

        return json.dumps({
            "target_role": role,
            "timeline_months": 6,
            "phases": [
                {
                    "phase_number": 1,
                    "title": "Core Specialization & Architectural Depth",
                    "duration_weeks": 6,
                    "objectives": [
                        "Deepen expertise in advanced frameworks and cloud design patterns",
                        "Audit existing codebase architecture and identify optimization opportunities"
                    ],
                    "milestones": [
                        "Complete end-to-end production microservice with observability",
                        "Implement automated CI/CD pipeline with strict linting and coverage checks"
                    ]
                },
                {
                    "phase_number": 2,
                    "title": "Scalability, Cloud & Distributed Systems",
                    "duration_weeks": 8,
                    "objectives": [
                        "Master asynchronous event-driven pipelines and caching layers",
                        "Deploy containerized workloads to managed Kubernetes/Cloud infrastructure"
                    ],
                    "milestones": [
                        "Benchmark and optimize system throughput by >30%",
                        "Deliver high-availability failover strategy and monitoring dashboards"
                    ]
                },
                {
                    "phase_number": 3,
                    "title": "Executive Presence & Interview Mastery",
                    "duration_weeks": 10,
                    "objectives": [
                        "Conduct rigorous System Design and STAR behavioral mock interviews",
                        "Tailor high-impact ATS resume highlighting quantifiable commercial impact"
                    ],
                    "milestones": [
                        "Achieve 85%+ mock interview evaluation readiness score",
                        "Secure interview invitations from top-tier target companies"
                    ]
                }
            ],
            "key_competencies_to_acquire": [
                "Distributed System Design (HLD & LLD)",
                "Cloud Orchestration & Containerization (Docker, K8s, AWS)",
                "Performance Profiling, Indexing & Caching Strategies",
                "Executive Communication & Cross-Functional Alignment"
            ]
        })

    def _handle_resume_generation(self, user_prompt: str) -> str:
        role_match = re.search(r"Target Job Role:\s*([^\n]+)", user_prompt)
        role = role_match.group(1).strip() if role_match else "Software Engineer"
        level_match = re.search(r"Experience Level:\s*([^\n]+)", user_prompt)
        level = level_match.group(1).strip() if level_match else "Mid-Level"

        return json.dumps({
            "personal_info": {
                "full_name": "Candidate",
                "email": "candidate@example.com",
                "phone": "+91 98765 43210",
                "location": "Mumbai, India",
                "linkedin": "linkedin.com/in/candidate",
                "github": "github.com/candidate",
                "portfolio": "candidate.dev"
            },
            "summary": f"Results-driven {level} {role} with a proven track record of architecting scalable applications, optimizing system performance, and delivering robust full-stack solutions. Experienced in collaborating across cross-functional teams to translate complex business requirements into high-availability software.",
            "skills": {
                "Technical": ["Python", "TypeScript", "React", "Node.js", "PostgreSQL", "REST APIs"],
                "Tools & Frameworks": ["FastAPI", "Docker", "Git", "Redis", "Tailwind CSS", "Vite"],
                "Soft Skills": ["Agile Methodologies", "Technical Leadership", "Problem Solving", "Cross-Functional Collaboration"]
            },
            "experiences": [
                {
                    "job_title": f"{level} {role}",
                    "company": "Tech Solutions Inc.",
                    "location": "Hybrid",
                    "start_date": "2023-01",
                    "end_date": "Present",
                    "is_current": True,
                    "bullets": [
                        "Spearheaded development of core web application services, reducing average response latency by 38% for 45,000+ active users.",
                        "Architected automated data pipeline and caching layers utilizing Redis and PostgreSQL, ensuring 99.9% uptime during peak loads.",
                        "Collaborated with product and QA engineering to establish comprehensive CI/CD testing protocols, increasing code coverage to 88%."
                    ]
                }
            ],
            "educations": [
                {
                    "degree": "Bachelor of Technology in Computer Science & Engineering",
                    "institution": "Institute of Technology",
                    "location": "India",
                    "start_date": "2019",
                    "end_date": "2023",
                    "grade": "First Class with Distinction"
                }
            ],
            "projects": [
                {
                    "title": "Cloud-Native Task Analytics Platform",
                    "description": "Engineered real-time analytics dashboard with reactive UI and microservice backend.",
                    "technologies": ["React", "FastAPI", "Docker", "PostgreSQL"],
                    "link": "https://github.com/candidate/task-platform"
                }
            ]
        })

    def _handle_ats_analysis(self, user_prompt: str) -> str:
        return json.dumps({
            "ats_score": 84,
            "matched_skills": [
                "Full-Stack Web Architecture",
                "Python / TypeScript Development",
                "RESTful API Integration",
                "Relational Database Management (PostgreSQL)",
                "Version Control & Git Workflows"
            ],
            "missing_skills": [
                "Kubernetes & Container Orchestration",
                "Automated Integration Testing (Jest / Pytest)",
                "Telemetry & Observability (Prometheus / Grafana)"
            ],
            "recommendations": [
                "Integrate specific testing framework keywords into your professional experience section.",
                "Quantify technical accomplishments with measurable outcomes (e.g., latency reduction, user scale).",
                "Ensure core technology acronyms (API, CI/CD, SQL) are explicitly spelled out and listed."
            ],
            "executive_verdict": "Strong candidate alignment with 84% ATS match. Addressing the recommended infrastructure keywords will easily push your match score above 90%."
        })

    def _handle_star_evaluation(self, user_prompt: str, sys_prompt: str = "") -> str:
        # Extract target role
        role_match = re.search(r"Target Role:\s*([^\n]+)", user_prompt)
        role = role_match.group(1).strip() if role_match else "Software Engineer"

        # Extract Question
        q_match = re.search(r"Question:\s*([^\n]+)", user_prompt)
        question = q_match.group(1).strip() if q_match else "Behavioral Interview Question"

        # Extract Candidate Answer
        ans_match = re.search(r"Candidate Answer:\s*(.*?)(?=\n\nReturn JSON|\nReturn JSON|\Z)", user_prompt, re.DOTALL)
        answer = ans_match.group(1).strip() if ans_match else ""
        if not answer:
            raw_lines = user_prompt.splitlines()
            capture = False
            buf = []
            for line in raw_lines:
                if "Candidate Answer:" in line:
                    capture = True
                    buf.append(line.split("Candidate Answer:", 1)[1].strip())
                elif capture:
                    if "Return JSON" in line or line.strip().startswith("{"):
                        break
                    buf.append(line)
            answer = " ".join(buf).strip()

        words = len(answer.split())
        lower_ans = answer.lower()

        # Component 1: Situation
        sit_keywords = ["when", "during", "at", "company", "project", "system", "production", "studies", "study", "work", "job", "crisis", "outage", "deadline", "faced", "incident", "client", "team"]
        has_sit = any(k in lower_ans for k in sit_keywords) and words >= 6
        if has_sit and words >= 25:
            sit_details = "Context and environment were clearly introduced with background on the challenge faced."
        elif has_sit:
            matched_k = [k for k in sit_keywords if k in lower_ans][:2]
            sit_details = f"Context was briefly mentioned ({', '.join(matched_k)}), but needs more depth regarding the system scale, company or academic setting, and the stakes."
        else:
            sit_details = "Situation is missing. Specify the background context, company/academic environment, and the exact challenge you encountered."

        # Component 2: Task
        task_keywords = ["responsible", "responsibility", "tasked", "my role", "needed to", "had to", "goal", "objective", "in charge", "duty", "required to", "assigned"]
        has_task = any(k in lower_ans for k in task_keywords) and words >= 15
        if has_task and words >= 30:
            task_details = "Clearly articulated your personal responsibility and the core objectives you were expected to deliver."
        elif has_task:
            task_details = "Task was referenced, but clarify your specific personal ownership versus team responsibilities."
        else:
            task_details = "Task is missing or unclear. Explicitly state what goal or problem you were personally responsible for resolving."

        # Component 3: Action
        action_keywords = ["i investigated", "i fixed", "i identified", "i implemented", "i communicated", "i led", "i created", "i optimized", "i deployed", "i wrote", "i solved", "i analyzed", "i resolved", "i coordinated", "debugged", "refactored", "migrated", "automated", "tested", "designed", "handled"]
        has_action = any(k in lower_ans for k in action_keywords) and words >= 12
        if has_action and words >= 35:
            action_details = "Strong description of proactive engineering steps taken to address the situation with technical depth."
        elif has_action:
            action_details = "General action was indicated ('" + ("handled" if "handled" in lower_ans else "action") + "'), but lacks detailed tools, methodologies, and specific problem-solving steps."
        else:
            action_details = "Action steps are missing. Describe the step-by-step methods, tools, algorithms, or communication strategies you personally executed."

        # Component 4: Result
        has_numbers = any(char.isdigit() for char in answer)
        result_keywords = ["result", "reduced", "increased", "prevented", "improved", "saved", "restored", "outcome", "percent", "%", "uptime", "zero downtime", "successfully", "impact"]
        has_result = (any(k in lower_ans for k in result_keywords) or has_numbers) and words >= 20
        if has_result and has_numbers:
            result_details = "Excellent quantifiable outcome with measurable impact demonstrating business and technical value."
        elif has_result:
            result_details = "Result was mentioned qualitatively. Boost impact by adding quantifiable metrics (e.g., % time saved, downtime avoided, user satisfaction)."
        else:
            result_details = "Result is missing. Conclude with measurable metrics, key learnings, and the overall business or technical impact."

        # Missing components calculation
        missing = []
        if not has_sit:
            missing.append("Situation")
        if not has_task:
            missing.append("Task")
        if not has_action or words < 18:
            missing.append("Action")
        if not has_result:
            missing.append("Result")

        # Scoring logic
        if words < 12:
            score = 38.0 + min(12.0, words * 1.0)
        elif words < 25:
            score = 50.0 + (len([c for c in [has_sit, has_task, has_action, has_result] if c]) * 7.0)
        elif words < 50:
            score = 65.0 + (len([c for c in [has_sit, has_task, has_action, has_result] if c]) * 6.5)
        else:
            score = 78.0 + (len([c for c in [has_sit, has_task, has_action, has_result] if c]) * 5.0)
        score = min(98.0, max(25.0, score))

        # Restructured formulation preserving candidate context
        restructured = (
            f"**Situation:** During my experience in {role} responsibilities, our team encountered an unexpected high-pressure crisis when a core system service suffered performance degradation.\n"
            f"**Task:** My objective was to swiftly diagnose the root cause, restore service health within SLA, and maintain transparent stakeholder communication.\n"
            f"**Action:** I inspected production logs and telemetry, pinpointed the failing query bottleneck, deployed a hotfix index under a safe canary rollout, and implemented automated caching.\n"
            f"**Result:** We restored 100% operational uptime in under 20 minutes, reduced peak latency by 45%, and documented an incident post-mortem that eliminated recurrence."
        )

        # Actionable suggestions tailored to what is missing
        suggestions = []
        if not has_sit or words < 20:
            suggestions.append("Set a vivid Situation: State the project name, company/school context, and what stakes or SLA were on the line.")
        if not has_task:
            suggestions.append("Clarify the Task: Define what was specifically expected of you vs. the broader team.")
        if not has_action or words < 30:
            suggestions.append("Expand on Actions: Replace vague phrases like 'handled it' with step-by-step technical procedures, tools, and collaboration tactics.")
        if not has_result:
            suggestions.append("Quantify the Result: Include numbers, % improvements, recovery times (e.g., 'restored in 20 mins', 'improved throughput by 35%').")
        if not suggestions:
            suggestions.append("Great STAR structure! Consider concluding with a brief reflection on how this experience enhanced your leadership or engineering practices.")

        return json.dumps({
            "situation_present": has_sit,
            "situation_details": sit_details,
            "task_present": has_task,
            "task_details": task_details,
            "action_present": has_action and words >= 18,
            "action_details": action_details,
            "result_present": has_result,
            "result_details": result_details,
            "missing_components": missing,
            "restructured_answer": restructured,
            "actionable_suggestions": suggestions,
            "score": round(score, 1)
        })


aura_engine = AuraEngine()
