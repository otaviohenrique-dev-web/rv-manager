import React, { useState } from 'react';
import { Container, Navbar, Nav, Badge } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaChartPie, 
  FaCalculator, 
  FaBoxes, 
  FaHeartBroken, 
  FaHistory, 
  FaPlusCircle, 
  FaShoppingCart,
  FaLayerGroup 
} from 'react-icons/fa';

export default function HeaderNavigation() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? '#2EC4B6' : '#A5C4D4',
    fontWeight: isActive(path) ? '600' : '400',
    transition: 'all 0.2s ease',
    borderBottom: isActive(path) ? '2px solid #2EC4B6' : '2px solid transparent',
    paddingBottom: '2px',
    fontSize: '13px'
  });

  return (
    <Navbar 
      expanded={expanded} 
      expand="lg" 
      variant="dark" 
      style={{ backgroundColor: '#0B2545', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      className="py-3 px-3"
    >
      <Container fluid>
        {/* Marca / Logo */}
        <Navbar.Brand 
          as={Link} 
          to="/" 
          onClick={() => setExpanded(false)}
          className="d-flex align-items-center gap-2 fw-bold text-white tracking-wider"
          style={{ fontSize: '1.1rem', fontFamily: "'Inter', sans-serif" }}
        >
          <div 
            className="p-1.5 rounded d-flex align-items-center justify-content-center" 
            style={{ backgroundColor: '#134074', color: '#2EC4B6' }}
          >
            <FaLayerGroup size={16} />
          </div>
          <span>RV <span style={{ color: '#2EC4B6' }}>MANAGER</span></span>
          <Badge bg="secondary" className="ms-1" style={{ fontSize: '9px', backgroundColor: '#134074', color: '#A5C4D4' }}>
            ERP
          </Badge>
        </Navbar.Brand>

        {/* Botão Hamburguer Mobile */}
        <Navbar.Toggle 
          aria-controls="navbar-rv-manager" 
          onClick={() => setExpanded(expanded ? false : true)}
          className="border-0 shadow-none text-white"
        />

        {/* Links de Navegação */}
        <Navbar.Collapse id="navbar-rv-manager">
          <Nav className="ms-auto align-lg-items-center gap-lg-3 pt-3 pt-lg-0" activeKey={location.pathname}>
            
            <Nav.Link 
              as={Link} 
              to="/" 
              onClick={() => setExpanded(false)}
              style={linkStyle('/')}
              className="d-flex align-items-center gap-2 px-2 py-1"
            >
              <FaChartPie size={13} />
              <span>Diretoria / Dashboard</span>
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/calculadora" 
              onClick={() => setExpanded(false)}
              style={linkStyle('/calculadora')}
              className="d-flex align-items-center gap-2 px-2 py-1"
            >
              <FaCalculator size={13} />
              <span>Calculadora de Pedidos</span>
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/estoque-vendedor" 
              onClick={() => setExpanded(false)}
              style={linkStyle('/estoque-vendedor')}
              className="d-flex align-items-center gap-2 px-2 py-1"
            >
              <FaBoxes size={13} />
              <span>Estoque (Vendas)</span>
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/quebras/rastreamento" 
              onClick={() => setExpanded(false)}
              style={linkStyle('/quebras/rastreamento')}
              className="d-flex align-items-center gap-2 px-2 py-1"
            >
              <FaHeartBroken size={13} />
              <span>Quebras</span>
            </Nav.Link>

            <Nav.Link 
              as={Link} 
              to="/vendas/historico" 
              onClick={() => setExpanded(false)}
              style={linkStyle('/vendas/historico')}
              className="d-flex align-items-center gap-2 px-2 py-1"
            >
              <FaHistory size={13} />
              <span>Auditoria</span>
            </Nav.Link>

            {/* Ações Rápidas Integradas no Menu */}
            <div className="d-flex flex-row gap-2 mt-2 mt-lg-0 ms-lg-2 ps-lg-2 border-start-lg border-secondary">
              <Link 
                to="/estoque/entrada" 
                onClick={() => setExpanded(false)}
                className="btn btn-sm text-white d-flex align-items-center gap-1 px-2.5 py-1.5 fw-semibold shadow-none"
                style={{ backgroundColor: '#2EC4B6', fontSize: '11px', border: 'none' }}
              >
                <FaPlusCircle size={11} /> Entrada
              </Link>

              <Link 
                to="/vendas/nova" 
                onClick={() => setExpanded(false)}
                className="btn btn-sm text-white d-flex align-items-center gap-1 px-2.5 py-1.5 fw-semibold shadow-none"
                style={{ backgroundColor: '#FF9F1C', fontSize: '11px', border: 'none' }}
              >
                <FaShoppingCart size={11} /> Saída
              </Link>

            </div>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}