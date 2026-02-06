import { Request, Response, NextFunction } from 'express';
import TeamtailorService from '../services/teamtailor.service';
import { getCsvHeaderRow, candidatesToCsvRows } from '../utils/csvWriter';

class ExportController {
  constructor(private readonly teamtailorService: TeamtailorService) { }

  exportCandidatesCsv = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');

      res.write(getCsvHeaderRow());

      _req.on('close', () => {
        console.log('Request canceled');
        this.teamtailorService.cancelRequest();
      });

      for await (const batch of this.teamtailorService.getCandidatesPaginated()) {
        res.write(candidatesToCsvRows(batch));
      }
      res.end();
    } catch (error) {
      if (res.headersSent) {
        res.end();
      }
      next(error);
    }
  };
}

export default ExportController;