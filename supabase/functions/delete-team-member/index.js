import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const ADMIN_ROLES = new Set(['administracion', 'admin', 'administrator', 'administrador']);
const validUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
const normalizeRole = value => String(value || '').trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const normalizeEmail = value => String(value || '').trim().toLowerCase();

const corsHeaders = request => {
  const origin = request.headers.get('origin') || '';
  const configured = (Deno.env.get('DASHBOARD_ALLOWED_ORIGINS') || 'https://solvenlabs.cl,https://www.solvenlabs.cl')
    .split(',').map(value => value.trim()).filter(Boolean);
  const allowedOrigin = configured.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? origin : configured[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
};

const jsonResponse = (request, body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(request), 'Content-Type': 'application/json; charset=utf-8' }
});

const getClients = token => {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceRole) throw new Error('Supabase no está configurado en la función.');
  return {
    auth: createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    }),
    admin: createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  };
};

async function findTarget(admin, targetId, targetKind) {
  if (targetKind === 'profile') {
    const { data: profile, error } = await admin.from('profiles')
      .select('id,full_name,email,role')
      .eq('id', targetId)
      .maybeSingle();
    if (error) throw error;
    return { profile, teamMember: null };
  }

  const { data: teamMember, error } = await admin.from('team_members')
    .select('id,profile_id,full_name,email,role_title')
    .eq('id', targetId)
    .maybeSingle();
  if (error) throw error;
  if (!teamMember) return { profile: null, teamMember: null };

  let profile = null;
  if (teamMember.profile_id) {
    const result = await admin.from('profiles')
      .select('id,full_name,email,role')
      .eq('id', teamMember.profile_id)
      .maybeSingle();
    if (result.error) throw result.error;
    profile = result.data;
  } else if (teamMember.email) {
    const result = await admin.from('profiles')
      .select('id,full_name,email,role')
      .ilike('email', teamMember.email)
      .maybeSingle();
    if (result.error) throw result.error;
    profile = result.data;
  }

  return { profile, teamMember };
}

async function collectTeamMemberIds(admin, profile, teamMember) {
  const ids = new Set(teamMember?.id ? [teamMember.id] : []);
  if (profile?.id) {
    const { data, error } = await admin.from('team_members').select('id').eq('profile_id', profile.id);
    if (error) throw error;
    (data || []).forEach(item => ids.add(item.id));
  }
  if (profile?.email) {
    const { data, error } = await admin.from('team_members').select('id').ilike('email', profile.email);
    if (error) throw error;
    (data || []).forEach(item => ids.add(item.id));
  }
  return [...ids];
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse(request, { error: 'Método no permitido.' }, 405);

  try {
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse(request, { error: 'Debes iniciar sesión.' }, 401);

    const { auth, admin } = getClients(token);
    const { data: { user }, error: userError } = await auth.auth.getUser(token);
    if (userError || !user) return jsonResponse(request, { error: 'La sesión no es válida.' }, 401);

    const { data: callerProfile, error: callerError } = await admin.from('profiles')
      .select('id,full_name,email,role')
      .eq('id', user.id)
      .maybeSingle();
    if (callerError) throw callerError;
    if (!callerProfile || !ADMIN_ROLES.has(normalizeRole(callerProfile.role))) {
      return jsonResponse(request, { error: 'Solo administración puede eliminar miembros.' }, 403);
    }

    const body = await request.json();
    const targetId = String(body?.target_id || '').trim();
    const targetKind = body?.target_kind === 'profile' ? 'profile' : 'team_member';
    if (!validUuid(targetId)) return jsonResponse(request, { error: 'El miembro seleccionado no es válido.' }, 400);

    const { profile: targetProfile, teamMember } = await findTarget(admin, targetId, targetKind);
    if (!targetProfile && !teamMember) return jsonResponse(request, { error: 'El miembro ya no existe.' }, 404);

    if (targetProfile?.id === user.id || normalizeEmail(teamMember?.email) === normalizeEmail(callerProfile.email)) {
      return jsonResponse(request, { error: 'No puedes eliminar tu propia cuenta.' }, 409);
    }
    if (targetProfile && ADMIN_ROLES.has(normalizeRole(targetProfile.role))) {
      return jsonResponse(request, { error: 'No se puede eliminar a otro administrador.' }, 409);
    }
    if (!targetProfile && ADMIN_ROLES.has(normalizeRole(teamMember?.role_title))) {
      return jsonResponse(request, { error: 'No se puede eliminar a otro administrador.' }, 409);
    }

    const teamMemberIds = await collectTeamMemberIds(admin, targetProfile, teamMember);
    const deletedName = targetProfile?.full_name || teamMember?.full_name || 'Miembro';

    if (targetProfile?.id) {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(targetProfile.id, false);
      if (authDeleteError) throw authDeleteError;

      // Refuerzo para instalaciones donde el FK de profiles aún no tenga CASCADE.
      const { error: profileDeleteError } = await admin.from('profiles').delete().eq('id', targetProfile.id);
      if (profileDeleteError) throw profileDeleteError;
    }

    if (teamMemberIds.length) {
      const { error: teamDeleteError } = await admin.from('team_members').delete().in('id', teamMemberIds);
      if (teamDeleteError) throw teamDeleteError;
    }

    await admin.from('activity_log').insert({
      user_id: user.id,
      user_name: callerProfile.full_name || callerProfile.email,
      activity_type: 'team',
      description: 'eliminó definitivamente un miembro desde Auth y el dashboard',
      entity_name: deletedName
    });

    return jsonResponse(request, {
      ok: true,
      deleted_auth_user: Boolean(targetProfile?.id),
      deleted_team_members: teamMemberIds.length,
      name: deletedName
    });
  } catch (error) {
    console.error('delete-team-member:', error);
    return jsonResponse(request, {
      error: error instanceof Error ? error.message : 'No se pudo eliminar el miembro.'
    }, 500);
  }
});
