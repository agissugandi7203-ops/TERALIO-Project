import React from 'react';

export const ItemCard = ({ item }) => {
  if (!item) return null;

  return (
    <div className="item-card" data-testid={`item-card-${item.id}`}>
      <div className="item-info">
        <h4>{item.title}</h4>
        <p>{item.description || 'Tidak ada deskripsi'}</p>
      </div>
      <div className="item-tag">{item.category || 'General'}</div>
    </div>
  );
};

export default ItemCard;
