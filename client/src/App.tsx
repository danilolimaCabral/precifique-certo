import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Materiais from "./pages/Materiais";
import Produtos from "./pages/Produtos";
import Dimensoes from "./pages/Dimensoes";
import Marketplaces from "./pages/Marketplaces";
import CTM from "./pages/CTM";
import Precificacao from "./pages/Precificacao";
import PrecoMinimo from "./pages/PrecoMinimo";
import Simulador from "./pages/Simulador";
import Configuracoes from "./pages/Configuracoes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/materiais" component={Materiais} />
      <Route path="/produtos" component={Produtos} />
      <Route path="/dimensoes" component={Dimensoes} />
      <Route path="/marketplaces" component={Marketplaces} />
      <Route path="/ctm" component={CTM} />
      <Route path="/precificacao" component={Precificacao} />
      <Route path="/preco-minimo" component={PrecoMinimo} />
      <Route path="/simulador" component={Simulador} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
