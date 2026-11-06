import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => Promise<void>;
  register: (data: {
    name: string;
    cpf: string;
    email: string;
    password: string;
    phone: string;
    birth_date: string;
    sus_card?: string;
    lgpd_consent: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('saude_current_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Inicializa com a paciente idosa de demonstração (Dona Maria Helena) para facilidade de avaliação
        fetchDemoUser();
      }
    } catch {
      // Ignora erro de parse
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDemoUser = async () => {
    try {
      const res = await fetch('/api/auth/user/user-demo-001');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('saude_current_user', JSON.stringify(data));
      }
    } catch {
      // fallback
    }
  };

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: identifier, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha no login.' };
      }

      setUser(data.user);
      localStorage.setItem('saude_current_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Erro de conexão com o servidor de saúde.' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async () => {
    await fetchDemoUser();
  };

  const register = async (formData: {
    name: string;
    cpf: string;
    email: string;
    password: string;
    phone: string;
    birth_date: string;
    sus_card?: string;
    lgpd_consent: boolean;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao realizar cadastro.' };
      }

      setUser(data.user);
      localStorage.setItem('saude_current_user', JSON.stringify(data.user));
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de rede ao conectar com o serviço público.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('saude_current_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAsDemo,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
