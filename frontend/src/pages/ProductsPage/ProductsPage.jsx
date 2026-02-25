import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import ProductCard from '../../components/ProductCard/ProductCard';
import ProductModal from '../../components/ProductModal/ProductModal';
import './ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить товар?')) {
      return;
    }

    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Ошибка удаления товара');
    }
  };

  const handleSubmit = async (productData) => {
    try {
      if (modalMode === 'create') {
        const newProduct = await api.createProduct(productData);
        setProducts(prev => [...prev, newProduct]);
      } else if (editingProduct) {
        const updatedProduct = await api.updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => 
          p.id === editingProduct.id ? updatedProduct : p
        ));
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Ошибка сохранения товара');
    }
  };

  return (
    <div className="products-page">
      <header className="products-page__header">
        <div className="products-page__header-inner">
          <h1 className="products-page__title">Интернет-магазин</h1>
          <button 
            className="products-page__create-btn"
            onClick={handleOpenCreate}
          >
            + Добавить товар
          </button>
        </div>
      </header>

      <main className="products-page__main">
        <div className="products-page__container">
          {loading ? (
            <div className="products-page__loading">Загрузка...</div>
          ) : products.length === 0 ? (
            <div className="products-page__empty">
              Товаров пока нет. Нажмите "Добавить товар", чтобы создать первый товар.
            </div>
          ) : (
            <div className="products-page__grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  category={product.category}
                  stock={product.stock}
                  image={product.image}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="products-page__footer">
        <div className="products-page__footer-inner">
          © {new Date().getFullYear()} Интернет-магазин. Все права защищены.
        </div>
      </footer>

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ProductsPage;