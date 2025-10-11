import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Provider = {
  name: string;
  id: string;
  specialty: string;
  address: string;
};

export default function CardiologistSearch() {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProviders([]);
    if (!zip || zip.length < 5) {
      setError("Please enter a 5-digit ZIP code.");
      return;
    }
    setLoading(true);
    try {
      // --- OPTION A: call via supabase.functions.invoke ---
      const { data, error } = await supabase.functions.invoke("cardiologist-search", {
        body: { zipcode: zip },
      });

      if (error) {
        throw new Error(error.message || "Invocation failed");
      }

      // data is { providers: Provider[] }
      setProviders(data?.providers ?? []);
    } catch (err: any) {
      // --- OPTION B: plain fetch (uncomment to use) ---
      // const res = await fetch(import.meta.env.VITE_EDGE_FN_URL, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ zipcode: zip }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data?.error || "Request failed");
      // setProviders(data.providers ?? []);

      setError(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Find Cardiologists (NPI)</h1>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Enter ZIP code e.g. 23059"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && providers.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">NPI</th>
                <th className="text-left p-3">Specialty</th>
                <th className="text-left p-3">Address</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p, i) => (
                <tr key={p.id + i} className="border-t">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.id}</td>
                  <td className="p-3">{p.specialty}</td>
                  <td className="p-3">{p.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 text-xs text-gray-500">
            {providers.length} result{providers.length === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
