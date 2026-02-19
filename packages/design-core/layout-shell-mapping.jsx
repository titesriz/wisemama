import tokens from './design-core.json';
import LayoutShell from '../../src/components/LayoutShell.jsx';

export function ExampleLayoutMapping({ avatarNode, children, stepLabel, onPrev, onNext }) {
  return (
    <LayoutShell
      headerLeft={<button className="wm-btn wm-btn-ghost">文</button>}
      headerTitle="WiseMama"
      headerSubtitle="Daily flow"
      headerRight={avatarNode}
      actionCenter={<span>{stepLabel}</span>}
      onPrev={onPrev}
      onNext={onNext}
      prevLabel="◄ Prec"
      nextLabel="Suiv ►"
    >
      {children}
    </LayoutShell>
  );
}

export const buttonTokenMap = {
  primary: {
    background: tokens.color.primary,
    radius: tokens.radius.md,
    shadow: tokens.shadow.buttonPrimary,
  },
  secondary: {
    borderColor: tokens.color.accent,
    radius: tokens.radius.sm,
    shadow: tokens.shadow.button,
  },
};

export const cardTokenMap = {
  surface: tokens.color.surface,
  text: tokens.color.textMain,
  radius: tokens.radius.lg,
  shadow: tokens.shadow.card,
};
