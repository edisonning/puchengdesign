import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  icon?: ReactNode;
  extra?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, icon, extra, className = '', children }: PanelProps) {
  return (
    <section className={`command-panel ${className}`} aria-label={title}>
      <header className="panel-heading">
        <span className="panel-icon" aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
        <span className="panel-rule" aria-hidden="true" />
        {extra && <div className="panel-extra">{extra}</div>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
