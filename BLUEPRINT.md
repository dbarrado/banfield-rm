# Plantel — Blueprint del sistema

**Versión:** 2.0 (producción — Banfield real / resto demo)
**Última actualización:** 2026-06-16
**Repositorio:** github.com/dbarrado/banfield-rm
**Demo en producción:** https://banfield-rm.vercel.app
**Cliente piloto:** Filial Banfield Ramos Mejía
**Estado:** ✅ EN PRODUCCIÓN. Banfield corre contra **Supabase** (datos + todos los módulos operativos persistentes, probados bajo RLS); el resto de los clubes sigue en modo demo. Handoff y setup en `ESTADO-ACTUAL.md`; estado de persistencia por módulo en `PRODUCCION.md`.

> **Mantener este documento vivo:** ante cualquier cambio, actualizar BLUEPRINT.md + ESTADO-ACTUAL.md + PRODUCCION.md (ver `CLAUDE.md`).

## 0. Modo por club (producción vs demo)

El sistema corre en **dos modos simultáneos**, decididos por club:
- **Club real (Banfield):** lee y escribe en Supabase (Auth + Postgres + RLS multi-tenant). Requiere login.
- **Clubes demo:** datos en memoria (`lib/demo-data.ts`), para mostrar el producto a prospectos sin tocar datos reales.

Piezas: `lib/real-clubs.ts` (`REAL_CLUBS`, `isRealClub`) · `components/layout/data-provider.tsx` (hidrata lectura real + exige sesión) · `lib/data/*-store.ts` (escritura real con write-through). Supabase: proyecto `banfield-plantel` (`zdoogaxfuwavdhopemjn`), club id `b1f1e1d0-0000-4000-8000-000000000001`.

---

## 1. Visión

Plantel es un SaaS multi-tenant para gestión integral de clubes deportivos amateurs y semi-profesionales. Arrancó como sistema operativo para Filial Banfield Ramos Mejía (450 chicos, fútbol formativo) y evolucionó a producto genérico aplicable a clubes de cualquier deporte (fútbol 11, baby fútbol 5/6, futsal, hockey, vóley, básquet, rugby 7/15, handball).

El sistema cubre el ciclo operativo completo del club: inscripción del socio, asistencia a prácticas, convocatoria a partidos, gestión del partido en cancha, control de cuotas y caja, comunicación con padres, tienda oficial y reportes para la dirigencia.

---

## 2. Arquitectura técnica

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, lucide-react |
| Backend | **Supabase (Postgres + Auth + RLS)** — productivo para clubes reales |
| Estado | Banfield: datos reales en Supabase (persistente). Clubes demo: localStorage + mock |
| Hosting | Vercel |
| Multi-tenant | club_id en cada tabla + RLS por club |
| QR | qrcode.react (generación local), html5-qrcode (escaneo) |
| Drag & drop | HTML5 nativo (desktop) + tap-to-swap (mobile) |
| Avatars | DiceBear (placeholder cuando no hay foto subida) |

**Build:** todas las rutas son estáticas (○) o dinámicas server-rendered (ƒ). No hay dependencias en runtime que rompan SSR.

**Modo demo:** el flag `DEMO_MODE = true` en `lib/demo-data.ts` desactiva auth de Supabase y carga ~450 jugadores generados con un PRNG seedeable (datos estables entre renders).

---

## 3. Modelo multi-tenant

Cada **Club** es un tenant. Datos clave en la tabla `clubs`:

```
id · name · slug · short_name · logo_url · primary_color · secondary_color
city · is_active · plan ('free' | 'club' | 'pro' | 'enterprise')
default_sport_code · total_socios · created_at
referral_code · first_payment_at · successful_referrals · has_shop_addon
```

El usuario puede pertenecer a varios clubes y rotar entre ellos con el **ClubSwitcher** del top-bar. Las brand colors del club se aplican como CSS variables (`--club-primary`, `--club-secondary`) y se reflejan en buttons, headers y carnet.

---

## 4. Roles

Cuatro roles activos. El menú lateral se filtra según rol + día de la semana (un profe ve "Partidos" como ítem primario los sábados, "Asistencia" los días de semana).

| Rol | Acceso |
| --- | --- |
| **admin** | Total. Configuración, finanzas, todo. |
| **profe** | Asistencia, convocatorias, fixture, partidos, ficha de socios. |
| **tesorero** | Cobros, caja, finanzas, reportes, cobranzas, socios. |
| **coordinador** | Deportivo + tesorería (pero no admin). Toma asistencia de profes. |

El usuario tiene un set de roles asignado y elige cuál tiene "activo" desde el switcher. En producción esto vive en `user_roles` (M2M con `users` y `clubs`).

**Club real (Banfield):** `lib/use-role.ts` lee los roles reales desde `user_clubs.roles` (Supabase, matcheando `user_id` del usuario logueado), con cache en memoria. Club demo: sigue simulado por `localStorage`. `lib/use-current-profe.ts` resuelve "quién soy yo como profe" matcheando el email de `auth.getUser()` contra `profes.email` (case-insensitive).

**Aislamiento de profe puro:** en `/asistencia`, `/convocatoria` y `/plan` (club real), si el rol activo es `profe` y el usuario NO tiene también `admin`/`coordinador` entre sus roles, el selector de "profe a cargo" se bloquea y se autoselecciona su propio id — solo ve/firma/carga sus propias tiras y categorías asignadas (`getAssignmentsForProfe`). Admin y coordinador no tienen restricción (selector libre, ven todo el club). `/asistencia-profes` queda pendiente de este mismo wiring (hoy usa roster demo en algunos casos, ver TODO en el archivo).

---

## 5. Catálogo de deportes

Diez formatos soportados. Cada uno define: cantidad de jugadores en cancha, si tiene arquero, ratio de la cancha, **layout de posiciones** y **tarjetas disciplinarias propias del deporte**.

```
football_11 · baby_5 · baby_6 · futsal · hockey_field
volleyball · basketball · rugby_7 · rugby_15 · handball_7
```

El **sport_format_code se asigna por categoría** (no por club), porque un mismo club puede tener fútbol 11 en las divisiones grandes y baby 5 en las chicas.

Tarjetas por deporte: amarilla/roja en fútbol, blanca/amarilla/roja en hockey, expulsión 2'/5'/match en rugby, etc.

---

## 6. Módulos funcionales

### 6.1 `/dashboard` — Inicio
KPIs principales del club: socios activos, asistencia del día, próximo partido, deuda total, caja del día. Cards adaptados al rol.

### 6.2 `/socios` — Listado de jugadores
- Búsqueda por nombre/DNI
- Filtros por tira, categoría, "ver solo deudores"
- Tarjeta compacta con foto (DiceBear o subida), nombre, tira, categoría, posición principal, dot de estado de cuota
- Botón WhatsApp directo en deudores
- `/socios/nuevo`: alta multi-hijo (un mismo tutor puede inscribir varios), foto con cámara (`capture="environment"`), posiciones con triple-tap

### 6.3 `/socios/[id]` — Ficha completa
- Foto editable con cámara
- Datos personales + tutor + contactos alternativos
- Posiciones (1 principal + hasta 3 secundarias)
- Estado de apto médico con vencimiento
- Sección **hermanos** con descuentos aplicados (50% al 2do, 75% al 3ro+)
- Consentimientos de imagen (Ley 26.061 Argentina): fotos grupales / videos / redes / clips
- Botón **Carnet** que abre `/carnet/[id]`
- Compliance flags

### 6.4 `/asistencia` — Asistencia a prácticas
- Sesión actual (live) y próxima detectadas del cronograma
- Multi-select de tiras + categorías sin filtro rígido por turno (los chicos pueden ir cuando quieran)
- Banner del slot del cronograma con botón "CARGAR ESTA SESIÓN"
- 4 estados por jugador: `unmarked` (default) · `present` · `late` · `absent_unjustified`
- **"Tarde" cuenta como presente para % de elegibilidad** pero queda registrado como `late`
- Al cerrar el día, los `unmarked` se convierten a `absent_unjustified` con confirmación
- "Visitantes" (de otra tira) y "no anotados" (sin ficha) sumables al toque
- KPIs en vivo: presentes / tarde / ausentes / sin marcar + barra de %
- Cierre con firma del profe + log de auditoría
- **Club real — navegación de día (`viewDate`)**: barra `‹ día — ›` arriba de los turnos, navega solo hacia atrás (no se agenda futuro). El cronograma del día (`daySlots`) y, para profe puro, el subconjunto donde está asignado (`mySlots`) se recalculan por `day_of_week` del `viewDate`.
- **Auto-selección de turno por día**: si `viewDate` es hoy, busca el slot activo ahora → si no hay, el próximo a empezar → si no hay, el último que ya pasó. Si `viewDate` es un día pasado, toma el primer slot del día (ordenado por hora). Profe puro ve solo su(s) turno(s) (`mySlots`); admin/coordinador ve todos los del día (`daySlots`).
- **Profe puro con varios turnos el mismo día**: el turno auto-seleccionado se muestra destacado; el resto queda colapsado detrás de "Ver tus otras clases de hoy (N)".
- **Edición de asistencia ya cerrada (sin duplicar)**: al cambiar de categoría/día se llama `loadAttendanceForDate(club.id, { categoryId, dateISO })` (`lib/data/attendance-store.ts`). Si ya existe un evento de práctica para esa categoría+día, precarga sus registros, fija `currentEventId` y deja la pantalla en `closed=true` (se reutiliza el botón "REABRIR" existente para editar). Al volver a cerrar, `persistAttendanceUpsert` reemplaza las attendances del mismo `eventId` en vez de crear un evento nuevo.
  - **Limitación conocida**: el match de `loadAttendanceForDate` es solo por categoría + día calendario (no por tira/turno). Si hubiera dos eventos de práctica el mismo día para la misma categoría (ej. dos turnos con distinta tira), trae el más reciente por `scheduled_at` — no hay forma de desambiguar hoy a nivel de `events`.

### 6.5 `/asistencia-profes` — Asistencia de profes
- Lo toma el coordinador
- Vista del cronograma del día con titular asignado por slot
- Estados: `present` · `late` · `replaced` · `absent`
- Si fue reemplazado, dropdown con suplentes designados + "Otro profe"
- KPIs por estado

### 6.6 `/convocatoria` — Convocatoria a partido
- Lista de jugadores eligibles según umbral (`min_practice_percentage` configurable)
- Override por convocatoria (queda en log de auditoría con motivo)
- Reusable de convocatoria previa
- WhatsApp pre-armado con la lista

### 6.7 `/fixture` y `/partidos`
- Calendario de partidos
- `/partidos/[id]`: detalle del partido con cancha visual y formación táctica
  - Selector de **formación** según deporte (4-4-2, 4-3-3, etc.)
  - **Cambios:** drag & drop (desktop) + **tap-to-swap** (mobile, banner amber sticky con cancelar)
  - Casos: titular↔titular, titular↔suplente, suplente↔titular, suplente↔suplente
  - **Llamada tardía**: agregar chico al banco con motivo (badge purple)
  - Tarjetas amarillas/rojas (o las del deporte) por jugador
  - Modal alterno: tap en suplente → "Subir" abre selector
- `/partidos/[id]/asistencia` y `/partidos/[id]/puntajes`

### 6.8 `/caja` — Caja diaria
- Saldo esperado calculado: apertura + ingresos - egresos
- KPIs: apertura / ingresos / egresos
- Botón verde grande **COBRAR CUOTA** (lleva a `/caja/cobrar`)
- Botón secundario "Otro movimiento (no cuota)" para gastos genéricos
- Lista de movimientos del día
- Cierre con conteo físico vs esperado, diferencia automática

### 6.9 `/caja/cobrar` — Flujo de cobro optimizado para fila
Pantalla dedicada con 4 pasos:

**Step 1 — Buscar:**
- Input autoFocus por nombre/apellido/DNI
- **Botón QR azul:** escanea el carnet del socio con cámara (html5-qrcode), parsea `PLANTEL|<player_id>|<dni>|...` e identifica automáticamente al jugador
- Toggle "Cobrar a toda la familia si tiene hermanos"
- Resultados con foto, categoría, deuda total
- Lista de "últimos cobros del día" cuando el buscador está vacío

**Step 2 — Cuotas:**
- Total grande arriba (al precio efectivo)
- Cuotas pendientes pre-tildadas con desglose (cuota base + recargo mora si aplica + descuento hermanos)
- **Override de monto editable por cuota** con atajos ½ y Total
- Si el monto cobrado < saldo, el billing queda en `partial` con saldo pendiente

**Step 3 — Pago:**
- 3 medios: 💵 Efectivo · 🏦 Transferencia · 📱 Mercado Pago (+10% configurable)
- Recargo MP **se reconoce solo al momento de cobrar con MP** como ingreso adicional, NO se aplica al billing
- Total muestra desglose: cuota base + recargo MP = total
- **Captura del comprobante con cámara o galería** (transferencia/MP)
- **OCR simulado** (1.5s, 85% match) extrae monto y N° de operación → autocompleta el campo
- Banner verde si valida, ámbar si el monto detectado no coincide
- Selector "¿Quién está pagando?": tutor titular / contacto alternativo guardado / **+ Otro contacto** (nombre, WhatsApp, relación) → queda en la ficha del socio para futuras veces

**Step 4 — Listo:**
- Confirmación con monto y método
- Botón verde "Enviar comprobante a [nombre]" → WhatsApp 1-a-1 con texto pre-armado (opcional, no automático)
- Botón "COBRAR AL SIGUIENTE →" reinicia con foco en buscador

### 6.10 `/cobranzas` — Gestión de cuotas emitidas
- **Botón verde grande COBRAR CUOTA** arriba de todo (linkea a `/caja/cobrar`)
- KPIs: pagados / pendientes / vencidos + montos
- 3 acciones: Generar cuotas (cron simulado) · Aplicar recargo · **Email a deudores** (no WhatsApp masivo — está prohibido por costo y bloqueo de cuenta manual)
- Filtros por estado y categoría
- Lista de billings con borde de color según estado

**Por billing:**
- Estado: paid / pending / overdue / overdue_with_fee / **condoned** / **partial**
- WhatsApp 1-a-1 (mensaje políticamente correcto que incluye nombre del club, jugador, deuda y fecha límite)
- **Ajustar importe** (admin/tesorero/coordinador) con motivo obligatorio (ej. "Asistió 15 días")
- **Condonar cuota** con causal (Vacaciones, Ausente todo el mes, Lesión, Beca, Acuerdo, Otro)
- Cada acción registra auditoría en `billing.adjustments[]` (type, amount, reason, by, by_role, at)

**Configuración inline (⚙️):**
- Día de vencimiento (default 10)
- Día de mora / overdue (default 16, configurable)
- % recargo por mora (default 10%)
- % recargo Mercado Pago (default 10%)

### 6.11 `/finanzas` — Movimientos consolidados
Vista del libro contable. Movimientos de caja agrupados por categoría, filtrables por mes.

### 6.12 `/reportes` (plan Pro)
- `/reportes/mensual`: dashboard del mes con comparativo
- `/reportes/estado-resultados`: P&L jerárquico mensual y YTD

### 6.13 `/tienda` y add-on Shop (USD 25/mes)
- Catálogo público
- Carrito + checkout
- `/tienda/admin`: gestión de productos
- `/tienda/admin/pedidos`: pedidos de socios

### 6.14 `/invitar` — Programa de referidos
Pantalla del cliente para compartir su código y ver:
- Referidos en estado: `registered` · `in_trial` · `successful` · `cancelled`
- Recompensas acumuladas (1 mes bonificado por cada referido exitoso, hitos en 5 → +3 meses, en 10 → +12 meses)
- Si el referido es Pro+Shop, el club referente sube automáticamente a Pro+Shop por un mes

### 6.15 `/config` — Panel admin
- Cronograma de prácticas semanal (multi-cancha, multi-profe titular + N suplentes ilimitados)
- Profes (gestión completa con compliance)
- Deportes y formatos
- Umbrales de elegibilidad (slider) con audit log
- Cuotas, categorías, causales de apercibimiento
- Categorías de caja (income/expense/both)
- Config de cobranza (vencimiento, mora, recargo MP)

### 6.16 `/carnet/[id]` — Carnet digital
- QR generado **localmente** con qrcode.react (sin dependencia externa)
- Foto del jugador, datos, tira, categoría, posición principal
- **Escudo del club** en header, watermark del fondo y centro del QR (corrección de errores H tolera el logo)
- Estado de acceso: verde "ACCESO HABILITADO" si paga + apto OK, rojo si no
- Validez explícita

### 6.17 `/padres` — Portal del socio
- Acceso directo al carnet de cada hijo en la **primera pantalla** (tarjetas grandes con color de tira)
- Lista de hijos con apto médico y estado
- Pantalla pública pensada para que el padre la abra en el celu en la puerta del club

---

## 7. Modelo de datos clave

### Player
```
id · full_name · dni · birth_date · category_id · tira · shift
photo_url · tutor_name · tutor_dni · tutor_email · tutor_whatsapp
alt_contacts: [{name, whatsapp, relation}]
primary_position · secondary_positions[]
apto_medico_ok · apto_medico_file_url · apto_medico_expires_at
is_active · convocation_count
```

### Profe (con compliance argentino)
```
id · full_name · dni · birth_date · photo_url
email · whatsapp · phone_alt · emergency_contact_*
start_date · title_certifications · matricula
antecedentes_penales_url + expires_at
antecedentes_sexuales_url + expires_at  ← ley protección menores
apto_psicofisico_url + expires_at
safeguarding_course_completed + date
payment_method · cbu_alias · hourly_rate · monthly_salary
```

### Billing (cuota emitida)
```
id · player_id · fee_type · period · due_date
amount_original · discount_pct · amount_final · late_fee_amount
status: paid | pending | overdue | overdue_with_fee | condoned | partial
amount_paid · paid_at · payment_method
adjustments: [{type: condone|amount_override|partial_payment, amount, reason, causal, by, by_role, at}]
```

### TrainingSlot (cronograma)
```
id · day_of_week · start_time · court · category_ids[] · tiras[]
profe_titular_id · profe_suplentes_ids[]  ← N ilimitado
is_active
```

### Otros
- **Event** (práctica/partido), **Attendance** (con justificación), **Convocation** + **ConvocationPlayer**
- **Observation** (highlight/warning/sanction) con causal
- **CashSession** + **CashMovement** + **FinanceCategory**
- **EligibilityConfig** + **EligibilityChangeLog** (audit)
- **ImageConsent** (4 tipos), **AvailabilityRSVP**

---

## 8. Reglas de negocio

### Descuentos por hermanos
- 1er hijo: 100% del valor
- 2do hijo: -50%
- 3ro+: -75%
- Configurable desde admin

### Cobranza
- Cuotas se generan el día 1 del mes (cron)
- Vencimiento día 10 (configurable)
- Mora desde día 16 (configurable) → +10% (configurable)
- Mercado Pago suma 10% al momento de cobrar (configurable, NO se carga al billing)

### Asistencia
- Default: `unmarked` (sin marcar)
- "Tarde" suma para % de elegibilidad pero queda registrado como `late`
- Al cerrar el día, `unmarked` → `absent_unjustified` con confirmación

### Elegibilidad
- Umbrales configurables (% prácticas + % partidos)
- Override puntual por convocatoria con motivo y log
- Solo admin puede cambiar el umbral general

### Permisos para ajustes financieros
- **admin / tesorero / coordinador** pueden condonar y ajustar importes
- Cada acción queda en `billing.adjustments[]` con actor, rol, motivo, causal y timestamp

---

## 9. Pricing

| Plan | Precio | Incluye |
| --- | --- | --- |
| **Free trial** | 7 días | Producto completo |
| **Plan Club** | USD 35/mes | Operacional simple: socios (1 deporte), asistencia (1 cancha), convocatorias, partidos, caja diaria, cobranzas con MP/transferencia/efectivo, OCR comprobantes, WhatsApp, referidos, flag de apto médico simple |
| **Plan Pro** | USD 60/mes | Todo Club + carnet digital QR + compliance de profes (antecedentes/apto psicofísico/safeguarding con archivos y vencimientos) + apto médico avanzado del socio + multi-cancha + multi-deporte + cronograma completo + asistencia de profes + reportes/P&L + audit logs + hash chain + multi-club |
| **Tienda add-on** | USD 25/mes | Catálogo + carrito + checkout + admin pedidos. Suma a cualquier plan. |

**Filosofía del packaging:** Plan Club es suficiente para no churnear, insuficiente para no querer crecer. El upgrade a Pro lo gatilla el éxito del Club (más chicos, más canchas, más profes, exigencia de compliance, necesidad de reportes).

**Promo Fase A (early adopters, hasta 30/6/2026):**
- 12 meses por el precio de 9 si firman compromiso anual (~USD 26/mes efectivo año 1)
- Price-lock 12 meses: no sube en marzo 2027
- Onboarding white-glove gratis (migración asistida)

**Programa de referidos:**
- Cada referido que pasa el trial → +1 mes bonificado al referente
- Si el referido contrata Pro+Tienda, el referente sube a Pro+Tienda ese mes
- Hito 5 referidos exitosos → +3 meses adicionales
- Hito 10 referidos exitosos → +12 meses adicionales

**Comparativa con competidores cono sur:**

| | Plan Club Plantel | Clupik ProLiga | TeamSnap club | Plan Pro Plantel |
| --- | --- | --- | --- | --- |
| USD/mes | 35 | ~40 | 80 | 60 |
| Carnet QR escaneable | ❌ | ❌ | ❌ | ✅ |
| Compliance argentino | ❌ | ❌ | ❌ | ✅ |
| Multi-deporte | ❌ | ✅ | ❌ | ✅ |
| Cobro fila mobile-first | ✅ | ❌ | ❌ | ✅ |
| Mercado Pago first-class | ✅ | ❌ | ❌ | ✅ |

---

## 10. Compliance y aspectos legales (Argentina)

- **Ley 25.326** (Protección de datos): consentimientos y derecho de acceso a los datos del menor
- **Ley 26.061** (Protección integral de niñas, niños y adolescentes): consentimientos de imagen explícitos y granulares (4 tipos: equipo / videos partido / redes / clips entrenamiento)
- **Protección de menores en deporte**: profes deben tener antecedentes penales + antecedentes de delitos contra integridad sexual + apto psicofísico vigentes + curso de safeguarding
- Cada compliance flag tiene fecha de vencimiento y status (`ok` / `expiring_soon` / `expired` / `missing`)

---

## 11. Integraciones y servicios externos

| Función | Estado | Servicio |
| --- | --- | --- |
| Auth | ✅ Productivo (club real) | Supabase Auth (email/password). Demo: login libre |
| DB + RLS | ✅ Productivo (club real) | Supabase Postgres, 37 tablas, RLS multi-tenant por club |
| Storage (fotos, comprobantes, aptos médicos) | 🔄 Pendiente | Supabase Storage (foto/apto aún no suben archivo) |
| Generación QR | ✅ Productivo | qrcode.react (cliente) |
| Escaneo QR | ✅ Productivo | html5-qrcode (cliente, cámara) |
| WhatsApp 1-a-1 | ✅ Productivo | Deep links `wa.me/<numero>?text=` |
| WhatsApp masivo | ❌ NO se usa | API oficial cobra por conversación; manual bloquea cuenta |
| Email a deudores | Stub demo | SMTP propio (planificado, gratis) |
| OCR de comprobantes | 🔄 Simulado | GPT-4 Vision o Google Vision (post-demo, ver POST-DEMO.md) |
| Pagos online | No incluido | Mercado Pago se gestiona por fuera; el sistema solo registra el cobro y aplica recargo |
| Avatars placeholder | ✅ Productivo | DiceBear |
| Hosting | ✅ Productivo | Vercel |

---

## 12. UX y diseño

- **Mobile-first** en módulos operativos (asistencia, cobro, cancha, carnet)
- **PC-primary** en módulos administrativos (cronograma, reportes, finanzas)
- Brand colors del club aplicadas dinámicamente vía CSS variables
- Familia tipográfica: Barlow para títulos, sans default para body
- Drag & drop natural en desktop + tap-to-swap en mobile (cancha de partido)
- Sticky bottom buttons (sobre la nav inferior en mobile)
- WhatsApp linking en cada contexto puntual donde aporta (deudor, comprobante, convocatoria)

---

## 13. Pendientes y simulaciones (post-demo)

Documentado en `POST-DEMO.md`. Lo más relevante:

1. **OCR real** de comprobantes — reemplazar `setTimeout` simulado por GPT-4 Vision (~USD 0.01/img) o Google Vision (~USD 0.0015/img)
2. **Auth real** con Supabase
3. **DB con RLS** multi-tenant
4. **Storage** para fotos de jugadores, comprobantes, aptos médicos, certificados de profes
5. **Cron real** que genere billings el día 1 y aplique recargo el día 16
6. **Email transaccional** (SMTP/Resend) para recordatorios masivos a deudores
7. **Wallet (Apple/Google)** del carnet — postergado a 3ra etapa

---

## 14. Roadmap operativo cercano

1. **Cámara para fotos de profes** (la sección `/config/profes` no tiene foto aún)
2. **Acciones sobre niños anotados/visitantes** en asistencia: mostrar últimos 3 + ver más, eliminar, convertir a socio (con form pre-cargado), fusionar socios duplicados
3. **Anulación de cobros y egresos** con contraasiento + auditoría (reverso contable, no borrado)
4. **Devolución parcial** desde un cobro registrado
5. **Notificaciones** (email/push) — cuando vence apto médico, cuando se acerca un partido, cuando hay cambio de cronograma

---

## 15. Estructura del repo

```
app/
├── (auth)/login
├── (dashboard)/
│   ├── dashboard
│   ├── socios + [id] + nuevo
│   ├── asistencia · asistencia-profes
│   ├── convocatoria · fixture
│   ├── partidos + [id] + [id]/asistencia + [id]/puntajes
│   ├── caja + caja/cobrar
│   ├── cobranzas
│   ├── finanzas
│   ├── reportes + mensual + estado-resultados
│   ├── tienda + admin + carrito + checkout/exito
│   ├── invitar
│   ├── deportes
│   └── config + cronograma + profes
├── carnet/[id]              ← público con QR
├── padres + [id]             ← portal del socio
└── r/[code]                  ← shortlinks (referidos)

lib/
├── billings.ts               ← config + generación + helpers
├── clubs.ts · use-current-club.ts
├── demo-data.ts              ← PRNG seedeable, ~450 jugadores
├── referrals.ts
├── shop.ts
├── sports.ts                 ← 10 formatos + posiciones + tarjetas
├── training-roster.ts · training-schedule.ts
├── use-role.ts               ← roles + getRoleNavItems(role, dayOfWeek)
└── avatars.ts                ← DiceBear

components/
├── layout/sidebar.tsx · top-bar.tsx
├── ui/ (shadcn)
└── qr-scanner.tsx

types/index.ts                ← single source of truth
```

---

## 16. Métricas de calidad actual

- Build: ✅ pasa (todas las rutas compilan)
- TypeScript: strict
- Lint: 0 errores
- Routes deployadas: 35+
- Tamaño del bundle: razonable (qrcode.react + html5-qrcode son las únicas deps grandes)

---

**Este documento es el contrato funcional del sistema.** Cualquier feature nueva se valida contra estas reglas; cualquier discrepancia con el comportamiento productivo es un bug a corregir o una actualización pendiente del blueprint.
