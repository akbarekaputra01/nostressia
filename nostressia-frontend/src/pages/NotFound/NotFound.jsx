import React from "react";
import { Link } from "react-router-dom";
import { readAuthToken } from "../../utils/auth";
import PageMeta from "../../components/PageMeta";

export default function NotFound() {
  const isAuthenticated = Boolean(readAuthToken());

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-transparent px-6 text-text-primary">
      <PageMeta
        title="404"
        description="The page you are looking for was not found on Nostressia."
        noindex
      />
      <div className="max-w-md text-center bg-surface-elevated glass-panel p-8 rounded-3xl border border-border">
        <p className="text-sm font-semibold text-brand-primary">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-text-primary dark:text-text-primary">
          Page not found
        </h1>
        <p className="mt-3 text-base text-text-muted dark:text-text-muted">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto rounded-xl bg-surface-muted px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-elevated glass-panel dark:bg-surface dark:text-text-primary dark:hover:bg-surface"
            >
              Back to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/"
                className="w-full sm:w-auto rounded-xl border border-border dark:border-border px-4 py-2 text-sm font-semibold text-text-secondary dark:text-text-primary hover:bg-surface-muted dark:hover:bg-surface"
              >
                Go to Landing Page
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto rounded-xl bg-surface-muted px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-elevated glass-panel dark:bg-surface dark:text-text-primary dark:hover:bg-surface"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
