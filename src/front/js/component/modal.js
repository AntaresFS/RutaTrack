import React from "react";
import PropTypes from "prop-types";

export const Modal = ({ title, children, onClose }) => {
    return (
        <div
            className="modal fade show d-flex justify-content-center align-items-center mh-100"
            onClick={onClose}  // Cierra el modal al hacer clic fuera   
        >
            <div
                className="modal-dialog modal-dialog-scrollable d-flex align-items-center justify-content-center w-auto mh-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content m-4">
                    <div className="card p-4 m-4">
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
