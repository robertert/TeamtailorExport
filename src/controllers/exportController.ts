import { Request, Response, NextFunction } from 'express';
import TeamtailorService from '../services/teamtailor.service';
import { createCsvStringifier } from '../utils/csvWriter';

class ExportController {
  constructor(private readonly teamtailorService: TeamtailorService) { }

  exportCandidatesCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const abortController = new AbortController();

    try {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates.csv"');

      req.on('close', () => abortController.abort());

      const csvStream = createCsvStringifier();
      csvStream.pipe(res);

      for await (const batch of this.teamtailorService.getCandidatesPaginated(abortController.signal)) {
        for (const candidate of batch) {
          if (!csvStream.write(candidate)) {
            await new Promise<void>(resolve => csvStream.once('drain', resolve));
          }
        }
      }

      csvStream.end();
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
