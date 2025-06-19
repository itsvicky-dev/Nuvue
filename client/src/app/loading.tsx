export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ig-blue mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Loading Nuvue
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Please wait while we load your content...
        </p>
      </div>
    </div>
  );
}