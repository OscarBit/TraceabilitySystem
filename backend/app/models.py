import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class RolPersona(enum.Enum):
    Cliente = "Cliente"
    Operador = "Operador"
    Tallador = "Tallador"

class EstadoPiedra(enum.Enum):
    Ingreso = "Ingreso"
    Desbaste = "Desbaste"
    Tallado = "Tallado"
    Entregado = "Entregado"

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    rol = Column(Enum(RolPersona), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)

class Ubicacion(Base):
    __tablename__ = "ubicaciones"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)

class Lote(Base):
    __tablename__ = "lotes"

    id = Column(String(50), primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("personas.id"), nullable=False)
    cantidad_piedras = Column(Integer, nullable=False)
    peso_total_ct = Column(Float, nullable=False)
    responsable_id = Column(Integer, ForeignKey("personas.id"), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    qr_token = Column(String(255), nullable=True)

    cliente = relationship("Persona", foreign_keys=[cliente_id])
    responsable = relationship("Persona", foreign_keys=[responsable_id])
    piedras = relationship("Piedra", back_populates="lote")

class Piedra(Base):
    __tablename__ = "piedras"

    id = Column(String(50), primary_key=True, index=True)
    lote_id = Column(String(50), ForeignKey("lotes.id"), nullable=False)
    estado_actual = Column(Enum(EstadoPiedra), default=EstadoPiedra.Ingreso)
    qr_token = Column(String(255), nullable=True)

    lote = relationship("Lote", back_populates="piedras")
    historial = relationship("HistorialEstadoPiedra", back_populates="piedra", order_by="HistorialEstadoPiedra.fecha_actualizacion")

class HistorialEstadoPiedra(Base):
    __tablename__ = "historial_estados_piedra"

    id = Column(Integer, primary_key=True, index=True)
    piedra_id = Column(String(50), ForeignKey("piedras.id"), nullable=False)
    estado_registrado = Column(Enum(EstadoPiedra), nullable=False)
    peso_ct = Column(Float, nullable=True)
    longitud_mm = Column(Float, nullable=True)
    ancho_mm = Column(Float, nullable=True)
    profundo_mm = Column(Float, nullable=True)
    plan_corte = Column(String(255), nullable=True)
    ubicacion_id = Column(Integer, ForeignKey("ubicaciones.id"), nullable=True)
    tallador_id = Column(Integer, ForeignKey("personas.id"), nullable=True)
    foto_url = Column(String(1024), nullable=True)
    notas = Column(Text, nullable=True)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow)

    piedra = relationship("Piedra", back_populates="historial")
    ubicacion = relationship("Ubicacion")
    tallador = relationship("Persona")
