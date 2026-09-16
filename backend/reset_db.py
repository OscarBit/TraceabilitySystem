import os
import bcrypt
from app.database import engine, Base, SessionLocal
from app.models import Persona, RolPersona

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Seeding initial admin user...")
    db = SessionLocal()
    
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        admin_email = os.getenv("ADMIN_EMAIL", "oebolanoso@unal.edu.co")
        admin_nombre = os.getenv("ADMIN_NOMBRE", "Administrador Principal")

        # Create hashed password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), salt).decode('utf-8')
        
        # Create admin user
        admin_user = Persona(
            nombre=admin_nombre,
            username=admin_username,
            email=admin_email,
            password_hash=hashed_password,
            rol=RolPersona.Administrador
        )
        
        db.add(admin_user)
        db.commit()
        print(f"Admin user created successfully! Username: {admin_username} | Email: {admin_email}")
    except Exception as e:
        print(f"Error seeding admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
