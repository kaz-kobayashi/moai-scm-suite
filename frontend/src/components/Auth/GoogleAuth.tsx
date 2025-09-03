import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Card,
  CardContent,
  Divider
} from '@mui/material';

interface GoogleProfile {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  profile: GoogleProfile | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  profile: null,
  login: () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  clientId: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, clientId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<GoogleProfile | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('scmopt-user-profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setIsAuthenticated(true);
    }
  }, []);

  const login = () => {
    // GoogleLogin コンポーネントが処理
  };

  const logout = () => {
    googleLogout();
    setIsAuthenticated(false);
    setProfile(null);
    localStorage.removeItem('scmopt-user-profile');
  };

  const handleLoginSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        const decoded: any = jwtDecode(credentialResponse.credential);
        const userProfile: GoogleProfile = {
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          sub: decoded.sub
        };
        
        setProfile(userProfile);
        setIsAuthenticated(true);
        localStorage.setItem('scmopt-user-profile', JSON.stringify(userProfile));
      } catch (error) {
        console.error('JWT decode error:', error);
      }
    }
  };

  const handleLoginError = () => {
    console.error('Google login failed');
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthContext.Provider value={{ isAuthenticated, profile, login, logout }}>
        {isAuthenticated ? (
          children
        ) : (
          <LoginScreen 
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        )}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};

interface LoginScreenProps {
  onSuccess: (response: any) => void;
  onError: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onError }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Card sx={{ maxWidth: 400, width: '90%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
              SCMOpt
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Supply Chain Management Optimization
            </Typography>
            <Typography variant="body2" color="textSecondary">
              サプライチェーン最適化システム
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="textSecondary" align="center">
              このアプリケーションを使用するには、Googleアカウントでログインしてください。
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <GoogleLogin
              onSuccess={onSuccess}
              onError={onError}
              theme="outline"
              size="large"
              text="signin_with"
              locale="ja"
            />
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="caption" color="textSecondary" align="center" display="block">
              ログインすることで、プライバシーポリシーと利用規約に同意したものとみなされます。
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

interface UserProfileProps {
  showLogout?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ showLogout = true }) => {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar src={profile.picture} alt={profile.name} sx={{ width: 32, height: 32 }} />
      <Typography variant="body2" color="textSecondary">
        {profile.name}
      </Typography>
      {showLogout && (
        <Button size="small" onClick={logout} color="inherit">
          ログアウト
        </Button>
      )}
    </Box>
  );
};