import React from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

export default function HeaderNavigation() {
  const location = useLocation();

  return (
    <Navbar style={{ backgroundColor: '#0B2545' }} variant="dark" expand="lg" className="shadow-sm mb-4">
      <Container fluid className="px-4">
        {/* Identidade Visual Minimalista solicitada pela gestão */}
        <Navbar.Brand as={Link} to="/" className="fw-bold tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
          RV MANAGER
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-rv-manager" />
        <Navbar.Collapse id="navbar-rv-manager">
          <Nav className="ms-auto" activeKey={location.pathname}>
            <Nav.Link as={Link} to="/" eventKey="/">Diretoria / Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/calculadora" eventKey="/calculadora">Calculadora de Pedidos</Nav.Link>
            <Nav.Link as={Link} to="/estoque-vendedor" eventKey="/estoque-vendedor">Estoque (Vendas)</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}