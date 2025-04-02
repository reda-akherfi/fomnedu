import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Module from './pages/Module'
import DocRepo from './pages/DocRepo'
import Videos from './pages/Videos'
import Chatbot from './pages/Chatbot'
import NoteView from './pages/NoteView'
import Session from './pages/Session'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="app-container">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/session/:moduleId"
          element={
            <ProtectedRoute>
              <Session />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/module" element={<Module />} />
                    <Route path="/doc-repo" element={<DocRepo />} />
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/notes" element={<NoteView />} />
                    <Route path="/chatbot" element={<Chatbot />} />
                  </Routes>
                </main>
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
