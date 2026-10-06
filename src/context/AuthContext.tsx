import { FC, ReactNode, createContext, useContext, useState, useEffect } from 'react';

export type UserInfo = {
  name?: string;
  email?: string;
  picture?: string;
  storageUsage?: number;
  storageLimit?: number;
};

type AuthContextType = {
  token: string | null;
  user: UserInfo | null;
  isLoading: boolean;
  logout: () => void;
  setTokenManually: (token: string) => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  logout: () => {},
  setTokenManually: () => {},
});

// Synchronous check of window.location.href / window.location.hash
function getInitialToken(): string | null {
  try {
    const fullUrl = window.location.href;
    const hashIndex = fullUrl.indexOf('#');
    if (hashIndex !== -1) {
      const hashContent = fullUrl.substring(hashIndex + 1);
      if (hashContent.includes('access_token=')) {
        // Remove leading slashes or question marks if present
        const cleanQuery = hashContent.replace(/^[/?#]+/, '');
        const params = new URLSearchParams(cleanQuery);
        const accessToken = params.get('access_token');
        if (accessToken) {
          localStorage.setItem('google_access_token', accessToken);
          const expiresIn = params.get('expires_in');
          if (expiresIn) {
            const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;
            localStorage.setItem('google_token_expires_at', expiresAt.toString());
          }
          // Reset hash to #/files so React Router navigates straight to files
          window.location.hash = '#/files';
          return accessToken;
        }
      }
    }
    return localStorage.getItem('google_access_token');
  } catch (err) {
    console.error('Error extracting OAuth token:', err);
    return null;
  }
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = async (authToken: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch user profile (openid userinfo)
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      let profileData: { name?: string; email?: string; picture?: string } = {};
      if (userInfoRes.ok) {
        profileData = await userInfoRes.json();
      }

      // 2. Fetch Drive storage information
      let storageUsage: number | undefined;
      let storageLimit: number | undefined;
      try {
        const driveAboutRes = await fetch(
          'https://www.googleapis.com/drive/v3/about?fields=user,storageQuota',
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (driveAboutRes.ok) {
          const driveData = await driveAboutRes.json();
          if (driveData.storageQuota) {
            storageUsage = parseInt(driveData.storageQuota.usage, 10) || undefined;
            storageLimit = parseInt(driveData.storageQuota.limit, 10) || undefined;
          }
          if (driveData.user) {
            profileData.name = profileData.name || driveData.user.displayName;
            profileData.email = profileData.email || driveData.user.emailAddress;
            profileData.picture = profileData.picture || driveData.user.photoLink;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Drive about:', err);
      }

      setUser({
        name: profileData.name || 'Uživatel Google',
        email: profileData.email || 'přihlášen přes Google',
        picture: profileData.picture,
        storageUsage,
        storageLimit,
      });
    } catch (err) {
      console.error('Error fetching Google user data:', err);
      // Fallback
      setUser({
        name: 'Přihlášený uživatel',
        email: 'Aktivní OAuth relace',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserData(token);
    } else {
      setIsLoading(false);
      setUser(null);
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    setToken(null);
    setUser(null);
    window.location.hash = '#/';
  };

  const setTokenManually = (newToken: string) => {
    localStorage.setItem('google_access_token', newToken);
    setToken(newToken);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        logout,
        setTokenManually,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
