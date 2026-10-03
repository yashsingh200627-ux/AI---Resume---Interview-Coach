import io
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class PDFResumeGenerator:
    @staticmethod
    def generate_pdf(content: Dict[str, Any], title: str = "Resume") -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom styles
        primary_color = colors.HexColor("#1e293b") # Slate 800
        secondary_color = colors.HexColor("#0f766e") # Teal 700
        text_color = colors.HexColor("#334155") # Slate 700
        light_color = colors.HexColor("#64748b") # Slate 500

        name_style = ParagraphStyle(
            'ResumeName',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=primary_color,
            spaceAfter=4
        )

        subtitle_style = ParagraphStyle(
            'ResumeSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            textColor=secondary_color,
            spaceAfter=6
        )

        contact_style = ParagraphStyle(
            'ResumeContact',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=light_color,
            spaceAfter=12
        )

        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=primary_color,
            spaceBefore=10,
            spaceAfter=4,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            'ResumeBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13.5,
            textColor=text_color,
            spaceAfter=4
        )

        subheading_style = ParagraphStyle(
            'ResumeSubHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10.5,
            leading=14,
            textColor=primary_color,
            spaceBefore=4,
            spaceAfter=2,
            keepWithNext=True
        )

        subdetail_style = ParagraphStyle(
            'ResumeSubDetail',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=9,
            leading=12,
            textColor=light_color,
            spaceAfter=4
        )

        bullet_style = ParagraphStyle(
            'ResumeBullet',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=text_color,
            leftIndent=14,
            firstLineIndent=-10,
            spaceAfter=2
        )

        elements = []

        # Personal Info / Header
        personal = content.get("personal_info") or {}
        name = personal.get("full_name") or personal.get("name") or "Professional Candidate"
        target_role = content.get("target_role") or personal.get("headline") or ""
        
        elements.append(Paragraph(name, name_style))
        if target_role:
            elements.append(Paragraph(target_role, subtitle_style))
        
        contact_parts = []
        if personal.get("email"): contact_parts.append(personal["email"])
        if personal.get("phone"): contact_parts.append(personal["phone"])
        if personal.get("location"): contact_parts.append(personal["location"])
        if personal.get("linkedin"): contact_parts.append(personal["linkedin"])
        if personal.get("github"): contact_parts.append(personal["github"])
        if personal.get("portfolio"): contact_parts.append(personal["portfolio"])
        
        if contact_parts:
            elements.append(Paragraph(" • ".join(contact_parts), contact_style))
        
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=8))

        # Professional Summary
        summary = content.get("summary")
        if summary:
            elements.append(Paragraph("PROFESSIONAL SUMMARY", section_heading))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=secondary_color, spaceAfter=4))
            elements.append(Paragraph(summary, body_style))
            elements.append(Spacer(1, 6))

        # Skills
        skills = content.get("skills")
        if skills:
            elements.append(Paragraph("TECHNICAL & PROFESSIONAL SKILLS", section_heading))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=secondary_color, spaceAfter=4))
            if isinstance(skills, dict):
                for cat, items in skills.items():
                    if items:
                        item_list = items if isinstance(items, list) else [str(items)]
                        elements.append(Paragraph(f"<b>{cat}:</b> {', '.join(item_list)}", body_style))
            elif isinstance(skills, list):
                skill_names = [s.get("name", str(s)) if isinstance(s, dict) else str(s) for s in skills]
                elements.append(Paragraph(", ".join(skill_names), body_style))
            elements.append(Spacer(1, 6))

        # Experience
        experiences = content.get("experiences") or content.get("experience") or []
        if experiences:
            elements.append(Paragraph("WORK EXPERIENCE", section_heading))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=secondary_color, spaceAfter=4))
            for exp in experiences:
                title_company = f"<b>{exp.get('job_title', 'Role')}</b> — {exp.get('company', 'Company')}"
                date_str = f"{exp.get('start_date', '')} – {exp.get('end_date', 'Present' if exp.get('is_current') else '')}".strip(" –")
                if exp.get('location'):
                    date_str += f" | {exp['location']}"
                
                elements.append(Paragraph(title_company, subheading_style))
                if date_str:
                    elements.append(Paragraph(date_str, subdetail_style))
                
                resps = exp.get("responsibilities")
                if resps:
                    if isinstance(resps, list):
                        for r in resps:
                            elements.append(Paragraph(f"• {r}", bullet_style))
                    elif isinstance(resps, str):
                        for line in resps.split("\n"):
                            line_clean = line.strip(" •-*")
                            if line_clean:
                                elements.append(Paragraph(f"• {line_clean}", bullet_style))

                achievements = exp.get("achievements")
                if achievements:
                    if isinstance(achievements, list):
                        for a in achievements:
                            elements.append(Paragraph(f"• <b>Key Achievement:</b> {a}", bullet_style))
                    elif isinstance(achievements, str):
                        for line in achievements.split("\n"):
                            line_clean = line.strip(" •-*")
                            if line_clean:
                                elements.append(Paragraph(f"• <b>Key Achievement:</b> {line_clean}", bullet_style))
                elements.append(Spacer(1, 4))
            elements.append(Spacer(1, 6))

        # Projects
        projects = content.get("projects") or []
        if projects:
            elements.append(Paragraph("KEY PROJECTS", section_heading))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=secondary_color, spaceAfter=4))
            for proj in projects:
                tech = f" ({proj.get('technologies')})" if proj.get('technologies') else ""
                elements.append(Paragraph(f"<b>{proj.get('name', 'Project')}</b>{tech}", subheading_style))
                if proj.get("description"):
                    elements.append(Paragraph(proj["description"], body_style))
                if proj.get("results"):
                    elements.append(Paragraph(f"• <b>Impact:</b> {proj['results']}", bullet_style))
                elements.append(Spacer(1, 4))
            elements.append(Spacer(1, 6))

        # Education
        educations = content.get("educations") or content.get("education") or []
        if educations:
            elements.append(Paragraph("EDUCATION", section_heading))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=secondary_color, spaceAfter=4))
            for edu in educations:
                deg_inst = f"<b>{edu.get('degree', 'Degree')}</b> — {edu.get('institution', 'Institution')}"
                date_part = f"{edu.get('start_year', '')} – {edu.get('end_year', '')}".strip(" –")
                if edu.get('grade'):
                    date_part += f" | Grade/GPA: {edu['grade']}"
                elements.append(Paragraph(deg_inst, subheading_style))
                if date_part:
                    elements.append(Paragraph(date_part, subdetail_style))
                elements.append(Spacer(1, 4))
            elements.append(Spacer(1, 6))

        # Certifications
        certs = content.get("certifications") or []
        if certs:
            elements.append(Paragraph("CERTIFICATIONS", section_heading))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=secondary_color, spaceAfter=4))
            for c in certs:
                c_name = c.get("name", "Certification")
                c_org = c.get("issuing_organization")
                c_date = c.get("issue_date")
                desc = f"<b>{c_name}</b>"
                if c_org: desc += f" — {c_org}"
                if c_date: desc += f" ({c_date})"
                elements.append(Paragraph(f"• {desc}", bullet_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
