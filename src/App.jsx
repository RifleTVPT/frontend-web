import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './views/Login';
import Registo from './views/Registo';
import PrimeiroAcesso from './views/PrimeiroAcesso';
import RecuperarPassword from './views/RecuperarPassword';
import GaleriaPublicaBadges from './views/GaleriaPublicaBadges';
import VerificacaoBadgeUnico from './views/VerificacaoBadgeUnico';
import VerificacaoConquistaEspecial from './views/VerificacaoConquistaEspecial';
import MicrositeProjeto from './views/MicrositeProjeto';

// --- CONSULTOR ---
import DashboardConsultor from './views/consultor/DashboardConsultor';
import CatalogoBadges from './views/consultor/CatalogoBadgesConsultor';
import DetalhesBadge from './views/consultor/DetalhesBadgeConsultor';
import CandidaturaBadgeConsultor from './views/consultor/CandidaturaBadgeConsultor';
import MeusBadgesConsultor from './views/consultor/MeusBadgesConsultor';
import DetalhesBadgeObtidoConsultor from './views/consultor/DetalhesBadgeObtidoConsultor';
import ConquistasEspeciaisConsultor from './views/consultor/ConquistasEspeciaisConsultor';
import NovoPedidoConsultor from './views/consultor/NovoPedidoConsultor';
import HistoricoPedidosConsultor from './views/consultor/HistoricoPedidosConsultor';
import RankingPontosConsultor from './views/consultor/RankingPontosConsultor';
import DetalhesPedidoConsultor from './views/consultor/DetalhesPedidoConsultor';
import EstatisticasDetalhesConsultor from './views/consultor/EstatisticasDetalhesConsultor';
import TimelineObjetivosConsultor from './views/consultor/TimelineObjetivosConsultor';
import RelatoriosConsultor from './views/consultor/RelatoriosConsultor';
import ConfiguracoesConsultor from './views/consultor/ConfiguracoesConsultor';
import DetalhesConquistaEspecial from './views/consultor/DetalhesConquistaEspecial';

// --- TALENT MANAGER ---
import DashboardTalentManager from './views/talent_manager/DashboardTalentManager';
import CatalogoGlobalTalent from './views/talent_manager/CatalogoGlobalTalent';
import DetalhesBadgeTalent from './views/talent_manager/DetalhesBadgeTalent';
import BadgesExpiracaoTalent from './views/talent_manager/BadgesExpiracaoTalent';
import PedidosPendentesTalent from './views/talent_manager/PedidosPendentesTalent';
import AnalisarEvidenciasTalent from './views/talent_manager/AnalisarEvidenciasTalent';
import HistoricoPedidosTalent from './views/talent_manager/HistoricoPedidosTalent';
import ListaConsultoresTalent from './views/talent_manager/ListaConsultoresTalent';
import PerfilConsultorTalent from './views/talent_manager/PerfilConsultorTalent';
import RelatoriosTalent from './views/talent_manager/RelatoriosTalent';
import GamificacaoTalent from './views/talent_manager/GamificacaoTalent';
import ConfiguracoesTalent from './views/talent_manager/ConfiguracoesTalent';
import DetalhesConquistaEspecialTalent from './views/talent_manager/DetalhesConquistaEspecialTalent';
import TimelineGlobalTalent from './views/talent_manager/TimelineGlobalTalent';

// --- SERVICE LINE LEADER ---
import DashboardSLL from './views/sll/DashboardSLL';
import CatalogoBadgesSLL from './views/sll/CatalogoBadgesSLL';
import DetalhesBadgeSLL from './views/sll/DetalhesBadgeSLL';
import BadgesAtribuidosSLL from './views/sll/BadgesAtribuidosSLL';
import DetalhesConquistaEspecialSLL from './views/sll/DetalhesConquistaEspecialSLL';
import BadgesExpiracaoSLL from './views/sll/BadgesExpiracaoSLL';
import PedidosPendentesSLL from './views/sll/PedidosPendentesSLL';
import ValidarPedidoSLL from './views/sll/ValidarPedidoSLL';
import HistoricoPedidosSLL from './views/sll/HistoricoPedidosSLL';
import GestaoConsultoresSLL from './views/sll/GestaoConsultoresSLL';
import PerfilConsultorSLL from './views/sll/PerfilConsultorSLL';
import RelatoriosSLL from './views/sll/RelatoriosSLL';
import GamificacaoSLL from './views/sll/GamificacaoSLL';
import BadgesPremiumSLL from './views/sll/BadgesPremiumSLL';
import DetalhesPremiumSLL from './views/sll/DetalhesPremiumSLL';
import ConfiguracoesSLL from './views/sll/ConfiguracoesSLL';

// --- ADMINISTRADOR ---
import DashboardAdmin from './views/admin/DashboardAdmin';
import ListaUtilizadoresAdmin from './views/admin/ListaUtilizadoresAdmin';
import PerfilUtilizadorAdmin from './views/admin/PerfilUtilizadorAdmin';
import AtividadeHistoricoAdmin from './views/admin/AtividadeHistoricoAdmin';
import CatalogoBadgesAdmin from './views/admin/CatalogoBadgesAdmin';
import DetalhesBadgeAdmin from './views/admin/DetalhesBadgeAdmin';
import EstruturaGlobalAdmin from './views/admin/EstruturaGlobalAdmin';
import CatalogoConquistasAdmin from './views/admin/CatalogoConquistasAdmin';
import DetalhesConquistaEspecialAdmin from './views/admin/DetalhesConquistaEspecialAdmin';
import PedidosBadgeAdmin from './views/admin/PedidosBadgeAdmin';
import DetalhesPedidoBadgeAdmin from './views/admin/DetalhesPedidoBadgeAdmin';
import MetricasGlobaisAdmin from './views/admin/MetricasGlobaisAdmin';
import ExportacaoDadosAdmin from './views/admin/ExportacaoDadosAdmin';
import ConfiguracoesGeraisAdmin from './views/admin/ConfiguracoesGeraisAdmin';
import ConfiguracoesNotificacoesAdmin from './views/admin/ConfiguracoesNotificacoesAdmin';
import PoliticasRGPDAdmin from './views/admin/PoliticasRGPDAdmin';
import AvisosGenericosAdmin from './views/admin/AvisosGenericosAdmin';
import PedidosRegistoAdmin from './views/admin/PedidosRegistoAdmin';
import DetalhesPedidoRegistoAdmin from './views/admin/DetalhesPedidoRegistoAdmin';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/microsite" element={<MicrositeProjeto />} />
          <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/registo" element={<Registo />} />
          
          <Route path="/galeria/:idUtilizador" element={<GaleriaPublicaBadges />} />
          <Route path="/verificacao/:linkUnico" element={<VerificacaoBadgeUnico />} />
          <Route path="/verificacao-especial/:idUtilizador/:idMarco" element={<VerificacaoConquistaEspecial />} />

          {/* Rotas Restritas - Layout com SidebarPadrao */}
          <Route path="/dashboard" element={<DashboardConsultor />} />
          <Route path="/catalogo" element={<CatalogoBadges />} />
          <Route path="/detalhes/:id" element={<DetalhesBadge />} />
          <Route path="/candidatar/:id" element={<CandidaturaBadgeConsultor />} />
          <Route path="/meus-badges" element={<MeusBadgesConsultor />} />
          <Route path="/meus-badges/detalhes/:id" element={<DetalhesBadgeObtidoConsultor />} />
          <Route path="/conquistas" element={<ConquistasEspeciaisConsultor />} />
          <Route path="/pedidos/novo" element={<NovoPedidoConsultor />} />
          <Route path="/pedidos/historico" element={<HistoricoPedidosConsultor />} />
          <Route path="/performance/ranking" element={<RankingPontosConsultor />} />
          <Route path="/pedidos/detalhes/:id" element={<DetalhesPedidoConsultor />} />
          <Route path="/performance/estatisticas" element={<EstatisticasDetalhesConsultor />} />
          <Route path="/performance/timeline" element={<TimelineObjetivosConsultor />} />
          <Route path="/performance/relatorios" element={<RelatoriosConsultor />} />
          <Route path="/configuracoes" element={<ConfiguracoesConsultor />} />
          <Route path="/performance/conquistas/:id" element={<DetalhesConquistaEspecial />} />

          {/* Talent Manager */}
          <Route path="/talent-manager/dashboard" element={<DashboardTalentManager />} />
          <Route path="/talent/catalogo-global" element={<CatalogoGlobalTalent />} />
          <Route path="/talent/badge-detalhes/:id" element={<DetalhesBadgeTalent />} />
          <Route path="/talent/expiracao" element={<BadgesExpiracaoTalent />} />
          <Route path="/talent/validacoes/pendentes" element={<PedidosPendentesTalent />} />
          <Route path="/talent/validacoes/analisar/:id" element={<AnalisarEvidenciasTalent />} />
          <Route path="/talent/validacoes/historico" element={<HistoricoPedidosTalent />} />
          <Route path="/talent/consultores/lista" element={<ListaConsultoresTalent />} />
          <Route path="/talent/consultores/perfil/:id" element={<PerfilConsultorTalent />} />
          <Route path="/talent/consultores/relatorios" element={<RelatoriosTalent />} />
          <Route path="/talent/gamificacao" element={<GamificacaoTalent />} />
          <Route path="/talent/configuracoes" element={<ConfiguracoesTalent />} />
          <Route path="/talent/consultores/:idUtilizador/conquista/:idMarco" element={<DetalhesConquistaEspecialTalent />} />
          <Route path="/talent/timeline" element={<TimelineGlobalTalent />} />

          {/* SLL e Admin permanecem iguais... */}
          <Route path="/sll/dashboard" element={<DashboardSLL />} />
          <Route path="/sll/badges/catalogo" element={<CatalogoBadgesSLL />} />
          <Route path="/sll/badges/detalhes/:id" element={<DetalhesBadgeSLL />} />
          <Route path="/sll/badges/atribuidos" element={<BadgesAtribuidosSLL />} />
          <Route path="/sll/badges/expiracao" element={<BadgesExpiracaoSLL />} />
          <Route path="/sll/validacoes/pendentes" element={<PedidosPendentesSLL />} />
          <Route path="/sll/validacoes/validar/:id" element={<ValidarPedidoSLL />} />
          <Route path="/sll/validacoes/historico" element={<HistoricoPedidosSLL />} />
          <Route path="/sll/consultores/gestao" element={<GestaoConsultoresSLL />} />
          <Route path="/sll/consultores/perfil/:id" element={<PerfilConsultorSLL />} />
          <Route path="/sll/consultores/:idUtilizador/conquista/:idMarco" element={<DetalhesConquistaEspecialSLL />} />
          <Route path="/sll/consultores/relatorios" element={<RelatoriosSLL />} />
          <Route path="/sll/gamificacao" element={<GamificacaoSLL />} />
          <Route path="/sll/gamificacao/premium" element={<BadgesPremiumSLL />} />
          <Route path="/sll/gamificacao/premium/detalhes/:id" element={<DetalhesPremiumSLL />} />
          <Route path="/sll/configuracoes" element={<ConfiguracoesSLL />} />

          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/utilizadores/lista" element={<ListaUtilizadoresAdmin />} />
          <Route path="/admin/utilizadores/perfil/:id" element={<PerfilUtilizadorAdmin />} />
          <Route path="/admin/utilizadores/atividade" element={<AtividadeHistoricoAdmin />} />
          <Route path="/admin/badges/catalogo" element={<CatalogoBadgesAdmin />} />
          <Route path="/admin/badges/conquistas" element={<CatalogoConquistasAdmin />} />
          <Route path="/admin/badges/conquistas/:id" element={<DetalhesConquistaEspecialAdmin />} />
          <Route path="/admin/badges/detalhes/:id" element={<DetalhesBadgeAdmin />} />
          <Route path="/admin/badges/estrutura" element={<EstruturaGlobalAdmin />} />
          <Route path="/admin/badges/pedidos" element={<PedidosBadgeAdmin />} />
          <Route path="/admin/badges/pedidos/detalhes/:id" element={<DetalhesPedidoBadgeAdmin />} />
          <Route path="/admin/performance/metricas" element={<MetricasGlobaisAdmin />} />
          <Route path="/admin/performance/export" element={<ExportacaoDadosAdmin />} />
          <Route path="/admin/config/gerais" element={<ConfiguracoesGeraisAdmin />} />
          <Route path="/admin/config/notificacoes" element={<ConfiguracoesNotificacoesAdmin />} />
          <Route path="/admin/config/rgpd" element={<PoliticasRGPDAdmin />} />
          <Route path="/admin/config/avisos" element={<AvisosGenericosAdmin />} />
          <Route path="/admin/utilizadores/pedidos" element={<PedidosRegistoAdmin />} />
          <Route path="/admin/utilizadores/pedidos/detalhes/:id" element={<DetalhesPedidoRegistoAdmin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
