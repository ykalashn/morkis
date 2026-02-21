export default function AppPage() {
  return (
    <main className="h-screen w-full overflow-hidden bg-white">
      <iframe
        src="/app-static.html"
        title="Morkis app prototype"
        className="h-full w-full border-0"
      />
    </main>
  );
}
