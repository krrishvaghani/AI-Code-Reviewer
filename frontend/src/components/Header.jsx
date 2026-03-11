export default function Header() {
  return (
    <header className="w-full bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center gap-3 shadow-lg">
      {/* Logo icon */}
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
          <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          AI Code Reviewer
        </h1>
        <p className="text-xs text-gray-400 leading-none mt-0.5">
          Powered by Gemini AI
        </p>
      </div>

      {/* Badge */}
      <span className="ml-auto text-xs font-medium bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-2.5 py-1 rounded-full">
        Beta
      </span>
    </header>
  );
}
