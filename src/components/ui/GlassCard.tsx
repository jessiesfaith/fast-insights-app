import { CSSProperties, HTMLAttributes, forwardRef } from 'react';

type Variant = 'default' | 'nested' | 'strong';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  interactive?: boolean;
  active?: boolean;
  padding?: number | string;
  severity?: 'high' | 'medium' | 'low' | 'resolved';
  as?: keyof JSX.IntrinsicElements;
}

const variantClass: Record<Variant, string> = {
  default: 'glass',
  nested: 'glass-2',
  strong: 'glass-strong',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { variant = 'default', interactive, active, padding, severity, className, style, children, as = 'div', ...rest },
  ref,
) {
  const classes = [
    variantClass[variant],
    interactive ? 'is-interactive' : '',
    active ? 'accent-ring' : '',
    severity ? 'severity-strip' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const finalStyle: CSSProperties = {
    padding: padding ?? 'var(--card-padding)',
    ...(style ?? {}),
  };

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref as never} className={classes} style={finalStyle} data-severity={severity} {...rest}>
      {children}
    </Tag>
  );
});

export default GlassCard;
