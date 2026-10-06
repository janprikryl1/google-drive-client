/*
 * Create form to request access token from Google's OAuth 2.0 server.
 */
import { FC } from 'react';
import { Button } from '@/components/ui/button';

export function oauthSignIn() {
  // Google's OAuth 2.0 endpoint for requesting an access token
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

  // Create <form> element to submit parameters to OAuth 2.0 endpoint.
  const form = document.createElement('form');
  form.setAttribute('method', 'GET'); // Send as a GET request.
  form.setAttribute('action', oauth2Endpoint);

  // Parameters to pass to OAuth 2.0 endpoint.
  const params: Record<string, string> = {
    client_id: 'YOUR_CLIENT_ID',
    redirect_uri: 'YOUR_REDIRECT_URI',
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/calendar.readonly',
    include_granted_scopes: 'true',
    state: 'pass-through value',
  };

  // Add form parameters as hidden input values.
  for (const p in params) {
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }

  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  form.submit();
}

export const Login: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Button onClick={oauthSignIn}>
        Přihlásit se přes Google
      </Button>
    </div>
  );
};
