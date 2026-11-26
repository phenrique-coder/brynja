import {
  GrcAssessment,
  LocalBackupBundle,
  ProbeAuditEntry,
  ScanReport,
  TargetAuthorization,
} from '../models/scan.models';

type OwnedRecord<T> = T & { ownerGithubUserId: string };

export interface ILocalBrynjaStore {
  listScans(ownerId: string, limit?: number): Promise<ScanReport[]>;
  getScan(ownerId: string, scanId: string): Promise<ScanReport | null>;
  putScan(ownerId: string, report: ScanReport): Promise<void>;
  deleteScan(ownerId: string, scanId: string): Promise<void>;

  listAuthorizations(ownerId: string): Promise<TargetAuthorization[]>;
  getAuthorization(
    ownerId: string,
    id: string,
  ): Promise<TargetAuthorization | null>;
  putAuthorization(ownerId: string, auth: TargetAuthorization): Promise<void>;
  deleteAuthorization(ownerId: string, id: string): Promise<void>;

  listAuditLogs(ownerId: string, scanId?: string): Promise<ProbeAuditEntry[]>;
  appendAuditLogs(ownerId: string, entries: ProbeAuditEntry[]): Promise<void>;

  listGrcAssessments(ownerId: string): Promise<GrcAssessment[]>;
  getGrcAssessment(
    ownerId: string,
    id: string,
  ): Promise<GrcAssessment | null>;
  putGrcAssessment(ownerId: string, assessment: GrcAssessment): Promise<void>;
  deleteGrcAssessment(ownerId: string, id: string): Promise<void>;

  exportBackup(ownerId: string): Promise<LocalBackupBundle>;
  importBackup(ownerId: string, bundle: LocalBackupBundle): Promise<void>;
}

const DB_NAME = 'brynja_local_v1';
const DB_VERSION = 2;
const STORE_SCANS = 'scans';
const STORE_AUTH = 'authorizations';
const STORE_AUDIT = 'auditLogs';
const STORE_GRC = 'grcAssessments';

function stripOwner<T>(record: OwnedRecord<T>): T {
  const clone = { ...record } as Record<string, unknown>;
  delete clone.ownerGithubUserId;
  return clone as T;
}

async function exportBackupFromStore(
  store: ILocalBrynjaStore,
  ownerId: string,
): Promise<LocalBackupBundle> {
  const [scans, authorizations, auditLogs, grcAssessments] = await Promise.all([
    store.listScans(ownerId, 500),
    store.listAuthorizations(ownerId),
    store.listAuditLogs(ownerId),
    store.listGrcAssessments(ownerId),
  ]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    ownerGithubUserId: ownerId,
    scans,
    authorizations,
    auditLogs,
    grcAssessments,
  };
}

async function importBackupIntoStore(
  store: ILocalBrynjaStore,
  ownerId: string,
  bundle: LocalBackupBundle,
): Promise<void> {
  for (const scan of bundle.scans ?? []) {
    await store.putScan(ownerId, scan);
  }
  for (const auth of bundle.authorizations ?? []) {
    await store.putAuthorization(ownerId, auth);
  }
  await store.appendAuditLogs(ownerId, bundle.auditLogs ?? []);
  for (const assessment of bundle.grcAssessments ?? []) {
    await store.putGrcAssessment(ownerId, assessment);
  }
}

export class InMemoryBrynjaStore implements ILocalBrynjaStore {
  private readonly scans = new Map<string, OwnedRecord<ScanReport>>();
  private readonly authorizations = new Map<
    string,
    OwnedRecord<TargetAuthorization>
  >();
  private readonly auditLogs = new Map<string, OwnedRecord<ProbeAuditEntry>>();
  private readonly grcAssessments = new Map<
    string,
    OwnedRecord<GrcAssessment>
  >();

  async listScans(ownerId: string, limit = 50): Promise<ScanReport[]> {
    return Array.from(this.scans.values())
      .filter((s) => s.ownerGithubUserId === ownerId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit)
      .map(stripOwner);
  }

  async getScan(ownerId: string, scanId: string): Promise<ScanReport | null> {
    const rec = this.scans.get(scanId);
    if (!rec || rec.ownerGithubUserId !== ownerId) return null;
    return stripOwner(rec);
  }

  async putScan(ownerId: string, report: ScanReport): Promise<void> {
    this.scans.set(report.id, { ...report, ownerGithubUserId: ownerId });
  }

  async deleteScan(ownerId: string, scanId: string): Promise<void> {
    const rec = this.scans.get(scanId);
    if (rec && rec.ownerGithubUserId === ownerId) {
      this.scans.delete(scanId);
    }
  }

  async listAuthorizations(ownerId: string): Promise<TargetAuthorization[]> {
    return Array.from(this.authorizations.values())
      .filter((a) => a.ownerGithubUserId === ownerId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map(stripOwner);
  }

  async getAuthorization(
    ownerId: string,
    id: string,
  ): Promise<TargetAuthorization | null> {
    const rec = this.authorizations.get(id);
    if (!rec || rec.ownerGithubUserId !== ownerId) return null;
    return stripOwner(rec);
  }

  async putAuthorization(
    ownerId: string,
    auth: TargetAuthorization,
  ): Promise<void> {
    for (const [existingId, existing] of this.authorizations.entries()) {
      if (
        existing.ownerGithubUserId === ownerId &&
        existing.origin === auth.origin &&
        existingId !== auth.id
      ) {
        this.authorizations.delete(existingId);
      }
    }
    this.authorizations.set(auth.id, { ...auth, ownerGithubUserId: ownerId });
  }

  async deleteAuthorization(ownerId: string, id: string): Promise<void> {
    const rec = this.authorizations.get(id);
    if (rec && rec.ownerGithubUserId === ownerId) {
      this.authorizations.delete(id);
    }
  }

  async listAuditLogs(
    ownerId: string,
    scanId?: string,
  ): Promise<ProbeAuditEntry[]> {
    return Array.from(this.auditLogs.values())
      .filter(
        (l) =>
          l.ownerGithubUserId === ownerId && (!scanId || l.scanId === scanId),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 200)
      .map(stripOwner);
  }

  async appendAuditLogs(
    ownerId: string,
    entries: ProbeAuditEntry[],
  ): Promise<void> {
    for (const entry of entries) {
      this.auditLogs.set(entry.id, { ...entry, ownerGithubUserId: ownerId });
    }
  }

  async listGrcAssessments(ownerId: string): Promise<GrcAssessment[]> {
    return Array.from(this.grcAssessments.values())
      .filter((a) => a.ownerGithubUserId === ownerId)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map(stripOwner);
  }

  async getGrcAssessment(
    ownerId: string,
    id: string,
  ): Promise<GrcAssessment | null> {
    const rec = this.grcAssessments.get(id);
    if (!rec || rec.ownerGithubUserId !== ownerId) return null;
    return stripOwner(rec);
  }

  async putGrcAssessment(
    ownerId: string,
    assessment: GrcAssessment,
  ): Promise<void> {
    this.grcAssessments.set(assessment.id, {
      ...assessment,
      ownerGithubUserId: ownerId,
    });
  }

  async deleteGrcAssessment(ownerId: string, id: string): Promise<void> {
    const rec = this.grcAssessments.get(id);
    if (rec && rec.ownerGithubUserId === ownerId) {
      this.grcAssessments.delete(id);
    }
  }

  async exportBackup(ownerId: string): Promise<LocalBackupBundle> {
    return exportBackupFromStore(this, ownerId);
  }

  async importBackup(
    ownerId: string,
    bundle: LocalBackupBundle,
  ): Promise<void> {
    await importBackupIntoStore(this, ownerId, bundle);
  }
}

export class IndexedDbBrynjaStore implements ILocalBrynjaStore {
  private readonly fallback = new InMemoryBrynjaStore();
  private dbPromise: Promise<IDBDatabase> | null = null;

  private isSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_SCANS)) {
          const scans = db.createObjectStore(STORE_SCANS, { keyPath: 'id' });
          scans.createIndex('by_owner', 'ownerGithubUserId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_AUTH)) {
          const auths = db.createObjectStore(STORE_AUTH, { keyPath: 'id' });
          auths.createIndex('by_owner', 'ownerGithubUserId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_AUDIT)) {
          const logs = db.createObjectStore(STORE_AUDIT, { keyPath: 'id' });
          logs.createIndex('by_owner', 'ownerGithubUserId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_GRC)) {
          const grc = db.createObjectStore(STORE_GRC, { keyPath: 'id' });
          grc.createIndex('by_owner', 'ownerGithubUserId', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.dbPromise;
  }

  private async getAllByOwner<T>(
    storeName: string,
    ownerId: string,
  ): Promise<Array<OwnedRecord<T>>> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const index = tx.objectStore(storeName).index('by_owner');
      const req = index.getAll(ownerId);
      req.onsuccess = () =>
        resolve((req.result as Array<OwnedRecord<T>>) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  private async getById<T>(
    storeName: string,
    id: string,
  ): Promise<OwnedRecord<T> | null> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(id);
      req.onsuccess = () =>
        resolve((req.result as OwnedRecord<T> | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  private async putRecord<T>(
    storeName: string,
    record: OwnedRecord<T>,
  ): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async deleteById(storeName: string, id: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async listScans(ownerId: string, limit = 50): Promise<ScanReport[]> {
    if (!this.isSupported()) return this.fallback.listScans(ownerId, limit);
    const items = await this.getAllByOwner<ScanReport>(STORE_SCANS, ownerId);
    return items
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit)
      .map(stripOwner);
  }

  async getScan(ownerId: string, scanId: string): Promise<ScanReport | null> {
    if (!this.isSupported()) return this.fallback.getScan(ownerId, scanId);
    const rec = await this.getById<ScanReport>(STORE_SCANS, scanId);
    if (!rec || rec.ownerGithubUserId !== ownerId) return null;
    return stripOwner(rec);
  }

  async putScan(ownerId: string, report: ScanReport): Promise<void> {
    if (!this.isSupported()) return this.fallback.putScan(ownerId, report);
    await this.putRecord(STORE_SCANS, {
      ...report,
      ownerGithubUserId: ownerId,
    });
  }

  async deleteScan(ownerId: string, scanId: string): Promise<void> {
    if (!this.isSupported()) return this.fallback.deleteScan(ownerId, scanId);
    const rec = await this.getById<ScanReport>(STORE_SCANS, scanId);
    if (rec && rec.ownerGithubUserId === ownerId) {
      await this.deleteById(STORE_SCANS, scanId);
    }
  }

  async listAuthorizations(ownerId: string): Promise<TargetAuthorization[]> {
    if (!this.isSupported()) return this.fallback.listAuthorizations(ownerId);
    const items = await this.getAllByOwner<TargetAuthorization>(
      STORE_AUTH,
      ownerId,
    );
    return items
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map(stripOwner);
  }

  async getAuthorization(
    ownerId: string,
    id: string,
  ): Promise<TargetAuthorization | null> {
    if (!this.isSupported()) {
      return this.fallback.getAuthorization(ownerId, id);
    }
    const rec = await this.getById<TargetAuthorization>(STORE_AUTH, id);
    if (!rec || rec.ownerGithubUserId !== ownerId) return null;
    return stripOwner(rec);
  }

  async putAuthorization(
    ownerId: string,
    auth: TargetAuthorization,
  ): Promise<void> {
    if (!this.isSupported()) {
      return this.fallback.putAuthorization(ownerId, auth);
    }
    const existing = await this.getAllByOwner<TargetAuthorization>(
      STORE_AUTH,
      ownerId,
    );
    for (const item of existing) {
      if (item.origin === auth.origin && item.id !== auth.id) {
        await this.deleteById(STORE_AUTH, item.id);
      }
    }
    await this.putRecord(STORE_AUTH, {
      ...auth,
      ownerGithubUserId: ownerId,
    });
  }

  async deleteAuthorization(ownerId: string, id: string): Promise<void> {
    if (!this.isSupported()) {
      return this.fallback.deleteAuthorization(ownerId, id);
    }
    const rec = await this.getById<TargetAuthorization>(STORE_AUTH, id);
    if (rec && rec.ownerGithubUserId === ownerId) {
      await this.deleteById(STORE_AUTH, id);
    }
  }

  async listAuditLogs(
    ownerId: string,
    scanId?: string,
  ): Promise<ProbeAuditEntry[]> {
    if (!this.isSupported()) {
      return this.fallback.listAuditLogs(ownerId, scanId);
    }
    const items = await this.getAllByOwner<ProbeAuditEntry>(
      STORE_AUDIT,
      ownerId,
    );
    return items
      .filter((l) => !scanId || l.scanId === scanId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 200)
      .map(stripOwner);
  }

  async appendAuditLogs(
    ownerId: string,
    entries: ProbeAuditEntry[],
  ): Promise<void> {
    if (!this.isSupported()) {
      return this.fallback.appendAuditLogs(ownerId, entries);
    }
    if (entries.length === 0) return;
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIT, 'readwrite');
      const store = tx.objectStore(STORE_AUDIT);
      for (const entry of entries) {
        store.put({ ...entry, ownerGithubUserId: ownerId });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async listGrcAssessments(ownerId: string): Promise<GrcAssessment[]> {
    if (!this.isSupported()) {
      return this.fallback.listGrcAssessments(ownerId);
    }
    const items = await this.getAllByOwner<GrcAssessment>(STORE_GRC, ownerId);
    return items
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map(stripOwner);
  }

  async getGrcAssessment(
    ownerId: string,
    id: string,
  ): Promise<GrcAssessment | null> {
    if (!this.isSupported()) {
      return this.fallback.getGrcAssessment(ownerId, id);
    }
    const rec = await this.getById<GrcAssessment>(STORE_GRC, id);
    if (!rec || rec.ownerGithubUserId !== ownerId) return null;
    return stripOwner(rec);
  }

  async putGrcAssessment(
    ownerId: string,
    assessment: GrcAssessment,
  ): Promise<void> {
    if (!this.isSupported()) {
      return this.fallback.putGrcAssessment(ownerId, assessment);
    }
    await this.putRecord(STORE_GRC, {
      ...assessment,
      ownerGithubUserId: ownerId,
    });
  }

  async deleteGrcAssessment(ownerId: string, id: string): Promise<void> {
    if (!this.isSupported()) {
      return this.fallback.deleteGrcAssessment(ownerId, id);
    }
    const rec = await this.getById<GrcAssessment>(STORE_GRC, id);
    if (rec && rec.ownerGithubUserId === ownerId) {
      await this.deleteById(STORE_GRC, id);
    }
  }

  async exportBackup(ownerId: string): Promise<LocalBackupBundle> {
    return exportBackupFromStore(this, ownerId);
  }

  async importBackup(
    ownerId: string,
    bundle: LocalBackupBundle,
  ): Promise<void> {
    await importBackupIntoStore(this, ownerId, bundle);
  }
}
