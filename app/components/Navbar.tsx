"use client";
import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function Navbar() {
  const { data } = useSession();
  const authed = !!data?.user;
  const [open, setOpen] = useState(false);
  return (
    <header className="w-full border-b backdrop-blur-sm bg-white/60 dark:bg-black/40 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-3">
        <Link href="/" className="font-semibold">resume-ai</Link>
        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/resume">Resume</Link>
          <Link href="/cover-letter">Cover Letter</Link>
          <ThemeToggle />
          {authed ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="px-3 py-1 border rounded">Sign out</button>
          ) : (
            <Link href="/login" className="px-3 py-1 border rounded">Sign in</Link>
          )}
        </nav>
        {/* Mobile hamburger */}
        <button
          aria-label="Open menu"
          className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded border hover:bg-zinc-50 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>
      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden px-4 pb-3 space-y-2 border-t">
          <div className="flex flex-col gap-2 pt-3">
            <Link className="px-3 py-2 rounded border" href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
            <Link className="px-3 py-2 rounded border" href="/resume" onClick={() => setOpen(false)}>Resume</Link>
            <Link className="px-3 py-2 rounded border" href="/cover-letter" onClick={() => setOpen(false)}>Cover Letter</Link>
            <div className="flex items-center justify-between">
              <ThemeToggle />
              {authed ? (
                <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }} className="px-3 py-2 border rounded">Sign out</button>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-2 border rounded">Sign in</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


