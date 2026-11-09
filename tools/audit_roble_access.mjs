#!/usr/bin/env node

// Read-only audit. Prints only statuses and counts, never rows or credentials.
const required = [
  'ROBLE_BASE_URL', 'ROBLE_CONTRACT_ID',
  'ROBLE_TEST_A_EMAIL', 'ROBLE_TEST_A_PASSWORD',
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Faltan variables: ${missing.join(', ')}`);
  process.exit(2);
}
const hasBEmail = Boolean(process.env.ROBLE_TEST_B_EMAIL);
const hasBPassword = Boolean(process.env.ROBLE_TEST_B_PASSWORD);
if (hasBEmail !== hasBPassword) {
  console.error('La cuenta B necesita correo y contraseña, o ninguno de los dos.');
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
  if (![200, 201].includes(signedIn.status) || typeof token !== 'string') {
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
  const count = response.status === 200 ? rows(response).filter(matching).length : null;
  console.log(`${label}: HTTP ${response.status}; filas relevantes ${count ?? '—'}`);
  return count;
}

const exposures = [];
const inconclusive = [];
function privateLeak(label, count) {
  if (count === null) inconclusive.push(label);
  else if (count > 0) exposures.push(label);
}

try {
  const a = await login(process.env.ROBLE_TEST_A_EMAIL, process.env.ROBLE_TEST_A_PASSWORD);
  const b = hasBEmail ? await login(process.env.ROBLE_TEST_B_EMAIL, process.env.ROBLE_TEST_B_PASSWORD) : null;
  if (b && a.userId === b.userId) throw new Error('Las cuentas A y B corresponden al mismo userId.');

  const [publicProjects, publicTasks, aProjects, aProfiles, aMessages, aNotifications] = await Promise.all([
    read('projects', undefined, {}, true),
    read('project_tasks', undefined, {}, true),
    read('projects', a.token),
    read('user_profiles', a.token, { userId: a.userId }),
    read('direct_messages', a.token),
    read('app_notifications', a.token),
  ]);

  const draftIds = new Set([...rows(publicProjects), ...rows(aProjects)]
    .filter((row) => row.isDraft === true || row.isDraft === 'true')
    .map((row) => row._id));
  const publicDrafts = print('Visitante lee borradores', publicProjects,
    (row) => row.isDraft === true || row.isDraft === 'true');
  const publicDraftTasks = print('Visitante lee tareas de borradores', publicTasks,
    (row) => draftIds.has(row.projectId));
  const foreignDrafts = print('A lee borradores de otras cuentas', aProjects,
    (row) => row._owner && row._owner !== a.userId && (row.isDraft === true || row.isDraft === 'true'));
  const foreignNotifications = print('A lee avisos de otras cuentas', aNotifications,
    (row) => row.recipientUserId && row.recipientUserId !== a.userId);
  privateLeak('borradores públicos', publicDrafts);
  privateLeak('tareas de borradores públicas', publicDraftTasks);
  privateLeak('borradores ajenos visibles para A', foreignDrafts);
  privateLeak('avisos ajenos visibles para A', foreignNotifications);
  if (draftIds.size === 0) inconclusive.push('no se encontró un borrador de prueba para comprobar tareas');
  print('A lee su perfil', aProfiles, (row) => row.userId === a.userId);
  print('A consulta mensajes', aMessages, () => true);
  if (aProfiles.status === 404) inconclusive.push('user_profiles respondió 404');
  if (aMessages.status === 404) inconclusive.push('direct_messages respondió 404');

  if (b) {
    const [bProjects, bProfiles, bMessages, bNotifications] = await Promise.all([
      read('projects', b.token),
      read('user_profiles', b.token, { userId: a.userId }),
      read('direct_messages', b.token),
      read('app_notifications', b.token),
    ]);
    privateLeak('borradores de A visibles para B', print('B lee borradores de A', bProjects,
      (row) => row._owner === a.userId && (row.isDraft === true || row.isDraft === 'true')));
    print('B lee perfil de A', bProfiles, (row) => row.userId === a.userId);
    privateLeak('mensajes ajenos visibles para B', print('B lee mensajes ajenos', bMessages,
      (row) => row.fromUserId && row.toUserId && row.fromUserId !== b.userId && row.toUserId !== b.userId));
    privateLeak('avisos ajenos visibles para B', print('B lee notificaciones ajenas', bNotifications,
      (row) => row.recipientUserId && row.recipientUserId !== b.userId));
    if (bProfiles.status === 404) inconclusive.push('user_profiles respondió 404 para B');
    if (bMessages.status === 404) inconclusive.push('direct_messages respondió 404 para B');
  } else {
    inconclusive.push('prueba cruzada A/B pendiente: falta configurar la segunda cuenta');
  }
  if (exposures.length) {
    console.error(`EXPOSICIÓN CONFIRMADA: ${exposures.join('; ')}.`);
    process.exitCode = 1;
  } else if (inconclusive.length) {
    console.warn(`AUDITORÍA INCONCLUSA: ${inconclusive.join('; ')}.`);
    process.exitCode = 2;
  } else {
    console.log('No se observaron exposiciones en estas lecturas. Confirmar con datos de prueba y revisar escrituras.');
  }
  console.log('Un resultado de 0 filas puede ser inconcluso si no hay datos de prueba para ese caso.');
} catch (error) {
  console.error(`Auditoría incompleta: ${error instanceof Error ? error.message : 'error desconocido'}`);
  process.exit(1);
}
