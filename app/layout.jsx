import "./globals.css";
import "./china-theme.css";
import "./china-3d.css";
import "./imperial-tourmate.css";
import "./tourmate-polish.css";

export const metadata = {
  title: "Paeleap TourMate",
  description: "Explore China with TourMate: your bilingual AI travel companion for unforgettable journeys.",
  applicationName: "Paeleap TourMate"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#67120f"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
