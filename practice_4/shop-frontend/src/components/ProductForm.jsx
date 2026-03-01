import React, { useState, useEffect } from 'react';
import './ProductForm.css';

export default function ProductForm({ open, mode, initialProduct, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        price: '',
        stock: '',
        rating: '',
        image: ''
    });

    useEffect(() => {
        if (open && initialProduct) {
            setFormData({
                name: initialProduct.name || '',
                category: initialProduct.category || '',
                description: initialProduct.description || '',
                price: initialProduct.price || '',
                stock: initialProduct.stock || '',
                rating: initialProduct.rating || '',
                image: initialProduct.image || ''
            });
        } else {
            setFormData({
                name: '',
                category: '',
                description: '',
                price: '',
                stock: '',
                rating: '',
                image: ''
            });
        }
    }, [open, initialProduct]);

    if (!open) return null;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Проверка обязательных полей
        if (!formData.name || !formData.category || !formData.description || !formData.price || !formData.stock) {
            alert('Заполните все обязательные поля');
            return;
        }

        onSubmit({
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock),
            rating: formData.rating ? Number(formData.rating) : 0
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h2>{mode === 'edit' ? 'Редактировать товар' : 'Добавить товар'}</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Название *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Категория *</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Описание *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Цена *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Количество *</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Рейтинг</label>
                            <input
                                type="number"
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                                min="0"
                                max="5"
                                step="0.1"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>URL изображения</label>
                        <input
                            type="url"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn-submit">
                            {mode === 'edit' ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}