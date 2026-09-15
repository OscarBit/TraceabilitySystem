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
        # Create hashed password for admin123
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(b"admin123", salt).decode('utf-8')
        
        # Create admin user
        admin_user = Persona(
            nombre="Administrador Principal",
            username="admin",
            password_hash=hashed_password,
            rol=RolPersona.Administrador
        )
        
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully! Username: admin | Password: admin123")
    except Exception as e:
        print(f"Error seeding admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
