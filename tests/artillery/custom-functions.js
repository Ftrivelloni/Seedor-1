// Archivo para funciones personalizadas de Artillery
function generateRandomEmail() {
  return `user${Math.floor(Math.random() * 10000)}@example.com`;
}

function generateRandomPassword() {
  return `password${Math.floor(Math.random() * 10000)}`;
}

// Exportamos las funciones para que Artillery pueda utilizarlas
module.exports = {
  generateRandomEmail,
  generateRandomPassword,
};