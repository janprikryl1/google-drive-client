import { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  LogIn,
  FolderOpen,
  ShieldCheck,
  Zap,
  HardDrive,
  Sparkles,
  Cloud,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export const Home: FC = () => {
  const { token, user, logout } = useAuth();

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-10 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-12 shadow-xl border border-blue-800/40">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 -mb-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-medium text-blue-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Mobilní systémy • Google Drive Client</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Správce Google Disku <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-amber-200">
                Přímo na vaší ploše
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Aplikace pro prohlížení, vyhledávání a správu souborů na Google Disku.
              Vyvinuto na technologiích React, Vite, TypeScript a Tailwind CSS.
            </p>

            {/* If user is logged in, show their account card */}
            {token ? (
              <div className="pt-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 max-w-lg space-y-4">
                  <div className="flex items-center gap-3.5">
                    {user?.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name || 'User'}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white/30"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-lg shadow-inner">
                        {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">{user?.name || 'Přihlášený uživatel'}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-medium">
                          Přihlášen
                        </span>
                      </div>
                      <p className="text-xs text-blue-200">{user?.email}</p>
                    </div>
                  </div>

                  {user?.storageLimit && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300 font-medium text-[11px]">
                        <span>Využité úložiště Disku</span>
                        <span>
                          {formatBytes(user.storageUsage)} / {formatBytes(user.storageLimit)}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              ((user.storageUsage || 0) / (user.storageLimit || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      asChild
                      size="default"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md gap-2 flex-1"
                    >
                      <Link to="/files">
                        <FolderOpen className="h-4 w-4" />
                        <span>Otevřít mé soubory</span>
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="default"
                      onClick={logout}
                      className="bg-transparent hover:bg-white/10 text-white border-white/20 gap-1.5"
                    >
                      <LogOut className="h-4 w-4 text-rose-300" />
                      <span>Odhlásit</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* If not logged in, show Call to Action buttons */
              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 gap-2 text-base px-6 h-12"
                >
                  <Link to="/login">
                    <LogIn className="h-5 w-5" />
                    <span>Přihlásit se k účtu</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur font-semibold gap-2 text-base px-6 h-12"
                >
                  <Link to="/files">
                    <FolderOpen className="h-5 w-5 text-blue-300" />
                    <span>Procházet soubory</span>
                    <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Klíčové funkce aplikace</h2>
            <p className="text-sm text-muted-foreground">
              Vše, co potřebujete pro pohodlnou práci s Google Diskem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-card-foreground">Správce souborů a složek</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Přehledné uspořádání dokumentů, tabulek a obrázků do přehledného zobrazení s okamžitým filtrováním.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-card-foreground">OAuth 2.0 Zabezpečení</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Autorizace probíhá přes zabezpečenou Google OAuth bránu. Žádná vaše hesla se v aplikaci neukládají.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-card-foreground">Rychlost díky Vite</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Extrémně rychlý start, reaktivní stav aplikace a okamžitá odezva bez zbytečného prodlení.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <Cloud className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-card-foreground">Cloudové úložiště</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Sledování využité kapacity disku přímo z rozhraní aplikace v reálném čase.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                  <HardDrive className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-card-foreground">Izolovaná složka</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Aplikace přistupuje výhradně do určené pracovní složky bez vystavování zbytku celého disku.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                  <FileCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-card-foreground">Vyhledávání v reálném čase</CardTitle>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Okamžité fulltextové vyhledávání v názvech souborů bez nutnosti znovu načítat celou stránku.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* How it works section */}
        <section className="bg-card border border-border rounded-2xl p-8 space-y-6 transition-colors">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-card-foreground">Jak začít používat aplikaci</h2>
            <p className="text-xs text-muted-foreground">
              Jednoduchý postup pro spuštění práce s Google Diskem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-card-foreground">Přejděte na přihlášení</h3>
                <p className="text-xs text-muted-foreground">
                  Klepněte na tlačítko Přihlásit se a schvalte oprávnění pro práci s Diskem.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-card-foreground">Procházejte soubory</h3>
                <p className="text-xs text-muted-foreground">
                  V sekci Soubory můžete organizovat a vyhledávat soubory v pracovní složce.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-card-foreground">Pohodlná správa</h3>
                <p className="text-xs text-muted-foreground">
                  Rychlý přístup ke cloudovým souborům přímo z aplikace.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Připraveno pro použití v rámci předmětu Mobilní systémy</span>
            </div>
            {token ? (
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm">
                <Link to="/files">
                  <span>Přejít k souborům</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm">
                <Link to="/login">
                  <span>Přejít k přihlášení</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground transition-colors">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Google Drive Client • Jan Přikryl</span>
          <span>React 19 + TypeScript + Vite + Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
};
