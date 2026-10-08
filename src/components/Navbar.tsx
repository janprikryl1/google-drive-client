import { FC } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home as HomeIcon, FolderOpen, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Navbar: FC = () => {
  const { token, user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between transition-colors">
      <Link to="/" className="flex items-center gap-3 group">
        <span className="font-bold text-foreground tracking-tight text-lg flex items-center gap-1.5">
          Disk Google
        </span>
      </Link>

      {/* Navigation links */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`
          }
        >
          <HomeIcon className="h-4 w-4" />
          <span>Úvod</span>
        </NavLink>

        {token && (
          <NavLink
            to="/files"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <FolderOpen className="h-4 w-4" />
            <span>Soubory</span>
          </NavLink>
        )}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        {token ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/files"
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-accent transition-colors"
            >
              <span className="text-xs font-medium text-foreground max-w-[120px] truncate hidden sm:inline">
                {user?.name || user?.email || 'Můj účet'}
              </span>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
              title="Odhlásit se"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Odhlásit</span>
            </Button>
          </div>
        ) : (
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              <span>Přihlásit se</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
};
