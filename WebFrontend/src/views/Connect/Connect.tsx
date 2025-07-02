import React, { useState } from 'react';
import './Connect.css';
import { useNavigate } from 'react-router-dom';

interface FormData {
  host: string;
  port: string;
  username: string;
  password: string;
}

const Connect: React.FC = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState<FormData>({
    host: '',
    port: '',
    username: '',
    password: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous error messages when user makes changes
    if (error) setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:3000/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: formData.host,
          port: parseInt(formData.port, 10),
          user: formData.username,
          pass: formData.password
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect');
      }
      
      const data = await response.json();
      setSuccess(true);
      navigate('/home')
      // Handle successful connection here
      console.log('Connection successful:', data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Connection error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="connection-form-container">
      <h2>Connect to Server</h2>
      
      <form onSubmit={handleSubmit} className="connection-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Connection successful!</div>}
        
        <div className="form-group">
          <label htmlFor="host">Host</label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="port">Port</label>
          <input
            type="text"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Connecting...' : 'Connect'}
        </button>
      </form>
    </div>
  );
};

export default Connect;