export const metadata = {
  title: "KTS Text Analyzer",
  description:
    "Map written text onto the Kinetic Thinking Styles framework by analysing linguistic markers of attitudes towards uncertainty and possibility.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
