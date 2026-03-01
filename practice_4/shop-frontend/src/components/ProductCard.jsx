import React from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onEdit, onDelete }) {
    const getStockColor = (stock) => {
        if (stock > 10) return '#2ecc71';
        if (stock > 5) return '#f39c12';
        return '#e74c3c';
    };

    return (
        <div className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <div className="product-info">
                <div className="product-id">#{product.id}</div>
                
                <h3 className="product-name">{product.name}</h3>
                <span className="product-category">{product.category}</span>
                <p className="product-description">{product.description}</p>
                <div className="product-details">
                    <span className="product-price">{product.price.toLocaleString()} ₽</span>
                    <span className="product-stock" style={{ color: getStockColor(product.stock), fontWeight: 'bold' }}>
                        В наличии: {product.stock} шт.
                    </span>
                    <span className="product-rating">⭐ {product.rating}</span>
                </div>
                <div className="product-actions">
                    <button className="btn-edit" onClick={() => onEdit(product)}>Редактировать</button>
                    <button className="btn-delete" onClick={() => onDelete(product.id)}>Удалить</button>
                </div>
            </div>
        </div>
    );
}