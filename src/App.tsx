import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Home from './pages/Home'
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

  // Add scroll event listener to apply a scrolled class to page headers
  useEffect(() => {
    const handleScroll = () => {
      const pageHeaders = document.querySelectorAll('.page-header');
      const scrollPosition = window.scrollY;
      
      pageHeaders.forEach(header => {
        if (scrollPosition > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                  <div className="content-scroll-container">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/module" element={<Module />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/videos" element={<Videos />} />
                      <Route path="/notes" element={<NoteView />} />
                      <Route path="/chatbot" element={<Chatbot />} />
                    </Routes>
                  </div>
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
