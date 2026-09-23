import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaGithub, FaInstagram, FaCode } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer 
      style={{ 
        backgroundColor: '#071A30', 
        color: '#A5C4D4', 
        borderTop: '1px solid rgba(255, 255, 255, 0.08)' 
      }} 
      className="mt-auto py-3"
    >
      <Container fluid className="px-4">
        <Row className="align-items-center gy-2">
          
          {/* DIREITOS RESERVADOS E NOME DO DEV */}
          <Col xs={12} md={6} className="text-center text-md-start">
            <span className="small d-flex align-items-center justify-content-center justify-content-md-start gap-1">
              <FaCode className="text-info" />
              <span>Desenvolvido por</span>
              <strong className="text-white fw-bold">Otávio Henrique</strong> 
              <span>• RV Manager © {new Date().getFullYear()}</span>
            </span>
          </Col>

          {/* LINKS REDES SOCIAIS */}
          <Col xs={12} md={6} className="text-center text-md-end">
            <div className="d-inline-flex align-items-center gap-3">
              <a 
                href="https://github.com/otaviohenrique-dev-web" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none d-flex align-items-center gap-1"
                style={{ color: '#A5C4D4', transition: 'color 0.2s', fontSize: '13px' }}
              >
                <FaGithub size={16} />
                <span>GitHub</span>
              </a>

              <a 
                href="https://www.instagram.com/otavioh.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-decoration-none d-flex align-items-center gap-1"
                style={{ color: '#A5C4D4', transition: 'color 0.2s', fontSize: '13px' }}
              >
                <FaInstagram size={16} className="text-danger-subtle" />
                <span>Instagram</span>
              </a>
            </div>
          </Col>

        </Row>
      </Container>
    </footer>
  );
}