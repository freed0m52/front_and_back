import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Products = () => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.getProducts();
      setProducts(response.data);
    } catch (err) {
      setError('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewProduct({
      ...newProduct,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.createProduct({
        ...newProduct,
        price: parseFloat(newProduct.price)
      });
      
      setProducts([...products, response.data]);
      setShowForm(false);
      setNewProduct({ 
        title: '', 
        category: '', 
        description: '', 
        price: '',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания товара');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить товар?')) return;

    try {
      await api.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      setError('Ошибка удаления товара');
    }
  };

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300';
    return url;
  };

  if (loading) return (
    <div style={styles.loading}>
      <div style={styles.spinner}></div>
      <p>Загрузка товаров...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Мой Магазин</h1>
        <div style={styles.userInfo}>
          <span style={styles.welcomeText}>Привет, {user?.first_name}!</span>
          <button onClick={logout} style={styles.logoutButton}>
            🚪 Выйти
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.actions}>
        <button 
          onClick={() => setShowForm(!showForm)} 
          style={showForm ? styles.cancelButton : styles.addButton}
        >
          {showForm ? '✕ Отмена' : '+ Добавить товар'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formContainer}>
          <h3 style={styles.formTitle}>➕ Новый товар</h3>
          <form onSubmit={handleCreateProduct} style={styles.form}>
            <input
              type="text"
              name="title"
              placeholder="Название товара *"
              value={newProduct.title}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <input
              type="text"
              name="category"
              placeholder="Категория *"
              value={newProduct.category}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <textarea
              name="description"
              placeholder="Описание *"
              value={newProduct.description}
              onChange={handleInputChange}
              style={styles.textarea}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Цена *"
              value={newProduct.price}
              onChange={handleInputChange}
              style={styles.input}
              required
              min="0"
              step="0.01"
            />
            <input
              type="text"
              name="imageUrl"
              placeholder="URL фото (оставьте пустым для фото по умолчанию)"
              value={newProduct.imageUrl}
              onChange={handleInputChange}
              style={styles.input}
            />
            <div style={styles.previewContainer}>
              <p style={styles.previewLabel}>Предпросмотр фото:</p>
              <img 
                src={getImageUrl(newProduct.imageUrl)}
                alt="preview"
                style={styles.previewImage}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300';
                }}
              />
            </div>
            <p style={styles.hint}>
              💡 Примеры фото: 
              <br/>• Наушники: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300
              <br/>• Часы: https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300
              <br/>• Кроссовки: https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300
            </p>
            <button type="submit" style={styles.submitButton}>
              ✅ Создать товар
            </button>
          </form>
        </div>
      )}

      <div style={styles.productsGrid}>
        {products.length === 0 ? (
          <p style={styles.empty}>🛍️ Товаров пока нет. Создайте первый товар!</p>
        ) : (
          products.map(product => (
            <div key={product.id} style={styles.productCard}>
              <div style={styles.imageContainer}>
                <img 
                  src={getImageUrl(product.imageUrl)}
                  alt={product.title}
                  style={styles.productImage}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300';
                  }}
                />
              </div>
              <div style={styles.productContent}>
                <h3 style={styles.productTitle}>{product.title}</h3>
                <p style={styles.productCategory}>{product.category}</p>
                <p style={styles.productDescription}>
                  {product.description.length > 80 
                    ? product.description.substring(0, 80) + '...' 
                    : product.description}
                </p>
                <p style={styles.productPrice}>{product.price} ₽</p>
              </div>
              <div style={styles.cardActions}>
                <Link to={`/products/${product.id}`} style={styles.viewButton}>
                  👁️ Подробнее
                </Link>
                {product.created_by === user?.id && (
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    style={styles.deleteButton}
                  >
                    🗑️ Удалить
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '28px',
    color: '#333',
    margin: 0,
    fontWeight: '600',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  welcomeText: {
    fontSize: '16px',
    color: '#666',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  actions: {
    marginBottom: '20px',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  formTitle: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
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
    minHeight: '100px',
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
  hint: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.6',
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
    margin: '5px 0',
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '10px',
    transition: 'background-color 0.3s',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '25px',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    display: 'flex',
    flexDirection: 'column',
  },
  imageContainer: {
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s',
  },
  productContent: {
    padding: '20px',
    flex: 1,
  },
  productTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333',
  },
  productCategory: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '10px',
    padding: '4px 8px',
    backgroundColor: '#f0f0f0',
    display: 'inline-block',
    borderRadius: '4px',
  },
  productDescription: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '15px',
  },
  productPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#28a745',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    padding: '20px',
    borderTop: '1px solid #f0f0f0',
    backgroundColor: '#fafafa',
  },
  viewButton: {
    padding: '8px 12px',
    backgroundColor: '#17a2b8',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    flex: 1,
    textAlign: 'center',
    transition: 'background-color 0.3s',
  },
  deleteButton: {
    padding: '8px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    flex: 1,
    transition: 'background-color 0.3s',
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
  empty: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '16px',
    color: '#999',
    gridColumn: '1 / -1',
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
};

export default Products;