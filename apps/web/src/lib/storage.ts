import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

export interface StorageAdapter {
  upload(key: string, body: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = join(process.cwd(), "public", "uploads");
  }

  async upload(key: string, body: Buffer, _contentType: string): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });
    const filePath = join(this.uploadDir, key);
    // Ensure subdirectories exist
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (dir !== this.uploadDir) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(filePath, body);
    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, key));
    } catch {
      // File may not exist, ignore
    }
  }

  getPublicUrl(key: string): string {
    return `/uploads/${key}`;
  }
}

let _adapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!_adapter) {
    _adapter = new LocalStorageAdapter();
  }
  return _adapter;
}
