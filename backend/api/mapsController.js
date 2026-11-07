import { z } from 'zod';
import { googleMapsService } from '../services/googleMapsService.js';

const latSchema = z.coerce.number().min(-90).max(90);
const lngSchema = z.coerce.number().min(-180).max(180);

export const placesSearchBodySchema = z.object({
  query: z.string().min(2).max(250),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  radiusMeters: z.number().min(100).max(50_000).optional(),
  maxResults: z.number().int().min(1).max(20).optional(),
  includedType: z.string().max(80).optional(),
  openNow: z.boolean().optional(),
  pageToken: z.string().max(300).optional(),
});

export const placesSearchQuerySchema = z.object({
  query: z.string().min(2).max(250),
  lat: latSchema.optional(),
  lng: lngSchema.optional(),
  radiusMeters: z.coerce.number().min(100).max(50_000).optional(),
  maxResults: z.coerce.number().int().min(1).max(20).optional(),
  includedType: z.string().max(80).optional(),
  openNow: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  pageToken: z.string().max(300).optional(),
});

export const placeDetailsQuerySchema = z.object({
  level: z.enum(['basic', 'contact', 'full']).optional(),
});

export const geocodeSchema = z
  .object({
    address: z.string().min(2).max(300).optional(),
    lat: latSchema.optional(),
    lng: lngSchema.optional(),
  })
  .refine(
    (val) => Boolean(val.address) || (typeof val.lat === 'number' && typeof val.lng === 'number'),
    { message: 'Isi "address" atau pasangan "lat" dan "lng"' },
  );

const waypointSchema = z.union([
  z.string().min(1).max(300),
  z
    .object({
      placeId: z.string().min(1).max(200).optional(),
      address: z.string().min(1).max(300).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    })
    .refine(
      (w) => Boolean(w.placeId || w.address || (typeof w.lat === 'number' && typeof w.lng === 'number')),
      { message: 'Waypoint harus memiliki placeId, address, atau pasangan lat & lng' },
    ),
]);

export const routesBodySchema = z.object({
  origin: waypointSchema,
  destination: waypointSchema,
  travelMode: z.enum(['DRIVE', 'TWO_WHEELER', 'WALK', 'BICYCLE', 'TRANSIT']).optional(),
  trafficAware: z.boolean().optional(),
});

export const mapsController = {
  // GET /api/maps/status
  getStatus(req, res) {
    return res.status(200).json({
      success: true,
      data: googleMapsService.getStatus(),
    });
  },

  // POST /api/maps/places/search
  async searchPlacesPost(req, res, next) {
    try {
      const result = await googleMapsService.searchPlaces(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/maps/places/search?query=...
  async searchPlacesGet(req, res, next) {
    try {
      const q = req.validatedQuery;
      const location = typeof q.lat === 'number' && typeof q.lng === 'number' ? { lat: q.lat, lng: q.lng } : undefined;
      const result = await googleMapsService.searchPlaces({
        query: q.query,
        location,
        radiusMeters: q.radiusMeters,
        maxResults: q.maxResults,
        includedType: q.includedType,
        openNow: q.openNow,
        pageToken: q.pageToken,
      });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/maps/places/:placeId
  async getPlaceDetails(req, res, next) {
    try {
      const result = await googleMapsService.getPlaceDetails({
        placeId: req.params.placeId,
        level: req.validatedQuery?.level,
      });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST & GET /api/maps/geocode
  async geocodePost(req, res, next) {
    try {
      const result = await googleMapsService.geocode(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  async geocodeGet(req, res, next) {
    try {
      const result = await googleMapsService.geocode(req.validatedQuery);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/maps/routes
  async computeRoutes(req, res, next) {
    try {
      const result = await googleMapsService.computeRoute(req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  },
};

export default mapsController;
