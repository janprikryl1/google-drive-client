import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Info,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_CLIENT_ID ||
  import.meta.env.ClientID ||
  '';

export function oauthSignIn(customClientId?: string) {
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

  const form = document.createElement('form');
  form.setAttribute('method', 'GET');
  form.setAttribute('action', oauth2Endpoint);

  const clientId = customClientId || GOOGLE_CLIENT_ID;
  const redirectUri = window.location.origin || 'http://localhost:5173';

  const params: Record<string, string> = {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope:
      'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.readonly',
    include_granted_scopes: 'true',
    state: 'google-drive-client-auth',
  };

  for (const p in params) {
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export const Login: React.FC = () => {
  const [clientId, setClientId] = useState<string>(GOOGLE_CLIENT_ID);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const handleGoogleSignIn = () => {
    const activeId = clientId.trim();
    if (!activeId) {
      alert('Chybí Google Client ID. Zadejte jej níže nebo nastavte VITE_CLIENT_ID v souboru .env.');
      return;
    }
    oauthSignIn(activeId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Zpět na úvodní stránku</span>
          </Link>

          {/* Login Card */}
          <Card className="border-slate-200 shadow-xl bg-white overflow-hidden">
            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                Přihlášení do Disku
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Přihlaste se pomocí svého účtu Google a propojte desktopovou aplikaci s vaším cloudem.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              {/* Google OAuth Button */}
              <Button
                onClick={handleGoogleSignIn}
                size="lg"
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm font-medium gap-3 h-12 flex items-center justify-center transition-all hover:border-slate-400"
              >
                <span>Přihlásit se přes Google</span>
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400 uppercase font-semibold tracking-wider absolute">
                  nebo
                </span>
              </div>

              {/* Permissions list */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Vyžadovaná oprávnění aplikace:</span>
                </div>
                <div className="space-y-1.5 pl-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span>Čtení metadat souborů Google Disku</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span>Čtení položek kalendáře</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span>Správa vytvořených souborů aplikace</span>
                  </div>
                </div>
              </div>

              {/* Advanced configuration toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 mx-auto"
                >
                  <Lock className="h-3 w-3" />
                  <span>{showAdvanced ? 'Skrýt nastavení Client ID' : 'Nastavení OAuth Client ID'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <label className="block font-medium text-slate-700">Google Client ID:</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-[11px] text-slate-800"
                    />
                    <p className="text-[10px] text-slate-500">
                      {import.meta.env.VITE_CLIENT_ID || import.meta.env.ClientID
                        ? '✓ Hodnota byla úspěšně načtena ze souboru .env (VITE_CLIENT_ID).'
                        : '⚠️ V souboru .env nebyla nalezena proměnná VITE_CLIENT_ID.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy badge info */}
          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span>Přihlášení využívá bezpečný protokol OAuth 2.0 bez ukládání hesla.</span>
          </div>
        </div>
      </main>
    </div>
  );
};
