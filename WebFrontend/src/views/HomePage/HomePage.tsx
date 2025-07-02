import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HomePage.css';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('data.txt');

  const navigate = useNavigate()
  
  
  useEffect(() => {
    // Load the file content when component mounts
    loadDefaultFile();
  }, []);
  
  const loadFile = () => {
    // Create a file input element programmatically
    const input = document.createElement('input');
    input.type = 'file';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        setSelectedFileName(file.name);
        promptForKeyAndDecrypt(file);
      }
    };
    
    // Simulate user clicking the file input to open file dialog
    input.click();
  };

  const loadDefaultFile = async () => {
    try {
      setIsLoading(true);
      
      try {
        const response = await axios.post('http://127.0.0.1:3000/open');
        const encryptedContent = response.data.content;
        
        promptUserForKeyAndDecrypt(encryptedContent);
      } catch (err) {
        console.error('Failed to load from API, falling back to file input', err);
        // Option 2: Fall back to manual file selection if API fails
        setError('Could not load default file automatically. Please select it manually.');
        setIsLoading(false);
        
        // Optionally auto-open the file picker dialog
        setTimeout(() => {
          loadFile();
        }, 500);
      }
    } catch (err) {
      console.error('Failed to load default file:', err);
      setError(`Failed to load default file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };


  const promptUserForKeyAndDecrypt = (encryptedContent: string) => {
    const key = window.prompt('Enter decryption key for data.txt:');
    if (!key) {
      setError('Decryption key is required');
      setIsLoading(false);
      return;
    }
    
    setEncryptionKey(key);
    
    try {
      const decryptedContent = decryptContent(encryptedContent, key);
      setFileContent(decryptedContent);
      setIsLoading(false);
      setIsEdited(false);
      setIsSaved(false);
      setError(null);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError('Failed to decrypt file. Invalid key or corrupted file.');
      setIsLoading(false);
    }
  };
  

  
  const promptForKeyAndDecrypt = (file: File) => {
    const key = window.prompt('Enter decryption key:');
    if (!key) {
      setError('Decryption key is required');
      return;
    }
    
    setEncryptionKey(key);
    setIsLoading(true);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const encryptedContent = event.target?.result as string;
        const decryptedContent = decryptContent(encryptedContent, key);
        setFileContent(decryptedContent);
        setIsLoading(false);
        setIsEdited(false);
        setIsSaved(false);
        setError(null);
      } catch (err) {
        console.error('Decryption failed:', err);
        setError('Failed to decrypt file. Invalid key or corrupted file.');
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file.');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const decryptContent = (encryptedContent: string, key: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedContent, key);
      const decryptedContent = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedContent) {
        throw new Error('Decryption failed');
      }
      
      return decryptedContent;
    } catch (err) {
      console.error('Decryption error:', err);
      throw new Error('Decryption failed',);
    }
  };
  
  const encryptContent = (content: string, key: string): string => {
    return CryptoJS.AES.encrypt(content, key).toString();
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFileContent(e.target.value);
    setIsEdited(true);
    setIsSaved(false);
  };
  
  const saveFile = async () => {
    if (!encryptionKey) {
      const key = window.prompt('Enter encryption key:');
      if (!key) {
        setError('Encryption key is required');
        return;
      }
      setEncryptionKey(key);
    }
    
    try {
      setIsLoading(true);
      
      // Encrypt the content before saving
      const encryptedContent = encryptContent(fileContent, encryptionKey);
      
      // Send the encrypted content to Flask API
      const response = await axios.post('http://127.0.0.1:3000/save', {
        content: encryptedContent
      });
      
      if (response.status === 200) {
        setIsEdited(false);
        setIsSaved(true);
        setError(null);
      } else {
        throw new Error('Failed to save file');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to save file:', err);
      setError(`Failed to save file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };
  
  const uploadFile = async () => {
    if (!encryptionKey) {
      setError('Encryption key is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      await axios.post('http://127.0.0.1:3000/upload');
      
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('Failed to upload file. Please try again.');
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try{
        await axios.post('http://127.0.0.1:3000/disconnect');
        navigate('/');
    }
    catch (err) {
        console.error('Failed to disconnect:', err);
        setError('Failed to disconnect. Please try again.');
    }
  }

  
  return (
    <div className="homepage-container">
      <h1>Encrypted File Editor</h1>
      
      {isLoading && <div className="loading">Loading...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="file-info">
        {selectedFileName && <div className="current-file">Current file: {selectedFileName}</div>}
      </div>
      
      <div className="editor-container">
        <textarea
          className="file-editor"
          value={fileContent}
          onChange={handleContentChange}
          disabled={isLoading}
          placeholder="Open an encrypted file or create new content..."
        />
      </div>
      
      <div className="button-container">
        <button 
          className="open-button"
          onClick={loadDefaultFile}
          disabled={isLoading}
        >
          Open File
        </button>
        
        <button 
          className="save-button"
          onClick={saveFile}
          disabled={isLoading}
        >
          Save File
        </button>
        
        <button 
          className="upload-button"
          onClick={uploadFile}
          disabled={(!isSaved && isEdited) || isLoading}
        >
          Upload File
        </button>
        <button 
          className="disconnect-button"
          onClick={disconnect}
        >
          Disconnet
        </button>
      </div>
    </div>
  );
};

export default HomePage;