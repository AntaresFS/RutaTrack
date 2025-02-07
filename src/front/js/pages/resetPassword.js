import React from 'react'

export const ResetPassword = () => {

    function ResetPasswordForm({ token }) {
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [message, setMessage] = useState('');

        // Validar la seguridad de la contraseña
        const validatePasswordStrength = (password) => {
            const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;
            return regex.test(password);
        };

        // Validar que las contraseñas coincidan
        const validatePasswordsMatch = (password, confirmPassword) => {
            return password === confirmPassword;
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!validatePasswordStrength(password)) {
                setMessage(
                    'La contraseña debe contener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.'
                );
                return;
            }

            if (!validatePasswordsMatch(password, confirmPassword)) {
                setMessage('Las contraseñas no coinciden.');
                return;
            }

            try {
                const response = await fetch('/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': token,
                    },
                    body: JSON.stringify({ password, token }),
                });

                const data = await response.json();
                setMessage(data.message);
            } catch (error) {
                setMessage('Error al restablecer la contraseña. Inténtelo de nuevo.');
            }
        };

        return (
            <div>
                <h1>Restablecer Contraseña</h1>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="password">Nueva Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <label htmlFor="confirm_password">Confirmar Nueva Contraseña:</label>
                    <input
                        type="password"
                        id="confirm_password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <button type="submit">Restablecer Contraseña</button>
                </form>
                {message && <p>{message}</p>}
            </div>
        );
    }
}