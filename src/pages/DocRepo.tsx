import { useState } from 'react';
import { FaFolder, FaFile, FaFileAlt, FaFileImage, FaFilePdf, FaPlus, FaTrash } from 'react-icons/fa';
import useModuleStore, { DocFile } from '../stores/useModuleStore';

const DocRepo = () => {
  const { modules, documents, addDocument, deleteDocument } = useModuleStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('note');
  const [documentContent, setDocumentContent] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FaFilePdf />;
      case 'image':
        return <FaFileImage />;
      case 'note':
        return <FaFileAlt />;
      default:
        return <FaFile />;
    }
  };

  const handleAddDocument = () => {
    if (!selectedModule || !documentName.trim()) return;
    
    addDocument(
      selectedModule,
      documentName.trim(),
      documentType,
      documentContent.trim() || undefined,
      documentUrl.trim() || undefined
    );
    
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setDocumentName('');
    setDocumentType('note');
    setDocumentContent('');
    setDocumentUrl('');
  };

  const openDocumentModal = (moduleId: string) => {
    setSelectedModule(moduleId);
    setShowModal(true);
  };

  // Groupe les documents par moduleId
  const documentsByModule: Record<string, DocFile[]> = {};
  documents.forEach(doc => {
    if (!documentsByModule[doc.moduleId]) {
      documentsByModule[doc.moduleId] = [];
    }
    documentsByModule[doc.moduleId].push(doc);
  });

  return (
    <div className="page-container">
      <h1>Dépôt de Documents</h1>
      
      {modules.length === 0 ? (
        <div className="empty-state">
          <FaFolder size={48} />
          <p>Vous n'avez pas encore créé de modules</p>
          <p>Allez dans la section "Module" pour commencer</p>
        </div>
      ) : (
        <div className="doc-repo-container">
          {modules.map(module => (
            <div key={module.id} className="module-section">
              <div className="module-section-header">
                <h2>
                  <FaFolder /> {module.name}
                </h2>
                <button className="small-button" onClick={() => openDocumentModal(module.id)}>
                  <FaPlus /> Ajouter
                </button>
              </div>
              
              <div className="documents-grid">
                {!documentsByModule[module.id] || documentsByModule[module.id].length === 0 ? (
                  <p className="empty-folder">Ce module ne contient pas encore de documents.</p>
                ) : (
                  documentsByModule[module.id].map(doc => (
                    <div key={doc.id} className="document-card">
                      <div className="document-icon">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="document-info">
                        <h3>{doc.name}</h3>
                        <p className="document-type">{doc.type}</p>
                      </div>
                      <button 
                        className="icon-button delete" 
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <FaTrash />
                      </button>
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
            <h2>Ajouter un document</h2>
            
            <div className="form-group">
              <label htmlFor="documentName">Nom du document *</label>
              <input
                id="documentName"
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="documentType">Type de document</label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="note">Note</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
                <option value="other">Autre</option>
              </select>
            </div>
            
            {documentType === 'note' && (
              <div className="form-group">
                <label htmlFor="documentContent">Contenu</label>
                <textarea
                  id="documentContent"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  rows={5}
                />
              </div>
            )}
            
            {(documentType === 'pdf' || documentType === 'image') && (
              <div className="form-group">
                <label htmlFor="documentUrl">URL</label>
                <input
                  id="documentUrl"
                  type="text"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                onClick={handleAddDocument}
                disabled={!documentName.trim()}
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

export default DocRepo; 