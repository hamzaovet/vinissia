// Standalone layout — no store Navbar/Footer/Cart
// Used by: /login, /pos, /admin, /driver
export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
