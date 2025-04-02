import { useState } from 'react';
import { FaFolder, FaStickyNote, FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import useModuleStore, { Note } from '../stores/useModuleStore';

const NoteView = () => {
  const { modules, notes, addNote, updateNote, deleteNote } = useModuleStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  // Pour l'édition des notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleAddNote = () => {
    if (!selectedModule || !noteTitle.trim()) return;
    
    addNote(
      selectedModule,
      noteTitle.trim(),
      noteContent.trim()
    );
    
    resetForm();
    setShowModal(false);
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveNoteEdit = () => {
    if (!editingNoteId || !editTitle.trim()) return;
    
    updateNote(
      editingNoteId,
      editTitle.trim(),
      editContent.trim()
    );
    
    cancelEditingNote();
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditTitle('');
    setEditContent('');
  };

  const resetForm = () => {
    setNoteTitle('');
    setNoteContent('');
  };

  const openNoteModal = (moduleId: string) => {
    setSelectedModule(moduleId);
    setShowModal(true);
  };

  // Groupe les notes par moduleId
  const notesByModule: Record<string, Note[]> = {};
  notes.forEach(note => {
    if (!notesByModule[note.moduleId]) {
      notesByModule[note.moduleId] = [];
    }
    notesByModule[note.moduleId].push(note);
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="page-container">
      <h1>Notes</h1>
      
      {modules.length === 0 ? (
        <div className="empty-state">
          <FaFolder size={48} />
          <p>Vous n'avez pas encore créé de modules</p>
          <p>Allez dans la section "Module" pour commencer</p>
        </div>
      ) : (
        <div className="notes-container">
          {modules.map(module => (
            <div key={module.id} className="module-section">
              <div className="module-section-header">
                <h2>
                  <FaFolder /> {module.name}
                </h2>
                <button className="small-button" onClick={() => openNoteModal(module.id)}>
                  <FaPlus /> Ajouter une note
                </button>
              </div>
              
              <div className="notes-grid">
                {!notesByModule[module.id] || notesByModule[module.id].length === 0 ? (
                  <p className="empty-folder">Ce module ne contient pas encore de notes.</p>
                ) : (
                  notesByModule[module.id].map(note => (
                    <div key={note.id} className="note-card">
                      {editingNoteId === note.id ? (
                        // Mode édition
                        <>
                          <div className="note-edit-form">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Titre de la note"
                            />
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={6}
                            />
                          </div>
                          <div className="note-actions">
                            <button className="icon-button save" onClick={saveNoteEdit}>
                              <FaSave /> Enregistrer
                            </button>
                            <button className="icon-button cancel" onClick={cancelEditingNote}>
                              <FaTimes /> Annuler
                            </button>
                          </div>
                        </>
                      ) : (
                        // Mode affichage
                        <>
                          <div className="note-icon">
                            <FaStickyNote />
                          </div>
                          <div className="note-content">
                            <h3>{note.title}</h3>
                            <p className="note-text">{note.content}</p>
                            <p className="note-date">Modifié le {formatDate(note.updatedAt)}</p>
                          </div>
                          <div className="note-actions">
                            <button 
                              className="icon-button edit" 
                              onClick={() => startEditingNote(note)}
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="icon-button delete" 
                              onClick={() => deleteNote(note.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Ajouter une note</h2>
            
            <div className="form-group">
              <label htmlFor="noteTitle">Titre de la note *</label>
              <input
                id="noteTitle"
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="noteContent">Contenu</label>
              <textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={5}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={handleAddNote}
                disabled={!noteTitle.trim()}
              >
                Ajouter
              </button>
              <button 
                type="button" 
                className="secondary" 
                onClick={() => setShowModal(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteView; 