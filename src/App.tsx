import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Module from './pages/Module'
import Tasks from './pages/Tasks'
import Documents from './pages/Documents'
import Videos from './pages/Videos'
import Chatbot from './pages/Chatbot'
import NoteView from './pages/NoteView'
import Session from './pages/Session'
import TaskSession from './pages/TaskSession'

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
          path="/task-session/:taskId"
          element={
            <ProtectedRoute>
              <TaskSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <>
                <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <Sidebar isOpen={isSidebarOpen} />
                <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                  <Routes>
                    <Route path="/" element={<Tasks />} />
                    <Route path="/module" element={<Module />} />
                    <Route path="/tasks" element={<Navigate to="/" replace />} />
                    <Route path="/documents" element={<Documents />} />
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
