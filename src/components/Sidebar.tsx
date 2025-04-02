import { NavLink, Link } from 'react-router-dom'
import { FaHome, FaClipboardList, FaFolder, FaRobot, FaStickyNote, FaChevronLeft, FaChevronRight, FaVideo, FaTasks } from 'react-icons/fa'

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  return (
    <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to="/" className="logo-container">
          <img 
            src="/logo-transparent.png" 
            alt="Logo" 
            className={`logo ${!isOpen ? 'small' : ''}`}
          />
        </Link>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon">
            <FaHome />
          </div>
          {isOpen && <span className="nav-text">Home</span>}
        </NavLink>
        
        <NavLink to="/module" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon">
            <FaClipboardList />
          </div>
          {isOpen && <span className="nav-text">Module</span>}
        </NavLink>
        
        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon">
            <FaTasks />
          </div>
          {isOpen && <span className="nav-text">Tasks</span>}
        </NavLink>
        
        <NavLink to="/doc-repo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon">
            <FaFolder />
          </div>
          {isOpen && <span className="nav-text">Doc Repo</span>}
        </NavLink>
        
        <NavLink to="/videos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon">
            <FaVideo />
          </div>
          {isOpen && <span className="nav-text">Videos</span>}
        </NavLink>
        
        <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon">
            <FaStickyNote />
          </div>
          {isOpen && <span className="nav-text">Note View</span>}
        </NavLink>
        
        <NavLink to="/chatbot" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon">
            <FaRobot />
          </div>
          {isOpen && <span className="nav-text">Chatbot</span>}
        </NavLink>
      </nav>
    </div>
  )
}

export default Sidebar 