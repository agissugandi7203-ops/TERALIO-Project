/**
 * Model Data Item & Schema Validator
 */

export class ItemModel {
  constructor({ id, title, description, category = 'General', createdAt = new Date().toISOString() }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category = category;
    this.createdAt = createdAt;
  }

  /**
   * Validasi payload sebelum insert ke database / response
   */
  static validate(data) {
    const errors = [];

    if (!data) {
      return { isValid: false, errors: ['Request body cannot be empty'] };
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Field "title" is required and must be a non-empty string');
    }

    if (data.title && data.title.length > 100) {
      errors.push('Field "title" must not exceed 100 characters');
    }

    if (data.description && typeof data.description !== 'string') {
      errors.push('Field "description" must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static fromDatabaseRow(row) {
    if (!row) return null;
    return new ItemModel({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      createdAt: row.created_at || row.createdAt,
    });
  }
}
