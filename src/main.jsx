import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AvatarProvider } from './context/AvatarContext.jsx';
import { ModeProvider } from './context/ModeContext.jsx';
import './styles.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <ModeProvider>
    <AvatarProvider>
      <App />
    </AvatarProvider>
  </ModeProvider>,
);
