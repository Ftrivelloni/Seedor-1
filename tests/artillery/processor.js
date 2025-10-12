/**
 * Funciones auxiliares para tests de Artillery
 */

/**
 * Genera datos aleatorios para formularios
 */
function generateRandomData(requestParams, context, ee, next) {
  // Genera un nombre aleatorio para campos
  context.vars.randomCampoName = `Campo Test ${Math.floor(Math.random() * 10000)}`;
  
  // Genera un número aleatorio para cantidades
  context.vars.randomQuantity = Math.floor(Math.random() * 100) + 1;
  
  // Genera una fecha aleatoria (para los últimos 30 días)
  const today = new Date();
  const randomDaysAgo = Math.floor(Math.random() * 30);
  const randomDate = new Date(today);
  randomDate.setDate(today.getDate() - randomDaysAgo);
  
  const year = randomDate.getFullYear();
  const month = String(randomDate.getMonth() + 1).padStart(2, '0');
  const day = String(randomDate.getDate()).padStart(2, '0');
  
  context.vars.randomDate = `${year}-${month}-${day}`;
  
  // Genera un correo aleatorio (útil para tests de registro)
  context.vars.randomEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
  
  return next();
}

/**
 * Extrae cookies de autenticación de las respuestas
 */
function extractAuthToken(requestParams, response, context, ee, next) {
  console.log(`Respuesta de autenticación - Código: ${response.statusCode}`);
  
  // Extraer cookies de la respuesta
  if (response.headers && response.headers['set-cookie']) {
    const cookies = response.headers['set-cookie'];
    console.log('Cookies recibidas:', cookies);
    
    // Buscar la cookie de sesión
    const sessionCookie = cookies.find(cookie => cookie.includes('seedor_session'));
    if (sessionCookie) {
      const match = sessionCookie.match(/seedor_session=([^;]+)/);
      if (match && match[1]) {
        context.vars.sessionToken = match[1];
        console.log('Cookie de sesión extraída correctamente');
      }
    }
  }
  
  if (response.body) {
    try {
      const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      console.log('Contenido de respuesta:', JSON.stringify(body).substring(0, 200));
      
      if (body && body.token) {
        context.vars.authToken = body.token;
        console.log('Token extraído correctamente del cuerpo');
      }
    } catch (error) {
      console.log('La respuesta no es un JSON válido o no contiene token');
    }
  }
  
  return next();
}

/**
 * Añade cabeceras de autenticación o cookies a las solicitudes
 */
function addAuthHeaders(requestParams, context, ee, next) {
  requestParams.headers = requestParams.headers || {};
  
  // Si tenemos un token de JWT, lo añadimos como header de Authorization
  if (context.vars.authToken) {
    requestParams.headers['Authorization'] = `Bearer ${context.vars.authToken}`;
  }
  
  // Si tenemos una cookie de sesión, la añadimos
  if (context.vars.sessionToken) {
    requestParams.headers['Cookie'] = `seedor_session=${context.vars.sessionToken}`;
  }
  
  return next();
}

/**
 * Registra información de respuesta para depuración
 */
function logResponse(requestParams, response, context, ee, next) {
  // Registra todas las respuestas para mejor depuración
  const urlPath = requestParams.url || 'desconocida';
  
  if (response.statusCode >= 400) {
    console.log(`❌ ERROR ${response.statusCode} en ${urlPath}`);
    if (response.body) {
      try {
        // Intenta parsear como JSON si es posible
        const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        console.log(`Detalles: ${JSON.stringify(body).substring(0, 200)}`);
      } catch (e) {
        // Si no es JSON, muestra como texto
        console.log(`Detalles: ${response.body.substring(0, 200)}`);
      }
    }
  } else {
    console.log(`✅ ${response.statusCode} OK en ${urlPath}`);
  }
  
  return next();
}

module.exports = {
  generateRandomData,
  extractAuthToken,
  addAuthHeaders,
  logResponse
};