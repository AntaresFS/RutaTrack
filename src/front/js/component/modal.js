import React from "react";
import PropTypes from "prop-types";

export const Modal = ({ title, children, onClose }) => {
    return (
        <div
            className="modal fade show"
            style={{ display: "block" }}
            aria-hidden="true"
            onClick={onClose}
        >
            <div
                className="modal-dialog"
                style={{ maxWidth: "400px" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content">
                    <div className="card p-4">
                        {title && <h3 className="text-center mb-4">{title}</h3>}
                        {children}
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
