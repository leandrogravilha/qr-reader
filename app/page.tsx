"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";

type QRRow = Record<string, string>;

function Home() {
  const [rows, setRows] = useState<QRRow[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Parse QR Code into an object
  const parseQRCode = (text: string): QRRow => {
    return text.split("*").reduce<QRRow>((obj, item) => {
      const [key, ...value] = item.split(":");

      if (key) {
        obj[key] = value.join(":");
      }

      return obj;
    }, {});
  };

  const handleScan = (
    detectedCodes: Array<{ rawValue: string }>
  ): void => {
    if (!detectedCodes.length) return;

    const parsedRows = detectedCodes.map((code) =>
      parseQRCode(code.rawValue)
    );

    setRows((prevRows) => {
      const existing = new Set(
        prevRows.map((row) => JSON.stringify(row))
      );

      const newRows = parsedRows.filter(
        (row) => !existing.has(JSON.stringify(row))
      );

      if (newRows.length > 0) {
        const newHeaders = [
          ...new Set(
            newRows.flatMap((row) => Object.keys(row))
          ),
        ];

        setSelectedColumns((prev) => [
          ...new Set([...prev, ...newHeaders]),
        ]);
      }

      return [...prevRows, ...newRows];
    });
  };

  // Get all headers dynamically
  const headers: string[] =
    rows.length > 0
      ? [...new Set(rows.flatMap((row) => Object.keys(row)))]
      : [];

  // Delete a row
  const deleteRow = (index: number): void => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Export selected columns to TXT
  const exportTXT = (): void => {
    const content = rows
      .map((row) => {
        return Object.entries(row)
          .filter(([key]) => selectedColumns.includes(key))
          .map(([key, value]) => `${key}:${value}`)
          .join("*");
      })
      .join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcodes.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  // Toggle export column
  const toggleColumn = (column: string): void => {
    if (selectedColumns.includes(column)) {
      setSelectedColumns((prev) =>
        prev.filter((c) => c !== column)
      );
    } else {
      setSelectedColumns((prev) => [...prev, column]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col gap-6">
      {/* Scanner */}
      <div className="mx-auto w-full max-w-md rounded-lg overflow-hidden shadow-lg">
        <Scanner
          onScan={handleScan}
          onError={(error: unknown) => console.log(error)}
        />
      </div>

      {/* Export Settings */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-3">Export Columns</h2>

        {headers.length === 0 ? (
          <p className="text-gray-500">Scan a QR code first.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {headers.map((header) => (
                <label
                  key={header}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(header)}
                    onChange={() => toggleColumn(header)}
                  />
                  {header}
                </label>
              ))}
            </div>

            <button
              onClick={exportTXT}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded"
            >
              Export TXT
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">
          Scanned QR Codes ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <p className="text-gray-500">No QR codes scanned.</p>
        ) : (
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-200">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="border border-gray-300 px-3 py-2 text-left"
                  >
                    {header}
                  </th>
                ))}

                <th className="border border-gray-300 px-3 py-2 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="border border-gray-300 px-3 py-2"
                    >
                      {row[header] ?? ""}
                    </td>
                  ))}

                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      onClick={() => deleteRow(index)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Home;