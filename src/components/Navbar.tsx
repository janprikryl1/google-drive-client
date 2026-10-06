import {FC} from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home as HomeIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar: FC = () => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
          <span className="font-bold text-slate-900 tracking-tight text-lg flex items-center gap-1.5">
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
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <HomeIcon className="h-4 w-4" />
          <span>Úvod</span>
        </NavLink>
      </nav>

      <div className="flex items-center gap-3">
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium">
          <Link to="/login">
            <LogIn className="h-4 w-4" />
            <span>Přihlásit se</span>
          </Link>
        </Button>
      </div>
    </header>
  );
};
