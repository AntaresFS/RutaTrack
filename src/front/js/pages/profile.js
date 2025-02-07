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


    // Inicializar el mapa cuando el componente se monta
    useEffect(() => {
        // Si no hay referencia al mapa, no hacer nada
        if (!mapRef.current) return;

        // Crear una instancia del Loader de Google Maps
        const loader = new Loader({
            apiKey: apiOptions.apiKey,
            version: "weekly",
            libraries: ["places"]
        });

        // Cargar la API de Google Maps
        loader.load().then(() => {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: { lat: 40.416775, lng: -3.703790 }, // Ubicación por defecto Madrid
                zoom: 12,
            });
            const geocoder = new window.google.maps.Geocoder();

            geocoder.geocode({ address: store.user.location }, (results, status) => {
                if (status === "OK" && results[0]) {
                    const userLocation = results[0].geometry.location;

                    // Centrar el mapa en la ubicación del usuario
                    mapInstance.setCenter(userLocation);

                    // Agregar marcador en la ubicación del usuario
                    new window.google.maps.Marker({
                        position: userLocation,
                        map: mapInstance,
                        title: "Ubicación del usuario",
                    });

                    setMap(mapInstance);
                } else {
                    console.error("No se encontró la ubicación del usuario:", status);
                }
            });
        }).catch((e) => {
            console.error("Error al cargar Google Maps:", e);
        });
    }, [store.user?.location]); // Se ejecuta cuando cambia la ubicación del usuario



    // Actualizar la ubicación en el mapa cuando el usuario cambia
    useEffect(() => {

        // Si no hay ubicación del usuario o no hay mapa, no hacer nada
        if (!store.user?.location || !map) return;

        // Crear una instancia del geocodificador de Google Maps
        const geocoder = new window.google.maps.Geocoder();

        // Buscar la ubicación del usuario
        geocoder.geocode({ address: store.user.location }, (results, status) => {

            // Si se encontró la ubicación, centrar el mapa y agregar un marcador
            if (status === "OK" && results[0]) {
                const { lat, lng } = results[0].geometry.location;
                const newPosition = { lat: lat(), lng: lng() };

                map.setCenter(newPosition);
                new window.google.maps.Marker({
                    position: newPosition,
                    map,
                });
            } else {
                console.error("No se encontró la ubicación:", status);
            }
        });

    }, [store.user?.location, map]); // Se ejecuta solo si cambia la ubicación del usuario o el mapa

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