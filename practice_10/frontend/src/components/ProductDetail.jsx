import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    imageUrl: ''
  });

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await api.getProduct(id);
      setProduct(response.data);
      setFormData({
        title: response.data.title || '',
        category: response.data.category || '',
        description: response.data.description || '',
        price: response.data.price || '',
        imageUrl: response.data.imageUrl || ''
      });
    } catch (err) {
      setError('Товар не найден');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const updatedData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      const response = await api.updateProduct(id, updatedData);
      setProduct(response.data);
      setIsEditing(false);
      alert('✅ Товар успешно обновлен!');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления товара');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) return;

    try {
      await api.deleteProduct(id);
      alert('✅ Товар успешно удален!');
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления товара');
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';
    return url;
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Загрузка товара...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <h2>😕 Ошибка</h2>
        <p>{error}</p>
        <Link to="/products" style={styles.backLink}>Вернуться к списку</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={styles.error}>
        <h2>🔍 Товар не найден</h2>
        <Link to="/products" style={styles.backLink}>Вернуться к списку</Link>
      </div>
    );
  }

  const isOwner = product.created_by === user?.id;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/products" style={styles.backButton}>
          ← Назад к списку
        </Link>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {isEditing ? (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>✏️ Редактирование товара</h2>
          <form onSubmit={handleUpdate} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Название:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Категория:</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Описание:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={styles.textarea}
                required
                rows="5"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Цена (₽):</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                style={styles.input}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>URL фото:</label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div style={styles.previewContainer}>
              <p style={styles.previewLabel}>Предпросмотр фото:</p>
              <img 
                src={getImageUrl(formData.imageUrl)}
                alt="preview"
                style={styles.previewImage}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';
                }}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.saveButton}>
                💾 Сохранить
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    title: product.title,
                    category: product.category,
                    description: product.description,
                    price: product.price,
                    imageUrl: product.imageUrl || ''
                  });
                }}
                style={styles.cancelButton}
              >
                ❌ Отмена
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.imageContainer}>
            <img 
              src={getImageUrl(product.imageUrl)}
              alt={product.title}
              style={styles.productImage}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600';
              }}
            />
          </div>

          <div style={styles.contentContainer}>
            <div style={styles.productHeader}>
              <h2 style={styles.productTitle}>{product.title}</h2>
              {isOwner && (
                <span style={styles.ownerBadge}>👑 Ваш товар</span>
              )}
            </div>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>📁 Категория:</span>
                <span style={styles.infoValue}>{product.category}</span>
              </div>
              
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>💰 Цена:</span>
                <span style={styles.infoValue}>{product.price} ₽</span>
              </div>
              
              <div style={styles.infoItemFull}>
                <span style={styles.infoLabel}>📝 Описание:</span>
                <p style={styles.description}>{product.description}</p>
              </div>

              {product.imageUrl && (
                <div style={styles.infoItemFull}>
                  <span style={styles.infoLabel}>🔗 URL фото:</span>
                  <a 
                    href={product.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.imageLink}
                  >
                    {product.imageUrl}
                  </a>
                </div>
              )}
            </div>
            
            {isOwner && (
              <div style={styles.actions}>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  ✏️ Редактировать
                </button>
                <button 
                  onClick={handleDelete}
                  style={styles.deleteButton}
                >
                  🗑️ Удалить
                </button>
              </div>
            )}

            {!isOwner && user && (
              <div style={styles.notOwnerMessage}>
                <p>ⓘ Вы можете только просматривать этот товар</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '20px',
  },
  backButton: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '16px',
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    transition: 'background-color 0.3s',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '400px',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  contentContainer: {
    padding: '30px',
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
  },
  productTitle: {
    fontSize: '32px',
    color: '#333',
    margin: 0,
    fontWeight: '600',
  },
  ownerBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  infoItem: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  infoItemFull: {
    gridColumn: 'span 2',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  infoLabel: {
    display: 'block',
    color: '#666',
    fontSize: '14px',
    marginBottom: '5px',
    fontWeight: '500',
  },
  infoValue: {
    color: '#333',
    fontSize: '18px',
    fontWeight: '600',
  },
  description: {
    color: '#333',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '10px 0 0 0',
  },
  imageLink: {
    color: '#007bff',
    textDecoration: 'none',
    wordBreak: 'break-all',
    display: 'inline-block',
    marginTop: '5px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
  },
  editButton: {
    padding: '12px 24px',
    backgroundColor: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    flex: 1,
    transition: 'background-color 0.3s',
  },
  deleteButton: {
    padding: '12px 24px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    flex: 1,
    transition: 'background-color 0.3s',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  formTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '25px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#666',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.3s',
    outline: 'none',
  },
  textarea: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
  },
  previewContainer: {
    marginTop: '10px',
  },
  previewLabel: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '8px',
  },
  previewImage: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px solid #e0e0e0',
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
  },
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    flex: 1,
    transition: 'background-color 0.3s',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    flex: 1,
    transition: 'background-color 0.3s',
  },
  notOwnerMessage: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    color: '#1976d2',
    textAlign: 'center',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    color: '#dc3545',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  backLink: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
  },
};

export default ProductDetail;