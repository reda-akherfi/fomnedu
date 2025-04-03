import { useState, useEffect } from 'react';
import useAuthStore from '../stores/useAuthStore';

export interface FileObject {
  id: string;
  name: string;
  url: string;
  type: string;
  thumbnail?: string;
}

const useModuleFiles = (moduleId: string | undefined) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!moduleId || !token) {
      setLoading(false);
      return;
    }

    const fetchFiles = async () => {
      try {
        setLoading(true);
        // This would normally be an API call to fetch files
        // For now, we'll simulate with dummy data
        const response = await fetch(`/api/modules/${moduleId}/files`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).catch(() => {
          // Mock response for development
          return new Response(JSON.stringify({
            files: [
              {
                id: '1',
                name: 'Introduction.pdf',
                url: 'https://example.com/intro.pdf',
                type: 'document'
              },
              {
                id: '2',
                name: 'Course Overview',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                type: 'video',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg'
              },
              {
                id: '3',
                name: 'Sample Text File',
                url: '/sample.txt',
                type: 'document'
              }
            ]
          }));
        });

        const data = await response.json();
        setFiles(data.files);
      } catch (err) {
        console.error('Error fetching module files:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch files'));
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [moduleId, token]);

  return { files, loading, error };
};

export default useModuleFiles; 