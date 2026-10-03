import httpx
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_pipeline():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Health check
        h = client.get("/health")
        assert h.status_code == 200, f"Health check failed: {h.text}"
        print("[PASS] 1. Backend Health Check: OK")

        # 2. Register
        test_email = "alex.rivera@example.com"
        reg_payload = {
            "full_name": "Yash",
            "email": test_email,
            "password": "Password123!",
            "phone": "+1 (555) 234-5678",
            "experience_level": "Mid-Level",
            "target_job_role": "Full Stack Engineer"
        }
        reg_res = client.post("/auth/register", json=reg_payload)
        if reg_res.status_code == 400:
            # Login if user already exists
            login_res = client.post("/auth/login", json={"email": test_email, "password": "Password123!"})
            assert login_res.status_code == 200, f"Login failed: {login_res.text}"
            token = login_res.json()["access_token"]
            print("[PASS] 2. User Login: OK")
        else:
            assert reg_res.status_code == 201, f"Register failed: {reg_res.text}"
            token = reg_res.json()["access_token"]
            print("[PASS] 2. User Registration: OK")

        headers = {"Authorization": f"Bearer {token}"}

        # 3. Get /me
        me = client.get("/auth/me", headers=headers)
        assert me.status_code == 200
        print(f"[PASS] 3. Auth Me: OK (User: {me.json()['full_name']})")

        # 4. Add Skills
        s1 = client.post("/profile/skills", json={"name": "TypeScript", "category": "Technical", "proficiency": "Advanced"}, headers=headers)
        assert s1.status_code == 201
        s2 = client.post("/profile/skills", json={"name": "FastAPI", "category": "Technical", "proficiency": "Advanced"}, headers=headers)
        assert s2.status_code == 201
        s3 = client.post("/profile/skills", json={"name": "PostgreSQL", "category": "Technologies", "proficiency": "Intermediate"}, headers=headers)
        assert s3.status_code == 201
        print("[PASS] 4. Profile Skills CRUD: OK (3 skills added)")

        # 5. Add Experience
        exp = client.post("/profile/experiences", json={
            "company": "TechNova Corp",
            "job_title": "Full Stack Developer",
            "location": "Remote",
            "start_date": "Jan 2022",
            "end_date": "Present",
            "is_current": True,
            "responsibilities": "Architected high-throughput microservices using React and FastAPI.",
            "achievements": "Reduced API p99 latency by 42% across 5 services."
        }, headers=headers)
        assert exp.status_code == 201
        print("[PASS] 5. Profile Experience CRUD: OK")

        # 6. Dashboard Stats (Calculated strictly from database!)
        stats = client.get("/dashboard/stats", headers=headers)
        assert stats.status_code == 200
        stats_data = stats.json()
        print(f"[PASS] 6. Dashboard Calculated Stats: OK (Profile completion: {stats_data['profile_completion_percentage']}%, Skills: {stats_data['total_skills_count']})")

        # 7. Create Resume
        resume_payload = {
            "title": "Full Stack Engineer Resume",
            "target_role": "Full Stack Engineer",
            "template_name": "modern",
            "content_json": {
                "personal_info": {
                    "full_name": "Yash",
                    "email": test_email,
                    "phone": "+1 (555) 234-5678",
                    "location": "San Francisco, CA"
                },
                "summary": "Proven Full Stack Developer with 4 years building scalable services.",
                "skills": {
                    "Technical": ["TypeScript", "Python", "React", "FastAPI"],
                    "Technologies": ["PostgreSQL", "Docker", "AWS"]
                },
                "experiences": [
                    {
                        "company": "TechNova Corp",
                        "job_title": "Full Stack Developer",
                        "start_date": "2022",
                        "end_date": "Present",
                        "responsibilities": ["Engineered low-latency distributed APIs serving 50k users."]
                    }
                ]
            }
        }
        res_create = client.post("/resumes", json=resume_payload, headers=headers)
        assert res_create.status_code == 201
        resume_id = res_create.json()["id"]
        print(f"[PASS] 7. Resume Document Created: OK (ID: {resume_id})")

        # 8. Download PDF Resume (Server-side ReportLab)
        pdf_res = client.get(f"/resumes/{resume_id}/pdf", headers=headers)
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000
        print(f"[PASS] 8. ReportLab PDF Generation: OK ({len(pdf_res.content)} bytes generated)")

        # 9. Settings check
        sett = client.get("/settings", headers=headers)
        assert sett.status_code == 200
        print(f"[PASS] 9. Settings & AI Status: OK (DB: {sett.json()['database_type']}, AI Key Present: {sett.json()['has_ai_api_key']})")

        print("\n=============================================")
        print("ALL SYSTEM CAPABILITY TESTS PASSED WITH 100% SUCCESS!")
        print("=============================================")

if __name__ == "__main__":
    test_full_pipeline()
