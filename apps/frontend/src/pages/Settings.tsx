import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

type ProviderCard = {
  provider: string;
  label: string;
  type: 'text' | 'image' | 'router';
  configured: boolean;
  usableByTextEngine: boolean;
  model?: string;
  role: string;
  status: string;
  capabilities: string[];
};

type SmokeResult = {
  provider: string;
  label: string;
  status: string;
  ok: boolean;
  model?: string;
  latencyMs?: number;
};

function asProviders(data: Record<string, unknown> | null) {
  const providers = data?.providers;
  return Array.isArray(providers) ? providers as ProviderCard[] : [];
}

function asSmokeResults(data: Record<string, unknown> | null) {
  const results = data?.results;
  return Array.isArray(results) ? results as SmokeResult[] : [];
}

function statusLabel(configured: boolean, smoke?: SmokeResult) {
  if (smoke) return smoke.ok ? 'Listo' : smoke.status;
  return configured ? 'Configurado' : 'No configurado';
}

export function Settings() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [providers, setProviders] = useState<Record<string, unknown> | null>(null);
  const [smoke, setSmoke] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupDone, setBackupDone] = useState(false);

  async function refresh() {
    const [nextStatus, nextProviders] = await Promise.all([api.settingsStatus(), api.aiProviders()]);
    setStatus(nextStatus);
    setProviders(nextProviders);
  }

  async function runSmokeTest() {
    setLoading(true);
    try {
      setSmoke(await api.aiSmokeTest());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const providerCards = asProviders(providers);
  const smokeResults = asSmokeResults(smoke);
  const smokeByProvider = useMemo(
    () => Object.fromEntries(smokeResults.map((item) => [item.provider, item])),
    [smokeResults],
  );
  const textReady = providerCards.filter((provider) => provider.usableByTextEngine && provider.configured).length;
  const imageReady = providerCards.filter((provider) => provider.type === 'image' && provider.configured).length;
  const activeChain = Array.isArray(providers?.defaultChain) ? providers.defaultChain.join(' -> ') : 'auto';

  return (
    <main className="page standalone">
      <header className="topbar">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>Centro de Control IA</h1>
        </div>
        <button className="button" onClick={refresh}>Actualizar estado</button>
      </header>

      <section className="aiHero">
        <div>
          <span>Modo activo</span>
          <strong>{String(providers?.mode || 'auto')}</strong>
          <p>Cervantes decide qué motor usar según investigación, escritura, auditoría, ritmo y diseño visual.</p>
        </div>
        <div>
          <span>Motores de texto</span>
          <strong>{textReady}</strong>
          <p>Disponibles para producir y revisar contenido editorial.</p>
        </div>
        <div>
          <span>Motores visuales</span>
          <strong>{imageReady}</strong>
          <p>Detectados para futuras variantes gráficas premium.</p>
        </div>
      </section>

      <section className="nextActionPanel">
        <div>
          <p className="eyebrow">Acción recomendada</p>
          <h2>Probar motores IA</h2>
          <p>La app verificará qué proveedores responden ahora y usará esa información para elegir mejor sin mostrar claves secretas.</p>
        </div>
        <div className="nextActionButtons">
          <button className="button primary" onClick={runSmokeTest} disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Probando...' : 'Probar motores IA'}
          </button>
          <button
            className="button"
            onClick={async () => {
              await api.backupWorkspace();
              setBackupDone(true);
              await refresh();
            }}
          >
            Crear backup
          </button>
        </div>
      </section>

      {backupDone ? <div className="nextStepBanner">Backup del workspace creado correctamente.</div> : null}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Orden editorial automático</h2>
            <p className="muted">Cadena base: {activeChain}</p>
          </div>
        </div>
        <div className="aiTaskGrid">
          {Object.entries((providers?.taskRoutes || {}) as Record<string, string[]>).map(([task, chain]) => (
            <div key={task}>
              <span>{task}</span>
              <strong>{chain.join(' -> ')}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Proveedores detectados</h2>
            <p className="muted">Las claves se leen desde .env y nunca se muestran en pantalla.</p>
          </div>
        </div>
        <div className="aiProviderGrid">
          {providerCards.map((provider) => {
            const smokeResult = smokeByProvider[provider.provider];
            const state = statusLabel(provider.configured, smokeResult);
            return (
              <article className={`aiProviderCard ${provider.configured ? 'configured' : ''} ${smokeResult?.ok ? 'ready' : ''}`} key={provider.provider}>
                <div className="aiProviderHeader">
                  <div>
                    <span>{provider.type === 'image' ? 'Visual' : provider.type === 'router' ? 'Router' : 'Texto'}</span>
                    <h3>{provider.label}</h3>
                  </div>
                  <strong>{state}</strong>
                </div>
                <p>{provider.role}</p>
                {provider.model ? <small>Modelo: {provider.model}</small> : null}
                {smokeResult?.latencyMs ? <small>Respuesta: {smokeResult.latencyMs} ms</small> : null}
                <div className="aiCapabilityRow">
                  {provider.capabilities.map((capability) => <span key={capability}>{capability}</span>)}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <details className="technicalDetails">
          <summary>Ver diagnóstico técnico completo</summary>
          <pre>{JSON.stringify({ status, providers, smoke }, null, 2)}</pre>
        </details>
      </section>
    </main>
  );
}
