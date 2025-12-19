import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import app from '../services/firebaseConfig';
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const token = await user.getIdToken();
    return { user, token };
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    throw error;
  }
};

const authService = {
  loginWithGoogle: async (googleToken) => {
    try {
      const { _user, token } = await signInWithGoogle();

      // Enviar el token al backend para validación
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/google`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${googleToken}`,
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
