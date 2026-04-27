import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-1 text-center md:text-left">
          <p className="font-bold text-sm text-white">Autonomous ML Builder</p>
          <p className="text-xs text-gray-500">
            v1.0.0 · MIT License · Built by Vedant Jadhav
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a
            href="https://github.com/VedantJadhav701/Autonomous_ML_Builder"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <Link href="/app" className="hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
