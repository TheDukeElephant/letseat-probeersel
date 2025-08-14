import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GroupsService } from './groups.service';
import * as fs from 'fs';
import * as path from 'path';

// Runs the admin invariant cleanup at most every 6 hours when the app boots.
@Injectable()
export class GroupInvariantStartupRunner implements OnModuleInit {
  private readonly logger = new Logger(GroupInvariantStartupRunner.name);
  private readonly markerFile = path.join(process.cwd(), '.cache', 'last-group-invariant-run');
  private readonly intervalMs = 6 * 60 * 60 * 1000; // 6h

  constructor(private groups: GroupsService) {}

  async onModuleInit() {
    try {
      const dir = path.dirname(this.markerFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let last = 0;
      if (fs.existsSync(this.markerFile)) {
        const raw = fs.readFileSync(this.markerFile, 'utf8');
        last = parseInt(raw, 10) || 0;
      }
      const now = Date.now();
      if (now - last < this.intervalMs) {
        this.logger.log('Skipping group invariant cleanup (recently run).');
        return;
      }
      const deleted = await this.groups.enforceAdminInvariants();
      fs.writeFileSync(this.markerFile, String(now));
      if (deleted > 0) {
        this.logger.warn(`Group admin invariants cleanup removed ${deleted} stale admin record(s).`);
      } else {
        this.logger.log('Group admin invariants verified (no changes needed).');
      }
    } catch (e) {
      this.logger.error('Failed running group invariant cleanup', e as any);
    }
  }
}
