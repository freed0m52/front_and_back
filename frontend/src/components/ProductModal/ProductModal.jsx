import React, { useState, useEffect } from 'react';
import './ProductModal.css';

const ProductModal = ({
  open,
  mode,
  initialProduct,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });

  useEffect(() => {
    if (open && initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        description: initialProduct.description || '',
        price: String(initialProduct.price || ''),
        category: initialProduct.category || '',
        stock: String(initialProduct.stock || ''),
        image: initialProduct.image || ''
      });
    } else if (open && !initialProduct) {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image: ''
      });
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);

    if (!formData.name.trim()) {
      alert('Введите название товара');
      return;
    }

    if (!formData.description.trim()) {
      alert('Введите описание товара');
      return;
    }

    if (isNaN(price) || price <= 0) {
      alert('Введите корректную цену');
      return;
    }

    if (!formData.category.trim()) {
      alert('Введите категорию товара');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      alert('Введите корректное количество на складе');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      category: formData.category.trim(),
      stock,
      image: formData.image.trim() || undefined
    });
  };

  const title = mode === 'edit' ? 'Редактировать товар' : 'Добавить товар';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="Введите название товара"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание *</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Введите описание товара"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Цена *</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Категория *</label>
              <input
                type="text"
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleChange}
                placeholder="Введите категорию"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Количество на складе *</label>
              <input
                type="number"
                name="stock"
                className="form-input"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">URL изображения</label>
              <input
                type="url"
                name="image"
                className="form-input"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="modal__btn modal__btn--cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="modal__btn modal__btn--submit">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;