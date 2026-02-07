import express, { Router } from 'express';
import ExportController from '../controllers/exportController';
import TeamtailorService from '../services/teamtailor.service';

const router: Router = express.Router();

// Dependency injection
const teamtailorService = new TeamtailorService();
const exportController = new ExportController(teamtailorService);

router.get('/export/candidates', exportController.exportCandidatesCsv);

export default router;
