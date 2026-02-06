import { Request, Response } from 'express';
import TeamtailorService from '../services/teamtailor.service';

class ExportController {
  constructor(private readonly teamtailorService: TeamtailorService) {}

  exportCandidates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const candidates = await this.teamtailorService.getCandidates();
      res.json(candidates);
    } catch (error) {
      throw error;
    }
  };
}

export default ExportController;