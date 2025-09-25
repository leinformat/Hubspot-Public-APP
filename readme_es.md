# Reporte Inicial – App Pública HubSpot ↔ Titanx

## 1. Contexto
Se plantea el desarrollo de una **app pública** para el HubSpot App Marketplace que conecte HubSpot con Titanx.  
El objetivo es que los usuarios puedan instalarla desde el Marketplace, autorizarla vía OAuth 2.0 y administrar la sincronización de datos (ej. contactos, deals, propiedades, operaciones específicas de negocio).

El diseño debe ser **multi-tenant**, permitiendo que múltiples portales de HubSpot se conecten de manera independiente.

---

## 2. Tipos de cuentas y licencias necesarias

### Para crear la Public App
- **HubSpot Developer Account (gratuita):**  
  Necesaria para registrar la aplicación, definir scopes, probar OAuth y preparar la publicación en el Marketplace.  

### Para utilizar la Public App
- **Cualquier portal de HubSpot (Free, Starter, Pro o Enterprise):**  
  - Un usuario con permisos de **Súper Administrador** puede instalar la app.  
  - La app puede funcionar en cuentas Free, pero **las funcionalidades dependen de la licencia**:  
    - **Free/Starter:** solo acceso básico a contactos y propiedades estándar.  
    - **Professional/Enterprise:** acceso avanzado (ej. workflows, objetos personalizados, reporting avanzado).  

⚠️ Si la app requiere integrarse con **objetos personalizados** o ciertas APIs avanzadas, será **obligatorio** que el portal tenga **Professional o Enterprise**.

---

## 3. UI y experiencia de usuario

- Con **HubSpot UI Extensions** podemos renderizar pantallas dentro de **Settings** y en algunos records (ej. sidebar de contacto o deal).  
- **Limitación:** si se necesita una interfaz más compleja (dashboards avanzados, reportes visuales, manejo de data intensivo) será necesario construir una **aplicación externa** (ej. una webapp en React/Next.js) que se conecte al backend y muestre los datos fuera de HubSpot.  

---

## 4. Backend externo requerido

Para que una Public App funcione correctamente se necesita un **backend externo**, con las siguientes características:

- **Servidor:** preferiblemente en **AWS (EC2, Lambda, o ECS)** para escalabilidad.  
- **Base de datos:** (multi-tenant) para almacenar tokens de acceso/refresh por portal.  
- **Autenticación:** implementación completa del flujo **OAuth 2.0 de HubSpot**.  
- **Requerimientos obligatorios:**  
  - **SSL** activo (HTTPS).  
  - **Dominio propio** (ej. `api.midominio.com`).  
  - **Disponibilidad alta** (mínimo 99.9%).  
  - Logs y métricas (ej. con CloudWatch o ELK).  

El backend será el encargado de:
- Guardar y refrescar los tokens de cada portal conectado.  
- Exponer endpoints que serán consumidos por la UI de HubSpot (via `hubspot.fetch`).  
- Conectarse con Titanx para la sincronización bidireccional.  

---

## 5. Buenas prácticas para publicar en el Marketplace

- **Seguridad:**  
  - Tokens cifrados en la base de datos.  
  - Manejo estricto de refresh tokens.  
  - HTTPS en todas las llamadas.  
- **UX:**  
  - Instalación en 3 pasos máximo (Install → OAuth → Settings page).  
  - Botón claro de reconexión si expira el token.  
- **Requisitos de HubSpot Marketplace:**  
  - Política de privacidad pública.  
  - URL de soporte y documentación.  
  - Video demo de instalación y uso.  
  - Validación de la app por parte del equipo de HubSpot.  

---

## 6. Definición pendiente

No es que la API esté incompleta, sino que **falta definir el flow funcional esperado**:  
- ¿Qué entidades de HubSpot deben sincronizarse con Titanx (contactos, deals, tickets, objetos personalizados)?  
- ¿Cómo es la dirección de datos (solo lectura desde HubSpot, escritura hacia HubSpot, o bidireccional)?  
- ¿Con qué frecuencia y bajo qué reglas de negocio?  
- ¿Qué ocurre en caso de conflictos de datos?  

---

## 7. Preguntas críticas para Titanx

| Pregunta                                                                                                   | Por qué es crítica / qué afecta                                        | Qué información esperar                                         |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| **¿Cuáles endpoints usaré para scoring / enrich / sync (métodos, rutas, payloads, retorno)?**              | Sin eso no puedes construir el backend ni mapear datos.                | JSON de ejemplo request/response, errores, limits.              |
| **¿Qué datos (campos) puedo/quiero sincronizar entre Titanx ↔ HubSpot?**                                   | Necesario para definir propiedades HubSpot, mappings y permisos OAuth. | Lista de campos con tipos, obligatorios / opcionales, longitud. |
| **¿Qué eventos disparan notificaciones hacia ustedes (webhooks)?**                                         | Para saber cuándo recibir datos push en lugar de polling.              | URLs webhooks, eventos disponibles, payloads esperados.         |
| **¿Hay límites de uso / rate limits en su API?**                                                           | Para planear throttling / backoff / cola.                              | Límite por minuto / hora, headers de quota, reset.              |
| **¿Ambientes sandbox / test / producción separados?**                                                      | Para no romper en producción.                                          | Dominios, credenciales dummy, keys separadas.                   |
| **¿Qué lógica de negocio / reglas hay para scoring / enriquecimiento?**                                    | Para saber cómo expones esos datos en UI y backend.                    | Fórmulas, cuándo re-evaluar, cuándo invalidar.                  |
| **¿Qué identificador usan para relacionar entidades con HubSpot (por ejemplo: email, uuid, external_id)?** | Para hacer el match entre los datos de HubSpot y Titanx.               | Campo “titanx_id” o reglas de coincidencia.                     |
| **¿Qué frecuencia de sincronización se permite / espera?**                                                 | Para dimensionar procesos (batch, realtime).                           | Ej: cada 5 min, al tick de evento, lotes nocturnos, etc.        |
| **¿Qué comportamiento en caso de fallo / inconsistencia de datos?**                                        | Necesario para diseñar la tolerancia al error.                         | Retries, dead letter, logs, alertas.                            |

---

## 8. Estimación de tiempo de desarrollo

El proyecto completo se estima entre **5 y 6 meses**, distribuido en fases:

1. **Mes 1 – 2:**  
   - Diseño del flow de la app.  
   - Setup de backend en AWS con base de datos(MongoDB, PostgreSQL, MySQL).  
   - Implementación de OAuth multi-tenant.  
2. **Mes 3 – 4:**  
   - Desarrollo de endpoints backend.  
   - UI en HubSpot (Settings + paneles contextuales).  
   - Integración con Titanx.  
3. **Mes 5 – 6:**  
   - QA, pruebas de performance y seguridad.  
   - Preparación de documentación y video.  
   - Envío y aprobación en el Marketplace.  

---

## 9. Próximos pasos
1. Definir el **flujo funcional** de la app junto al equipo de producto.  
2. Confirmar **qué licencia mínima de HubSpot se exigirá** a los clientes.  
3. Montar backend inicial en AWS con dominio SSL.  
4. Desarrollar el **MVP de autenticación + almacenamiento de tokens**.  