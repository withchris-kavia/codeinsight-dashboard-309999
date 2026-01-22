import OAuthConnectionsPanel from "@/components/integrations/OAuthConnectionsPanel";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">
          Manage integrations and preferences.
        </p>
      </header>

      <OAuthConnectionsPanel />

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Other settings will go here.
      </section>
    </div>
  );
}
