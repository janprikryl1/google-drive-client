import {FC} from "react";
import { Link } from 'react-router-dom';
import {
  LogIn,
  FolderOpen,
  ShieldCheck,
  Zap,
  HardDrive,
  CheckCircle2,
  ArrowRight,
  Cloud,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';

export const Home: FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-10 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-12 shadow-xl border border-blue-800/40">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 -mb-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Správce Google Disku <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-amber-200">
                Přímo na vaší ploše
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Webová a desktopová aplikace pro prohlížení, vyhledávání a správu souborů na Google Disku.
              Vyvinuto na technologiích React, Electron, Vite a Tailwind CSS.
            </p>

            {/* Call to Action Buttons */}
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
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-6">
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Klíčové funkce aplikace</h2>
            <p className="text-sm text-slate-500">
              Vše, co potřebujete pro pohodlnou práci s Google Diskem na desktopu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-900">Správce souborů a složek</CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed">
                  Přehledné uspořádání dokumentů, tabulek a obrázků do přehledného zobrazení s okamžitým filtrováním.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-900">OAuth 2.0 Zabezpečení</CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed">
                  Autorizace probíhá přes zabezpečenou Google OAuth bránu. Žádná vaše hesla se v aplikaci neukládají.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-900">Rychlost díky Vite & Electron</CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed">
                  Extrémně rychlý start, nativní okno, IPC procesy a okamžitá odezva bez zbytečného prodlení.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Cloud className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-900">15 GB Cloudové úložiště</CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed">
                  Sledování využité kapacity disku přímo z postranního panelu aplikace v reálném čase.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <HardDrive className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-900">Kategorie a štítky</CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed">
                  Filtrujte položky na disku: Můj disk, Sdílené položky, Poslední soubory, Hvězdičkou označené i Koš.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  <FileCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-900">Vyhledávání v reálném čase</CardTitle>
                <CardDescription className="text-xs text-slate-500 leading-relaxed">
                  Okamžité fulltextové vyhledávání v názvech souborů bez nutnosti znovu načítat celou stránku.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* How it works section */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Jak začít používat aplikaci</h2>
            <p className="text-xs text-slate-500">
              Jednoduchý postup pro spuštění práce s Google Diskem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-slate-800">Přejděte na přihlášení</h3>
                <p className="text-xs text-slate-500">
                  Klepněte na tlačítko Přihlásit se a vyberte svůj Google účet s povolením pro čtení Drive metadat.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-slate-800">Procházejte soubory</h3>
                <p className="text-xs text-slate-500">
                  V sekci Soubory můžete organizovat, vyhledávat a procházet své složky a dokumenty.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-slate-800">Desktopový komfort</h3>
                <p className="text-xs text-slate-500">
                  Užívejte si nativní aplikaci bez nutnosti otevírat záložky v prohlížeči.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Připraveno pro použití v rámci předmětu Mobilní systémy</span>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
              <Link to="/login">
                <span>Přejít k přihlášení</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Jan Přikryl</span>
        </div>
      </footer>
    </div>
  );
};
