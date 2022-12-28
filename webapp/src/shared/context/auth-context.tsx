import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { UserWithAuthorizationResponseDto } from '../generated';
import { useData } from '../hooks/UseData';
import { authApi } from '../services/ApiService';
import socket from '../socket';
import { HOST_URL } from '../urls';

export interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => void;
  authUser: UserWithAuthorizationResponseDto | null;
  setAuthUser: React.Dispatch<
    React.SetStateAction<UserWithAuthorizationResponseDto | null>
  >;
}

export const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] =
    useState<UserWithAuthorizationResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const getCurrentUser = useCallback(() => {
    return authApi.authControllerRetrieveAuthUserWithRoles();
  }, []);
  const { data, isLoading: isDataLoading } =
    useData<UserWithAuthorizationResponseDto>(getCurrentUser);
  const navigate = useNavigate();
  const authBroadcastChannel = useMemo(
    () => new BroadcastChannel('auth_channel'),
    [],
  );
  authBroadcastChannel.onmessage = (event) => {
    if (authUser && event.data && authUser.id === event.data.id) {
      setAuthUser(null);
      navigate(HOST_URL);
    }
  };

  useEffect(() => {
    setIsLoading(isDataLoading);
    setAuthUser(data);
  }, [data, isDataLoading]);

  useEffect(() => {
    if (authUser) {
      socket.connect();
    }
  }, [authUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.authControllerLogout();
      authBroadcastChannel.postMessage(authUser);
    } catch (err) {
      console.error(err);
    } finally {
      setAuthUser(null);
      navigate(HOST_URL);
    }
  }, [navigate, authBroadcastChannel, authUser]);

  const contextValue = useMemo(
    () => ({
      isLoading: isLoading,
      logout: logout,
      isLoggedIn: authUser !== null,
      authUser,
      setAuthUser,
    }),
    [isLoading, authUser, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
