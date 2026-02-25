import React from 'react';
import './ProductCard.css';

const ProductCard = ({
  id,
  name,
  description,
  price,
  category,
  stock,
  image,
  onEdit,
  onDelete
}) => {
  return (
    <div className="product-card">
      <div className="product-card__image">
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <div className="product-card__placeholder">Нет изображения</div>
        )}
      </div>
      
      <div className="product-card__content">
        <h3 className="product-card__title">{name}</h3>
        <span className="product-card__category">{category}</span>
        <p className="product-card__description">{description}</p>
        
        <div className="product-card__details">
          <span className="product-card__price">{price} ₽</span>
          <span className={`product-card__stock ${stock > 0 ? 'product-card__stock--available' : 'product-card__stock--out'}`}>
            {stock > 0 ? `В наличии: ${stock}` : 'Нет в наличии'}
          </span>
        </div>
        
        <div className="product-card__actions">
          {/* Декоративная кнопка "В корзину" (неактивная) */}
          <button 
            className="product-card__btn product-card__btn--cart"
            disabled={true}
            title="Функционал корзины в разработке"
          >
            В корзину
          </button>
          
          {/* Кнопки управления (для админа) */}
          <div className="product-card__admin-actions">
            {onEdit && (
              <button 
                className="product-card__btn product-card__btn--edit"
                onClick={() => onEdit(id)}
                title="Редактировать"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button 
                className="product-card__btn product-card__btn--delete"
                onClick={() => onDelete(id)}
                title="Удалить"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;