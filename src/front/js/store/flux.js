import axios from "axios";

const getState = ({ getStore, getActions, setStore }) => {
    return {
        store: {
            user: null,  // Estado inicial para el usuario
            message: null,
            demo: [
                {
                    title: "FIRST",
                    background: "white",
                    initial: "white"
                },
                {
                    title: "SECOND",
                    background: "white",
                    initial: "white"
                }
            ],
        },

        actions: {
            // Función de ejemplo
            exampleFunction: () => {
                getActions().changeColor(0, "green");
            },

            // Función para establecer los datos del usuario
            setUser: (user) => {
                console.log("Actualizando el usuario en el Store:", user);
                setStore({ user });  // Actualiza el estado global del usuario
            },

            // Función para recuperar los datos del usuario desde el Store
            getUserFromStore: () => {
                const token = localStorage.getItem("accessToken");
                if (token) {
                    const user = JSON.parse(localStorage.getItem("user"));
                    if (user) {
                        console.log("Cargando usuario del store:", user);
                    }
                }
            },

            // Función para cargar los datos del usuario desde el backend
            fetchUserData: async () => {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/me`, { withCredentials: true });
                    const userData = response.data;
                    setStore({ user: userData });
                } catch (err) {
                    console.log("Error al cargar los datos del usuario:", err.message);
                }
            },

            // Nueva función para actualizar los datos del usuario
            updateUserData: (updatedUserData) => {
                setStore((prevStore) => ({
                    ...prevStore,
                    user: updatedUserData
                }));
            },

            // Función para verificar expiración del token
            isTokenExpired: () => {
                const token = localStorage.getItem("token");
                if (!token) return true;

                try {
                    const { exp } = JSON.parse(atob(token.split(".")[1])); // Decodifica el payload del JWT
                    return Date.now() > exp * 1000; // Compara la fecha actual con la expiración
                } catch (err) {
                    console.error("Error verificando el token:", err);
                    return true;
                }
            },

            // Función para cerrar sesión
            logout: async () => {
                try {
                    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/logout`, {}, { withCredentials: true });
                    setStore({ user: null });
                } catch (error) {
                    console.log("Error al intentar cerrar la sesión. Contacte con el Administrador.")
                }
            },

            // Función 2 para cerrar sesión
            secondLogout: async () => {
                try {
                    console.log("Iniciando proceso de logout...");
                    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/logout`, {}, { withCredentials: true });
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    setStore({ user: null, userData: null });
                    console.log("Logout exitoso. Datos eliminados del localStorage.");
                    // Redirige a la página de inicio o recarga la página si es necesario
                    // navigate("/");
                } catch (error) {
                    console.error("Error al intentar cerrar la sesión:", error);
                    // Opcional: muestra un mensaje de error al usuario
                }
            },

            // Función para obtener el mensaje del backend
            getMessage: async () => {
                try {
                    const resp = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/hello`);
                    if (!resp.ok) {
                        throw new Error(`HTTP error! status: ${resp.status}`);
                    }
                    const data = await resp.json();
                    setStore({ message: data.message });
                    return data;
                } catch (error) {
                    console.log("Error loading message from backend", error);
                }
            },

            // Cambiar el color en el array demo
            changeColor: (index, color) => {
                const store = getStore();
                const demo = store.demo.map((elm, i) => {
                    if (i === index) elm.background = color;
                    return elm;
                });
                setStore({ demo: demo });
            }
        }
    };
};

export default getState;