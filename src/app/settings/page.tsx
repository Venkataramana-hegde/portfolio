import { SettingsWorkbench } from "@/components/ide/SettingsWorkbench";
import { pageMetadata } from "@/lib/meta";

export const metadata = pageMetadata("settings");

export default function SettingsPage() {
  return <SettingsWorkbench />;
}
