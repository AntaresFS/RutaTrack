import os
import sys
from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
sys.path.append('src')
from api.utils import APIException, generate_sitemap
from api.models import db, User
from api.routes import api, addresses_bp, partners_bp, companies_bp
from flask_cors import CORS
from flask_jwt_extended import JWTManager             
from itsdangerous import URLSafeTimedSerializer
from datetime import timedelta

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../public/')

app = Flask(__name__)



# Configura CORS para permitir solicitudes desde los frontends especificados
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": ["http://localhost:3000", "https://rutatrack.onrender.com"]}})


app.url_map.strict_slashes = False

# Database configuration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = 'localhost'  # Configuración provisional para pruebas
app.config['MAIL_PORT'] = 1025
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USERNAME'] = None
app.config['MAIL_PASSWORD'] = None
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_HTTPONLY'] = True   # La cookie no se puede leer desde JavaScript
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'   # Ruta de la cookie
app.config['JWT_COOKIE_CSRF_PROTECT'] = True   # Habilita la protección CSRF para operaciones que modifican datos
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1 )  # Duración del token de acceso
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)  # Duración del token de refresco

ENV = os.getenv('FLASK_ENV', 'production')

# Configuración de cookies 
if ENV == "production":
    app.config['JWT_COOKIE_SAMESITE'] = 'None'
    app.config["JWT_COOKIE_SECURE"] = True
else:
    app.config['JWT_COOKIE_SAMESITE'] = 'None'
    app.config['JWT_COOKIE_SECURE'] = False

jwt = JWTManager(app)

ts = URLSafeTimedSerializer(app.config['JWT_SECRET_KEY'])

MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Registrar los Blueprints de los endpoints
app.register_blueprint(api)
app.register_blueprint(addresses_bp)
app.register_blueprint(partners_bp)
app.register_blueprint(companies_bp)


# Handle/serialize errors like a JSON object
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Generate sitemap with all your endpoints
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# Serve any other static file
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response

# Debug route to list all available routes
@app.route('/routes')
def show_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append(f"{rule.endpoint}: {rule.rule} ({rule.methods})")
    return jsonify(routes)

# This only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)
