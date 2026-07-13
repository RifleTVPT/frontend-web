import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/microsite.css';

const appUrl = 'https://softinsa-plataforma.onrender.com';
const apkUrl = '/downloads/softinsa-badges-consultor.apk';

const perfis = [
  {
    nome: 'Consultor',
    texto: 'Consulta badges, submete evidências, acompanha candidaturas, descarrega certificados e partilha conquistas públicas.',
    icon: 'bi-person-badge'
  },
  {
    nome: 'Talent Manager',
    texto: 'Analisa evidências, acompanha pedidos, consulta históricos e exporta relatórios por período, área e estado.',
    icon: 'bi-search-heart'
  },
  {
    nome: 'Service Line Leader',
    texto: 'Faz a validação final dos badges da sua Service Line e acompanha ranking, métricas e evolução da equipa.',
    icon: 'bi-diagram-3'
  },
  {
    nome: 'Administrador',
    texto: 'Gere utilizadores, estrutura, badges, conquistas especiais, RGPD, notificações, avisos e métricas globais.',
    icon: 'bi-shield-check'
  }
];

const funcionalidades = [
  'Catálogo global de badges normais e premium',
  'Upload de evidências com ficheiros guardados na cloud',
  'Workflow auditável: consultor, Talent Manager e Service Line Leader',
  'Certificados PDF personalizados e páginas públicas de verificação',
  'Partilha de badges no LinkedIn e galeria pública do consultor',
  'Ranking, pontos, conquistas especiais e recomendações',
  'Notificações web, push mobile e emails automáticos',
  'Exportações PDF/Excel para apoio à análise de gestão'
];

const tecnologias = [
  'React + Vite',
  'Node.js + Express',
  'PostgreSQL',
  'Flutter',
  'Firebase',
  'Cloudinary',
  'Brevo',
  'Render'
];

const MicrositeProjeto = () => {
  return (
    <main className="microsite-page">
      <nav className="microsite-nav">
        <a href="#topo" className="microsite-brand">
          <span className="brand-mark">SB</span>
          <span>
            <strong>Plataforma de Badges da Softinsa</strong>
            <small>Projeto PINT 2025-26 / Nº 30023-29990-29998-30010</small>
          </span>
        </a>
        <div className="microsite-nav-actions">
          <a href="#plataforma">Plataforma</a>
          <a href="#perfis">Perfis</a>
          <a href="#mobile">Mobile</a>
          <a href="#acesso" className="nav-cta">Aceder</a>
        </div>
      </nav>

      <section id="topo" className="microsite-hero">
        <div className="hero-copy">
          <span className="eyebrow">Plataforma de badges digitais verificáveis</span>
          <h1>Reconhecimento, validação e partilha de competências na Softinsa.</h1>
          <p>
            O projeto Softinsa Badges transforma Learning Paths, Service Lines, áreas, níveis e requisitos
            numa experiência completa de certificação digital, gamificação e acompanhamento de evolução profissional.
          </p>
          <div className="hero-actions">
            <a href={appUrl} className="primary-action">
              <i className="bi bi-box-arrow-up-right"></i>
              Abrir Plataforma Web
            </a>
            <a href={apkUrl} className="secondary-action">
              <i className="bi bi-android2"></i>
              Download APK Consultor
            </a>
          </div>
        </div>

        <div className="hero-panel" aria-label="Resumo do projeto">
          <div className="orbit-card main-badge">
            <div className="badge-emblem" aria-hidden="true">
              <i className="bi bi-award-fill"></i>
            </div>
            <strong>Badge Verificável</strong>
            <span>Certificado, pontos, validade e link público único.</span>
          </div>
          <div className="mini-stat">
            <strong>4</strong>
            <span>Perfis Web</span>
          </div>
          <div className="mini-stat">
            <strong>1</strong>
            <span>App Mobile Consultor</span>
          </div>
          <div className="mini-stat">
            <strong>7</strong>
            <span>Utilizadores Iniciais</span>
          </div>
          <div className="mini-stat">
            <strong>15+</strong>
            <span>Badges por estrutura base</span>
          </div>
        </div>
      </section>

      <section id="plataforma" className="section-grid">
        <div>
          <span className="section-kicker">Contexto</span>
          <h2>Uma solução para evidenciar competências e motivar aprendizagem contínua.</h2>
        </div>
        <div className="text-stack">
          <p>
            A plataforma de Badges da Softinsa é uma solução semelhante ao Credly, capaz de gerir credenciais
            de competências, apoiar a validação de formações externas e dar visibilidade às certificações dos colaboradores.
          </p>
          <p>
            A solução implementa a Jornada Técnica com Service Lines, áreas, níveis e requisitos, permitindo que
            cada consultor submeta evidências para obter badges normais ou conquistas especiais.
          </p>
        </div>
      </section>

      <section className="structure-band">
        <div className="structure-card">
          <i className="bi bi-map"></i>
          <h3>Jornada Técnica</h3>
          <p>Learning Path base do projeto.</p>
        </div>
        <div className="structure-arrow">→</div>
        <div className="structure-card">
          <i className="bi bi-diagram-2"></i>
          <h3>Service Lines</h3>
          <p>Hybrid Cloud, Application Operations e Sourcing & Talent Management.</p>
        </div>
        <div className="structure-arrow">→</div>
        <div className="structure-card">
          <i className="bi bi-layers"></i>
          <h3>Áreas e níveis</h3>
          <p>Áreas com níveis A a E, requisitos próprios e badges associados.</p>
        </div>
      </section>

      <section id="perfis" className="microsite-section">
        <div className="section-heading">
          <span className="section-kicker">Perfis</span>
          <h2>Quatro experiências Web e uma aplicação mobile focada no consultor.</h2>
        </div>
        <div className="profile-grid">
          {perfis.map((perfil) => (
            <article key={perfil.nome} className="profile-card">
              <i className={`bi ${perfil.icon}`}></i>
              <h3>{perfil.nome}</h3>
              <p>{perfil.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-heading">
          <span className="section-kicker">Workflow</span>
          <h2>Desde a submissão à publicação do badge.</h2>
        </div>
        <div className="workflow-steps">
          <div>
            <span>01</span>
            <h3>Submissão</h3>
            <p>O consultor escolhe um badge e envia evidências mapeadas aos requisitos.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Análise Talent</h3>
            <p>O Talent Manager valida os ficheiros, aprova para SLL ou rejeita o pedido quando as evidências não cumprem os requisitos.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Validação SLL</h3>
            <p>O Service Line Leader aprova, recusa ou devolve o pedido com feedback para correção pelo Consultor.</p>
          </div>
          <div>
            <span>04</span>
            <h3>Publicação</h3>
            <p>O badge fica disponível em Meus Badges, podendo gerar certificado, partilhar no LinkedIn e na assinatura de email, além de ter galeria e página pública.</p>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <span className="section-kicker">Funcionalidades</span>
          <h2>Principais capacidades implementadas.</h2>
        </div>
        <div className="feature-list">
          {funcionalidades.map((item) => (
            <div key={item} className="feature-item">
              <i className="bi bi-check2-circle"></i>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="mobile" className="mobile-section">
        <div className="mobile-copy">
          <span className="section-kicker">Aplicação Mobile</span>
          <h2>Experiência do consultor também disponível em Android.</h2>
          <p>
            A app mobile permite ao consultor consultar dashboard, catálogo, badges obtidos,
            conquistas especiais, histórico, notificações, objetivos e submeter evidências.
          </p>
          <a href={apkUrl} className="primary-action apk-action">
            <i className="bi bi-download"></i>
            Transferir APK
          </a>
        </div>
        <div className="phone-preview">
          <div className="phone-top"></div>
          <div className="phone-screen">
            <span>SOFTINSA</span>
            <div className="phone-card"></div>
            <div className="phone-row"></div>
            <div className="phone-row short"></div>
            <button>Submeter evidências</button>
          </div>
        </div>
      </section>

      <section className="tech-section">
        <div>
          <span className="section-kicker">Tecnologia e deploy</span>
          <h2>Stack preparada para Web, Mobile e armazenamento persistente.</h2>
          <p>
            A plataforma usa deploy em Render, base de dados PostgreSQL, ficheiros em Cloudinary,
            autenticação e notificações integradas, mantendo certificados, imagens e evidências após redeploys.
          </p>
        </div>
        <div className="tech-cloud">
          {tecnologias.map((tech) => <span key={tech}>{tech}</span>)}
        </div>
      </section>

      <section id="acesso" className="access-section">
        <div>
          <span className="section-kicker">Acesso à solução</span>
          <h2>Links de entrega do projeto.</h2>
          <p>
            A plataforma Web está disponível publicamente e o APK da aplicação mobile do consultor pode ser descarregado diretamente a partir deste microsite.
          </p>
        </div>
        <div className="access-actions">
          <a href={appUrl} className="primary-action">
            <i className="bi bi-globe2"></i>
            Plataforma Web
          </a>
          <a href={apkUrl} className="secondary-action">
            <i className="bi bi-phone"></i>
            APK Android
          </a>
        </div>
      </section>
    </main>
  );
};

export default MicrositeProjeto;
