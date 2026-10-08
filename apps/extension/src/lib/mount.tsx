import { type ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/assets/tailwind.css';

export function mount(node: ReactNode) {
  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(<StrictMode>{node}</StrictMode>);
}
