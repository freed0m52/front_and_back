import React, { useState, useEffect } from 'react';
import './App.css';
import { api } from './api';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';

function App() {
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
            console.error('Ошибка загрузки:', error);
            alert('Ошибка загрузки товаров');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setEditingProduct(product);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить товар?')) return;

        try {
            await api.deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Ошибка удаления товара');
        }
    };

    const handleSubmit = async (productData) => {
        try {
            if (modalMode === 'create') {
                const newProduct = await api.createProduct(productData);
                setProducts([...products, newProduct]);
            } else {
                const updatedProduct = await api.updateProduct(editingProduct.id, productData);
                setProducts(products.map(p => 
                    p.id === editingProduct.id ? updatedProduct : p
                ));
            }
            closeModal();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка сохранения товара');
        }
    };

    return (
        <div className="app">
            <header className="header">
                <h1>Интернет-магазин</h1>
                <button className="btn-add" onClick={openCreateModal}>
                    + Добавить товар
                </button>
            </header>

            <main className="main">
                {loading ? (
                    <div className="loading">Загрузка...</div>
                ) : (
                    <ProductList 
                        products={products}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                    />
                )}
            </main>

            <ProductForm
                open={modalOpen}
                mode={modalMode}
                initialProduct={editingProduct}
                onClose={closeModal}
                onSubmit={handleSubmit}
            />
        </div>
    );
}

export default App;