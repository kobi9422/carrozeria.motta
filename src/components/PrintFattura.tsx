import React from 'react';

interface PrintFatturaProps {
  fattura: any;
}

export const PrintFattura: React.FC<PrintFatturaProps> = ({ fattura }) => {
  return (
    <div className="print-container p-8 bg-white">
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>

      {/* Intestazione */}
      <div className="border-b-4 border-green-600 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-green-600">Carrozzeria Motta</h1>
            <p className="text-gray-600 mt-2">Via Roma 123, 00100 Roma</p>
            <p className="text-gray-600">Tel: 06 1234567 | Email: info@carrozzeriamotta.it</p>
            <p className="text-gray-600">P.IVA: 12345678901</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900">FATTURA</h2>
            <p className="text-xl font-semibold text-green-600 mt-2">{fattura.numeroFattura}</p>
            <p className="text-gray-600 mt-1">
              Data Emissione: {new Date(fattura.dataEmissione).toLocaleDateString('it-IT')}
            </p>
            <p className="text-gray-600">
              Data Scadenza: {new Date(fattura.dataScadenza).toLocaleDateString('it-IT')}
            </p>
            {fattura.dataPagamento && (
              <p className="text-green-600 font-semibold">
                Pagata il: {new Date(fattura.dataPagamento).toLocaleDateString('it-IT')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dati Cliente */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Spett.le Cliente</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold text-gray-900">
            {fattura.cliente.nome} {fattura.cliente.cognome}
          </p>
          {fattura.cliente.email && (
            <p className="text-gray-600">Email: {fattura.cliente.email}</p>
          )}
          {fattura.cliente.telefono && (
            <p className="text-gray-600">Tel: {fattura.cliente.telefono}</p>
          )}
          {fattura.cliente.indirizzo && (
            <p className="text-gray-600">{fattura.cliente.indirizzo}</p>
          )}
          {fattura.cliente.partitaIva && (
            <p className="text-gray-600">P.IVA: {fattura.cliente.partitaIva}</p>
          )}
          {fattura.cliente.codiceFiscale && (
            <p className="text-gray-600">C.F.: {fattura.cliente.codiceFiscale}</p>
          )}
        </div>
      </div>

      {/* Tabella Voci */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-green-600 text-white">
            <th className="border border-green-700 p-3 text-left">Descrizione</th>
            <th className="border border-green-700 p-3 text-center w-24">Qtà</th>
            <th className="border border-green-700 p-3 text-right w-32">Prezzo Unit.</th>
            <th className="border border-green-700 p-3 text-right w-32">Totale</th>
          </tr>
        </thead>
        <tbody>
          {fattura.voci.map((voce: any, index: number) => (
            <tr key={index} className="border-b">
              <td className="border border-gray-300 p-3">{voce.descrizione}</td>
              <td className="border border-gray-300 p-3 text-center">{voce.quantita}</td>
              <td className="border border-gray-300 p-3 text-right">€{voce.prezzoUnitario.toFixed(2)}</td>
              <td className="border border-gray-300 p-3 text-right font-semibold">€{voce.totale.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td colSpan={3} className="border border-gray-300 p-3 text-right font-semibold">
              Imponibile
            </td>
            <td className="border border-gray-300 p-3 text-right font-semibold">
              €{(fattura.importoTotale / 1.22).toFixed(2)}
            </td>
          </tr>
          <tr className="bg-gray-50">
            <td colSpan={3} className="border border-gray-300 p-3 text-right font-semibold">
              IVA 22%
            </td>
            <td className="border border-gray-300 p-3 text-right font-semibold">
              €{(fattura.importoTotale - fattura.importoTotale / 1.22).toFixed(2)}
            </td>
          </tr>
          <tr className="bg-green-100">
            <td colSpan={3} className="border border-gray-300 p-3 text-right font-bold text-lg">
              TOTALE
            </td>
            <td className="border border-gray-300 p-3 text-right font-bold text-lg text-green-600">
              €{fattura.importoTotale.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Note */}
      {fattura.note && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Note</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{fattura.note}</p>
        </div>
      )}

      {/* Modalità di Pagamento */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Modalità di Pagamento</h3>
        <p className="text-gray-700">Bonifico bancario</p>
        <p className="text-gray-700">IBAN: IT00 X000 0000 0000 0000 0000 000</p>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-12">
        <p className="text-sm text-gray-600 text-center">
          Fattura emessa ai sensi dell'art. 21 del D.P.R. 633/72 e successive modificazioni.
        </p>
        <p className="text-sm text-gray-600 text-center mt-2">
          Pagamento entro il {new Date(fattura.dataScadenza).toLocaleDateString('it-IT')}
        </p>
      </div>
    </div>
  );
};

