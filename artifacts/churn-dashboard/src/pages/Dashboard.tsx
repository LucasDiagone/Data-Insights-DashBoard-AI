import { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import { CSVLink } from "react-csv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw, Sun, Moon, Download, Printer, Filter, X, BarChart3
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const CSV_URL = "https://docs.google.com/spreadsheets/d/1W9_d6wi9x7CB5z0Rx0km7LmiOvfW_laW2ywFSAy2QRU/export?format=csv";

const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

const DATA_SOURCES = ["Google Sheets CSV"];

interface CustomerData {
  id_cliente: string;
  genero: string;
  idoso: number;
  possui_parceiro: string;
  dependentes: string;
  tempo_cliente_meses: number;
  tipo_contrato: string;
  metodo_pagamento: string;
  valor_mensal: number;
  valor_total: number;
  churn: string;
  isChurn: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPercent(value: number) {
  return value.toFixed(1) + "%";
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        padding: "10px 14px",
        border: "1px solid #e0e0e0",
        color: "#1a1a1a",
        fontSize: "13px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
        {payload.length === 1 && payload[0].color && payload[0].color !== "#ffffff" && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: payload[0].color, flexShrink: 0 }} />
        )}
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          {payload.length > 1 && entry.color && entry.color !== "#ffffff" && (
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          )}
          <span style={{ color: "#444" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString("pt-BR") + (entry.name.includes("Taxa") || entry.name.includes("%") ? "%" : "") : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px", marginTop: "10px" }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  // CSV values -> Portuguese labels mapping
  const CONTRACT_MAP: Record<string, string> = {
    "Month-to-month": "Mensal",
    "One year": "Um ano",
    "Two year": "Dois anos",
  };
  const PAYMENT_MAP: Record<string, string> = {
    "Electronic check": "Cheque eletrônico",
    "Mailed check": "Boleto",
    "Bank transfer (automatic)": "Débito automático",
    "Credit card (automatic)": "Cartão de crédito",
  };
  const GENDER_MAP: Record<string, string> = {
    "Female": "Feminino",
    "Male": "Masculino",
  };

  // Filters state — using Portuguese labels for display
  const [filterContrato, setFilterContrato] = useState<string[]>(["Mensal", "Um ano", "Dois anos"]);
  const [filterTempo, setFilterTempo] = useState<number[]>([0, 72]);
  const [filterPagamento, setFilterPagamento] = useState<string[]>(["Boleto", "Cartão de crédito", "Débito automático", "Cheque eletrônico"]);
  const [filterChurn, setFilterChurn] = useState<string>("Todos");
  const [filterGenero, setFilterGenero] = useState<string[]>(["Masculino", "Feminino"]);

  const fetchData = () => {
    setLoading(true);
    setIsSpinning(true);
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = (results.data as any[])
          .filter((row: any) => row.id_cliente && (row.Churn || row.churn))
          .map((row: any) => {
            const churnRaw = row.Churn || row.churn || "";
            let valorMensal = 0;
            let valorTotal = 0;
            let tempoMeses = 0;
            
            try {
              if (row.valor_mensal) {
                valorMensal = parseFloat(String(row.valor_mensal).replace(",", "."));
              }
              if (row.valor_total) {
                valorTotal = parseFloat(String(row.valor_total).replace(",", "."));
                if (isNaN(valorTotal)) valorTotal = 0;
              }
              if (row.tempo_cliente_meses) {
                tempoMeses = parseInt(row.tempo_cliente_meses, 10);
              }
            } catch (e) {
              console.error("Error parsing number", e, row);
            }

            return {
              id_cliente: row.id_cliente,
              genero: GENDER_MAP[row.genero] ?? row.genero,
              idoso: parseInt(row.idoso, 10) || 0,
              possui_parceiro: row.possui_parceiro,
              dependentes: row.dependentes,
              tempo_cliente_meses: isNaN(tempoMeses) ? 0 : tempoMeses,
              tipo_contrato: CONTRACT_MAP[row.tipo_contrato] ?? row.tipo_contrato,
              metodo_pagamento: PAYMENT_MAP[row.metodo_pagamento] ?? row.metodo_pagamento,
              valor_mensal: isNaN(valorMensal) ? 0 : valorMensal,
              valor_total: isNaN(valorTotal) ? 0 : valorTotal,
              churn: churnRaw === "Yes" ? "Sim" : churnRaw === "No" ? "Não" : churnRaw,
              isChurn: churnRaw === "Yes" || churnRaw === "Sim",
            };
          });
        
        setData(parsedData);
        setLoading(false);
        const now = new Date();
        setLastRefreshed(
          `${now.toLocaleTimeString("pt-BR", { hour: "numeric", minute: "2-digit" }).toLowerCase()} on ${now.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })}`
        );
        setTimeout(() => setIsSpinning(false), 600);
      },
      error: (error) => {
        console.error("Error fetching CSV:", error);
        setLoading(false);
        setIsSpinning(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchContrato = filterContrato.includes(d.tipo_contrato);
      const matchTempo = d.tempo_cliente_meses >= filterTempo[0] && d.tempo_cliente_meses <= filterTempo[1];
      const matchPagamento = filterPagamento.includes(d.metodo_pagamento);
      const matchChurn = filterChurn === "Todos" || d.churn === filterChurn;
      const matchGenero = filterGenero.includes(d.genero);
      
      return matchContrato && matchTempo && matchPagamento && matchChurn && matchGenero;
    });
  }, [data, filterContrato, filterTempo, filterPagamento, filterChurn, filterGenero]);

  // KPIs
  const totalClientes = filteredData.length;
  const churnCount = filteredData.filter(d => d.isChurn).length;
  const taxaChurn = totalClientes > 0 ? (churnCount / totalClientes) * 100 : 0;
  const receitaTotal = filteredData.reduce((sum, d) => sum + d.valor_total, 0);
  const receitaMedia = totalClientes > 0 ? receitaTotal / totalClientes : 0;
  const receitaPerdida = filteredData.filter(d => d.isChurn).reduce((sum, d) => sum + d.valor_mensal, 0);

  // Charts Data
  // 1. Churn por Tipo de Contrato
  const chart1Data = useMemo(() => {
    const grouped = filteredData.reduce((acc, d) => {
      if (!acc[d.tipo_contrato]) acc[d.tipo_contrato] = { name: d.tipo_contrato, "Churn Sim": 0, "Churn Não": 0 };
      if (d.isChurn) acc[d.tipo_contrato]["Churn Sim"]++;
      else acc[d.tipo_contrato]["Churn Não"]++;
      return acc;
    }, {} as Record<string, any>);
    return Object.values(grouped);
  }, [filteredData]);

  // 2. Taxa de Churn por Faixa de Tempo
  const chart2Data = useMemo(() => {
    const bands = [
      { name: "0-12m", min: 0, max: 12 },
      { name: "13-24m", min: 13, max: 24 },
      { name: "25-48m", min: 25, max: 48 },
      { name: "49-72m", min: 49, max: 72 },
    ];
    
    return bands.map(band => {
      const customersInBand = filteredData.filter(d => d.tempo_cliente_meses >= band.min && d.tempo_cliente_meses <= band.max);
      const churnInBand = customersInBand.filter(d => d.isChurn).length;
      const rate = customersInBand.length > 0 ? (churnInBand / customersInBand.length) * 100 : 0;
      return { name: band.name, "Taxa de Churn (%)": parseFloat(rate.toFixed(1)) };
    });
  }, [filteredData]);

  // 3. Distribuição de Valor Mensal
  const chart3Data = useMemo(() => {
    const ranges = [
      { name: "R$0-30", min: 0, max: 30 },
      { name: "R$30-60", min: 30, max: 60 },
      { name: "R$60-90", min: 60, max: 90 },
      { name: "R$90+", min: 90, max: 999999 },
    ];

    return ranges.map(range => {
      const customersInRange = filteredData.filter(d => d.valor_mensal >= range.min && (range.max === 999999 ? true : d.valor_mensal < range.max));
      const churnSim = customersInRange.filter(d => d.isChurn).length;
      const churnNao = customersInRange.length - churnSim;
      return { name: range.name, "Churn Sim": churnSim, "Churn Não": churnNao };
    });
  }, [filteredData]);

  // 4. Churn por Método de Pagamento
  const chart4Data = useMemo(() => {
    const grouped = filteredData.reduce((acc, d) => {
      if (!acc[d.metodo_pagamento]) acc[d.metodo_pagamento] = { total: 0, churn: 0 };
      acc[d.metodo_pagamento].total++;
      if (d.isChurn) acc[d.metodo_pagamento].churn++;
      return acc;
    }, {} as Record<string, {total: number, churn: number}>);
    
    return Object.entries(grouped)
      .map(([name, stats]) => ({
        name,
        "Taxa de Churn (%)": parseFloat((stats.total > 0 ? (stats.churn / stats.total) * 100 : 0).toFixed(1))
      }))
      .sort((a, b) => b["Taxa de Churn (%)"] - a["Taxa de Churn (%)"]);
  }, [filteredData]);

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const FilterPanelContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Status de Churn</h3>
        <RadioGroup value={filterChurn} onValueChange={setFilterChurn} className="flex flex-col space-y-2">
          {["Todos", "Sim", "Não"].map(opt => (
            <div key={opt} className="flex items-center space-x-2">
              <RadioGroupItem value={opt} id={`churn-${opt}`} />
              <Label htmlFor={`churn-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Tipo de Contrato</h3>
        <div className="space-y-2">
          {["Mensal", "Um ano", "Dois anos"].map(opt => (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox 
                id={`contrato-${opt}`} 
                checked={filterContrato.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) setFilterContrato(prev => [...prev, opt]);
                  else setFilterContrato(prev => prev.filter(p => p !== opt));
                }}
              />
              <Label htmlFor={`contrato-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3 flex justify-between">
          <span>Faixa de Tempo (meses)</span>
          <span className="text-muted-foreground">{filterTempo[0]} - {filterTempo[1]}</span>
        </h3>
        <Slider 
          min={0} 
          max={72} 
          step={1} 
          value={filterTempo} 
          onValueChange={setFilterTempo} 
          className="my-4"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Método de Pagamento</h3>
        <div className="space-y-2">
          {["Boleto", "Cartão de crédito", "Débito automático", "Cheque eletrônico"].map(opt => (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox 
                id={`pagamento-${opt}`} 
                checked={filterPagamento.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) setFilterPagamento(prev => [...prev, opt]);
                  else setFilterPagamento(prev => prev.filter(p => p !== opt));
                }}
              />
              <Label htmlFor={`pagamento-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Gênero</h3>
        <div className="space-y-2">
          {["Masculino", "Feminino"].map(opt => (
            <div key={opt} className="flex items-center space-x-2">
              <Checkbox 
                id={`genero-${opt}`} 
                checked={filterGenero.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) setFilterGenero(prev => [...prev, opt]);
                  else setFilterGenero(prev => prev.filter(p => p !== opt));
                }}
              />
              <Label htmlFor={`genero-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full mt-4" 
        onClick={() => {
          setFilterContrato(["Mensal", "Um ano", "Dois anos"]);
          setFilterTempo([0, 72]);
          setFilterPagamento(["Boleto", "Cartão de crédito", "Débito automático", "Cheque eletrônico"]);
          setFilterChurn("Todos");
          setFilterGenero(["Masculino", "Feminino"]);
        }}
      >
        Limpar Filtros
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r bg-card/50">
        <div className="p-6 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </h2>
        </div>
        <ScrollArea className="flex-1 p-6">
          <FilterPanelContent />
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-5 lg:p-8 flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
              <div className="pt-2">
                <div className="flex items-center gap-3">
                  {/* Mobile Sidebar Toggle */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                          <Filter className="w-5 h-5" /> Filtros
                        </SheetTitle>
                      </SheetHeader>
                      <FilterPanelContent />
                    </SheetContent>
                  </Sheet>
                  <h1 className="font-bold text-[28px] md:text-[32px]">Dashboard de Churn de Clientes</h1>
                </div>
                <p className="text-muted-foreground mt-1.5 text-[14px]">Análise de cancelamentos e retenção de clientes</p>
                {DATA_SOURCES.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
                    {DATA_SOURCES.map((source) => (
                      <span
                        key={source}
                        className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                        title={source}
                        style={{
                          maxWidth: "20ch",
                          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)",
                          color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
                        }}
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                )}
                {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
              </div>

              <div className="flex items-center gap-3 pt-2 print:hidden ml-auto">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 h-[26px] rounded-[6px] text-[12px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                  Atualizar
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsDark((d) => !d)}
                  className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-8 w-3/4" /></CardContent></Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
                  ))}
                </div>
              </div>
            ) : filteredData.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-16 text-center border rounded-xl bg-card">
                 <div className="rounded-full bg-muted p-6 mb-4">
                   <BarChart3 className="w-12 h-12 text-muted-foreground" />
                 </div>
                 <h2 className="text-xl font-semibold mb-2">Nenhum dado encontrado</h2>
                 <p className="text-muted-foreground max-w-md">
                   Sua combinação atual de filtros não retornou nenhum cliente. Tente ajustar os filtros na barra lateral para ver resultados.
                 </p>
                 <Button variant="outline" className="mt-6" onClick={() => {
                   setFilterContrato(["Mensal", "Um ano", "Dois anos"]);
                   setFilterTempo([0, 72]);
                   setFilterPagamento(["Boleto", "Cartão de crédito", "Débito automático", "Cheque eletrônico"]);
                   setFilterChurn("Todos");
                   setFilterGenero(["Masculino", "Feminino"]);
                 }}>Limpar Filtros</Button>
               </div>
            ) : (
              <>
                {/* KPI Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: CHART_COLORS.blue }}>{totalClientes.toLocaleString("pt-BR")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm font-medium text-muted-foreground">Taxa de Churn</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: CHART_COLORS.red }}>{formatPercent(taxaChurn)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                      <p className="text-2xl font-bold mt-1 truncate" style={{ color: CHART_COLORS.blue }}>{formatCurrency(receitaTotal)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm font-medium text-muted-foreground">Receita Média</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: CHART_COLORS.blue }}>{formatCurrency(receitaMedia)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm font-medium text-muted-foreground">Receita Perdida</p>
                      <p className="text-2xl font-bold mt-1 truncate" style={{ color: CHART_COLORS.red }}>{formatCurrency(receitaPerdida)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  
                  {/* Chart 1: Churn por Tipo de Contrato */}
                  <Card>
                    <CardHeader className="px-5 pt-5 pb-2 flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">Churn por Tipo de Contrato</CardTitle>
                      {chart1Data.length > 0 && (
                        <CSVLink data={chart1Data} filename="churn-por-contrato.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Exportar CSV">
                          <Download className="w-3.5 h-3.5" />
                        </CSVLink>
                      )}
                    </CardHeader>
                    <CardContent className="px-2 pb-5">
                      <ResponsiveContainer width="100%" height={320} debounce={0}>
                        <BarChart data={chart1Data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dy={10} />
                          <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dx={-10} />
                          <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                          <Legend content={<CustomLegend />} />
                          <Bar dataKey="Churn Não" fill={CHART_COLORS.green} fillOpacity={0.9} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                          <Bar dataKey="Churn Sim" fill={CHART_COLORS.red} fillOpacity={0.9} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Chart 2: Taxa de Churn por Faixa de Tempo */}
                  <Card>
                    <CardHeader className="px-5 pt-5 pb-2 flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">Taxa de Churn por Faixa de Tempo</CardTitle>
                      {chart2Data.length > 0 && (
                        <CSVLink data={chart2Data} filename="taxa-churn-por-tempo.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Exportar CSV">
                          <Download className="w-3.5 h-3.5" />
                        </CSVLink>
                      )}
                    </CardHeader>
                    <CardContent className="px-2 pb-5">
                      <ResponsiveContainer width="100%" height={320} debounce={0}>
                        <BarChart data={chart2Data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dy={10} />
                          <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dx={-10} />
                          <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                          <Bar dataKey="Taxa de Churn (%)" fill={CHART_COLORS.blue} fillOpacity={0.9} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Chart 3: Distribuição de Valor Mensal */}
                  <Card>
                    <CardHeader className="px-5 pt-5 pb-2 flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">Distribuição de Valor Mensal</CardTitle>
                      {chart3Data.length > 0 && (
                        <CSVLink data={chart3Data} filename="distribuicao-valor-mensal.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Exportar CSV">
                          <Download className="w-3.5 h-3.5" />
                        </CSVLink>
                      )}
                    </CardHeader>
                    <CardContent className="px-2 pb-5">
                      <ResponsiveContainer width="100%" height={320} debounce={0}>
                        <BarChart data={chart3Data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dy={10} />
                          <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} dx={-10} />
                          <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                          <Legend content={<CustomLegend />} />
                          <Bar dataKey="Churn Não" stackId="a" fill={CHART_COLORS.green} fillOpacity={0.9} radius={[0, 0, 4, 4]} isAnimationActive={false} />
                          <Bar dataKey="Churn Sim" stackId="a" fill={CHART_COLORS.red} fillOpacity={0.9} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Chart 4: Churn por Método de Pagamento */}
                  <Card>
                    <CardHeader className="px-5 pt-5 pb-2 flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">Churn por Método de Pagamento</CardTitle>
                      {chart4Data.length > 0 && (
                        <CSVLink data={chart4Data} filename="churn-por-pagamento.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Exportar CSV">
                          <Download className="w-3.5 h-3.5" />
                        </CSVLink>
                      )}
                    </CardHeader>
                    <CardContent className="px-2 pb-5">
                      <ResponsiveContainer width="100%" height={320} debounce={0}>
                        <BarChart data={chart4Data} layout="vertical" margin={{ top: 20, right: 30, bottom: 20, left: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                          <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: tickColor }} width={100} stroke={tickColor} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
                          <Bar dataKey="Taxa de Churn (%)" fill={CHART_COLORS.red} fillOpacity={0.9} radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
