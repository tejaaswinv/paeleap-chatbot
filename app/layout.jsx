import "./globals.css";
import "./china-theme.css";
import "./china-3d.css";
import "./imperial-tourmate.css";
import "./tourmate-polish.css";
import "./smart-trip-planner.css";

export const metadata = {
  title: "Paeleap TourMate",
  description: "Plan memorable journeys across China with TourMate, your bilingual AI travel companion.",
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
