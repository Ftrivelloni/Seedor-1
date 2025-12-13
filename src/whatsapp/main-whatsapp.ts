import { createWhatsappClient } from './bootstrap';

// Standalone runner; does not hook into Nest lifecycle.
void createWhatsappClient().catch((error) => {
  console.error('Error al iniciar el cliente de WhatsApp', error);
  process.exit(1);
});
