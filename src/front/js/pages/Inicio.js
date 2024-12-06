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
    const navigate = useNavigate();

    // Manejar el cierre de modales
    const closeModal = () => setShowModal({ login: false, register: false, success: false, forgotPassword: false });

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === "Escape") closeModal();
        };

        document.addEventListener("keydown", handleEscKey);
        return () => document.removeEventListener("keydown", handleEscKey);
    }, []);

    const handleChange = (e) => {
        setSignUpData({ ...signupData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        const { name, value} = e.target;
        setRegisterData({ ...registerData, [name]: value });
    };

    const handleForgotPasswordChange = (e) => {
        setMessages({ ...messages, forgotPasswordEmail: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessages({ ...messages, loginWarning: "" });

        try {
            const response = await axios.post(`${BACKEND_URL}/api/login`, signupData, { headers: HEADERS });

            if (response.status === 200) {
                const { token, user } = response.data;
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));
                navigate("/profile");
            }
        } catch (error) {
            const errorMsg = error.response?.status === 401
                ? "Usuario no registrado o credenciales incorrectas"
                : error.response?.data.error || "Error en el inicio de sesión";
            setMessages({ ...messages, loginWarning: errorMsg });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (registerData.password !== registerData.confirmPassword){
            setMessages ({ ...messages, warning: "La contraseña no coincide"})
        }

        try {
            const response = await axios.post(`${BACKEND_URL}/api/register`, registerData, { headers: HEADERS });

            if (response.status === 201) {
                setMessages({ ...messages, warning: ""})
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

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post(`${BACKEND_URL}/api/forgot-password`, { email: messages.forgotPasswordEmail }, { headers: HEADERS });
            alert("Si el correo electrónico está registrado, recibirás instrucciones para restablecer tu contraseña.");
            closeModal();
        } catch {
            alert("Error al enviar el correo de recuperación.");
        }
    };

    return (
        <div className="text-center">
            <div className="divprincipal">
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
                            <div className="form-group mb-3">
                                <label htmlFor="email" style={{ color: "red" }}>Email</label>
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
                            <div className="form-group mb-3">
                                <label htmlFor="password" style={{ color: "red" }}>Password</label>
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
                            <div className="form-group text-right mb-4">
                                <a
                                    href="#"
                                    className="text-decoration-none"
                                    style={{ color: "#007bff" }}
                                    onClick={() => setShowForgotPasswordModal(true)}
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

                {showModal.register && (
                    <Modal title="Crear cuenta" onClose={closeModal}>
                        <form onSubmit={handleRegisterSubmit}>
                            <div className="form-group mb-3">
                                <label htmlFor="name" style={{ color: "red" }}>Nombre</label>
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
                                <label htmlFor="lastName" style={{ color: "red" }}>Apellido</label>
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
                                <label htmlFor="company" style={{ color: "red" }}>Empresa</label>
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
                                <label htmlFor="location" style={{ color: "red" }}>Población</label>
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
                                <label htmlFor="registerEmail" style={{ color: "red" }}>Email</label>
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
                                <label htmlFor="password" style={{ color: "red" }}>Contraseña</label>
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
                                <label htmlFor="confirmPassword" style={{ color: "red" }}>Repetir contraseña</label>
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
};
