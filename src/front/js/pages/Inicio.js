import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/home.css";
import { Modal } from "../component/modal";

const BACKEND_URL = process.env.BACKEND_URL; // Centralizamos la URL
const HEADERS = { "Content-Type": "application/json" }; // Reutilizable en peticiones

export const Inicio = () => {
    const [signupData, setSignUpData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({
        name: "",
        lastName: "",
        company: "",
        location: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [showModal, setShowModal] = useState({
        login: false,
        register: false,
        success: false,
        forgotPassword: false,
    });
    const [messages, setMessages] = useState({
        warning: "",
        loginWarning: "",
        forgotPasswordEmail: "",
    });

    const [lastFocusedElement, setLastFocusedElement] = useState(null);

    const navigate = useNavigate();

    // Handle modal open and focus management
    const openModal = (modalType) => {
        setLastFocusedElement(document.activeElement); // Save the focused element
        setShowModal({ ...showModal, [modalType]: true });
    };

    // Manejar el cierre de modales
    const closeModal = () => {
        setShowModal({ login: false, register: false, success: false, forgotPassword: false });
        setMessages({ warning: "", loginWarning: "", forgotPasswordEmail: "" });
        lastFocusedElement?.focus(); // Restore focus to the last element
    };

    // Función para cerrar modal con tecla Esc.
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


    const handleChange = (e) => {
        setSignUpData({ ...signupData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData({ ...registerData, [name]: value });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessages({ ...messages, loginWarning: "" });

        try {
            const response = await axios.post(`${BACKEND_URL}/api/login`, signupData, { headers: HEADERS, withCredentials: true });

            if (response.status === 200) {
                const { user } = response.data;
                localStorage.setItem("user", JSON.stringify(user));
                navigate("/profile");
            }
        } catch (error) {
            // Manejo de errores específico
            const errorMsg = error.response?.status === 401
                ? "Credenciales incorrectas. Intenta nuevamente."
                : "Error al iniciar sesión. Por favor, inténtalo más tarde.";
            setMessages({ ...messages, loginWarning: errorMsg });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (registerData.password !== registerData.confirmPassword) {
            setMessages({ ...messages, warning: "La contraseña no coincide" })
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
            await axios.post(`${BACKEND_URL}/api/forgot-password`, { email: messages.forgotPasswordEmail }, { headers: HEADERS });
            setMessages({ ...messages, successMessage: "Se ha enviado un correo electrónico a su cuenta con un enlace para restablecer su contraseña." });
            setTimeout(() => closeModal(), 3000); // Cierra el modal automáticamente después de 3 segundos
        } catch {
            setMessages({ ...messages, errorMessage: "Error al enviar el correo de recuperación." });
        }
    };

    return (
        <div className="text-center">
            <div className="divprincipal" inert={showModal.login || showModal.register || showModal.success || showModal.forgotPassword}>
                <div className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">Ruta Track</h1>
                        <p className="hero-slogan">Optimiza tus rutas con inteligencia</p>
                        <p className="hero-text">
                            Ruta Track es una innovadora aplicación web y móvil diseñada para gestionar y optimizar rutas de transporte en tiempo real. Los usuarios pueden planificar trayectos, calcular costos y tiempos estimados, y recibir actualizaciones en vivo sobre el progreso del viaje.
                        </p>
                        <p className="hero-phrase">
                            "Transparencia y eficiencia en cada kilómetro"
                        </p>
                        <div className="button-container">
                            <button type="button" className="btn-custom-primary" onClick={() => setShowModal({ ...showModal, login: true })}>
                                Inicia Sesión
                            </button>
                            <button type="button" className="btn-custom-secondary" onClick={() => setShowModal({ ...showModal, register: true })}>
                                Crear cuenta
                            </button>
                        </div>
                    </div>
                </div>

                {showModal.login && (
                    <Modal title="Iniciar sesión" onClose={closeModal}>
                        <form onSubmit={handleSubmit}>
                            <div className="form-input fw-bold text-start">
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
                            <div className="form-input fw-bold text-start mb-3">
                                <label className="p-2" htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    name="password"
                                    placeholder="Contraseña"
                                    value={signupData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group text-center mb-4">
                                <a
                                    href="#"
                                    className="text-decoration-none"
                                    style={{ color: "#007bff" }}
                                    onClick={() => setShowModal({ ...showModal, forgotPassword: true })}
                                >
                                    <u>He olvidado mi contraseña</u>
                                </a>
                            </div>
                            <button type="submit" className="btn-custom-primary w-100 mb-4">
                                Iniciar sesión
                            </button>
                            {messages.loginWarning && <p className="warning-message">{messages.loginWarning}</p>}
                        </form>
                    </Modal>
                )}

                {showModal.forgotPassword && (
                    <Modal title="Recuperar contraseña" onClose={closeModal}>
                        <form onSubmit={handleForgotPasswordSubmit}>
                            <div className="form-group mb-3">
                                <label htmlFor="forgotPasswordEmail">Correo electrónico</label>
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
                            <div className="form-group mb-3">
                                <label htmlFor="name">Nombre</label>
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
                            <div className="form-group mb-3">
                                <label htmlFor="lastName">Apellido</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Apellido"
                                    value={registerData.lastName}
                                    onChange={handleRegisterChange}
                                    required
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="company">Empresa</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="company"
                                    name="company"
                                    placeholder="Empresa"
                                    value={registerData.company}
                                    onChange={handleRegisterChange}
                                    required
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="location">Población</label>
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
                            <div className="form-group mb-3">
                                <label htmlFor="registerEmail">Email</label>
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
                            <div className="form-group mb-3">
                                <label htmlFor="password">Contraseña</label>
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
                            <div className="form-group mb-3">
                                <label htmlFor="confirmPassword">Repetir contraseña</label>
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
                            <button type="submit" className="btn-custom-primary w-100 mb-4">
                                Registrar
                            </button>
                            {messages.warning && <p className="warning-message">{messages.warning}</p>}
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
