/**
 * Model Data Item & Schema Validator
 */

export class ItemModel {
  constructor({
    id,
    title,
    description,
    category = 'General',
    createdAt = new Date().toISOString(),
    address = undefined,
    price = undefined,
    location = undefined,
    contact = undefined,
    features = undefined,
    googleMapsUri = undefined,
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category = category;
    this.createdAt = createdAt;
    if (address !== undefined) this.address = address;
    if (price !== undefined) this.price = price;
    if (location !== undefined) this.location = location;
    if (contact !== undefined) this.contact = contact;
    if (features !== undefined) this.features = features;
    if (googleMapsUri !== undefined) this.googleMapsUri = googleMapsUri;
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
    const location =
      row.location && typeof row.location === 'object'
        ? row.location
        : typeof row.latitude === 'number' && typeof row.longitude === 'number'
          ? { lat: row.latitude, lng: row.longitude }
          : undefined;
    const contact =
      row.contact && typeof row.contact === 'object'
        ? row.contact
        : row.contact_phone || row.website
          ? { phone: row.contact_phone || null, website: row.website || null }
          : undefined;

    return new ItemModel({
      id: row.id,
      title: row.title || row.name,
      description: row.description,
      category: row.category || row.type,
      createdAt: row.created_at || row.createdAt,
      address: row.address,
      price:
        row.price ||
        (typeof row.price_monthly === 'number'
          ? `Rp${row.price_monthly.toLocaleString('id-ID')} / bln`
          : undefined),
      location,
      contact,
      features: Array.isArray(row.features)
        ? row.features
        : Array.isArray(row.facilities)
          ? row.facilities
          : undefined,
      googleMapsUri: row.google_maps_uri || row.googleMapsUri,
    });
  }
}
