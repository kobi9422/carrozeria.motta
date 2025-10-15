/**
 * Converte i nomi dei campi da snake_case a camelCase
 */
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const camelObj: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Converti snake_case a camelCase
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        camelObj[camelKey] = toCamelCase(obj[key]);
      }
    }
    
    return camelObj;
  }

  return obj;
}

/**
 * Converte i nomi dei campi da camelCase a snake_case
 */
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const snakeObj: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Converti camelCase a snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeObj[snakeKey] = toSnakeCase(obj[key]);
      }
    }
    
    return snakeObj;
  }

  return obj;
}

