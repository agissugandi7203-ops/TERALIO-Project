import express from 'express';
import cors from 'cors';
import routes from './api/routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.details || null,
  });
});

export default app;
