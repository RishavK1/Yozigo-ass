import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer } from "./PageContainer";
import { Button } from "../ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("You have been logged out");
      navigate("/");
    } catch {
      toast.error("Could not log out, please try again");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur">
      <PageContainer className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-baseline gap-0.5 text-xl font-extrabold tracking-tight">
          <span className="text-ink-900">yozi</span>
          <span className="text-brand-500">go</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="text-sm font-semibold text-ink-600 hover:text-brand-600">
            Movies
          </Link>

          {user && (
            <Link to="/my-bookings" className="text-sm font-semibold text-ink-600 hover:text-brand-600">
              My Bookings
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link to="/admin" className="text-sm font-semibold text-ink-600 hover:text-brand-600">
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-ink-500 md:inline-block">Hi, {user.name.split(" ")[0]}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} isLoading={isLoggingOut}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </PageContainer>
    </header>
  );
}
