# SuniPlayer — Estado del Proyecto

## Resumen ejecutivo

SuniPlayer ya opera como un **monorepo con shared core real**:

- `packages/core` contiene tipos, stores y servicios compartidos
- `apps/web` es la superficie más madura y la principal referencia de UX
- `apps/native` existe y es una superficie activa, no una migración futura

La dirección actual no es “web vs native”, sino:

> un core compartido que reduce drift y dos superficies que convergen sobre ese core.

---

## Estado por superficie

| Superficie | Estado | Lectura correcta |
|-----------|--------|------------------|
| **Shared core** | Activo | Fuente canónica de tipos, stores y lógica compartida |
| **Web** | Maduro | Referencia principal de UI y validación funcional |
| **Native** | Activo | Superficie móvil real en hardening y paridad |

---

## Estado funcional por nivel

### MVP baseline

Esto forma parte del núcleo del producto y debe mantenerse estable:

- biblioteca musical
- player básico
- cola de reproducción
- timer de set
- builder por duración
- sugerencias por tiempo restante
- notas de performance
- persistencia local

### Post-MVP presente

Estas capacidades ya existen en el repo o forman parte del hardening actual, pero no deben confundirse con el baseline mínimo:

- analytics / métricas de uso
- pedal bindings
- waveform visual avanzada
- multi-set shows
- stage mirror
- importación de archivos locales
- storage específico por plataforma

### Experimental / no baseline

Estas capacidades son útiles, pero no deben venderse como parte del MVP protegido:

- pitch shift nativo si aún depende de stubs o integración incompleta
- SPL meter real
- recomendaciones avanzadas basadas en analítica
- detección de aplausos
- scoring / ML-like features

---

## Calidad y validación

La validación principal del repo se apoya en `pnpm` y en scripts por paquete:

- `validate:core`
- `validate:web`
- `validate:native`
- `validate`

Lectura correcta:

- el core se valida como core
- web y native se validan con sus propias capacidades
- no se debe asumir build nativo completo si el flujo documentado no lo declara

---

## Arquitectura vigente

- el modelo canónico vive en `packages/core`
- `setBuilderService` ya no debería entenderse como lógica duplicada por app
- los contratos compartidos deben residir en core y consumirse desde web/native
- la documentación debe evitar presentar native como “futuro bloqueado”; ya es una superficie activa

---

## Pendientes relevantes

- cerrar paridad de validación y flujo entre web y native
- seguir endureciendo la cobertura del core
- consolidar la persistencia por plataforma sin duplicar el modelo de dominio
- mantener alineados `MVP_SCOPE.md`, `DECISIONS.md`, `ARCHITECTURE.md` y este estado

