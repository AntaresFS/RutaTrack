import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { FaTrash } from "react-icons/fa";
import { LuPenSquare } from "react-icons/lu";
import ColaboradorForm from '../component/colaboradorForm';
import DesktopControlPanel from '../component/DesktopControlPanel';
import MobileControlPanel from '../component/MobileControlPanel';
import { Context } from '../store/appContext';


const Autonomos = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [colaboradores, setColaboradores] = useState([]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Estado para manejar si es edición o no
  const { store, actions } = useContext(Context);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Estado para manejar los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    tipoPrecio: '',
    precio: '',
    periodosEspera: '',
    incluirPeajes: false
  });


  // Mostrar el panel de control móvil o de escritorio según el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar usuario desde el backend si no está en el store
  useEffect(() => {
    if (!store.user) {
      actions.fetchUserData();
    }
  }, []); // Solo se ejecuta una vez al montar el componente


  // Manejar los cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData, [name]: type === 'checkbox' ? checked
        : value
    });
  };

  // Validar el formulario antes de enviarlo
  const validarFormulario = () => {
    let errores = [];
    const { nombre, email, tipoPrecio, precio, periodosEspera } = formData;

    // Validar campos vacíos
    if (!nombre) {
      errores.push('El campo "Nombre" es obligatorio.');
    }
    if (!email) {
      errores.push('El campo "Email" es obligatorio.');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errores.push('El "Email" ingresado no es válido.');
    }
    if (!tipoPrecio) {
      errores.push('El campo "Tipo de Precio" es obligatorio.');
    }
    if (!precio) {
      errores.push('El campo "Precio" es obligatorio.');
    }

    return errores;
  };

  // Agregar un nuevo colaborador
  const agregarColaborador = useCallback(async () => {
    if (!currentUserId) {
      console.error('No se encontró el user_id');
      setError('No se pudo identificar al usuario. Por favor, vuelva a iniciar sesión.');
      return;
    }

    const errores = validarFormulario();
    if (errores.length > 0) {
      setWarning(errores.join(' '));
      return;
    }

    try {
      // Enviar datos del nuevo colaborador a la API
      const response = await axios.post(`${BACKEND_URL}/api/partners`, {
        name: formData.nombre,
        email: formData.email,
        price_type: formData.tipoPrecio,
        price: formData.precio,
        waiting_periods: formData.periodosEspera,
        include_tolls: formData.incluirPeajes,
      });

      setColaboradores([...colaboradores, response.data.socio]);

      setFormData({
        nombre: '',
        email: '',
        tipoPrecio: '',
        precio: '',
        periodosEspera: '',
        incluirPeajes: false
      });

      const modalElement = document.getElementById('modalAgregarSocio');
      const modal = window.bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        setError(error.response.data.message || 'Error al procesar la solicitud.');
      } else {
        setError('Error al procesar la solicitud.');
      }
    }
  }, [currentUserId, formData, colaboradores]);

  // Eliminar un colaborador
  const eliminarColaborador = async (email) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/partners/${email}?user_id=${currentUserId}`);

      setColaboradores(colaboradores.filter(colaborador => colaborador.email !== email));
    } catch (error) {
      console.error('Error:', error);
      setError('Hubo un error al eliminar el colaborador.');
    }
  };

  // Editar un colaborador
  const editarColaborador = (email) => {
    const colaborador = colaboradores.find((colaborador) => colaborador.email === email);
    if (colaborador) {
      setFormData({
        nombre: colaborador.nombre || '',
        email: colaborador.email || '',
        tipoPrecio: colaborador.tipo_precio || '',
        precio: colaborador.precio || '',
        periodosEspera: colaborador.periodos_espera || '',
        incluirPeajes: colaborador.incluir_peajes || false
      });
      setIsEditing(true); // Cambiar el modo a edición
      const modalElement = document.getElementById('modalAgregarSocio');
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show(); // Mostrar el modal
    }
  };

  // Actualizar datos de un colaborador en la API
  const actualizarColaborador = async () => {
    const errores = validarFormulario();
    if (errores.length > 0) {
      setWarning(errores.join(' '));
      return;
    }

    try {
      // Usar el email del formData en la URL de la solicitud PUT
      await axios.put(`${BACKEND_URL}/api/partners/${formData.email}`, {
        name: formData.nombre,
        email: formData.email, // Actualiza si es necesario
        price_type: formData.tipoPrecio,
        price: formData.precio,
        waiting_periods: formData.periodosEspera,
        include_tolls: formData.incluirPeajes,
      });

      // Actualizar la lista de colaboradores
      setColaboradores(colaboradores.map(colaborador =>
        colaborador.email === formData.email ? { ...colaborador, ...formData } : colaborador
      ));

      // Reiniciar el formulario y estado de edición
      setFormData({
        nombre: '',
        email: '',
        tipoPrecio: '',
        precio: '',
        periodosEspera: '',
        incluirPeajes: false
      });
      setIsEditing(false);

      const modalElement = document.getElementById('modalAgregarSocio');
      const modal = window.bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        setError(error.response.data.message || 'Error al procesar la solicitud.');
      } else {
        setError('Error al procesar la solicitud.');
      }
    }
  };

  // Manejar el envío del formulario
  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      await actualizarColaborador(); // Llama a la función que actualiza al colaborador
    } else {
      await agregarColaborador(); // Agrega un nuevo colaborador
    }
  };

  return (
    <div className="min-vh-100 d-flex">

      {/* Mostrar el panel de control móvil o de escritorio según el tamaño de la pantalla */}
      {isMobile ? <MobileControlPanel /> : <DesktopControlPanel />}

      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="d-inline-flex mb-3">Colaboradores</h2>
          <button
            className="btn btn-warning fw-bold mb-3"
            data-bs-toggle="modal"
            data-bs-target="#modalAgregarSocio"
            onClick={() => {
              setFormData({
                nombre: '',
                email: '',
                tipoPrecio: '',
                precio: '',
                periodosEspera: '',
                incluirPeajes: false
              });
              setIsEditing(false); // Cambiar el modo a agregar
            }}
          >
            Agregar colaborador
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {warning && <div className="alert alert-warning">{warning}</div>}

        <table className="table table-striped">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Tipo Precio</th>
              <th>Precio</th>
              <th>Periodos de Espera</th>
              <th>Incluir Peajes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((colaborador) => (
              <tr key={colaborador.id}>
                <td>{colaborador.nombre}</td>
                <td>{colaborador.email}</td>
                <td>{colaborador.tipo_precio}</td>
                <td>{colaborador.precio}</td>
                <td>{colaborador.periodos_espera}</td>
                <td>{colaborador.incluir_peajes ? 'Sí' : 'No'}</td>
                <td>
                  <button className="btn" onClick={() => editarColaborador(colaborador.email)}>
                    <LuPenSquare />
                  </button>
                  <button className="btn text-danger" onClick={() => eliminarColaborador(colaborador.email)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal para agregar o editar un colaborador */}
        <div className="modal fade" id="modalAgregarSocio" tabIndex="-1" aria-labelledby="modalAgregarSocioLabel" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="modalAgregarSocioLabel">{isEditing ? 'Editar Colaborador' : 'Agregar Colaborador'}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <ColaboradorForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button type="button" className="btn btn-warning fw-bold" onClick={manejarSubmit}>{isEditing ? 'Guardar cambios' : 'Agregar colaborador'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Autonomos;
