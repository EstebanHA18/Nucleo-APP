// Servicio de Impresión Térmica Bluetooth (Web Bluetooth API & ESC/POS)
import { Sale, TenantSettings } from "@/types";

export interface BluetoothPrinterState {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  error?: string | null;
}

// Servicios y características GATT conocidos para impresoras térmicas ESC/POS
const KNOWN_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Estándar POS
  "0000ffe0-0000-1000-8000-00805f9b34fb", // Módulos BLE serie comunes (HM-10, MPT, GOOJPRT)
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Impresoras portátiles chinas 58mm
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Microchip ISSC Transparent UART
];

const KNOWN_CHARACTERISTICS = [
  "00002af1-0000-1000-8000-00805f9b34fb",
  "0000ffe1-0000-1000-8000-00805f9b34fb",
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
  "49535343-8841-43f4-a8d4-ecbe34729bb3",
];

let cachedDevice: any = null;
let cachedServer: any = null;
let cachedCharacteristic: any = null;

// Verifica si el navegador soporta Web Bluetooth
export const isBluetoothSupported = (): boolean => {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
};

// Obtiene el estado actual de la impresora Bluetooth
export const getBluetoothPrinterState = (): BluetoothPrinterState => {
  const supported = isBluetoothSupported();
  const savedName = typeof window !== "undefined" ? localStorage.getItem("nucleo_bt_printer_name") : null;
  const isConnected = !!(cachedServer && cachedServer.connected && cachedCharacteristic);

  return {
    isSupported: supported,
    isConnected,
    deviceName: isConnected ? cachedDevice?.name || savedName : savedName,
  };
};

// Solicita y empareja una impresora Bluetooth mediante Web Bluetooth API
export const connectBluetoothPrinter = async (): Promise<{ success: boolean; deviceName?: string; error?: string }> => {
  if (!isBluetoothSupported()) {
    return {
      success: false,
      error: "Web Bluetooth no está soportado en este navegador. Utiliza Google Chrome, Microsoft Edge u Opera en Android/Windows.",
    };
  }

  try {
    // Solicitar dispositivo BLE
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        ...KNOWN_PRINTER_SERVICES,
        "generic_access",
        "0000180a-0000-1000-8000-00805f9b34fb", // Device Information
      ],
    });

    if (!device) {
      return { success: false, error: "No se seleccionó ningún dispositivo." };
    }

    const server = await device.gatt.connect();

    // Buscar el servicio de escritura disponible
    let targetCharacteristic: any = null;
    const services = await server.getPrimaryServices();

    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          targetCharacteristic = char;
          break;
        }
      }
      if (targetCharacteristic) break;
    }

    if (!targetCharacteristic) {
      return {
        success: false,
        error: "El dispositivo se conectó pero no expuso un canal de escritura ESC/POS compatible.",
      };
    }

    cachedDevice = device;
    cachedServer = server;
    cachedCharacteristic = targetCharacteristic;

    const deviceName = device.name || "Impresora Térmica Bluetooth";
    if (typeof window !== "undefined") {
      localStorage.setItem("nucleo_bt_printer_name", deviceName);
    }

    // Escuchar desconexión
    device.addEventListener("gattserverdisconnected", () => {
      cachedServer = null;
      cachedCharacteristic = null;
    });

    return { success: true, deviceName };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "No se pudo conectar a la impresora Bluetooth.",
    };
  }
};

// Desconectar impresora Bluetooth
export const disconnectBluetoothPrinter = async (): Promise<void> => {
  if (cachedDevice && cachedDevice.gatt && cachedDevice.gatt.connected) {
    cachedDevice.gatt.disconnect();
  }
  cachedDevice = null;
  cachedServer = null;
  cachedCharacteristic = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("nucleo_bt_printer_name");
  }
};

// Función para enviar datos binarios en paquetes pequeños (MTU-safe: 100 bytes)
const sendEscPosData = async (data: Uint8Array): Promise<void> => {
  if (!cachedCharacteristic) {
    throw new Error("Impresora Bluetooth no conectada");
  }

  const CHUNK_SIZE = 100;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    if (cachedCharacteristic.writeValueWithoutResponse) {
      await cachedCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await cachedCharacteristic.writeValue(chunk);
    }
    // Pequeño delay de 20ms para que el buffer del microcontrolador de la impresora procese
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

// Generador de secuencias ESC/POS en formato Uint8Array
class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02); // ESC a 2
    return this;
  }

  bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  doubleSize(enable: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00); // GS ! n
    return this;
  }

  doubleHeight(enable: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x01 : 0x00);
    return this;
  }

  text(str: string): this {
    // Limpieza de caracteres para compatibilidad de página de código CP437 / ASCII estándar
    const cleanStr = str
      .replace(/[áä]/g, "a")
      .replace(/[éë]/g, "e")
      .replace(/[íï]/g, "i")
      .replace(/[óö]/g, "o")
      .replace(/[úü]/g, "u")
      .replace(/[ÁÄ]/g, "A")
      .replace(/[ÉË]/g, "E")
      .replace(/[ÍÏ]/g, "I")
      .replace(/[ÓÖ]/g, "O")
      .replace(/[ÚÜ]/g, "U")
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N");

    for (let i = 0; i < cleanStr.length; i++) {
      this.buffer.push(cleanStr.charCodeAt(i) & 0xff);
    }
    return this;
  }

  newLine(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  row(left: string, right: string, width: number = 32): this {
    const leftClean = left.slice(0, width - right.length - 1);
    const spaces = Math.max(1, width - leftClean.length - right.length);
    const line = leftClean + " ".repeat(spaces) + right;
    return this.text(line).newLine();
  }

  divider(char: string = "-", width: number = 32): this {
    return this.text(char.repeat(width)).newLine();
  }

  feedAndCut(): this {
    this.newLine(4);
    this.buffer.push(0x1d, 0x56, 0x42, 0x00); // GS V B 0 (Corte completo)
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

// Imprime un ticket de prueba en la impresora térmica Bluetooth
export const printTestReceiptViaBluetooth = async (tenant: TenantSettings): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!cachedCharacteristic || !cachedServer?.connected) {
      // Intentar reconectar si se tiene soporte
      const conn = await connectBluetoothPrinter();
      if (!conn.success) {
        return { success: false, error: conn.error || "No se pudo conectar a la impresora." };
      }
    }

    const width = tenant.ticketFormat === "58mm" ? 32 : 42;
    const builder = new EscPosBuilder();

    builder
      .alignCenter()
      .doubleSize(true)
      .text(tenant.ticketHeader || tenant.name || "NUCLEO ERP")
      .newLine()
      .doubleSize(false)
      .text("*** TICKET DE PRUEBA ***")
      .newLine()
      .divider("=", width)
      .alignLeft()
      .row("Impresora:", "Termica Bluetooth", width)
      .row("Ancho:", tenant.ticketFormat || "80mm", width)
      .row("Fecha / Hora:", new Date().toLocaleTimeString("es-NI"), width)
      .row("RUC Empresa:", tenant.taxId || "J031000049102", width)
      .divider("-", width)
      .alignCenter()
      .text("CONEXION EXITOSA")
      .newLine()
      .text("Nucleo ERP Modular")
      .newLine()
      .feedAndCut();

    await sendEscPosData(builder.build());
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al enviar datos a la impresora." };
  }
};

// Imprime la factura de una venta completa por Bluetooth
export const printReceiptViaBluetooth = async (
  sale: Sale,
  tenant: TenantSettings
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!cachedCharacteristic || !cachedServer?.connected) {
      const conn = await connectBluetoothPrinter();
      if (!conn.success) {
        return { success: false, error: conn.error || "Impresora Bluetooth no conectada." };
      }
    }

    const width = tenant.ticketFormat === "58mm" ? 32 : 42;
    const builder = new EscPosBuilder();

    // Encabezado
    builder
      .alignCenter()
      .doubleSize(true)
      .bold(true)
      .text(tenant.ticketHeader || tenant.name || "NUCLEO")
      .newLine()
      .doubleSize(false)
      .bold(false);

    if (tenant.legalName) {
      builder.text(tenant.legalName).newLine();
    }
    if (tenant.invoiceSlogan) {
      builder.text(`"${tenant.invoiceSlogan}"`).newLine();
    }
    if (tenant.taxId) {
      builder.bold(true).text(`RUC: ${tenant.taxId}`).bold(false).newLine();
    }
    if (tenant.address) {
      builder.text(tenant.address).newLine();
    }
    if (tenant.phone) {
      builder.text(`Tel: ${tenant.phone}`).newLine();
    }

    builder.divider("-", width);

    // Datos del comprobante
    builder
      .alignLeft()
      .row("FACTURA:", sale.invoiceNumber, width)
      .row("FECHA:", new Date(sale.createdAt).toLocaleDateString("es-NI"), width)
      .row("HORA:", new Date(sale.createdAt).toLocaleTimeString("es-NI"), width);

    const clientName = sale.customerName || sale.customer?.name || "Cliente de Contado";
    builder.row("CLIENTE:", clientName.slice(0, 20), width);
    if (sale.customerTaxId) {
      builder.row("RUC/DNI:", sale.customerTaxId, width);
    }
    if (sale.cashierName) {
      builder.row("CAJERO:", sale.cashierName.slice(0, 20), width);
    }

    builder.divider("=", width);

    // Detalle de ítems
    sale.items.forEach((it) => {
      const lineTotal = `C$ ${it.subtotal.toFixed(2)}`;
      const prodName = `${it.quantity}x ${it.product.name}`;
      builder.row(prodName, lineTotal, width);

      if (it.selectedBatch) {
        builder.text(`  Lote: ${it.selectedBatch.batchNumber}`).newLine();
      }
    });

    builder.divider("-", width);

    // Totales
    if (tenant.showTaxBreakdown !== false) {
      const subtotalVal = (sale.total - sale.tax).toFixed(2);
      builder.row("Subtotal Gravado:", `C$ ${subtotalVal}`, width);
      builder.row("IVA (15%):", `C$ ${sale.tax.toFixed(2)}`, width);
    }

    builder
      .doubleSize(true)
      .bold(true)
      .row("TOTAL:", `C$ ${sale.total.toFixed(2)}`, width)
      .doubleSize(false)
      .bold(false);

    if (tenant.showUsdEquivalence !== false && tenant.exchangeRate) {
      const usdVal = (sale.total / tenant.exchangeRate).toFixed(2);
      builder.row("Equiv. Dolares:", `$ ${usdVal} USD`, width);
    }

    builder.divider("-", width);

    // Método de pago y vuelto
    const methodLabel =
      sale.paymentMethod === "cash"
        ? "Efectivo"
        : sale.paymentMethod === "card"
        ? "Tarjeta"
        : "Transferencia";
    builder.row("Forma de Pago:", methodLabel, width);

    if (sale.amountPaid && sale.amountPaid > 0) {
      builder.row("Monto Recibido:", `C$ ${sale.amountPaid.toFixed(2)}`, width);
    }
    if (sale.changeGiven && sale.changeGiven > 0) {
      builder.bold(true).row("VUELTO:", `C$ ${sale.changeGiven.toFixed(2)}`, width).bold(false);
    }

    builder.divider("-", width);

    // Pie de página
    builder.alignCenter();
    if (tenant.ticketFooter) {
      builder.text(tenant.ticketFooter).newLine();
    }
    builder
      .text("Emitido con Sistema NUCLEO ERP")
      .newLine()
      .feedAndCut();

    await sendEscPosData(builder.build());
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al imprimir en impresora Bluetooth." };
  }
};
