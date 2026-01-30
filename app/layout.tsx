// Minimal root layout - each route group has its own html/body
// This is required for Next.js but actual layouts are in route groups
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
