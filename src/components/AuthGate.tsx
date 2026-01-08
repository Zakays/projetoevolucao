export default function AuthGate({ children }: { children: any }) {
  // Auth removed — act as a pass-through so app routes remain accessible
  return <>{children}</>;
}
