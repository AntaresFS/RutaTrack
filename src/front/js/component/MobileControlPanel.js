import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faMapMarkedAlt, faHome, faTruck, faUserTie, faUsers, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/panelcontrol.css';

const MobileControlPanel = () => {
    const { actions } = useContext(Context);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async (event) => {
        // Prevenir el comportamiento por defecto del enlace
        event.preventDefault();

        try {
            await actions.logout();
            navigate('/');
            window.location.reload(); // Ensure the UI updates correctly
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const handleProfileRedir = () => {
        navigate('/profile');
    };

    return (
        <>
            {/* Botón vertical flotante */}
            <button
                className="fixed top-1/2 left-0 transform -translate-y-1/2 -rotate-90 bg-gray-900 text-white px-4 py-2 rounded-r-lg shadow-lg z-50 opacity-75 hover:opacity-100 transition-opacity"
                onClick={() => setIsOpen(true)}
            >
                Panel de Control
            </button>

            {/* Offcanvas lateral */}
            {isOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-40 flex justify-start">
                    <div className="w-64 bg-gray-800 bg-opacity-90 text-white shadow-lg h-full p-4 relative">
                        {/* Botón de cerrar */}
                        <button className="absolute top-4 right-4 text-white" onClick={() => setIsOpen(false)}>
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>

                        <h2 className="text-xl font-bold mb-4">Menú</h2>
                        <ul className="space-y-2">
                            <li><Link to="/Mapa" onClick={() => setIsOpen(false)}><FontAwesomeIcon icon={faMapMarkedAlt} /> Planner (Ruta)</Link></li>
                            <li><Link to="/direcciones" onClick={() => setIsOpen(false)}><FontAwesomeIcon icon={faHome} /> Mis Direcciones</Link></li>
                            <li><Link to="/flota" onClick={() => setIsOpen(false)}><FontAwesomeIcon icon={faTruck} /> Vehículos</Link></li>
                            <li><Link to="/autonomos" onClick={() => setIsOpen(false)}><FontAwesomeIcon icon={faUserTie} /> Autónomos</Link></li>
                            <li><Link to="/clientes" onClick={() => setIsOpen(false)}><FontAwesomeIcon icon={faUsers} /> Clientes</Link></li>
                        </ul>

                        <button onClick={() => { handleProfileRedir(); setIsOpen(false); }} className="my-profile-button mt-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faUser} /> Mi Perfil
                        </button>
                        <button onClick={() => { handleLogout(); setIsOpen(false); }} className="logout-button mt-4 flex items-center gap-2 text-red-400 hover:text-red-600">
                            <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileControlPanel;