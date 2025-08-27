"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import Button from "@/app/components/ui/Button";
import IconButton from "@/app/components/ui/IconButton";
import Avatar from "@/app/components/ui/Avatar";
import Badge from "@/app/components/ui/Badge";
import Dropdown, { DropdownItem, DropdownDivider } from "@/app/components/ui/Dropdown";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/resume", label: "Resume", icon: "📄" },
  { href: "/cover-letter", label: "Cover Letter", icon: "✉️" },
  { href: "/upwork-proposal", label: "Proposal", icon: "💼" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const user = session?.user;
  const userInitials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`
          w-full sticky top-0 z-50 transition-all duration-300
          ${scrolled 
            ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20" 
            : "bg-white/60 dark:bg-black/40 backdrop-blur-md"
          }
          border-b border-white/20 dark:border-zinc-800/50
        `}
      >
        <div className="max-w-7xl mx-auto">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className="group flex items-center gap-2 text-lg font-bold"
                >
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200" />
                    <div className="relative bg-gradient-to-r from-indigo-500 to-emerald-500 text-white px-3 py-1 rounded-lg">
                      AI
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                    Resume
                  </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          relative px-4 py-2 rounded-lg text-sm font-medium
                          transition-all duration-200 group
                          ${isActive
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                          }
                        `}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          {item.label}
                        </span>
                        {isActive && (
                          <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg" />
                        )}
                        <div
                          className={`
                            absolute inset-0 rounded-lg bg-gray-100 dark:bg-zinc-800 
                            transition-all duration-200 opacity-0 group-hover:opacity-100
                            ${isActive ? "!opacity-0" : ""}
                          `}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notification Bell (when logged in) */}
                {status === "authenticated" && (
                  <Dropdown
                    align="right"
                    trigger={
                      <IconButton variant="ghost" size="md">
                        <div className="relative">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          <Badge
                            variant="danger"
                            size="sm"
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] p-0 flex items-center justify-center"
                          >
                            3
                          </Badge>
                        </div>
                      </IconButton>
                    }
                  >
                    <div className="p-2">
                      <h3 className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Notifications
                      </h3>
                      <DropdownItem icon="🎉">Welcome to AI Resume!</DropdownItem>
                      <DropdownItem icon="📈">Monthly usage report available</DropdownItem>
                      <DropdownItem icon="✨">New AI features released</DropdownItem>
                      <DropdownDivider />
                      <DropdownItem>View all notifications</DropdownItem>
                    </div>
                  </Dropdown>
                )}

                {/* User Menu / Auth Buttons */}
                {status === "loading" ? (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                ) : status === "authenticated" ? (
                  <Dropdown
                    align="right"
                    trigger={
                      <button className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-white/20 dark:hover:bg-zinc-800/50 transition-colors">
                        <Avatar
                          src={user?.image}
                          alt={user?.name || "User"}
                          fallback={userInitials}
                          size="md"
                        />
                        <div className="hidden sm:block text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </p>
                        </div>
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    }
                  >
                    <div className="py-2">
                      <div className="px-4 py-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.email}
                        </p>
                      </div>
                      <DropdownDivider />
                      <DropdownItem
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        }
                        onClick={() => {/* Navigate to profile */}}
                      >
                        Profile Settings
                      </DropdownItem>
                      <DropdownItem
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        }
                        onClick={() => {/* Navigate to billing */}}
                      >
                        Billing & Usage
                      </DropdownItem>
                      <DropdownItem
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        onClick={() => {/* Navigate to help */}}
                      >
                        Help & Support
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        variant="danger"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        }
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        Sign Out
                      </DropdownItem>
                    </div>
                  </Dropdown>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="primary" size="sm" glow>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Mobile menu button */}
                <IconButton
                  variant="ghost"
                  size="md"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        className={`
          lg:hidden fixed inset-x-0 top-16 z-40 transition-all duration-300 ease-out
          ${mobileMenuOpen 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 -translate-y-2 pointer-events-none"
          }
        `}
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-b border-white/20 dark:border-zinc-800/50 shadow-xl">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium
                    transition-all duration-200
                    ${isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}