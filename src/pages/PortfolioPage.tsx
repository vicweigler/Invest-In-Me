import React from 'react';
import Portfolio from '../components/Portfolio/Portfolio';
import { APP_VERSION } from '../version';

export default function PortfolioPage() {
  return (
    <>
      <Portfolio />
      <div className="pb-4 text-center">
        <p className="text-slate-700 text-xs">Invest-In-It v{APP_VERSION}</p>
      </div>
    </>
  );
}
