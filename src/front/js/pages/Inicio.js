import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/home.css";
import { Modal } from "../component/modal";
import { Context } from '../store/appContext'
import "../../styles/home.css";


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; // Centralizamos la URL
const HEADERS = { "Content-Type": "application/json" }; // Reutilizable en peticiones

export const Inicio = () => {
    const { actions } = useContext(Context);
    const [showPassword, setShowPassword] = useState(false);

    const [signupData, setSignUpData] = useState({
        email: "",
        password: ""
    });

    const [registerData, setRegisterData] = useState({
        name: "",
        last_name: "",
        company_name: "",
        location: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [rememberMe, setRememberMe] = useState(false);

    // Función para abrir modal
    const [showModal, setShowModal] = useState({
        login: false,
        register: false,
        success: false,
        forgotPassword: false
    });

    // Manejo de mensajes
    const [messages, setMessages] = useState({
        warning: "",
        loginWarning: "",
        forgotPasswordEmail: ""
    });

    const [lastFocusedElement, setLastFocusedElement] = useState(null);

    // Función para redirigir a otra página
    const navigate = useNavigate();

    // Función para reiniciar los valores de los formularios
    const resetFormData = () => {
        setSignUpData({ email: "", password: "" });
        setRegisterData({
            name: "",
            last_name: "",
            company_name: "",
            location: "",
            email: "",
            password: "",
            confirmPassword: ""
        })
    }

    // Manejar el cierre de todos los modales
    const closeModal = () => {
        setShowModal({ login: false, register: false, success: false, forgotPassword: false });
        setMessages({ warning: "", loginWarning: "", forgotPasswordEmail: "" });
        resetFormData();  // Reinicia los valores de los formularios
        if (lastFocusedElement) lastFocusedElement.focus(); // Restore focus to the last element
    };

    // Manejar el cierre de un modal específico
    const closeSpecificModal = (modalType) => {
        setShowModal({ ...showModal, [modalType]: false });
        resetFormData();
    };

    // Función para abrir los modales con foco
    const setShowModalWithFocus = (modalState) => {
        setLastFocusedElement(document.activeElement);
        setShowModal(modalState);
    };

    // Función para cerrar los modales con la tecla Esc.
    useEffect(() => {
        let timeoutId;
        const handleEscKey = (event) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (event.key === "Escape") closeModal();
            }, 100);
        };

        document.addEventListener("keydown", handleEscKey);
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("keydown", handleEscKey);
        };
    }, []);

    // Función para modificar los valores de SignUpData
    const handleChange = (e) => {
        setSignUpData({ ...signupData, [e.target.name]: e.target.value });
    };

    // Función para manejar el cambio del checkbox "Recuérdame"
    const handleRememberMeChange = (e) => {
        setRememberMe(e.target.checked);
    };

    // Función para iniciar sesión
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessages({ ...messages, loginWarning: "" });

        try {
            const response = await axios.post(`${BACKEND_URL}/api/token`, { ...signupData, rememberMe }, {
                headers: HEADERS,
                withCredentials: true
            });

            const user = response.data.user;

            if (user) {
                actions.setUser(user);  // Guarda los datos del usuario en el store
                console.log("Usuario almacenado:", user); // Muestra los datos del usuario obtenidos en la respuesta
                console.log("Redirigiendo al perfil...");

                navigate("/profile");
            }

        } catch (error) {
            // Manejo de errores específico
            let errorMsg = "Error al iniciar sesión. Por favor, inténtalo más tarde."; // Mensaje genérico por defecto

            if (error.response) {
                // Análisis del código de estado HTTP
                switch (error.response.status) {
                    case 404:
                        errorMsg = "El usuario no existe. Por favor, verifica tus credenciales.";
                        break;
                    case 401:
                        errorMsg = "La contraseña introducida no es correcta.";
                        break;
                    default:
                        errorMsg = "Error al iniciar sesión. Por favor, inténtalo más tarde.";
                        break;
                }
            }

            setMessages({ ...messages, loginWarning: errorMsg });
        }
    };

    // Función para cambiar los valores de registerData
    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData({ ...registerData, [name]: value });
    };

    // Función para registrar un nuevo usuario
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        // Validar si las contraseñas coinciden antes de continuar
        if (registerData.password !== registerData.confirmPassword) {
            setMessages({ ...messages, warning: "Las contraseñas no coinciden" });
            return;    // Detiene la ejecución si las contraseñas no coinciden
        }

        try {
            const response = await axios.post(`${BACKEND_URL}/api/register`, registerData, { headers: HEADERS });

            if (response.status === 201) {
                setMessages({ ...messages, warning: "" })
                setShowModal({ ...showModal, register: false, success: true });
                setTimeout(() => {
                    setShowModal({ ...showModal, success: false, login: true });
                }, 3000);
            }
        } catch (error) {
            const errorMsg = error.response?.data.error || "Error en el registro";
            setMessages({ ...messages, warning: errorMsg });
        }
    };

    // Función para recuperar contraseña
    const handleForgotPasswordChange = (e) => {
        setMessages({ ...messages, forgotPasswordEmail: e.target.value });
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post(`${BACKEND_URL}/api/request-password-reset`, { email: messages.forgotPasswordEmail }, { headers: HEADERS });
            setMessages({ ...messages, successMessage: "Se ha enviado un correo electrónico a su cuenta con un enlace para restablecer su contraseña." });
            setTimeout(() => closeModal(), 3000); // Cierra el modal automáticamente después de 3 segundos
        } catch {
            setMessages({ ...messages, errorMessage: "Error al enviar el correo de recuperación. Por favor, contacte con el Administrador." });
        }
    };

    const isAuthenticated = () => {
        const token = localStorage.getItem('accessToken');
        return token !== null;
    };

    return (
        <div className="text-center">
            <div className="divprincipal" inert={showModal.login || showModal.register || showModal.success || showModal.forgotPassword}>
                <div className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">Ruta Track</h1>
                        <p className="hero-slogan">Optimiza tus rutas con inteligencia</p>
                        <p className="hero-text pb-2">
                            Ruta Track es una innovadora aplicación web y móvil diseñada para gestionar y optimizar rutas de transporte en tiempo real. Los usuarios pueden planificar trayectos, calcular costos y tiempos estimados, y recibir actualizaciones en vivo sobre el progreso del viaje.
                        </p>
                        <p className="hero-text">
                            "Transparencia y eficiencia en cada kilómetro"
                        </p>
                        <div className="button-container">
                            {isAuthenticated() ? (
                                <button type="button" className="btn-custom-primary" onClick={() => navigate("/profile")}>
                                    Ir a mi perfil
                                </button>
                            ) : (
                                <>
                                    <button type="button" className="btn-custom-primary" onClick={() => setShowModalWithFocus({ ...showModal, login: true })}>
                                        Inicia Sesión
                                    </button>
                                    <button type="button" className="btn-custom-secondary" onClick={() => setShowModalWithFocus({ ...showModal, register: true })}>
                                        Crear cuenta
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {showModal.login && (
                    <Modal title="Iniciar sesión" onClose={closeModal}>
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-lg-6 form-input fw-bold text-start">
                                    <label className="p-2" htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        placeholder="E-mail"
                                        value={signupData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="password-input col-lg-6 fw-bold text-start mb-3">
                                    <label className="p-2" htmlFor="password">Contraseña</label>
                                    <div className="password-toggle">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-control"
                                            id="password"
                                            name="password"
                                            placeholder="Contraseña"
                                            value={signupData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span
                                            className="password-toggle-icon"
                                            onClick={() => setShowPassword(prev => !prev)}
                                        >
                                            <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group text-start my-2 p-2">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    name="rememberMe"
                                    checked={rememberMe}
                                    onChange={handleRememberMeChange}
                                />
                                <label className="p-2" htmlFor="rememberMe">Recuérdame</label>
                            </div>
                            <div className="form-group text-center my-2 p-2">
                                <a
                                    href="#"
                                    className="text-decoration-none"
                                    style={{ color: "#007bff" }}
                                    onClick={() => setShowModal({ ...showModal, forgotPassword: true })}
                                >
                                    <u>He olvidado mi contraseña</u>
                                </a>
                            </div>
                            <button type="submit" className="col-lg-6 btn-custom-primary my-2">
                                Iniciar sesión
                            </button>

                            {messages.loginWarning && <p className="warning-message">{messages.loginWarning}</p>}
                        </form>
                    </Modal>
                )}

                {showModal.forgotPassword && (
                    <Modal title="Recuperar contraseña" onClose={() => closeSpecificModal('forgotPassword')}>
                        <form onSubmit={handleForgotPasswordSubmit}>
                            <div className="form-input fw-bold text-start mb-3">
                                <label className="p-2" htmlFor="forgotPasswordEmail">Correo electrónico</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="forgotPasswordEmail"
                                    placeholder="Ingrese su correo electrónico"
                                    value={messages.forgotPasswordEmail}
                                    onChange={handleForgotPasswordChange}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-custom-primary w-100 mb-4">
                                Enviar
                            </button>
                            {messages.successMessage && <p className="text-success">{messages.successMessage}</p>}
                            {messages.errorMessage && <p className="text-danger">{messages.errorMessage}</p>}
                        </form>
                    </Modal>
                )}

                {showModal.register && (
                    <Modal title="Crear cuenta" onClose={closeModal}>
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="row justify-content-start">
                                <div className="col-md-6">
                                    <div className="form-input fw-bold text-start mb-3">
                                        <label className="p-2" htmlFor="name">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="name"
                                            name="name"
                                            placeholder="Nombre"
                                            value={registerData.name}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-input fw-bold text-start mb-3">
                                        <label className="p-2" htmlFor="last_name">Apellido</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="last_name"
                                            name="last_name"
                                            placeholder="Apellido"
                                            value={registerData.last_name}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-input fw-bold text-start mb-3">
                                        <label className="p-2" htmlFor="company_name">Empresa</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="company_name"
                                            name="company_name"
                                            placeholder="Empresa"
                                            value={registerData.company_name}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-input fw-bold text-start mb-3">
                                        <label className="p-2" htmlFor="location">Población</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="location"
                                            name="location"
                                            placeholder="Población"
                                            value={registerData.location}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-input fw-bold text-start mb-3">
                                        <label className="p-2" htmlFor="registerEmail">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="registerEmail"
                                            name="email"
                                            placeholder="E-mail"
                                            value={registerData.email}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-input fw-bold text-start mb-3">
                                        <label className="p-2" htmlFor="password">Contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="password"
                                            name="password"
                                            placeholder="Contraseña"
                                            value={registerData.password}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-input fw-bold text-start mb-3">
                                        <label className="p-2" htmlFor="confirmPassword">Repetir contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Repetir contraseña"
                                            value={registerData.confirmPassword}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-custom-primary my-3 p-2">
                                        Registrar
                                    </button>
                                    {messages.warning && <p className="warning-message">{messages.warning}</p>}
                                </div>
                            </div>

                        </form>
                    </Modal>
                )}

                {showModal.success && (
                    <Modal title="¡Registro exitoso!" onClose={closeModal}>
                        <div className="text-center">
                            <h3 className="text-success">¡Registro exitoso!</h3>
                            <p>Ahora puedes iniciar sesión.</p>
                            <button
                                type="button"
                                className="btn-custom-primary"
                                onClick={closeModal}
                            >
                                Cerrar
                            </button>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
}
