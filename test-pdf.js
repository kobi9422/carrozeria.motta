const fs = require('fs');
const path = require('path');

// Importa jsPDF
const { jsPDF } = require('jspdf');

// Dati di test
const preventivo = {
  numeroPreventivo: 'PREV-2025-001',
  titolo: 'Riparazione carrozzeria',
  descrizione: 'Riparazione ammaccatura portiera anteriore destra',
  dataCreazione: '2025-10-15',
  dataScadenza: '2025-11-14',
  importoTotale: 850,
  note: 'Preventivo valido 15 giorni.',
  cliente: {
    nome: 'Marco',
    cognome: 'Bianchi',
    telefono: '+39 333 1234567',
    email: 'marco.bianchi@email.com',
    indirizzo: 'Via Garibaldi 45',
    citta: 'Milano',
    cap: '20121',
    provincia: 'MI',
    codiceFiscale: 'BNCMRC85M15F205K',
    partitaIva: null
  },
  voci: [
    {
      descrizione: 'Riparazione ammaccatura',
      quantita: 1,
      prezzoUnitario: 500,
      totale: 500,
      aliquotaIva: 22
    },
    {
      descrizione: 'Verniciatura portiera',
      quantita: 1,
      prezzoUnitario: 350,
      totale: 350,
      aliquotaIva: 22
    }
  ]
};

const impostazioni = {
  nomeAzienda: 'Motta Car & Go SRL',
  indirizzo: 'Via Papa Giovanni XXIII 76',
  citta: 'Barzanò',
  cap: '23891',
  provincia: 'LC',
  telefono: '+39 0392207666',
  email: 'ufficio.mottacar@gmail.com',
  partitaIva: 'IT04087480135',
  codiceFiscale: 'IT04087480135',
  iban: 'IT96F0503450920000000001532',
  banca: 'Banco BPM Filiale di Barzanò',
  condizioniPagamento: 'Pagamento Vista Fattura',
  noteLegaliFattura: ' '
};

// Genera PDF
const doc = new jsPDF();
const primaryColor = [41, 128, 185];
const lightGray = [245, 245, 245];
const darkGray = [80, 80, 80];

// Header
doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.rect(0, 0, 210, 50, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(22);
doc.setFont('helvetica', 'bold');
doc.text(impostazioni.nomeAzienda, 20, 18);

doc.setTextColor(255, 255, 255);
doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
doc.text(`${impostazioni.indirizzo} | ${impostazioni.cap} ${impostazioni.citta}`, 20, 28);
doc.text(`Tel: ${impostazioni.telefono} | Email: ${impostazioni.email}`, 20, 33);
if (impostazioni.partitaIva) doc.text(`P.IVA: ${impostazioni.partitaIva}`, 20, 38);

doc.setTextColor(255, 255, 255);
doc.setFontSize(18);
doc.setFont('helvetica', 'bold');
doc.text('PREVENTIVO', 150, 22);

doc.setTextColor(255, 255, 255);
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.text(`N. ${preventivo.numeroPreventivo}`, 150, 32);
doc.text(`Data: ${preventivo.dataCreazione}`, 150, 38);
if (preventivo.dataScadenza) {
  doc.text(`Scadenza: ${preventivo.dataScadenza}`, 150, 44);
}

doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

// Tabella
let yPos = 70;
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

preventivo.voci.forEach((voce, idx) => {
  const aliquota = voce.aliquotaIva || 22;
  const imponibile = voce.totale / (1 + aliquota / 100);
  const iva = voce.totale - imponibile;

  if (idx % 2 === 0) {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(20, yPos - 4, 170, 6, 'F');
  }

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  doc.text(voce.descrizione, 22, yPos);
  doc.text(voce.quantita.toString(), 90, yPos);
  doc.text(`€ ${voce.prezzoUnitario.toFixed(2)}`, 110, yPos);
  doc.text(`€ ${imponibile.toFixed(2)}`, 140, yPos);
  doc.text(`€ ${iva.toFixed(2)}`, 165, yPos);
  doc.text(`€ ${voce.totale.toFixed(2)}`, 188, yPos, { align: 'right' });

  yPos += 6;
});

// Salva
doc.save('test-preventivo.pdf');
console.log('✅ PDF generato: test-preventivo.pdf');

