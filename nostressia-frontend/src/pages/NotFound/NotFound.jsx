import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)] px-6 text-[var(--text-primary)]">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-slate-100">
          Page not found
        </h1>
        <p className="mt-3 text-base text-gray-500 dark:text-slate-300">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Go to Landing Page
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
