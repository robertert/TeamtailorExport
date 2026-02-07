import { Request, Response, NextFunction } from 'express';
import TeamtailorService from '../services/teamtailor.service';
import { getCsvHeaderRow, candidatesToCsvRows } from '../utils/csvWriter';

class ExportController {
  constructor(private readonly teamtailorService: TeamtailorService) { }

  exportCandidatesCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const abortController = new AbortController();

    try {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');

      res.write(getCsvHeaderRow());

      req.on('close', () => {
        abortController.abort();
      });

      for await (const batch of this.teamtailorService.getCandidatesPaginated(abortController.signal)) {
        res.write(candidatesToCsvRows(batch));
      }
      res.end();
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      next(error);
    }
  };
}

export default ExportController;
