# Decision: Sin Autenticación (Viewer Contable Local)

## Status
Aceptado

## Contexto
El visor contable procesa registros históricos y confidenciales de nóminas gubernamentales locales. El sistema no incluye capacidades de edición ni modificación de datos en caliente (es un sistema de análisis e informes de solo lectura).

## Decisión
Se ha decidido conscientemente **no implementar autenticación de usuarios (AuthN) ni control de accesos (AuthZ)** a nivel del código de la aplicación.

## Consecuencias
- **Simplicidad de Despliegue:** El sistema se comporta como un visor directo y ligero.
- **Asunción de Red Privada:** Se delega la seguridad perimetral a la red donde se despliegue. El acceso debe restringirse mediante VPN corporativa o seguridad a nivel de red (por ejemplo, Cloudflare Access o cortafuegos de infraestructura).
- **Riesgo:** El acceso físico o lógico a la red expone el visor. Si en el futuro se publica a internet abierto, se deberá interponer una capa de seguridad externa o integrar OAuth2.
