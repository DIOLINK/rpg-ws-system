export const ErrorMessage = ({ message = 'Something went wrong' }) => (
  <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
    <p className="text-red-300 text-sm text-center">{message}</p>
  </div>
);
