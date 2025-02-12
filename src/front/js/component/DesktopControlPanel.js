import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Context } from '../store/appContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkedAlt, faHome, faTruck, faUserTie, faUsers, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/panelcontrol.css';

const DesktopControlPanel = () => {
    const { actions } = useContext(Context);
    const navigate = useNavigate();

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
        window.location.href = '/profile';
    };

    return (
        <div className="profile-control-panel">
            <h1 className="text-xl font-bold mb-4">Panel de Control</h1>
            <ul>
                <li><Link to="/Mapa"><FontAwesomeIcon icon={faMapMarkedAlt} /> Planner (Ruta)</Link></li>
                <li><Link to="/direcciones"><FontAwesomeIcon icon={faHome} /> Mis Direcciones</Link></li>
                <li><Link to="/flota"><FontAwesomeIcon icon={faTruck} /> Vehículos</Link></li>
                <li><Link to="/autonomos"><FontAwesomeIcon icon={faUserTie} /> Autónomos</Link></li>
                <li><Link to="/clientes"><FontAwesomeIcon icon={faUsers} /> Clientes</Link></li>
            </ul>

            <button onClick={handleProfileRedir} className="my-profile-button mt-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} /> Mi Perfil
            </button>
            <button onClick={handleLogout} className="logout-button mt-4 flex items-center gap-2 text-red-400 hover:text-red-600">
                <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
            </button>
        </div>
    );
};

export default DesktopControlPanel;