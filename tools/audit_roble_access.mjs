#!/usr/bin/env node

// Read-only audit. Prints only statuses and counts, never rows or credentials.
const required = [
  'ROBLE_BASE_URL', 'ROBLE_CONTRACT_ID',
  'ROBLE_TEST_A_EMAIL', 'ROBLE_TEST_A_PASSWORD',
  'ROBLE_TEST_B_EMAIL', 'ROBLE_TEST_B_PASSWORD',
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Faltan variables: ${missing.join(', ')}`);
  process.exit(2);
}

const base = new URL(process.env.ROBLE_BASE_URL);
if (base.protocol !== 'https:' && base.hostname !== 'localhost') {
  console.error('La URL de Roble debe usar HTTPS.');
  process.exit(2);
}
const contract = encodeURIComponent(process.env.ROBLE_CONTRACT_ID);
const authBase = new URL(`auth/${contract}/`, `${base.href.replace(/\/?$/, '/')}`);
const dataBase = new URL(`database/${contract}/`, `${base.href.replace(/\/?$/, '/')}`);

async function request(url, { token, method = 'GET', body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  return { status: response.status, data };
}

function rows(response) {
  const data = Array.isArray(response.data) ? response.data : response.data?.data;
  return Array.isArray(data) ? data : [];
}

async function login(email, password) {
  const signedIn = await request(new URL('login', authBase), {
    method: 'POST', body: { email, password },
  });
  const token = signedIn.data?.accessToken;
  if (signedIn.status !== 200 || typeof token !== 'string') {
    throw new Error(`No se pudo iniciar sesión de prueba (HTTP ${signedIn.status})`);
  }
  const profile = await request(new URL('me', authBase), { token });
  const userId = profile.data?.userId;
  if (profile.status !== 200 || typeof userId !== 'string') {
    throw new Error(`No se pudo obtener userId (HTTP ${profile.status})`);
  }
  return { token, userId };
}

async function read(table, token, filters = {}, publicAccess = false) {
  const url = new URL(publicAccess ? 'public-read' : 'read', dataBase);
  url.searchParams.set('tableName', table);
  for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);
  return request(url, { token: publicAccess ? undefined : token });
}

function print(label, response, matching) {
  const count = response.status === 200 ? rows(response).filter(matching).length : 0;
  console.log(`${label}: HTTP ${response.status}; filas relevantes ${count}`);
  return count;
}

try {
  const [a, b] = await Promise.all([
    login(process.env.ROBLE_TEST_A_EMAIL, process.env.ROBLE_TEST_A_PASSWORD),
    login(process.env.ROBLE_TEST_B_EMAIL, process.env.ROBLE_TEST_B_PASSWORD),
  ]);
  if (a.userId === b.userId) throw new Error('Las cuentas A y B corresponden al mismo userId.');

  const [publicProjects, publicTasks, bProjects, bProfiles, bMessages, bNotifications] = await Promise.all([
    read('projects', undefined, {}, true),
    read('project_tasks', undefined, {}, true),
    read('projects', b.token),
    read('user_profiles', b.token, { userId: a.userId }),
    read('direct_messages', b.token),
    read('app_notifications', b.token),
  ]);

  const draftIds = new Set(rows(publicProjects)
    .filter((row) => row.isDraft === true || row.isDraft === 'true')
    .map((row) => row._id));
  print('Visitante lee borradores', publicProjects,
    (row) => row.isDraft === true || row.isDraft === 'true');
  print('Visitante lee tareas de borradores', publicTasks,
    (row) => draftIds.has(row.projectId));
  print('B lee borradores de A', bProjects,
    (row) => row._owner === a.userId && (row.isDraft === true || row.isDraft === 'true'));
  print('B lee perfil de A', bProfiles, (row) => row.userId === a.userId);
  print('B lee mensajes ajenos', bMessages,
    (row) => row.fromUserId !== b.userId && row.toUserId !== b.userId);
  print('B lee notificaciones ajenas', bNotifications,
    (row) => row.recipientUserId !== b.userId);
  console.log('Un resultado de 0 filas puede ser inconcluso si no hay datos de prueba para ese caso.');
} catch (error) {
  console.error(`Auditoría incompleta: ${error instanceof Error ? error.message : 'error desconocido'}`);
  process.exit(1);
}
