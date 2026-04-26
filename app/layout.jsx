export const metadata = {
  title: "Rabbit Hole",
  description: "How deep does it go?",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#06050c" }}>
        {children}
      </body>
    </html>
  );
}
