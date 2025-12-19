import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameLobby } from './pages/GameLobby';
import { GamePage } from './pages/GamePage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  console.log('🚀 ~ AppRoutes ~ user:', user);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/lobby" /> : <Login />}
        />
        <Route
          path="/lobby"
          element={
            <PrivateRoute>
              <GameLobby />
            </PrivateRoute>
          }
        />
        <Route
          path="/game/:gameId"
          element={
            <PrivateRoute>
              <GamePage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/lobby" />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
