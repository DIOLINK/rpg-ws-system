export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <div className="text-7xl mb-4 animate-bounce">🦄</div>
      <h1 className="text-3xl font-bold mb-2">¡Ups! Algo salió mal...</h1>
      <p className="mb-6 text-lg text-gray-300">
        Parece que hubo un error inesperado.
        <br />
        Intenta recargar la página o volver más tarde.
      </p>
      <a
        href="/"
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded shadow-lg transition-all drop-shadow-md"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
      >
        Volver al inicio
      </a>
    </div>
  );
}
