import { FC, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SimulationCardProps {
  icon: ReactNode;
  title: string;
  badge: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SimulationCard: FC<SimulationCardProps> = ({
  icon,
  title,
  badge,
  children,
  className,
}) => {
  return (
    <Card className={`border-border flex flex-col ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </CardTitle>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-1 flex flex-col space-y-3">
        {children}
      </CardContent>
    </Card>
  );
};
