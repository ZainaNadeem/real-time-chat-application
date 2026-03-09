import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Chat from './components/Chat'

function App() {
  const [user, setUser] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    const id = localStorage.getItem('userId')
    if (token && username) {
      setUser({ token, username, id })
    }
  }, [])

  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token)
    localStorage.setItem('username', userData.username)
    localStorage.setItem('userId', userData.id)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <div className="App">
      {user ? (
        <Chat user={user} onLogout={handleLogout} />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App