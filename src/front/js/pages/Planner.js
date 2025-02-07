import React, { useEffect, useRef, useState, useContext } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import CalculateDistance from '../component/calculateDistance';
import MobileControlPanel from "../component/DesktopControlPanel";
import DesktopControlPanel from "../component/DesktopControlPanel";
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

const Mapa = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const apiOptions = { apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY };
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();

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
            actions.getUserFromLocalStorage();
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
                apiKey: apiOptions.apiKey,
                version: "weekly",
                libraries: ["places"]
            });

            loader.load().then(() => {
                const mapInstance = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 40.416775, lng: -3.703790 },
                    zoom: 6,
                });
                setMap(mapInstance);
            })
                .catch((e) => {
                    console.error("Error al cargar el mapa:", e);
                });
        };
        initializeMap();
    }, []);

    const handleRouteCalculated = (result) => {
        if (directionsRenderer) {
            directionsRenderer.setDirections(result);
        }
    };

    const handleRouteInfo = (info) => {
        setRouteInfo(info);
    };

    const handleProfile = () => {
        navigate('/profile'); // Mostrar el modal al hacer clic en "Mi Perfil"
        window.location.reload()
    };

    const clearRoute = () => {
        if (directionsRenderer) {
            directionsRenderer.setDirections({ routes: [] });
        }
        setRouteInfo(null);
    };

    const iconStyle = {
        fontSize: '2rem',
        color: '#ffc107',
        transition: 'color 0.3s ease',
        cursor: 'pointer', // Añade cursor pointer para mostrar que es clicable
    };

    return (
        <div className="min-vh-100 d-flex">

            {/* Mostrar el panel de control móvil o de escritorio según el tamaño de la pantalla */}
            {isMobile ? <MobileControlPanel /> : <DesktopControlPanel />}

            <div className="container-fluid">
                <div className="row g-4">
                    <div className="col-lg-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex flex-column align-items-start mb-4">
                                    <h1 className="card-title">Planner</h1>
                                </div>
                                <CalculateDistance
                                    map={map}
                                    onRouteCalculated={handleRouteCalculated}
                                    onRouteInfo={handleRouteInfo}
                                    onClearRoute={clearRoute}
                                />

                            </div>
                        </div>
                    </div>
                    <div className="col-lg-8">
                        <div className="card h-100">
                            <div className="card-body">
                                <div
                                    ref={mapRef}
                                    style={{ height: "100%", minHeight: "500px", borderRadius: "10px" }}
                                    className="border border-primary"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                {routeInfo && (
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <h3 className="card-title">Información de la ruta</h3>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <table className="table table-striped table-bordered">
                                                <tbody>
                                                    <tr>
                                                        <th>Distancia</th>
                                                        <td>{routeInfo.distance}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Duración</th>
                                                        <td>{routeInfo.duration}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Precio por km</th>
                                                        <td>{routeInfo.pricePerKm}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Costo operacional</th>
                                                        <td>{routeInfo.operationalCost}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="col-md-6">
                                            <table className="table table-striped table-bordered">
                                                <tbody>
                                                    <tr>
                                                        <th>Precio base</th>
                                                        <td>{routeInfo.basePrice}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Recargo por peso</th>
                                                        <td>{routeInfo.weightSurcharge}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Adicionales</th>
                                                        <td>{routeInfo.optionsSurcharge}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Precio final</th>
                                                        <td>{routeInfo.finalPrice}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Beneficio</th>
                                                        <td>{routeInfo.profit}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Mapa;
