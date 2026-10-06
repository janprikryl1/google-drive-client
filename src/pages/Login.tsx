import { FC, useState } from 'react';
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
      'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.readonly',
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

export const Login: FC = () => {
  const [clientId, setClientId] = useState<string>(GOOGLE_CLIENT_ID);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const handleGoogleSignIn = () => {
    const activeId = clientId.trim();
    if (!activeId) {
      alert('Chybí Google Client ID. Zadejte jej níže v nastavení nebo v souboru .env.');
      return;
    }
    oauthSignIn(activeId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Zpět na úvodní stránku</span>
          </Link>

          {/* Login Card */}
          <Card className="border-border shadow-xl bg-card text-card-foreground overflow-hidden transition-colors">
            <CardHeader className="text-center pb-2 pt-6">
              <CardTitle className="text-2xl font-bold text-card-foreground tracking-tight">
                Přihlášení do Disku
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Přihlaste se pomocí svého účtu Google a propojte aplikaci s vaším cloudem.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              {/* Google OAuth Button */}
              <Button
                onClick={handleGoogleSignIn}
                size="lg"
                className="w-full bg-card hover:bg-accent text-card-foreground border border-input shadow-sm font-medium gap-3 h-12 flex items-center justify-center transition-all hover:border-ring"
              >
                <span>Přihlásit se přes Google</span>
              </Button>

              {/* Permissions list */}
              <div className="rounded-xl bg-muted p-4 border border-border space-y-2.5 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Požadovaná oprávnění:</span>
                </div>
                <div className="space-y-1.5 pl-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span>Plný přístup k souborům na Google Disku (čtení a zápis)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span>Základní profil a e-mail</span>
                  </div>
                </div>
              </div>

              {/* Advanced configuration toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 mx-auto"
                >
                  <Lock className="h-3 w-3" />
                  <span>{showAdvanced ? 'Skrýt nastavení Client ID' : 'Nastavení OAuth Client ID'}</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3 bg-muted rounded-lg border border-border space-y-2 text-xs">
                    <label className="block font-medium text-foreground">Google Client ID:</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full p-2 bg-background border border-input rounded font-mono text-[11px] text-foreground"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy info */}
          <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span>Přihlášení využívá bezpečný protokol OAuth 2.0 bez ukládání hesla.</span>
          </div>
        </div>
      </main>
    </div>
  );
};
