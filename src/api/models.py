from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.schema import UniqueConstraint
from flask_jwt_extended import JWTManager
from pytz import timezone
import pytz
import re
from sqlalchemy.orm import validates
from sqlalchemy.exc import IntegrityError


db = SQLAlchemy()
jwt = JWTManager()


from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Company(db.Model):
    __tablename__ = 'companies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    nif = db.Column(db.String(9), unique=True, nullable=True)
    address = db.Column(db.String(120), unique=False, nullable=True)
    phone = db.Column(db.Integer, unique=False, nullable=True)
    email = db.Column(db.String(34), unique=False, nullable=True)

    def __init__(self, name, nif=None, address=None, phone=None, email=None):
        self.name = name
        self.nif = nif
        self.address = address
        self.phone = phone
        self.email = email

    # Validación del campo 'nif' con un decorador de SQLAlchemy
    @validates('nif')
    def validate_nif(self, key, nif):
        if nif and not re.match(r'^[A-Z0-9]{1,8}[A-Z0-9]$', nif):  # Formato simple para el NIF
            raise ValueError("El NIF debe tener un formato válido.")
        return nif
    
    # Validación del campo 'email'
    @validates('email')
    def validate_email(self, key, email):
        if '@' not in email:
            raise ValueError("El correo electrónico no tiene un formato válido.")

    # Validación para evitar duplicados de nombre de compañía y nif
    def validate_unique(self):
        # Comprobar si ya existe una compañía con el mismo nombre
        existing_company = Company.query.filter_by(name=self.name).first()
        if existing_company:
            raise ValueError("El nombre de la compañía ya está registrado.")
        
        # Comprobar si ya existe una compañía con el mismo NIF
        if self.nif:
            existing_nif = Company.query.filter_by(nif=self.nif).first()
            if existing_nif:
                raise ValueError("El NIF ya está registrado.")

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    location = db.Column(db.String(150), nullable=True)
    timezone = db.Column(db.String(64), nullable=True, default="UTC")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relación uno a muchos con Address, Partners y Company
    company = db.relationship('Company', backref='users', lazy='select')
    direcciones = db.relationship('Direccion', backref='users', lazy='select')
    socios = db.relationship('Socio', backref='users', lazy='select')

    def __init__(self, email, password_hash, name=None, last_name=None, company=None, location=None):
        self.email = email
        self.password_hash = password_hash
        self.name = name
        self.last_name = last_name
        self.company = company
        self.location = location

    def serialize(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'last_name': self.last_name,
            'company': self.company,
            'location': self.location,
            'created_at': self.created_at.isoformat(),  # Convertir a formato ISO
            'direcciones': [direccion.serialize() for direccion in self.direcciones],
            'vehiculos': [vehiculo.serialize() for vehiculo in self.vehiculos],
            'socios' : [socio.serialize() for socio in self.socios],
        }


class Direccion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    direccion = db.Column(db.String(200), nullable=False)
    categoria = db.Column(db.String(50), nullable=False)
    contacto = db.Column(db.String(100), nullable=True)
    comentarios = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Clave foránea

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'direccion': self.direccion,
            'categoria': self.categoria,
            'contacto': self.contacto,
            'comentarios': self.comentarios,
            'user_id': self.user_id
        }
    
class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    telefono = db.Column(db.String(20))
    mensaje = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, nombre, email, mensaje, telefono=None):
        self.nombre = nombre
        self.email = email
        self.telefono = telefono
        self.mensaje = mensaje

    def serialize(self):
        # Convertir created_at a la zona horaria del usuario
        user_timezone = pytz.timezone(self.timezone) if self.timezone else pytz.utc
        created_at_in_user_timezone = self.created_at.astimezone(user_timezone)
        
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'last_name': self.last_name,
            'company': self.company,
            'location': self.location,
            'created_at': created_at_in_user_timezone.isoformat(),  # Convertir a formato ISO en la zona horaria del usuario
            'direcciones': [direccion.serialize() for direccion in self.direcciones],
            'vehiculos': [vehiculo.serialize() for vehiculo in self.vehiculos],
            'socios' : [socio.serialize() for socio in self.socios],
        }


class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    nif = db.Column(db.String(16), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Restricción única compuesta: (user_id, nif)
    # Un mismo usuario sólo puede dar de alta un mismo NIF como cliente
    __table_args__ = (UniqueConstraint('user_id', 'nif', name='unique_user_nif'),) 

    user = db.relationship('User', backref='clients')
    
    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'email': self.email
        }

class Vehiculo(db.Model):
    __tablename__ = 'vehiculos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    placa = db.Column(db.String(50), unique=True, nullable=False)
    remolque = db.Column(db.String(100), nullable=True)
    costo_km = db.Column(db.Float, nullable=True)
    costo_hora = db.Column(db.Float, nullable=True)
    ejes = db.Column(db.Integer, nullable=True)
    peso = db.Column(db.Float, nullable=True)
    combustible = db.Column(db.String(50), nullable=True)
    emision = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relación con el modelo User
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    usuario = db.relationship('User', backref='vehiculos')

    def __repr__(self):
        return f'<Vehiculo {self.nombre} - {self.placa}>'

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'placa': self.placa,
            'remolque': self.remolque,
            'costo_km': self.costo_km,
            'costo_hora': self.costo_hora,
            'ejes': self.ejes,
            'peso': self.peso,
            'combustible': self.combustible,
            'emision': self.emision,
            'created_at': self.created_at.isoformat(),  # Formato ISO
            'user_id': self.user_id
        }

class Socio(db.Model):
    __tablename__ = 'socios'

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    tipo_precio = db.Column(db.String(100), nullable=False)
    precio = db.Column(db.Float, nullable=False)
    periodos_espera = db.Column(db.Float, nullable=False)
    incluir_peajes = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __init__(self, nombre, email, tipo_precio, precio, periodos_espera, incluir_peajes, user_id):
        self.nombre = nombre
        self.email = email
        self.tipo_precio = tipo_precio
        self.precio = precio
        self.periodos_espera = periodos_espera
        self.incluir_peajes = incluir_peajes
        self.user_id = user_id

    def serialize(self):
        return {
            'id' : self.id,
            'nombre' : self.nombre,
            'email' : self.email,
            'tipo_precio' : self.tipo_precio, 
            'precio' : self.precio, 
            'periodos_espera' : self.periodos_espera,
            'incluir_peajes' : self.incluir_peajes,
            'user_id' : self.user_id
        }