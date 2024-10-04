// src/pages/Mapa.js
import React, { useEffect, useRef, useState } from 'react';
import loaderInstance from '../component/Loader';  // Importamos el loader singleton
import CalculateDistance from '../component/calculateDistance';
import ControlPanel from '../component/panelControl';
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate

const Mapa = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [directionsRenderer, setDirectionsRenderer] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const navigate = useNavigate();

    // Usamos el Loader Singleton en el useEffect
    useEffect(() => {
        loaderInstance.load().then(() => {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: { lat: 40.416775, lng: -3.703790 },
                zoom: 6,
            });

            const directionsRendererInstance = new window.google.maps.DirectionsRenderer();
            directionsRendererInstance.setMap(mapInstance);

            setMap(mapInstance);
            setDirectionsRenderer(directionsRendererInstance);
        });
    }, []);

    const handleRouteCalculated = (result) => {
        if (directionsRenderer) {
            directionsRenderer.setDirections(result);
        }
    };

    const handleRouteInfo = (info) => {
        setRouteInfo(info);
    };

    // Eliminamos window.location.reload() para evitar recargar la página
    const handleProfile = () => {
        navigate('/profile');  // Navegamos a /profile sin recargar la página
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
            <ControlPanel />
            <div className="container mt-4">
                <h2 className="card-title">Planner</h2>
                <div className="row g-4">
                    <div className="col-lg-4">
                        <div className="d-flex flex-column align-items-start mb-4">
                            {/* Otros elementos del panel de control */}
                        </div>
                        <CalculateDistance
                            map={map}
                            onRouteCalculated={handleRouteCalculated}
                            onRouteInfo={handleRouteInfo}
                            onClearRoute={clearRoute}
                        />
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

