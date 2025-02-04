import os
from sqlite3 import IntegrityError
from flask import Blueprint, abort, jsonify, request, current_app, make_response, render_template
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from api.models import db, Address, Company, User, ContactMessage, Vehicle, Client, Partner, PasswordResetToken
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity, unset_jwt_cookies
import pytz

# Habilita CORS para todas las rutas y orígenes
api = Blueprint('api', __name__)
CORS(api, supports_credentials=True)

SECRET_KEY = os.getenv('SECRET_KEY', 'tu_clave_secreta')  # Usar una variable de entorno para mayor seguridad  !!
RESET_SECRET_KEY = os.getenv('RESET_SECRET_KEY', 'tu_clave_secreta_reset')
MAIL_SENDER = os.getenv('MAIL_SENDER', 'your-email@example.com')

mail = Mail()
serializer = URLSafeTimedSerializer(RESET_SECRET_KEY)


# Endpoint para decir hola
@api.route('/api/hello', methods=['GET', 'POST'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend."
    }
    return jsonify(response_body), 200


# USUARIOS + REGISTER/LOGIN

# Obtener todos los usuarios
@api.route('/api/users', methods=['GET'])
def get_all_users():

    try:
        users = User.query.all()
        return jsonify([user.serialize() for user in users]), 200
    except Exception as e:
        print(f"Error en /api/users: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500


# Registrar un nuevo usuario
@api.route('/api/register', methods=['POST'])
def create_user():
    try:
        # Obtener los datos JSON del cuerpo de la solicitud
        data = request.get_json()
        print(data)

        # Extraer los datos del formulario
        name = data.get('name')
        last_name = data.get('last_name')
        company_name = data.get('company_name')
        location = data.get('location')
        email = data.get('email')
        password = data.get('password')        

        # Validaciones de los campos obligatorios
        if not email or not password:
            return jsonify({"error": "'Email' y 'Contraseña' son campos requeridos."}), 400
        if not name or not last_name:
            return jsonify({"error": "'Nombre' y 'Apellido' son campos requeridos."}), 400
        if not company_name:
            return jsonify({"error": "'Compañía' es un campo requerido."}), 400

    
        # Verificar si el correo ya está registrado
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "El usuario ya está registrado"}), 409
        
        # Obtener o crear la compañía
        company = Company.query.filter_by(name=company_name).first()
        if not company:
            # Si no existe la compañía, crearla
            company = Company(name=company_name)
            db.session.add(company)
            db.session.commit()  # Asegurarse de que la compañía se guarde antes de asociarla

        # Hashear la contraseña antes de almacenarla
        hashed_password = generate_password_hash(password)

        # Crear el usuario
        new_user = User(
            email=email,
            password_hash=hashed_password,
            name=name,
            last_name=last_name, 
            company_id=company.id, # Asociar la compañía al usuario
            location=location,
        )

        # Agregar el usuario a la base de datos
        db.session.add(new_user)
        db.session.commit()

        # Crear un token JWT incluyendo el company_id
        access_token = create_access_token(identity=new_user.id, additional_claims={"company_id": company.id})

        # Respuesta exitosa con el token
        return jsonify({
            "message": "Usuario registrado exitosamente",
            "token": access_token
        }), 201

    except KeyError as e:
        return jsonify({"error": f"Falta el campo: {str(e)}"}), 400
    except Exception as e:
        print(f"Error en /api/register: {e}")
        return jsonify({"error": f"Ocurrió un error inesperado: {str(e)}"}), 500


# Endpoint para iniciar sesión
@api.route('/api/token', methods=['POST'])
def login_user():
    try:
        data = request.get_json()

        # Validación de datos
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Datos inválidos. Se esperaba un JSON válido"}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({"error": "El email y la contraseña son requeridos"}), 400

        # Busca el usuario en la base de datos
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "El usuario no existe. Verifica el email ingresado."}), 404        
        
        # Verifica la contraseña
        if not check_password_hash(user.password_hash, password):
            return jsonify({"error": "La contraseña ingresada es incorrecta."}), 401
        
        # Obtener datos de la compañía
        company = Company.query.filter_by(id=user.company_id).first()
        if not company:
            return jsonify({"error": "La cuenta no está asociada a una compañía registrada."}), 403

        # Genera el token JWT
        access_token = create_access_token(identity=user.id)
 
        # Crea la respuesta con cookie HTTP-only
        return jsonify({
            "message": "Inicio de sesión exitoso.",
            "token": access_token,
            "user": {
                "name": user.name, 
                "last_name": user.last_name,
                "email": user.email,
                "company": company.name,
                "location": user.location, 
                "created_at": user.created_at
            }
        }), 200

    # Si falta una clave esperada en el JSON
    except Exception as e:
        api.logger.error(f"Clave faltante en /api/login: {e}")
        return jsonify({"error": "Faltan campos obligatorios en el cuerpo de la solicitud."}), 400
    
    # Para errores de validación o conversión de datos
    except ValueError as e:
        api.logger.error(f"Valor inválido en /api/login: {e}")
        return jsonify({"error": "Hubo un problema con los datos proporcionados."}), 400

    # Captura cualquier otro error inesperado
    except Exception as e:
        api.logger.error(f"Error en /api/login: {e}")
        return jsonify({"error": "Error interno del servidor. Por favor, intenta nuevamente más tarde."}), 500


# Ruta para solicitar recuperación de contraseña
@api.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    email = request.json.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "Si el correo existe, se enviará un enlace de recuperación."}), 200

    # Generar un token de recuperación
    token = create_access_token(identity=user.id, expires_delta=timedelta(minutes=15))

    # Almacenar el token en la base de datos
    reset_token = PasswordResetToken(
        token=token,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.session.add(reset_token)
    db.session.commit()

    # Enviar el correo con el enlace de recuperación (método provisional)
    reset_url = f"http://localhost:5000/reset-password?token={token}"
    print(f"[DEBUG] Enlace de recuperación: {reset_url}")

    return jsonify({"message": "Correo de recuperación enviado (provisional). Revisa los logs para obtener el enlace."}), 200

# Ruta para el formulario de restablecimiento
@api.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    # Procesar la solicitud de restablecimiento
    data = request.json
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"message": "Token y nueva contraseña son obligatorios."}), 400

    reset_token = PasswordResetToken.query.filter_by(token=token).first()

    if not reset_token or reset_token.expires_at < datetime.utcnow():
        return jsonify({"message": "El enlace de recuperación es inválido o ha expirado."}), 400

    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({"message": "Usuario no encontrado."}), 404

    # Actualizar la contraseña del usuario
    user.password_hash = generate_password_hash(new_password)

    # Invalidar el token después de usarlo
    db.session.delete(reset_token)
    db.session.commit()

    return jsonify({"message": "Contraseña restablecida con éxito."}), 200

# Obtener datos del usuario autenticado (con JWT)
@api.route('/api/users/me', methods=['GET'])
@jwt_required(locations=["cookies"])
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Usuario no encontrado."}), 404
    
    # Acceder a la compaía del usuario
    company = user.company  # Accede al objeto relacionado 'Company' gracias a db.Relationship
    
    # Devolver los datos del usuario junto con el nombre de la compañía
    return jsonify({
        "name": user.name,
        "last_name": user.last_name,
        "email": user.email,
        "location": user.location,
        "company": company.name,
        "created_at": user.created_at           
    })
    
      
# Cerrar sesión
@api.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Cierre de sesión exitoso"})
    unset_jwt_cookies(response)  # Elimina las cookies JWT
    return response

# COMPAÑÍAS

# Define el blueprint para las compañías
companies_bp = Blueprint('companies', __name__)

# Obtener todas las compañías registradas
@companies_bp.route('/api/companies', methods=['GET'])
def get_companies():
    try:
        companies = Company.query.all()
        return jsonify([company.serialize() for company in companies]), 200
    except Exception as e:
        print(f"Error en /api/companies: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500



# DIRECCIONES

# Define el blueprint para las direcciones
addresses_bp = Blueprint('addresses', __name__)

# Obtener todas las direcciones de la compañía
@addresses_bp.route('/api/addresses', methods=['GET'])
# @jwt_required()
def get_addresses():

    # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403
    
    try:

        # Obtener el company_id de los parámetros de la consulta (query string)
        company_id = request.args.get('company_id')

        if not company_id:
            return jsonify({"error": "Su cuenta no está asignada a una compañía registrada. Por favor, contacte con el administrador."}), 405

        # Filtrar las direcciones por el company_id
        addresses = Address.query.filter_by(company_id=company_id).all()

        # Serializar las direcciones
        return jsonify([address.serialize() for address in addresses]), 200

    except Exception as e:
        print(f"Error en /api/addresses: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500


# Añadir nueva dirección
@addresses_bp.route('/api/addresses', methods=['POST'])
def add_address():

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        data = request.get_json()
        print(f"Datos recibidos: {data}")  # Verifica qué datos está recibiendo la BD

        # Obtener los campos del cuerpo de la solicitud
        id = data.get('id')
        name = data.get('name')
        address = data.get('address')
        category = data.get('category')
        contact = data.get('contact', '')
        comments = data.get('comments', '')
        company_id = data.get('company_id')
        created_at = data.get('created_at')

        # Obtener el company_id del cuerpo de la solicitud
        company_id = data.get('company_id')

        # Verificar que los campos obligatorios están presentes
        if not name or not address or not category:
            return jsonify({"error": "Nombre, dirección y categoría son requeridos."}), 401
        
         # Verificar si la compañía existe
        if not company_id:
            return jsonify({"error": "Su usuario no está asignado a una compañía registrada. Por favor, contacte con el administrador."}), 405

        # Crear nueva instancia de Addresses asociada a la compañía
        new_address = Address(
            id=id,
            name=name,
            address=address,
            category=category,
            contact=contact,
            comments=comments,
            company_id=company_id,  # Asociar con la compañía
            created_at=created_at
        )

        # Añadir y confirmar la transacción en la base de datos
        db.session.add(new_address)
        db.session.commit()

        # Retornar la nueva dirección con el método serialize()
        return jsonify(new_address.serialize()), 201

    except Exception as e:
        print(f"Error en /api/addresses: {e}")  # Esto imprimirá el error en la consola
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500


# Editar dirección
@addresses_bp.route('/api/addresses/<int:id>', methods=['PUT'])
def update_address(id):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        data = request.get_json()
        print(f"Datos recibidos para actualizar: {data}")

        # Obtener el company_id del cuerpo de la solicitud 
        company_id = data.get('company_id')

        if not company_id:
            return jsonify({"error": "Su cuenta debe estar asociada a una compañía registrada para esta operación."}), 405

        # Buscar la dirección existente
        address = Address.query.get(id)
        if not address:
            return jsonify({"error": "Dirección no encontrada."}), 404

        # Verificar que el company_id del usuario coincida con el de la dirección
        if address.company_id != company_id:
            return jsonify({"error": "No tienes permiso para editar esta dirección."}), 403

        # Actualizar los campos
        address.name = data.get('name', address.name)
        address.address = data.get('address', address.address)
        address.category = data.get('category', address.category)
        address.contact = data.get('contact', address.contact)
        address.comments = data.get('comentarios', address.comments)

        # Confirmar la transacción en la base de datos
        db.session.commit()

        # Retornar la dirección actualizada
        return jsonify(address.serialize()), 200

    except Exception as e:
        print(f"Error en /api/addresses/{id}: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500


# Eliminar dirección
@addresses_bp.route('/api/addresses/<int:id>', methods=['DELETE'])
def delete_direccion(id):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        data = request.get_json()
        company_id = data.get('company_id')

        if not company_id:
            return jsonify({"error": "Su cuenta debe estar asociada a una compañía registrada para esta operación."}), 400

        # Buscar la dirección existente
        address = Address.query.get(id)
        if not address:
            return jsonify({"error": "Dirección no encontrada."}), 404

        # Verificar que el company_id del usuario coincida con el de la dirección
        if address.user_id != company_id:
            return jsonify({"error": "No tienes permiso para eliminar esta dirección"}), 403

        # Eliminar la dirección de la base de datos
        db.session.delete(address)
        db.session.commit()

        # Retornar un mensaje de éxito
        return jsonify({"message": "Dirección eliminada con éxito."}), 200

    except Exception as e:
        print(f"Error en /api/addresses/{id}: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500



# CLIENTES

# Define el blueprint para los clientes
clients_bp = Blueprint('clients', __name__)

# Obtener la lista de todos los clientes
@clients_bp.route('/api/clients', methods=['GET'])
def get_clients():

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        # Obtener el company_id de los parámetros de la consulta
        company_id = request.args.get('company_id')

        if not company_id:
            return jsonify({"error": "Su cuenta no está asignada a una compañía registrada. Por favor, contacte con el administrador."}), 405

        # Filtrar los clientes por el company_id
        clients = Client.query.filtery_by(company_id=company_id).all()

        # Serializar los clientes
        return jsonify([client.serialize() for client in clients])
    
    except Exception as e:
        print(f"Error en /api/clients: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500

# Crear un nuevo cliente
@clients_bp.route('/api/clients', methods=['POST'])
def add_client():

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        data = request.get_json()
        print(f"Datos recibidos: {data}")  # Verifica qué datos está recibiendo la BD

        # Obtener los campos del cuerpo de la solicitud
        id = data.get('id')
        first_name = data.get('first_name')
        last_name = data.get('lastname')
        nif = data.get('nif')
        phone = data.get('phone')
        email = data.get('email')
        address = data.get('address')
        company_id = data.get('company_id')
        created_at = data.get('created_at')

        # Obtener el company_id del cuerpo de la solicitud
        company_id = data.get('company_id')

        # Verificae que los campos obligatorios están presentes
        if not first_name or not last_name:
            return jsonify({"error": "Nombre y apellido son requeridos."}), 401
        
        # Verificar si la compañía existe
        if not company_id:
            return jsonify({"error": "Su usuario no está asignado a una compañía registrada. Por favor, contacte con el administrador."}), 405
        
        # Crear nueva instancia de Clients asociado a la compañía
        new_client = Client(
            id=id,
            first_name=first_name, 
            last_name=last_name,
            nif=nif,
            phone=phone,
            email=email,
            address=address,
            company_id=company_id,
            created_at=created_at
        )

        # Añadir y confirmar la transacción en la base de datos
        db.session.add(new_client)
        db.session.commit()

        # Retornar la nueva dirección con el método serialize()
        return jsonify(new_client.serialize()), 201
    
    except Exception as e:
        print(f"Error en /api/clients: {e}") # Imprime el error en la consola
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500


# Editar cliente
@clients_bp.route('/api/clients/<int:id>', methods=['PUT'])
def update_client(id):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        data = request.get_json()
        print(f"Datos recibidos para actualizar: {data}")

        # Obtener el company_id del cuerpo de la solicitud
        company_id = data.get('company_id')

        if not company_id:
            return jsonify({"error": "Su cuenta debe estar asociada a una compañía registrada para esta operación."}), 405
        
        # Buscar el cliente existente
        client = Client.query.get(id)
        if not client:
            return jsonify({"error": "Cliente no encontrado."}), 404
        
        # Verifica que el company_id del usuario coincida con el del cliente
        if client.company_id != company_id:
            return jsonify({"error": "No tienes permiso para editar esta dirección."}), 403
        
        #Actualizar los campos
        client.first_name = data.get('first_name', client.first_name)
        client.last_name = data.get('last_name', client.last_name)
        client.nif = data.get('nif', client.nif)
        client.phone = data.get('phone', client.phone)
        client.email = data.get('email', client.email)
        client.address = data.get('address', client.address)
        client.company_id = data.get('company_id', client.company_id)
        client.created_at = data.get('created_at', client.created_at)

        # Confirmar la transacción en la base de datos
        db.session.commit()

        # Retornar la dirección actualizada
        return jsonify(client.serialize()), 200
    
    except Exception as e:
        print(f"Error en /api/clients/{id}: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500


# Eliminar un cliente
@api.route('/api/clients/<int:id>', methods=['DELETE'])
def delete_client(id):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    client = Client.query.get_or_404(id)
    db.session.delete(client)
    db.session.commit()
    return '', 204



# VEHÍCULOS

# Metodo "GET"
@api.route('/api/vehicles', methods=['GET'])
def obtener_vehicles():

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        vehicles = Vehicle.query.all()  # Obtiene todos los vehículos de la base de datos
        return jsonify([{
            'id': vehicle.id,
            'name': vehicle.name,
            'plate': vehicles.plate,
            'tow': vehicle.tow,
            'cost_km': vehicle.cost_km,
            'cost_hour': vehicle.cost_hour,
            'axles': vehicle.axles,
            'weight': vehicle.weight,
            'fuel': vehicle.fuel,
            'emissions': vehicle.emissions,
            'company_id': vehicle.company_id,
            'created_at': vehicle.created_at.isoformat()  # Formatea la fecha
        } for vehicle in vehicles]), 200
    except Exception as e:
        return {"error": str(e)}, 500  # Devuelve un error si ocurre un problema


# Metodo "POST"
@api.route('/api/vehicles', methods=['POST'])
def crear_vehicle():

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    data = request.json

    # Validación básica de datos
    if not all(key in data for key in ['name', 'plate']):
        return {"error": "Faltan campos requeridos: Nombre y Matrícula son datos obligatorios."}, 400  # Bad Request

    # Validación de campos numéricos
    try:
        cost_km = float(data['cost_km']) if data['cost_km'] else None
        cost_hour = float(data['cost_hour']) if data['cost_hour'] else None
        axles = int(data['axles']) if data['axles'] else None
        weight = float(data['weight']) if data['weight'] else None
    except ValueError:
        return {"error": "Los valores de Costo por Km, Costo por hora, Ejes y Peso deben ser numéricos."}, 400

    nuevo_vehicle = Vehicle(
        name=data['name'],
        plate=data['plate'],
        tow=data['tow'],
        costkm=cost_km,
        cost_hour=cost_hour,
        axles=axles,
        weight=weight,
        fuel=data['fuel'],
        emissions=data['emissions'],
        company_id=data['company_id'],
        user_id=data['user_id']
    )
    
    try:
        db.session.add(nuevo_vehicle)
        db.session.commit()
        return {"message": "Vehículo creado exitosamente"}, 201
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500


#METODO PUT
@api.route('/api/vehicles/<int:id>', methods=['PUT'])
def editar_vehicle(id):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    vehicle = vehicle.query.get(id)
    
    if not vehicle:
        return jsonify({"message": "Vehículo no encontrado"}), 404

    data = request.get_json()

    vehicle.nombre = data.get('nombre', vehicle.nombre)
    vehicle.placa = data.get('placa', vehicle.placa)
    vehicle.remolque = data.get('remolque', vehicle.remolque)
    vehicle.costo_km = data.get('costo_km', vehicle.costo_km)
    vehicle.costo_hora = data.get('costo_hora', vehicle.costo_hora)
    vehicle.ejes = data.get('ejes', vehicle.ejes)
    vehicle.peso = data.get('peso', vehicle.peso)
    vehicle.combustible = data.get('combustible', vehicle.combustible)
    vehicle.emision = data.get('emision', vehicle.emision)

    db.session.commit()
    
    return jsonify({"message": "Vehículo actualizado exitosamente"}), 200


#METODO DELETE
@api.route('/api/vehicles/<int:id>', methods=['DELETE'])
def delete_vehicle(id):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    vehicle = vehicle.query.get(id)
    if vehicle:
        db.session.delete(vehicle)
        db.session.commit()
        return jsonify({'message': 'Vehículo eliminado exitosamente.'}), 200
    else:
        return jsonify({'error': 'Vehículo no encontrado.'}), 404


#EDITAR LOS DATOS DEL USUARIO DESDE "MI PERFIL"
@api.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    data = request.get_json()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Actualiza los campos permitidos
    user.name = data.get('name', user.name)
    user.last_name = data.get('last_name', user.last_name)
    user.email = data.get('email', user.email)
    user.company = data.get('company', user.company)
    user.location = data.get('location', user.location)

    db.session.commit()

    return jsonify(user.serialize()), 200


# COLABORADORES

# Define el blueprint para los partners
partners_bp = Blueprint('partners', __name__)

# Obtener todos los partners de un usuario
@partners_bp.route('/api/partners', methods=['GET'])    
def obtener_partners():

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        # Obtener el user_id de los parámetros de la consulta (query string)
        user_id = request.args.get('user_id')

        if not user_id:
            return jsonify({"error": "Falta el parámetro 'user_id'"}), 400

        # Filtrar los socios por el user_id
        partners = Partner.query.filter_by(user_id=user_id).all()

        # Serializar los socios
        return jsonify([partner.serialize() for partner in partners]), 200

    except Exception as e:
        print(f"Error en /api/partners: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500


# Crear un nuevo colaborador
@partners_bp.route('/api/partners', methods=['POST'])
def agregar_partner():

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        # Obtener datos del cuerpo de la petición (request body)
        data = request.get_json()

        # Validar si se enviaron todos los campos necesarios
        nombre = data.get('nombre')
        email = data.get('email')
        tipo_precio = data.get('tipo_precio')
        precio = data.get('precio')
        periodos_espera = data.get('periodos_espera')
        incluir_peajes = data.get('incluir_peajes')
        user_id = data.get('user_id')

        if not user_id or not nombre or not email or not tipo_precio:
            return jsonify({'error': 'Faltan datos'}), 400

        # Crear un nuevo socio
        nuevo_partner = Partner(
            nombre=nombre,
            email=email,
            tipo_precio=tipo_precio,
            precio=precio,
            periodos_espera=periodos_espera,
            incluir_peajes=incluir_peajes,
            user_id=user_id,
        )

        # Agregar el partner a la base de datos
        db.session.add(nuevo_partner)
        db.session.commit()

        # Devolver respuesta
        return jsonify({'mensaje': 'Socio agregado exitosamente', 'partner': nuevo_partner.serialize()}), 201

    except Exception as e:
        print(f"Error en /api/partners: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500

# Editar un colaborador
@partners_bp.route('/api/partners/<email>', methods=['PUT'])
def editar_partner(email):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        # Buscar el socio por su email
        partner = partner.query.filter_by(email=email).first()

        if not partner:
            return jsonify({'error': 'partner no encontrado'}), 404

        # Obtener datos del cuerpo de la petición
        data = request.get_json()

        # Actualizar los datos del socio
        partner.nombre = data.get('nombre', partner.nombre)
        partner.tipo_precio = data.get('tipo_precio', partner.tipo_precio)
        partner.precio = data.get('precio', partner.precio)
        partner.periodos_espera = data.get('periodos_espera', partner.periodos_espera)
        partner.incluir_peajes = data.get('incluir_peajes', partner.incluir_peajes)
        partner.user_id = data.get('user_id', partner.user_id)
        

        # Guardar los cambios en la base de datos
        db.session.commit()

        return jsonify({'mensaje': 'Socio actualizado exitosamente', 'partner': partner.serialize()}), 200

    except Exception as e:
        print(f"Error en /api/partners/<email>: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500

# Eliminar un colaborador
@partners_bp.route('/api/partners/<email>', methods=['DELETE'])
def eliminar_partner(email):

        # Obtener el ID de la compañía desde el token
    # claims = get_jwt()
    # company_id = claims.get('company_id')

    # if not company_id:
        # return jsonify({"error": "Su usuario no está asociado a una compañía registrada. Por favor, contacte con el Administrador."}), 403

    try:
        # Buscar el socio por su email
        partner = partner.query.filter_by(email=email).first()

        if not partner:
            return jsonify({'error': 'Socio no encontrado'}), 404

        # Eliminar el socio de la base de datos
        db.session.delete(partner)
        db.session.commit()

        return jsonify({'mensaje': 'Socio eliminado exitosamente'}), 200

    except Exception as e:
        print(f"Error en /api/partners/<email>: {e}")
        return jsonify({"error": f"Ocurrió un error en el servidor: {str(e)}"}), 500



# CONTACTO

# Define el blueprint para el mensaje de contacto
contact_bp = Blueprint('contact_messages', __name__)

# Contact
@contact_bp.route('/api/contact', methods=['POST'])
def submit_contact_form():
    try:
        data = request.get_json()
        id = data.get('id')
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        message = data.get('message')
        created_at = data.get('created_at')

        # Verifica que se haya nombre e email
        if not name or not email:
            return jsonify({"error": "Su nombre y dirección de correo electrónico son requeridos."}), 401

        # Verifica que el mensaje tenga contenido
        if not message:
            return jsonify({"error": "El mensaje debe tener contenido."}), 402

        new_message = ContactMessage(
            name=name,
            email=email,
            phone=phone,
            message=message,
            created_at=created_at
        )

        db.session.add(new_message)
        db.session.commit()

        return jsonify({"message": "Mensaje de contacto enviado exitosamente"}), 201

    except Exception as e:
        print(f"Error en /api/contact: {e}")  # Imprime el error completo
        return jsonify({"error": "Error interno del servidor"}), 500

