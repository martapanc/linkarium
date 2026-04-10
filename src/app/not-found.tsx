export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mb-6">
        <span className="font-display text-3xl text-sand-400">?</span>
      </div>
      <h1 className="font-display text-3xl text-sand-800 mb-2">
        List not found
      </h1>
      <p className="text-sand-500 text-sm mb-8 max-w-xs">
        This list doesn&apos;t exist, or it may have expired.
      </p>
      <a
        href="/"
        className="bg-coral-500 hover:bg-coral-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        Create a new list
      </a>
    </div>
  );
}
