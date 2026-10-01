# Privacidad y uso de datos de ONE

Esta sección reúne un resumen de privacidad y los documentos de términos de uso y privacidad descargables. Las funciones y los datos tratados dependen de la configuración de cada instalación.

## Resumen de privacidad

ONE puede tratar, si se habilitan las funciones correspondientes, datos de cuenta y permisos; información de cuidado, salud, medicación y check-ins; imágenes, vídeo, audio, clips e instantáneas; mapas interiores y distribución del hogar; observaciones y alertas; ubicación y zonas; y plantillas biométricas faciales cuando se active el registro de una persona.

Estos datos sirven para coordinar cuidados, gestionar recordatorios, consultar cámaras autorizadas, analizar fotogramas compatibles, generar alertas y preparar resúmenes para revisión humana. El asistente de IA solo recibe contexto limitado cuando se usa esa función; la documentación técnica excluye del asistente los fotogramas brutos y las plantillas faciales.

El acceso se limita a las personas autorizadas para el hogar según su función, al proveedor de ONE y a los proveedores técnicos que intervengan en las funciones activadas. No todas las personas de un hogar acceden a todos los datos. El vídeo puede pasar por el proveedor de streaming configurado y las consultas al asistente por el proveedor de IA seleccionado.

El endpoint de análisis procesa los fotogramas en memoria y declara que no los guarda. En la implementación documentada, ciertos clips tienen una expiración prevista de 7 días y algunos eventos e instantáneas de hasta 30 días; la eliminación física depende del proceso de retención y debe comprobarse en cada instalación, incluidas las copias. Los mapas y otros registros pueden conservarse hasta su sustitución o la eliminación del hogar si no se define otro plazo.

La aplicación incluye controles de consentimiento por finalidad, pausa y solicitudes de exportación o eliminación para los flujos compatibles. Las observaciones automáticas pueden equivocarse y requieren revisión humana. ONE no sustituye un diagnóstico, tratamiento, criterio profesional, llamada de emergencia ni supervisión humana.

Antes de tratar datos reales, la organización responsable debe identificar quién es, informar de finalidades, bases jurídicas, destinatarios, transferencias, conservación y derechos, y verificar seguridad, representación, contratos y evaluación de impacto cuando corresponda. Hasta que esos requisitos estén aprobados y documentados, los términos establecen el uso con datos sintéticos de prueba.

## Privacy summary

Depending on the features enabled, ONE may process account and permission data; care, health, medication and check-in information; images, video, audio, clips and snapshots; indoor maps and home layouts; observations and alerts; location and zones; and facial biometric templates if a person's profile is enrolled.

The data supports care coordination, reminders, authorised camera viewing, analysis of supported frames, alerts and summaries for human review. The AI assistant receives limited context only when that feature is used; the technical documentation excludes raw frames and facial templates from the assistant.

Access is limited to people authorised for the home according to their roles, the ONE provider and technical providers involved in enabled features. Not every household member can access every record. Video may pass through the configured streaming provider, and assistant requests through the selected AI provider.

The analysis endpoint processes frames in memory and states that it does not save them. In the documented implementation, certain clips are scheduled to expire after 7 days and some events and snapshots after up to 30 days; physical deletion depends on the retention process and must be checked for each deployment, including copies. Maps and other records may remain until replaced or the home is deleted if no other period is set.

The app provides purpose-based consent controls, pause, and export or deletion requests for supported flows. Automated observations can be wrong and require human review. ONE does not replace diagnosis, treatment, professional judgement, an emergency call or human supervision.

Before real data is processed, the controller must identify itself and document purposes, legal bases, recipients, transfers, retention and rights, and verify security, representation, contracts and a data protection impact assessment where required. Until those requirements are approved and documented, the terms limit use to synthetic test data.

## Documentos descargables / Downloadable documents

### Español

<a href={'/legal/' + 'terminos-de-uso-y-aviso-de-privacidad-one.docx'} download>
  Descargar Términos de uso y aviso de privacidad de ONE
</a>

### English

<a href={'/legal/' + 'one-terms-of-use-and-privacy-notice.docx'} download>
  Download ONE Terms of Use and Privacy Notice
</a>

## Documentación técnica

- [Privacidad por diseño](/security/privacy)
- [Operaciones de consentimiento y privacidad](/api/privacy)
