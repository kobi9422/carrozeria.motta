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

  // ===== HEADER AZIENDA =====
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(config.nomeAzienda, 20, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.indirizzo} | ${config.cap} ${config.citta}`, 20, 28);
  doc.text(`Tel: ${config.telefono} | Email: ${config.email}`, 20, 33);
  if (config.partitaIva) doc.text(`P.IVA: ${config.partitaIva}`, 20, 38);

  // Titolo Documento a destra
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PREVENTIVO', 150, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N. ${preventivo.numeroPreventivo}`, 150, 32);
  doc.text(`Data: ${new Date(preventivo.dataCreazione).toLocaleDateString('it-IT')}`, 150, 38);
  if (preventivo.dataScadenza) {
    doc.text(`Scadenza: ${new Date(preventivo.dataScadenza).toLocaleDateString('it-IT')}`, 150, 44);
  }

  // Reset colore testo
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  // ===== SEZIONE CLIENTE =====
  let yPos = 60;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${preventivo.cliente.nome} ${preventivo.cliente.cognome}`, 20, yPos);
  yPos += 5;
  if (preventivo.cliente.indirizzo) {
    doc.text(preventivo.cliente.indirizzo, 20, yPos);
    yPos += 5;
  }
  if (preventivo.cliente.citta) {
    doc.text(`${preventivo.cliente.cap || ''} ${preventivo.cliente.citta} ${preventivo.cliente.provincia ? '(' + preventivo.cliente.provincia + ')' : ''}`, 20, yPos);
    yPos += 5;
  }
  if (preventivo.cliente.telefono) {
    doc.text(`Tel: ${preventivo.cliente.telefono}`, 20, yPos);
    yPos += 5;
  }
  if (preventivo.cliente.email) {
    doc.text(`Email: ${preventivo.cliente.email}`, 20, yPos);
    yPos += 5;
  }
  if (preventivo.cliente.codiceFiscale) {
    doc.text(`CF: ${preventivo.cliente.codiceFiscale}`, 20, yPos);
    yPos += 5;
  }
  if (preventivo.cliente.partitaIva) {
    doc.text(`P.IVA: ${preventivo.cliente.partitaIva}`, 20, yPos);
    yPos += 5;
  }
  
  // ===== TITOLO E DESCRIZIONE =====
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(preventivo.titolo, 20, yPos);

  if (preventivo.descrizione) {
    yPos += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(preventivo.descrizione, 170);
    doc.text(descLines, 20, yPos);
    yPos += descLines.length * 4;
  }

  // ===== TABELLA VOCI =====
  yPos += 8;

  // Intestazione tabella con sfondo colorato
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, yPos - 5, 170, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrizione', 22, yPos);
  doc.text('Q.tà', 90, yPos);
  doc.text('Prezzo Unit.', 110, yPos);
  doc.text('Imponibile', 140, yPos);
  doc.text('IVA', 165, yPos);
  doc.text('Totale', 188, yPos, { align: 'right' });

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
      doc.rect(20, yPos - 4, 170, 6, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const descLines = doc.splitTextToSize(voce.descrizione, 65);
    doc.text(descLines, 22, yPos);
    doc.text(voce.quantita.toString(), 90, yPos);
    doc.text(`€ ${voce.prezzoUnitario.toFixed(2)}`, 110, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, 140, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, 165, yPos);
    doc.text(`€ ${voce.totale.toFixed(2)}`, 188, yPos, { align: 'right' });

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
  doc.line(20, yPos, 190, yPos);
  
  // ===== RIEPILOGO IVA =====
  yPos += 8;

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

  // Box riepilogo con bordo
  const boxStartY = yPos;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Mostra imponibile e IVA per ogni aliquota
  Object.keys(vociPerIva).sort((a, b) => Number(b) - Number(a)).forEach((aliquota) => {
    const { imponibile, iva } = vociPerIva[aliquota];
    totaleImponibile += imponibile;
    totaleIva += iva;

    doc.text(`Imponibile ${aliquota}%:`, 130, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, 188, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`IVA ${aliquota}%:`, 130, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, 188, yPos, { align: 'right' });
    yPos += 5;
  });

  // Linea separatrice
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(130, yPos, 190, yPos);

  // Totale finale con sfondo
  yPos += 6;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(130, yPos - 5, 60, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTALE:', 132, yPos);
  doc.text(`€ ${preventivo.importoTotale.toFixed(2)}`, 188, yPos, { align: 'right' });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  // ===== MODALITÀ PAGAMENTO =====
  yPos += 12;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, yPos - 5, 170, 1, 'F');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Modalità di Pagamento:', 20, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(config.condizioniPagamento, 20, yPos);
  if (config.iban) {
    yPos += 4;
    doc.text(`IBAN: ${config.iban}`, 20, yPos);
  }
  if (config.banca) {
    yPos += 4;
    doc.text(`Banca: ${config.banca}`, 20, yPos);
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

  // ===== HEADER AZIENDA =====
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(config.nomeAzienda, 20, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.indirizzo} | ${config.cap} ${config.citta}`, 20, 28);
  doc.text(`Tel: ${config.telefono} | Email: ${config.email}`, 20, 33);
  if (config.partitaIva) doc.text(`P.IVA: ${config.partitaIva}`, 20, 38);
  if (config.codiceFiscale) doc.text(`CF: ${config.codiceFiscale}`, 20, 43);

  // Titolo Documento a destra
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FATTURA', 150, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N. ${fattura.numeroFattura}`, 150, 32);
  doc.text(`Data Emissione: ${new Date(fattura.dataEmissione).toLocaleDateString('it-IT')}`, 150, 38);
  doc.text(`Scadenza: ${new Date(fattura.dataScadenza).toLocaleDateString('it-IT')}`, 150, 44);
  if (fattura.dataPagamento) {
    doc.text(`Pagata il: ${new Date(fattura.dataPagamento).toLocaleDateString('it-IT')}`, 150, 50);
  }

  // Reset colore testo
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  // ===== SEZIONE CLIENTE =====
  let yPos = 60;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 20, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fattura.cliente.nome} ${fattura.cliente.cognome}`, 20, yPos);
  yPos += 5;
  if (fattura.cliente.indirizzo) {
    doc.text(fattura.cliente.indirizzo, 20, yPos);
    yPos += 5;
  }
  if (fattura.cliente.citta) {
    doc.text(`${fattura.cliente.cap || ''} ${fattura.cliente.citta} ${fattura.cliente.provincia ? '(' + fattura.cliente.provincia + ')' : ''}`, 20, yPos);
    yPos += 5;
  }
  if (fattura.cliente.telefono) {
    doc.text(`Tel: ${fattura.cliente.telefono}`, 20, yPos);
    yPos += 5;
  }
  if (fattura.cliente.email) {
    doc.text(`Email: ${fattura.cliente.email}`, 20, yPos);
    yPos += 5;
  }
  if (fattura.cliente.codiceFiscale) {
    doc.text(`CF: ${fattura.cliente.codiceFiscale}`, 20, yPos);
    yPos += 5;
  }
  if (fattura.cliente.partitaIva) {
    doc.text(`P.IVA: ${fattura.cliente.partitaIva}`, 20, yPos);
    yPos += 5;
  }
  
  // ===== TABELLA VOCI =====
  yPos += 8;

  // Intestazione tabella con sfondo colorato
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(20, yPos - 5, 170, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrizione', 22, yPos);
  doc.text('Q.tà', 90, yPos);
  doc.text('Prezzo Unit.', 110, yPos);
  doc.text('Imponibile', 140, yPos);
  doc.text('IVA', 165, yPos);
  doc.text('Totale', 188, yPos, { align: 'right' });

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
      doc.rect(20, yPos - 4, 170, 6, 'F');
    }

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const descLines = doc.splitTextToSize(voce.descrizione, 65);
    doc.text(descLines, 22, yPos);
    doc.text(voce.quantita.toString(), 90, yPos);
    doc.text(`€ ${voce.prezzoUnitario.toFixed(2)}`, 110, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, 140, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, 165, yPos);
    doc.text(`€ ${voce.totale.toFixed(2)}`, 188, yPos, { align: 'right' });

    yPos += Math.max(descLines.length * 4, 6);
    rowCount++;

    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
      rowCount = 0;
    }
  });

  // Linea sotto tabella
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  
  // ===== RIEPILOGO IVA =====
  yPos += 8;

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

  // Box riepilogo con bordo
  const boxStartY = yPos;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Mostra imponibile e IVA per ogni aliquota
  Object.keys(vociPerIva).sort((a, b) => Number(b) - Number(a)).forEach((aliquota) => {
    const { imponibile, iva } = vociPerIva[aliquota];
    totaleImponibile += imponibile;
    totaleIva += iva;

    doc.text(`Imponibile ${aliquota}%:`, 130, yPos);
    doc.text(`€ ${imponibile.toFixed(2)}`, 188, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`IVA ${aliquota}%:`, 130, yPos);
    doc.text(`€ ${iva.toFixed(2)}`, 188, yPos, { align: 'right' });
    yPos += 5;
  });

  // Linea separatrice
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(130, yPos, 190, yPos);

  // Totale finale con sfondo
  yPos += 6;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(130, yPos - 5, 60, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTALE:', 132, yPos);
  doc.text(`€ ${fattura.importoTotale.toFixed(2)}`, 188, yPos, { align: 'right' });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  
  // ===== MODALITÀ PAGAMENTO =====
  yPos += 12;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, yPos - 5, 170, 1, 'F');

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Modalità di Pagamento:', 20, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(config.condizioniPagamento, 20, yPos);
  if (config.iban) {
    yPos += 4;
    doc.text(`IBAN: ${config.iban}`, 20, yPos);
  }
  if (config.banca) {
    yPos += 4;
    doc.text(`Banca: ${config.banca}`, 20, yPos);
  }

  // ===== NOTE LEGALI =====
  if (config.noteLegaliFattura) {
    yPos += 8;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(20, yPos - 5, 170, 1, 'F');

    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const noteLines = doc.splitTextToSize(config.noteLegaliFattura, 170);
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
    doc.text(`Fattura generata il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 20, 282);
    doc.text(`Pagina ${i} di ${pageCount}`, 105, 282, { align: 'center' });
  }

  // Salva PDF
  doc.save(`Fattura_${fattura.numeroFattura}.pdf`);
}

