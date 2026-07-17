import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatCurrency, formatDate } from '../utils/formatters';
import { api } from '../services/api';
import type { ExportReport } from '../types';

const MONTH_OPTIONS = [1, 3, 6, 12] as const;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ReportsPage: React.FC = () => {
  const [months, setMonths] = useState(3);
  const [jsonData, setJsonData] = useState<ExportReport | null>(null);
  const [loadingJson, setLoadingJson] = useState(false);
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errorJson, setErrorJson] = useState('');
  const [errorCsv, setErrorCsv] = useState('');
  const [errorPdf, setErrorPdf] = useState('');

  const handleJson = async () => {
    setLoadingJson(true);
    setErrorJson('');
    try {
      const data = await api.getExportJson(months);
      setJsonData(data);
    } catch (e) {
      setErrorJson((e as Error).message);
    } finally {
      setLoadingJson(false);
    }
  };

  const handleCsv = async () => {
    setLoadingCsv(true);
    setErrorCsv('');
    try {
      const { blob, filename } = await api.downloadExport('csv', months);
      triggerDownload(blob, filename);
    } catch (e) {
      setErrorCsv((e as Error).message);
    } finally {
      setLoadingCsv(false);
    }
  };

  const handlePdf = async () => {
    setLoadingPdf(true);
    setErrorPdf('');
    try {
      const { blob, filename } = await api.downloadExport('pdf', months);
      triggerDownload(blob, filename);
    } catch (e) {
      setErrorPdf((e as Error).message);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800">Reportes</h1>

      <Card title="Exportar gastos">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Período a exportar</p>
            <div className="flex gap-2 flex-wrap">
              {MONTH_OPTIONS.map(m => (
                <button
                  key={m}
                  onClick={() => { setMonths(m); setJsonData(null); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    months === m
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m === 1 ? '1 mes' : `${m} meses`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <Button onClick={handleJson} loading={loadingJson} size="sm">
                Ver JSON
              </Button>
              {errorJson && <p className="text-xs text-red-500 mt-1">{errorJson}</p>}
            </div>
            <div>
              <Button onClick={handleCsv} loading={loadingCsv} variant="secondary" size="sm">
                Descargar CSV
              </Button>
              {errorCsv && <p className="text-xs text-red-500 mt-1">{errorCsv}</p>}
            </div>
            <div>
              <Button onClick={handlePdf} loading={loadingPdf} variant="secondary" size="sm">
                Descargar PDF
              </Button>
              {errorPdf && <p className="text-xs text-red-500 mt-1">{errorPdf}</p>}
            </div>
          </div>
        </div>
      </Card>

      {jsonData && (
        <Card title="Vista previa — JSON">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Período:</span>{' '}
                {formatDate(jsonData.period_from)} – {formatDate(jsonData.period_to)}
              </p>
              <p className="text-sm font-semibold text-gray-800">
                Total: {formatCurrency(jsonData.total)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                Resumen mensual
              </p>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {jsonData.monthly_summary.map(s => (
                  <div key={`${s.year}-${s.month}`} className="flex justify-between px-3 py-2 text-sm">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(s.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                Gastos ({jsonData.expenses.length})
              </p>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {jsonData.expenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="text-gray-400 w-20 flex-shrink-0 text-xs">{e.date}</span>
                    <span className="text-gray-500 w-24 flex-shrink-0 truncate">{e.category}</span>
                    <span className="text-gray-700 flex-1 truncate">{e.description}</span>
                    <span className="font-medium text-gray-800 flex-shrink-0">
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                triggerDownload(blob, 'expenses_export.json');
              }}
            >
              Descargar .json
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
