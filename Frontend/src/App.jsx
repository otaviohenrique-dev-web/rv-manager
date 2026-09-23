import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import HeaderNavigation from './components/HeaderNavigation.jsx';
import Dashboard from './views/Dashboard.jsx';
import CalculadoraPedido from './views/CalculadoraPedido.jsx';
import EstoqueVendedor from './views/EstoqueVendedor.jsx';
import RastreamentoQuebras from './views/RastreamentoQuebras.jsx';
import EntradaEstoque from './views/EntradaEstoque.jsx';
import NovaVenda from './views/NovaVenda.jsx';
import RelatorioEspelho from './views/RelatorioEspelho.jsx'; // Nova importação do Épico 2 adicionada
import Footer from './components/Footer.jsx';
import HistoricoVendas from './views/HistoricoVendas.jsx';

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#F4F5F7' }}>
        <HeaderNavigation />
        
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calculadora" element={<CalculadoraPedido />} />
            <Route path="/estoque-vendedor" element={<EstoqueVendedor />} />
            <Route path="/quebras/rastreamento" element={<RastreamentoQuebras />} />
            {/* Novas Rotas - OS 03 */}
            <Route path="/estoque/entrada" element={<EntradaEstoque />} />
            <Route path="/vendas/nova" element={<NovaVenda />} />
            
            {/* Rota Atualizada - OS 07: Espelho/Recibo de Venda */}
            <Route path="/vendas/espelho" element={<RelatorioEspelho />} />
            <Route path="/vendas/historico" element={<HistoricoVendas />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;