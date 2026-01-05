import PropTypes from 'prop-types';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { Login } from './components/Login';
import NavBar from './components/NavBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameLobby } from './pages/GameLobby';
import { GamePage } from './pages/GamePage';
import { Profile } from './pages/Profile';

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

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function AppRoutes() {
  const { user } = useAuth();
  console.log('🚀 ~ AppRoutes ~ user:', user);

  return (
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
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/lobby" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <NavBar />
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
