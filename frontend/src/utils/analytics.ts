// Analítica ligera y enmascaramiento de datos sensibles

export const maskRfc = (rfc: string): string => {
  if (rfc.length >= 8) {
    return `${rfc.substring(0, 4)}***${rfc.substring(rfc.length - 3)}`;
  }
  return '***';
};

export const trackEvent = (eventName: string, data: Record<string, any> = {}) => {
  // Clonar para no modificar los datos originales
  const sanitizedData = { ...data };

  // Enmascarar RFC si está presente en los datos
  if (sanitizedData.rfc) {
    sanitizedData.rfc = maskRfc(sanitizedData.rfc);
  }

  // Log estructurado en consola (fallback de producción)
  console.log(`[Analytics Event] ${new Date().toISOString()}`, {
    event: eventName,
    data: sanitizedData
  });

  // Opcional: Enviar a endpoint de logs
  /*
  fetch('/api/logs/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: eventName, data: sanitizedData })
  }).catch(() => {});
  */
};
