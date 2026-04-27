import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800 bg-black/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center text-xs font-black text-white">
            ML
          </div>
          <span className="font-bold text-sm text-white">Autonomous ML Builder</span>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/VedantJadhav701/Autonomous_ML_Builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
          <Link
            href="/app"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 transition-colors rounded-lg text-sm font-semibold text-white"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
