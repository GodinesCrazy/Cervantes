import { Link } from 'react-router-dom';
import type { Project } from '../types/domain';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  BookOpen, CheckCircle, TrendingUp, ArrowRight,
  Clock, Activity, Star, Trash2
} from 'lucide-react';
import { api } from '../api/client';

type Props = {
  projects: Project[];
  refresh?: () => void;
};

export function Dashboard({ projects, refresh }: Props) {
  // Data processing for charts
  const goCount = projects.filter(p => p.goNoGoResult === 'GO').length;
  const reviseCount = projects.filter(p => p.goNoGoResult === 'REVISE').length;
  const pendingCount = projects.length - goCount - reviseCount;

  const donutData = [
    { name: 'Aprobados', value: goCount, color: '#8b5cf6' },
    { name: 'Revisión', value: reviseCount, color: '#a78bfa' },
    { name: 'Pendientes', value: pendingCount, color: '#3b4247' },
  ];

  // Group by phases
  const phaseCounts = {
    Idea: projects.filter(p => p.currentPhase === 'idea' || p.currentPhase === 'market-research').length,
    Escritura: projects.filter(p => p.currentPhase === 'blocks' || p.currentPhase === 'chapter-plans').length,
    Auditoría: projects.filter(p => p.currentPhase === 'audit' || p.currentPhase === 'recovery').length,
    Exportación: projects.filter(p => p.currentPhase === 'export' || p.currentPhase === 'metadata').length,
  };

  const barData = Object.entries(phaseCounts).map(([name, count]) => ({ name, count }));

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const getPhaseProgress = (phase?: string) => {
    const phases = ['idea', 'market-research', 'go-nogo', 'editorial-bible', 'visual-bible', 'chapter-plans', 'blocks', 'audit', 'export', 'metadata', 'publishing-checklist'];
    if (!phase) return 0;
    const idx = phases.indexOf(phase);
    return idx >= 0 ? Math.round(((idx + 1) / phases.length) * 100) : 0;
  };

  return (
    <motion.main 
      className="page standalone premium-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header 
        className="premium-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="hero-content">
          <div className="hero-badge">
            <Star size={14} className="hero-icon" />
            <span className="eyebrow">Fábrica editorial privada</span>
          </div>
          <h1 className="hero-title">Cervantes <span>Studio</span></h1>
          <p className="hero-subtitle">Transforma ideas crudas en productos editoriales premium.</p>
        </div>
        <Link className="button premium-btn-primary" to="/projects/new">
          <BookOpen size={18} />
          Nuevo proyecto
        </Link>
      </motion.header>

      <motion.section 
        className="premium-metrics-grid"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div className="glass-panel stat-card" variants={itemVars}>
          <div className="stat-header">
            <BookOpen size={20} className="stat-icon" />
            <p>Total Proyectos</p>
          </div>
          <span className="stat-value">{projects.length}</span>
        </motion.div>
        
        <motion.div className="glass-panel stat-card" variants={itemVars}>
          <div className="stat-header">
            <CheckCircle size={20} className="stat-icon success" />
            <p>GO Aprobados</p>
          </div>
          <span className="stat-value">{goCount}</span>
        </motion.div>

        <motion.div className="glass-panel stat-card" variants={itemVars}>
          <div className="stat-header">
            <Activity size={20} className="stat-icon accent" />
            <p>Exportaciones</p>
          </div>
          <span className="stat-value">
            {projects.reduce((total, project) => total + (project.formatBuilds?.length || 0), 0)}
          </span>
        </motion.div>

        <motion.div className="glass-panel chart-card" variants={itemVars}>
          <h3>Tasa de Éxito Comercial</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={donutData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#171a1d', border: '1px solid #3b4247', borderRadius: '8px' }}
                  itemStyle={{ color: '#f5f2ea' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="glass-panel chart-card col-span-2" variants={itemVars}>
          <h3>Progreso por Fase</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d30" vertical={false} />
                <XAxis dataKey="name" stroke="#aeb5b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#aeb5b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#2a2d30', opacity: 0.4 }}
                  contentStyle={{ background: '#171a1d', border: '1px solid #3b4247', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.section>

      <motion.section 
        className="premium-project-list"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <div className="list-header">
          <h2>Proyectos Activos</h2>
        </div>
        
        {projects.length === 0 ? (
          <motion.div className="empty-state glass-panel" variants={itemVars}>
            <TrendingUp size={32} className="muted-icon" />
            <p>Crea el primer proyecto para iniciar el pipeline editorial.</p>
          </motion.div>
        ) : (
          <div className="list-grid">
            {projects.map((project) => {
              const progress = getPhaseProgress(project.currentPhase);
              
              return (
                <motion.div key={project.id} variants={itemVars}>
                  <Link className="premium-project-card glass-panel" to={`/projects/${project.id}`}>
                    <div className="card-top">
                      <div>
                        <strong className="project-name">{project.name}</strong>
                        <small className="project-idea line-clamp-1">{project.idea?.rawIdea || 'Idea pendiente'}</small>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', zIndex: 10, position: 'relative' }}>
                        <div className="status-pill">
                          <Clock size={12} />
                          <span>{project.currentPhase || 'Setup'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-bottom">
                      <div className="progress-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span className="progress-label">Progreso</span>
                          <span className="progress-percent">{progress}%</span>
                        </div>
                        <button 
                          className="btn btn-secondary icon-btn"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm(`¿Seguro que deseas eliminar el proyecto "${project.name}" por completo? Esta acción no se puede deshacer.`)) {
                              try {
                                await api.deleteProject(project.id);
                                if (refresh) refresh();
                              } catch (err) {
                                alert('Error al eliminar: ' + err);
                              }
                            }
                          }}
                          style={{ padding: '4px', height: 'auto', background: 'transparent', borderColor: 'transparent', color: '#ef4444', zIndex: 10, position: 'relative' }}
                          title="Eliminar proyecto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="progress-bar">
                        <motion.div 
                          className="progress-fill" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <div className="card-hover-action">
                      <span>Abrir</span>
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>
    </motion.main>
  );
}
