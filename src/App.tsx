import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'
import { lazy, Suspense, useEffect } from 'react'
import About from './pages/About'
import Author from './pages/Author'
import Guidelines from './pages/Guidelines'
import Terms from './pages/Terms'

// Lazy load pages
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const BirdDetail = lazy(() => import('./pages/BirdDetail'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const LeaderBoard = lazy(() => import('./pages/LeaderBoard'))
const CheckList = lazy(() => import('./pages/CheckList'))
const Binoculars = lazy(() => import('./pages/Binoculars'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
  useEffect(() => {
    const key = 'visit-counted';

    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');

    fetch('/api/General/countVisits', {
      method: 'POST'
    }).catch(console.error);
  }, []);

  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bird/:commonCode" element={<BirdDetail />} />
            <Route path="/leaderboard" element={<LeaderBoard />} />
            <Route path="/checklist" element={<CheckList />} />
            <Route path="/binoculars" element={<Binoculars />} />
            <Route path="/about" element={<About />} />
            <Route path="/author" element={<Author />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/terms" element={<Terms />} />
            {!user && (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </>
            )}
            {user && (
              <>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/profile" element={<Profile />} />
              </>
            )}
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App 