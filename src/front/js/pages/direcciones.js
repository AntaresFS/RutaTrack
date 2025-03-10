import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Loader } from '@googlemaps/js-api-loader';
import { Context } from '../store/appContext';
import MobileControlPanel from "../component/DesktopControlPanel";
import DesktopControlPanel from "../component/DesktopControlPanel";
import "../../styles/direccion.css";


export const Direcciones = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { store, actions } = useContext(Context);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [map, setMap] = useState(null);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [address, setAddress] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [street, setStreet] = useState("");
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [warning, setWarning] = useState("");
    const [direcciones, setDirecciones] = useState([]);
    const [currentAddressId, setCurrentAddressId] = useState(null);
    const mapRef = useRef(null);
    const [marker, setMarker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const categoryColors = {
        "ubicacion-propia": "lightblue",
        "recogida-entrega": "lightgreen",
        "cliente": "lightcoral",
    };

    const currentUserId = store.user.id;
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setName("");
        setAddress("");
        setPostalCode("");
        setStreet("");
        setCategory("");
        setSelectedCountry(null);
        setWarning("");
    };

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
            actions.fetchUserData();
        }
    }, []); // Solo se ejecuta una vez al montar el componente

    useEffect(() => {
        if (currentUserId) {
            axios.get(`${BACKEND_URL}/api/addresses?user_id=${currentUserId}`)
                .then(response => {
                    if (Array.isArray(response.data)) {
                        setDirecciones(response.data);
                    } else {
                        console.error("La respuesta no es un array:", response.data);
                        setDirecciones([]); // Maneja el caso de error
                    }
                })
                .catch(error => {
                    console.error("Error al obtener las direcciones:", error);
                    setWarning("No se pudieron cargar las direcciones.");
                });
        }
    }, [currentUserId]);

    const filteredDirecciones = direcciones.filter(direccion => {
        return !filter || direccion.categoria === filter; // Filtrado por categoría
    });

    const initializeMap = () => {
        const loader = new Loader({
            apiKey: GOOGLE_MAPS_API_KEY,
            version: 'weekly',
        });

        loader.load().then(() => {
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: { lat: -34.397, lng: 150.644 },
                zoom: 8,
            });
            setMap(newMap);
        }).catch(e => {
            console.error("Error al cargar la API de Google Maps: ", e);
        });
    };

    const handleCountryChange = (event) => {
        const countryCode = event.target.value;
        setSelectedCountry(countryCode);
        const selectedCountryData = countries.find(country => country.cca2 === countryCode);

        if (selectedCountryData && map) {
            const { latlng } = selectedCountryData;
            const latLng = new window.google.maps.LatLng(latlng[0], latlng[1]);
            map.setCenter(latLng);
            if (marker) marker.setMap(null);
            const newMarker = new window.google.maps.Marker({
                position: latLng,
                map: map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            });
            setMarker(newMarker);
        }
    };

    const searchAddress = () => {
        if (!address && !postalCode && !street) return;

        const geocoder = new window.google.maps.Geocoder();
        const query = `${street}, ${address}, ${postalCode}`;

        geocoder.geocode({ address: query }, (results, status) => {
            if (status === "OK" && results[0] && map) {
                const { location } = results[0].geometry;
                map.setCenter(location);
                if (marker) marker.setMap(null);
                const newMarker = new window.google.maps.Marker({
                    position: location,
                    map: map,
                    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                });
                setMarker(newMarker);
            } else {
                console.error("Geocoding error: ", status);
            }
        });
    };

    const handleCreateAddress = () => {
        console.log("Creando dirección:", { name, selectedCountry, postalCode, address, street, category });

        if (!name || !selectedCountry || !postalCode || !address || !street || !category) {
            setWarning("Por favor, rellena todos los campos obligatorios.");
            return;
        }

        const newAddress = {
            nombre: name,
            direccion: `${street}, ${address}, ${postalCode}`,
            categoria: category,
            contacto: "",
            comentarios: "",
            user_id: currentUserId,
        };

        axios.post(`${BACKEND_URL}/api/addresses`, newAddress)
            .then(response => {
                console.log("Dirección creada: ", response.data);
                setDirecciones(prevDirecciones => [...prevDirecciones, response.data]);
                closeModal();
            })
            .catch(error => {
                console.error("Error al crear la dirección: ", error.response ? error.response.data : error.message);
                setWarning("Error al crear la dirección.");
            });
    };

    const handleEdit = (direccion) => {
        setCurrentAddressId(direccion.id);
        setName(direccion.nombre);

        // Descomponer la dirección en sus partes
        const [streetPart, addressPart, postalCodePart] = direccion.direccion.split(", ");
        setStreet(streetPart || "");
        setAddress(addressPart || "");
        setPostalCode(postalCodePart || "");

        setCategory(direccion.categoria);
        setSelectedCountry(""); // Ajusta según tu lógica de países
        setIsModalOpen(true);
    };

    const handleSaveChanges = () => {
        if (!currentAddressId) return;

        const updatedAddress = {
            nombre: name,
            direccion: `${street}, ${address}, ${postalCode}`,
            categoria: category,
            contacto: "",
            comentarios: "",
            user_id: currentUserId,
        };

        axios.put(`${BACKEND_URL}/api/addresses/${currentAddressId}`, updatedAddress)
            .then(response => {
                console.log("Dirección actualizada: ", response.data);
                setDirecciones(prevDirecciones =>
                    prevDirecciones.map(direccion =>
                        direccion.id === currentAddressId ? { ...direccion, ...response.data } : direccion
                    )
                );
                closeModal();
            })
            .catch(error => {
                console.error("Error al actualizar la dirección: ", error);
                setWarning("Error al actualizar la dirección.");
            });
    };

    const categoryIcons = {
        "ubicacion-propia": "🏚️",
        "recogida-entrega": "🔄",
        "cliente": "🤵",
    };

    const handleDelete = (id) => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta dirección?");
        if (confirmDelete) {
            axios.delete(`${BACKEND_URL}/api/addresses/${id}`, {
                data: { user_id: currentUserId } // Asegúrate de que currentUserId esté definido
            })
                .then(() => {
                    setDirecciones(prevDirecciones => prevDirecciones.filter(direccion => direccion.id !== id));
                    console.log("Dirección eliminada");
                })
                .catch(error => {
                    console.error("Error al eliminar la dirección: ", error);
                    alert("Error al eliminar la dirección. Por favor, intenta de nuevo.");
                });
        }
    };

    useEffect(() => {
        axios.get('https://restcountries.com/v3.1/all')
            .then(response => {
                setCountries(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error al obtener la lista de países:", error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (isModalOpen && !map) {
            initializeMap();
        }
    }, [isModalOpen]);

    return (
        <div className="min-vh-100 d-flex">

            {/* Mostrar el panel de control móvil o de escritorio según el tamaño de la pantalla */}
            {isMobile ? <MobileControlPanel /> : <DesktopControlPanel />}

            <div className="container mt-4">
                <div className="direcciones-header d-flex justify-content-between align-items-center mb-4">
                    <h3>Mis Direcciones</h3>
                    <label>
                        Filtrar por categoría:
                        <select onChange={(e) => setFilter(e.target.value)}>
                            <option value="">Todas</option>
                            <option value="ubicacion-propia">🏚️  Ubicación propia</option>
                            <option value="recogida-entrega">🔄  Recogida/Entrega</option>
                            <option value="cliente">🤵  Cliente</option>
                        </select>
                    </label>
                    <button className="btn btn-warning" onClick={openModal}><strong>Nueva dirección</strong></button>
                </div>

                <table className="table table-striped table-hover text-center">
                    <thead className="thead-dark">
                        <tr>
                            <th>Nombre</th>
                            <th>Dirección</th>
                            <th>Categoría</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDirecciones.map(direccion => (
                            <tr key={direccion.id}>
                                <td>{direccion.nombre}</td>
                                <td>{direccion.direccion}</td>
                                <td style={{ backgroundColor: categoryColors[direccion.categoria] || 'white' }}>
                                    {categoryIcons[direccion.categoria] || ''} {/* Muestra el emoji basado en la categoría */}
                                    {direccion.categoria}
                                </td>
                                <td>
                                    <button onClick={() => handleEdit(direccion)} className="btn btn-warning">🔄​</button>
                                    <button onClick={() => handleDelete(direccion.id)} className="btn btn-danger">🗑️​</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{currentAddressId ? "Editar Dirección" : "Crear Nueva Dirección"}</h2>
                        <div id="modal-body">
                            <div className="form-detail-section">
                                <div className="form-section">
                                    <h3>Dirección</h3>
                                    <form>
                                        <label>
                                            País <span className="required">*</span>
                                            <select name="pais" required onChange={handleCountryChange} value={selectedCountry || ""}>
                                                <option value="">Seleccionar país</option>
                                                {countries.map(country => (
                                                    <option key={country.cca2} value={country.cca2}>
                                                        {country.name.common}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label>
                                            Código Postal <span className="required">*</span>
                                            <input
                                                type="text"
                                                name="codigoPostal"
                                                value={postalCode}
                                                onChange={(e) => setPostalCode(e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            Ciudad <span className="required">*</span>
                                            <input
                                                type="text"
                                                name="ciudad"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                            />
                                        </label>
                                        <label>
                                            Calle <span className="required">*</span>
                                            <input
                                                type="text"
                                                name="calle"
                                                value={street}
                                                onChange={(e) => setStreet(e.target.value)}
                                            />
                                        </label>
                                        <button type="button" className="search-btn" onClick={searchAddress}>Buscar</button>
                                    </form>
                                </div>
                                <div className="detail-section">
                                    <h3>Detalle</h3>
                                    <form>
                                        <label>
                                            Nombre <span className="required">*</span>
                                            <input
                                                type="text"
                                                name="nombre"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                        </label>
                                        <label>
                                            Categoría <span className="required">*</span>
                                            <select
                                                name="categoria"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                required
                                            >
                                                <option value="">Seleccionar categoría</option>
                                                <option value="ubicacion-propia">🏚️​​​  Ubicación propia</option>
                                                <option value="recogida-entrega">🔄  Recogida/Entrega</option>
                                                <option value="cliente">🤵  Cliente</option>
                                            </select>
                                        </label>
                                        <label>
                                            Email (opcional)
                                            <input type="email" name="email" />
                                        </label>
                                        <label>
                                            Persona de Contacto (opcional)
                                            <input type="text" name="personaContacto" />
                                        </label>
                                        <label>
                                            Número de Teléfono (opcional)
                                            <input type="text" name="telefono" />
                                        </label>
                                        <label>
                                            Comentarios (opcional)
                                            <textarea name="comentarios"></textarea>
                                        </label>
                                    </form>
                                </div>
                            </div>
                            <div className="addresses-map-section" ref={mapRef}></div>
                        </div>
                        <div className="modal-footer">
                            {warning && (
                                <div className="warning-message">
                                    {warning}
                                </div>
                            )}
                            <div className="modal-buttons">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancelar</button>
                                {currentAddressId ? (
                                    <button type="button" className="direccion-btn" onClick={handleSaveChanges}>Guardar Cambios</button>
                                ) : (
                                    <button type="button" className="direccion-crear-btn btn-warning" onClick={handleCreateAddress}>Crear Dirección</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};