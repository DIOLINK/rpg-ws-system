import { FaDiceD20, FaHome, FaUser } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const { isDM } = useAuth();
  const location = useLocation();

  // Do not render NavBar on login page
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="navbar-test text-white p-4 fixed inset-x-0 bottom-0 z-50 bg-gray-900">
      <div className="flex flex-row justify-center items-center border-t border-gray-700">
        <div className="flex flex-col items-center basis-1/3 px-4 py-2">
          <Link
            to="/lobby"
            className="hover:text-yellow-300 flex flex-col items-center"
          >
            <FaHome className="text-2xl" />
            <span className="text-sm">Lobby</span>
          </Link>
        </div>
        {isDM && (
          <div className="flex flex-col items-center basis-1/4 px-4 py-2">
            <Link
              to="/create-game"
              className="hover:text-yellow-300 flex flex-col items-center"
            >
              <FaDiceD20 className="text-2xl" />
              <span className="text-sm">Crear Partida</span>
            </Link>
          </div>
        )}
        <div className="flex flex-col items-center basis-1/4 px-4 py-2">
          <Link
            to="/create-character"
            className="hover:text-yellow-300 flex flex-col items-center"
          >
            <FaDiceD20 className="text-2xl" />
            <span className="text-sm">Crear Personaje</span>
          </Link>
        </div>
        <div className="flex flex-col items-center basis-1/4 px-4 py-2">
          <Link
            to="/profile"
            className="hover:text-yellow-300 flex flex-col items-center"
          >
            <FaUser className="text-2xl" />
            <span className="text-sm">Perfil</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
