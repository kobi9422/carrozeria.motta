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

export async function generatePreventivoPDF(preventivo: Preventivo, impostazioni: Impostazioni) {
  const doc = new jsPDF();
  
  // Intestazione Azienda
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(impostazioni.nomeAzienda, 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${impostazioni.indirizzo}`, 20, 28);
  doc.text(`${impostazioni.cap} ${impostazioni.citta} (${impostazioni.provincia})`, 20, 33);
  doc.text(`Tel: ${impostazioni.telefono}`, 20, 38);
  doc.text(`Email: ${impostazioni.email}`, 20, 43);
  if (impostazioni.partitaIva) doc.text(`P.IVA: ${impostazioni.partitaIva}`, 20, 48);
  
  // Titolo Documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PREVENTIVO', 150, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N. ${preventivo.numeroPreventivo}`, 150, 28);
  doc.text(`Data: ${new Date(preventivo.dataCreazione).toLocaleDateString('it-IT')}`, 150, 33);
  if (preventivo.dataScadenza) {
    doc.text(`Scadenza: ${new Date(preventivo.dataScadenza).toLocaleDateString('it-IT')}`, 150, 38);
  }
  
  // Dati Cliente
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 20, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${preventivo.cliente.nome} ${preventivo.cliente.cognome}`, 20, 72);
  if (preventivo.cliente.indirizzo) doc.text(preventivo.cliente.indirizzo, 20, 77);
  if (preventivo.cliente.citta) doc.text(`${preventivo.cliente.cap || ''} ${preventivo.cliente.citta} ${preventivo.cliente.provincia ? '(' + preventivo.cliente.provincia + ')' : ''}`, 20, 82);
  if (preventivo.cliente.telefono) doc.text(`Tel: ${preventivo.cliente.telefono}`, 20, 87);
  if (preventivo.cliente.email) doc.text(`Email: ${preventivo.cliente.email}`, 20, 92);
  if (preventivo.cliente.codiceFiscale) doc.text(`CF: ${preventivo.cliente.codiceFiscale}`, 20, 97);
  if (preventivo.cliente.partitaIva) doc.text(`P.IVA: ${preventivo.cliente.partitaIva}`, 20, 102);
  
  // Titolo e Descrizione
  let yPos = 115;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(preventivo.titolo, 20, yPos);
  
  if (preventivo.descrizione) {
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(preventivo.descrizione, 170);
    doc.text(descLines, 20, yPos);
    yPos += descLines.length * 5;
  }
  
  // Tabella Voci
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrizione', 20, yPos);
  doc.text('Q.tà', 120, yPos);
  doc.text('Prezzo Unit.', 140, yPos);
  doc.text('Totale', 175, yPos, { align: 'right' });
  
  yPos += 2;
  doc.line(20, yPos, 190, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  
  preventivo.voci.forEach((voce) => {
    const descLines = doc.splitTextToSize(voce.descrizione, 95);
    doc.text(descLines, 20, yPos);
    doc.text(voce.quantita.toString(), 120, yPos);
    doc.text(`€ ${voce.prezzoUnitario.toFixed(2)}`, 140, yPos);
    doc.text(`€ ${voce.totale.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += Math.max(descLines.length * 5, 7);
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  });
  
  // Totale
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTALE:', 140, yPos);
  doc.text(`€ ${preventivo.importoTotale.toFixed(2)}`, 190, yPos, { align: 'right' });
  
  // Note
  if (preventivo.note) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Note:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(preventivo.note, 170);
    doc.text(noteLines, 20, yPos);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Pagina ${i} di ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  // Salva PDF
  doc.save(`Preventivo_${preventivo.numeroPreventivo}.pdf`);
}

export async function generateFatturaPDF(fattura: Fattura, impostazioni: Impostazioni) {
  const doc = new jsPDF();
  
  // Intestazione Azienda
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(impostazioni.nomeAzienda, 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${impostazioni.indirizzo}`, 20, 28);
  doc.text(`${impostazioni.cap} ${impostazioni.citta} (${impostazioni.provincia})`, 20, 33);
  doc.text(`Tel: ${impostazioni.telefono}`, 20, 38);
  doc.text(`Email: ${impostazioni.email}`, 20, 43);
  if (impostazioni.partitaIva) doc.text(`P.IVA: ${impostazioni.partitaIva}`, 20, 48);
  if (impostazioni.codiceFiscale) doc.text(`CF: ${impostazioni.codiceFiscale}`, 20, 53);
  
  // Titolo Documento
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FATTURA', 150, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`N. ${fattura.numeroFattura}`, 150, 28);
  doc.text(`Data Emissione: ${new Date(fattura.dataEmissione).toLocaleDateString('it-IT')}`, 150, 33);
  doc.text(`Scadenza: ${new Date(fattura.dataScadenza).toLocaleDateString('it-IT')}`, 150, 38);
  if (fattura.dataPagamento) {
    doc.text(`Pagata il: ${new Date(fattura.dataPagamento).toLocaleDateString('it-IT')}`, 150, 43);
  }
  
  // Dati Cliente
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 20, 70);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fattura.cliente.nome} ${fattura.cliente.cognome}`, 20, 77);
  if (fattura.cliente.indirizzo) doc.text(fattura.cliente.indirizzo, 20, 82);
  if (fattura.cliente.citta) doc.text(`${fattura.cliente.cap || ''} ${fattura.cliente.citta} ${fattura.cliente.provincia ? '(' + fattura.cliente.provincia + ')' : ''}`, 20, 87);
  if (fattura.cliente.telefono) doc.text(`Tel: ${fattura.cliente.telefono}`, 20, 92);
  if (fattura.cliente.email) doc.text(`Email: ${fattura.cliente.email}`, 20, 97);
  if (fattura.cliente.codiceFiscale) doc.text(`CF: ${fattura.cliente.codiceFiscale}`, 20, 102);
  if (fattura.cliente.partitaIva) doc.text(`P.IVA: ${fattura.cliente.partitaIva}`, 20, 107);
  
  // Tabella Voci
  let yPos = 120;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrizione', 20, yPos);
  doc.text('Q.tà', 120, yPos);
  doc.text('Prezzo Unit.', 140, yPos);
  doc.text('Totale', 175, yPos, { align: 'right' });
  
  yPos += 2;
  doc.line(20, yPos, 190, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  
  fattura.voci.forEach((voce) => {
    const descLines = doc.splitTextToSize(voce.descrizione, 95);
    doc.text(descLines, 20, yPos);
    doc.text(voce.quantita.toString(), 120, yPos);
    doc.text(`€ ${voce.prezzoUnitario.toFixed(2)}`, 140, yPos);
    doc.text(`€ ${voce.totale.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += Math.max(descLines.length * 5, 7);
    
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
  });
  
  // Calcolo IVA
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  yPos += 7;
  
  const imponibile = fattura.importoTotale / 1.22;
  const iva = fattura.importoTotale - imponibile;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Imponibile:', 140, yPos);
  doc.text(`€ ${imponibile.toFixed(2)}`, 190, yPos, { align: 'right' });
  yPos += 6;
  doc.text('IVA 22%:', 140, yPos);
  doc.text(`€ ${iva.toFixed(2)}`, 190, yPos, { align: 'right' });
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTALE:', 140, yPos);
  doc.text(`€ ${fattura.importoTotale.toFixed(2)}`, 190, yPos, { align: 'right' });
  
  // Modalità Pagamento
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Modalità di Pagamento:', 20, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(impostazioni.condizioniPagamento, 20, yPos);
  if (impostazioni.iban) {
    yPos += 5;
    doc.text(`IBAN: ${impostazioni.iban}`, 20, yPos);
  }
  if (impostazioni.banca) {
    yPos += 5;
    doc.text(`Banca: ${impostazioni.banca}`, 20, yPos);
  }
  
  // Note Legali
  if (impostazioni.noteLegaliFattura) {
    yPos += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const noteLines = doc.splitTextToSize(impostazioni.noteLegaliFattura, 170);
    doc.text(noteLines, 20, yPos);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Pagina ${i} di ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  // Salva PDF
  doc.save(`Fattura_${fattura.numeroFattura}.pdf`);
}

