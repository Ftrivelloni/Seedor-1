/**
 * Genera un número entero aleatorio entre min y max (ambos inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Genera un número decimal aleatorio entre min y max con la precisión especificada
 */
export function randomDecimal(min: number, max: number, decimals: number = 1): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

/**
 * Genera una fecha aleatoria en formato YYYY-MM-DD dentro del rango especificado
 */
export function randomDate(startYear: number = 2025, endYear: number = 2026): string {
  const year = randomInt(startYear, endYear);
  const month = randomInt(1, 12).toString().padStart(2, '0');
  const day = randomInt(1, 28).toString().padStart(2, '0'); // Limitado a 28 para evitar problemas con febrero
  return `${year}-${month}-${day}`;
}

/**
 * Selecciona un elemento aleatorio de un array
 */
export function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Genera un ID aleatorio con un prefijo y un número
 */
export function randomId(prefix: string = '', length: number = 4): string {
  return `${prefix}${randomInt(1000, 9999 * Math.pow(10, length - 4))}`;
}

/**
 * Genera una cadena aleatoria con letras mayúsculas y números
 */
export function randomString(length: number = 5): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Datos específicos para cada módulo

export const IngresoData = {
  // Genera datos aleatorios para el módulo de Ingreso de Fruta
  generateData() {
    const productos = ['Naranja', 'Limón', 'Mandarina', 'Pomelo', 'Lima'];
    const tiposCosecha = ['Con rama', 'Sin rama', 'Selectiva', 'Mecánica'];
    const tiposBin = ['Plástico', 'Madera', 'Metal', 'Cartón'];
    
    return {
      fecha: randomDate(),
      num_ticket: randomId('T', 4),
      num_remito: randomId('R', 4),
      productor: randomFromArray(['Martín', 'Juan', 'Luis', 'Carlos', 'Roberto']),
      finca: randomId('F', 5),
      producto: randomFromArray(productos),
      lote: randomInt(1, 99).toString(),
      contratista: randomFromArray(['Leandro', 'Miguel', 'Pedro', 'José']),
      tipo_cosecha: randomFromArray(tiposCosecha),
      transporte: `${randomString(3)}Transport`,
      chofer: randomFromArray(['Santino', 'Gabriel', 'Daniel', 'Eduardo']),
      chasis: `${randomString(3)}-${randomInt(100, 999)}`,
      acoplado: `${randomString(2)}${randomInt(1000, 9999)}`,
      operario: randomFromArray(['Nahuel', 'Pablo', 'Marcos', 'David']),
      cant_bin: randomInt(10, 50),
      tipo_bin: randomFromArray(tiposBin),
      peso_neto: randomInt(15, 30)
    };
  }
};

export const PreprocesoData = {
  // Genera datos aleatorios para el módulo de Preproceso
  generateData() {
    return {
      semana: randomInt(1, 52),
      fecha: randomDate(),
      duracion: randomDecimal(1, 8, 1),
      ritmo_maquina: randomInt(5, 20),
      bins_procesados: randomInt(20, 100),
      merma: randomDecimal(1, 15, 1),
      bin_pleno: randomInt(10, 30),
      bin_intermedio_I: randomInt(5, 15),
      bin_intermedio_II: randomInt(3, 10),
      bin_incipiente: randomInt(2, 15),
      cant_personal: randomInt(2, 10)
    };
  }
};

export const PalletsData = {
  // Genera datos aleatorios para el módulo de Pallets
  generateData() {
    const productos = ['Naranja', 'Limón', 'Mandarina', 'Pomelo', 'Lima'];
    const categorias = ['Cat. 1 / Premium', 'Cat. 2 / Estándar', 'Cat. 3 / Industrial'];
    const destinos = ['Mercado Central', 'Exportación', 'Industria', 'Mercado Local'];
    
    return {
      semana: randomInt(1, 52),
      num_pallet: randomId('P', 4),
      producto: randomFromArray(productos),
      procedencia: randomFromArray(['Leandro', 'Finca Norte', 'Campo Sur', 'Quinta Los Alamos']),
      categoria: randomFromArray(categorias),
      empaque: `${randomString(3)}-${randomInt(10, 99)}${randomString(1)}`,
      destino: randomFromArray(destinos),
      cajas: randomInt(10, 50),
      unidades: randomInt(100, 500),
      peso: randomInt(1000, 5000),
      fecha: randomDate()
    };
  }
};

export const DespachoData = {
  // Genera datos aleatorios para el módulo de Despacho
  generateData() {
    const clientes = ['Disco Cencosud', 'Carrefour', 'Walmart', 'Jumbo', 'FrutExport SA'];
    const destinos = ['Mercado Central', 'Buenos Aires', 'Córdoba', 'Mendoza', 'Exportación'];
    
    return {
      fecha: randomDate(),
      num_orden: randomId('O', 4),
      cliente: randomFromArray(clientes),
      destino: randomFromArray(destinos),
      dtv_tipo: randomString(4),
      dtv_numero: `${randomString(2)}-${randomInt(10000, 99999)}`,
      guia_tipo: randomString(3),
      guia_numero: randomInt(1000000, 9999999).toString(),
      empresa_transporte: `${randomFromArray(['Mario', 'Pedro', 'Juan', 'Luis'])} ${randomString(3)}`,
      chofer: randomFromArray(['Enrique', 'Roberto', 'Miguel', 'Jorge']),
      cuit: `${randomInt(20, 30)}-${randomInt(10000000, 99999999)}-${randomInt(0, 9)}`,
      dni: randomInt(10000000, 40000000).toString(),
      telefono: `+54 9 ${randomInt(11, 15)} ${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      chasis: randomString(4),
      acoplado: `${randomString(1)}${randomInt(100, 999)}`,
      pallets: randomInt(10, 100),
      cajas: randomInt(100, 500),
      operario: randomFromArray(['José', 'Antonio', 'Fernando', 'Ricardo'])
    };
  }
};

export const EgresoData = {
  // Genera datos aleatorios para el módulo de Egreso de Fruta
  generateData() {
    const clientes = ['FrutExport SA', 'Agroindustrias', 'Sysco', 'SynagroTucuman'];
    const productos = ['Naranja', 'Limón', 'Mandarina', 'Pomelo', 'Lima'];
    
    return {
      fecha: randomDate(),
      num_orden: randomId('E', 5),
      cliente: randomFromArray(clientes),
      destino: randomId('D', 3),
      producto: randomFromArray(productos),
      dtv: randomString(5),
      bins: randomInt(50, 200),
      peso: randomInt(1000, 10000),
      empresa_transporte: `${randomString(3)}Transporte`,
      chofer: randomFromArray(['José', 'Fernando', 'Ricardo', 'Eduardo']),
      chasis: randomInt(10000, 99999).toString(),
      acoplado: `${randomString(3)}-${randomInt(100, 999)}`
    };
  }
};