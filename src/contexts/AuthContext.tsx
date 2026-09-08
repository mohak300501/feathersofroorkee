import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../config/firebase'
import toast from 'react-hot-toast'

interface OptionalInfo {
  institution: string
  role: string
  profession: string
  department: string
  age: string
  gender: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  username: string | null
  optionalInfo: OptionalInfo
  login: (email: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (newUsername: string, newOptionalInfo?: OptionalInfo) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [optionalInfo, setOptionalInfo] = useState<OptionalInfo>({
    institution: '',
    role: '',
    profession: '',
    department: '',
    age: '',
    gender: ''
  })

  const syncUserWithBackend = async (firebaseUser: User, customUsername?: string) => {
    try {
      const response = await fetch('/api/General/syncUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          username: customUsername || firebaseUser.email?.split('@')[0],
        })
      });

      const data = await response.json();
      if (data.success && data.user) {
        setUsername(data.user.username);
        setIsAdmin(!!data.user.isAdmin);
        setOptionalInfo({
          institution: data.user.institution || '',
          role: data.user.role || '',
          profession: data.user.profession || '',
          department: data.user.department || '',
          age: data.user.age != null ? String(data.user.age) : '',
          gender: data.user.gender || ''
        });
      } else {
        console.error('Failed to sync user:', data.error, data.details || '')
        setUsername(null);
        setIsAdmin(false);
        setOptionalInfo({ institution: '', role: '', profession: '', department: '', age: '', gender: '' });
      }
    } catch (error) {
      console.error('Error syncing user data:', error)
      setUsername(null);
      setIsAdmin(false);
      setOptionalInfo({ institution: '', role: '', profession: '', department: '', age: '', gender: '' });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await syncUserWithBackend(user);
      } else {
        setIsAdmin(false);
        setUsername(null);
      }
      setLoading(false);
    })
    return unsubscribe;
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        toast.error('Please verify your email before logging in');
        await signOut(auth);
        return;
      }
      toast.success('Successfully logged in!')
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    }
  }

  const signup = async (username: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);

      // Sync immediately on signup to create the document
      await syncUserWithBackend(user, username);

      toast.success('Registration successful! Please check your email to verify your account.');
      // Do not log in user immediately after registration
      await signOut(auth);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to sign up');
      throw error;
    }
  }

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Successfully logged out!');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      throw error;
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
      throw error;
    }
  }

  const updateProfile = async (newUsername: string, newOptionalInfo?: OptionalInfo) => {
    if (!user) throw new Error('Not authenticated')

    try {
      const response = await fetch('/api/General/updateProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          username: newUsername,
          ...(newOptionalInfo ? { optionalInfo: newOptionalInfo } : {})
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUsername(newUsername);
      if (newOptionalInfo) {
        setOptionalInfo(newOptionalInfo);
      }
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    username,
    optionalInfo,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 