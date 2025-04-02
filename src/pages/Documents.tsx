import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { FaPlus, FaFile, FaFileAlt, FaFilePdf, FaFileImage, FaFileVideo, FaFileAudio, FaFileArchive, FaFileExcel, FaFilePowerpoint, FaFileWord, FaDownload, FaTrash, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import useDocumentStore from '../stores/useDocumentStore';
import useTaskStore from '../stores/useTaskStore';
import useAuthStore from '../stores/useAuthStore';
import { Document } from '../services/documentService';
import { Task } from '../services/taskService';
import { documentService } from '../services/documentService';

const Documents = () => {
  const { token } = useAuthStore();
  const { documents, isLoading, error, fetchAllDocuments, uploadDocument, deleteDocument } = useDocumentStore();
  const { tasks, fetchAllTasks } = useTaskStore();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filterTaskId, setFilterTaskId] = useState<number | null>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (token) {
      fetchAllDocuments(token);
      fetchAllTasks();
    }
  }, [token, fetchAllDocuments, fetchAllTasks]);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileError(null);
    }
  };
  
  const handleTaskToggle = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  const handleFileUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setFileError('Please select a file');
      return;
    }
    
    if (!token) {
      setFileError('Authentication required');
      return;
    }
    
    setUploadingFile(true);
    
    try {
      await uploadDocument(
        token, 
        selectedFile, 
        selectedTaskIds.length > 0 ? selectedTaskIds : undefined
      );
      
      // Reset state and close modal
      setSelectedFile(null);
      setSelectedTaskIds([]);
      setShowModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };
  
  const handleDeleteDocument = async (id: string, name: string) => {
    if (!token) return;
    
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDocument(token, id);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };
  
  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.id || !token) return;
    
    try {
      setDownloadingIds(prev => new Set(prev).add(doc.id as string));
      
      const blob = await documentService.downloadDocument(token, doc.id);
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id as string);
        return newSet;
      });
    }
  };
  
  const handleOpenDocument = (document: Document) => {
    if (!document.id || !token) return;
    documentService.openDocumentInNewTab(token, document.id, document.name);
  };
  
  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return <FaFilePdf />;
    if (contentType.includes('image')) return <FaFileImage />;
    if (contentType.includes('video')) return <FaFileVideo />;
    if (contentType.includes('audio')) return <FaFileAudio />;
    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) return <FaFileArchive />;
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return <FaFileExcel />;
    if (contentType.includes('powerpoint') || contentType.includes('presentation')) return <FaFilePowerpoint />;
    if (contentType.includes('word') || contentType.includes('document')) return <FaFileWord />;
    return <FaFileAlt />;
  };
  
  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getAssociatedTasks = (document: Document) => {
    return tasks.filter(task => document.taskIds.includes(task.id as number));
  };
  
  const filteredDocuments = filterTaskId
    ? documents.filter(doc => doc.taskIds.includes(filterTaskId))
    : documents;
  
  if (isLoading && documents.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading documents...</div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Documents</h1>
        <div className="header-actions">
          <div className="filter-controls">
            <button 
              className={`filter-button ${filterTaskId === null ? 'active' : ''}`} 
              onClick={() => setFilterTaskId(null)}
            >
              All Documents
            </button>
            {tasks.length > 0 && (
              <div className="dropdown">
                <button className="filter-button">
                  Filter by Task
                </button>
                <div className="dropdown-content">
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => setFilterTaskId(task.id as number)}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button className="create-button" onClick={() => setShowModal(true)}>
            <FaPlus /> Upload Document
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      {filteredDocuments.length === 0 ? (
        <div className="empty-state">
          <FaFile size={48} />
          <p>No documents found</p>
          <button onClick={() => setShowModal(true)}>Upload your first document</button>
        </div>
      ) : (
        <div className="documents-list-container">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Associated Tasks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map(document => (
                <tr key={document.id} className="document-row">
                  <td className="document-name">
                    <div className="document-name-with-icon">
                      {getFileIcon(document.contentType)}
                      <span>{document.name}</span>
                    </div>
                  </td>
                  <td>{document.contentType}</td>
                  <td>{getFileSize(document.size)}</td>
                  <td>{formatDate(document.uploadDate)}</td>
                  <td>
                    <div className="task-chips">
                      {getAssociatedTasks(document).map(task => (
                        <span key={task.id} className="task-chip-small">
                          {task.title}
                        </span>
                      ))}
                      {document.taskIds.length === 0 && (
                        <span className="no-tasks">No tasks</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="document-actions">
                      <button 
                        className="icon-button download"
                        title="Download"
                        onClick={() => handleDownloadDocument(document)}
                        disabled={downloadingIds.has(document.id as string)}
                      >
                        {downloadingIds.has(document.id as string) ? (
                          <span className="loading-spinner-small"></span>
                        ) : (
                          <FaDownload />
                        )}
                      </button>
                      <button 
                        className="icon-button view"
                        title="View in Browser"
                        onClick={() => handleOpenDocument(document)}
                      >
                        <FaEye />
                      </button>
                      {document.id && (
                        <button 
                          className="icon-button delete"
                          title="Delete"
                          onClick={() => handleDeleteDocument(document.id as string, document.name)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Upload Document</h2>
            <form onSubmit={handleFileUpload}>
              <div className="form-group">
                <label htmlFor="fileUpload">Select File *</label>
                <input
                  id="fileUpload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="file-input"
                />
                {fileError && <div className="error-text">{fileError}</div>}
                {selectedFile && (
                  <div className="selected-file-info">
                    <span>{selectedFile.name}</span>
                    <span>{getFileSize(selectedFile.size)}</span>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Associate with Tasks (optional)</label>
                {tasks.length === 0 ? (
                  <div className="no-tasks-message">
                    No tasks available. <a href="/tasks">Create some tasks</a> first.
                  </div>
                ) : (
                  <div className="tasks-selection">
                    {tasks.map(task => (
                      <div key={task.id} className="task-checkbox">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id as number)}
                            onChange={() => handleTaskToggle(task.id as number)}
                          />
                          <span className="checkbox-custom"></span>
                          {task.title}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="submit"
                  disabled={uploadingFile || !selectedFile}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload Document'}
                </button>
                <button 
                  type="button" 
                  className="secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={uploadingFile}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents; 