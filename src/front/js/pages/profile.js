import React, { useState, useEffect, useContext, useRef } from "react";
import { Loader } from '@googlemaps/js-api-loader';
import { Context } from '../store/appContext';
import MobileControlPanel from "../component/DesktopControlPanel";
import DesktopControlPanel from "../component/DesktopControlPanel";
import '../../styles/Profile.css';



const Profile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const apiOptions = { apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY };
    const { store, actions } = useContext(Context);
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

    // Cargar usuario desde el localStorage si no está en el store
    useEffect(() => {
        if (!store.user) {
            actions.getUserFromLocalStorage(); // Obtener datos solo si no están en el store
        }
    }, []); // Solo se ejecuta una vez al montar el componente


    // Inicializar el mapa
    useEffect(() => {
        const initializeMap = () => {
            if (!mapRef.current) {
                console.error("mapRef no está disponible aún. Verifica que el contenedor del mapa tenga un tamaño válido.");
                return;
            }

            const loader = new Loader({
                apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
                version: "weekly",
            });

            loader
                .load()
                .then(() => {
                    const newMap = new window.google.maps.Map(mapRef.current, {
                        center: { lat: -34.397, lng: 150.644 },
                        zoom: 8,
                    });
                    setMap(newMap);
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

    // Mostrar un mensaje de carga si no hay datos del usuario
    if (!store.user) {
        return <p>No hay datos de localizacón de usuario.</p>;
    }


    return (
        // Contenedor principal
        <div className="profile-page-container h-100">

            {/* Mostrar el panel de control móvil o de escritorio según el tamaño de la pantalla */}
            {isMobile ? <MobileControlPanel /> : <DesktopControlPanel />}

            {/* Contenido del perfil */}
            <div className="profile-section">
                <h1>Perfil del Usuario</h1>
                {!store.user ?

                    // Mostrar un mensaje de carga si no hay datos del usuario
                    (
                        <div className="profile-loading">
                            <div className="loading-circle"></div>
                        </div>
                    ) :

                    // Mostrar los datos del usuario 
                    (
                        <div className="profile-card">
                            <div className="profile-header">
                                <img src="https://i.pravatar.cc/150" alt="Avatar" className="profile-avatar img-fluid" />
                                <div className="profile-info">
                                    <h2 className="profile-info-tittle">{store.user.name} {store.user.last_name}</h2>
                                    <p className="profile-info-body"><strong>Email: </strong> {store.user.email}</p>
                                    <p className="profile-info-body"><strong>Empresa: </strong> {store.user.company || 'No especificada'}</p>
                                    <p className="profile-info-body"><strong>Ubicación: </strong> {store.user.location || 'No especificada'}</p>
                                    <p className="profile-info-body"><strong>Fecha de creación: </strong> {new Date(store.user.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
            </div>

            {/* Sección del mapa */}
            <div className="profile-map-section">
                <div ref={mapRef} className="map-container"></div>
            </div>
        </div>
    );
};

export default Profile;
