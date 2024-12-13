import React from "react";
import PropTypes from "prop-types";

export const Modal = ({ title, children, onClose }) => {
    return (
        <div
            className="modal fade show"
            style={{
                display: "flex",
                alignItems: "center", // Centra verticalmente el modal
                justifyContent: "center", // Centra horizontalmente el modal
            }}
            aria-hidden="true"
            onClick={onClose}  // Cierra el modal al hacer clic fuera   
        >
            <div
                className="modal-dialog modal-dialog-centered"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content">
                    <div className="card p-4">
                        <div className="modalTitle d-flex align-items-center justify-content-between">
                            {title && <h3 className="text-center flex-grow-1 mt-2">{title}</h3>}
                            <button type="button" className="btn-close my-2" onClick={onClose} aria-label="Close"></button>
                        </div>
                        <div className="modalForm">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

Modal.propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func.isRequired,
};
