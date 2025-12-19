import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import app from '../services/firebaseConfig';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const authService = {
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      const user = result.user;
      return { user, token };
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      throw error;
    }
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

import { signInWithGoogle } from '../utils/authService';

const testGoogleAuth = async () => {
  try {
    const result = await signInWithGoogle();
    console.log('Google Auth Test Successful:', result);
  } catch (error) {
    console.error('Google Auth Test Failed:', error);
  }
};

testGoogleAuth();

const verifyBackendConnection = async () => {
  try {
    const response = await fetch(import.meta.env.VITE_API_URL + '/health');
    const data = await response.json();
    console.log('Backend connection successful:', data);
  } catch (error) {
    console.error('Backend connection failed:', error);
  }
};

verifyBackendConnection();
