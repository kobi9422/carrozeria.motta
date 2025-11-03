import jsPDF from 'jspdf';

interface Impostazioni {
  nomeAzienda: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  telefono: string;
  email: string;
  partitaIva: string;
  codiceFiscale: string;
  iban: string;
  banca: string;
  condizioniPagamento: string;
  noteLegaliFattura: string;
  firmaUrl?: string; // URL della firma digitale (base64)
}

interface Cliente {
  nome: string;
  cognome: string;
  telefono?: string;
  email?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  codiceFiscale?: string;
  partitaIva?: string;
}

interface VoceDocumento {
  descrizione: string;
  quantita: number;
  prezzoUnitario: number;
  totale: number;
  aliquotaIva?: number; // Percentuale IVA (0, 22, ecc.)
}

interface Preventivo {
  numeroPreventivo: string;
  dataCreazione: string;
  dataScadenza?: string;
  titolo: string;
  descrizione?: string;
  cliente: Cliente;
  voci: VoceDocumento[];
  importoTotale: number;
  note?: string;
}

interface Fattura {
  numeroFattura: string;
  dataEmissione: string;
  dataScadenza: string;
  dataPagamento?: string;
  cliente: Cliente;
  voci: VoceDocumento[];
  importoTotale: number;
  note?: string;
}

export async function generatePreventivoPDF(preventivo: Preventivo, impostazioni: Impostazioni | null) {
  // Valori di default se impostazioni è null
  const defaultImpostazioni: Impostazioni = {
    nomeAzienda: 'Carrozzeria Motta',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: '',
    email: '',
    partitaIva: '',
    codiceFiscale: '',
    iban: '',
    banca: '',
    condizioniPagamento: 'Pagamento a 30 giorni',
    noteLegaliFattura: '',
    firmaUrl: undefined
  };

  const config = impostazioni || defaultImpostazioni;

  const doc = new jsPDF();
  const primaryColor = [41, 128, 185]; // Blu professionale
  const lightGray = [245, 245, 245];
  const darkGray = [80, 80, 80];
  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);

  // ===== HEADER AZIENDA =====
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(config.nomeAzienda, margin, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.indirizzo} | ${config.cap} ${config.citta}`, margin, 26);
  doc.text(`Tel: ${config.telefono} | Email: ${config.email}`, margin, 31);
  if (config.partitaIva) doc.text(`P.IVA: ${config.partitaIva}`, margin, 36);

  // Titolo Documento a destra
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PREVENTIVO', pageWidth - margin - 40, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`N. ${preventivo.numeroPreventivo}`, pageWidth - margin - 40, 24);
  doc.text(`Data: ${new Date(preventivo.dataCreazione).toLocaleDateString('it-IT')}`, pageWidth - margin - 40, 30);
  if (preventivo.dataScadenza) {
    doc.text(`Scadenza: ${new Date(preventivo.dataScadenza).toLocaleDateString('it-IT')}`, pageWidth - margin - 40, 36);
  }

  // Reset colore testo
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  // ===== SEZIONE CLIENTE =====
  let yPos = 52;

  // Box cliente con bordo
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  const clienteStartY = yPos;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, yPos, contentWidth, 6, 'F');
  doc.text('CLIENTE', margin + 3, yPos + 4);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`${preventivo.cliente.nome} ${preventivo.cliente.cognome}`, margin + 3, yPos);
  yPos += 4;
  if (preventivo.cliente.indirizzo) {
    doc.text(preventivo.cliente.indirizzo, margin + 3, yPos);
    yPos += 4;
  }
  if (preventivo.cliente.citta) {
    doc.text(`${preventivo.cliente.cap || ''} ${preventivo.cliente.citta} ${preventivo.cliente.provincia ? '(' + preventivo.cliente.provincia + ')' : ''}`, margin + 3, yPos);
    yPos += 4;
  }
  if (preventivo.cliente.telefono) {
    doc.text(`Tel: ${preventivo.cliente.telefono}`, margin + 3, yPos);
    yPos += 4;
  }
  if (preventivo.cliente.email) {
    doc.text(`Email: ${preventivo.cliente.email}`, margin + 3, yPos);
    yPos += 4;
  }
  if (preventivo.cliente.codiceFiscale) {
    doc.text(`CF: ${preventivo.cliente.codiceFiscale}`, margin + 3, yPos);
    yPos += 4;
  }
  if (preventivo.cliente.partitaIva) {
    doc.text(`P.IVA: ${preventivo.cliente.partitaIva}`, margin + 3, yPos);
    yPos += 4;
  }

  // Disegna bordo cliente
  const clienteHeight = yPos - clienteStartY + 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, clienteStartY, contentWidth, clienteHeight);

  // ===== TITOLO E DESCRIZIONE =====
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(preventivo.titolo, margin, yPos);

  if (preventivo.descrizione) {
    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(preventivo.descrizione, contentWidth - 6);
    doc.text(descLines, margin + 3, yPos);
    yPos += descLines.length * 4;
  }

  // ===== TABELLA VOCI =====
  yPos += 8;

  // Intestazione tabella con sfondo colorato
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, yPos - 5, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  const col = {
    desc: margin + 2,
    qty: margin + 75,
    price: margin + 95,
    taxable: margin + 120,
    tax: margin + 150,
    total: margin + contentWidth - 10
  };

  doc.text('Descrizione', col.desc, yPos);
  doc.text('Q.tà', col.qty, yPos);
  doc.text('Prezzo Unit.', col.price, yPos);
  doc.text('Imponibile', col.taxable, yPos);
  doc.text('IVA', col.tax, yPos);
  doc.text('Totale', col.total, yPos, { align: 'right' });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  yPos += 8;

  let rowCount = 0;
  preventivo.voci.forEach((voce) => {
    // Calcola imponibile e IVA per questa voce
    const aliquota = voce.aliquotaIva || 22;
    const imponibile = voce.totale / (1 + aliquota / 100);
    const iva = voce.totale - imponibile;

    // Sfondo alternato per le righe
    if (rowCount % 2 === 0) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const descLines = doc.splitTextToSize(voce.descrizione, 70);
    doc.text(descLines, col.desc, yPos);
    doc.text(voce.quantita.toString(), col.qty, yPos);
    doc.text(`€ ${voce.prezzoUnitario.toFixed(2)}`, col.price, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, col.taxable, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, col.tax, yPos);
    doc.text(`€ ${voce.totale.toFixed(2)}`, col.total, yPos, { align: 'right' });

    yPos += Math.max(descLines.length * 4, 6);
    rowCount++;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
      rowCount = 0;
    }
  });

  // Linea sotto tabella
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + contentWidth, yPos);
  
  // ===== RIEPILOGO IVA =====
  yPos += 10;

  // Raggruppa voci per aliquota IVA
  const vociPerIva = preventivo.voci.reduce((acc: any, voce) => {
    const aliquota = voce.aliquotaIva || 22;
    if (!acc[aliquota]) {
      acc[aliquota] = { imponibile: 0, iva: 0 };
    }
    const imponibile = voce.totale / (1 + aliquota / 100);
    const iva = voce.totale - imponibile;
    acc[aliquota].imponibile += imponibile;
    acc[aliquota].iva += iva;
    return acc;
  }, {});

  let totaleImponibile = 0;
  let totaleIva = 0;

  // Box riepilogo IVA - larghezza intera
  const riepilogoX = margin;
  const riepilogoWidth = contentWidth;
  const labelCol = riepilogoX + 2;
  const valueCol = riepilogoX + riepilogoWidth - 30;

  // Header riepilogo
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(riepilogoX, yPos - 5, riepilogoWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RIEPILOGO IVA', labelCol, yPos - 1);

  yPos += 6;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Mostra imponibile e IVA per ogni aliquota
  Object.keys(vociPerIva).sort((a, b) => Number(b) - Number(a)).forEach((aliquota) => {
    const { imponibile, iva } = vociPerIva[aliquota];
    totaleImponibile += imponibile;
    totaleIva += iva;

    doc.text(`Imponibile ${aliquota}%:`, labelCol, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, valueCol, yPos, { align: 'right' });
    yPos += 4;
    doc.text(`IVA ${aliquota}%:`, labelCol, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, valueCol, yPos, { align: 'right' });
    yPos += 4;
  });

  // Linea separatrice
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(riepilogoX, yPos, riepilogoX + riepilogoWidth, yPos);

  // Totale finale con sfondo
  yPos += 6;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(riepilogoX, yPos - 4, riepilogoWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTALE:', labelCol, yPos);
  doc.text(`€ ${preventivo.importoTotale.toFixed(2)}`, valueCol, yPos, { align: 'right' });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  // ===== MODALITÀ PAGAMENTO =====
  yPos += 12;

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos - 5, margin + contentWidth, yPos - 5);

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Modalità di Pagamento:', margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(config.condizioniPagamento, margin, yPos);
  if (config.iban) {
    yPos += 4;
    doc.text(`IBAN: ${config.iban}`, margin, yPos);
  }
  if (config.banca) {
    yPos += 4;
    doc.text(`Banca: ${config.banca}`, margin, yPos);
  }

  // ===== NOTE =====
  if (preventivo.note) {
    yPos += 12;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(20, yPos - 5, 170, 1, 'F');

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Note:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(preventivo.note, 170);
    doc.text(noteLines, 20, yPos);
  }

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Firma digitale (se presente)
    if (config.firmaUrl) {
      try {
        doc.addImage(config.firmaUrl, 'PNG', 20, 265, 50, 15);
      } catch (error) {
        console.error('Errore nell\'aggiunta della firma:', error);
      }
    }

    // Linea separatrice footer
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 275, 190, 275);

    // Testo footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Preventivo generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 20, 282);
    doc.text(`Pagina ${i} di ${pageCount}`, 105, 282, { align: 'center' });
  }

  // Salva PDF
  doc.save(`Preventivo_${preventivo.numeroPreventivo}.pdf`);
}

export async function generateFatturaPDF(fattura: Fattura, impostazioni: Impostazioni | null) {
  // Valori di default se impostazioni è null
  const defaultImpostazioni: Impostazioni = {
    nomeAzienda: 'Carrozzeria Motta',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: '',
    email: '',
    partitaIva: '',
    codiceFiscale: '',
    iban: '',
    banca: '',
    condizioniPagamento: 'Pagamento a 30 giorni',
    noteLegaliFattura: '',
    firmaUrl: undefined
  };

  const config = impostazioni || defaultImpostazioni;

  const doc = new jsPDF();
  const primaryColor = [41, 128, 185]; // Blu professionale
  const lightGray = [245, 245, 245];
  const darkGray = [80, 80, 80];
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // ===== HEADER AZIENDA =====
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Sinistra: Dati azienda
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(config.nomeAzienda, margin, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  let headerY = 22;
  if (config.indirizzo) {
    doc.text(`${config.indirizzo}`, margin, headerY);
    headerY += 3.5;
  }
  if (config.cap || config.citta) {
    doc.text(`${config.cap} ${config.citta}${config.provincia ? ' (' + config.provincia + ')' : ''}`, margin, headerY);
    headerY += 3.5;
  }
  if (config.telefono) {
    doc.text(`Tel: ${config.telefono}`, margin, headerY);
    headerY += 3.5;
  }
  if (config.email) {
    doc.text(`Email: ${config.email}`, margin, headerY);
    headerY += 3.5;
  }
  if (config.partitaIva) {
    doc.text(`P.IVA: ${config.partitaIva}`, margin, headerY);
    headerY += 3.5;
  }
  if (config.codiceFiscale) {
    doc.text(`CF: ${config.codiceFiscale}`, margin, headerY);
  }

  // Destra: Numero e date fattura
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FATTURA', pageWidth - margin - 40, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let rightY = 23;
  doc.text(`N. ${fattura.numeroFattura}`, pageWidth - margin - 40, rightY);
  rightY += 5;
  doc.text(`Data: ${new Date(fattura.dataEmissione).toLocaleDateString('it-IT')}`, pageWidth - margin - 40, rightY);
  rightY += 5;
  doc.text(`Scadenza: ${new Date(fattura.dataScadenza).toLocaleDateString('it-IT')}`, pageWidth - margin - 40, rightY);
  rightY += 5;
  if (fattura.dataPagamento) {
    doc.text(`Pagata: ${new Date(fattura.dataPagamento).toLocaleDateString('it-IT')}`, pageWidth - margin - 40, rightY);
  }

  // Reset colore testo
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  // ===== SEZIONE CLIENTE =====
  let yPos = 62;
  const clienteStartY = yPos;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin + 3, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fattura.cliente.nome} ${fattura.cliente.cognome}`, margin + 3, yPos);
  yPos += 4;
  if (fattura.cliente.indirizzo) {
    doc.text(fattura.cliente.indirizzo, margin + 3, yPos);
    yPos += 4;
  }
  if (fattura.cliente.citta) {
    doc.text(`${fattura.cliente.cap || ''} ${fattura.cliente.citta} ${fattura.cliente.provincia ? '(' + fattura.cliente.provincia + ')' : ''}`, margin + 3, yPos);
    yPos += 4;
  }
  if (fattura.cliente.telefono) {
    doc.text(`Tel: ${fattura.cliente.telefono}`, margin + 3, yPos);
    yPos += 4;
  }
  if (fattura.cliente.email) {
    doc.text(`Email: ${fattura.cliente.email}`, margin + 3, yPos);
    yPos += 4;
  }
  if (fattura.cliente.codiceFiscale) {
    doc.text(`CF: ${fattura.cliente.codiceFiscale}`, margin + 3, yPos);
    yPos += 4;
  }
  if (fattura.cliente.partitaIva) {
    doc.text(`P.IVA: ${fattura.cliente.partitaIva}`, margin + 3, yPos);
    yPos += 4;
  }

  // Box cliente con bordo (disegnato dopo il testo per evitare sovrapposizioni)
  const clienteHeight = yPos - clienteStartY + 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, clienteStartY - 5, contentWidth / 2 - 2, clienteHeight);

  // ===== TABELLA VOCI =====
  yPos += 8;

  // Definisci le colonne con spazi adeguati
  const col = {
    desc: margin + 2,
    qty: margin + 75,
    price: margin + 95,
    taxable: margin + 120,
    tax: margin + 150,
    total: margin + contentWidth - 10
  };

  // Intestazione tabella con sfondo colorato
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, yPos - 5, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrizione', col.desc + 2, yPos);
  doc.text('Q.tà', col.qty, yPos);
  doc.text('Prezzo Unit.', col.price, yPos);
  doc.text('Imponibile', col.taxable, yPos);
  doc.text('IVA', col.tax, yPos);
  doc.text('Totale', col.total, yPos, { align: 'right' });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  yPos += 8;

  let rowCount = 0;
  fattura.voci.forEach((voce) => {
    // Calcola imponibile e IVA per questa voce
    const aliquota = voce.aliquotaIva || 22;
    const imponibile = voce.totale / (1 + aliquota / 100);
    const iva = voce.totale - imponibile;

    // Sfondo alternato per le righe
    if (rowCount % 2 === 0) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    // Descrizione con larghezza massima di 70px per evitare sovrapposizioni
    const descLines = doc.splitTextToSize(voce.descrizione, 70);
    doc.text(descLines, col.desc, yPos);
    doc.text(voce.quantita.toString(), col.qty, yPos);
    doc.text(`€ ${voce.prezzoUnitario.toFixed(2)}`, col.price, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, col.taxable, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, col.tax, yPos);
    doc.text(`€ ${voce.totale.toFixed(2)}`, col.total, yPos, { align: 'right' });

    yPos += Math.max(descLines.length * 4, 6);
    rowCount++;

    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
      rowCount = 0;
    }
  });

  // Linea sotto tabella
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, margin + contentWidth, yPos);
  
  // ===== RIEPILOGO IVA =====
  yPos += 10;

  // Raggruppa voci per aliquota IVA
  const vociPerIva = fattura.voci.reduce((acc: any, voce) => {
    const aliquota = voce.aliquotaIva || 22;
    if (!acc[aliquota]) {
      acc[aliquota] = { imponibile: 0, iva: 0 };
    }
    const imponibile = voce.totale / (1 + aliquota / 100);
    const iva = voce.totale - imponibile;
    acc[aliquota].imponibile += imponibile;
    acc[aliquota].iva += iva;
    return acc;
  }, {});

  let totaleImponibile = 0;
  let totaleIva = 0;

  // Box riepilogo con bordo - larghezza intera per evitare sovrapposizioni
  const riepilogoX = margin;
  const riepilogoWidth = contentWidth;
  const labelCol = riepilogoX + 2;
  const valueCol = riepilogoX + riepilogoWidth - 30; // Colonna per i valori con spazio adeguato

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(riepilogoX, yPos - 5, riepilogoWidth, 5);

  doc.setTextColor(255, 255, 255);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(riepilogoX, yPos - 5, riepilogoWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RIEPILOGO IVA', labelCol, yPos - 1);

  yPos += 5;
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Mostra imponibile e IVA per ogni aliquota
  Object.keys(vociPerIva).sort((a, b) => Number(b) - Number(a)).forEach((aliquota) => {
    const { imponibile, iva } = vociPerIva[aliquota];
    totaleImponibile += imponibile;
    totaleIva += iva;

    doc.text(`Imponibile ${aliquota}%:`, labelCol, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, valueCol, yPos, { align: 'right' });
    yPos += 4;
    doc.text(`IVA ${aliquota}%:`, labelCol, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, valueCol, yPos, { align: 'right' });
    yPos += 4;
  });

  // Linea separatrice
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(riepilogoX, yPos, riepilogoX + riepilogoWidth, yPos);

  // Totale finale con sfondo
  yPos += 6;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(riepilogoX, yPos - 4, riepilogoWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTALE:', labelCol, yPos);
  doc.text(`€ ${fattura.importoTotale.toFixed(2)}`, valueCol, yPos, { align: 'right' });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  
  // ===== MODALITÀ PAGAMENTO =====
  yPos += 12;

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos - 5, contentWidth, 1);

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Modalità di Pagamento:', margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(config.condizioniPagamento, margin, yPos);
  if (config.iban) {
    yPos += 4;
    doc.text(`IBAN: ${config.iban}`, margin, yPos);
  }
  if (config.banca) {
    yPos += 4;
    doc.text(`Banca: ${config.banca}`, margin, yPos);
  }

  // ===== NOTE LEGALI =====
  if (config.noteLegaliFattura) {
    yPos += 8;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos - 5, contentWidth, 1);

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const noteLines = doc.splitTextToSize(config.noteLegaliFattura, contentWidth - 4);
    doc.text(noteLines, margin + 2, yPos);
  }

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Firma digitale (se presente)
    if (config.firmaUrl) {
      try {
        doc.addImage(config.firmaUrl, 'PNG', 20, 265, 50, 15);
      } catch (error) {
        console.error('Errore nell\'aggiunta della firma:', error);
      }
    }

    // Linea separatrice footer
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 275, 190, 275);

    // Testo footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fattura generata il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 20, 282);
    doc.text(`Pagina ${i} di ${pageCount}`, 105, 282, { align: 'center' });
  }

  // Salva PDF
  doc.save(`Fattura_${fattura.numeroFattura}.pdf`);
}

