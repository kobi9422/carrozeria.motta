import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { toCamelCase } from '@/lib/supabase-helpers';

// GET - Statistiche ore lavorate per dipendente
// Query params:
// - userId: filtra per dipendente specifico (opzionale, se non specificato mostra tutti)
// - startDate: data inizio periodo (opzionale, default: inizio mese corrente)
// - endDate: data fine periodo (opzionale, default: oggi)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();

    // Query per ottenere tutte le sessioni nel periodo
    let query = supabaseServer
      .from('job_sessions')
      .select(`
        *,
        user:users!job_sessions_user_id_fkey (
          id,
          nome,
          cognome,
          email,
          costo_orario
        )
      `)
      .gte('start_time', startDate)
      .lte('start_time', endDate);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Errore nel recupero sessioni:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Raggruppa per dipendente e calcola statistiche
    const statsByUser = new Map();

    (sessions || []).forEach((session: any) => {
      const userId = session.user_id;
      
      if (!statsByUser.has(userId)) {
        statsByUser.set(userId, {
          user: session.user,
          totalMinutes: 0,
          totalHours: 0,
          totalCost: 0,
          sessionCount: 0,
          activeSessions: 0,
          completedSessions: 0
        });
      }

      const stats = statsByUser.get(userId);
      
      // Calcola durata
      let durationMinutes = session.duration_minutes;
      if (!durationMinutes && session.start_time) {
        const startTime = new Date(session.start_time);
        const endTime = session.end_time ? new Date(session.end_time) : new Date();
        durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      }

      stats.totalMinutes += durationMinutes || 0;
      stats.totalHours = stats.totalMinutes / 60;
      stats.totalCost = stats.totalHours * (session.user?.costo_orario || 0);
      stats.sessionCount += 1;
      
      if (session.end_time) {
        stats.completedSessions += 1;
      } else {
        stats.activeSessions += 1;
      }
    });

    // Converti Map in array
    const statsArray = Array.from(statsByUser.values()).map(stats => ({
      userId: stats.user.id,
      nome: stats.user.nome,
      cognome: stats.user.cognome,
      email: stats.user.email,
      costoOrario: stats.user.costo_orario,
      totalMinutes: stats.totalMinutes,
      totalHours: parseFloat(stats.totalHours.toFixed(2)),
      totalCost: parseFloat(stats.totalCost.toFixed(2)),
      sessionCount: stats.sessionCount,
      activeSessions: stats.activeSessions,
      completedSessions: stats.completedSessions,
      averageSessionMinutes: stats.sessionCount > 0 ? Math.floor(stats.totalMinutes / stats.sessionCount) : 0
    }));

    // Ordina per ore totali (decrescente)
    statsArray.sort((a, b) => b.totalHours - a.totalHours);

    return NextResponse.json(toCamelCase({
      period: {
        startDate,
        endDate
      },
      stats: statsArray,
      summary: {
        totalUsers: statsArray.length,
        totalHours: parseFloat(statsArray.reduce((sum, s) => sum + s.totalHours, 0).toFixed(2)),
        totalCost: parseFloat(statsArray.reduce((sum, s) => sum + s.totalCost, 0).toFixed(2)),
        totalSessions: statsArray.reduce((sum, s) => sum + s.sessionCount, 0),
        activeSessions: statsArray.reduce((sum, s) => sum + s.activeSessions, 0)
      }
    }));
  } catch (error: any) {
    console.error('Errore nel calcolo statistiche:', error);
    return NextResponse.json(
      { error: 'Errore nel calcolo delle statistiche' },
      { status: 500 }
    );
  }
}

