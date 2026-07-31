import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ui, type Locale } from "@/lib/i18n";

export function AgentInfo({ locale }: { locale: Locale }) {
  const t = ui[locale].agentInfo;

  return (
    <Card className="mx-auto w-full max-w-[1600px]">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.intro}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2 text-sm">
          {t.points.map((point, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground select-none">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
