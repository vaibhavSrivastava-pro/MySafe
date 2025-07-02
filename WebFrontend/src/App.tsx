import { useState } from 'react'
import './App.css'
import Connect  from './views/Connect/Connect'
import HomePage from './views/HomePage/HomePage'
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/connect" element={<Connect />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/connect" />} />
      </Routes>
    </Router>
  )
}

export default App
