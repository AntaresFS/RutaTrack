from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.schema import UniqueConstraint
from sqlalchemy.sql import func
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

class User(db.Model):
    # Nombre de la tabla en la base de datos
    __tablename__ = 'users'

    # Contenido de la tabla en la base de datos
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    location = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)  

    # Relación uno a muchos con Company
    company = db.relationship('Company', backref='users', lazy='select')

    # Inicializar instancia de users
    def __init__(self, email, password_hash, name, last_name, company_id, location=None, created_at=None):
        self.email = email
        self.password_hash = password_hash
        self.name = name
        self.last_name = last_name
        self.company_id = company_id
        self.location = location
        self.created_at = created_at

    # Serializar la info de User para convertirla en un diccionario de Python
    def serialize(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'last_name': self.last_name,
            'company_id' : self.company_id,
            'location': self.location,
            'created_at': self.created_at.isoformat()  # Convertir a formato ISO
        }


class Company(db.Model):

    # Nombre de la tabla en la base de datos
    __tablename__ = 'companies'

    # Contenido de la tabla en la base de datos
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    nif = db.Column(db.String(9), unique=True, nullable=True)
    address = db.Column(db.String(120), unique=False, nullable=True)
    phone = db.Column(db.String(24), unique=False, nullable=True)
    email = db.Column(db.String(34), unique=False, nullable=True)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False) # Valor por defecto asignado por la BD

    # Inicializar instancia de users
    def __init__(self, name, nif=None, address=None, phone=None, email=None, created_at=None):
        self.name = name
        self.nif = nif
        self.address = address
        self.phone = phone
        self.email = email
        self.created_at = created_at or func.now()

    # Serializar la info de User para convertirla en un diccionario de Python 
    def serialize(self):
        return {
            'id' : self.id,
            'name' : self.name,
            'nif' : self.nif, 
            'address' : self.address,
            'phone' : self.phone,
            'email' : self.email, 
            'created_at' : self.created_at.isoformat(),  # Convierte este valor en formato ISO

            # Elementos de otras clases relacionados
            'users' : [user.serialize() for user in self.users],
            'addresses': [address.serialize() for address in self.addresses],
            'vehicles': [vehicle.serialize() for vehicle in self.vehicles],
            'partners' : [partner.serialize() for partner in self.partners],
            'clients' : [client.serialize() for client in self.clients]
        }


    # Validación del campo 'nif' con un decorador de SQLAlchemy
    @validates('nif')
    def validate_nif(self, key, nif):
        if nif and not re.match(r'^[A-Z0-9]{1,8}[A-Z0-9]$', nif):  # Formato simple para el NIF
            raise ValueError("El NIF debe tener un formato válido.")
        return nif
    
    # Validación del campo 'email'
    @validates('email')
    def validate_email(self, key, email):
        if email and '@' not in email:
            raise ValueError("El correo electrónico no tiene un formato válido.")
        return email

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



class Address(db.Model):
    __tablename__ = 'addresses'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    contact = db.Column(db.String(100), nullable=True)
    comments = db.Column(db.Text, nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)

    # Relación 1 a n con Company
    company = db.relationship('Company', backref='addresses', lazy='select')

    def __init__(self, name, address, category, contact=None, comments=None, company_id=None, created_at=None):
        self.name = name
        self.address = address
        self.category = category
        self.contact = contact
        self.comments = comments
        self.company_id = company_id
        self.created_at = created_at

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'category': self.category,
            'contact': self.contact,
            'comments': self.comments,
            'company_id' : self.company_id
        }
    
    
class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)

    def __init__(self, name, email, message, phone=None, created_at=None):
        self.name = name
        self.email = email
        self.phone = phone
        self.message = message
        self.created_at = created_at

    def serialize(self):        
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone' : self.phone,
            'message': self.message,
            'created_at' : self.created_at.isoformat()  # Convertir a formato ISO  
        }


class Client(db.Model):
    __tablename__ = 'clients'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    nif = db.Column(db.String(16), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.String(120), nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)

    # Restricción única compuesta: (user_id, nif)
    # Un mismo usuario sólo puede dar de alta un mismo NIF como cliente
    __table_args__ = (UniqueConstraint('company_id', 'nif', name='unique_company_client_nif'),) 

    # Relación 1 a n con Company
    company = db.relationship('Company', backref='clients', lazy='select')
    
    def __init__(self, first_name, last_name, nif=None, phone=None, email=None, address=None, company=None, company_id=None, created_at=None) :
        self.first_name = first_name
        self.last_name = last_name
        self.nif = nif
        self.phone = phone
        self.email = email
        self.address = address
        self.company_id = company_id
        self.created_at = created_at

    def serialize(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'nif' : self.nif, 
            'phone': self.phone,
            'email': self.email,
            'address' : self.address,
            'company_id' : self.company_id,
            'created_at' : self.created_at.isoformat()  # Convertir a formato ISO  
        }

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    plate = db.Column(db.String(50), unique=True, nullable=False)
    tow = db.Column(db.String(100), nullable=True)
    cost_km = db.Column(db.Float, nullable=True)
    cost_hour = db.Column(db.Float, nullable=True)
    axles = db.Column(db.Integer, nullable=True)
    weight = db.Column(db.Float, nullable=True)
    fuel = db.Column(db.String(50), nullable=True)
    emissions = db.Column(db.String(50), nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)
    
    # Relación 1 a n con Company
    company = db.relationship('Company', backref='vehicles', lazy='select')

    def __init__(self, name, plate, tow=None, cost_km=None, cost_hour=None, axles=None, weight=None, fuel=None, emissions=None, company=None, company_id=None, created_at=None) :
        self.name = name
        self.plate = plate
        self.tow = tow
        self.cost_km = cost_km
        self.cost_hour = cost_hour
        self.axles = axles
        self.weight = weight
        self.fuel = fuel
        self.emissions = emissions
        self.company_id = company_id
        self.created_at = created_at

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'plate': self.plate,
            'tow': self.tow,
            'cost_km': self.cost_km,
            'cost_hour': self.cost_hour,
            'axles': self.axles,
            'weight': self.weight,
            'fuel': self.fuel,
            'emissions': self.emissions,
            'company' : self.company,
            'company_id' : self.company_id,
            'created_at': self.created_at.isoformat()  # Formato ISO
        }

class Partner(db.Model):
    __tablename__ = 'partners'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    price_type = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    waiting_periods = db.Column(db.Float, nullable=False)
    include_tolls = db.Column(db.Boolean, default=False)
    company = db.Column(db.String(100), nullable=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)

    # Relación 1 a n con Company
    company = db.relationship('Company', backref='partners', lazy='select')

    def __init__(self, name, email, price_type, price, waiting_periods, include_tolls, company=None, company_id=None, created_at=None):
        self.name = name
        self.email = email
        self.price_type = price_type
        self.price = price
        self.waiting_periods = waiting_periods
        self.include_tolls = include_tolls
        self.company = company
        self.company_id = company_id
        self.created_at = created_at

    def serialize(self):
        return {
            'id' : self.id,
            'name' : self.name,
            'email' : self.email,
            'price_type' : self.price_type, 
            'price' : self.price, 
            'waiting_periods' : self.waiting_periods,
            'include_tolls' : self.include_tolls,
            'company' : self.company,
            'company_id' : self.company_id,
            'created_at' : self.created_at.isoformat()  # Convertir a formato ISO
        }