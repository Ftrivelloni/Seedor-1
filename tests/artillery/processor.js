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
 * Extrae tokens de autenticación de las respuestas
 */
function extractAuthToken(requestParams, response, context, ee, next) {
  if (response.statusCode === 200 && response.body) {
    try {
      const body = JSON.parse(response.body);
      if (body.token) {
        context.vars.authToken = body.token;
      }
    } catch (error) {
      console.error('Error al procesar la respuesta de autenticación:', error);
    }
  }
  return next();
}

/**
 * Añade cabeceras de autenticación a las solicitudes
 */
function addAuthHeaders(requestParams, context, ee, next) {
  if (context.vars.authToken) {
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['Authorization'] = `Bearer ${context.vars.authToken}`;
  }
  return next();
}

/**
 * Registra información de respuesta para depuración
 */
function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log(`Error ${response.statusCode} en ${requestParams.url}: ${response.body}`);
  }
  return next();
}

module.exports = {
  generateRandomData,
  extractAuthToken,
  addAuthHeaders,
  logResponse
};