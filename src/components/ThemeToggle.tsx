import { FC } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';

type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle: FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
        className || ''
      }`}
      title={theme === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
      aria-label="Přepnout motiv vzhledu"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 text-foreground transition-transform duration-200" />
      )}
    </Button>
  );
};
