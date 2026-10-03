from app.database.session import SessionLocal, init_db
from app.models.models import AdminRole, AdminUser
from app.services.auth_service import get_password_hash

def seed_admin_data():
    init_db()
    db = SessionLocal()
    try:
        # 1. Ensure Roles exist
        roles = {
            "SUPER_ADMIN": "Super Administrator with full access to all system resources",
            "ADMIN": "Standard Administrator with access to users, resumes, interviews, and jobs",
            "SUPPORT": "Support Staff with read-only access for troubleshooting",
            "ANALYST": "Data Analyst with access to analytics and aggregated metrics"
        }
        
        created_roles = {}
        for role_name, description in roles.items():
            role = db.query(AdminRole).filter(AdminRole.name == role_name).first()
            if not role:
                role = AdminRole(name=role_name, description=description)
                db.add(role)
                db.commit()
                db.refresh(role)
                print(f"[+] Created role: {role_name}")
            created_roles[role_name] = role

        # 2. Ensure Super Admin exists
        admin_email = "admin@careercoach.ai"
        admin = db.query(AdminUser).filter(AdminUser.email == admin_email).first()
        if not admin:
            admin = AdminUser(
                email=admin_email,
                hashed_password=get_password_hash("Admin123!"),
                full_name="Super Administrator",
                role_id=created_roles["SUPER_ADMIN"].id,
                status="active"
            )
            db.add(admin)
            db.commit()
            print(f"[+] Created default Super Admin user: {admin_email} (Password: Admin123!)")
        else:
            print(f"[*] Admin user {admin_email} already exists.")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin_data()
