"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data } = useSession();
  const authed = !!data?.user;
  return (
    <header className="w-full border-b">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">resume-ai</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/resume">Resume</Link>
          <Link href="/cover-letter">Cover Letter</Link>
          {authed ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="px-3 py-1 border rounded">Sign out</button>
          ) : (
            <Link href="/login" className="px-3 py-1 border rounded">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}


