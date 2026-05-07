# Cambios post-aprobación de demo

Lista viva de funcionalidades que se entregan **simuladas** en la demo y que requieren reemplazo por el servicio real cuando la demo sea aprobada.

## OCR de comprobantes de pago

**Ubicación:** `app/(dashboard)/caja/cobrar/page.tsx` — función `handleReceiptUpload` y bloque de captura de comprobante en step "payment".

**Estado actual (demo):** al subir/sacar foto de un comprobante de transferencia o Mercado Pago, un `setTimeout` de 1.5s simula el procesamiento y devuelve un número de operación aleatorio + monto que coincide con el total el 85% de los casos (15% mismatch para mostrar el banner de alerta).

**Cambio requerido:**
1. Reemplazar el `setTimeout` por una llamada real a un servicio de OCR. Opciones:
   - **GPT-4 Vision** (OpenAI): excelente para comprobantes argentinos, extrae monto + ref + fecha + cuenta destino. ~USD 0.01 por imagen.
   - **Google Vision API** (DOCUMENT_TEXT_DETECTION): más barato (~USD 0.0015), requiere parseo regex propio.
   - **AWS Textract** (AnalyzeExpense): si ya hay infra AWS.
2. La función debe devolver `{ amount: number, reference: string, bank?: string, date?: string }`.
3. Validar que `amount === total` (mismo criterio que ya está) y registrar en `cash_movements.receipt_url` la imagen subida a Supabase Storage.
4. Considerar guardar el resultado del OCR en la fila del payment para auditoría futura (`ocr_raw_response: jsonb`).

**Por qué se simuló:** el OCR real implica integración con servicio externo + storage + costo por llamada. La demo prioriza validar UX y flujo de cobro antes de invertir en infra.

---

## (Sección abierta para más simulaciones que vayan apareciendo)
