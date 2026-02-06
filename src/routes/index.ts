import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

router.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Test endpoint działa poprawnie',
    method: 'GET',
    timestamp: new Date().toISOString()
  });
});

router.post('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Test endpoint POST działa poprawnie',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

export default router;
