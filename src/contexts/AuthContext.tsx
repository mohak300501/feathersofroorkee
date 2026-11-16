import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../config/firebase'
import toast from 'react-hot-toast'

interface OptionalInfo {
  institution: string
  designation: string
  status: string
  profession: string
  department: string
  year: string
  age: string
  gender: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  username: string | null
  userPhoto: string | null
  whatsapp: string | null
  optionalInfo: OptionalInfo
  login: (email: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  googleSignIn: (username?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (newUsername: string, newWhatsapp: string, newOptionalInfo?: OptionalInfo) => Promise<void>
  updateUserPhoto: (photoUrl: string) => void
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const googleAuthInProgress = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [optionalInfo, setOptionalInfo] = useState<OptionalInfo>({
    institution: '',
    designation: '',
    status: '',
    profession: '',
    department: '',
    year: '',
    age: '',
    gender: ''
  });
  const navigate = useNavigate()

  const syncUserWithBackend = async (firebaseUser: User, customUsername?: string) => {
    if (!firebaseUser.email) throw new Error('Firebase account does not have an email address.');

    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/General/syncUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...(customUsername !== undefined ? { username: customUsername.trim() } : {})
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success || !data.user) {
      throw new Error(
        data.error || `User synchronization failed (HTTP ${response.status}).`
      );
    }
    setUsername(data.user.username);
    setUserPhoto(data.user.userPhoto || null);
    setWhatsapp(data.user.whatsapp);
    setIsAdmin(data.user.userType === 0);
    setOptionalInfo({
      institution: data.user.institution || '',
      designation: data.user.designation || '',
      status: data.user.status || '',
      profession: data.user.profession || '',
      department: data.user.department || '',
      year: data.user.year || '',
      age: data.user.age != null ? String(data.user.age) : '',
      gender: data.user.gender || ''
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {

        // Google authentication performs its own synchronization.
        if (googleAuthInProgress.current) {
          setLoading(false);
          return;
        }

        try {
          // Synchronize existing users only.
          // New users must be created through signup with an explicit username.
          await syncUserWithBackend(firebaseUser);
        } catch (error) {
          console.error('Authentication sync error:', error);

          setUsername(null);
          setUserPhoto(null);
          setWhatsapp(null);
          setIsAdmin(false);
          setOptionalInfo({
            institution: '',
            designation: '',
            status: '',
            profession: '',
            department: '',
            year: '',
            age: '',
            gender: ''
          });
        }
      } else {
        setIsAdmin(false);
        setUsername(null);
        setUserPhoto(null);
        setWhatsapp(null);
        setOptionalInfo({
          institution: '',
          designation: '',
          status: '',
          profession: '',
          department: '',
          year: '',
          age: '',
          gender: ''
        });
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

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
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) throw new Error('Username must be at least 3 characters long.');

    let firebaseUser: User | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      firebaseUser = userCredential.user;

      // Create/update MongoDB document using the explicitly chosen username.
      // Sync user immediately to create new document.
      await syncUserWithBackend(firebaseUser, trimmedUsername);
      await sendEmailVerification(firebaseUser);
      toast.success('Registration successful! Please check your email to verify your account.');

      // Do not log in user immediately after registration
      await signOut(auth);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to sign up');
      throw error;
    }
  }

  const googleSignIn = async (chosenUsername?: string) => {
    googleAuthInProgress.current = true;

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) throw new Error('Google account does not have an email address.');

      try {
        // First, attempt to synchronize an existing MongoDB user.
        await syncUserWithBackend(firebaseUser);
      } catch (error: unknown) {
        console.error('Google authentication error:', error);
        if (auth.currentUser) await signOut(auth);

        const message = error instanceof Error ? error.message : 'Google sign-in failed. Please try again.';
        toast.error(message);

        // A new MongoDB user must provide a username.
        if (message.includes('Username is required') && chosenUsername) {
          const trimmedUsername = chosenUsername.trim();
          if (trimmedUsername.length < 3) throw new Error('Username must be at least 3 characters long.');

          // Create the new MongoDB user with the chosen username.
          await syncUserWithBackend(firebaseUser, trimmedUsername);

        } else if (message.includes('Username is required')) {
          throw new Error('This Google account is not registered yet. Please sign up first and choose a username.');
        } else {
          throw error;
        }
      } finally {
        googleAuthInProgress.current = false;
      }

      toast.success('Successfully signed in with Google!');
    } catch (error: unknown) {
      console.error('Google authentication error:', error);

      // Avoid leaving an authenticated Firebase session without
      // a successfully synchronized MongoDB account.
      if (auth.currentUser) await signOut(auth);

      const message = error instanceof Error
        ? error.message
        : 'Google sign-in failed. Please try again.';

      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
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

  const updateProfile = async (newUsername: string, newWhatsapp?: string, newOptionalInfo?: OptionalInfo) => {
    if (!user) throw new Error('Not authenticated')

    try {
      const response = await fetch('/api/General/updateProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          username: newUsername,
          whatsapp: newWhatsapp ?? '',
          ...(newOptionalInfo ? { optionalInfo: newOptionalInfo } : {})
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUsername(newUsername);
      setWhatsapp(newWhatsapp ?? '');
      if (newOptionalInfo) setOptionalInfo(newOptionalInfo);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const updateUserPhoto = (photoUrl: string) => setUserPhoto(photoUrl)

  const value = {
    user,
    loading,
    isAdmin,
    username,
    userPhoto,
    whatsapp,
    optionalInfo,
    login,
    signup,
    googleSignIn,
    logout,
    resetPassword,
    updateProfile,
    updateUserPhoto
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 