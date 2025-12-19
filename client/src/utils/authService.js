import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import app from '../services/firebaseConfig';
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const token = await user.getIdToken();

    // console.log('Token generado en el cliente:', token);

    return { user, token };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.error('El usuario canceló el inicio de sesión.');
      throw new Error('Inicio de sesión cancelado por el usuario.');
    }
    console.error('Error durante el inicio de sesión con Google:', error);
    throw error;
  }
};

const authService = {
  loginWithGoogle: async () => {
    try {
      const { _user, token } = await signInWithGoogle();

      // Enviar el token al backend para validación
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al autenticar con el backend');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Error en loginWithGoogle:', error);
      throw error;
    }
  },
};

export { authService };
