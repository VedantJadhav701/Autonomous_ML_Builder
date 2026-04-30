import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AutoStack" className="w-5 h-5 object-contain opacity-50" />
          <div className="space-y-0.5">
            <p className="font-bold text-sm text-white">AutoStack</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
              v2.0.0 · MIT License · Built by Vedant Jadhav
            </p>
          </div>
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
