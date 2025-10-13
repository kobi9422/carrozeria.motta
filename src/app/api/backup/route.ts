import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // Percorso del database SQLite
    const dbPath = join(process.cwd(), 'prisma', 'dev.db');
    
    // Leggi il file del database
    const dbBuffer = await readFile(dbPath);
    
    // Genera nome file con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `carrozzeria-motta-backup-${timestamp}.db`;
    
    // Restituisci il file come download
    return new NextResponse(dbBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': dbBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Errore nel backup del database:', error);
    return NextResponse.json({ error: 'Errore nel backup del database' }, { status: 500 });
  }
}

