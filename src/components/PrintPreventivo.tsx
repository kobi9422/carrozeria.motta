import React from 'react';

interface PrintPreventivoProps {
  preventivo: any;
}

export const PrintPreventivo: React.FC<PrintPreventivoProps> = ({ preventivo }) => {
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
      <div className="border-b-4 border-blue-600 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-blue-600">Carrozzeria Motta</h1>
            <p className="text-gray-600 mt-2">Via Roma 123, 00100 Roma</p>
            <p className="text-gray-600">Tel: 06 1234567 | Email: info@carrozzeriamotta.it</p>
            <p className="text-gray-600">P.IVA: 12345678901</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-900">PREVENTIVO</h2>
            <p className="text-xl font-semibold text-blue-600 mt-2">{preventivo.numeroPreventivo}</p>
            <p className="text-gray-600 mt-1">
              Data: {new Date(preventivo.dataCreazione).toLocaleDateString('it-IT')}
            </p>
            {preventivo.dataScadenza && (
              <p className="text-gray-600">
                Valido fino al: {new Date(preventivo.dataScadenza).toLocaleDateString('it-IT')}
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
            {preventivo.cliente.nome} {preventivo.cliente.cognome}
          </p>
          {preventivo.cliente.email && (
            <p className="text-gray-600">Email: {preventivo.cliente.email}</p>
          )}
          {preventivo.cliente.telefono && (
            <p className="text-gray-600">Tel: {preventivo.cliente.telefono}</p>
          )}
          {preventivo.cliente.indirizzo && (
            <p className="text-gray-600">{preventivo.cliente.indirizzo}</p>
          )}
        </div>
      </div>

      {/* Titolo e Descrizione */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{preventivo.titolo}</h3>
        {preventivo.descrizione && (
          <p className="text-gray-700">{preventivo.descrizione}</p>
        )}
      </div>

      {/* Tabella Voci */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="border border-blue-700 p-3 text-left">Descrizione</th>
            <th className="border border-blue-700 p-3 text-center w-24">Qtà</th>
            <th className="border border-blue-700 p-3 text-right w-32">Prezzo Unit.</th>
            <th className="border border-blue-700 p-3 text-right w-32">Totale</th>
          </tr>
        </thead>
        <tbody>
          {preventivo.voci.map((voce: any, index: number) => (
            <tr key={index} className="border-b">
              <td className="border border-gray-300 p-3">{voce.descrizione}</td>
              <td className="border border-gray-300 p-3 text-center">{voce.quantita}</td>
              <td className="border border-gray-300 p-3 text-right">€{voce.prezzoUnitario.toFixed(2)}</td>
              <td className="border border-gray-300 p-3 text-right font-semibold">€{voce.totale.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100">
            <td colSpan={3} className="border border-gray-300 p-3 text-right font-bold text-lg">
              TOTALE
            </td>
            <td className="border border-gray-300 p-3 text-right font-bold text-lg text-blue-600">
              €{preventivo.importoTotale.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Note */}
      {preventivo.note && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Note</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{preventivo.note}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-12">
        <p className="text-sm text-gray-600 text-center">
          Il presente preventivo ha validità di 30 giorni dalla data di emissione.
        </p>
        <p className="text-sm text-gray-600 text-center mt-2">
          Per accettazione, firmare e restituire copia del presente preventivo.
        </p>
        <div className="mt-8 flex justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-8">Data: _______________</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-8">Firma per accettazione</p>
            <div className="border-b border-gray-400 w-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

