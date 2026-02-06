import express, { Router } from 'express';
import ExportController from '../controllers/exportController';
import TeamtailorService from '../services/teamtailor.service';
import { validateResource } from '../middleware/validateResource';
import { ExportRequestSchema } from '../schemas/export.schema';

const router: Router = express.Router();

// Dependency injection
const teamtailorService = new TeamtailorService();
const exportController = new ExportController(teamtailorService);

router.get('/export/candidates',validateResource(ExportRequestSchema), exportController.exportCandidatesCsv);

export default router;
