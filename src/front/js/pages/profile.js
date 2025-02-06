import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkedAlt, faHome, faTruck, faUserTie, faUsers, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Loader } from '@googlemaps/js-api-loader';
import '../../styles/Profile.css'; // Archivo CSS actualizado
import { Context } from '../store/appContext';
import ControlPanel from "../component/panelControl";

const BACKEND_URL = process.env.BACKEND_URL; // Centralizamos la URL
const HEADERS = { "Content-Type": "application/json" }; // Reutilizable en peticiones


const Profile = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const [map, setMap] = useState(null);
    const mapRef = useRef(null);

    // Mostrar el tamaño de la pantalla en la consola
    console.log(isMobile)

    // Mostrar el panel de control móvil o de escritorio según el tamaño de la pantalla
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Cargar usuario desde el localStorage si  o está en el store
    useEffect(() => {
        console.log("Ejecutando useEffect en Profile.js. Store.user:", store.user); // Agrega este log
        if (!store.user) {
            // Si no hay usuario en el estado, intenta cargarlo del localStorage
            actions.getUserFromLocalStorage();
        } else {
            // Imprime el usuario una vez que esté disponible
            console.log("Datos del usuario cargados desde el store:", store.user);
        }
    }, [store.user, actions]); // Se ejecuta cada vez que el store.user cambia

    // Inicializar el mapa
    useEffect(() => {
        const initializeMap = () => {
            if (!mapRef.current) {
                console.error("mapRef no está disponible aún. Verifica que el contenedor del mapa tenga un tamaño válido.");
                return;
            }

            const loader = new Loader({
                apiKey: apiOptions.apiKey,
                version: "weekly",
                librarys: ["places"],
            });

            loader
                .load()
                .then(() => {
              
                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                        center: { lat: -34.397, lng: 150.644 },
                        zoom: 6,
                    });
                    setMap(mapInstance);

                })
                .catch((e) => {
                    console.error("Error al cargar la API de Google Maps:", e);
                });
        };
        initializeMap();
    }, []);

    // Buscar ubicación en el mapa cuando store.user cambie
    useEffect(() => {
        if (store.user && store.user.location && map) {
            const searchLocation = async (location) => {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ address: location }, (results, status) => {
                    if (status === "OK") {
                        const { lat, lng } = results[0].geometry.location;
                        map.setCenter({ lat: lat(), lng: lng() });
                        new window.google.maps.Marker({
                            position: { lat: lat(), lng: lng() },
                            map: map,
                        });
                    } else {
                        console.error("Geocode was not successful for the following reason: " + status);
                    }
                });
            };

            searchLocation(store.user.location);
        }
    }, [store.user, map]);


    if (!store.user) {
        return <p>Cargando...</p>;
    }

    return (
        <div className="profile-page-container">
            <ControlPanel />

            <div className="profile-section">
                <h1>Perfil del Usuario</h1>
                {!store.user ? (
                    <div className="profile-loading">
                        <div className="loading-circle"></div>
                    </div>
                ) : (
                    <div className="profile-card">
                        <div className="profile-header">
                            <img src="https://i.pravatar.cc/150" alt="Avatar" className="profile-avatar" />
                            <div className="profile-info">
                                <h2>{store.user.name} {store.user.last_name}</h2>
                                <p><strong>Email:</strong> {store.user.email}</p>
                                <p><strong>Empresa:</strong> {store.user.company || 'No especificada'}</p>
                                <p><strong>Ubicación:</strong> {store.user.location || 'No especificada'}</p>
                                <p><strong>Cuenta creada en:</strong> {new Date(store.user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="profile-map-section">
                <div ref={mapRef} className="map-container"></div>
            </div>
        </div>
    );
};

export default Profile;
