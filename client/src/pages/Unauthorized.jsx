import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Unauthorized</h1>
        <p className="text-slate-600 mt-3">
          You do not have permission to access this page.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 px-4 py-2 rounded-lg bg-sky-700 text-white hover:bg-sky-800"
        >
          Return Home
        </Link>
      </div>
    </section>
  );
}
